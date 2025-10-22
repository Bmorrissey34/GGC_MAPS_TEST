'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAllBuildings } from '../lib/campus';
import { RESTRICTED_BUILDING_IDS, RESTRICTED_HOVER_SELECTORS } from '../lib/constants';
import { clearHoverEvents, createHoverHandlers } from '../lib/eventSystem';

// Get building data and create navigation items
const buildings = getAllBuildings();

const buildHoverDetail = (building) => {
  const selector = RESTRICTED_HOVER_SELECTORS[building.id];
  if (selector) {
    return { selector };
  }
  const hoverId = typeof building.id === 'string' ? building.id.toLowerCase() : String(building.id).toLowerCase();
  return { ids: [hoverId] };
};

const NAV_ITEMS = [
  { key: 'campus', label: 'Campus', path: '/', hover: { selector: '.building-group' } },
  ...buildings
    .slice()
    .filter(b => !RESTRICTED_BUILDING_IDS.includes((b.id))) // Exclude student housing buildings
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((building) => ({
      key: building.id,
      label: building.name,
      path: `/building/${building.id}`,
      hover: buildHoverDetail(building),
    }))
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  const handleCollapse = () => {
    clearHoverEvents('sidebar:collapse');
    setCollapsed(true);
  };

  const handleExpand = () => setCollapsed(false);

  const createHandlers = (item) => 
    createHoverHandlers(`sidebar:${item.key}`, item.hover);

  return (
    <div className={`sidebar-slot${collapsed ? ' is-collapsed' : ''}`}>
      {!collapsed ? (
        <nav className="sidebar" aria-label="Campus navigation">
          <div className="sidebar-header">
            <span className="sidebar-title">Explore Campus</span>
          </div>
          <ul className="sidebar-nav">
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
      ) : (
        <div className="sidebar-toggle-wrap">
        </div>
      )}
    </div>
  );
};
