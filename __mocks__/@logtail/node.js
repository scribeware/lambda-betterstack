const mockFlush = jest.fn().mockResolvedValue();

const Logtail = jest.fn().mockImplementation(() => {
  return { flush: mockFlush };
});

module.exports = { Logtail };
module.exports.mockFlush = mockFlush;
