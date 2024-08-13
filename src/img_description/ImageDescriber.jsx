// ImageDescriber.jsx
import React, { useState, useRef, useCallback, useEffect, useContext} from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Modal from 'react-modal';
import { FaCamera, FaUpload, FaVideo, FaImage } from 'react-icons/fa';
import { useAuth0 } from '@auth0/auth0-react';
import LoadingSpinner from '../LoadingSpinner';
import Notification from '../Notification';
import VideoRecorder from './VideoRecorder';
import styles from './ImageDescriber.module.css';
import { AuthContext } from '../App';  // Adjust the import path as needed
import { useNavigate } from 'react-router-dom';
import extractFramesFromVideo from './extractFrames';

Modal.setAppElement('#root');





const ImageDescriber = () => {
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [location, setLocation] = useState(null);
  const [notification, setNotification] = useState(null);
  const [extractedFrames, setExtractedFrames] = useState([]);
  const [showFrames, setShowFrames] = useState(false);
  const [emergencyId, setEmergencyId] = useState('');
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!authState.token) {
      navigate('/login');
    }
  }, [authState.token, navigate]);


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1000);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


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
          console.error("Error getting geolocation: ", error);
          setError("Failed to get location. Please enable location services.");
        }
      );
    } else {
      setError("Geolocation is not supported by your browser.");
    }
  }, []);



  const createInitialEvent = useCallback(() => {
    if (!location) {
      setError("Location not available. Please try again.");
      return Promise.reject("Location not available");
    }
    return fetch(`http://localhost:3006/create-emergency-event/${authState.username}`, {
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
      return data.emergencyId;
    })
    .catch(error => {
      console.error('Error creating initial event:', error);
      setError('Failed to create initial event: ' + error.message);
      throw error;
    });
  }, [authState.username, authState.token, location]);


  useEffect(() => {
    if (location && authState.username) {
      createInitialEvent();
    }
  }, [createInitialEvent, location, authState.username]);

  const submitImages = useCallback(async (files) => {
    if (!emergencyId) {
      setError('No emergency ID set. Please try again.');
      return;
    }

    setLoading(true);
    setDescription('');
    setError('');

    try {
      const imageFormData = new FormData();
      files.forEach(file => {
        imageFormData.append('images', file);
      });

      const addImageResponse = await axios.post(
        `http://localhost:3006/add-emergency-image/${authState.username}/${emergencyId}`,
        imageFormData,
        {
          headers: { 
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${authState.token}`
          }
        }
      );

      setDescription(addImageResponse.data.description);
      setDescriptionModalOpen(true);
      setNotification({ message: 'Emergency data sent and analyzed successfully!', type: 'success' });
    } catch (err) {
      setError('Failed to process emergency data. Please try again.');
      console.error('Error submitting emergency data:', err);
      setNotification({ message: 'Failed to process emergency data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [authState.username, authState.token, emergencyId]);

  const handleCapture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then(res => res.blob())
      .then(async blob => {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        const newFiles = [...selectedFiles, file];
        setSelectedFiles(newFiles);
        setIsModalOpen(false);
        await submitImages(newFiles);
      });
  }, [webcamRef, selectedFiles, submitImages]);

  const handleFileChange = useCallback(async (event) => {
    const newFiles = [...selectedFiles, ...event.target.files];
    setSelectedFiles(newFiles);
    await submitImages(newFiles);
  }, [selectedFiles, submitImages]);

  const handleCameraClick = useCallback(() => {
    if (isMobile) {
      fileInputRef.current.click();
    } else {
      setIsModalOpen(true);
    }
  }, [isMobile]);

  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    []
  );

  const handleStartCapture = useCallback(() => {
    createInitialEvent()
      .then(() => {
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
              handleStopCapture();
              return 15;
            }
            return prevTime + 1;
          });
        }, 1000);
      })
      .catch(error => {
        setError('Failed to start recording: ' + error.message);
      });
  }, [createInitialEvent, handleDataAvailable]);


  const handleStopCapture = useCallback(() => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    setCapturing(false);
    clearInterval(timerRef.current);
  }, []);


  const processVideo = useCallback(async () => {
    if (recordedChunks.length && emergencyId) {
      setLoading(true);
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
        setDescriptionModalOpen(true);
        setNotification({ message: 'Video processed successfully', type: 'success' });
      } catch (error) {
        console.error('Error processing video:', error);
        setError('Failed to process video: ' + error.message);
        setNotification({ message: 'Failed to process video', type: 'error' });
      } finally {
        setLoading(false);
      }
    } else {
      setError('No video recorded or emergency ID not set');
    }
  }, [recordedChunks, authState.username, authState.token, emergencyId]);

  if (!authState.token) {
    return <div>Please log in to access this page.</div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>
        <FaImage className={styles.headingIcon} /> Record Emergency
      </h1>
      <div className={styles.form}>
        <input
          className={styles.input}
          type="file"
          accept="image/*"
          capture="environment"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
        />
        <div className={styles.buttonsContainer}>
          <button className={styles.button} onClick={handleCameraClick}>
            <FaCamera className={styles.buttonIcon} /> Take a Photo
          </button>
          {capturing ? (
            <button className={styles.button} onClick={handleStopCapture}>
              <FaVideo className={styles.buttonIcon} /> Stop Recording
            </button>
          ) : (
            <button className={styles.button} onClick={handleStartCapture}>
              <FaVideo className={styles.buttonIcon} /> Start Recording
            </button>
          )}
          <label className={styles.button}>
            <FaUpload className={styles.buttonIcon} /> Upload Images
            <input
              className={styles.input}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              multiple
            />
          </label>
          {recordedChunks.length > 0 && (
            <button className={styles.button} onClick={processVideo}>Process Video</button>
          )}
          {extractedFrames.length > 0 && (
            <button className={styles.button} onClick={() => setShowFrames(!showFrames)}>
              {showFrames ? 'Hide Frames' : 'View Frames'}
            </button>
          )}
        </div>
      </div>
      <div className={styles.recordingTime}>{recordingTime}s</div>
      {error && (
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          className={styles.webcam}
        />
        <button type="button" className={styles.button} onClick={handleCapture}>
          Capture Photo
        </button>
      </Modal>
      {loading && <LoadingSpinner />}
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      <Modal
        isOpen={descriptionModalOpen}
        onRequestClose={() => setDescriptionModalOpen(false)}
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        <div className={styles.modalContent}>
          <h2>Description</h2>
          <p>{description}</p>
          {selectedFiles.map((file, index) => (
            <img key={index} src={URL.createObjectURL(file)} alt={`uploaded-${index}`} className={styles.uploadedImage} />
          ))}
          <button className={styles.button} onClick={() => setDescriptionModalOpen(false)}>Close</button>
        </div>
      </Modal>
      {showFrames && (
        <div className={styles.framesContainer}>
          {extractedFrames.map((frame, index) => (
            <img key={index} src={frame} alt={`frame-${index}`} className={styles.frameImage} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageDescriber;
