"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _express = require("express");

var _crypto = require("crypto");

var _fs = require("fs");

var _requestIp = require("request-ip");

var _nodemailer = require("nodemailer");

var _app = require("../../app.js");

var _token = _interopRequireDefault(require("../../models/token"));

var _accesslog = _interopRequireDefault(require("../../models/accesslog"));

var _user = _interopRequireDefault(require("../../models/user"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

require('moment-timezone');

var router = (0, _express.Router)();

var moment = require('moment');

moment.tz.setDefault("Asia/Seoul");
router.post('/', /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(req, res) {
    var transporter, verify, _req$body, email, password, name, gender, phone, areaString, email_chk, password_chk, phone_chk, name_chk, area, user, salt, iv, encryptPassword, cipher, encryptPhone, _result, createUser, SAVE_LOG;

    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (_app.db_error == null) {
              _context3.next = 3;
              break;
            }

            res.status(500).send('ERR_DATABASE_NOT_CONNECTED');
            return _context3.abrupt("return");

          case 3:
            transporter = (0, _nodemailer.createTransport)({
              host: process.env.MAIL_AUTH_SMTP_HOST,
              port: process.env.MAIL_AUTH_SMTP_PORT,
              secure: true,
              auth: {
                user: "no-reply@hakbong.me",
                pass: process.env.MAIL_AUTH_PASSWORD
              }
            });
            _context3.prev = 4;
            _context3.next = 7;
            return transporter.verify();

          case 7:
            verify = _context3.sent;

            if (verify) {
              _context3.next = 10;
              break;
            }

            throw verify;

          case 10:
            _context3.next = 16;
            break;

          case 12:
            _context3.prev = 12;
            _context3.t0 = _context3["catch"](4);
            res.status(500).send('ERR_MAIL_SERVER_NOT_CONNECTED');
            return _context3.abrupt("return");

          case 16:
            /**
             * CHECK WHETHER PROVIDED POST DATA IS VALID
             */
            _req$body = req.body, email = _req$body.email, password = _req$body.password, name = _req$body.name, gender = _req$body.gender, phone = _req$body.phone, areaString = _req$body.areaString;
            email_chk = /^[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*@[0-9a-zA-Z]([-_.]?[0-9a-zA-Z])*.[a-zA-Z]{2,3}$/i, password_chk = /^.*(?=^.{8,15}$)(?=.*\d)(?=.*[a-zA-Z])(?=.*[!@#$%^&+=]).*$/, phone_chk = /^(?:(010-?\d{4})|(01[1|6|7|8|9]-?\d{3,4}))-?\d{4}$/, name_chk = /^[ㄱ-ㅎㅏ-ㅣ가-힣a-zA-Z0-1]{2,10}/;

            if (email && password && name && gender && phone && areaString) {
              _context3.next = 21;
              break;
            }

            res.status(412).send('ERR_DATA_NOT_PROVIDED');
            return _context3.abrupt("return");

          case 21:
            if (email_chk.test(email) && password_chk.test(password) && name_chk.test(name) && phone_chk.test(phone)) {
              _context3.next = 24;
              break;
            }

            res.status(400).send('ERR_DATA_FORMAT_INVALID');
            return _context3.abrupt("return");

          case 24:
            area = JSON.parse(areaString);

            if (area.state && area.city && area.dong) {
              _context3.next = 28;
              break;
            }

            res.status(400).send('ERR_AREA_DATA_FORMAT_INVALID');
            return _context3.abrupt("return");

          case 28:
            _context3.next = 30;
            return _user["default"].findOne({
              "email": email
            });

          case 30:
            user = _context3.sent;

            if (!user) {
              _context3.next = 34;
              break;
            }

            res.status(409).send('ERR_EMAIL_DUPLICATION');
            return _context3.abrupt("return");

          case 34:
            /**
             * ENCRYPT USER PASSWORD WITH RANDOM SALT
             */
            salt = (0, _crypto.randomBytes)(32), iv = (0, _crypto.randomBytes)(16);
            encryptPassword = (0, _crypto.pbkdf2Sync)(password, salt.toString('base64'), 100000, 64, 'SHA512');

            if (encryptPassword) {
              _context3.next = 39;
              break;
            }

            res.status(500).send('ERR_PASSWORD_ENCRYPT_FAILED');
            return _context3.abrupt("return");

          case 39:
            cipher = (0, _crypto.createCipheriv)('aes-256-cbc', Buffer.from(salt), iv);
            encryptPhone = Buffer.concat([cipher.update(phone), cipher["final"]()]);

            if (encryptPhone) {
              _context3.next = 44;
              break;
            }

            res.status(500).send('ERR_PHONE_ENCRYPT_FAILED');
            return _context3.abrupt("return");

          case 44:
            /**
             * SAVE USER ACCOUNT ON DATABASE
             */
            _result = 'ERR_SERVER_FAILED';
            createUser = new _user["default"]({
              email: email,
              password: "".concat(encryptPassword.toString('base64')),
              name: name,
              gender: gender,
              phone: "".concat(iv.toString('hex') + ':' + encryptPhone.toString('hex')),
              area: {
                state: "".concat(area.state),
                city: "".concat(area.city),
                dong: "".concat(area.dong)
              },
              salt: "".concat(salt.toString('base64'))
            });
            /**
             * SAVE LOG FUNCTION
             */

            SAVE_LOG = function SAVE_LOG(__result) {
              var createLog = new _accesslog["default"]({
                timestamp: moment().format('YYYY-MM-DD HH:mm:ss'),
                causedby: email,
                originip: (0, _requestIp.getClientIp)(req),
                category: 'SIGNUP',
                details: createUser,
                result: __result
              });
              createLog.save(function (err) {
                if (err) console.log(err);
              });
            };

            _context3.next = 49;
            return createUser.save( /*#__PURE__*/function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(err) {
                var token, newToken, _verify, exampleEmail, emailData, mailOptions;

                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        if (!err) {
                          _context2.next = 4;
                          break;
                        }

                        _result = 'ERR_USER_SAVE_FAILED';
                        res.status(500).send(_result.toString());
                        return _context2.abrupt("return");

                      case 4:
                        //# GENERATE TOKEN AND SAVE ON DATABASE
                        token = (0, _crypto.randomBytes)(30);
                        newToken = new _token["default"]({
                          owner: email,
                          type: 'SIGNUP',
                          token: "".concat(token.toString('base64'))
                        });
                        _context2.prev = 6;
                        _context2.next = 9;
                        return newToken.save();

                      case 9:
                        _verify = _context2.sent;

                        if (_verify) {
                          _context2.next = 12;
                          break;
                        }

                        throw _verify;

                      case 12:
                        _context2.next = 20;
                        break;

                      case 14:
                        _context2.prev = 14;
                        _context2.t0 = _context2["catch"](6);
                        _result = 'ERR_AUTH_TOKEN_SAVE_FAILED';
                        res.status(424).send(_result.toString());
                        SAVE_LOG(_result);
                        return _context2.abrupt("return");

                      case 20:
                        _context2.prev = 20;
                        exampleEmail = (0, _fs.readFileSync)(__dirname + '/../../models/html/active.html').toString();
                        emailData = exampleEmail.replace('####INPUT-YOUR-LINK_HERE####', "https://api.hakbong.me/auth/active?email=".concat(email, "&&token=").concat(token.toString('base64')));
                        mailOptions = {
                          from: 'Local-Community<no-reply@hakbong.me>',
                          to: email,
                          subject: '[Local Comunity] Account Verification Email',
                          html: emailData
                        };
                        _context2.next = 26;
                        return transporter.sendMail(mailOptions, /*#__PURE__*/function () {
                          var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(error, info) {
                            return regeneratorRuntime.wrap(function _callee$(_context) {
                              while (1) {
                                switch (_context.prev = _context.next) {
                                  case 0:
                                    if (!error) {
                                      _result = 'SUCCEED_USER_CREATED';
                                      res.status(200).send(_result.toString());
                                      SAVE_LOG(_result);
                                    }

                                  case 1:
                                  case "end":
                                    return _context.stop();
                                }
                              }
                            }, _callee);
                          }));

                          return function (_x4, _x5) {
                            return _ref3.apply(this, arguments);
                          };
                        }());

                      case 26:
                        _context2.next = 34;
                        break;

                      case 28:
                        _context2.prev = 28;
                        _context2.t1 = _context2["catch"](20);
                        console.error(_context2.t1); //SHOW ERROR FOR PM2 INSTANCE

                        _result = 'ERR_VERIFY_EMAIL_SEND_FAILED';
                        res.status(424).send(_result.toString());
                        SAVE_LOG(_result);

                      case 34:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2, null, [[6, 14], [20, 28]]);
              }));

              return function (_x3) {
                return _ref2.apply(this, arguments);
              };
            }());

          case 49:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[4, 12]]);
  }));

  return function (_x, _x2) {
    return _ref.apply(this, arguments);
  };
}());
var _default = router;
exports["default"] = _default;