// handlers for menu
const auth = require('../authentication');

let resource = {
  acceptableMethods: ['get']
};

// Requires `token` header for authentication
resource.get = (data, cb) => {
  auth.currentUserEmail(data.headers.token, (email) => {
    if (email) {
      cb(200, resource._menu);
    } else {
      cb(403, { 'Error' : 'Unauthorized' });
    }
  });
};

// hardcoded menu
resource._menu = {
  'items' : [
    { 'id' : '1',  'name' : 'Margherita',  'size' : 'S', 'price_cents': 1000 },
    { 'id' : '2',  'name' : 'Margherita',  'size' : 'M', 'price_cents': 1300 },
    { 'id' : '3',  'name' : 'Margherita',  'size' : 'L', 'price_cents': 1500 },
    { 'id' : '4',  'name' : 'Pepperoni',   'size' : 'S', 'price_cents': 1000 },
    { 'id' : '5',  'name' : 'Pepperoni',   'size' : 'M', 'price_cents': 1300 },
    { 'id' : '6',  'name' : 'Pepperoni',   'size' : 'L', 'price_cents': 1500 },
    { 'id' : '7',  'name' : 'Tropical',    'size' : 'S', 'price_cents': 1000 },
    { 'id' : '8',  'name' : 'Tropical',    'size' : 'M', 'price_cents': 1300 },
    { 'id' : '9',  'name' : 'Tropical',    'size' : 'L', 'price_cents': 1500 },
    { 'id' : '10', 'name' : 'Four-Cheese', 'size' : 'S', 'price_cents': 1000 },
    { 'id' : '11', 'name' : 'Four-Cheese', 'size' : 'M', 'price_cents': 1300 },
    { 'id' : '12', 'name' : 'Four-Cheese', 'size' : 'L', 'price_cents': 1500 }
  ]
};

// returns the menu item given an id
resource.find = (id) => {
  return resource._menu.items.find(
    (el) => { return el.id == id.toString(); }
  );
};

module.exports = resource;
