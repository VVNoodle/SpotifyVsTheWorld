# SpotifyVsTheWorld

Like Twitch/Youtube live viewer count, but for Spotify/Apple Music. Available for MacOS.

Origin repo: https://github.com/VVNoodle/SpotifyVsTheWorld-server
Nchan repo: -

[![demo](https://i.ibb.co/4sBkcQY/demo.gif "demo")](https://i.ibb.co/4sBkcQY/demo.gif "demo")

## How to Use?

**P.S still not v1**

1. [Download and install the app](https://github.com/VVNoodle/SpotifyVsTheWorld/releases/download/ve0.1/SpotifyVsTheWorld-0.1.app.zip "Download and install the app")
2. Open app. Make sure you have:
   - good amount of space in your status bar
   - internet connection
3. Listen to spotify/apple music. View the live counter over the statusbar

## How Does it work?

![SpotifyVsTheWorld](https://i.ibb.co/HHMNpmc/Screenshot-2021-01-09-blank-diagram-copy-1-PNG-PNG-Image-1112-793-pixels.png)
1. Client listens to artist A
2. Client fetches listener count for artist A
3. Client publishes listener count + 1. Nchan will broadcast updated count to rest of artist A listeners
4. Client subscribes to artist A via server-sent event
5. When client disconnects, Nchan will trigger /unsub call to origin server
6. Origin server fetches listener count for artist A and publishes it

### Cost-saving considerations

- Client disconnects websocket connection if idle for 15 minutes past end of latest track being listened. Idle means not listening to spotify/apple music desktop app.
- Origin server batches publish requests by waiting for requests for artists over a period of time or when has X difference than the last counters that were published. Whichever comes first.

## Future plans
- Live listener count leaderboards for
  - most listened artists
  - least listened artists
- Leaderboard means an UI overhaul, as statusbar/Popover view may be insufficient
- Maybe Windows/Linux support

## Credits

- [SpotMenu](https://github.com/kmikiy/SpotMenu "SpotMenu")
- [Nchan](https://github.com/slact/nchan "Nchan")
