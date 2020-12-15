# ChatRelay Endpoints

ChatRelay is simultaneously a Minecraft client and a web server.
The client relays chat messages to the web server, which can then serve said blabber.
The following endpoints are available to web clients:

**Note**: The only allowed method is GET.

## /messages

- This is the main endpoint, used to get messages.
- `If-Modified-Since` is required. ChatRelay is lenient, so `If-Modified-Since: 0` is accepted and can be considered "please give me all the messages in the buffer".
- `Accept` can be set to `text/plain` receive messages as they would appear on the screen without JSON formatting. In this case, the server returns the `Last-Modified` header with the time of the latest message.
- Response status codes:
  - **200 OK**: there have been messages since the timestamp given.
  - **304 Not Modified**: there have been no new messages.
  - **400 Bad Request**: there was no `If-Modified-Since` field in the request or it was a bad one.
  - **503 Service Unavailable**: the Minecraft client is down.
- JSON response structure:
  ```js
  [
      {
          "data": {"description": "JSON Chat Component as sent by the Minecraft Server"},
          "time": "timestamp of this message, in milliseconds since epoch"
      },
      {
          "data": {"text": "Welcome to LocalHost!", "color": "dark_purple"},
          "time": 1608050131811
      },
      ...
  ]
  ```

## /status

- This is used to get the health of the service.
- The response can be considered a three-color signal, dictated by status code.
  - **200 OK**: (Green) the Minecraft client is connected and receiving messages.
  - **218 This is fine**: (Yellow) the Minecraft client is trying to connect to the MC server, please wait.
  - **503 Service Unavailable**: (Red) the Minecraft client cannot connect to the MC server and will not try to connect again without intervention.

## /info

- This is used to get mostly static info about the service.
- The two response codes are:
  - **200 OK**: attached by a JSON object with info.
  - **503 Service Unavailable**: the Minecraft client is down.
- JSON response fields:
  - mcHost: the Minecraft server to listen from
  - mcPort: the port of said server
  - mcVersion: the Minecraft server's version
  - mcUsername: the username of the player being used to snoop chat with


## /defibrillators

- This is used to manually reconnect the Minecraft client to the server. In other words, revive the client, GET /defibrillators!
- The response status codes are:
  - **200 OK**: the Minecraft client was dead, but it has been successfully revived.
  - **403 Forbidden**: the Minecraft client is already OK.
  - **500 Internal Server Error**: the Minecraft client could not be reactivated.
