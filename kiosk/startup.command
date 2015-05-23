#!/bin/bash

# Starts basic webserver and opens in Chrome with Stele.  Meant
# to run on startup.

SCRIPT_DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd );
cd SCRIPT_DIR;

# Run server
forever start --uid "kittenbusserver" -a -c http-server ./ -p 8080;

# Open in browser
python kiosk/stele/browser.py;

# Applescript to force focus and move to extra display
osascript kiosk/position.applescript
