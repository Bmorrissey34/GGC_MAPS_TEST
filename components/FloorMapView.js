// components/FloorMapView.js
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import ZoomPan from './ZoomPan';
import OverlayHUD from './OverlayHUD';
import { sanitizeSvgMarkup } from '../lib/svgUtils';
import { assetPath } from '../lib/constants';
import { useElementSelection } from '../hooks/useElementSelection';
import { useLanguage } from './LanguageContext';
import { getUIText } from '../lib/i18n';

// FloorMapView component for rendering an interactive floor map
export default function FloorMapView({ 
  src, 
  interactiveSelector = '.room-group, .room, .label',
  buildingData,
  currentFloorId,
  onFloorChange,
  onRoomSelect,
  focusRoomId = null,
}) {
  const [svgContent, setSvgContent] = useState('');
  const containerRef = useRef(null);
  const controlsRef = useRef(null);
  const loadedSrcRef = useRef(null);
  const [, setSelectedId] = useElementSelection(containerRef.current, svgContent);
  const { locale } = useLanguage();
  const ui = getUIText(locale);

  // Handles the selection of a room or area on the map
  const handleSelect = useCallback((id) => {
    if (id) {
      setSelectedId(String(id).trim()); // Update the selected ID state
      if (onRoomSelect) {
        onRoomSelect(String(id).trim()); // Notify parent of room selection
      }
    }
  }, [onRoomSelect, setSelectedId]);

  // Load SVG as text so events bubble to ZoomPan
  useEffect(() => {
    let isMounted = true;
    loadedSrcRef.current = null;
    setSvgContent('');
    setSelectedId(null);
    (async () => {
      try {
        const assetSrc = assetPath(src);
        const res = await fetch(assetSrc, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const raw = await res.text();
        const sanitized = sanitizeSvgMarkup(raw);
        if (isMounted) {
          loadedSrcRef.current = src;
          setSvgContent(sanitized);
        }
      } catch {
        if (isMounted) setSvgContent('<svg xmlns="http://www.w3.org/2000/svg"><text x="10" y="20">Failed to load map</text></svg>');
      }
    })();
    return () => { isMounted = false; };
  }, [src, setSelectedId]);

  // Post-process injected SVG: sizing, disable links, and click selection
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !svgContent) return;

    // Normalize SVG sizing for responsive layout
    const svg = container.querySelector('svg');
    if (svg) {
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      svg.style.width = '100%';
      svg.style.height = 'auto';
      svg.style.display = 'block';
    }

    // Disable navigation inside the SVG
    container.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      if (href) {
        link.setAttribute('data-original-href', href);
        link.removeAttribute('href');
      }
    });

    // Delegate click to capture element IDs
    const onClick = (e) => {
      const clickable =
        e.target.closest(interactiveSelector) ||
        e.target.closest('[id]');
      if (!clickable) return;
      e.preventDefault();
      const group = clickable.closest('.room-group');
      const idSource = group?.id || clickable.id || clickable.getAttribute('id');
      if (idSource) {
        handleSelect(idSource.trim());
      }
    };

    container.addEventListener('click', onClick);
    return () => container.removeEventListener('click', onClick);
  }, [svgContent, interactiveSelector, handleSelect]);

  const focusRoom = useCallback((roomId) => {
    if (!roomId || loadedSrcRef.current !== src) return false;
    const svg = containerRef.current?.querySelector('svg');
    // Exact ID comparison also handles numeric room IDs without CSS escaping.
    const target = Array.from(svg?.querySelectorAll('[id]') || [])
      .find(element => element.id === String(roomId));
    if (!target) return false;

    setSelectedId(target.id);
    const shape = target.querySelector('.room') || target;
    return controlsRef.current?.fitToElement(shape, { padding: 48, scaleMultiplier: 0.5 }) ?? false;
  }, [src, setSelectedId]);

  useEffect(() => {
    if (!svgContent || !focusRoomId) return;
    // Measure after the injected SVG has been sized and laid out.
    const frame = requestAnimationFrame(() => focusRoom(focusRoomId));
    return () => cancelAnimationFrame(frame);
  }, [svgContent, focusRoomId, focusRoom]);

  useEffect(() => {
    const refocus = ({ detail }) => {
      if (detail?.building === buildingData?.id && detail?.floor === currentFloorId &&
          detail?.roomId === focusRoomId) focusRoom(detail.roomId);
    };
    window.addEventListener('ggcmap-focus-room', refocus);
    return () => window.removeEventListener('ggcmap-focus-room', refocus);
  }, [buildingData?.id, currentFloorId, focusRoomId, focusRoom]);

  return (
    <div className="map-wrap" data-building={buildingData?.id}>
      <ZoomPan
        ref={containerRef}
        controlsRef={controlsRef}
        initialScale={1}
        minScale={0.1}
        maxScale={6}
        className="map-viewport"
        disableDoubleClickZoom={true}
        autoFit={false}
        fitPadding={0}
        fitScaleMultiplier={0.70}
        resetLabel={ui.overlay.resetLabel}
        resetAriaLabel={ui.overlay.resetAria}
      >
        <div
          className="w-100 h-100"
          style={{ pointerEvents: 'auto' }}
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />
      </ZoomPan>

      <OverlayHUD buildingData={buildingData} currentFloorId={currentFloorId} onFloorChange={onFloorChange} isFloorView={true} />
    </div>
  );
}
