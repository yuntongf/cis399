import logo from "./logo.svg";
import "./App.css";
import video from "./cow.mp4";
import webgazer from "webgazer";
import { useEffect, useState } from "react";
import { useRef } from "react";
import userEvent from "@testing-library/user-event";

function App() {
  const [showGrid, setShowGrid] = useState(false);
  const [calibrationDone, setCalibration] = useState(false);
  const [clickCounts, setClickCounts] = useState(Array(9).fill(0));
  const [videoEnded, setVideoEnded] = useState(false);
  const videoRef = useRef(null);
  let coords = [];
  let times = [];

  const handleSubmit = () => {
    setShowGrid(true);

    webgazer
      .setGazeListener((data, elapsedTime) => {
        if (data == null) {
          return;
        }

        // console.log(data);
        const x = data.x; // these x coordinates are relative to the viewport
        const y = data.y; // these y coordinates are relative to the viewport

        fetch(
          `http://localhost:3001/save-coordinates/${x}/${y}/${elapsedTime}`,
          {
            mode: "no-cors",
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
      })
      .begin();

    // webgazer.pause();
  };

  const handleCircleClick = (index) => {
    // Implement logic for tracking circle clicks
    const newClickCounts = [...clickCounts];
    newClickCounts[index]++;
    setClickCounts(newClickCounts);
  };

  useEffect(() => {
    // Check if any circle has been clicked three times
    if (clickCounts.every((count) => count >= 3)) {
      // Hide the grid and return to original page after a short delay
      const timeout = setTimeout(() => {
        setShowGrid(false);
        setCalibration(true);
        fetch("http://localhost:3001/save-coordinates/0/0/0", {
          mode: "no-cors",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        });

        setClickCounts(Array(9).fill(0)); // Reset click counts
      }, 1000); // Adjust the delay as needed

      // Cleanup the timeout to avoid memory leaks
      return () => clearTimeout(timeout);
    }
  }, [clickCounts]);

  // useEffect(() => {
  //   // Function to parse the CSV file and extract coordinates with timestamps
  //   if (videoEnded) {
  //     webgazer.pause();

  //     const parseCSV = async () => {
  //       try {
  //         const response = await fetch(
  //           "http://localhost:8010/proxy/coordinates"
  //         ); // Adjust the file path as needed
  //         console.log(response);

  //         const data = await response.json();
  //         console.log(data);

  //         // get first timestamp from data
  //         let prevTimestamp = parseInt(data[0].time);
  //         let sum = 0;
  //         let toggle = true;
  //         let x = 300;

  //         data.forEach((element) => {
  //           const diffTimestamp = parseInt(element.time) - prevTimestamp;

  //           // Update previous timestamp for next iteration
  //           prevTimestamp = parseInt(element.time);

  //           sum += diffTimestamp;
  //           if (toggle) {
  //             x = 400;
  //             return;
  //           }
  //           toggle = !toggle;

  //           // Schedule rendering of dot with time difference
  //           setTimeout(() => {
  //             renderDot(x, 400);
  //           }, diffTimestamp); // Multiply by 1000 to convert seconds to milliseconds
  //         });

  //         console.log("Total time:", sum);
  //       } catch (error) {
  //         console.error("Error parsing CSV:", error);
  //       }
  //     };
  //     parseCSV();
  //   }
  // }, [videoEnded]);

  const renderDot = (x, y) => {
    // Render red dot at specified coordinates
    const dotElement = document.getElementById("dot");
    dotElement.style.left = `${x}px`;
    dotElement.style.top = `${y}px`;
  };
  // Function to render circle grid
  const renderCircleGrid = () => {
    const circles = [];
    // Create 9 circles

    for (let i = 0; i < 9; i++) {
      const color = clickCounts[i] >= 3 ? "green" : "blue";
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

  const handleVideoEnd = () => {
    // setVideoEnded(true);
    // if (videoRef.current) {
    //   videoRef.current.currentTime = 0;
    //   videoRef.current.play();
    // }
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
              ref={videoRef}
              onEnded={() => handleVideoEnd()}
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
          {videoEnded && <div id="dot" className="dot"></div>}
        </div>
      </header>
    </div>
  );
}

export default App;
