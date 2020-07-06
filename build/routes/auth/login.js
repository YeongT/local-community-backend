"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = require("express");

var _crypto = require("crypto");

var _requestIp = require("request-ip");

var _app = require("../../app.js");

var _jwtToken = require("../jwtToken.js");

var _accesslog = _interopRequireDefault(require("../../models/accesslog"));

var _user2 = _interopRequireDefault(require("../../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var router = (0, _express.Router)();
router.post('/', /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {
    var _req$body, email, password, email_chk, password_chk, _user, moment, SAVE_LOG, _result, encryptPassword, update, jwtresult;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            if (_app.db_error == null) {
              _context2.next = 3;
              break;
            }

            res.status(500).send('ERR_DATABASE_NOT_CONNECTED');
            return _context2.abrupt("return");

          case 3:
            /**
             * CHECK WHETHER PROVIDED POST DATA IS VALID
             */
            _req$body = req.body, email = _req$body.email, password = _req$body.password;
            email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i, password_chk = /^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/;

            if (email && password && email_chk.test(email) && password_chk.test(password)) {
              _context2.next = 8;
              break;
            }

            res.status(412).send('ERR_DATA_FORMAT_INVALID');
            return _context2.abrupt("return");

          case 8:
            _context2.next = 10;
            return _user2["default"].findOne({
              "email": email
            });

          case 10:
            _user = _context2.sent;

            if (_user) {
              _context2.next = 14;
              break;
            }

            res.status(409).send('ERR_USER_NOT_FOUND');
            return _context2.abrupt("return");

          case 14:
            /**
             * SAVE ACCESS LOG ON DATABASE
             */
            require('moment-timezone');

            moment = require('moment');
            moment.tz.setDefault("Asia/Seoul");

            SAVE_LOG = function SAVE_LOG(__result) {
              var createLog = new _accesslog["default"]({
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                causedby: email,
                originip: (0, _requestIp.getClientIp)(req),
                category: 'LOGIN',
                details: req.body,
                result: "".concat(_result)
              });
              createLog.save( /*#__PURE__*/function () {
                var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(err) {
                  return regeneratorRuntime.wrap(function _callee$(_context) {
                    while (1) {
                      switch (_context.prev = _context.next) {
                        case 0:
                          //# HANDLE WHEN SAVE TASK FAILED
                          if (err) console.log(err);

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
             * COMPARE DB_PASSWORD WITH PROVIDED PASSWORD
             */


            _result = 'ERR_SERVER_FAILED_TEMPORARILY';
            encryptPassword = (0, _crypto.pbkdf2Sync)(password, _user.salt, 100000, 64, 'SHA512');

            if (!(encryptPassword.toString("base64") != _user.password)) {
              _context2.next = 25;
              break;
            }

            _result = 'ERR_USER_AUTH_FAILED';
            res.status(500).send(_result);
            SAVE_LOG(_result);
            return _context2.abrupt("return");

          case 25:
            /**
             * UPDATE LAST_LOGIN FIELD
             */
            _result = 'SUCCED_USER_LOGIN';
            _context2.next = 28;
            return _user2["default"].updateOne({
              "email": email
            }, {
              "lastlogin": moment().format('YYYY-MM-DD HH:mm:ss'),
              "__v": undefined
            });

          case 28:
            update = _context2.sent;
            if (!update) console.error(update);
            /**
             * GENERATE JWT TOKEN AND WRITE ON DOCUMENT
             */

            _user.password = undefined;
            _user.salt = undefined;
            _user.__v = undefined;
            jwtresult = (0, _jwtToken.jwtSign)(_user);

            if (jwtresult) {
              _context2.next = 39;
              break;
            }

            _result = 'ERR_JWT_GENERATE_FAILED';
            res.status(500).send(_result);
            SAVE_LOG(_result);
            return _context2.abrupt("return");

          case 39:
            res.status(200).send(jwtresult);
            SAVE_LOG(_result);

          case 41:
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