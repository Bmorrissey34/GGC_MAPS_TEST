'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import buildings from '../data/buildings.json';

export default function MapHeader() {
  const pathname = usePathname();
  const [title, setTitle] = useState('GGC Maps');
  const [floorLabel, setFloorLabel] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    // Only show help text on map pages
    setShowHelp(pathname === '/' || pathname.startsWith('/building/'));

    if (pathname === '/') {
      setTitle('Campus Map');
      setFloorLabel('');
    } else if (pathname.startsWith('/building/')) {
      // Extract buildingId and floorId from URL
      const parts = pathname.split('/').filter(Boolean);
      const buildingId = parts[1]?.toUpperCase(); // Convert to uppercase to match data
      const floorId = parts[2];

      // Find building data
      const building = buildings.find(b => b.id.toUpperCase() === buildingId);
      
      if (building) {
        setTitle(building.name);
        
        // If we have a floor ID, find its label
        if (floorId) {
          const floor = building.floors.find(f => f.id === floorId);
          if (floor) {
            setFloorLabel(floor.label);
          }
        }
      } else {
        setTitle('Building Map');
        setFloorLabel('');
      }
    } else {
      setTitle('GGC Maps');
      setFloorLabel('');
    }
  }, [pathname]);

  return (
    <footer className="footer">
      <div className="container">
        <div className="map-header-content">
          <h1 className="map-title">
            {title}
            {floorLabel && <span className="floor-label"> - {floorLabel}</span>}
          </h1>
          {showHelp && (
            <span className="text-muted small">
              Use +/- buttons or scroll/pinch to zoom; drag to pan
            </span>
          )}
        </div>
      </div>
    </footer>
  );
}