'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import buildings from '../data/buildings.json';
import { useLanguage } from './LanguageContext';
import { getUIText, translateBuildingName, translateFloorLabel } from '../lib/i18n';

export default function MapHeader() {
  const pathname = usePathname();
  const [title, setTitle] = useState('GGC Maps');
  const [floorLabel, setFloorLabel] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const { locale } = useLanguage();
  const ui = getUIText(locale);

  useEffect(() => {
    // Only show help text on map pages
    setShowHelp(pathname === '/' || pathname.startsWith('/building/'));

    if (pathname === '/') {
      setTitle(ui.mapHeader.campusMap);
      setFloorLabel('');
    } else if (pathname.startsWith('/building/')) {
      // Extract buildingId and floorId from URL
      const parts = pathname.split('/').filter(Boolean);
      const buildingId = parts[1]?.toUpperCase(); // Convert to uppercase to match data
      const floorId = parts[2];

      // Find building data
      const building = buildings.find(b => b.id.toUpperCase() === buildingId);
      
      if (building) {
        setTitle(translateBuildingName(building.name, locale));
        
        // If we have a floor ID, find its label
        if (floorId) {
          const floor = building.floors.find(f => f.id === floorId);
          if (floor) {
            setFloorLabel(translateFloorLabel(floor.label, locale));
          }
        }
      } else {
        setTitle(ui.mapHeader.buildingFallback);
        setFloorLabel('');
      }
    } else {
      setTitle('GGC Maps');
      setFloorLabel('');
    }
  }, [pathname, locale, ui.mapHeader.campusMap, ui.mapHeader.buildingFallback]);

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
              {ui.mapHeader.helpHint}
            </span>
          )}
          {/* Ensure copyright is on a new row */}
          <span className="text-muted small copyright">
            {ui.mapHeader.copyright}
          </span>
        </div>
      </div>
    </footer>
  );
}
