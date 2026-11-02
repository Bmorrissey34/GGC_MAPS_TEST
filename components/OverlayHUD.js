"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Legend from "./legend";
import Links from "./Links";
import LanguageToggle from "./LanguageToggle";
import {
  canGoUp,
  canGoDown,
  getNextFloor,
  getPreviousFloor,
} from "../lib/floorNavigation";
import { useLanguage } from "./LanguageContext";
import {
  getUIText,
  translateBuildingName,
  translateFloorLabel,
} from "../lib/i18n";
import buildings from "../data/buildings.json";

/**
 * OverlayHUD renders three floating action buttons that hover over the map
 * and slide-in panels for Sidebar, Legend, and Helpful Links. Panels start closed.
 * Core components remain unchanged and are rendered inside the panels.
 * Also includes floor navigation controls (if buildingData is provided).
 * Includes a "Back to Campus" button that appears only in floor view.
 */
export default function OverlayHUD({
  buildingData,
  currentFloorId,
  onFloorChange,
  isFloorView = false,
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [openSidebar, setOpenSidebar] = useState(false);
  const [rightPanel, setRightPanel] = useState(null);
  const openLegend = rightPanel === "legend";
  const openLinks = rightPanel === "links";
  const { locale } = useLanguage();
  const ui = getUIText(locale);
  const overlayCopy = ui.overlay;

  const isCampusView = !pathname || pathname === "/" || pathname === "/campus";
  const buildingId = pathname?.startsWith("/building/")
    ? pathname.split("/").filter(Boolean)[1]?.toUpperCase()
    : null;
  const currentBuilding = buildings.find(b => String(b.id).toUpperCase() === buildingId);
  const mapTitle = isCampusView
    ? ui.mapHeader.campusMap
    : currentBuilding ? translateBuildingName(currentBuilding.name, locale) : null;

  // One value keeps the two right-side panels mutually exclusive.
  const toggleRightPanel = (panel) => {
    setRightPanel(current => current === panel ? null : panel);
  };

  const currentFloor = buildingData?.floors.find((f) => f.id === currentFloorId);
  const translatedFloorLabel = translateFloorLabel(currentFloor?.label, locale);

  return (
    <div className="overlay-hud" aria-label={overlayCopy.mapControls}>
      {/* Map header (top center) */}
      {mapTitle && (
        <div className="overlay-hud-header-top">
          <div className="overlay-map-header">
            <h2 className="overlay-map-title">{mapTitle}</h2>
          </div>
        </div>
      )}

      {/* Back to Campus button (top-left, above sidebar) - only in floor view */}
      {isFloorView && (
        <div
          className="overlay-hud-topleft-back"
          role="toolbar"
          aria-label={overlayCopy.backToolbar}
        >
          <button
            type="button"
            className="hud-btn hud-btn-static"
            aria-label="Back to campus map"
            onClick={() => router.push("/")}
            title={overlayCopy.backToCampus}
          >
            <i className="bi bi-house-door" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Sidebar toggle button (top-left) */}
      <div
        className={`overlay-hud-topleft ${
          isFloorView ? "has-back-button" : ""
        }`}
        role="toolbar"
        aria-label={overlayCopy.navigationToolbar}
      >
        <button
          type="button"
          className="hud-btn"
          aria-pressed={openSidebar}
          aria-label={
            openSidebar
              ? overlayCopy.hideNavigation
              : overlayCopy.showNavigation
          }
          onClick={() => setOpenSidebar((v) => !v)}
          title={
            openSidebar
              ? overlayCopy.hideNavigation
              : overlayCopy.showNavigation
          }
        >
          <i className="bi bi-list" aria-hidden="true" />
          <span className="hud-btn-label">{overlayCopy.menuLabel}</span>
        </button>
      </div>

      {/* Floating buttons cluster (bottom-right) */}
      <div
        className="overlay-hud-buttons"
        role="toolbar"
        aria-label={overlayCopy.legendToolbar}
      >
        {!isFloorView && (
          <button
            type="button"
            className="hud-btn"
            aria-pressed={openLegend}
            aria-label={
              openLegend ? overlayCopy.hideLegend : overlayCopy.showLegend
            }
            onClick={() => toggleRightPanel("legend")}
            title={
              openLegend ? overlayCopy.hideLegend : overlayCopy.showLegend
            }
          >
            <i className="bi bi-card-list" aria-hidden="true" />
            <span className="hud-btn-label">{overlayCopy.legendLabel}</span>
          </button>
        )}
        <button
          type="button"
          className="hud-btn"
          aria-pressed={openLinks}
          aria-label={
            openLinks ? overlayCopy.hideLinks : overlayCopy.showLinks
          }
          onClick={() => toggleRightPanel("links")}
          title={openLinks ? overlayCopy.hideLinks : overlayCopy.showLinks}
        >
          <i className="bi bi-link-45deg" aria-hidden="true" />
          <span className="hud-btn-label">{overlayCopy.linksLabel}</span>
        </button>
      </div>

      {/* Sidebar panel (left side) */}
      <div
        className={`overlay-panel overlay-left ${
          openSidebar ? "is-open" : ""
        }`}
        role="dialog"
        aria-label={overlayCopy.navigationPanelAria}
        aria-hidden={!openSidebar}
      >
        <div className="overlay-panel-inner">
          <div className="overlay-panel-header">
            <span className="overlay-panel-title">
              {overlayCopy.navigationPanelTitle}
            </span>
            <div className="overlay-panel-header-right">
              <LanguageToggle className="overlay-language-toggle-compact" />
              <button
                type="button"
                className="overlay-close"
                onClick={() => setOpenSidebar(false)}
                aria-label={overlayCopy.closeNavigation}
              >
                <i className="bi bi-x" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div className="overlay-panel-body">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Bottom-left controls container */}
      <div className="overlay-hud-bottomleft">
        {/* Floor Navigation (appears in building view) */}
        {buildingData && (
          <div
            className="overlay-hud-floor-nav"
            role="group"
            aria-label={overlayCopy.floorNavigation}
          >
            <button
              onClick={() => {
                const next = getNextFloor(buildingData?.floors, currentFloorId);
                if (next && onFloorChange) onFloorChange(next.id);
              }}
              disabled={
                !onFloorChange ||
                !canGoUp(buildingData?.floors, currentFloorId)
              }
              className="hud-btn-arrow hud-btn-arrow-up"
              title={overlayCopy.upperFloorTitle}
              aria-label={overlayCopy.goUpperFloor}
            >
              <i className="bi bi-chevron-up" aria-hidden="true" />
            </button>

            <div className="floor-display-hud">
              <span className="current-floor-hud">
                {translatedFloorLabel || currentFloor?.label}
              </span>
            </div>

            <button
              onClick={() => {
                const prev = getPreviousFloor(
                  buildingData?.floors,
                  currentFloorId
                );
                if (prev && onFloorChange) onFloorChange(prev.id);
              }}
              disabled={
                !onFloorChange ||
                !canGoDown(buildingData?.floors, currentFloorId)
              }
              className="hud-btn-arrow hud-btn-arrow-down"
              title={overlayCopy.lowerFloorTitle}
              aria-label={overlayCopy.goLowerFloor}
            >
              <i className="bi bi-chevron-down" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Legend panel (right side) */}
      <div
        className={`overlay-panel overlay-right ${
          openLegend ? "is-open" : ""
        }`}
        role="dialog"
        aria-label={overlayCopy.legendPanelAria}
        aria-hidden={!openLegend}
      >
        <div className="overlay-panel-inner">
          <div className="overlay-panel-header">
            <button
              type="button"
              className="overlay-close"
              onClick={() => setRightPanel(null)}
              aria-label={overlayCopy.closeLegend}
            >
              <i className="bi bi-x" aria-hidden="true" />
            </button>
          </div>
          <div className="overlay-panel-body">
            <Legend />
          </div>
        </div>
      </div>

      {/* Helpful Links panel (right side) */}
      <div
        className={`overlay-panel overlay-right ${
          openLinks ? "is-open" : ""
        }`}
        role="dialog"
        aria-label={overlayCopy.linksPanelAria}
        aria-hidden={!openLinks}
      >
        <div className="overlay-panel-inner">
          <div className="overlay-panel-header">
            <span className="overlay-panel-title">
              {overlayCopy.helpfulLinksTitle}
            </span>
            <button
              type="button"
              className="overlay-close"
              onClick={() => setRightPanel(null)}
              aria-label={overlayCopy.closeLinks}
            >
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
