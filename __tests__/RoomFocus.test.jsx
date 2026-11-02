import React, { createRef } from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ZoomPan from '../components/ZoomPan';
import FloorViewerPage from '../components/pages/FloorViewerPage';
import Find from '../components/Find';
import { requestRoomFocus } from '../lib/eventSystem';

let mockQuery = '';
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(mockQuery),
}));
jest.mock('../components/OverlayHUD', () => () => null);

const originalFetch = global.fetch;
const svg = '<svg viewBox="0 0 1000 800"><g id="room-one" class="room-group"><rect class="room" x="200" y="100" width="40" height="20" /></g><g id="room-two" class="room-group"><rect class="room" x="500" y="300" width="40" height="20" /></g></svg>';
const transform = stage => stage.style.transform.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);

beforeEach(() => {
  mockQuery = '';
  mockPush.mockClear();
  global.fetch = jest.fn(async () => ({ ok: true, text: async () => svg }));
  // Model real screen rectangles, including the current stage transform and SVG sizing.
  jest.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function () {
    const stage = this.closest('.zoompan-stage');
    const [x, y, scale] = stage ? transform(stage) : [0, 0, 1];
    if (this.classList.contains('room')) {
      const left = 10 + x + Number(this.getAttribute('x')) * scale;
      const top = 20 + y + Number(this.getAttribute('y')) * scale;
      return { left, top, width: 40 * scale, height: 20 * scale };
    }
    return { left: 10 + x, top: 20 + y, width: 800 * scale, height: 600 * scale };
  });
});

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function expectCentered(container, id) {
  const target = container.querySelector(`[id="${id}"] .room`);
  const viewport = container.querySelector('.map-viewport').getBoundingClientRect();
  const bounds = target.getBoundingClientRect();
  expect(bounds.left + bounds.width / 2).toBeCloseTo(viewport.left + viewport.width / 2);
  expect(bounds.top + bounds.height / 2).toBeCloseTo(viewport.top + viewport.height / 2);
  expect(transform(container.querySelector('.zoompan-stage'))[2]).toBeGreaterThan(1);
}

test('fitToElement centers a room after panning and zooming, respects limits, and preserves the DOM ref', () => {
  const controls = createRef();
  const viewport = createRef();
  const { container } = render(
    <ZoomPan ref={viewport} controlsRef={controls} initialScale={2} maxScale={4} className="map-viewport">
      <svg><rect className="room" x="200" y="100" /></svg>
    </ZoomPan>
  );
  expect(viewport.current).toBe(container.firstChild);
  fireEvent.keyDown(window, { key: 'ArrowLeft' });
  act(() => expect(controls.current.fitToElement(container.querySelector('.room'))).toBe(true));
  const [x, y, scale] = transform(container.querySelector('.zoompan-stage'));
  expect(scale).toBe(4);
  expect(x + 220 * scale).toBeCloseTo(400);
  expect(y + 110 * scale).toBeCloseTo(300);
  act(() => expect(controls.current.centerOn(100, 150, 2)).toBe(true));
  expect(transform(container.querySelector('.zoompan-stage'))).toEqual([200, 0, 2]);
});

test('a search query waits for a slow floor load, then highlights, centers, and zooms the room', async () => {
  mockQuery = 'room=room-one';
  let resolve;
  global.fetch = jest.fn(() => new Promise(done => { resolve = done; }));
  const { container } = render(<FloorViewerPage buildingId="A" floorId="L1" />);
  expect(container.querySelector('svg')).toBeNull();
  await act(async () => resolve({ ok: true, text: async () => svg }));
  await waitFor(() => expectCentered(container, 'room-one'));
  expect(container.querySelector('[id="room-one"]')).toHaveClass('active-room');
  expect(container.querySelector('[id="room-one"]')).toHaveAttribute('aria-selected', 'true');
});

test('changing the room on the same floor moves the focus and clears the old highlight', async () => {
  mockQuery = 'room=room-one';
  const { container, rerender } = render(<FloorViewerPage buildingId="A" floorId="L1" />);
  await waitFor(() => expectCentered(container, 'room-one'));
  mockQuery = 'room=room-two';
  rerender(<FloorViewerPage buildingId="A" floorId="L1" />);
  await waitFor(() => expectCentered(container, 'room-two'));
  expect(container.querySelector('[id="room-one"]')).not.toHaveClass('active-room');
  expect(container.querySelector('[id="room-two"]')).toHaveClass('active-room');
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

test('searching the same room again refocuses after panning; Reset remains available', async () => {
  mockQuery = 'room=room-one';
  const { container } = render(<FloorViewerPage buildingId="A" floorId="L1" />);
  await waitFor(() => expectCentered(container, 'room-one'));
  fireEvent.keyDown(window, { key: 'ArrowLeft' });
  act(() => requestRoomFocus('B', 'L1', 'room-one'));
  expect(() => expectCentered(container, 'room-one')).toThrow();
  act(() => requestRoomFocus('A', 'L1', 'room-one'));
  expectCentered(container, 'room-one');
  fireEvent.click(screen.getByRole('button', { name: /reset view/i }));
  expect(transform(container.querySelector('.zoompan-stage'))[2]).toBe(1);
});

test('cross-floor navigation focuses only the newly loaded map, even with the same room ID', async () => {
  mockQuery = 'room=room-one';
  const { container, rerender } = render(<FloorViewerPage buildingId="B" floorId="L1" />);
  await waitFor(() => expectCentered(container, 'room-one'));
  let resolve;
  global.fetch.mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  rerender(<FloorViewerPage buildingId="B" floorId="L2" />);
  expect(container.querySelector('svg')).toBeNull();
  await act(async () => resolve({ ok: true, text: async () => svg.replace('x="200"', 'x="600"') }));
  await waitFor(() => expectCentered(container, 'room-one'));
});

test('a missing room leaves the map usable without zooming', async () => {
  mockQuery = 'room=missing';
  const { container } = render(<FloorViewerPage buildingId="A" floorId="L1" />);
  await waitFor(() => expect(container.querySelector('.room')).toBeInTheDocument());
  await act(async () => new Promise(resolve => requestAnimationFrame(resolve)));
  expect(transform(container.querySelector('.zoompan-stage'))[2]).toBe(1);
  expect(container.querySelector('.active-room')).toBeNull();
});

test('Find emits a focus request for repeated alias searches and still routes normally', () => {
  const listener = jest.fn();
  window.addEventListener('ggcmap-focus-room', listener);
  try {
    render(<Find />);
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'aec' } });
    fireEvent.click(screen.getByRole('button', { name: 'Find' }));
    fireEvent.click(screen.getByRole('button', { name: 'Find' }));
    expect(mockPush).toHaveBeenLastCalledWith('/building/W/GL?room=1160');
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener.mock.calls[1][0].detail).toEqual({ building: 'W', floor: 'GL', roomId: '1160' });
  } finally {
    window.removeEventListener('ggcmap-focus-room', listener);
  }
});
