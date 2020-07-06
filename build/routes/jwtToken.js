"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.jwtSign = exports.jwtVerify = void 0;

var _jsonwebtoken = require("jsonwebtoken");

var jwtSign = function jwtSign(object) {
  try {
    var signed = (0, _jsonwebtoken.sign)(object.toJSON(), process.env.JWT_TOKEN_SECRETKEY, {
      expiresIn: '5h'
    });
    return signed;
  } catch (err) {
    console.error(err);
    return false;
  }
};

exports.jwtSign = jwtSign;

var jwtVerify = function jwtVerify(token, secret) {
  try {
    var verified = (0, _jsonwebtoken.verify)(token, !secret ? process.env.JWT_TOKEN_SECRETKEY : secret);
    return verified;
  } catch (err) {
    console.error(err);
    return false;
  }
};

exports.jwtVerify = jwtVerify;