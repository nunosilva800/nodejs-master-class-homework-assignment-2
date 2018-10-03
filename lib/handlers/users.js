// handlers for users
const _data = require('../data');
const helpers = require('../helpers');
const config = require('../config');
const auth = require('../authentication');

let resource = {};

// Required fields:
// - name: string
// - email: string
// - address: string
// - password: string
// - tosAgreement: boolean
resource.post = (data, cb) => {
  let name = null;
  if (typeof(data.payload.name) == 'string' &&
      data.payload.name.trim().length > 0) {
    name = data.payload.name.trim();
  }
  // TODO: validate email address format
  let email = null;
  if (typeof(data.payload.email) == 'string' &&
      data.payload.email.trim().length > 0) {
    email = data.payload.email.trim();
  }
  let address = null;
  if (typeof(data.payload.address) == 'string' &&
      data.payload.address.trim().length > 0) {
    address = data.payload.address.trim();
  }
  let password = null;
  if (typeof(data.payload.password) == 'string' &&
      data.payload.password.trim().length > 0) {
    password = data.payload.password.trim();
  }
  let tosAgreement = null;
  if (typeof(data.payload.tosAgreement) == 'boolean' &&
      data.payload.tosAgreement == true) {
    tosAgreement = true;
  }
  if (!(name && email && address && password && tosAgreement)) {
    return cb(400, { 'Error' : 'Missing required fields' });
  }

  // Ensure user does not exist already
  _data.read('users', email, (err, data) => {
    if (err) {
      // hash the password
      const hashedPassword = helpers.hash(password);
      if (hashedPassword) {
        // create user obj
        const userObj = {
          'name' : name,
          'email' : email,
          'address' : address,
          'hashedPassword' : hashedPassword,
          'tosAgreement' : tosAgreement
        };
        // store user to file
        // TODO: storing the filename with email might not be compatible with
        // all OSs
        _data.create('users', email, userObj, (err) => {
          if (!err) {
            cb(201);
          } else {
            console.log(err);
            cb(500, { 'Error' : 'Could not create the new user: ' + err });
          }
        });
      } else {
        cb(500, { 'Error' : 'Could not hash user password!' } );
      }
    } else {
      cb(400, { 'Error' : 'User with that email already exists' });
    }
  });
};

// Requires `token` header for authentication
resource.get = (data, cb) => {
  auth.currentUserEmail(data.headers.token, (email) => {
    if (email) {
      // lookup user
      _data.read('users', email, (err, data) => {
        if (!err && data) {
          // remove hashed password before returning
          delete data.hashedPassword;
          cb(200, data);
        } else {
          cb(404);
        }
      });
    } else {
      cb(403, { 'Error' : 'Unauthorized' });
    }
  });
};

// Required fields (at least one is required):
// - name: string
// - address: string
// - password: string
// Requires `token` header for authentication
resource.put = (data, cb) => {
  let name = null;
  if (typeof(data.payload.name) == 'string' &&
      data.payload.name.trim().length > 0) {
    name = data.payload.name.trim();
  }
  let address = null;
  if (typeof(data.payload.address) == 'string' &&
      data.payload.address.trim().length > 0) {
    address = data.payload.address.trim();
  }
  let password = null;
  if (typeof(data.payload.password) == 'string' &&
      data.payload.password.trim().length > 0) {
    password = data.payload.password.trim();
  }
  if (!(name || address || password)) {
    return cb(400, { 'Error' : 'Missing required fields' });
  }

  auth.currentUserEmail(data.headers.token, (email) => {
    if (email) {
      // lookup user
      _data.read('users', email, (err, data) => {
        if (!err && data) {
          // lookup the user
          _data.read('users', email, (err, userData) => {
            if (!err && userData) {
              // update fields
              if (name) { userData.name = name; }
              if (address) { userData.address = address; }
              if (password) {
                userData.hashedPassword = helpers.hash(password);
              }
              // Store the updated model
              _data.update('users', email, userData, (err) => {
                if (!err) {
                  delete userData.hashedPassword;
                  cb(200, userData);
                } else {
                  console.log(err);
                  cb(500, { 'Error' : 'Could not update the user' });
                }
              });
            } else {
              cb(400, { 'Error' : 'The specified user does not exist' });
            }
          });
        } else {
          cb(404);
        }
      });
    } else {
      cb(403, { 'Error' : 'Unauthorized' });
    }
  });
};

// Requires `token` header for authentication
resource.delete = (data, cb) => {
  auth.currentUserEmail(data.headers.token, (email) => {
    if (email) {
      // lookup user
      _data.read('users', email, (err, userData) => {
        if (!err && userData) {
          _data.delete('users', email, (err) => {
            if (!err) {
              // TODO: delete data associated with user
              cb(200);
            } else {
              cb(500, { 'Error' : 'User could not be deleted' });
            }
          });
        } else {
          cb(400, { 'Error' : 'User not found' });
        }
      });
    } else {
      cb(403, { 'Error' : 'Unauthorized' });
    }
  });
};

_data.ensureDirExists('users', (err) => {
  if (err) {
    console.log('Error initializing users data dir!', err);
    process.exit(1);
  }
});

module.exports = resource;
