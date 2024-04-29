import React from "react"
import Chart from "./chart";
// import test from "../cow.mp4";

async function postData(url = "", data = {}) {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}

async function getData(url = "") {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "GET", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    //   body: JSON.stringify(data), // body data type must match "Content-Type" header
    });
    return response.json(); // parses JSON response into native JavaScript objects
}


const Video = () => {
    const [video, setVideo] = React.useState(null);
    const [showModal, setShowModal] = React.useState(true);

    const videoEl = React.useRef(null);

    const [isLoading, setIsLoading] = React.useState(false);
    const [playbackMode, setPlaybackMode] = React.useState(false);

    const [breathData, setBreathData] = React.useState([]);
    const [chartData, setChartData] = React.useState([{}]);

    React.useEffect(() => {
        if (breathData.length > 0) {
            setChartData(breathData.map((d, i) => ({x: i, y: d}))); // map data to chart data form
            setPlaybackMode(true);
        }
    }, [breathData])

    const handlePlay = () => {
        const video = videoEl.current;
        if (!video) return;
        console.log(`The video is ${video.duration} seconds long.`);
        // call play api with duration
        postData("http://127.0.0.1:5000/play", {duration: video.duration}).then((data) => {
            console.log("play route returned: ", data);
            if (data['status'] == 200) {
                setIsLoading(true);
                setTimeout(() => {
                    console.log("after time out");
                    getData('http://127.0.0.1:5000/analyze').then((data) => {
                        console.log('analyze returned: ', data);
                        setBreathData(data);
                        setIsLoading(false);
                    })
                }, video.duration * 1000);
            } else {
                alert('/play route failed');
            }
        });

        // set time off for 3 secs
    };

    // React.useEffect(() => {
    //     const duration = video.duration;
    //     console.log("duration: ", duration);
    //     // call play api with duration

    //     // set time off for 3 secs
    //     setTimeout(() => {
    //         console.log("after time out");
    //     }, 3000);
    // },[])

    const handleUpload = (event) => {
        const file = event.target.files[0];
        setVideo(URL.createObjectURL(file));
        setShowModal(false);
      };

    const handleReset = () => {
        setPlaybackMode(false);
        setVideo(null);
        setShowModal(true);
    }

    return (
        <div>
            {!video && showModal && ( // Render modal only when there's no video and modal is visible
                <div className="modal">
                <input type="file" accept="video/mp4" onChange={handleUpload} />
                </div>
            )}
            {video && <video
              ref={videoEl} 
              src={video}
              onPlay={handlePlay}
              width={playbackMode ? "50%" : "100%"}
              height='100%'
              objectFit="cover"
              autoPlay
              controls
            >
              {/* <source src={video} type="video/mp4" /> */}
              Your browser does not support the video tag.
            </video>}
            {playbackMode && video && <video
              ref={videoEl} 
              src={video}
              width="50%"
              height='100%'
              objectFit="cover"
              autoPlay
              controls
            >
              {/* <source src={video} type="video/mp4" /> */}
              Your browser does not support the video tag.
            </video>}
            {!!isLoading && <h3>loading...</h3>}
            {video && !!playbackMode && <Chart data={chartData}/>}
            {playbackMode && <button onClick={handleReset}>Reset</button>}
        </div>
    )
}

export default Video