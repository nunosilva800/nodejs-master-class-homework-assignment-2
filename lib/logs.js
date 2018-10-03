// Lib for storing and rotating logs

let fs = require('fs');
let path = require('path');
let zlib = require('zlib');

let lib = {};

lib.baseDir = path.join(__dirname, '../.logs/');

lib.append = (file, str, cb) => {
  // open the file for appending
  fs.open(`${lib.baseDir}${file}.log`, 'a', (err, fd) => {
    if (!err && fd) {
      fs.appendFile(fd, str + '\n', (err) => {
        if (!err) {
          fs.close(fd, (err) => {
            if (!err) {
              cb(false);
            } else {
              cb('Error closing file that was appended');
            }
          });
        } else  {
          cb('Error appending file');
        }
      });
    } else {
      cb('Could not open file for appending');
    }
  });
};

lib.list = (includeCompressedLogs, cb) => {
  fs.readdir(lib.baseDir, (err, data) => {
    if (!err && data && data.length > 0) {
      let trimmedFileNames = [];
      data.forEach((fileName) => {
        // add the log files
        if (fileName.indexOf('.log') > -1) {
          trimmedFileNames.push(fileName.replace('.log', ''));
        }
        // add on the .gz files
        if (fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
          trimmedFileNames.push(fileName.replace('.gz.b64', ''));
        }
      });
      cb(false, trimmedFileNames);
    } else {
      cb(err, data);
    }
  });
};

// compress the contentes of one .log file into a .gz.b64 file withing the same
// directory
lib.compress = (logId, newFileId, cb) => {
  let sourceFile = logId + '.log';
  let destFile = newFileId + '.gz.b64';

  // read the source file
  fs.readFile(lib.baseDir + sourceFile, 'utf8', (err, inputString) => {
    if (!err && inputString) {
      // compress the data using gzip
      zlib.gzip(inputString, (err, buffer) => {
        if (!err && buffer) {
          // send the data to the destination file
          fs.open(lib.baseDir + destFile, 'wx', (err, fd) => {
            if (!err && fd) {
              // write to file
              fs.writeFile(fd, buffer.toString('base64'), (err) => {
                if (!err) {
                  fs.close(fd, (err) => {
                    if (!err) {
                      cb(false);
                    } else {
                      cb(err);
                    }
                  });
                } else {
                  cb(err);
                }
              });
            } else {
              cb(err);
            }
          });
        } else {
          cb(err);
        }
      });
    } else {
      cb(err);
    }
  });
};

// decompress contentes of a .gz.b64 file into a string variable
lib.decompress = (logId, cb) => {
  let fileName = fileId + '.gs.b64';
  fs.readFile(lib.baseDir + fileName, 'utf8', (err, str) => {
    if (!err && str) {
      // decompress data
      let inputBuffer = Buffer.from(str, 'base64');
      zlib.unzip(inputBuffer, (err, outputBuffer) => {
        if (!err && outputBuffer) {
          let str = outputBuffer.toString();
          cb(false, str);
        } else {
          cb(err);
        }
      });
    } else {
      cb(err);
    }
  });
};

// truncate a log file
lib.truncate = (logId, cb) => {
  fs.truncate(lib.baseDir + logId + '.log', 0, (err) => {
    if (!err) {
      cb(false);
    } else {
      cb(err);
    }
  });
};

module.exports = lib;
