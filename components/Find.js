"use client";

import { useState } from "react";
import rooms from "../data/rooms.json";
import { useRouter } from "next/navigation";
import { searchForRoom, validateSearchInput, parseFloorInput, formatNotFoundError, extractRoomNavInfo } from "../lib/searchUtils";
const maxCharsAllowed = 30;
const validBuildings = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "l", "w"];
const validBuildingFloors = ["a1", "b1", "b2", "b3", "c1", "c2", "d1", "d2", "e1", "e2", "e3", "f1", "f2", "h1", "h2", "h3", "i1", "i2", "i3", "l1", "l2", "l3", "w1", "w2", "w3"];

// Room aliases for quick navigation to common locations
const ALIASES = {
  aec: { building: "W", level: "L1", room: "1160" },
  cisco: { building: "C", level: "L1", room: "1260" },
  park: { building: "D", level: "L1", room: "1125" },
  test: { building: "D", level: "L1", room: "1301" },
  den: { building: "A", level: "L1", room: "1510" },
};

function highlightInPage(roomId) {
  const host = document.querySelector(".floor-content");
  if (!host) return false;

  const svg = host.querySelector("svg");
  if (!svg) return false;

  // Clear previous highlights
  svg.querySelectorAll(".active-room").forEach(el =>
    el.classList.remove("active-room")
  );

  // Find the room group or element
  const group =
    svg.querySelector(`g.room-group[id="${CSS.escape(roomId)}"]`) ||
    svg.querySelector(`g[id="${CSS.escape(roomId)}"]`);
  if (!group) return false;

  const shape = group.querySelector(".room") || group.querySelector("rect, polygon, path");
  const label = group.querySelector(".label") || group.querySelector("text");

  if (shape) shape.classList.add("active-room");
  if (label) label.classList.add("label--active");

  // Ensure elements are rendered on top
  if (shape?.parentElement) shape.parentElement.appendChild(shape);
  if (label?.parentElement) label.parentElement.appendChild(label);

  return true;
}

function highlightWithRetry(roomId, attempts = 10, delay = 100) {
  const ok = highlightInPage(roomId);
  if (ok) return;

  if (attempts <= 0) return;
  setTimeout(() => highlightWithRetry(roomId, attempts - 1, delay), delay);
}


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
      highlightWithRetry(room);
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
    highlightWithRetry(roomNumber);
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
      <div className="d-flex align-items-center" style={{ gap: "var(--justin-globe-gap)" }}>
        <label htmlFor="findlabel" className="h4 mb-0" style={{ fontFamily: "var(--justin-globe1)", color: "white" }}>
          Find:
        </label>

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
        />
        <button id="findInputButton" className="btn btn-primary" onClick={onFindClickButton}>
          Find
        </button>

        <button id="helpButton" className="btn btn-secondary" onClick={onHelpClick}>
          Help
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "hotpink",
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
        <div className="find-help-dialog">
          <h5 style={{ color: "blue" }}>Help (not case sensitive)</h5>
          <table className="table table-bordered table-striped" style={{ tableLayout: "fixed", width: "100%", wordWrap: "break-word", overflowWrap: "break-word" }}>
            <thead>
              <tr>
                <th>What you search</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Valid building letter</td>
                <td>Goes to building</td>
              </tr>
              <tr>
                <td>Valid building letter and room #</td>
                <td>Goes to building and highlights room</td>
              </tr>
              <tr>
                <td>Valid building letter and floor #</td>
                <td>Goes to floor entered in building</td>
              </tr>
              <tr>
                <td>Room nicknames (aec, cisco, park, test, den)</td>
                <td>Goes to room</td>
              </tr>
              <tr>
                <td>Help</td>
                <td>Shows this help dialog</td>
              </tr>
            </tbody>
          </table>
          <h4 style={{ color: "blue", marginTop: "1.5rem" }}>Searches that work</h4>
          <label style={{ color: "blue", display: "block", marginBottom: "0.5rem" }}>
            <strong>b</strong> goes to building B
          </label>
          <label style={{ color: "blue", display: "block", marginBottom: "0.5rem" }}>
            <strong>b2</strong> goes to building B floor 2
          </label>
          <label style={{ color: "blue", display: "block", marginBottom: "0.5rem" }}>
            <strong>b2210</strong> goes to building B room 2210 and highlights it
          </label>
          <label style={{ color: "blue", display: "block", marginBottom: "1rem" }}>
            <strong>aec</strong> goes to AEC location
          </label>
          <button className="btn btn-primary" onClick={() => setShowHelp(false)}>
            Close
          </button>
        </div>
      )}
    </>
  );
}


