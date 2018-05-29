# How to

## Settings up devices

Devices that should be synced to Google Assistant can be added in the "Assistant devices" tab on the right-hand side of the screen. Not a lot of devices are supported so far.
Here, you can set an ID (usually the topic), a friendly name that's displayed on your phone when adding a device, the device type and which traits that device can fulfill.

Use the `ga device` input to listen to commands on a device. In the payload you'll find the ID of the device + the value it should be set to.

## Google Assistant Project

To set up the Google Assistant project, go to http://console.actions.google.com and set up your project. Upload your action with the `gactions` utility by running the following: `.\gactions test -preview_mins 9999999 -action_package action.json -project <project id>`

This integration runs a separate node server on port 1881 so you don't have to expose all of node-red to the outside.

## HTTPS

### Settings.js

In your `settings.js` file, add a new key called `google_assistant` with 2 properties: `key` and `cert`. Use the `fs.readFileSync(<your location>)` method to read your key and cert.

Example:

```js
google_assistant: {
    key: fs.readFileSync('/etc/ssl/private/server.key'),
    cert: fs.readFileSync('/etc/ssl/certs/server.crt')
}
```

Self-signed certificates don't work anymore.

### Other

Another possibility to run HTTPS is to use Docker and letsencrypt. You can use [nginx as reverse HTTPS proxy](letsencrypt-nginx-proxy-companion) or use something like [caddy](https://caddyserver.com/) to reverse proxy to port 1881. Other solutions are possible, but these are the only ones I've tested.

Example:

/opt/docker/caddy/Caddyfile

```
<your domain> {
    proxy / node-red:1881/ {
        transparent
    }
    gzip
    tls <your email>
}
```

/opt/docker/docker-compose.yml

```yml
version: '3'
services:
  mosquitto: ...

  node-red:
    hostname: nodered
    container_name: nodered
    build:
      context: /opt/docker/node-red-docker
      dockerfile: Dockerfile
    restart: unless-stopped
    volumes:
     - /etc/localtime:/etc/localtime:ro
     - /opt/docker/nodered:/data
    links:
     - mosquitto
    ports:
     - "1880:1880"
     - "1881:1881"
    depends_on:
     - mosquitto


  caddy:
    hostname: caddy
    container_name: caddy
    image: abiosoft/caddy
    restart: unless-stopped
    ports:
     - "80:80"
     - "443:443"
    volumes:
     - /opt/docker/caddy:/srv
    depends_on:
     - node-red
```

## Warning

CAUTION: This project provides a MOCK implementation of OAuth2 and is NOT intended for production usage. An option worth exploring if you're using Docker & Caddy is [loginsrv](https://github.com/tarent/loginsrv)

Testing can be done using ngrok. Currently, Google Assistant Actions don't provide private actions, so your action should NEVER leave testing mode. If you publish it and it somehow passes review, everybody will be able to manage your devices.

# Support

Supported devices:

* Light
* Switch

Supported traits:

* OnOff
