import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faInstagram, faLinkedin } from '@fortawesome/free-brands-svg-icons';
import Notification from '../Notification';
import styles from './Footer.module.css';

const Footer = () => {

  /*
  const [notification, setNotification] = useState(null);

  const showNotification = (message) => {
    setNotification(message);
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLinkClick = (e) => {
    e.preventDefault();
    showNotification('Currently unconfigured :)');
  };

  */

  return (
    <footer className={styles.footer}>

      { /*
      
       <div className={styles.footerContent}>
        <div className={styles.footerSection}>
          <h3>Guardian</h3>
          <p>Empowering individuals with innovative personal safety solutions.</p>
        </div>
        <div className={styles.footerSection}>
          <h4>Quick Links</h4>
          <ul>
            <li><a href="#home" onClick={handleLinkClick}>Home</a></li>
            <li><a href="#features" onClick={handleLinkClick}>Features</a></li>
            <li><a href="#how-it-works" onClick={handleLinkClick}>How It Works</a></li>
            <li><a href="#contact" onClick={handleLinkClick}>Contact</a></li>
          </ul>
        </div>
        <div className={styles.footerSection}>
          <h4>Contact Us</h4>
          <p>Email: info@guardian.com</p>
          <p>Phone: (555) 123-4567</p>
          <p>Address: 123 Safety Street, Secure City, SC 12345</p>
        </div>
        <div className={styles.footerSection}>
          <h4>Follow Us</h4>
          <div className={styles.socialIcons}>
            <a href="#" onClick={handleLinkClick}><FontAwesomeIcon icon={faFacebook} /></a>
            <a href="#" onClick={handleLinkClick}><FontAwesomeIcon icon={faTwitter} /></a>
            <a href="#" onClick={handleLinkClick}><FontAwesomeIcon icon={faInstagram} /></a>
            <a href="#" onClick={handleLinkClick}><FontAwesomeIcon icon={faLinkedin} /></a>
          </div>
        </div>
      </div>

      */ }
     
      <div className={styles.footerBottom}>
        <p>&copy; 2024 Guardian. All rights reserved.</p>
      </div>
      { /*
      {notification && (
        <Notification message={notification} type="info" onClose={() => setNotification(null)} />
      )}
      */ }

    </footer>
  );
};

export default Footer;
