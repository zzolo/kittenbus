# kittenbus

:bus:!

## About stop

* Bus stop ID: `17946`
* [NexTrip link](http://www.metrotransit.org/NexTripBadge.aspx?stopnumber=17946)

## Installation

We want to have this project be in "kiosk".  These instructions are intended for a Mac which does not have a "kiosk" mode.

1. System configuration
    * Create a new user
    * Setup that user to login automatically on startup
    * Login/restart as your new user
    * Setup wifi or other internet connection
    * Update system software, then turn off automatic updates
    * Turn off screen saver
    * Set background to black
    * Hide dock
    * Turn off location services (this uses bandwidth)
    * Disable remote receiver
    * Make sure the computer and display does not sleep
    * Turn off "Put harddrive to sleep"
    * Turn off "Allow power button to computer to sleep"
    * Turn on "Start up automatically after a power failure"
    * Turn on "Restart automatically if the computer freezes"
1. If you are using an external display, like a TV or projector.
    * Go to Display Preferences.  Arrange it so the external display, where the project will be displayed on, is to the left of the main display.
1. Install applications
    * Google Chrome
    * LogMeIn (requires some set up, and is only a trial)
        * TeamViewer is free for personal use but uses much more bandwidth if that is a concern.
1. Install [Homebrew](http://brew.sh/)
    * Will require installing XCode Command Line tools
1. Install dependencies:
    * `brew install chromedriver node git`
    * `sudo easy_install pip && sudo pip install selenium`
    * `npm install http-server forever -g`
1. Get code: `git clone https://github.com/zzolo/kittenbus.git && cd kittenbus`
1. Install [Stele](https://github.com/scimusmn/stele).  The placement of Stele matters.
    * Get code: `git clone https://github.com/scimusmn/stele.git kiosk/stele`
    * Link configuration: `ln -s ../../browser.cfg kiosk/stele/cfg/browser.cfg`
* Install [Slate](https://github.com/jigish/slate#installing-slate)
    * Turn on the Accessibility API (done above).
    * `cd /Applications && curl http://www.ninjamonkeysoftware.com/slate/versions/slate-latest.tar.gz | tar -xz; cd -;`
    * Link configuration: `ln -s $(pwd)/kiosk/.slate ~/.slate`
1. Install cron file which is mainly used to restart each night.
    * `crontab kiosk/kittenbus.cron`
1. Run on startup
    * Go to System Preferences > Users
    * Select the Login Items for your User
    * Add the `kiosk/start.command`
    * Add Slate (this is also an option in the application itself)

## Notes

* [Chrome flags](http://peter.sh/experiments/chromium-command-line-switches/?date=2015-05-14)

## Licensing

* Transit map, copyright Kyril Negoda.  No use without permission.
* Animals logos, copyright Juxtaposition Arts apprenticies.  No use without permission.
* Other code, copyright Alan Palazzolo and contributors.  Licensed under MIT license.
