const LoggingWinston = jest.fn().mockImplementation(() => {
  return {
    log: jest.fn(),
    write: jest.fn(),
  };
});

module.exports = { LoggingWinston };
