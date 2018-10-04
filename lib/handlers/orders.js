// handlers for cart
const _data = require('../data');
const helpers = require('../helpers');
const auth = require('../authentication');
const menu = require('./menu');

let resource = {
  acceptableMethods: ['post', 'get', 'put', 'delete']
};

// Required fields:
// - stripe_payment_id
// Requires `token` header for authentication
resource.post = (data, cb) => {
  let stripe_payment_id = null;
  if (typeof(data.payload.stripe_payment_id) == 'string' &&
      data.payload.stripe_payment_id.trim().length > 0) {
    stripe_payment_id = data.payload.stripe_payment_id.trim();
  }
  if (!(stripe_payment_id)) {
    return cb(400, { 'Error' : 'Missing required fields' });
  }

  auth.currentUserEmail(data.headers.token, (email) => {
    if (email) {
      // get current cart
      _data.read('carts', email, (err, cartData) => {
        if (!err && cartData &&
            cartData.items !== undefined && cartData.items.length > 0) {
          // read user model
          _data.read('users', email, (err, userData) => {
            if (!err && userData) {
              resource._createOrder(cartData, userData, stripe_payment_id, cb);
            } else {
              cb(404, { 'Error' : 'The specified user does not exist' });
            }
          });
        } else {
          // if cart is empty, abort
          cb(400, { 'Error' : 'Cart is empty!' });
        }
      });
    } else {
      cb(403, { 'Error' : 'Unauthorized' });
    }
  });
};

// helper function to create the order
// given a cart and a user, creates and stores an order
resource._createOrder = (cartData, userData, stripe_payment_id, cb) => {
  // build order from cart
  let orderItems = [];
  cartData.items.forEach((cartItem) => {
    let menuItem = menu.find(cartItem.menu_item_id);
    if (!menuItem) { return cb(400, { 'Error' : 'Invalid menu item!' }); }
    delete menuItem.id;
    menuItem.quantity = cartItem.quantity;
    orderItems.push(menuItem);
  });

  let orderObj = {
    id: helpers.createRandomString(10),
    email: userData.email,
    payment_id: stripe_payment_id,
    items: orderItems,
    total_price: orderItems.reduce(
      (acc, item) => { return acc + (item.price_cents * item.quantity); }, 0.0
    )
  };

  // store order
  _data.create('orders', orderObj.id, orderObj, (err) => {
    if (!err) {
      // add order id to user
      if (!userData.orderIds) { userData.orderIds = []; }
      userData.orderIds.push(orderObj.id);
      // Store the updated model
      _data.update('users', userData.email, userData, (err) => {
        if (!err) {
          // success, empty the cart now
          _data.delete('carts', userData.email, (err) => {
            if (!err) {
              cb(201, orderObj);
            } else {
              cb(500, { 'Error' : 'Cart could not be deleted after order was placed' });
            }
          });
        } else {
          console.log(err);
          cb(500, { 'Error' : 'Could not update the user with new order' });
        }
      });
    } else {
      console.log(err);
      cb(500, { 'Error' : 'Could not create the new order: ' + err });
    }
  });
};

// Required fields:
// - id: string
// Requires `token` header for authentication
resource.get = (data, cb) => {
  // check that id is valid
  let id = null;
  if (typeof(data.queryStringObject.id) == 'string' &&
      data.queryStringObject.id.length == 10) {
    id = data.queryStringObject.id;
  }
  if (!id) {
    return cb(400, { 'Error' : 'Missing required fields' });
  }
  auth.currentUserEmail(data.headers.token, (email) => {
    if (email) {
      // lookup user
      _data.read('orders', id, (err, orderData) => {
        if (!err && orderData) {
          cb(200, orderData);
        } else {
          cb(404, { 'Error' : 'Order not found' });
        }
      });
    } else {
      cb(403, { 'Error' : 'Unauthorized' });
    }
  });
};

_data.ensureDirExists('orders', (err) => {
  if (err) {
    console.log('Error initializing carts data dir!', err);
    process.exit(1);
  }
});

module.exports = resource;
