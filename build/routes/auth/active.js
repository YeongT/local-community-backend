"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = require("express");

var _requestIp = require("request-ip");

var _app = require("../../app.js");

var _accesslog = _interopRequireDefault(require("../../models/accesslog"));

var _token2 = _interopRequireDefault(require("../../models/token"));

var _user = _interopRequireDefault(require("../../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var router = (0, _express.Router)();
router.get('/', /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {
    var _req$query, email, token, email_chk, user, SAVE_LOG, _token, _result, verify;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (_app.db_error == null) {
              _context2.next = 4;
              break;
            }

            res.status(500);
            res.send('ERR_DATABASE_NOT_CONNECTED');
            return _context2.abrupt("return");

          case 4:
            /**
             * CHECK WHETHER PROVIDED POST DATA IS VALID
             */
            _req$query = req.query, email = _req$query.email, token = _req$query.token;
            email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i;

            if (email && email_chk.test(email) && token) {
              _context2.next = 10;
              break;
            }

            res.status(412);
            res.send('ERR_DATA_FORMAT_INVALID');
            return _context2.abrupt("return");

          case 10:
            _context2.next = 12;
            return _user["default"].findOne({
              "email": email,
              "enable": false
            });

          case 12:
            user = _context2.sent;

            if (user) {
              _context2.next = 16;
              break;
            }

            res.status(409).send('ERR_USER_NOT_FOUND');
            return _context2.abrupt("return");

          case 16:
            /**
             * SAVE LOG FUNCTION
             */
            SAVE_LOG = function SAVE_LOG(__result) {
              require('moment-timezone');

              var moment = require('moment');

              moment.tz.setDefault("Asia/Seoul");
              var createLog = new _accesslog["default"]({
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                causedby: email,
                originip: (0, _requestIp.getClientIp)(req),
                category: 'ACTIVATE',
                details: "".concat("provided token : " + token),
                result: "".concat(__result)
              });
              createLog.save( /*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(err) {
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          if (err) console.error(err);

                        case 1:
                        case "end":
                          return _context.stop();
                      }
                    }
                  }, _callee);
                }));

                return function (_x3) {
                  return _ref2.apply(this, arguments);
                };
              }());
            };
            /**
             * CHECK WHETHER TOKEN IS VALID
             */


            _context2.next = 19;
            return _token2["default"].findOne({
              "owner": email,
              "type": "SIGNUP",
              "token": token,
              "expired": {
                $gte: new Date()
              }
            });

          case 19:
            _token = _context2.sent;

            if (_token) {
              _context2.next = 23;
              break;
            }

            res.status(409).send('ERR_PROVIDED_TOKEN_INVALID');
            return _context2.abrupt("return");

          case 23:
            /**
             * CHANGE USER ENABLE STATE
             */
            _result = 'ERR_SERVER_FAILED_TEMPORARILY';
            _context2.next = 26;
            return _user["default"].updateOne({
              "email": email,
              "enable": false
            }, {
              "enable": true
            });

          case 26:
            verify = _context2.sent;

            if (verify) {
              _context2.next = 32;
              break;
            }

            _result = 'ERR_USER_UPDATE_FAILED';
            res.status(500).send(_result);
            SAVE_LOG(_result);
            return _context2.abrupt("return");

          case 32:
            _context2.next = 34;
            return _token2["default"].deleteOne({
              "owner": email,
              "type": "SIGNUP",
              "token": token
            });

          case 34:
            _result = 'SUCCEED_USER_ACTIVATED';
            res.status(200).send(_result);
            SAVE_LOG(_result); //handle HTML File

          case 37:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());
var _default = router;
exports["default"] = _default;