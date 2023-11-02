# rookBot
A Javascript Bot for personal usage, written using Node.js

## Setting up
1. Clone the repo: ``git clone --recursive https://github.com/mysterypaint/rookBot``
2. Install [Node.js: https://nodejs.org/](https://nodejs.org/)
     * During installation setup, ensure you check "Automatically install the necessary tools."
3. Install nodemon: ``npm install -D nodemon``
4. Create a copy of ``.env_template`` and fill out all of your variables on each line. Rename your copied file to ``.env``, exactly as typed here.
5. Finally, execute ``launch.bat`` to start the server.
     * You can stop hosting using ``Ctrl + C`` on the command line window.

## Updating
1. Ensure that you have a backup of your ``.env`` file.
2. Clone (or ``git pull``) the latest version of the ``main`` branch of this repo.
3. Copy your ``.env`` file to the root directory of the updated repo, if it isn't already there.
4. Execute ``launch.bat`` to re-host with the updated code.

## License
[MIT](https://choosealicense.com/licenses/mit/)