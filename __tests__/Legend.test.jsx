import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Legend from '../components/legend';

beforeEach(() => {
  window.localStorage.clear();
});

test('legend renders with language controls', async () => {
  render(<Legend />);
  expect(screen.getByText(/^legend$/i)).toBeInTheDocument();
  expect(screen.getByRole('group', { name: /language/i })).toBeInTheDocument();
});

test('language toggle switches to ES and persists', async () => {
  render(<Legend />);
  const btnES = screen.getByRole('button', { name: /es/i });
  await userEvent.click(btnES);
  expect(screen.getByText(/edificio acad/i)).toBeInTheDocument();

  render(<Legend />);
 expect(screen.getAllByText(/edificio acad/i)[0]).toBeInTheDocument();
});

test('hover dispatches custom events', async () => {
  const spy = jest.spyOn(window, 'dispatchEvent');
  render(<Legend />);
  const academicRow = screen.getByText(/academic building|edificio acad/i).closest('li');
  await userEvent.hover(academicRow);
  expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'ggcmap-hover' }));
  await userEvent.unhover(academicRow);
  expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'ggcmap-hover-clear' }));
});
