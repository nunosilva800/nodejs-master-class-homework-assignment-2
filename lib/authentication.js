// module to handle API authentication
const _data = require('./data');

let authentication = {};

// Verify if a given token id is valid
// and return email of its user
authentication.currentUserEmail = (tokenId, cb) => {
  // get the token from the headers
  tokenId = typeof(tokenId) == 'string' ? tokenId : null;
  if (!tokenId) { cb(null); }

  // lookup the token
  _data.read('tokens', tokenId, (err, tokenData) => {
    if (!err && tokenData) {
      // check that token has not expired
      if (tokenData.expires >= Date.now()) {
        // return the user id (email)
        cb(tokenData.email);
      } else {
        cb(null);
      }
    } else {
      console.log('Error looking up token', err);
      cb(null);
    }
  });
};

// Verify if a given token id is valid
// and return user model
authentication.currentUser = (tokenId, cb) => {
  // get the token from the headers
  tokenId = typeof(tokenId) == 'string' ? tokenId : null;
  if (!tokenId) { cb(null); }

  // lookup the token
  _data.read('tokens', tokenId, (err, tokenData) => {
    if (!err && tokenData) {
      // check that token has not expired
      if (tokenData.expires >= Date.now()) {
        // lookup user
        _data.read('users', tokenData.email, (err, userData) => {
          if (!err && userData) {
            // return the user
            cb(userData);
          } else {
            cb(null);
          }
        });
      } else {
        cb(null);
      }
    } else {
      console.log('Error looking up token', err);
      cb(null);
    }
  });
};

module.exports = authentication;
