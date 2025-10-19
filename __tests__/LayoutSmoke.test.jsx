import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Top-level pieces (same ones used by app/layout.js)
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Legend from '../components/legend';
import Links from '../components/Links';
import Footer from '../components/Footer';

// Next router is used by multiple components
jest.mock('next/navigation', () => {
  const push = jest.fn();
  return { useRouter: () => ({ push }), usePathname: () => '/' };
});

//const React = require('react');

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
    // Find input in header
    expect(screen.getByRole('textbox', { name: /find:/i })).toBeInTheDocument();

    // Sidebar
    expect(screen.getByRole('navigation', { name: /campus navigation/i })).toBeInTheDocument();
    expect(screen.getByText(/explore campus/i)).toBeInTheDocument();

    // Legend + Links panels
    expect(screen.getByText(/^legend$/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /helpful links/i })).toBeInTheDocument();

    // Footer (year text exists)
    expect(screen.getByText(/Team Lost/i)).toBeInTheDocument();
  });

  test('sidebar collapse/expand toggles', async () => {
    render(<RenderLayout />);

    // Collapse button closes sidebar
    const collapseBtn = screen.getByRole('button', { name: /collapse sidebar navigation/i });
    await userEvent.click(collapseBtn);

    // Now only the expand toggle remains
    const expandBtn = screen.getByRole('button', { name: /expand sidebar navigation/i });
    expect(expandBtn).toBeInTheDocument();

    // Expand back
    await userEvent.click(expandBtn);
    expect(screen.getByRole('navigation', { name: /campus navigation/i })).toBeInTheDocument();
  });

  test('legend collapses and expands', async () => {
    render(<RenderLayout />);
    // Title is visible initially
    expect(screen.getByText(/^legend$/i)).toBeInTheDocument();

    // Collapse (button title toggles between Hide/Show legend)
    const toggle = screen.getByTitle(/legend/i);
    await userEvent.click(toggle);

    // Hidden body: the "Legend" title may still be present, but aria-expanded should flip
    expect(screen.getByTitle(/legend/i)).toHaveAttribute('aria-expanded', 'false');

    // Expand again
    await userEvent.click(screen.getByTitle(/legend/i));
    expect(screen.getByTitle(/legend/i)).toHaveAttribute('aria-expanded', 'true');
  });
});
