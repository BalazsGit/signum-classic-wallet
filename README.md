# Neoclassic Wallet
[![Get Support at https://discord.gg/ms6eagX](https://img.shields.io/badge/join-discord-blue.svg)](https://discord.gg/ms6eagX)

Neoclassic is the next version of Signum Classic Wallet. It aims to be as complete as possible and easy to maintain.

## How to use

* Use latest version at [deleterium.info](https://deleterium.info/neoclassic). Remember to refresh browser cache reloading the page with Ctrl + F5.

OR
1) Clone this repository to your machine
2) Install node dependencies: `npm install`
3) Build the project: `npm run build-all`
3) Start the server when you want to use: `npm start`
4) Point your browser to `http://localhost:1221`

## Security advice
- Transactions are signed on browser, no passphrase transmitted to servers.
- Use a password manager integrated with your browser to speed up login. Classic does not store the passphrase on disc, just in memory and if selected "Remember passphrase on this session".
