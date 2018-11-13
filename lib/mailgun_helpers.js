const https = require('https');
const querystring = require('querystring');
const util = require('util');
const debug = util.debuglog('mailgun');

const config = require('./config');

let mailgunHelpers = {};

// helper function to send an order receipt via email
// https://documentation.mailgun.com/en/latest/quickstart-sending.html#send-via-api
mailgunHelpers.sendOrderReceipt = (order, cb) => {
  let emailText = "Greetings! Here's the receipt for your order:\n\n"
  emailText += `Order ID: ${order.id}\n`;
  order.items.forEach((item) => {
    emailText += `${item.quantity}x ${item.name} (${item.size}) - `
    emailText += `$${item.price_cents * 0.01}\n`;
  });
  emailText += `\nTotal: $${order.total_price * 0.01}.\n\n`;
  emailText += `Enjoy your pizza!`;

  const postData = querystring.stringify({
    'from' : 'postmaster@' + config.mailgun.domain,
    'to' : order.email,
    'subject' : 'Receipt for your pizza order!',
    'text' : emailText
  });
  // construct the request
  let requestDetails = {
    'protocol' : 'https:',
    'hostname' : 'api.mailgun.net',
    'method' : 'POST',
    'path' : '/v3/' + config.mailgun.domain + '/messages',
    'auth': 'api:' + config.mailgun.apiKey,
    'headers' : {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(postData)
    }
  };
  // instantiate the request object
  let req = https.request(requestDetails, (res) => {
    let status = res.statusCode;
    if (status == 200 || status == 201) {
      cb(false); // no error
    } else {
      cb('Status code returned by Mailgun was: ' + status);
    }
  });
  // bind to the error event so it does not get thrown
  req.on('error', (err) => {
    cb(err);
  });
  req.write(postData);
  req.end();
};

module.exports = mailgunHelpers;
