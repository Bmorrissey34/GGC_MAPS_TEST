"use client";

import { useState, useEffect, useMemo } from "react";
import rooms from "../data/rooms.json";
import { useRouter } from "next/navigation";
const maxCharsAllowed = 30;
const validBuildings=["a","b","c","d","e","f","g","h","i","l","w"];
const validBuildingFloors=["a1","b1","b2","b3","c1","c2","d1","d2","e1","e2","e3","f1","f2","h1","h2","h3","i1","i2","i3","l1","l2","l3","w1","w2","w3"];

function highlightInPage(roomId) {
  const host = document.querySelector(".floor-content");
  if (!host) return false;

  const svg = host.querySelector("svg");
  if (!svg) return false;

  svg.querySelectorAll(".active-room").forEach(el =>
    el.classList.remove("active-room")
  );

  const group =
    svg.querySelector(`g.room-group[id="${CSS.escape(roomId)}"]`) ||
    svg.querySelector(`g[id="${CSS.escape(roomId)}"]`);
  if (!group) return false;

 const shape = group.querySelector(".room") || group.querySelector("rect, polygon, path");
  const label = group.querySelector(".label") || group.querySelector("text");

  if (shape) shape.classList.add("active-room");  
  if (label) label.classList.add("label--active"); 

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
  const [error,setError]=useState("");
  const [findValue, setFindValue] = useState("");
  const router=useRouter();
  const ALIASES = {
  aec: { building: "W", level: "L1", room: "1160" }, 
  cisco: { building: "C", level: "L1", room: "1260" },
  park: {building: "D", level: "L1", room: "1125"},
  test: {building: "D", level: "L1", room: "1301"},
  den: {building: "A", level: "L1", room: "1510"},
};

  const onFindClickButton = () => {
    
    const userInput=findValue.trim().toLowerCase();

    if (userInput === "") {
      setError("You must enter a search term.");
    }

    const aliasHit = ALIASES[userInput];
    if (aliasHit) {
      setError("");
      const { building, level, room } = aliasHit;
      router.push(`/building/${building}/${level}?room=${encodeURIComponent(room)}`);

      const svgHere = document.querySelector(
    `.floor-content svg[data-building="${building}"][data-level="${level}"]`
  );

      if (svgHere) {
    highlightWithRetry(room);
  } else {
    router.push(`/building/${building}/${level}?room=${encodeURIComponent(room)}`);
  
  }
      highlightInPage(room);
      highlightWithRetry(room);
      return;
    }

    else if(validBuildings.includes(userInput)&&userInput.length===1){
      const building=userInput.toUpperCase();
      router.push(`/building/${building}/L1`);
      setError("");
    }

    else if(validBuildingFloors.includes(userInput)&&userInput.length===2){
      const building=userInput.slice(0,1).toUpperCase();
      const floor=userInput.slice(1).toUpperCase();
      router.push(`/building/${building}/L${floor}`);
      setError("");
    }

    else if(userInput==="help"){
      setShowHelp(true);
    }

    else{
     let match = rooms.find((room) => {
    (room) => (room.uniqueId || "").toLowerCase() === userInput
});

      if (!match) {
    match = rooms.find((room) => {
      const [building, level, roomNumber] = room.uniqueId.split("-");
      return (building.toLowerCase() + roomNumber.toLowerCase()) === userInput;
    });
  }

      if (!match) {
      setError(findValue + " is not valid");
      return;
    } else {
      setError("");
  const building = userInput[0].toUpperCase();
  const m = userInput.match(/^[a-z](\d)/i);
  if (!m) { setError("Invalid room format."); return; }
  const floor = m[1];
  const roomOnly = findValue.trim().replace(/^[a-z]/i, ""); 
  highlightWithRetry(roomOnly);

  if (highlightInPage(roomOnly)) return;
  router.push(`/building/${building}/L${floor}?room=${encodeURIComponent(roomOnly)}`);
      
    }


  }

  }; //find end

  const onHelpClick = () => {
    setShowHelp(true);
  };

  return (
    <>
      <div className="d-flex align-items-center" style={{ gap: "var(--justin-globe-gap)" }}>        
        <label htmlFor="findlabel" className="h4 mb-0" style={{fontFamily: "var(--justin-globe1)",color: "white"}}>Find:</label>

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
          onKeyDown={(e) => e.key === "Enter" && onFindClickButton()}
        />
        <button id="findInputButton" className="btn btn-primary" onClick={onFindClickButton}>Find</button>

        
        <button id="helpButton" className="btn btn-secondary" onClick={onHelpClick}>Help</button>
        <br></br>
      </div>

        {error && (
        <div style={{ color: "hotpink", marginTop: "0.5rem", fontWeight: "bold" }}>
           {error}
        </div>
        )}
      
      

      {showHelp && (
        <div className="position-fixed top-50 start-50 translate-middle bg-white label-4 border rounded shadow" style={{ zIndex: 1050, height:"800px" ,width: "800px", textAlign: "center" }}>
          <h5 style={{color:"blue"}}>Help  (not case sensitivie)</h5>
          <table className="table table-bordered table-striped table-lg table-half" style={{  tableLayout: "fixed", width: "100%",  wordWrap: "break-word", overflowWrap: "break-word" }}>
            <thead>
                <tr>
                    <th className="w-50">What you search</th>
                    <th className="w-50">What it does</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td className="w-50">Valid building letter</td>
                    <td className="w-50">Goes to building</td>
                </tr>
                <tr>
                    <td className="w-50">Valid building letter and room #</td>
                    <td className="w-50">Goes to building and highlights room</td>
                </tr>
                <tr>
                    <td className="w-50">Valid building letter and floor #</td>
                    <td className="w-50">Goes to floor entered in building building</td>
                </tr>
                <tr>
                    <td className="w-50">Room nicknames (aec,cfa,game,gym,book)</td>
                    <td className="w-50">Goes to room</td>
                </tr>
                <tr>
                    <td className="w-50">Food</td>
                    <td className="w-50">Shows all places to eat on campus</td>
                </tr>
                <tr>
                    <td className="w-50">Park</td>
                    <td className="w-50">Shows all places to park on campus</td>
                </tr>
                <tr>
                    <td className="w-50">sport/athlete/exersize/workout</td>
                    <td className="w-50">Shows all places related to sports or exersize on campus</td>
                </tr>
                <tr>
                    <td className="w-50">Help</td>
                    <td className="w-50">Shows all school support services</td>
                </tr>
                <tr>
                    <td className="w-50">ggc</td>
                    <td className="w-50">Shows whole campus</td>
                </tr>

            </tbody>
          </table>
          <h4 style={{color:"blue"}}>Searches that work</h4>
          <label style={{color:"blue"}}>b goes to building b</label>
          <br></br>
          <label style={{color:"blue"}}>b2 goes to building b floor 2</label>
          <br></br>
          <label style={{color:"blue"}}>b2210 goes to building b room 2210</label>
          <br></br>
          <label style={{color:"blue"}}>cfa/chick fil a goes to chick fil a</label>
          <br></br>
          <button className="btn btn-primary" style={{marginTop: "auto"}} onClick={() => setShowHelp(false)}>Close</button>
        </div>
      )}
    </>
  );
}


