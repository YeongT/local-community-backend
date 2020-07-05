"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = require("express");

var _signup = _interopRequireDefault(require("./signup"));

var _active = _interopRequireDefault(require("./active"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var router = (0, _express.Router)();
router.use('/signup', _signup["default"]);
router.use('/active', _active["default"]);
var _default = router;
exports["default"] = _default;