import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Top-level pieces (same ones used by app/layout.js)
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Legend from '../components/legend';
import Links from '../components/Links';
import Footer from '../components/Footer';

// Mock Next router used by multiple components
jest.mock('next/navigation', () => {
  const push = jest.fn();
  return { useRouter: () => ({ push }), usePathname: () => '/' };
});

// Mock next/image for JSDOM
jest.mock('next/image', () => {
  const React = require('react');
  return function Image(props) {
    return React.createElement('img', props);
  };
});

function RenderLayout() {
  return (
    <div>
      <Header />
      <div className="layout-columns">
        <Sidebar />
        <main role="main" className="layout-main">
          <div>Mock Main Content</div>
        </main>
        <div className="layout-rail">
          <Legend className="mb-4" />
          <Links />
        </div>
      </div>
      <Footer />
    </div>
  );
}

describe('Layout smoke test', () => {
  test('renders header, sidebar, legend, links, footer', () => {
    render(<RenderLayout />);

    // Header
    expect(screen.getByText(/ggc maps/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/AEC, gameroom, library/i)).toBeInTheDocument();

    // Sidebar present (don’t assert "Explore Campus" text since it no longer exists)
    expect(
      screen.getByRole('navigation', { name: /campus navigation/i })
    ).toBeInTheDocument();

    // Legend present (query by aria role/label, not title)
    expect(screen.getByRole('region', { name: /legend/i })).toBeInTheDocument();

    // Helpful Links heading (be explicit about level, but fallback if needed)
    const linksHeading =
      screen.queryByRole('heading', { level: 2, name: /helpful links/i }) ||
      screen.getByText(/helpful links/i);
    expect(linksHeading).toBeInTheDocument();

    // Footer brand text
    expect(screen.getByText(/team lost/i)).toBeInTheDocument();
  });

  test('sidebar collapse/expand toggles (if control exists)', async () => {
    render(<RenderLayout />);

    // Some layouts may not render a collapse button. Feature-detect it.
    const collapseBtn = screen.queryByRole('button', {
      name: /collapse sidebar navigation/i,
    });

    if (collapseBtn) {
      await userEvent.click(collapseBtn);
      const expandBtn = screen.getByRole('button', {
        name: /expand sidebar navigation/i,
      });
      expect(expandBtn).toBeInTheDocument();

      await userEvent.click(expandBtn);
    }

    // In both cases, sidebar navigation should be reachable
    expect(
      screen.getByRole('navigation', { name: /campus navigation/i })
    ).toBeInTheDocument();
  });

  test('legend renders and language toggle works', async () => {
    render(<RenderLayout />);

    // Legend region exists
    const legendRegion = screen.getByRole('region', { name: /legend/i });
    expect(legendRegion).toBeInTheDocument();

    // Language buttons (EN pressed initially per your DOM dump)
    const enBtn = screen.getByRole('button', { name: /english/i });
    const esBtn = screen.getByRole('button', { name: /spanish/i });

    expect(enBtn).toHaveAttribute('aria-pressed', 'true');
    expect(esBtn).toHaveAttribute('aria-pressed', 'false');

    // Toggle to ES
    await userEvent.click(esBtn);
    expect(esBtn).toHaveAttribute('aria-pressed', 'true');
    // Optional: if your code flips EN off, uncomment next line
    // expect(enBtn).toHaveAttribute('aria-pressed', 'false');
  });
});
