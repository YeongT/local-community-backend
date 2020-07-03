#!/usr/bin/env node

/**
 * Module dependencies.
 */
"use strict";

var _https = require("https");

require("babel-polyfill");

var _fs = _interopRequireDefault(require("fs"));

var _app = require("./app");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/**
 * importing express app object from app.js file.
 * also check if '.env' file exist in config folder through checking if `app` object is not null' 
 */

/**
 * Normalize a port into a number, string, or false.
 */
var normalizePort = function normalizePort(val) {
  var port = parseInt(val, 10);

  if (Number.isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
};
/**
 * Get port from environment and store in Express.
 */


var port = normalizePort(process.env.PORT || '1000');
var options = {
  key: _fs["default"].readFileSync(process.env.SSL_KEY_PATH),
  cert: _fs["default"].readFileSync(process.env.SSL_CERT_PATH),
  ca: _fs["default"].readFileSync(process.env.SSL_CA_PATH)
};

_app.app.set('port', port);
/**
 * Create HTTP server with HTTPS SETTINGS.
 */


var server = (0, _https.createServer)(options, _app.app);
/**
 * Event listener for HTTP server "error" event.
 */

var onError = function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string' ? "Pipe ".concat(port) : "Port ".concat(port); // handle specific listen errors with friendly messages

  switch (error.code) {
    case 'EACCES':
      throw new Error("".concat(bind, " requires elevated privileges"));

    case 'EADDRINUSE':
      throw new Error("".concat(bind, " is already in use"));

    default:
      throw error;
  }
};
/**
 * Event listener for HTTP server "listening" event.
 */


var onListening = function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string' ? "pipe ".concat(addr) : "port ".concat(addr.port);
  console.log("Secured API Server is Running on ".concat(bind));
};
/**
 * Listen on provided port, on all network interfaces.
 */


server.listen(port);
server.on('error', onError);
server.on('listening', onListening);