// Jest runs setup in CJS; use require here
require('@testing-library/jest-dom');

jest.mock('next/image', () => {
  const React = require('react');git
  return {
    __esModule: true,
    default: (props) => {
      const { priority, ...rest } = props; // strip unsupported prop in tests
      // eslint-disable-next-line @next/next/no-img-element
      return React.createElement('img', rest);
    },
  };
});

const originalError = console.error;
const originalDebug = console.debug;

beforeAll(() => {
  console.error = (...args) => {
    const msg = String(args[0] ?? '');
    if (
      /Warning.*not wrapped in act/i.test(msg) ||
      /Received `true` for a non-boolean attribute `priority`/i.test(msg) // <- keep this line exactly
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.debug = jest.fn();
});

afterAll(() => {
  console.error = originalError;
  console.debug = originalDebug;
});
