import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import ZoomPan from '../components/ZoomPan';
import FloorMapView from '../components/FloorMapView';
import InlineSvg from '../components/InlineSvg';

// Exercise map behavior independently of the sidebar's search and legend UI.
jest.mock('../components/OverlayHUD', () => () => null);

const svg = '<svg xmlns="http://www.w3.org/2000/svg"><g id="room-one" class="room-group"><rect class="room" /></g></svg>';
const response = (markup = svg) => ({ ok: true, text: async () => markup });
const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});

function renderZoom() {
  const result = render(<ZoomPan initialScale={2}><svg /></ZoomPan>);
  const viewport = result.container.firstChild;
  viewport.getBoundingClientRect = () => ({ left: 10, top: 20, width: 800, height: 600 });
  return { viewport, stage: viewport.querySelector('.zoompan-stage') };
}

function transform(stage) {
  return stage.style.transform.match(/-?\d+(?:\.\d+)?(?:e[+-]?\d+)?/gi).map(Number);
}

test('wheel zoom preserves the content point under the cursor after panning', () => {
  const { viewport, stage } = renderZoom();
  fireEvent.keyDown(window, { key: 'ArrowLeft' });
  const [beforeX, beforeY, beforeScale] = transform(stage);
  const contentX = (200 - beforeX) / beforeScale;
  const contentY = (150 - beforeY) / beforeScale;
  fireEvent.wheel(viewport, { deltaY: -Math.log(1.5) / 0.0005, clientX: 210, clientY: 170 });
  const [afterX, afterY, afterScale] = transform(stage);
  expect(afterScale).toBeCloseTo(3);
  expect(afterX + afterScale * contentX).toBeCloseTo(200);
  expect(afterY + afterScale * contentY).toBeCloseTo(150);
});

test.each(['mouse', 'touch'])('%s dragging follows screen distance at a non-default zoom', (pointerType) => {
  const { viewport, stage } = renderZoom();
  viewport.setPointerCapture = jest.fn();
  viewport.releasePointerCapture = jest.fn();
  const [beforeX, beforeY] = transform(stage);
  const pointer = (type, x, y) => {
    const event = new MouseEvent(type, { bubbles: true, clientX: x, clientY: y });
    Object.defineProperties(event, { pointerId: { value: 1 }, pointerType: { value: pointerType } });
    fireEvent(viewport, event);
  };
  pointer('pointerdown', 100, 100);
  pointer('pointermove', 200, 160);
  pointer('pointerup', 200, 160);
  const [afterX, afterY] = transform(stage);
  expect(afterX - beforeX).toBe(100);
  expect(afterY - beforeY).toBe(60);
  expect(viewport.releasePointerCapture).toHaveBeenCalledWith(1);
});

test('keyboard pan moves 30 screen pixels regardless of zoom', () => {
  const { stage } = renderZoom();
  const [beforeX] = transform(stage);
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(transform(stage)[0] - beforeX).toBe(-30);
});

test('keyboard zoom stays centered and ignores typing in the search field', () => {
  const { stage } = renderZoom();
  fireEvent.keyDown(window, { key: '+' });
  let [x, y, scale] = transform(stage);
  expect(scale).toBeCloseTo(2.2);
  expect(x + 200 * scale).toBeCloseTo(400);
  expect(y + 150 * scale).toBeCloseTo(300);

  const input = document.createElement('input');
  document.body.appendChild(input);
  try {
    fireEvent.keyDown(input, { key: '-' });
    expect(transform(stage)[2]).toBeCloseTo(2.2);
  } finally {
    input.remove();
  }

  fireEvent.keyDown(window, { key: '-' });
  [x, y, scale] = transform(stage);
  expect(scale).toBeCloseTo(2);
  expect(x).toBeCloseTo(0);
  expect(y).toBeCloseTo(0);
});

test('an HTTP failure shows the floor fallback without inserting the error page', async () => {
  const text = jest.fn(async () => '<h1>Server error</h1>');
  global.fetch = jest.fn(async () => ({ ok: false, status: 404, text }));
  render(<FloorMapView src="/missing.svg" />);
  expect(await screen.findByText('Failed to load map')).toBeInTheDocument();
  expect(text).not.toHaveBeenCalled();
  expect(screen.queryByText('Server error')).not.toBeInTheDocument();
});

test('changing floors clears the old clickable map and its selection while loading', async () => {
  let finishLoading;
  global.fetch = jest.fn()
    .mockResolvedValueOnce(response())
    .mockImplementationOnce(() => new Promise(resolve => { finishLoading = resolve; }));
  const { container, rerender } = render(<FloorMapView src="/first.svg" />);
  await waitFor(() => expect(container.querySelector('.room')).toBeInTheDocument());
  fireEvent.click(container.querySelector('.room'));
  expect(container.querySelector('.room-group')).toHaveClass('active-room');
  rerender(<FloorMapView src="/second.svg" />);
  expect(container.querySelector('svg')).not.toBeInTheDocument();
  finishLoading(response());
  await waitFor(() => expect(container.querySelector('.room-group')).toBeInTheDocument());
  expect(container.querySelector('.room-group')).not.toHaveClass('active-room');
});

test('a stale floor response cannot replace a newer floor', async () => {
  let finishFirst;
  global.fetch = jest.fn()
    .mockImplementationOnce(() => new Promise(resolve => { finishFirst = resolve; }))
    .mockResolvedValueOnce(response(svg.replace('room-one', 'room-two')));
  const { container, rerender } = render(<FloorMapView src="/first.svg" />);
  rerender(<FloorMapView src="/second.svg" />);
  await waitFor(() => expect(container.querySelector('#room-two')).toBeInTheDocument());
  await act(async () => { finishFirst(response()); });
  expect(container.querySelector('#room-one')).not.toBeInTheDocument();
  expect(container.querySelector('#room-two')).toBeInTheDocument();
});

test('room clicks use the current callback after a parent rerender', async () => {
  global.fetch = jest.fn(async () => response());
  const oldCallback = jest.fn();
  const newCallback = jest.fn();
  const { container, rerender } = render(<FloorMapView src="/floor.svg" onRoomSelect={oldCallback} />);
  await waitFor(() => expect(container.querySelector('.room')).toBeInTheDocument());
  rerender(<FloorMapView src="/floor.svg" onRoomSelect={newCallback} />);
  fireEvent.click(container.querySelector('.room'));
  expect(newCallback).toHaveBeenCalledWith('room-one');
  expect(oldCallback).not.toHaveBeenCalled();
});

test('clearing InlineSvg selectedId removes the highlight and selection attribute', async () => {
  global.fetch = jest.fn(async () => response());
  const { container, rerender } = render(<InlineSvg src="/floor.svg" selectedId="room-one" />);
  await waitFor(() => expect(container.querySelector('#room-one')).toHaveClass('active-room'));
  rerender(<InlineSvg src="/floor.svg" selectedId={null} />);
  expect(container.querySelector('#room-one')).not.toHaveClass('active-room');
  expect(container.querySelector('#room-one')).not.toHaveAttribute('aria-selected');
});
