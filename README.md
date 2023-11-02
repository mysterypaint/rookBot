# rookBot
A Javascript Bot for personal usage, written using Node.js

## Setting up
1. Clone the repo: ``git clone --recursive https://github.com/mysterypaint/rookBot``
2. Navigate to the repo's root directory: ``cd rookBot``
3. Install [Node.js: https://nodejs.org/](https://nodejs.org/)
     * During installation setup, ensure you check "Automatically install the necessary tools."
4. While still in the repo's root directory, install nodemon: ``npm install -D nodemon``
5. Install Rest: ``npm install -g rest``
6. Create a copy of ``.env_template`` and fill out all of your variables on each line. Rename your copied file to ``.env``, exactly as typed here.
7. Finally, execute ``launch.bat`` to start the server.
     * You can stop hosting by pressing ``Ctrl + C`` twice in the command line window.

## Updating
1. Ensure that you have a backup of your ``.env`` file.
2. Clone (or ``git pull``) the latest version of the ``main`` branch of this repo.
3. Copy your ``.env`` file to the root directory of the updated repo, if it isn't already there.
4. Execute ``launch.bat`` to re-host with the updated code.
     * Alternatively, you can execute ``npm run start:dev`` or ``node ./src/index.js`` from Terminal/CLI.
     * ``npm run start:dev`` and ``launch.bat`` will automatically re-launch the bot if the code is updated in realtime.

## Troubleshooting
**DiscordAPIError[50001]: Missing Access**
* Your guild permissions in ``.env`` are wrong, and you might even have the wrong ``GUILD_ID``. This could occur after switching ``.env`` keys and/or swapping bots.
    * You can adjust this via a text editor.
* Alternatively, you could try reinstalling Rest.

## License
[MIT](https://choosealicense.com/licenses/mit/)