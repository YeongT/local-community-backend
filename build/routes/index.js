"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = require("express");

var _auth = _interopRequireDefault(require("./auth"));

var _list = _interopRequireDefault(require("./list"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = (0, _express.Router)();
router.use('/auth', _auth["default"]);
router.use('/list', _list["default"]);

var swaggerDefinition = require('./swagger.json');

var swaggerJSDoc = require('swagger-jsdoc');

var swaggerUi = require('swagger-ui-express');

var options = {
  swaggerDefinition: swaggerDefinition,
  apis: ['./auth/index.js', './list/index.js', './index.js']
};
var swaggerSpec = swaggerJSDoc(options);
router.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
router.get('/', function (req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/html'
  });
  res.write('<title>Local Community API Server</title>');
  res.write('<link rel="icon" href="https://hakbong.me/common/icon.png">');
  res.write('Welcome!<br>This is API Server of Hakbong<br><br>');
  res.end('API Document is <a href="https://api.hakbong.me/docs">HERE</a> ');
});
var _default = router;
exports["default"] = _default;