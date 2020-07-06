"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = require("mongoose");

var token = new _mongoose.Schema({
  owner: String,
  type: String,
  token: String,
  created: Date,
  expired: Date
});

var _default = (0, _mongoose.model)('Token', token);

exports["default"] = _default;