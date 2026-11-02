'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import FloorMapView from '../FloorMapView';
import { getBuildingById } from '../../lib/campus';
import { useLanguage } from '../LanguageContext';
import { getUIText } from '../../lib/i18n';

// The URL keeps search results shareable and works across floor navigation.
function FloorViewerContent({ buildingId, floorId, locale }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const buildingData = getBuildingById(buildingId);
  const currentFloor = buildingData?.floors.find(floor => floor.id === floorId);
  const roomToHighlight = searchParams.get('room');
  const ui = getUIText(locale);

  if (!buildingData || !currentFloor) {
    return <div>{ui.general.notFound}</div>;
  }

  return (
    <main role="main" className="floor-viewer">
      <FloorMapView
        src={currentFloor.file}
        buildingData={buildingData}
        currentFloorId={floorId}
        focusRoomId={roomToHighlight}
        onFloorChange={(newFloorId) => {
          router.push(`/building/${buildingId}/${newFloorId}`);
        }}
      />
    </main>
  );
}

export default function FloorViewerPage({ buildingId, floorId }) {
  const { locale } = useLanguage();
  const ui = getUIText(locale);
  return (
    <Suspense fallback={<div>{ui.general.loading}</div>}>
      <FloorViewerContent buildingId={buildingId} floorId={floorId} locale={locale} />
    </Suspense>
  );
}
