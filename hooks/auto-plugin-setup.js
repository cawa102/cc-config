const fs = require('fs');
const path = require('path');

const cwd = process.cwd();
const developmentBase = '/Users/kawaikyousuke/Claude Code/development';

// Check if current directory is under development/
if (cwd.startsWith(developmentBase) && cwd !== developmentBase) {
  const claudeDir = path.join(cwd, '.claude');
  const settingsFile = path.join(claudeDir, 'settings.local.json');
  
  // Only create if settings.local.json doesn't exist
  if (!fs.existsSync(settingsFile)) {
    // Create .claude directory if needed
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }
    
    const settings = {
      enabledPlugins: {
        "everything-claude-code@everything-claude-code": true
      },
      extraKnownMarketplaces: {
        "everything-claude-code": {
          source: { source: "github", repo: "affaan-m/everything-claude-code" }
        }
      }
    };
    
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2) + '\n');
    console.error('[Hook] Auto-configured everything-claude-code plugin for this project');
  }
}
