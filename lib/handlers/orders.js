// handlers for cart
const _data = require('../data');
const helpers = require('../helpers');
const stripeHelpers = require('../stripe_helpers');
const auth = require('../authentication');
const worker = require('../worker');

const menu = require('./menu');

let resource = {
  acceptableMethods: ['post', 'get', 'put', 'delete']
};

// Required fields:
// - card_number
// - card_exp_month
// - card_exp_year
// - card_cvc
// Requires `token` header for authentication
resource.post = (data, cb) => {
  let card_number = null;
  if (typeof(data.payload.card_number) == 'string' &&
      data.payload.card_number.trim().length == 16) {
    card_number = data.payload.card_number.trim();
  }
  let card_exp_month = null;
  if (typeof(data.payload.card_exp_month) == 'string' &&
      data.payload.card_exp_month.trim().length == 2) {
    card_exp_month = data.payload.card_exp_month.trim();
  }
  let card_exp_year = null;
  if (typeof(data.payload.card_exp_year) == 'string' &&
      data.payload.card_exp_year.trim().length == 4) {
    card_exp_year = data.payload.card_exp_year.trim();
  }
  let card_cvc = null;
  if (typeof(data.payload.card_cvc) == 'string' &&
      data.payload.card_cvc.trim().length == 3) {
    card_cvc = data.payload.card_cvc.trim();
  }
  if (!card_number || !card_exp_month || !card_exp_year || !card_cvc) {
    return cb(400, { 'Error' : 'Missing required fields' });
  }
  const paymentData = {
    number: card_number,
    exp_month: card_exp_month,
    exp_year: card_exp_year,
    cvc: card_cvc
  };

  auth.currentUser(data.headers.token, (userData) => {
    if (userData) {
      // get current cart
      _data.read('carts', userData.email, (err, cartData) => {
        if (!err && cartData &&
            cartData.items !== undefined && cartData.items.length > 0) {
          resource._createOrder(cartData, userData, paymentData, (err, orderObj) => {
            if (!err) {
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
                          // enqueue receipt to be sent later
                          worker.performLater(
                            'OrderReceiptEmail',
                            { orderId: orderObj.id },
                            (err) => {
                              if (!err) {
                                cb(201, orderObj);
                              } else {
                                cb(500, { 'Error': 'Error enqueuing receipt email: ' + err });
                              }
                            }
                          );
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
            } else {
              cb(500, { 'Error' : 'Failed to create order: ' + err });
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
// given cart, user and payment data, creates and stores an order
resource._createOrder = (cartData, userData, paymentData, cb) => {
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
    stripe_charge_id: null, // will be added later
    items: orderItems,
    total_price: orderItems.reduce(
      (acc, item) => { return acc + (item.price_cents * item.quantity); }, 0
    )
  };

  stripeHelpers.createStripeToken(
    paymentData.number,
    paymentData.exp_month,
    paymentData.exp_year,
    paymentData.cvc,
    (err, stripe_token_id) => {
      if (!err) {
        stripeHelpers.createStripeCharge(
          stripe_token_id,
          orderObj.total_price,
          (err, stripe_charge_id) => {
            if (!err) {
              orderObj.stripe_charge_id = stripe_charge_id;
              cb(false, orderObj);
            } else {
              cb('Error placing charge: ' + err);
            }
          }
        );
      } else {
        cb('Error creating stripe token: ' + err);
      }
    }
  );
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
