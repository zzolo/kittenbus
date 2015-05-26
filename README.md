# kittenbus

:bus:!

## About stop

* Bus stop ID: `17946`
* [NexTrip link](http://www.metrotransit.org/NexTripBadge.aspx?stopnumber=17946)

## Installation

We want to have this project be in a "kiosk".  These instructions are intended for a Mac.

1. System configuration
    * Create a new user
    * Setup that user to login automatically on startup
    * (...)
    * Login/restart as your new user.
1. If you are using an external display, like a TV or projector.
    * Go to Display Preferences.  Arrange it so the external display, where the project will be displayed on, is to the left of the main display.
1. Get code: `git clone https://github.com/zzolo/kittenbus.git && cd kittenbus`
1. Install dependencies:
    * `brew install chromedriver node`
    * `pip install selenium`
    * `npm install http-server forever -g`
1. Install [Stele](https://github.com/scimusmn/stele).  The placement of Stele matters.
    * Get code: `mkdir kiosk && git clone https://github.com/scimusmn/stele.git kiosk/stele`
    * Link configuration: `ln -s ../../browser.cfg kiosk/stele/cfg/browser.cfg`
* Install [Slate](https://github.com/jigish/slate#installing-slate)
    * Turn on the Accessibility API.
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
