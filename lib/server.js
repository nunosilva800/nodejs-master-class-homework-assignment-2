const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const fs = require('fs');
const path = require('path');
const util = require('util');
const debug = util.debuglog('server');

const config = require('./config');
const handlers = require('./handlers');
const helpers = require('./helpers');

let server = {};

// instantiate the http server
server.httpServer = http.createServer(
  (req, res) => server.unifiedServer(req, res)
);

// instantiate the https server
if (config.useHttps) {
  const httpsServerOptions = {
    'key' : fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert' : fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
  };
  server.httpsServer = https.createServer(
    httpsServerOptions,
    (req, res) => server.unifiedServer(req, res)
  );
}

// all the server logic for http and https
server.unifiedServer = (req, res) => {
  // get URL and parse it
  const parsedUrl = url.parse(req.url, true);

  // get the path
  const path = parsedUrl.pathname;
  const trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // parse query string into an object
  const queryString = parsedUrl.query;

  // get http method
  const method = req.method.toLowerCase();

  // get the headers as an object
  const headers = req.headers;

  // get the payload, if any
  const decoder = new StringDecoder('utf-8');
  let buffer = '';
  req.on('data', data => buffer += decoder.write(data));
  req.on('end', () => {
    buffer += decoder.end();

    // log the request
    debug(
      '\x1b[36m%s\x1b[0m',
      `Started ${method} for: /${trimmedPath} with params:`,
      queryString
    );
    debug('Payload: ', buffer);
    debug('Headers: ', headers);

    // get the proper handler
    let chosenHandler = '';
    if(typeof(server.router[trimmedPath]) !== 'undefined') {
      chosenHandler = server.router[trimmedPath];
    } else {
      chosenHandler = handlers.notFound;
    }

    // construct data object to send to handler
    const data = {
      'trimmedPath' : trimmedPath,
      'queryStringObject' : queryString,
      'method' : method,
      'headers' : headers,
      'payload' : helpers.parseJsonToObject(buffer)
    };

    // route the request to the handler
    chosenHandler(data, (statusCode, payload) => {
      // use the statusCode or default
      statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
      // use the payload or default to empty object
      payload = typeof(payload) == 'object' ? payload : {};

      // convert payload into string
      const payloadString = JSON.stringify(payload);

      // return the response
      res.setHeader('Content-Type', 'application/json');
      res.writeHead(statusCode);
      res.end(payloadString);

      // log the response
      debug(
        '\x1b[36m%s\x1b[0m',
        `[${statusCode}]`,
        payloadString,
        '\n'
      );
    });

  });
};

// router definition
server.router = {
  'ping'   : handlers.ping,
  'users'  : handlers.users,
  'tokens' : handlers.tokens,
  'menu'   : handlers.menu,
  'cart'   : handlers.cart,
  'orders' : handlers.orders
};

server.init = () => {
  // start the http server
  server.httpServer.listen(
    config.httpPort,
    () => console.log(
      '\x1b[36m%s\x1b[0m',
      `Starting ${config.envName} environment on port ${config.httpPort}`
    )
  );

  // start the https server
  if (server.httpsServer) {
    server.httpsServer.listen(
      config.httpsPort,
      () => console.log(
        '\x1b[35m%s\x1b[0m',
        `Starting ${config.envName} environment on port ${config.httpsPort}`
      )
    );
  }
};

module.exports = server;
