// components/CampusMapView.js
'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import InlineSvg from './InlineSvg';
import ZoomPan from './ZoomPan';
import PageContainer from './PageContainer';
import buildings from '../data/buildings.json';

// CampusMapView component displays the campus map with interactive elements
export default function CampusMapView({
  src = '/BuildingMaps/(Campus)/Campus.svg', // Default path to the campus map SVG
  interactiveSelector = '.building-group, .building, .student-housing', // CSS selector for interactive elements
}) {
  const [selectedId, setSelectedId] = useState(null);
  const router = useRouter();
  const[error, setError] = useState('');

  // Create a set of known building IDs for quick lookup
  const known = useMemo(
    () => new Set(buildings.map((b) => String(b.id).toUpperCase())),
    []
  );

  // Handle the selection of a building
  const HOUSING_IDS = ['1000', '2000', '3000', 'B1000', '2', '3', 'BUILDING_1000', 'BUILDING_2000', 'BUILDING_3000'];
  const handleSelect = (id, element) => {
    const isStudentHousing = element?.classList?.contains('student-housing');
    if (!id && !isStudentHousing) return;

    if (process.env.NODE_ENV !== 'production') {
      console.debug('[CampusMapView] select', id, { isStudentHousing, element });
    }
    if (id) {
      setSelectedId(id);
    }

    const code = id ? String(id).toUpperCase() : null;
    if (isStudentHousing || (code && HOUSING_IDS.includes(code))) {
      setError('Student housing layouts are not avaialable to the public.');
      return;
    }
    if (code && known.has(code)) {
      router.push(`/building/${code}`);
    }
  };

  useEffect(() => {
    const handler = (event) => {
      const detailId = event?.detail?.id ?? null;
      const code = detailId ? String(detailId).toUpperCase() : null;
      if (!detailId || HOUSING_IDS.includes(code ?? detailId)) {
        setError('Student housing layouts are not avaialable to the public.');
      }
    };
    window.addEventListener('ggcmap-student-housing-click', handler);
    return () => window.removeEventListener('ggcmap-student-housing-click', handler);
  }, []);

  // Ensure student housing groups carry a helper class for interactivity
  const ensureStudentHousingClasses = useCallback(() => {
    const svgRoot = document.querySelector('.map-wrap svg');
    if (!svgRoot) return;

    const studentHousingSelectors = [
      "[id='1000']",
      "[id='2000']",
      "[id='3000']",
      '#BUILDING_1000',
      '#BUILDING_2000',
      '#BUILDING_3000',
      "[id='b1000']",
      "[id='2']",
      "[id='3']",
    ];

    studentHousingSelectors.forEach((selector) => {
      svgRoot.querySelectorAll(selector).forEach((node) => {
        node.classList.add('student-housing');
        if (node.classList.contains('building-group')) {
          node.querySelectorAll('.building').forEach((child) => {
            child.classList.add('student-housing');
          });
        }
      });
    });
  }, []);

  useEffect(() => {
    ensureStudentHousingClasses();
  }, [ensureStudentHousingClasses, src]);

  // Optional: call imperative fit if your ZoomPan forwards a ref
  const zoomRef = useRef(null);

  // Runs once the SVG markup is injected
  const handleSvgReady = useCallback(() => {
    ensureStudentHousingClasses();

    const wrapper = document.querySelector('.map-wrap');
    const svgRoot = wrapper?.querySelector('svg');
    if (!svgRoot) return;

    svgRoot.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // Prefer the main campus group for bounding-box calculations; fall back to the SVG root.
    const mainGroup =
      svgRoot.querySelector('g#campus, g#Campus') || svgRoot.querySelector('svg > g');
    const anchorTarget = mainGroup || svgRoot;
    anchorTarget.setAttribute('data-map-anchor', '');
    svgRoot.querySelectorAll('[data-map-anchor]').forEach((el) => {
      if (el !== anchorTarget) el.removeAttribute('data-map-anchor');
    });

    // Clear any transforms so the bbox reflects the true geometry.
    if (mainGroup) {
      mainGroup.removeAttribute('transform');
    }

    const raf =
      typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function'
        ? window.requestAnimationFrame
        : (fn) => setTimeout(fn, 16);
    const fitOptions = {
      padding: 128,
      scaleMultiplier: 0.8
    };

    const attemptFit = (attempt = 0) => {
      if (!zoomRef.current || typeof zoomRef.current.fitToElement !== 'function') return;
      const success = zoomRef.current.fitToElement(fitOptions);
      if (!success && attempt < 5) {
        raf(() => attemptFit(attempt + 1));
      }
    };

    raf(() => attemptFit());
  }, [ensureStudentHousingClasses]);

  // Header helper text
  const headerContent = (
    <span className="text-muted small">
      Use +/- buttons or scroll/pinch to zoom; drag to pan
    </span>
  );

  return (
    <PageContainer title="Campus Map" headerContent={headerContent} fluid={true}>
      <div className="map-wrap">
        {/* Disable autoFit so we can center manually */}
        <ZoomPan
          ref={zoomRef}
          initialScale={1}
          minScale={0.1}
          maxScale={6}
          className="map-viewport"
          disableDoubleClickZoom={true}
          autoFit={false}
          fitPadding={0}
          fitScaleMultiplier={0.70}
        >
          <InlineSvg
            src={src}
            className="w-100 h-100"
            interactiveSelector={interactiveSelector}
            selectedId={selectedId}
            onSelect={handleSelect}
            onReady={handleSvgReady}
          />
        </ZoomPan>
      </div>

      {error && (
        <div className="campus-popup-error">
          <div className="campus-popup-error-inner">
            <div className="mb-3">{error}</div>
            <button
              className="link-panel-button"
              onClick={() => {
                setError('');
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new Event('ggcmap-zoom-cancel'));
                }
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
