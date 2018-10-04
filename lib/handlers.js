// route handlers

const users = require('./handlers/users');
const tokens = require('./handlers/tokens');
const menu = require('./handlers/menu');
const cart = require('./handlers/cart');
const orders = require('./handlers/orders');

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

handlers.menu = (data, cb) => {
  if (menu[data.method] !== undefined) {
    menu[data.method](data, cb);
  } else {
    cb(404);
  }
};

handlers.cart = (data, cb) => {
  if (cart[data.method] !== undefined) {
    cart[data.method](data, cb);
  } else {
    cb(404);
  }
};

handlers.orders = (data, cb) => {
  if (orders[data.method] !== undefined) {
    orders[data.method](data, cb);
  } else {
    cb(404);
  }
};

module.exports = handlers;
