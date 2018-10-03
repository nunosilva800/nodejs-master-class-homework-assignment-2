// create and export config vars

var environments = {};

environments.development = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'development',
  'useHttps' : false,
  'hashingSecret' : 'thisIsASecret',
  'maxChecks' : 5,
  'twilio' : {
    'accountSid' : 'ACb32d411ad7fe886aac54c665d25e5c5d',
    'authToken' : '9455e3eb3109edc12e3d8c92768f7a67',
    'fromPhone' : '+15005550006'
  }
};

environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'useHttps' : true,
  'hashingSecret' : 'thisIsASecret',
  'maxChecks' : 5,
  'twilio' : {
    'fromPhone' : '',
    'accountSid' : '',
    'accountToken' : ''
  }
};

var currentEnvironment = '';
if(typeof(process.env.NODE_ENV) == 'string') {
  currentEnvironment = process.env.NODE_ENV.toLowerCase();
}

var environmentToExport = environments.development;
if(typeof(environments[currentEnvironment]) == 'object') {
  environmentToExport = environments[currentEnvironment];
}

module.exports = environmentToExport;
