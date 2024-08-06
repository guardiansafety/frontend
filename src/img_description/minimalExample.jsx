import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';

const ImageDescriberMinimal = () => {
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [extractedFrames, setExtractedFrames] = useState([]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    []
  );

  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    mediaRecorderRef.current = new MediaRecorder(webcamRef.current.stream, {
      mimeType: "video/webm"
    });
    mediaRecorderRef.current.addEventListener(
      "dataavailable",
      handleDataAvailable
    );
    mediaRecorderRef.current.start();

    setRecordingTime(0);
    timerRef.current = setInterval(() => {
      setRecordingTime((prevTime) => {
        if (prevTime >= 15) {
          clearInterval(timerRef.current);
          handleStopCaptureClick();
          return 15;
        }
        return prevTime + 1;
      });
    }, 1000);
  }, [handleDataAvailable]);

  const handleStopCaptureClick = useCallback(() => {
    mediaRecorderRef.current.stop();
    setCapturing(false);
    clearInterval(timerRef.current);
  }, []);

  const handleDownload = useCallback(() => {
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, {
        type: "video/webm"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      document.body.appendChild(a);
      a.style = "display: none";
      a.href = url;
      a.download = "react-webcam-stream-capture.webm";
      a.click();
      window.URL.revokeObjectURL(url);
    }
  }, [recordedChunks]);

  const extractFrames = useCallback(() => {
    console.log("Extract Frames function called");
    if (recordedChunks.length) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const videoUrl = URL.createObjectURL(blob);
      
      const video = document.createElement('video');
      video.src = videoUrl;
      
      video.onloadedmetadata = () => {
        console.log("Video metadata loaded. Width:", video.videoWidth, "Height:", video.videoHeight);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const frames = [];
        const frameCount = 5;
        let capturedFrames = 0;
  
        const captureFrame = () => {
          if (capturedFrames < frameCount) {
            console.log(`Capturing frame ${capturedFrames + 1} of ${frameCount}`);
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob((frameBlob) => {
              const frameUrl = URL.createObjectURL(frameBlob);
              frames.push(frameUrl);
              capturedFrames++;
              if (capturedFrames < frameCount) {
                requestAnimationFrame(captureFrame);
              } else {
                console.log("All frames captured:", frames);
                setExtractedFrames(frames);
                URL.revokeObjectURL(videoUrl);
                video.pause();
              }
            }, 'image/jpeg');
          }
        };
  
        video.onplay = () => {
          requestAnimationFrame(captureFrame);
        };
  
        video.onerror = (e) => {
          console.error("Error loading video:", e);
        };
  
        // Start playing the video
        video.play();
      };
  
      // Trigger metadata load
      video.load();
  
    } else {
      console.log("No recorded chunks available");
    }
  }, [recordedChunks]);
  
  return (
    <div>
      <Webcam audio={false} ref={webcamRef} />
      {capturing ? (
        <button onClick={handleStopCaptureClick}>Stop Capture</button>
      ) : (
        <button onClick={handleStartCaptureClick}>Start Capture</button>
      )}
      {recordedChunks.length > 0 && (
        <>
          <button onClick={handleDownload}>Download Video</button>
          <button onClick={extractFrames}>Extract Frames</button>
        </>
      )}
      <div>Recording Time: {recordingTime}s</div>
      <div>Extracted Frames: {extractedFrames.length}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {extractedFrames.map((frame, index) => (
          <img key={index} src={frame} alt={`Frame ${index + 1}`} style={{ width: '200px', margin: '5px' }} />
        ))}
      </div>
    </div>
  );
};

export default ImageDescriberMinimal;