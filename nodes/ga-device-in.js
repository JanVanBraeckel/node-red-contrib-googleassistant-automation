let inited = false;

module.exports = function(RED) {
  const bodyParser = require('body-parser');
  const express = require('express');
  const session = require('express-session');
  const path = require('path');
  const http = require('http');
  const https = require('https');

  const datastore = require('./../datastore');
  const authProvider = require('./../auth-provider');

  let app, onExecute;
  let onNodeSend;

  function GoogleActionIn(node) {
    if (!inited) {
      inited = true;
      init(RED.settings.google_assistant);
    }

    onNodeSend = data => {
      this.send({
        topic: data.id,
        payload: data.value
      });
    };

    RED.nodes.createNode(this, node);
  }
  RED.nodes.registerType('ga-device in', GoogleActionIn);

  function init(settings) {
    app = express();
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.set('trust proxy', 1); // trust first proxy
    app.set('views', path.join(__dirname, '../views'));
    app.use(
      session({
        genid: function(req) {
          return authProvider.genRandomString();
        },
        secret: 'xyzsecret',
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
      })
    );

    let server;

    if (settings && settings.key && settings.cert) {
      server = https.createServer({ key: settings.key, cert: settings.cert }, app);
    } else {
      server = http.createServer(app);
    }

    server.listen(1881, function() {
      const host = server.address().address;
      const port = server.address().port;
      console.log('Smart Home App listening at %s:%s', host, port);

      authProvider.registerAuth(app);
    });

    app.post('/ha', (req, res) => {
      let authToken = req.headers.authorization ? req.headers.authorization.split(' ')[1] : null;
      let intent = req.body.inputs[0].intent;

      switch (intent) {
        case 'action.devices.SYNC':
          sync(req, res);
          break;
        case 'action.devices.QUERY':
          query(req, res);
          break;
        case 'action.devices.EXECUTE':
          execute(req, res);
          break;
      }
    });

    function query(reqdata, res) {
      let deviceStates = {
        requestId: reqdata.requestId,
        payload: {
          devices: {
            'room/lamp': {
              on: devices.fan.on,
              online: true
            }
          }
        }
      };
      res.status(200).json(deviceStates);
    }

    function sync(req, res) {
      let nodes = [];
      RED.nodes.eachNode(node => {
        if (node.type === 'ga-device') {
          nodes.push({
            id: node.identifier,
            type: `action.devices.types.${node.devicetype}`,
            traits: node.devicetraits.map(trait => `action.devices.traits.${trait}`),
            name: {
              name: node.name
            },
            willReportState: true
          });
        }
      });
      let deviceProps = {
        requestId: req.body.requestId,
        payload: {
          devices: nodes
        }
      };
      res.status(200).json(deviceProps);
    }

    function execute(reqdata, res) {
      let reqCommands = reqdata.body.inputs[0].payload.commands;
      let respCommands = [];

      for (let i = 0; i < reqCommands.length; i++) {
        let curCommand = reqCommands[i];
        for (let j = 0; j < curCommand.execution.length; j++) {
          let curExec = curCommand.execution[j];

          if (curExec.command === 'action.devices.commands.OnOff') {
            for (let k = 0; k < curCommand.devices.length; k++) {
              let curDevice = curCommand.devices[k];
              onNodeSend({ id: curDevice.id, value: curExec.params.on.toString() });
              respCommands.push({ ids: [curDevice.id], status: 'SUCCESS' });
            }
          }
        }
      }

      let resBody = {
        requestId: reqdata.requestId,
        payload: {
          commands: respCommands
        }
      };
      res.status(200).json(resBody);
    }
  }
};
