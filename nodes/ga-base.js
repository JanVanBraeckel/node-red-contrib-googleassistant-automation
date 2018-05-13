module.exports = function(RED) {
  function BaseNode(config) {
    RED.nodes.createNode(this, config);
  }

  RED.nodes.registerType('ga-device', BaseNode);
};
