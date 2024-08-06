import React, { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Modal from 'react-modal';
import { FaCamera, FaUpload, FaVideo } from 'react-icons/fa';
import { useAuth0 } from '@auth0/auth0-react';
import LoadingSpinner from '../LoadingSpinner';
import Notification from '../Notification';
import { extractFramesFromVideo } from './extractFrames';
import styles from './ImageDescriber.module.css';

Modal.setAppElement('#root');

const ImageDescriber = () => {
  const { user, isAuthenticated, loginWithRedirect } = useAuth0();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [descriptionModalOpen, setDescriptionModalOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const [location, setLocation] = useState(null);
  const [notification, setNotification] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [capturing, setCapturing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);

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
        }
      );
    } else {
      console.error("Geolocation not available");
    }
  }, []);

 

  const submitImages = useCallback(async (files) => {
    if (!isAuthenticated) {
      loginWithRedirect();
      return;
    }

    setLoading(true);
    setDescription('');
    setError('');

    try {
      const eventResponse = await axios.post(
        `http://localhost:3006/create-emergency-event/${user.nickname}`,
        {
          location,
          description: 'Emergency event',
          auth0Id: user.sub
        }
      );

      const { emergencyId } = eventResponse.data;

      const imageFormData = new FormData();
      files.forEach(file => {
        imageFormData.append('images', file);
      });

      const addImageResponse = await axios.post(
        `http://localhost:3006/add-emergency-image/${user.nickname}/${emergencyId}`,
        imageFormData,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      setDescription(addImageResponse.data.description);
      setDescriptionModalOpen(true);
      setNotification({ message: 'Emergency data sent successfully!', type: 'success' });
    } catch (err) {
      setError('Failed to get descriptions. Please try again.');
      console.error('Error submitting emergency data:', err);
      setNotification({ message: 'Failed to send emergency data.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, loginWithRedirect, user, location]);
  



  const handleDataAvailable = useCallback(
    ({ data }) => {
      if (data.size > 0) {
        setRecordedChunks((prev) => prev.concat(data));
      }
    },
    []
  );



  const handleStopCaptureClick = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setCapturing(false);
      setRecordingTime(0);
    }

    if (recordedChunks.length === 0) {
      console.error("No video data recorded.");
      return;
    }

    const videoBlob = new Blob(recordedChunks, { type: 'video/webm' });
    const videoFile = new File([videoBlob], 'video.webm', { type: 'video/webm' });

    setLoading(true);
    try {
      const frames = await extractFramesFromVideo(videoFile, 5);
      const files = frames.map((blob, index) => new File([blob], `frame${index}.jpg`, { type: 'image/jpeg' }));
      await submitImages(files);
    } catch (error) {
      console.error("Error extracting frames:", error);
      setError('Failed to process video. Please try again.');
    }
    setIsVideoModalOpen(false);
    setLoading(false);

    // Download the video
    const url = URL.createObjectURL(videoBlob);
    const a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    a.href = url;
    a.download = "video.webm";
    a.click();
    window.URL.revokeObjectURL(url);
    setRecordedChunks([]);
  }, [recordedChunks, submitImages]);


  const handleStartCaptureClick = useCallback(() => {
    setCapturing(true);
    setRecordedChunks([]);
    const stream = webcamRef.current.stream;

    if (!stream) {
      console.error("Webcam stream not available");
      return;
    }

    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: "video/webm"
    });

    mediaRecorderRef.current.addEventListener("dataavailable", handleDataAvailable);
    mediaRecorderRef.current.start();

    setRecordingTime(0);
    const interval = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 15) {
          clearInterval(interval);
          handleStopCaptureClick();
          return 15;
        }
        return prev + 1;
      });
    }, 1000);
  }, [handleDataAvailable, handleStopCaptureClick]);





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



  const handleVideoClick = useCallback(() => {
    setIsVideoModalOpen(true);
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>
        Record Emergency
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
          <button className={styles.button} onClick={handleVideoClick}>
            <FaVideo className={styles.buttonIcon} /> Record Video
          </button>
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
        </div>
      </div>
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
      <Modal
        isOpen={isVideoModalOpen}
        onRequestClose={() => {
          setIsVideoModalOpen(false);
          setCapturing(false);
          if (webcamRef.current && webcamRef.current.stream) {
            const tracks = webcamRef.current.stream.getTracks();
            tracks.forEach(track => track.stop());
          }
        }}
        className={styles.modal}
        overlayClassName={styles.overlay}
      >
        <Webcam audio={false} ref={webcamRef} className={styles.webcam} />
        <div className={styles.recordingTime}>{recordingTime}s</div>
        {capturing ? (
          <button type="button" className={styles.button} onClick={handleStopCaptureClick}>
            Stop Recording
          </button>
        ) : (
          <button type="button" className={styles.button} onClick={handleStartCaptureClick}>
            Start Filming
          </button>
        )}
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
    </div>
  );
};

export default ImageDescriber;
