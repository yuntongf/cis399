const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const csvParser = require("csv-parser");

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/save-coordinates/:x/:y/:time", (req, res) => {
  const x = req.params.x;
  const y = req.params.y;
  const time = req.params.time;

  // Append coordinates to a file
  fs.appendFile("coordinates.csv", `${x},${y},${time}\n`, (err) => {
    if (err) {
      console.error("Error saving coordinates:", err);
      res.status(500).send("Failed to save coordinates");
      return;
    }
    console.log("Coordinates saved successfully");
    res.status(200).send("Coordinates saved successfully");
  });
});

app.get("/coordinates", (req, res) => {
  const coordinates = [];
  let startReading = false;

  fs.createReadStream("coordinates.csv")
    .pipe(csvParser())
    .on("data", (row) => {
      // If the row is "0,0,0", start adding coordinates
      console.log(row);
      if (row.x === "0" && row.y === "0" && row.time === "0") {
        startReading = true;
        return;
      }
      if (startReading) {
        coordinates.push(row);
      }
    })
    .on("end", () => {
      res.json(coordinates);
    })
    .on("error", (err) => {
      console.error("Error reading CSV:", err);
      res.status(500).send("Internal Server Error");
    });
});

// process.on("SIGINT", () => {
//   fs.unlink("coordinates.csv", (err) => {
//     if (err) {
//       console.error("Error deleting coordinates file:", err);
//       process.exit(1); // Exit process with error code
//     }
//     console.log("Coordinates file deleted");
//     process.exit(0); // Exit process with success code
//   });
// });

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
