"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import Legend from "./legend";
import Links from "./Links";
import { canGoUp, canGoDown, getNextFloor, getPreviousFloor } from "../lib/floorNavigation";

/**
 * OverlayHUD renders three floating action buttons that hover over the map
 * and slide-in panels for Sidebar, Legend, and Helpful Links. Panels start closed.
 * Core components remain unchanged and are rendered inside the panels.
 * Also includes floor navigation controls (if buildingData is provided).
 * Includes a "Back to Campus" button that appears only in floor view.
 */
export default function OverlayHUD({ buildingData, currentFloorId, onFloorChange, isFloorView = false }) {
  const router = useRouter();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [openLegend, setOpenLegend] = useState(false);
  const [openLinks, setOpenLinks] = useState(false);

  // Ensure all panels start closed on first mount regardless of components' own persisted state
  useEffect(() => {
    setOpenSidebar(false);
    setOpenLegend(false);
    setOpenLinks(false);
  }, []);

  // Close other right-side panel when opening one (avoid overlap)
  const toggleLegend = () => {
    setOpenLegend((v) => {
      const next = !v;
      if (next) setOpenLinks(false);
      return next;
    });
  };

  const toggleLinks = () => {
    setOpenLinks((v) => {
      const next = !v;
      if (next) setOpenLegend(false);
      return next;
    });
  };

  return (
    <div className="overlay-hud" aria-label="Map controls">
      {/* Back to Campus button (top-left, above sidebar) - only in floor view */}
      {isFloorView && (
        <div className="overlay-hud-topleft-back" role="toolbar" aria-label="Navigation back">
          <button
            type="button"
            className="hud-btn"
            aria-label="Back to campus map"
            onClick={() => router.push("/")}
            title="Back to campus map"
          >
            <i className="bi bi-house-door" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Sidebar toggle button (top-left) */}
      <div className={`overlay-hud-topleft ${isFloorView ? 'has-back-button' : ''}`} role="toolbar" aria-label="Navigation toggle">
        <button
          type="button"
          className="hud-btn"
          aria-pressed={openSidebar}
          aria-label={openSidebar ? "Hide navigation" : "Show navigation"}
          onClick={() => setOpenSidebar((v) => !v)}
          title={openSidebar ? "Hide navigation" : "Show navigation"}
        >
          <i className="bi bi-list" aria-hidden="true" />
        </button>
      </div>

      {/* Floating buttons cluster (bottom-right) */}
      <div className="overlay-hud-buttons" role="toolbar" aria-label="Overlay control toggles">
        <button
          type="button"
          className="hud-btn"
          aria-pressed={openLegend}
          aria-label={openLegend ? "Hide legend" : "Show legend"}
          onClick={toggleLegend}
          title={openLegend ? "Hide legend" : "Show legend"}
        >
          <i className="bi bi-card-list" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hud-btn"
          aria-pressed={openLinks}
          aria-label={openLinks ? "Hide helpful links" : "Show helpful links"}
          onClick={toggleLinks}
          title={openLinks ? "Hide helpful links" : "Show helpful links"}
        >
          <i className="bi bi-link-45deg" aria-hidden="true" />
        </button>
      </div>

      {/* Sidebar panel (left side) */}
      <div className={`overlay-panel overlay-left ${openSidebar ? "is-open" : ""}`} role="dialog" aria-label="Navigation panel" aria-hidden={!openSidebar}>
        <div className="overlay-panel-inner">
          <div className="overlay-panel-header">
            <span className="overlay-panel-title">Explore Campus</span>
            <button type="button" className="overlay-close" onClick={() => setOpenSidebar(false)} aria-label="Close navigation">
              <i className="bi bi-x" aria-hidden="true" />
            </button>
          </div>
          <div className="overlay-panel-body">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Floor Navigation (bottom-left) */}
      {buildingData && (
        <div className="overlay-hud-floor-nav" role="group" aria-label="Floor navigation">
          <button 
            onClick={() => {
              const next = getNextFloor(buildingData?.floors, currentFloorId);
              if (next && onFloorChange) onFloorChange(next.id);
            }}
            disabled={!onFloorChange || !canGoUp(buildingData?.floors, currentFloorId)}
            className="hud-btn-arrow hud-btn-arrow-up"
            title="Upper Floor"
            aria-label="Go to upper floor"
          >
            <i className="bi bi-chevron-up" aria-hidden="true" />
          </button>
          
          <div className="floor-display-hud">
            <span className="current-floor-hud">{buildingData.floors.find(f => f.id === currentFloorId)?.label}</span>
            <span className="building-name-hud">{buildingData.name}</span>
          </div>
          
          <button 
            onClick={() => {
              const prev = getPreviousFloor(buildingData?.floors, currentFloorId);
              if (prev && onFloorChange) onFloorChange(prev.id);
            }}
            disabled={!onFloorChange || !canGoDown(buildingData?.floors, currentFloorId)}
            className="hud-btn-arrow hud-btn-arrow-down"
            title="Lower Floor"
            aria-label="Go to lower floor"
          >
            <i className="bi bi-chevron-down" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Legend panel (right side) */}
      <div className={`overlay-panel overlay-right ${openLegend ? "is-open" : ""}`} role="dialog" aria-label="Legend panel" aria-hidden={!openLegend}>
        <div className="overlay-panel-inner">
          <div className="overlay-panel-header">
            {/* <span className="overlay-panel-title">Legend</span> */}
            <button type="button" className="overlay-close" onClick={() => setOpenLegend(false)} aria-label="Close legend">
              <i className="bi bi-x" aria-hidden="true" />
            </button>
          </div>
          <div className="overlay-panel-body">
            <Legend />
          </div>
        </div>
      </div>

      {/* Helpful Links panel (right side) */}
      <div className={`overlay-panel overlay-right ${openLinks ? "is-open" : ""}`} role="dialog" aria-label="Helpful links panel" aria-hidden={!openLinks}>
        <div className="overlay-panel-inner">
          <div className="overlay-panel-header">
            <span className="overlay-panel-title">Helpful Links</span>
            <button type="button" className="overlay-close" onClick={() => setOpenLinks(false)} aria-label="Close helpful links">
              <i className="bi bi-x" aria-hidden="true" />
            </button>
          </div>
          <div className="overlay-panel-body">
            <Links forceOpen={true} />
          </div>
        </div>
      </div>
    </div>
  );
}
