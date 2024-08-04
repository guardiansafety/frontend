import { X } from 'lucide-react';
import styles from './FriendDetails.module.css';

const FriendDetails = ({ friend, onClose, markerData }) => {
  if (!friend) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.detailsContainer}>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={24} />
        </button>
        <img
          src={friend.image}
          alt={friend.name}
          className={styles.largeImage}
        />
        <h2 className={styles.name}>{friend.name}</h2>
        
        <div className={styles.markerGrid}>
          {markerData.map((marker, index) => (
            <div key={index} className={styles.markerCard}>
              <h3>Marker {index + 1}</h3>
              <p><strong>Location:</strong> {marker.location.join(', ')}</p>
              <p><strong>Time:</strong> {marker.timestamp}</p>
              <h4>Emotions:</h4>
              <p>Aggression: {marker.emotions.aggression.toFixed(2)}</p>
              <p>Hostility: {marker.emotions.hostility.toFixed(2)}</p>
              <p>Frustration: {marker.emotions.frustration.toFixed(2)}</p>
              <p><strong>Description:</strong> {marker.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FriendDetails;