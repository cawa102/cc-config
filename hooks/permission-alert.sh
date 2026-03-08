#!/usr/bin/env bash
# Permission prompt: attention-grabbing sound
/usr/bin/afplay /System/Library/Sounds/Funk.aiff 2>/dev/null || /usr/bin/osascript -e 'beep 2'

