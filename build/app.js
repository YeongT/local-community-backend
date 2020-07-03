"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.db_error = exports.app = void 0;

var _cookieParser = _interopRequireDefault(require("cookie-parser"));

var _cors = _interopRequireDefault(require("cors"));

var _path = _interopRequireDefault(require("path"));

var _querystring = _interopRequireDefault(require("querystring"));

var _fs = _interopRequireDefault(require("fs"));

var _dotenv = require("dotenv");

var _express = _interopRequireWildcard(require("express"));

var _mongoose = require("mongoose");

var _index = _interopRequireDefault(require("./routes/index"));

function _getRequireWildcardCache() { if (typeof WeakMap !== "function") return null; var cache = new WeakMap(); _getRequireWildcardCache = function _getRequireWildcardCache() { return cache; }; return cache; }

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var app = (0, _express["default"])();
exports.app = app;
var db_error;
exports.db_error = db_error;

try {
  /**
  * DataBase Connect Using SSL Verification && Reconnect when DataBase had been disconnected.
  */
  var db_connect = function db_connect() {
    var mongouri = "mongodb://".concat(process.env.DB_USER, ":").concat(_querystring["default"].escape(process.env.DB_PASSWORD), "@").concat(process.env.DB_HOST, ":").concat(process.env.DB_PORT, "/").concat(process.env.DB_NAME, "?authSource=admin");
    (0, _mongoose.connect)(mongouri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      tls: true,
      tlsCertificateKeyFile: process.env.DB_SSL_KEY,
      tlsCAFile: process.env.DB_SSL_CERT
    }, function (err) {
      exports.db_error = db_error = err;
      if (err) throw err;else console.log("[DB] Database connected via TCP/IP on port ".concat(process.env.DB_PORT, " with TLS encryption"));
    });
  };

  /**
   * check if '.env' file exist in config folder through checking if `app` object is not null' && open .env file
   */
  _fs["default"].statSync(_path["default"].join(__dirname, '/config/.env'));

  (0, _dotenv.config)({
    path: _path["default"].join(__dirname, '/config/.env')
  });
  app.use((0, _cors["default"])());
  app.use((0, _express.json)({
    limit: '10mb'
  }));
  app.use((0, _express.urlencoded)({
    extended: false
  }));
  app.use((0, _cookieParser["default"])());
  app.use('/', _index["default"]);
  db_connect();

  _mongoose.connection.on('disconnected', function () {
    console.log('[DB] Database disconnect. Trying to reconnect...');
    exports.db_error = db_error = 'disconnected';
    db_connect();
  });
} catch (err) {
  if (err.code === 'ENOENT') throw new Error('missing \'.env\' file in \'config\' folder. please modify \'.env.sample\' file.');
}