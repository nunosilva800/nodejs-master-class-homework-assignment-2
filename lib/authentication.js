// module to handle API authentication
const _data = require('./data');

let authentication = {};

// Verify if a given token id is currently valid for a given user
authentication.verifyToken = (id, email, cb) => {
  // lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // check that token is for given user and has not expired
      if (tokenData.email == email && tokenData.expires >= Date.now()) {
        cb(true);
      } else {
        cb(false);
      }
    } else {
      cb(false);
    }
  });
};

module.exports = authentication;
