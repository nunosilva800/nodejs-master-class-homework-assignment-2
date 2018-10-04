// handlers for cart
const _data = require('../data');
const auth = require('../authentication');

let resource = {
  acceptableMethods: ['get', 'put', 'delete']
};

// Requires `token` header for authentication
resource.get = (data, cb) => {
  auth.currentUserEmail(data.headers.token, (email) => {
    if (email) {
      // lookup cart
      _data.read('carts', email, (err, cartData) => {
        if (!err && cartData &&
            cartData.items !== undefined && cartData.items.length > 0) {
          cb(200, cartData);
        } else {
          cb(400, { 'Error' : 'Cart is empty!' });
        }
      });
    } else {
      cb(403, { 'Error' : 'Unauthorized' });
    }
  });
};

// Required fields:
// - menu_item_id: string
// - quantity: integer
// Requires `token` header for authentication
resource.put = (data, cb) => {
  let menu_item_id = null;
  if (typeof(data.payload.menu_item_id) == 'string' &&
      data.payload.menu_item_id.trim().length > 0) {
    menu_item_id = data.payload.menu_item_id.trim();
  } else {
    return cb(400, { 'Error' : 'Missing menu_item_id' });
  }
  let quantity = null;
  if (typeof(data.payload.quantity) == 'number' &&
      data.payload.quantity % 1 === 0 &&
      data.payload.quantity != 0) {
    quantity = data.payload.quantity;
  } else {
    return cb(400, { 'Error' : 'Quantity is invalid' });
  }

  auth.currentUserEmail(data.headers.token, (email) => {
    if (email) {
      // lookup the user cart
      _data.read('carts', email, (err, cartData) => {
        if (!err && cartData) {
          // cart exists, update items
          // TODO: validate the menu_item_id
          const idx = cartData.items.findIndex(
            (el) => { return el.menu_item_id == menu_item_id; }
          );
          if (idx > -1) {
            // line item is present, add/remove quantity
            let lineItem = cartData.items[idx];
            lineItem.quantity += quantity;
            // if new quantity is zero or negative, remove the line
            if (lineItem.quantity <= 0) {
              cartData.items.splice(idx, 1);
            }
          } else {
            // line item is not present, add it
            if (quantity <= 0) {
              // abort if quantity is zero or negative
              return cb(400, { 'Error' : 'Quantity is invalid' });
            }
            cartData.items.push(
              { 'menu_item_id' : menu_item_id, 'quantity' : quantity }
            );
          }
          // store updated cart
          _data.update('carts', email, cartData, (err) => {
            if (!err) {
              cb(200, cartData);
            } else {
              console.log(err);
              cb(500, { 'Error' : 'Could not update the cart: ' + err });
            }
          });
        } else {
          // cart does not exist, create a new one
          if (quantity <= 0) {
            // abort if quantity is zero or negative
            return cb(400, { 'Error' : 'Quantity is invalid' });
          }
          let cartObj = {
            'items' : [
              { 'menu_item_id' : menu_item_id, 'quantity' : quantity }
            ]
          };
          _data.create('carts', email, cartObj, (err) => {
            if (!err) {
              cb(201, cartObj);
            } else {
              console.log(err);
              cb(500, { 'Error' : 'Could not create the new cart: ' + err });
            }
          });
        }
      });
    } else {
      cb(403, { 'Error' : 'Unauthorized' });
    }
  });
};

// empties the cart or a single item
// Optional fields:
// - menu_item_id: string
// Requires `token` header for authentication
resource.delete = (data, cb) => {
  let menu_item_id = null;
  if (typeof(data.queryStringObject.menu_item_id) == 'string' &&
      data.queryStringObject.menu_item_id.trim().length > 0) {
    menu_item_id = data.queryStringObject.menu_item_id.trim();
  }

  auth.currentUserEmail(data.headers.token, (email) => {
    if (email) {
      // lookup the user cart
      _data.read('carts', email, (err, cartData) => {
        if (!err && cartData &&
            cartData.items !== undefined && cartData.items.length > 0) {
          if (menu_item_id) {
            // menu_item_id exists, remove this line_item
            const idx = cartData.items.findIndex(
              (el) => { return el.menu_item_id == menu_item_id; }
            );
            if (idx > -1) {
              // line item is present, remove it
              cartData.items.splice(idx, 1);
            }
            // store updated cart
            _data.update('carts', email, cartData, (err) => {
              if (!err) {
                cb(200, cartData);
              } else {
                console.log(err);
                cb(500, { 'Error' : 'Could not update the cart: ' + err });
              }
            });
          } else {
            // delete entire cart
            _data.delete('carts', email, (err) => {
              if (!err) {
                cb(200);
              } else {
                cb(500, { 'Error' : 'Cart could not be deleted' });
              }
            });
          }
        } else {
          cb(400, { 'Error' : 'Cart is empty!' });
        }
      });
    } else {
      cb(403, { 'Error' : 'Unauthorized' });
    }
  });
};

_data.ensureDirExists('carts', (err) => {
  if (err) {
    console.log('Error initializing carts data dir!', err);
    process.exit(1);
  }
});

module.exports = resource;
