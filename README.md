# What is this project ? 
This project is an adaptation for BoardGameArena of game Splendor Duel edited by Space Cowboys.
You can play here : https://boardgamearena.com

# How to install the auto-build stack

## Install builders
Intall node/npm then `npm i` on the root folder to get builders.

## Auto build JS and CSS files
In VS Code, add extension https://marketplace.visualstudio.com/items?itemName=emeraldwalk.RunOnSave and then add to config.json extension part :
```json
        "commands": [
            {
                "match": ".*\\.ts$",
                "isAsync": true,
                "cmd": "npm run build:ts"
            },
            {
                "match": ".*\\.scss$",
                "isAsync": true,
                "cmd": "npm run build:scss"
            }
        ]
    }
```
If you use it for another game, replace `splendorduel` mentions on package.json `build:scss` script and on tsconfig.json `files` property.

## Auto-upload builded files
Also add one auto-FTP upload extension (for example https://marketplace.visualstudio.com/items?itemName=lukasz-wronski.ftp-sync) and configure it. The extension will detected modified files in the workspace, including builded ones, and upload them to remote server.

## Hint
Make sure ftp-sync.json and node_modules are in .gitignore

# Rules, confirmed by the publisher
The empty space left buy a card is refilled only at the end of the turn.
When a player must refill, we only change the title on his side, not on everyone side (so the opponent doesn't know if he must refill or if he can play a secret reserved card)
If there's only one possibility to pay, we preselect, but we let the user confirm.

In case of blocking by keeping 3 golds and 2 pearls :
if player A have 3 golds and 2 pearls at the beginning of his turn 3 times in a row, display
"Blocking play by retaining all pearl and gold tokens is an anti-playing practice. Please buy a card to unblock the situation."
if player A doesn't buy a card, then player B got this message
"Blocking play by retaining all pearl and gold tokens is an anti-playing practice. You can [end the game (win immediately)] and it will be considered as a victory for you."
with a End game (win) button for player B
If player A doesn't buy a card but give back a pearl (10 tokens limit), the anti-playing is also over as if he bought a card