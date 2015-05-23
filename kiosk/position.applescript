-- Applescript to focus on browser and push to the extra display
-- using a Slate key binding

-- Wait a moment to make sure the application has started
delay 5.0

-- Focus on browser
tell application "Google Chrome" to activate

-- Not sure if necessary
delay 1.0

-- Make key combinations.  This did not work with a command like:
-- keystroke "1" using command down
tell application "System Events"
  key down {command}
  key code 18
  key up {command}
end tell
