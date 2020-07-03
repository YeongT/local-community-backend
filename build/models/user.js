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
    State: String,
    City: String,
    Dong: String
  },
  lastlogin: Date,
  salt: String,
  enable: {
    type: Number,
    "default": 0
  }
});

var _default = (0, _mongoose.model)('Users', User);

exports["default"] = _default;