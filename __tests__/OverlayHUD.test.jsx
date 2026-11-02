import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import OverlayHUD from '../components/OverlayHUD';
import { LanguageProvider } from '../components/LanguageContext';
import { getUIText, translateBuildingName } from '../lib/i18n';
import buildings from '../data/buildings.json';

let mockPathname = '/';
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
  usePathname: () => mockPathname,
}));
jest.mock('../components/Sidebar', () => () => <nav>Campus navigation</nav>);
jest.mock('../components/legend', () => () => <div>Map legend</div>);
jest.mock('../components/Links', () => () => <div>Campus links</div>);
jest.mock('../components/LanguageToggle', () => () => null);

const copy = getUIText('en').overlay;

beforeEach(() => {
  mockPathname = '/';
  mockPush.mockClear();
  window.localStorage.clear();
});

test('right panels toggle and stay mutually exclusive while navigation stays open', () => {
  render(<OverlayHUD />);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: copy.showNavigation }));
  fireEvent.click(screen.getByRole('button', { name: copy.showLegend }));
  expect(screen.getByRole('dialog', { name: copy.legendPanelAria })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: copy.showLinks }));
  expect(screen.queryByRole('dialog', { name: copy.legendPanelAria })).toBeNull();
  expect(screen.getByRole('dialog', { name: copy.linksPanelAria })).toBeInTheDocument();
  expect(screen.getByRole('dialog', { name: copy.navigationPanelAria })).toBeInTheDocument();

  fireEvent.click(screen.getByRole('button', { name: copy.showLegend }));
  expect(screen.queryByRole('dialog', { name: copy.linksPanelAria })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: copy.hideLegend }));
  expect(screen.queryByRole('dialog', { name: copy.legendPanelAria })).toBeNull();
});

test('panel close buttons clear the active right panel', () => {
  render(<OverlayHUD />);
  fireEvent.click(screen.getByRole('button', { name: copy.showLinks }));
  fireEvent.click(screen.getByRole('button', { name: copy.closeLinks }));
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: copy.showLegend }));
  fireEvent.click(screen.getByRole('button', { name: copy.closeLegend }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('the map title follows the current route and hides for unknown pages', () => {
  const { rerender } = render(<OverlayHUD />);
  expect(screen.getByRole('heading', { name: 'Campus Map' })).toBeInTheDocument();
  mockPathname = '/building/B/L2';
  rerender(<OverlayHUD />);
  expect(screen.getByRole('heading', { name: 'Building B' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Campus Map' })).toBeNull();
  mockPathname = '/building/missing/L1';
  rerender(<OverlayHUD />);
  expect(screen.queryByRole('heading')).toBeNull();
  mockPathname = null;
  rerender(<OverlayHUD />);
  expect(screen.getByRole('heading', { name: 'Campus Map' })).toBeInTheDocument();
});

test('floor arrows use the neighboring floors and respect the first and last floor', () => {
  const building = buildings.find(b => b.id === 'B');
  const onFloorChange = jest.fn();
  mockPathname = '/building/B/L1';
  const { rerender } = render(
    <OverlayHUD buildingData={building} currentFloorId="L1" onFloorChange={onFloorChange} isFloorView />
  );
  expect(screen.getByRole('button', { name: copy.goLowerFloor })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: copy.goUpperFloor }));
  expect(onFloorChange).toHaveBeenLastCalledWith('L2');

  mockPathname = '/building/B/L3';
  rerender(<OverlayHUD buildingData={building} currentFloorId="L3" onFloorChange={onFloorChange} isFloorView />);
  expect(screen.getByRole('button', { name: copy.goUpperFloor })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: copy.goLowerFloor }));
  expect(onFloorChange).toHaveBeenLastCalledWith('L2');
  fireEvent.click(screen.getByRole('button', { name: 'Back to campus map' }));
  expect(mockPush).toHaveBeenCalledWith('/');
});

test('translated building and floor labels are preserved', () => {
  const building = buildings.find(b => b.id === 'L');
  mockPathname = '/building/L/L1';
  render(
    <LanguageProvider defaultLocale="es">
      <OverlayHUD buildingData={building} currentFloorId="L1" isFloorView />
    </LanguageProvider>
  );
  expect(screen.getByRole('heading', { name: translateBuildingName(building.name, 'es') })).toBeInTheDocument();
  expect(screen.getByText('Nivel 1')).toBeInTheDocument();
});
