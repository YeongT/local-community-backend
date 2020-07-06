"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = require("mongoose");

var User = new _mongoose.Schema({
  email: String,
  password: String,
  name: String,
  gender: Number,
  phone: String,
  area: {
    state: String,
    city: String,
    dong: String
  },
  lastlogin: String,
  salt: String,
  enable: {
    type: Boolean,
    "default": false
  }
});

var _default = (0, _mongoose.model)('Users', User);

exports["default"] = _default;