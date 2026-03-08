#!/usr/bin/env bash
# Stop hook: completion sound
/usr/bin/afplay /System/Library/Sounds/Glass.aiff 2>/dev/null || /usr/bin/osascript -e 'beep 1'

