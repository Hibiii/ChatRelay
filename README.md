# ChatRelay

A basic web thing for relaying Minecraft chat without operator privileges.
ChatRelay is currently at basic levels of usability.

## Usage

Simply run with node: `node chatrelay.js`. Additionally, you will need to install minecraft-protocol: `npm install minecraft-protocol`.

**Please note:** to snoop on online-mode servers (which require a Minecraft license), you'll need to add your credentials to ChatRelay.
You cannot play on a single server with the same account connected twice.
Additionally, to use the same account on a different server, you'll need to do so *after* running ChatRelay, and you may need to reload the launcher every time ChatRelay reconnects.
