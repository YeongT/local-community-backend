"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = require("mongoose");

var accesslog = new _mongoose.Schema({
  timestamp: String,
  causedby: String,
  originip: String,
  category: String,
  details: Object,
  result: String,
  memo: String
});

var _default = (0, _mongoose.model)('accessLog', accesslog);

exports["default"] = _default;