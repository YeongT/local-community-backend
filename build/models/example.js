"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _mongoose = require("mongoose");

var _mongoosePaginateV = _interopRequireDefault(require("mongoose-paginate-v2"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var Profile = new _mongoose.Schema({
  target: String,
  uploader: String,
  image: String,
  view: {
    type: Number,
    "default": 0
  },
  timestamp: {
    type: Date,
    "default": Date.now()
  }
});
Profile.plugin(_mongoosePaginateV["default"]);

var _default = (0, _mongoose.model)('Profiles', Profile);

exports["default"] = _default;