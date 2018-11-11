const url = require('url');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const util = require('util');
const debug = util.debuglog('worker');

const _data = require('./data');
const _logs = require('./logs');
const helpers = require('./helpers');

let worker = {};

// enqueues a task to be performed later
worker.performLater = (taskType, taskArguments, cb) => {
  const jobDefinition = worker.jobs[taskType];
  if (typeof(jobDefinition) !== 'function') {
    cb("Error: invalid task definition: " + taskType);
  }
  if (typeof(taskArguments) !== 'object') {
    cb("Error: invalid task arguments: " + taskArguments);
  }

  const taskObj = {
    'id': helpers.createRandomString(20),
    'type': taskType,
    'arguments': taskArguments
  };
  _data.create('tasks', taskObj.id, taskObj, (err) => {
    if (!err) {
      cb(false, taskObj.id);
    } else {
      cb('Could not create task: ' + err);
    }
  });
}

// look up all tasks to perform them
worker.performAllTasks = () => {
  _data.list('tasks', (err, tasks) => {
    if (!err && tasks && tasks.length > 0) {
      tasks.forEach((task) => {
        // read the task data
        _data.read('tasks', task, (err, originalTaskData) => {
          if (!err && originalTaskData) {
            // pass it to the task validator
            worker.validateTask(originalTaskData);
          }
          else {
            debug("Error: could not read a task");
          }
        });
      });
    } else {
      debug("Warning: could not find any tasks to process");
    }
  });
};

worker.validateTask = (originalTaskData) => {
  let taskData = {};
  if (typeof(originalTaskData) == 'object' && originalTaskData !== null) {
    taskData = originalTaskData;
  }
  if (typeof(taskData.id) != 'string' || taskData.id.trim().length != 20) {
    taskData.id = null;
  }
  if (typeof(taskData.type) != 'string') {
    taskData.type = null;
  }
  if (typeof(taskData.arguments) != 'object') {
    taskData.arguments = null;
  }
  // if all tasks pass, pass the data along the next step in the process
  if (taskData.id && taskData.type && taskData.arguments) {
    worker.performTask(taskData);
  } else {
    debug("Error: one of the tasks is not properly formatted, skipping");
  }
};

worker.performTask = (taskData) => {
  const jobDefinition = worker.jobs[taskData.type];
  if (typeof(jobDefinition) === 'function') {
    jobDefinition(
      taskData.arguments,
      (err) => {
        if (!err) {
          _data.delete('tasks', taskData.id, (err) => {
            if (!err) {
              debug("Completed task: ", taskData);
            } else {
              debug("Error deleting completed task: ", taskData);
            }
          });
        } else {
          debug("Error performing task: ", taskData);
        }
      }
    );
  } else {
    debug("Error: invalid task definition: ", taskData);
  }
}

// Holds the job definitions, where tasks are executed
worker.jobs = {
  'OrderReceiptEmail' : (args, cb) => {
    console.log('performing OrderReceiptEmail with ', args);
    cb(false);
  }
};

worker.rotateLogs = () => {
  // list all the (non compressed) log files
  _logs.list(false, (err, logs) => {
    if (!err && logs && logs.length > 0) {
      logs.forEach((logName) => {
        // compress data into a different file
        let logId = logName.replace('.log', '');
        let newFileId = `${logId}-${Date.now()}`;
        _logs.compress(logId, newFileId, (err) => {
          if (!err) {
            // truncate the log
           _logs.truncate(logId, (err) => {
            if (!err) {
              debug('Success truncating logFile');
            } else {
              debug('Error truncating logFile');
            }
           });
          } else {
            debug('Error compression one of log files', err);
          }
        });
      });
    } else {
      debug("Warning: could not find any logs to rotate");
    }
  });
};

// timer to execute the worker process once per minute
worker.initTasksLoop = () => {
  setInterval(() => worker.performAllTasks(), 1000 * 10); // every 10 secs
};

// timer to rotate logs
worker.initLogRotationLoop = () => {
  setInterval(() => worker.rotateLogs(), 1000 * 60 * 60 * 24); // every 24 hours
};

worker.init = () => {
  console.log('\x1b[33m%s\x1b[0m','Background workers are running');

  // execute all tasks immeditaly
  worker.performAllTasks();
  // compress all the logs immediatly
  worker.rotateLogs();

  worker.initTasksLoop();
  worker.initLogRotationLoop();
};

// ensure the tasks dir exists
_data.ensureDirExists('tasks', (err) => {
  if (err) {
    console.log('Error initializing tasks data dir!', err);
    process.exit(1);
  }
});

module.exports = worker;
