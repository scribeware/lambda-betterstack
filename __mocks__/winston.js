const winston = jest.genMockFromModule('winston');

// Mock logger that we can spy on later.
const info = jest.fn();
const close = jest.fn();

// Mock createLogger for Winston v3
winston.createLogger = jest.fn().mockImplementation(() => {
  return { info, close };
});

module.exports = winston;
module.exports.mockInfo = info;
module.exports.mockClose = close;
