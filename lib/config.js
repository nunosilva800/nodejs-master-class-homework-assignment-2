// create and export config vars

var environments = {};

environments.development = {
  'httpPort' : 3000,
  'httpsPort' : 3001,
  'envName' : 'development',
  'useHttps' : false,
  'hashingSecret' : 'thisIsASecret',
  'maxChecks' : 5,
  'stripe' : {
    'publishableKey' : 'pk_test_rTz8ETPLGFF4i6ITZLA7Vtxx',
    'secretKey' : 'sk_test_bUWOKbNLufyfuzkCiY3XlGs2'
  }
};

environments.production = {
  'httpPort' : 5000,
  'httpsPort' : 5001,
  'envName' : 'production',
  'useHttps' : true,
  'hashingSecret' : 'thisIsASecret',
  'maxChecks' : 5,
  'stripe' : {
    'publishableKey' : '',
    'secretKey' : ''
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
