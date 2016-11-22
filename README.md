plusultra
=========

A message gateway for multi-modal web apps.

## Description
The work on this repo is part of my [thesis](https://github.com/dpaez/plusultra_thesis). It represents a way to enhance contemorary web apps with multimodal capabilities. 
This particular piece offers a way to transmit on real-time multimodal messages to a set of connected clients.

## *Note*
The work presented here is an early release. It shows a way to do a particular job but it needs more work to become a _production-like_ tool. 

## Requirements

The platform needs a redis instance in order to work as a in-memory messages cache/dispatcher. Redis instance default port is: ```6379```.

## Install

```
npm install https://github.com/dpaez/plusultra.git
```

## Usage

```
node index.js
```

This will start a plusultra server instance. It opens a websocket connection with each of the connected clients. The platform requires each client to have an application key in order to be allowed to work. This key is created using the JSON web token tool.

The platform's default websockets port is: ```26060```

## Options

The platforms allows the following options as CLI params.

```bash
$ node index.js OPTIONS
```

OPTIONS:

```bash
-sp, --sioPort                  Defaults: '26060' // websocket port
-eh, --entranceHost             Defaults: 'localhost'
-ep, --entrancePort             Defaults: '6379' // redis client port
-cs, --communicationStrategy    Defaults: 'socket.io'
```



