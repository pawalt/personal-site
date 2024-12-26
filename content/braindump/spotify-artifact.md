+++
title = "Using Claude Artifacts to analyze Spotify listening"
description = "im bad at frontend but ai's not"
date = "2024-12-24"
tags = [
  "artifacts",
  "music",
]
+++

My friend told me that you can [request a download](https://www.spotify.com/us/account/privacy/) of all your listening activity from Spotify! I got Claude to one-shot creating an artifact to do this. You can view it [right here](/artifacts/listening/base-activity.html)! I've also got my own <a href=/artifacts/listening/my-spotify-data.json download>listening data</a> you can use while you wait for your data to come back.

I juiced this base artifact up a little using [Cursor](https://www.cursor.com/) chat, and now it looks much better! **[View it here](/artifacts/listening/activity.html)**.

![screenshot of visualizer](/artifacts/listening/screenshot.png)

Big thanks to [Simon Willison](https://simonwillison.net/) for [giving me the inspiration](https://simonwillison.net/2024/Oct/21/claude-artifacts/) to make this simple visualizer.
