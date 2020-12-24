# SpotifyVsTheWorld

This is like Twitch/Youtube live viewer count, but for Spotify/Apple Music. Available for MacOS

Server repo: https://github.com/VVNoodle/SpotifyVsTheWorld-server

## How to Use?

**P.S This is still a work in progress and is not downloadable. star/watch this repo for updates.**

1. Download and install the app
2. open the app. Make sure you have the following:
   - good amount of space in your status bar
   - internet connection
3. listen to spotify/apple music. View the live counter over the statusbar

## How Does it work?

![SpotifyVsTheWorld](https://i.ibb.co/Sr8R1XY/Spotify-Vs-The-World.png)

1. Client establishes a websocket connection to Fanout Cloud, a publish/subscribe proxy
2. Fanout Cloud connects to an origin server, in this case an EC2 server using a [Websocket-over-HTTPS protocol](https://docs.fanout.io/docs/websockets[Websocket-over-HTTPS).
3. When Client listens to music...
   - Send a subscribe request for the artist being listened to
   - Send an unsubscribe request for the previous artist
   - Increment current artist live counter on Redis
   - Decrement previous artist live counter on Redis
   - Publish new counts for previous and current artist
4. Origin server holds a hash with key of client IDs and value of the last artist they subscribe to. This way, origin server can decrement the last artist being listened to by a client when it disconnects.

### Cost-saving considerations

- Client disconnects websocket connection if idle for 15 minutes (idle meaning not listening to spotify/apple music desktop app)
- Origin server batches publish requests by waiting for subscribes/unsubscribes of a certain artist over a period of time or when has X difference than the last counters that were published. Whichever comes first.

## Why does this exist?

Its cool to see some other users somewhere in the globe listening to the same track youre listening to at the *exact* moment.

## Future plans

- Live listener count leaderboards for
  - most listened artists
  - least listened artists
- Leaderboard means an UI overhaul, and statusbar/PopOver view may be insufficient

## Note

This is based on the [SpotMenu](https://github.com/kmikiy/SpotMenu "SpotMenu") repo
