import { useState } from "react";
const maxCharsAllowed = 30;

export default function Find() {
  const [showHelp, setShowHelp] = useState(false);

  const onHelpClick = () => {
    setShowHelp(true);
  };

  return (
    <>
      <div
        className="d-flex align-items-center"
        style={{ gap: "var(--justin-globe-gap)" }}
      >

        
        <label htmlFor="findlabel" className="h4 mb-0" style={{fontFamily: "var(--justin-globe1)",color: "var(--justin-globe1-color)"}}>Find:</label>

        <input
          id="findInput"
          className="form-control w-100"
          placeholder="AEC, gameroom, library"
          maxLength={maxCharsAllowed}
          style={{ width: "var(--justin-globe-inputBarSize)" }}
        />
        <button id="findInputButton" className="btn btn-primary">Find</button>




        <button id="helpButton" className="btn btn-secondary" onClick={onHelpClick}>Help</button>
      </div>

      {showHelp && (
        <div className="position-fixed top-50 start-50 translate-middle bg-white p-4 border rounded shadow" style={{ zIndex: 1050, height:"800px" ,width: "800px", textAlign: "center" }}>
          <h5 style={{color:"blue"}}>Help  (not case sensitivie)</h5>
          <table className="table table-bordered table-striped table-lg table-half" style={{ border: "var(--justin-globe3-border)", tableLayout: "fixed", width: "100%",  wordWrap: "break-word", overflowWrap: "break-word" }}>
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
                    <td className="w-50">Help</td>
                    <td className="w-50">Shows this help menu</td>
                </tr>
                <tr>
                    <td className="w-50">ggc</td>
                    <td className="w-50">Shows whole campus</td>
                </tr>

            </tbody>
          </table>
          <button className="btn btn-primary" style={{marginTop: "auto"}} onClick={() => setShowHelp(false)}>Close</button>
        </div>
      )}
    </>
  );
}
