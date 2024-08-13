import React, { useEffect, useState, useRef, useCallback, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Webcam from 'react-webcam';
import { AuthContext } from '../App';  // Adjust the import path as needed


const extractFramesFromVideo = (videoBlob, frameCount = 15, maxDuration = 15) => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(videoBlob);

    video.onloadedmetadata = () => {
      console.log('Video metadata loaded.');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const frames = [];

      const captureFrame = () => {
        if (frames.length < frameCount && video.currentTime < maxDuration) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          // Check if the frame is not entirely black
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const isBlack = imageData.data.every((value, index) => index % 4 === 3 || value === 0);
          
          if (!isBlack) {
            canvas.toBlob(blob => {
              frames.push(blob);
              if (frames.length < frameCount) {
                // Move to the next frame
                video.currentTime += 1; // Move 2s forward
              } else {
                resolve(frames);
              }
            }, 'image/jpeg', 0.95);
          } else {
            console.log('Skipping black frame');
            video.currentTime += 0.1; // Move 100ms forward
          }
        } else {
          resolve(frames);
        }
      };

      video.onseeked = () => {
        if (video.currentTime < Math.min(video.duration, maxDuration)) {
          captureFrame();
        } else {
          resolve(frames);
        }
      };
      
      // Start capturing frames
      video.currentTime = 0;
    };

    video.onerror = (e) => {
      console.error('Error loading video:', e);
      reject(new Error('Failed to load video'));
    };

    // Trigger metadata load
    video.load();
  });
};


const ImageDescriberMinimal = () => {
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();
  const webcamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);
  const [extractedFrames, setExtractedFrames] = useState([]);
  const [description, setDescription] = useState('');
  const [emergencyId, setEmergencyId] = useState('');
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (!authState.token) {
      navigate('/login');
    }
  }, [authState.token, navigate]);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting geolocation:", error);
          setError("Failed to get location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, []);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    []
  );

  const createInitialEvent = useCallback(() => {
    if (!location) {
      setError("Location not available. Please try again.");
      return;
    }
    fetch(`http://localhost:3006/create-emergency-event/${authState.username}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authState.token}`
      },
      body: JSON.stringify({
        location: location,
        description: ''
      })
    })
    .then(res => {
      if (!res.ok) {
        return res.text().then(text => { throw new Error(text) });
      }
      return res.json();
    })
    .then(data => {
      setEmergencyId(data.emergencyId);
      console.log('Emergency event created:', data);
    })
    .catch(error => {
      console.error('Error creating initial event:', error);
      setError('Failed to create initial event: ' + error.message);
    });
  }, [authState.username, authState.token, location]);
  
  useEffect(() => {
    if (location && authState.username) {
      createInitialEvent();
    }
  }, [createInitialEvent, location, authState.username]);

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
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setCapturing(false);
    clearInterval(timerRef.current);
  }, []);

  const processVideo = useCallback(async () => {
    if (recordedChunks.length && emergencyId) {
      const videoBlob = new Blob(recordedChunks, { type: "video/webm" });
      try {
        const frames = await extractFramesFromVideo(videoBlob);
        setExtractedFrames(frames.map(blob => URL.createObjectURL(blob)));

        const formData = new FormData();
        frames.forEach((frame, index) => {
          formData.append('images', frame, `frame${index}.jpg`);
        });

        const response = await fetch(`http://localhost:3006/add-emergency-image/${authState.username}/${emergencyId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authState.token}`
          },
          body: formData
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }

        const data = await response.json();
        setDescription(data.description);
      } catch (error) {
        console.error('Error processing video:', error);
        setError('Failed to process video: ' + error.message);
      }
    } else {
      setError('No video recorded or emergency ID not set');
    }
  }, [recordedChunks, authState.username, authState.token, emergencyId]);

  if (!authState.token) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div>
      <Webcam audio={false} ref={webcamRef} />
      {capturing ? (
        <button onClick={handleStopCaptureClick}>Stop Capture</button>
      ) : (
        <button onClick={handleStartCaptureClick}>Start Capture</button>
      )}
      {recordedChunks.length > 0 && (
        <button onClick={processVideo}>Process Video</button>
      )}
      <div>Recording Time: {recordingTime}s</div>
      <div>Extracted Frames: {extractedFrames.length}</div>
      <div>Username: {authState.username}</div>
      <div>Emergency ID: {emergencyId}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap' }}>
        {extractedFrames.map((frame, index) => (
          <img key={index} src={frame} alt={`Frame ${index + 1}`} style={{ width: '200px', margin: '5px' }} />
        ))}
      </div>
      <div>
        Description:
        <p>{description}</p>
      </div>
      <div>Location: {location ? `Lat: ${location.latitude}, Lon: ${location.longitude}` : 'Getting location...'}</div>

      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
    </div>
  );
};

export default ImageDescriberMinimal;
