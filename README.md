# kittenbus

:bus:!

## Installation

These instructions are intended for a Mac.

1. System configuration
    * Create a new user
    * Setup that user to login automatically on startup
    * (...)
    * Login/restart as your new user.
1. Get code: ``
1. Install dependencies:
    * `brew install chromedriver node`
    * `pip install selenium`
    * `npm install http-server forever -g`
1. Install Stele
    * Get code: `mkdir kiosk && git clone https://github.com/scimusmn/stele.git kiosk/stele`
    * Link configuration: `ln -s ../../browser.cfg kiosk/stele/cfg/browser.cfg`
* Install [Slate](https://github.com/jigish/slate#installing-slate)
    * Turn on the Accessibility API.
    * `cd /Applications && curl http://www.ninjamonkeysoftware.com/slate/versions/slate-latest.tar.gz | tar -xz; cd -;`
    * Link configuration: `ln -s $(pwd)/kiosk/.slate ~/.slate`
1. Run on startup
    * Go to System Preferences > Users
    * Select the Login Items for your User
    * Add the `kiosk/start.command`
    * Add Slate


## Notes

* [Chrome flags](http://peter.sh/experiments/chromium-command-line-switches/?date=2015-05-14)
