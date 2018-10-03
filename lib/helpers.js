// Helpers for various tasks

const crypto = require('crypto');
const querystring = require('querystring');
const https = require('https');

const config = require('./config');

let helpers = {};

// create a SHA256 hash
helpers.hash = (str) => {
  if (typeof(str) == 'string' && str.length > 0) {
    return crypto.createHmac('sha256', config.hashingSecret)
                 .update(str)
                 .digest('hex');
  } else {
    return false;
  }
};

// takes a string and returns a json object or false if err
helpers.parseJsonToObject = (str) => {
  try {
    return JSON.parse(str);
  } catch (err) {
    return {};
  }
};

// create a string of random alphanumeric characters, of a given lengh
helpers.createRandomString = (len) => {
  len = typeof(len) == 'number' && len > 0 ? len : false;
  if (len) {
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let str = '';
    for (let idx = 1; idx <= len; idx++) {
      let randomChar = possibleCharacters.charAt(
        Math.floor(Math.random() * (possibleCharacters.length - 1))
      );
      str += randomChar;
    }
    return str;
  } else {
    return false;
  }
};

// send an SMS message via Twilio
helpers.sendTwilioSms = (_phone, _msg, cb) => {
  // validate parameters
  let phone = null;
  if (typeof(_phone) == 'string' && _phone.trim().length == 10) {
    phone = _phone;
  }
  let msg = null;
  if (typeof(_msg) == 'string' &&
      _msg.trim().length > 0 &&
      _msg.trim().length <= 1600) {
    msg = _msg;
  }
  if (phone && msg) {
    // configure the request payload
    let payload = {
      'From' : config.twilio.fromPhone,
      'To'   : '+1' + phone,
      'Body' : msg
    };
    const stringPayload = querystring.stringify(payload);
    // configure the request details
    let requestDetails = {
      'protocol' : 'https:',
      'hostname' : 'api.twilio.com',
      'method' : 'POST',
      'path' : '/2010-04-01/Accounts/' + config.twilio.accountSid +
               '/Messages.json',
      'auth' : config.twilio.accountSid + ':' + config.twilio.accountToken,
      'headers' : {
        'Content-Type' : 'application/x-www-form-urlencoded',
        'Content-Length' : Buffer.byteLength(stringPayload)
      }
    };
    // instantiate the request object
    let req = https.request(requestDetails, (res) => {
      // grab the status of request
      let status = res.statusCode;
      if (status == 200 || status == 201) {
        cb(false); // no error
      } else {
        cb('Status code returned by Twilio was: ' + status);
      }
    });
    // bind to the error event so it does not get thrown
    req.on('error', (err) => { cb(err); });
    // add the payload
    req.write(stringPayload);
    // end the request (sends the request)
    req.end();
  } else {
    cb('Given parameters were missing or invalid')
  }
};

module.exports = helpers;
