import { useState, useRef, useCallback, useEffect } from 'react';
import axios from 'axios';
import Webcam from 'react-webcam';
import Modal from 'react-modal';
import { FaCamera, FaUpload, FaExclamationTriangle } from 'react-icons/fa';
import LoadingSpinner from '../LoadingSpinner';
import styles from './ImageDescriber.module.css';

Modal.setAppElement('#root');

const ImageDescriber = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [descriptions, setDescriptions] = useState([]);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1000);
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1000);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleFileChange = (event) => {
    setSelectedFiles([...selectedFiles, ...event.target.files]);
  };

  const handleCameraClick = () => {
    if (isMobile) {
      fileInputRef.current.click();
    } else {
      setIsModalOpen(true);
    }
  };

  const handleCapture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    fetch(imageSrc)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        setSelectedFiles([...selectedFiles, file]);
        setIsModalOpen(false);
      });
  }, [webcamRef, selectedFiles]);

  const submitImages = async (files) => {
    setLoading(true);
    setDescriptions([]);
    setError('');

    try {
      const allDescriptions = await Promise.all(files.map(async (file) => {
        const formData = new FormData();
        formData.append('images', file);

        const response = await axios.post('http://localhost:3005/describe', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data.description;
      }));
      setDescriptions(allDescriptions);
    } catch (err) {
      setError('Failed to get descriptions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFiles.length > 0) {
      submitImages(selectedFiles);
    }
  }, [selectedFiles]);

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}><FaExclamationTriangle className={styles.headingIcon} /> Record Emergency</h1>
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
      {descriptions.length > 0 && (
        <div className={styles.description}>
          <h2>Descriptions</h2>
          {descriptions.map((desc, index) => (
            <p key={index}>{desc}</p>
          ))}
        </div>
      )}
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
    </div>
  );
};

export default ImageDescriber;
