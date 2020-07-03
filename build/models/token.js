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
  created: {
    type: Date,
    "default": Date.now()
  },
  expired: {
    type: Date,
    "default": Date.now() + 24 * 60 * 60 * 1000
  }
});

var _default = (0, _mongoose.model)('Token', token);

exports["default"] = _default;