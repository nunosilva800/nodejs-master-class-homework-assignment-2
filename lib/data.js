// library for storing and editing data

const fs = require('fs');
const path = require('path');

const helpers = require('./helpers');

var lib = {};

lib.baseDir = path.join(__dirname, '../.data/');

// non-blocking function to ensure some dir exists
// use this only during app init phase
lib.ensureDirExists = (dir, mask, cb) => {
  if (typeof mask == 'function') { // allow the `mask` parameter to be optional
    cb = mask;
    mask = 0o777;
  }
  fs.mkdir(lib.baseDir + dir, mask, (err) => {
    if (err) {
      // ignore the error if the folder already exists
      if (err.code == 'EEXIST') cb(false);
      else cb(err); // something else went wrong
    } else {
      cb(false); // successfully created folder
    }
  });
};

// write data to a file
lib.create = (dir, filename, data, cb) => {
  // open file for writing
  fs.open(
    lib.baseDir + dir + '/' + filename + '.json', 'wx',
    (err, fileDescriptor) => {
      if(!err && fileDescriptor) {
        // convert data to string
        const stringData = JSON.stringify(data);

        // write to file anc close it
        fs.writeFile(fileDescriptor, stringData, (err) => {
          if(!err) {
            fs.close(fileDescriptor, (err) => {
              if (!err) {
               cb(false);
              } else {
               cb('Error closing file!');
              }
            });
          } else {
            cb('Error writing to new file!');
          }
        });
      } else {
        cb('Could not create the new file, it may already exist!');
      }
    }
  );
  //
};

// read data from file
lib.read = (dir, filename, cb) => {
  fs.readFile(
    lib.baseDir + dir + '/' + filename + '.json', 'utf8',
    (err, data) => {
      if (!err && data) {
        cb(false, helpers.parseJsonToObject(data));
      } else {
        cb(err, data);
      }
    }
  );
};

// update a file
lib.update = (dir, filename, data, cb) => {
  // open file for writing
  fs.open(
    lib.baseDir + dir + '/' + filename + '.json', 'r+',
    (err, fileDescriptor) => {
      if(!err && fileDescriptor) {
        // convert data to string
        const stringData = JSON.stringify(data);

        // truncate the file contents
        fs.truncate(fileDescriptor, (err) => {
          if(!err) {
            // write to file and close it
            fs.writeFile(fileDescriptor, stringData, (err) => {
              if(!err) {
                fs.close(fileDescriptor, (err) => {
                  if (!err) {
                   cb(false);
                  } else {
                   cb('Error closing file!');
                  }
                })
              } else {
                cb('Error writing to existing file!');
              }
            });
          } else {
            cb('Error truncating file!');
          }
        });
      } else {
        cb('Could not open the file for update, it may not exist yet!');
      }
    }
  );
};

// delete a file
lib.delete = (dir, filename, cb) => {
  // unlink file (aka remove)
  fs.unlink(
    lib.baseDir + dir + '/' + filename + '.json',
    (err) => {
      cb(err);
    }
  );
};

// list all the items in a dir
lib.list = (dir, cb) => {
  fs.readdir(`${lib.baseDir}${dir}/`, (err, data) => {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach(
        (filename) => {
          trimmedFileNames.push(filename.replace('.json', ''));
        }
      );
      cb(false, trimmedFileNames);
    } else {
      cb(err, data);
    }
  });
};

module.exports = lib;
