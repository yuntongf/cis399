import logo from "./logo.svg";
import "./App.css";
import video from "./cow.mp4";
import webgazer from "webgazer";
import { useEffect, useState } from "react";
const fs = require("fs");

function App() {
  const [showGrid, setShowGrid] = useState(false);
  const [calibrationDone, setCalibration] = useState(false);
  const [clickCounts, setClickCounts] = useState(Array(9).fill(0));
  // const fs = require("fs");

  const handleSubmit = () => {
    setShowGrid(true);
    webgazer
      .setGazeListener((data, elapsedTime) => {
        if (data == null) {
          return;
        }
        const x = data.x; // these x coordinates are relative to the viewport
        const y = data.y; // these y coordinates are relative to the viewport

        // write coordinates to CSV file
        fs.appendFileSync("coordinates.csv", `${x},${y}\n`, function (err) {
          if (err) throw err;
        });

        console.log(x, y);
      })
      .begin();
  };

  const handleCircleClick = (index) => {
    // Implement logic for tracking circle clicks
    const newClickCounts = [...clickCounts];
    newClickCounts[index]++;
    setClickCounts(newClickCounts);
    // console.log("Circle clicked: ", index);
  };

  useEffect(() => {
    // Check if any circle has been clicked three times
    if (clickCounts.every((count) => count >= 10)) {
      // Hide the grid and return to original page after a short delay
      const timeout = setTimeout(() => {
        setShowGrid(false);
        setCalibration(true);

        setClickCounts(Array(9).fill(0)); // Reset click counts
      }, 1000); // Adjust the delay as needed

      // Cleanup the timeout to avoid memory leaks
      return () => clearTimeout(timeout);
    }
  }, [clickCounts]);

  // Function to render circle grid
  const renderCircleGrid = () => {
    const circles = [];
    // Create 9 circles

    for (let i = 0; i < 9; i++) {
      const color = clickCounts[i] >= 10 ? "green" : "blue";
      circles.push(
        <button
          key={i}
          className="circle"
          style={{ backgroundColor: color }}
          onClick={() => handleCircleClick(i)}
        ></button>
      );
    }
    return circles;
  };

  return (
    <div className="App">
      <header className="App-header">
        <div className="App">
          {calibrationDone && (
            <video
              width="100%"
              height="100%"
              objectFit="cover"
              autoPlay
              controls
            >
              <source src={video} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          <br />
          {!showGrid && (
            <button onClick={() => handleSubmit()}>Start Calibration.</button>
          )}
          {showGrid && <div className="circle-grid">{renderCircleGrid()}</div>}
        </div>
      </header>
    </div>
  );
}

export default App;
