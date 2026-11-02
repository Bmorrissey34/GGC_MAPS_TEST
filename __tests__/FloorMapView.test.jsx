import React from 'react';
import { render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FloorMapView from '../components/FloorMapView';

beforeEach(() => {
  jest.resetAllMocks();

  const svg = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g id="B-2210" class="room-group">
        <rect class="room" x="10" y="10" width="30" height="20"/>
        <text class="label" x="12" y="24">2210</text>
      </g>
    </svg>
  `;
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, text: () => Promise.resolve(svg) })
  );
});

test('loads floor svg and activates room on click', async () => {
  render(<FloorMapView src="/fake.svg" />);
  await waitFor(() => expect(document.querySelector('svg')).toBeInTheDocument());
  const room = document.querySelector('g.room-group');
  await userEvent.click(room);
  expect(room).toHaveClass('active-room');
});

test('production map requests include the GitHub Pages base path exactly once', async () => {
  const previousEnvironment = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    render(<FloorMapView src="/BuildingMaps/A/L1.svg" />);
    await waitFor(() => expect(document.querySelector('svg')).toBeInTheDocument());
    expect(global.fetch).toHaveBeenCalledWith('/GGC_MAPS_TEST/BuildingMaps/A/L1.svg', { cache: 'no-cache' });
  } finally {
    process.env.NODE_ENV = previousEnvironment;
  }
});
