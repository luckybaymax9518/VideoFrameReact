import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import "./App.css";

import videoPlayer from "./customVideoPlayer";

const BASE_URL = "https://mockapi.lumi.systems";
let frameCnt = 0;
const App = () => {
  const [aryDevices, setAryDevices] = useState([]);
  const [videoUrl, setVideoUrl] = useState(null);
  const [frameUrl, setFrameUrl] = useState("");
  const [frameData, setFrameData] = useState(null);

  const videoElement = useRef(null);

  const {
    playing,
    progress,
    speed,
    muted,
    togglePlay,
    handleOnTimeUpdate,
    handleVideoProgress,
    handleVideoSpeed,
    toggleMute,
  } = videoPlayer(videoElement);

  const getFrameInfo = (progress) => {
    if (frameData) {
      const frameIndex = Math.round((frameCnt * progress) / 100);
      const frame = frameData.frame_data[frameIndex];
      return {
        index: frameIndex,
        rgb: `rgb(${frame.avgR}, ${frame.avgG}, ${frame.avgB})`,
        histogram: frame.histDiff,
      };
    }

    return {
      index: 0,
      rgb: `rgb(0,0,0)`,
      histogram: 0,
    };
  };
  const drawColorTrackBar = (frame_data) => {
    var c = document.getElementById("myCanvas");
    var ctx = c.getContext("2d");
    var grd = ctx.createLinearGradient(0, 0, c.width, 0);
    frameCnt = Object.keys(frame_data).length;
    Object.keys(frame_data).forEach((key) => {
      const item = frame_data[key];
      grd.addColorStop(
        key / frameCnt,
        `rgb(${item.avgR},${item.avgG},${item.avgB})`
      );
    });
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, c.width, c.height);
  };

  useEffect(() => {
    const fetchDevices = async () => {
      const response = await axios.get(`${BASE_URL}/getdevices`, {
        params: { userId: 100, orgId: "Lumi" },
      });
      if (response.status === 200) {
        setAryDevices(response.data.output);
        // Get First Video's Info to display
        await fetchVideoData(response.data.output[0]);
      }
    };
    // get devices array to display devices list
    if (aryDevices.length === 0) {
      fetchDevices();
    }
  }, []);

  // Get video's frame and video url
  const fetchVideoData = async (deviceId) => {
    try {
      const response = await axios.get(`${BASE_URL}/getdevicedata`, {
        params: { deviceId: deviceId },
      });

      if (response.status !== 200) {
        console.log(response.status);
        return;
      }

      if (response.data.output === null) {
        alert(response.data.err);
        return;
      }

      setVideoUrl(response.data.output.videofiles);
      setFrameUrl(response.data.output.cvmdata);
    } catch (error) {
      console.error(error);
    }
  };

  // Get Video's framedata
  useEffect(() => {
    //
    const fetchFrameData = async (url) => {
      try {
        const response = await fetch(url, {
          method: "GET",
          mode: "cors",
          headers: {
            "access-control-allow-origin": "*",
            "Content-type": "application/json; charset=UTF-8",
          },
        });
        const result = await response.json();
        setFrameData(result);
        drawColorTrackBar(result.frame_data);
      } catch (error) {}
    };

    if (frameUrl !== "") {
      fetchFrameData(frameUrl);
    }
  }, [frameUrl]);
  return (
    <div className="container">
      <div className="select">
        <select onChange={(e) => fetchVideoData(e.target.value)}>
          {aryDevices.map((device, key) => (
            <option key={key} value={device}>
              {device}
            </option>
          ))}
        </select>
      </div>

      <div className="video-wrapper">
        <video
          src={videoUrl}
          ref={videoElement}
          onTimeUpdate={handleOnTimeUpdate}
        />
        <div className="controls">
          <div className="actions">
            <button onClick={togglePlay}>
              {!playing ? (
                <i className="bx bx-play"></i>
              ) : (
                <i className="bx bx-pause"></i>
              )}
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={(e) => handleVideoProgress(e)}
            />
            <canvas id="myCanvas" height="50"></canvas>

            <div
              className="colorTracker"
              style={{
                left: `${progress}%`,
              }}
            ></div>
          </div>
          <select
            className="velocity"
            value={speed}
            onChange={(e) => handleVideoSpeed(e)}
          >
            <option value="0.50">0.50x</option>
            <option value="1">1x</option>
            <option value="1.25">1.25x</option>
            <option value="2">2x</option>
          </select>
          <button className="mute-btn" onClick={toggleMute}>
            {!muted ? (
              <i className="bx bxs-volume-full"></i>
            ) : (
              <i className="bx bxs-volume-mute"></i>
            )}
          </button>
        </div>
      </div>
      <div className="color-tracker-title">Average RGB</div>
      <div className="frame-data-container">
        <h1>Frame Infomation</h1>
        <div className="frame-data-content">
          <div className="frame-info">
            <p>Frame Number: {getFrameInfo(progress).index}</p>
            <p>Bounding Box: {frameData && frameData.RoI.join(",")}</p>
            <p>Histogram: {getFrameInfo(progress).histogram}</p>
          </div>
          <div className="color-platte-container">
            <h2>RGB</h2>
            <div
              className="color-platte"
              style={{ background: getFrameInfo(progress).rgb }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
