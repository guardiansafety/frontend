// VideoRecorder.jsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import Notification from '../Notification'; // Adjust the import path as needed
import styles from './ImageDescriber.module.css';

const VideoRecorder = ({ onVideoProcessed, onMaxRecordingTime }) => {
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [notification, setNotification] = useState(null);
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const maxRecordingTime = 15; // 15 seconds

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
    setNotification({ message: 'Recording started', type: 'info' });
  }, [webcamRef, handleDataAvailable]);

  const handleStopCaptureClick = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setCapturing(false);
    setNotification({ message: 'Recording stopped', type: 'info' });
  }, [mediaRecorderRef]);

  const processVideo = useCallback(async () => {
    if (recordedChunks.length === 0) return;

    const blob = new Blob(recordedChunks, {
      type: "video/webm"
    });
    const videoFile = new File([blob], "video.webm", { type: "video/webm" });

    // Extract frames (implementation depends on your backend)
    const formData = new FormData();
    formData.append('video', videoFile);

    try {
      setNotification({ message: 'Processing video...', type: 'info' });
      const response = await fetch('http://localhost:3006/extract-frames', {
        method: 'POST',
        body: formData
      });
      const frames = await response.json();
      onVideoProcessed(frames);
      setNotification({ message: 'Video processed successfully', type: 'success' });
    } catch (error) {
      console.error('Error extracting frames:', error);
      setNotification({ message: 'Error processing video', type: 'error' });
    }
  }, [recordedChunks, onVideoProcessed]);

  useEffect(() => {
    let interval;
    if (capturing) {
      interval = setInterval(() => {
        setRecordingTime((prevTime) => {
          if (prevTime >= maxRecordingTime) {
            handleStopCaptureClick();
            onMaxRecordingTime();
            clearInterval(interval);
            setNotification({ message: 'Maximum recording time reached', type: 'warning' });
            return maxRecordingTime;
          }
          return prevTime + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [capturing, handleStopCaptureClick, onMaxRecordingTime]);

  useEffect(() => {
    if (!capturing && recordedChunks.length > 0) {
      processVideo();
    }
  }, [capturing, recordedChunks, processVideo]);

  return (
    <div>
      <Webcam audio={false} ref={webcamRef} className={styles.webcam} />
      <div className={styles.recordingTime}>{recordingTime}s</div>
      {capturing ? (
        <button className={styles.button} onClick={handleStopCaptureClick}>Stop Recording</button>
      ) : (
        <button className={styles.button} onClick={handleStartCaptureClick}>Start Recording</button>
      )}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default VideoRecorder;