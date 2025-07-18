'use strict';

const path = require('path');
const zlib = require('zlib');
const winston = require('winston');
const { LoggingWinston } = require('@google-cloud/logging-winston');

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

      // Create a Google Cloud Logging Winston transport
      const loggingWinston = new LoggingWinston({
        credentials: JSON.parse(
          process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
        ),
        projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
        logName: process.env.GOOGLE_CLOUD_LOG_NAME || 'lambda',
        resource: {
          type: 'aws_lambda_function',
          labels: {
            function_name: context.functionName,
          },
        },
      });

      // Create a Winston logger with Google Cloud Logging transport
      const logger = winston.createLogger({
        transports: [loggingWinston],
        defaultMeta: {
          hostname: logGroup.name, // e.g. 'bertly-dev-app'
          program: logGroup.dir.replace('/aws/', ''), // e.g. 'lambda'
        },
      });

      // Forward each of the log messages to Google Cloud Logging.
      json.logEvents.forEach((log) => logger.info(log.message));

      // Ensure all logs are sent to Google Cloud Logging
      // Google Cloud Logging Winston transport handles batching automatically
      // We'll add a small delay to ensure logs are processed
      setTimeout(() => {
        callback(null);
      }, 100);
    }
  });
};
