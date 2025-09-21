import { useState } from "react";
const maxCharsAllowed = 30;
const validInput=["a","b","c","d","e","f","h","i","l","w","2000","3000"];


export default function Find() {
  const [showHelp, setShowHelp] = useState(false);
  const [error,setError]=useState("");
  const [findValue, setFindValue] = useState("");

  const onFindClickButton = () => {
    
    const userInput=findValue.trim().toLowerCase();

    if (userInput === "") {
      setError("You must enter a search term.");
    }
    else if(!validInput.includes(userInput)){
      setError(findValue+" is not valid");
    }
     else {
      setError(""); 
      console.log("Searching for:", findValue);
    }
  };

  const onHelpClick = () => {
    setShowHelp(true);
  };

  return (
    <>
      <div className="d-flex align-items-center" style={{ gap: "var(--justin-globe-gap)" }}>        
        <label htmlFor="findlabel" className="h4 mb-0" style={{fontFamily: "var(--justin-globe1)",color: "var(--justin-globe1-color)"}}>Find:</label>

        <input
          id="findInput"
          className="form-control w-100"
          placeholder="AEC, gameroom, library"
          maxLength={maxCharsAllowed}
          style={{ width: "var(--justin-globe-inputBarSize)" }}
          value={findValue}
          onChange={(e) => setFindValue(e.target.value)}
        />
        <button id="findInputButton" className="btn btn-primary" onClick={onFindClickButton}>Find</button>

        
        <button id="helpButton" className="btn btn-secondary" onClick={onHelpClick}>Help</button>
        <br></br>
      </div>

        {error && (
        <div style={{ color: "red", marginTop: "0.5rem" }}>
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


