'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect } from 'react';
import FloorMapView from '../FloorMapView';
import { getBuildingById } from '../../lib/campus';

// Inner component that uses useSearchParams
function FloorViewerContent({ buildingId, floorId }) {
  const router = useRouter(); // Router for navigation
  const searchParams = useSearchParams(); // Get URL search parameters
  const buildingData = getBuildingById(buildingId); // Fetch building data
  const floors = buildingData?.floors || []; // Get floors or default to empty array
  const currentFloorIndex = floors.findIndex(floor => floor.id === floorId); // Find current floor index
  const currentFloor = floors[currentFloorIndex]; // Get current floor data
  const roomToHighlight = searchParams.get('room'); // Get room from query params

  // Navigate to the upper floor
  const goToUpperFloor = () => {
    if (currentFloorIndex < floors.length - 1) {
      router.push(`/building/${buildingId}/${floors[currentFloorIndex + 1].id}`); // Navigate to upper floor
    }
  };

  // Navigate to the lower floor
  const goToLowerFloor = () => {
    if (currentFloorIndex > 0) {
      router.push(`/building/${buildingId}/${floors[currentFloorIndex - 1].id}`); // Navigate to lower floor
    }
  };

  // Highlight room when component mounts or room param changes
  useEffect(() => {
    if (!roomToHighlight) return;

    const highlightInPage = (roomId) => {
      // Look for SVG in the floor viewer main element
      const floorViewer = document.querySelector('.floor-viewer');
      if (!floorViewer) {
        return false;
      }
      
      const svg = floorViewer.querySelector('svg');
      if (!svg) return false;

      // Clear previous highlights
      svg.querySelectorAll(".active-room").forEach(el =>
        el.classList.remove("active-room")
      );

      // Find the room group or element
      const group =
        svg.querySelector(`g.room-group[id="${roomId}"]`) ||
        svg.querySelector(`g[id="${roomId}"]`);
      if (!group) return false;

      const shape = group.querySelector(".room") || group.querySelector("rect, polygon, path");
      const label = group.querySelector(".label") || group.querySelector("text");

      if (shape) shape.classList.add("active-room");
      if (label) label.classList.add("label--active");

      // Ensure elements are rendered on top
      if (shape?.parentElement) shape.parentElement.appendChild(shape);
      if (label?.parentElement) label.parentElement.appendChild(label);

      return true;
    };

    const highlightWithRetry = (roomId, attempts = 10, delay = 100) => {
      const ok = highlightInPage(roomId);
      if (ok) {
        return;
      }

      if (attempts <= 0) {
        return;
      }
      setTimeout(() => highlightWithRetry(roomId, attempts - 1, delay), delay);
    };

    highlightWithRetry(roomToHighlight);
  }, [roomToHighlight]);

  if (!buildingData || !currentFloor) {
    return <div>Floor not found</div>; // Display message if floor not found
  }

  return (
    <main role="main" className="floor-viewer">
      <FloorMapView 
        src={currentFloor.file}
        buildingData={buildingData}
        currentFloorId={floorId}
        onFloorChange={(newFloorId) => {
          router.push(`/building/${buildingId}/${newFloorId}`);
        }}
      />
    </main>
  );
}

// Outer component that wraps with Suspense
export default function FloorViewerPage({ buildingId, floorId }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <FloorViewerContent buildingId={buildingId} floorId={floorId} />
    </Suspense>
  );
}
