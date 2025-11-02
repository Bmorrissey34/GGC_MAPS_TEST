// jest.setup.js
// CommonJS so Jest can parse it without ESM config
require('@testing-library/jest-dom');


jest.mock('next/image', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: (props) =>
      React.createElement('img', {
        ...props,
        // Next/Image requires alt; default to empty for tests
        alt: props.alt ?? '',
      }),
  };
});

// (optional) mock router if your tests navigate
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

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
