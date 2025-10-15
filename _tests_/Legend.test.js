// __tests__/Legend.test.js
import { render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import Legend from '../components/legend.jsx';

test('renders the legend panel and title', () => {
  render(<Legend />);

  // Grab the accessible region named "Legend"
  const legendRegion = screen.getByRole('region', { name: /legend/i });
  expect(legendRegion).toBeInTheDocument();

  // Now scope the search to that region to get the visible title
  const title = within(legendRegion).getByText('Legend', {
    selector: '.legend-title'
  });
  expect(title).toBeInTheDocument();
});
