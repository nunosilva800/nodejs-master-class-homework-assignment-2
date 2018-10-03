const server = require('./lib/server');

let app = {};

app.init = () => {
  // start server
  server.init();
};

app.init();

module.exports = app;
