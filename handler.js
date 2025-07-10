'use strict';

const path = require('path');
const zlib = require('zlib');
const winston = require('winston');
const { Logtail } = require('@logtail/node');
const { LogtailTransport } = require('@logtail/winston');

module.exports.log = (event, context, callback) => {
  // Parse incoming Cloudwatch logs, which are base64-encoded & gzipped:
  const payload = Buffer.from(event.awslogs.data, 'base64');
  zlib.gunzip(payload, (err, result) => {
    if (err) {
      callback(err);
    } else {
      const json = JSON.parse(result.toString('utf8'));

      // Parse a human-readable hostname & program from the log group.
      const logGroup = path.parse(json.logGroup);

      // Create a Logtail client
      const logtail = new Logtail(process.env.LOGTAIL_SOURCE_TOKEN, {
        endpoint: process.env.LOGTAIL_ENDPOINT,
      });

      // Create a Winston logger with Logtail transport
      const logger = winston.createLogger({
        transports: [new LogtailTransport(logtail)],
        defaultMeta: {
          hostname: logGroup.name, // e.g. 'bertly-dev-app'
          program: logGroup.dir.replace('/aws/', ''), // e.g. 'lambda'
        },
      });

      // Forward each of the log messages to Logtail.
      json.logEvents.forEach((log) => logger.info(log.message));

      // Ensure all logs are sent to Logtail
      logtail.flush().then(() => {
        callback(null);
      }).catch((err) => {
        callback(err);
      });
    }
  });
};
