'use client';
import { useState } from 'react';

const NAV_ITEMS = [
  { key: 'campus', label: 'Campus', hover: { selector: '.building-group' }, active: false },
  { key: 'A', label: 'Building A', hover: { ids: ['a'] } },
  { key: 'B', label: 'Building B', hover: { ids: ['b'] } },
  { key: 'C', label: 'Building C', hover: { ids: ['c'] } },
  { key: 'CC', label: 'Building CC', hover: { ids: ['cc'] } },
  { key: 'D', label: 'Building D / Admissions', hover: { ids: ['d'] } },
  { key: 'E', label: 'Building E / Student Center', hover: { ids: ['e'] } },
  { key: 'F', label: 'Building F / Wellness & Rec Center', hover: { ids: ['f'] } },
  { key: 'G', label: 'Building G / Grizzly Athletics', hover: { ids: ['g'] } },
  { key: 'H', label: 'Building H / Allied Health & Science', hover: { ids: ['h'] } },
  { key: 'I', label: 'Building I', hover: { ids: ['i'] } },
  { key: 'L', label: 'Building L / Library', hover: { ids: ['l'] } },
  { key: 'W', label: 'Building W', hover: { ids: ['w'] } },
  { key: '1000', label: 'Building 1000 / Student Housing', hover: { ids: ['b1000'] } },
  { key: '2000', label: 'Building 2000 / Student Housing', hover: { ids: ['2'] } },
  { key: '3000', label: 'Building 3000 / Student Housing', hover: { ids: ['3'] } },
];

const dispatchHoverEvent = (type, source, detail) => {
  if (typeof window === 'undefined') return;
  const eventDetail = { source, ...(detail ?? {}) };
  window.dispatchEvent(new CustomEvent(type, { detail: eventDetail }));
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const handleToggle = () => setCollapsed(!collapsed);

  const createHandlers = (item) => {
    const source = `sidebar:${item.key}`;
    const hoverDetail = item.hover;
    return {
      onMouseEnter: () => hoverDetail && dispatchHoverEvent('ggcmap-hover', source, hoverDetail),
      onMouseLeave: () => dispatchHoverEvent('ggcmap-hover-clear', source),
      onFocus: () => hoverDetail && dispatchHoverEvent('ggcmap-hover', source, hoverDetail),
      onBlur: () => dispatchHoverEvent('ggcmap-hover-clear', source),
    };
  };

  return (
    <nav className={`sidebar bg-light border-end ${collapsed ? 'collapsed' : ''}`}>
      <button
        className="btn btn-outline-secondary"
        onClick={handleToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
      <i className={`bi ${collapsed ? 'bi-list' : 'bi-x'}`}></i>
      </button>
      <ul className="nave flex-colmn">
        {NAV_ITEMS.map((item) => {
          const handlers = createHandlers(item);
          const linkClass = `nav-link${item.active ? ' active' : ''}`;
          return (
            <li key={item.key} className="nav-item">
              <a
                className={linkClass}
                href="#"
                {...handlers}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
