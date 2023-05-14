# Neoclassic Wallet
[![Get Support at https://discord.gg/ms6eagX](https://img.shields.io/badge/join-discord-blue.svg)](https://discord.gg/ms6eagX)

Neoclassic is the next version of Signum Classic Wallet. It aims to be as complete as possible and easy to maintain.

## How to use
* Use latest version at [deleterium.info](https://deleterium.info/neoclassic).

OR 

* If you run a Signum node, you can extract the files on the latest release to a new folder `signum-node/html/ui/neoclassic` and then point your browser to http://localhost:8125/neoclassic/

OR

* If you run a node, it is also possible to overwrite files from Classic Wallet at folder `signum-node/html/ui/classic` with the ones included in the latest release.

OR if you are a programmer

1) Clone this repository to your machine
2) Install node dependencies: `npm install`
3) Build the project: `npm run release`
3) Start the server when you want to use: `npm start`
4) Point your browser to `http://localhost:1221`

## Security advice
- Transactions are signed on browser, no passphrase transmitted to servers.
- Use a password manager integrated with your browser to speed up login. Classic does not store the passphrase on disc, just in memory and if selected "Remember passphrase on this session".
