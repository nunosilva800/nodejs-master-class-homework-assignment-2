// handlers for menu
const auth = require('../authentication');

let resource = {};

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
    { 'id' : '1',  'name' : 'Margherita',  'size' : 'S', 'unit_price': '$10' },
    { 'id' : '2',  'name' : 'Margherita',  'size' : 'M', 'unit_price': '$13' },
    { 'id' : '3',  'name' : 'Margherita',  'size' : 'L', 'unit_price': '$15' },
    { 'id' : '4',  'name' : 'Pepperoni',   'size' : 'S', 'unit_price': '$10' },
    { 'id' : '5',  'name' : 'Pepperoni',   'size' : 'M', 'unit_price': '$13' },
    { 'id' : '6',  'name' : 'Pepperoni',   'size' : 'L', 'unit_price': '$15' },
    { 'id' : '7',  'name' : 'Tropical',    'size' : 'S', 'unit_price': '$10' },
    { 'id' : '8',  'name' : 'Tropical',    'size' : 'M', 'unit_price': '$13' },
    { 'id' : '9',  'name' : 'Tropical',    'size' : 'L', 'unit_price': '$15' },
    { 'id' : '10', 'name' : 'Four-Cheese', 'size' : 'S', 'unit_price': '$10' },
    { 'id' : '11', 'name' : 'Four-Cheese', 'size' : 'M', 'unit_price': '$13' },
    { 'id' : '12', 'name' : 'Four-Cheese', 'size' : 'L', 'unit_price': '$15' }
  ]
};

module.exports = resource;
