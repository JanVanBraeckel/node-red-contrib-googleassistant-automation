# How to

Devices that should be synced to Google Assistant can be added in the "Assistant devices" tab on the right-hand side of the screen. Not a lot of devices are supported so far.
Here, you can set an ID (usually the topic), a friendly name that's displayed on your phone when adding a device, the device type and which traits that device can fulfill.

Use the `ga device` input to listen to commands on a device. In the payload you'll find the ID of the device + the value it should be set to.

To set up the Google Assistant project, go to http://console.actions.google.com and set up your project. Upload your action with the `gactions` utility by running the following: `.\gactions test -preview_mins 9999999 -action_package action.json -project <project id>`

This integration runs a separate node server on port 1881 so you don't have to expose all of node-red to the outside.

CAUTION: This project provides a MOCK implementation of OAuth2 and is NOT intended for production usage. An HTTPS connection is also required. Support for adding SSL (self signed is allowed) to the node server instance will come soon. Testing can be done using ngrok. Currently, Google Assistant Actions don't provide private actions, so your action should NEVER leave testing mode. If you publish it and it somehow passes review, everybody will be able to manage your devices.

# Support

Supported devices:

* Light
* Switch

Supported traits:

* OnOff
