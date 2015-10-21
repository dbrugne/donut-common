var _ = require('underscore');
var PomeloClient = require('./pomelo-client');
var WsClient = require('./ws-client');


module.exports = function (options) {
  // options
  options = _.defaults(options, {
    device: '',
    host: '',
    debug: function () {
      console.log.apply(console, arguments);
    },
    retrieveToken: _.noop,
    invalidToken: _.noop
  });

  // pomelo-client
  var pomelo = PomeloClient(options);

  // ws-client
  var ws = WsClient(pomelo, options);

  // connection methods
  ws.connect = function (host, port) {
    pomelo.connect(host, port);
  };
  ws.disconnect = function () {
    pomelo.disconnect();
  };
  ws.isConnected = function () {
    return pomelo.isConnected();
  };

  // pushed event from ws
  var that = this;
  pomelo.on('all', function (name, data) {
    options.debug('ws:' + name, data);
    ws.trigger(name, data);
  });

  return ws;
};