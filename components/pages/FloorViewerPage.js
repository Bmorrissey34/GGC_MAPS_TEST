'use client';
import { useRouter } from 'next/navigation';
import FloorMapView from '../FloorMapView';
import { getBuildingData } from '../../lib/campus';

// FloorViewerPage component for displaying a specific floor of a building
export default function FloorViewerPage({ buildingId, floorId }) {
  const router = useRouter(); // Router for navigation
  const buildingData = getBuildingData(buildingId); // Fetch building data
  const floors = buildingData?.floors || []; // Get floors or default to empty array
  const currentFloorIndex = floors.findIndex(floor => floor.id === floorId); // Find current floor index
  const currentFloor = floors[currentFloorIndex]; // Get current floor data

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
