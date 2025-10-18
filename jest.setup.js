// jest.setup.js
import '@testing-library/jest-dom';

// 🧩 Mock Next.js Image component so tests don’t crash
jest.mock('next/image', () => (props) => {
  // eslint-disable-next-line jsx-a11y/alt-text
  return <img {...props} />;
});

// 🧭 Optional: silence React “act()” warnings if they appear
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (/Warning.*not wrapped in act/.test(args[0])) return;
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
