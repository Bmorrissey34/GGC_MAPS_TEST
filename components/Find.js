"use client";

import { useState } from "react";
import rooms from "../data/rooms.json";
import buildings from "../data/buildings.json";
import { useRouter } from "next/navigation";
import { searchForRoom, validateSearchInput, parseFloorInput, formatNotFoundError, extractRoomNavInfo } from "../lib/searchUtils";

const maxCharsAllowed = 30;

// Dynamically generate valid buildings and floors from buildings.json
const validBuildings = buildings.map(b => b.id.toLowerCase());
const validBuildingFloors = buildings.flatMap(b =>
  b.floors.map(f => {
    const floorNum = f.id.match(/\d+/)?.[0] || '';
    return `${b.id.toLowerCase()}${floorNum}`;
  })
);

// Room aliases for quick navigation to common locations
const ALIASES = {
  aec: { building: "W", level: "L1", room: "1160" },
  cisco: { building: "C", level: "L1", room: "1260" },
  park: { building: "D", level: "L1", room: "1125" },
  test: { building: "D", level: "L1", room: "1301" },
  den: { building: "A", level: "L1", room: "1510" },
};

export default function Find() {
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState("");
  const [findValue, setFindValue] = useState("");
  const router = useRouter();

  const onFindClickButton = () => {
    const userInput = findValue.trim().toLowerCase();

    // Validate input
    if (!validateSearchInput(userInput)) {
      setError("You must enter a search term.");
      return;
    }

    // Clear previous errors
    setError("");

    // 1. Check for room alias (quick navigation)
    if (ALIASES[userInput]) {
      const { building, level, room } = ALIASES[userInput];
      router.push(`/building/${building}/${level}?room=${encodeURIComponent(room)}`);
      return;
    }

    // 2. Check for single building letter (e.g., "b")
    if (validBuildings.includes(userInput) && userInput.length === 1) {
      const building = userInput.toUpperCase();
      router.push(`/building/${building}/L1`);
      return;
    }

    // 3. Check for building + floor (e.g., "b2")
    if (validBuildingFloors.includes(userInput) && userInput.length === 2) {
      const floorData = parseFloorInput(userInput);
      if (floorData) {
        router.push(`/building/${floorData.building}/L${floorData.floor}`);
        return;
      }
    }

    // 4. Check for help request
    if (userInput === "help") {
      setShowHelp(true);
      return;
    }

    // 5. Search for room by query
    const match = searchForRoom(userInput, rooms);
    if (!match) {
      setError(formatNotFoundError(findValue));
      return;
    }

    // Extract navigation info from matched room
    const navInfo = extractRoomNavInfo(match);
    if (!navInfo) {
      setError("Invalid room format in database.");
      return;
    }

    // Navigate to the room and highlight it
    const { building, floor, roomNumber } = navInfo;
    router.push(`/building/${building}/L${floor}?room=${encodeURIComponent(roomNumber)}`);
  };

  const onHelpClick = () => {
    setShowHelp(true);
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") {
      onFindClickButton();
    }
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%" }}>
        <div className="d-flex align-items-center" style={{ gap: "var(--justin-globe-gap)" }}>
          

          <input
            id="findInput"
            type="text"
            size={"50"}
            className="form-control w-100"
            placeholder="AEC, gameroom, library"
            maxLength={maxCharsAllowed}
            style={{ width: "var(--justin-globe-inputBarSize)" }}
            value={findValue}
            onChange={(e) => setFindValue(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search for buildings or rooms"
          />
          <button 
            id="findInputButton" 
            className="btn btn-primary find-btn" 
            onClick={onFindClickButton}
            title="Search for the entered term"
            aria-label="Find"
          >
            <i className="bi bi-search"></i>
            <span className="find-btn-text">Find</span>
          </button>

          <button 
            id="helpButton" 
            className="btn btn-secondary help-btn" 
            onClick={onHelpClick}
            title="Show search help"
            aria-label="Help"
          >
            <i className="bi bi-question-circle"></i>
            <span className="help-btn-text">Help</span>
          </button>
        </div>

        {error && (
          <div
            style={{
              color: "red",
              marginLeft: "10px",
              textAlign: "center",
              marginTop: "0.5rem",
              fontWeight: "bold",
              fontSize: "clamp(0.75rem, 1.5vw, 0.875rem)",
              wordWrap: "break-word",
              overflow: "hidden"
            }}
          >
            {error}
          </div>
        )}

        {showHelp && (
          <div className="find-help-panel-overlay">
            <div className="find-help-panel">
              <div className="find-help-panel-header">
                <h5 className="find-help-panel-title">Search Help</h5>
                <button 
                  className="find-help-panel-close" 
                  onClick={() => setShowHelp(false)}
                  aria-label="Close help panel"
                  title="Close"
                >
                  <i className="bi bi-x" aria-hidden="true"></i>
                </button>
              </div>
              
              <div className="find-help-panel-content">
                <div className="find-help-section">
                  <h6 className="find-help-section-title">Search Formats (not case sensitive)</h6>
                  <div className="find-help-compact-table">
                    <div className="find-help-row">
                      <span className="find-help-key">Building letter</span>
                      <span className="find-help-value">e.g., <strong>b</strong> → Building B</span>
                    </div>
                    <div className="find-help-row">
                      <span className="find-help-key">Letter + floor</span>
                      <span className="find-help-value">e.g., <strong>b2</strong> → Building B, Floor 2</span>
                    </div>
                    <div className="find-help-row">
                      <span className="find-help-key">Letter + room</span>
                      <span className="find-help-value">e.g., <strong>b2210</strong> → Room 2210, highlighted</span>
                    </div>
                    <div className="find-help-row">
                      <span className="find-help-key">Quick aliases</span>
                      <span className="find-help-value"><strong>aec, cisco, park, test, den</strong></span>
                    </div>
                    <div className="find-help-row">
                      <span className="find-help-key">Any text</span>
                      <span className="find-help-value">e.g., <strong>gameroom, library</strong> → Search results</span>
                    </div>
                  </div>
                </div>

                <div className="find-help-section">
                  <h6 className="find-help-section-title">Quick Examples</h6>
                  <ul className="find-help-examples">
                    <li><strong>a</strong> → Building A</li>
                    <li><strong>c3</strong> → Building C, Floor 3</li>
                    <li><strong>a1510</strong> → Room 1510 in Building A</li>
                    <li><strong>aec</strong> → AEC (quick link)</li>
                  </ul>
                </div>
              </div>

              <div className="find-help-panel-footer"></div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}


