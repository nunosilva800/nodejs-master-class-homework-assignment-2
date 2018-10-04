// handlers for tokens
const _data = require('../data');
const helpers = require('../helpers');

let resource = {
  acceptableMethods: ['post', 'get', 'put', 'delete']
};

// Required fields:
// - email: string
// - password: string
resource.post = (data, cb) => {
  let email = null;
  if (typeof(data.payload.email) == 'string' &&
      data.payload.email.trim().length > 0) {
    email = data.payload.email.trim();
  }
  let password = null;
  if (typeof(data.payload.password) == 'string' &&
      data.payload.password.trim().length > 0) {
    password = data.payload.password.trim();
  }
  if (!(email && password)) {
    return cb(400, { 'Error' : 'Missing required fields' });
  }
  // look up user mathing email
  _data.read('users', email, (err, userData) => {
    if (!err && userData) {
      // hash the sent password and compare with version stored
      const hashedPassword = helpers.hash(password);
      if (hashedPassword == userData.hashedPassword) {
        // create a new token with random name
        // set expiration date 1 hour in the future
        // store user to file
        const tokenId = helpers.createRandomString(20);
        const expires = Date.now() + 1000 * 60 * 60; // 1 hour
        const tokenObj = {
          'email' : email,
          'id' : tokenId,
          'expires' : expires
        };
        // store the token
        _data.create('tokens', tokenId, tokenObj, (err) => {
          if (!err) {
            cb(200, tokenObj);
          } else {
            console.log(err);
            cb(500, { 'Error' : 'Could not create the new token: ' + err });
          }
        });
      } else {
        cb(400, { 'Error' : 'Password is wrong' });
      }
    } else {
      cb(400, { 'Error' : 'Could not find the specified user' });
    }
  });
};

// Required fields:
// - id: string
resource.get = (data, cb) => {
  // check that id is valid
  let id = null;
  if (typeof(data.queryStringObject.id) == 'string' &&
      data.queryStringObject.id.length == 20) {
    id = data.queryStringObject.id;
  }
  if (!id) {
    return cb(400, { 'Error' : 'Missing required fields' });
  }
  // lookup token
  _data.read('tokens', id, (err, data) => {
    if (!err && data) {
      cb(200, data);
    } else {
      cb(404);
    }
  });
};

// Required fields:
// - id: string
// - extend: boolean
resource.put = (data, cb) => {
  // check that id is valid
  let id = null;
  if (typeof(data.payload.id) == 'string' &&
      data.payload.id.length == 20) {
    id = data.payload.id;
  }
  let extend = null;
  if (typeof(data.payload.extend) == 'boolean' &&
      data.payload.extend == true) {
    extend = true;
  }
  if (!(id && extend)) {
    return cb(400, { 'Error' : 'Missing required fields' });
  }
  // lookup token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // check to ensure token as not expired already
      if (tokenData.expires >= Date.now()) {
        // renew the expiration for +1 hour
        tokenData.expires = Date.now() + 1000 * 60 * 60;
        // Store the updated model
        _data.update('tokens', id, tokenData, (err) => {
          if (!err) {
            cb(200, tokenData);
          } else {
            console.log(err);
            cb(500, { 'Error' : 'Could not update the token' });
          }
        });
      } else {
        cb(400, { 'Error' : 'The specified token has already expired' });
      }
    } else {
      cb(404);
    }
  });
};

// Required fields:
// - id: string
resource.delete = (data, cb) => {
  // check that id is valid
  let id = null;
  if (typeof(data.queryStringObject.id) == 'string' &&
      data.queryStringObject.id.length == 20) {
    id = data.queryStringObject.id;
  }
  if (!id) {
    return cb(400, { 'Error' : 'Missing required fields' });
  }
  // lookup token
  _data.read('tokens', id, (err, data) => {
    if (!err && data) {
      _data.delete('tokens', id, (err) => {
        if (!err) {
          cb(200);
        } else {
          cb(500, { 'Error' : 'Token could not be deleted' });
        }
      });
    } else {
      cb(400, { 'Error' : 'Token not found' });
    }
  });
};

_data.ensureDirExists('tokens', (err) => {
  if (err) {
    console.log('Error initializing tokens data dir!', err);
    process.exit(1);
  }
});

module.exports = resource;
