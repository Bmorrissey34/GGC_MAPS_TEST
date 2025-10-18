import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Find from '../components/Find';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation');

beforeEach(() => jest.resetAllMocks());

function typeAndFind(value) {
  const input = screen.getByRole('textbox', { name: /find:/i });
  const btn = screen.getByRole('button', { name: /find/i });
  return userEvent.clear(input).then(() =>
    userEvent.type(input, value).then(() => userEvent.click(btn))
  );
}

test('empty search shows validation', async () => {
  render(<Find />);
  await userEvent.click(screen.getByRole('button', { name: /find/i }));
  expect(screen.getByText(/you must enter a search term/i)).toBeInTheDocument();
});

test('building search "b" routes to building B L1', async () => {
  const router = useRouter();
  render(<Find />);
  await typeAndFind('b');
  expect(router.push).toHaveBeenCalledWith('/building/B/L1');
});

test('floor search "b2" routes to /building/B/L2', async () => {
  const router = useRouter();
  render(<Find />);
  await typeAndFind('b2');
  expect(router.push).toHaveBeenCalledWith('/building/B/L2');
});

test('alias "aec" routes to W/L1 with room=1160', async () => {
  const router = useRouter();
  render(<Find />);
  await typeAndFind('aec');
  expect(router.push).toHaveBeenCalledWith('/building/W/L1?room=1160');
});

test('invalid search shows "is not valid"', async () => {
  render(<Find />);
  await typeAndFind('zz999');
  expect(screen.getByText(/zz999 is not valid/i)).toBeInTheDocument();
});

test('help opens modal', async () => {
  render(<Find />);
  await userEvent.click(screen.getByRole('button', { name: /help/i }));
  expect(screen.getByRole('heading', { name: /help/i })).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /close/i }));
  expect(screen.queryByRole('heading', { name: /help/i })).not.toBeInTheDocument();
});
