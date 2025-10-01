'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAllBuildings } from '../lib/campus';

// Get building data and create navigation items
const buildings = getAllBuildings();
const NAV_ITEMS = [
  { key: 'campus', label: 'Campus', path: '/', hover: { selector: '.building-group' } },
  ...buildings.map(building => ({
    key: building.id,
    label: building.name,
    path: `/building/${building.id}`,
    hover: { ids: [building.id.toLowerCase()] }
  }))
];

const dispatchHoverEvent = (type, source, detail) => {
  if (typeof window === 'undefined') return;
  const eventDetail = { source, ...(detail ?? {}) };
  window.dispatchEvent(new CustomEvent(type, { detail: eventDetail }));
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const pathname = usePathname();
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
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          const linkClass = `nav-link${isActive ? ' active' : ''}`;
          return (
            <li key={item.key} className="nav-item">
              <Link
                className={linkClass}
                href={item.path}
                {...handlers}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};