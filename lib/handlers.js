// route handlers

const helpers = require('./helpers');
const config = require('./config');

const _data = require('./data');

const users = require('./handlers/users');
const tokens = require('./handlers/tokens');

var handlers = {};

handlers.notFound = (data, cb) => cb(404);
handlers.ping = (data, cb) => cb(200);

handlers.users = (data, cb) => {
  if (users[data.method] !== undefined) {
    users[data.method](data, cb);
  } else {
    cb(404);
  }
};

handlers.tokens = (data, cb) => {
  if (tokens[data.method] !== undefined) {
    tokens[data.method](data, cb);
  } else {
    cb(404);
  }
};

module.exports = handlers;
