/**
 * Tests:
 * - Campus SVG loads
 * - Click on academic building navigates to /building/[id]
 * - Click on student housing shows “not available” error popup
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CampusMapView from '../components/CampusMapView';
import { useRouter } from 'next/navigation';

jest.mock('next/navigation');

beforeEach(() => {
  jest.resetAllMocks();

  const svg = `
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" data-map-anchor>
      <g id="B" class="building-group">
        <rect id="B" class="building" x="10" y="10" width="30" height="30" />
        <text x="25" y="25">B</text>
      </g>
      <g id="1000" class="building-group student-housing">
        <rect id="1000" class="building" x="60" y="10" width="30" height="30" />
        <text x="75" y="25">Housing</text>
      </g>
    </svg>
  `;
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, text: () => Promise.resolve(svg) })
  );
});

test('loads campus SVG and clicking academic building navigates', async () => {
  const router = useRouter();
  render(<CampusMapView />);

  await waitFor(() => expect(document.querySelector('svg')).toBeInTheDocument());
  const buildingB = document.querySelector('#B.building');
  await userEvent.click(buildingB);
  expect(router.push).toHaveBeenCalledWith('/building/B');
});

test('clicking student housing shows error popup (blocked)', async () => {
  const router = useRouter();
  render(<CampusMapView />);

  await waitFor(() => expect(document.querySelector('svg')).toBeInTheDocument());
  // Instead of querySelector('#1000.building')
  const root = document.getElementById('1000'); // safe even if id starts with a number
  const housing =
    root?.closest('.building-group') ??
    root?.querySelector('.building') ??
    root;

  await userEvent.click(housing);


  expect(router.push).not.toHaveBeenCalled();
  expect(screen.getByText(/student housing layouts/i)).toBeInTheDocument();
  await userEvent.click(screen.getByRole('button', { name: /ok/i }));
  expect(screen.queryByText(/student housing layouts/i)).not.toBeInTheDocument();
});
