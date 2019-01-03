const jwt = require('jsonwebtoken');
const ObjectId = require('mongoose').Types.ObjectId;
const config = require('../config');
const Token = require('../models/Token');
const AuthError = require('../errors/AuthError');

const tokenService = {};

tokenService.generateToken = function(instance) {
  return new Promise((resolve, reject) => {
    Token.deleteMany({ userId: new ObjectId(instance._id) })
      .then(() => {
        const expiresInSeconds = 5 * 60;
        const payload = {
          email: instance.email
        };
        const accessToken = jwt.sign(payload, config.api_secret_key, {
          expiresIn: expiresInSeconds
        });
        instance.token = {
          accessToken
        };
        return resolve(instance.token);
      })
      .catch(() => reject(AuthError.TokenGenerateException));
  });
};

tokenService.verifyToken = function(instance) {
  return new Promise((resolve, reject) => {
    Token.find({ 'token.accessToken': instance })
      .then(token => {
        if (token.length < 1) return reject(AuthError.WrongToken());

        const tokenData = {
          userId: token[0].userId || null,
          schoolNumber: token[0].schoolNumber
        };
        return resolve(tokenData);
      })
      .catch(() => reject(AuthError.WrongToken()));
  });
};

tokenService.removeToken = function(token) {
  return new Promise((resolve, reject) => {
    Token.findOneAndDelete({ 'token.accessToken': token })
      .then(data => {
        if (data == null) return resolve('Böyle bir token yok');

        return resolve('Başarılı bir şekilde token silindi');
      })
      .catch(err => reject(new AuthError.TokenGenerateException(err)));
  });
};

tokenService.verifyManager = function(instance) {
  return new Promise((resolve, reject) => {
    Token.findOne({ 'token.accessToken': instance })
      .then(token => {
        if (token.userType !== 'Manager') return reject(AuthError.NotAllowed());

        return resolve(token.userId);
      })
      .catch(() => reject(AuthError.WrongToken()));
  });
};
module.exports = tokenService;
