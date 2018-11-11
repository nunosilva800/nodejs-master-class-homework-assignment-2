const https = require('https');
const querystring = require('querystring');
const util = require('util');
const debug = util.debuglog('stripe');

const helpers = require('./helpers');
const config = require('./config');

let stripeHelpers = {};

// helper function to create a stripe token:
// https://stripe.com/docs/api/tokens/create_card?lang=curl
stripeHelpers.createStripeToken = (number, exp_month, exp_year, cvc, cb) => {
  const postData = querystring.stringify({
    'card[number]' : number,
    'card[exp_month]' : exp_month,
    'card[exp_year]' : exp_year,
    'card[cvc]' : cvc
  });
  // construct the request
  let requestDetails = {
    'protocol' : 'https:',
    'hostname' : 'api.stripe.com',
    'method' : 'POST',
    'path' : '/v1/tokens',
    'auth': config.stripe.publishableKey + ':',
    'headers' : {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  // instantiate the request object
  let req = https.request(requestDetails, (res) => {
    res.setEncoding('utf8');
    res.on('data', (data) => {
      const dataObj = helpers.parseJsonToObject(data);
      debug('Stripe create token response: ', dataObj);
      if (dataObj.id) {
        cb(false, dataObj.id);
      } else {
        cb('Missing ID from stripe token response');
      }
    });
  });
  // bind to the error event so it does not get thrown
  req.on('error', (err) => {
    cb(err);
  });
  req.write(postData);
  req.end();
};

// helper function to create a stripe charge:
// https://stripe.com/docs/api/charges/create?lang=curl
stripeHelpers.createStripeCharge = (stripe_token_id, amount, cb) => {
  const postData = querystring.stringify({
    source: stripe_token_id,
    amount: amount,
    currency: 'usd',
    description: 'Enjoy your pizza!'
  });
  // construct the request
  let requestDetails = {
    'protocol' : 'https:',
    'hostname' : 'api.stripe.com',
    'method' : 'POST',
    'path' : '/v1/charges',
    'auth': config.stripe.secretKey + ':',
    'headers' : {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  // instantiate the request object
  let req = https.request(requestDetails, (res) => {
    res.setEncoding('utf8');
    res.on('data', (data) => {
      const dataObj = helpers.parseJsonToObject(data);
      debug('Stripe create charge response: ', dataObj);
      if (dataObj.id) {
        cb(false, dataObj.id);
      } else {
        cb('Missing ID from stripe charge response');
      }
    });
  });
  // bind to the error event so it does not get thrown
  req.on('error', (err) => {
    cb(err);
  });
  req.write(postData);
  req.end();
};

module.exports = stripeHelpers;
