const server = require('./lib/server');
const worker = require('./lib/worker');

let app = {};

app.init = () => {
  // start server
  server.init();

  // start worker
  worker.init();
};

app.init();

module.exports = app;
