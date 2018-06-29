# ESO-C Bot (Node.js)

# Development
[Click here](https://discordapp.com/oauth2/authorize?client_id=460387987629277195&scope=bot) to add the bot to your personal server. Don't forget to enter your channels' ids in `.env`.

Add a file `.env` and do NOT commit it. Here we fill in secret credentials and values that can be different depending on environment.
```
DB_HOST=databaseHostname
DB_USER=databaseUsername
DB_PASSWORD=databasePassword
DISCORD_TOKEN=discordToken
DISCORD_CHANNEL_ID_GENERAL=460187255571480586
DISCORD_CHANNEL_ID_EP=460187200609583105
DISCORD_CHANNEL_ID_TWITCH=460187136281411585
```

# Deployment

## requirements
- nodejs >= 8
- npm >= 5
- Production will need a few different values, channel ids and db credentials. Either:
  - Set environment variables corresponding to the .env keys or
  - Add an uncommitted .env file to the server

## Start the app
- `$ npm install`
- `$ npm start`
