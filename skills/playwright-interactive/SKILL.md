---
name: "playwright-interactive"
description: "Iterative browser and Electron interaction through Node.js scripts for UI debugging, functional QA, and visual QA. Use when the user needs to interactively test, debug, or validate a web app or Electron app's UI — including layout checks, responsive testing, screenshot-based visual review, or exploratory QA. Trigger on phrases like 'debug the UI', 'check the layout', 'visual QA', 'test the Electron app', 'verify the responsive design', or any iterative browser-based debugging workflow."
---

# Playwright Interactive Skill

Use Playwright via Node.js scripts to iteratively debug local web or Electron apps. Each script launches a browser, performs actions, captures screenshots to disk, and cleans up. Iterate by editing and re-running the script.

## Preconditions

- Node.js must be available in the environment.
- Playwright must be installed in the target project.
- Run setup from the same project directory you need to debug.

## One-time Setup

```bash
test -f package.json || npm init -y
npm install playwright
# Web-only: npx playwright install chromium
# Electron-only: npm install --save-dev electron
node -e "import('playwright').then(() => console.log('playwright import ok')).catch((e) => { console.error(e); process.exit(1); })"
```

## Script-Based Workflow

Claude Code does not have a persistent REPL. Instead, write a `.mjs` script that bootstraps Playwright, performs all actions, saves screenshots to disk, and cleans up — all in one file. Run it with the Bash tool. Iterate by editing the script and re-running.

### Headless vs Headed Mode

- Use `headless: true` (default) for CI-like environments and when you only need screenshots for review.
- Use `headless: false` when the user wants to watch the browser interact, or when debugging visual issues that require seeing real-time rendering (e.g., animations, hover states).
- Claude Code's Read tool can display saved JPEG/PNG screenshots as images — this is the primary way to review visual output.

### Base Script Template

All session types share this structure. Adapt the context creation for desktop, mobile, native-window, or Electron:

```javascript
// _pw-session.mjs
import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const browser = await chromium.launch({ headless: true });
try {
  // --- Create context (see variants below) ---
  const context = await browser.newContext({
    viewport: { width: 1600, height: 900 },
  });
  const page = await context.newPage();

  const TARGET_URL = 'http://127.0.0.1:3000';
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded' });
  console.log('Loaded:', await page.title());

  // --- QA actions here ---

  // --- Screenshot ---
  await saveScreenshot(page, '_pw-screenshot.jpg');

  await context.close();
} finally {
  await browser.close();
  console.log('Browser closed');
}

// --- Helpers (include as needed) ---
async function saveScreenshot(surface, filename, options = {}) {
  const bytes = await surface.screenshot({ type: 'jpeg', quality: 85, scale: 'css', ...options });
  writeFileSync(filename, bytes);
  console.log(`Screenshot saved: ${filename}`);
}
```

### Context Variants

**Mobile web** — replace the context creation block:

```javascript
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
```

**Native-window web** — for validating launched window size and OS-level DPI behavior:

```javascript
const context = await browser.newContext({ viewport: null });
```

**Electron** — use a different import and launch:

```javascript
import { _electron as electronLauncher } from 'playwright';
import { writeFileSync } from 'fs';

const electronApp = await electronLauncher.launch({ args: ['.'] });
try {
  const appWindow = await electronApp.firstWindow();
  console.log('Loaded Electron:', await appWindow.title());

  // --- QA actions ---

  await saveScreenshot(appWindow, '_pw-electron.jpg');
} finally {
  await electronApp.close();
  console.log('Electron closed');
}
```

If the Electron renderer depends on a separate dev server (e.g., Vite), start it first using the Bash tool with `run_in_background`.

## Coordinate Interaction Helpers

Include these in scripts that need screenshot → click workflows:

```javascript
async function clickCssPoint({ surface, x, y, clip }) {
  await surface.mouse.click(
    clip ? clip.x + x : x,
    clip ? clip.y + y : y
  );
}

async function tapCssPoint({ page, x, y, clip }) {
  await page.touchscreen.tap(
    clip ? clip.x + x : x,
    clip ? clip.y + y : y
  );
}
```

When working with clipped screenshots, the returned `{ x, y }` coordinates are relative to the clip region. Add the clip origin back when clicking:

```javascript
// Clipped screenshot + click
const clip = await page.evaluate(() => {
  const rect = document.querySelector('#panel').getBoundingClientRect();
  return { x: Math.round(rect.x), y: Math.round(rect.y), width: Math.round(rect.width), height: Math.round(rect.height) };
});
await saveScreenshot(page, '_pw-clip.jpg', { clip });
// Later, click at (x, y) within that clip region:
await clickCssPoint({ surface: page, clip, x: 50, y: 30 });
```

For full-viewport screenshots, use returned `{ x, y }` directly without clip offset.

## CSS Normalization

In native-window mode on macOS Retina displays, `scale: "css"` may still return device-pixel-size output. Use canvas-based normalization:

```javascript
async function saveNormalizedScreenshot(page, filename, clip, quality = 0.85) {
  const target = clip
    ? { width: clip.width, height: clip.height }
    : await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight }));

  const screenshotBuffer = await page.screenshot({ type: 'png', ...(clip ? { clip } : {}) });

  const bytes = await page.evaluate(
    async ({ imageBase64, targetWidth, targetHeight, quality }) => {
      const image = new Image();
      image.src = `data:image/png;base64,${imageBase64}`;
      await image.decode();
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(image, 0, 0, targetWidth, targetHeight);
      const blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality));
      return [...new Uint8Array(await blob.arrayBuffer())];
    },
    { imageBase64: Buffer.from(screenshotBuffer).toString('base64'), targetWidth: target.width, targetHeight: target.height, quality }
  );
  writeFileSync(filename, Buffer.from(bytes));
  console.log(`Normalized screenshot saved: ${filename}`);
}
```

For Electron, do not use `appWindow.context().newPage()` as a scratch page — Electron contexts do not support it. Instead, normalize in the main process:

```javascript
async function saveElectronNormalizedScreenshot(electronApp, filename, clip, quality = 85) {
  const bytes = await electronApp.evaluate(async ({ BrowserWindow }, { clip, quality }) => {
    const win = BrowserWindow.getAllWindows()[0];
    const image = clip ? await win.capturePage(clip) : await win.capturePage();
    const target = clip ? { width: clip.width, height: clip.height } : (() => { const [w, h] = win.getContentSize(); return { width: w, height: h }; })();
    return [...image.resize({ width: target.width, height: target.height, quality: 'best' }).toJPEG(quality)];
  }, { clip, quality });
  writeFileSync(filename, Buffer.from(bytes));
  console.log(`Electron normalized screenshot saved: ${filename}`);
}
```

## Core Workflow

1. Write a brief QA inventory before testing:
   - Build from three sources: user's requested requirements, implemented features/behaviors, and claims you expect to make in the final response.
   - Map each to at least one QA check. For each claim or control-state pair, note the functional check, the visual check state, and the evidence to capture.
   - If a requirement is visually central but subjective, convert it into an observable check.
   - Add at least 2 exploratory or off-happy-path scenarios.
2. Write and run the script.
3. Start any required dev server (Bash tool with `run_in_background`). Verify the port is listening before `page.goto(...)`.
4. Iterate by editing the script — reload for renderer changes, relaunch for main-process changes.
5. Run functional QA with Playwright input APIs.
6. Run a separate visual QA pass.
7. Verify viewport fit.
8. Clean up.

## Choose Session Mode

- **Explicit viewport** (default): Stable, reproducible, machine-independent. Use for routine iteration, breakpoint checks, and screenshot-based QA.
- **Native-window** (`viewport: null`): Use to validate launched window size, OS DPI behavior, or bugs that depend on host display. Treat as a separate pass — do not reuse a viewport-emulated context.
- **Electron**: Always native-window behavior. Check as-launched size and layout before resizing.
- If signoff depends on both, do explicit viewport first, then native-window.

## Iteration Pattern

1. **Initial script**: Full script with bootstrap + first QA pass.
2. **Edit and re-run**: After code changes, edit the script and re-run. Use `page.reload()` for renderer-only changes.
3. **Phase comments**: Comment in/out sections to focus on current phase:

```javascript
// --- Phase 1: Setup (always) ---
// --- Phase 2: Functional QA (comment out after passing) ---
// --- Phase 3: Visual QA (current focus) ---
```

4. **Cleanup**: Always in `finally` block to avoid orphaned browser processes.

## Viewport Fit Checks (Required)

Before signoff, verify the intended initial view matches the product requirement using both screenshots and numeric checks.

- Define the intended initial view. For scrollable pages, this is above-the-fold. For app-like shells, this is the full interactive surface plus controls.
- Screenshots are primary evidence. Numeric checks support them but do not overrule visible clipping.
- Signoff fails if any required visible region is clipped, cut off, or pushed outside the viewport, even if page-level scroll metrics appear acceptable.
- Scrolling is acceptable only when the product is designed to scroll and the initial view still communicates the core experience.
- For fixed-shell interfaces (games, editors, dashboards), scrolling is not an acceptable workaround for reaching the primary interactive surface.
- Do not rely on document scroll metrics alone. Fixed-height shells and hidden-overflow containers can clip required UI while page-level scroll checks look clean.
- Check region bounds, not just document bounds — verify each required visible region fits within the viewport.
- For Electron, verify both the launched window size/placement and the renderer's initial visible layout before any manual resize.

```javascript
const viewportInfo = await page.evaluate(() => ({
  innerWidth: window.innerWidth, innerHeight: window.innerHeight,
  clientWidth: document.documentElement.clientWidth, clientHeight: document.documentElement.clientHeight,
  scrollWidth: document.documentElement.scrollWidth, scrollHeight: document.documentElement.scrollHeight,
  canScrollX: document.documentElement.scrollWidth > document.documentElement.clientWidth,
  canScrollY: document.documentElement.scrollHeight > document.documentElement.clientHeight,
}));
console.log('Viewport info:', JSON.stringify(viewportInfo, null, 2));
```

Augment with `getBoundingClientRect()` checks for required visible regions when clipping is a realistic failure mode.

## Checklists

### Functional QA

- Use real user controls: keyboard, mouse, click, touch via Playwright input APIs.
- Verify at least one end-to-end critical flow and confirm visible results, not just internal state.
- Work through the shared QA inventory. Cover every obvious visible control at least once.
- For stateful toggles, test the full cycle: initial → changed → initial.
- After scripted checks, do a short exploratory pass (30-90s) using normal input.
- `page.evaluate(...)` may inspect state but does not count as signoff input.

### Visual QA

- Treat as separate from functional QA. Use the same shared QA inventory.
- Restate user-visible claims and verify each in the specific state where it matters.
- Inspect the initial viewport before scrolling. Confirm it supports the interface's primary claims.
- Inspect all required visible regions, states, and modes from the inventory.
- If motion/transitions are part of the experience, inspect at least one in-transition state.
- If labels/overlays track changing content, verify after the relevant state change.
- For dense interfaces, inspect the densest realistic state, not only empty/collapsed.
- If a minimum supported viewport exists, run a separate visual QA pass there.
- Distinguish presence from implementation: an affordance that exists but is imperceptible (weak contrast, occlusion, clipping) is a visual failure.
- Look for: clipping, overflow, distortion, layout imbalance, inconsistent spacing, alignment, illegible text, weak contrast, broken layering, awkward motion.
- Judge aesthetic quality as well as correctness.
- Prefer viewport screenshots for signoff. Use full-page captures only as debugging artifacts.
- If motion makes a screenshot ambiguous, add a delay before capturing.
- Before signoff: what visible part have I not yet inspected? What defect would most embarrass this result?

### Signoff

- Functional path passed with normal user input.
- Coverage is explicit against the shared QA inventory.
- Visual QA covered the whole relevant interface. Each user-visible claim has a matching screenshot.
- Viewport-fit checks passed for the intended initial view and any minimum supported viewport.
- If the product launches in a window, the as-launched size, placement, and initial layout were checked.
- The UI is visually coherent and not aesthetically weak.
- Functional correctness, viewport fit, and visual quality each pass independently.
- A short exploratory pass was completed for interactive products.
- If screenshot review and numeric checks disagreed, the discrepancy was investigated.
- Include brief negative confirmation of defect classes checked and not found.
- Cleanup was executed (browser processes closed).

## Common Failure Modes

- `Cannot find module 'playwright'`: run setup in the current workspace first.
- Browser executable missing: run `npx playwright install chromium`.
- `net::ERR_CONNECTION_REFUSED`: dev server not running, wrong port, or use `http://127.0.0.1:<port>`.
- `electron.launch` hangs or exits: verify the `electron` dependency, confirm `args`, ensure any renderer dev server is running first.
- `browserContext.newPage: Protocol error (Target.createTarget): Not supported` in Electron: do not use `appWindow.context().newPage()` — use the Electron-specific screenshot normalization flow.
- Orphaned browser processes: always use `try/finally` for cleanup.

## Cleanup Files

After debugging is complete, remove temporary files:

```bash
rm -f _pw-session.mjs _pw-desktop.mjs _pw-mobile.mjs _pw-native.mjs _pw-electron.mjs
rm -f _pw-*.jpg
```
