"use client";

import { useState } from "react";
import rooms from "../data/rooms.json";
import buildings from "../data/buildings.json";
import { useRouter } from "next/navigation";
import { searchForRoom, validateSearchInput, parseFloorInput, formatNotFoundError, extractRoomNavInfo } from "../lib/searchUtils";
import { useLanguage } from "./LanguageContext";
import { getUIText } from "../lib/i18n";

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
  aec: { building: "W", level: "GL", room: "1160" },
  cisco: { building: "C", level: "L1", room: "1260" },
  park: { building: "D", level: "L1", room: "1125" },
  test: { building: "D", level: "L1", room: "1301" },
  den: { building: "A", level: "L1", room: "1510" },
  library: { building: "L", level: "L1", room: "1000" },
  gameroom: { building: "E", level: "L1", room: "gameroom" },
  cfa: { building: "A", level: "L1", room: "chickfila" },
};

// Spanish translations of aliases
const ALIASES_ES = {
  aec: { building: "W", level: "GL", room: "1160" },
  cisco: { building: "C", level: "L1", room: "1260" },
  park: { building: "D", level: "L1", room: "1125" },
  test: { building: "D", level: "L1", room: "1301" },
  den: { building: "A", level: "L1", room: "1510" },
  biblioteca: { building: "L", level: "L1", room: "1000" }, // library
  "sala de juegos": { building: "E", level: "L1", room: "gameroom" }, // gameroom
  cfa: { building: "A", level: "L1", room: "chickfila" },
};

export default function Find() {
  const [showHelp, setShowHelp] = useState(false);
  const [error, setError] = useState("");
  const [findValue, setFindValue] = useState("");
  const router = useRouter();
  const { locale } = useLanguage();
  const ui = getUIText(locale);

  const onFindClickButton = () => {
    const userInput = findValue.trim().toLowerCase();

    // Validate input
    if (!validateSearchInput(userInput)) {
      setError("You must enter a search term.");
      return;
    }

    // Clear previous errors
    setError("");

    // Determine which aliases to use based on current language
    const currentAliases = locale === 'es' ? { ...ALIASES, ...ALIASES_ES } : ALIASES;

    // 1. Check for room alias (quick navigation)
    if (currentAliases[userInput]) {
      const { building, level, room } = currentAliases[userInput];
      router.push(`/building/${building}/${level}?room=${encodeURIComponent(room)}`);
      return;
    }

    // 2. Check for single building letter (e.g., "b")
    if (validBuildings.includes(userInput) && userInput.length === 1) {
      const building = userInput.toUpperCase();
      const level = building === "W" ? "GL" : "L1";
      router.push(`/building/${building}/${level}`);
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
            placeholder={ui.find.searchPlaceholder}
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
            title={ui.find.searchButtonLabel}
            aria-label="Find"
          >
            <i className="bi bi-search"></i>
            <span className="find-btn-text">{ui.find.searchButtonLabel}</span>
          </button>

          <button 
            id="helpButton" 
            className="btn btn-secondary help-btn" 
            onClick={onHelpClick}
            title={ui.find.helpButtonLabel}
            aria-label="Help"
          >
            <i className="bi bi-question-circle"></i>
            <span className="help-btn-text">{ui.find.helpButtonLabel}</span>
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
                <h5 className="find-help-panel-title">{ui.find.helpPanelTitle}</h5>
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
                  <h6 className="find-help-section-title">{ui.find.searchFormatsTitle}</h6>
                  <div className="find-help-compact-table">
                    <div className="find-help-row">
                      <span className="find-help-key">{ui.find.buildingLetterKey}</span>
                      <span className="find-help-value">{ui.find.buildingLetterValue}</span>
                    </div>
                    <div className="find-help-row">
                      <span className="find-help-key">{ui.find.letterFloorKey}</span>
                      <span className="find-help-value">{ui.find.letterFloorValue}</span>
                    </div>
                    <div className="find-help-row">
                      <span className="find-help-key">{ui.find.letterRoomKey}</span>
                      <span className="find-help-value">{ui.find.letterRoomValue}</span>
                    </div>
                    <div className="find-help-row">
                      <span className="find-help-key">{ui.find.quickAliasesKey}</span>
                      <span className="find-help-value"><strong>{ui.find.quickAliasesValue}</strong></span>
                    </div>
                    <div className="find-help-row">
                      <span className="find-help-key">{ui.find.anyTextKey}</span>
                      <span className="find-help-value">{ui.find.anyTextValue}</span>
                    </div>
                  </div>
                </div>

                <div className="find-help-section">
                  <h6 className="find-help-section-title">{ui.find.quickExamplesTitle}</h6>
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


