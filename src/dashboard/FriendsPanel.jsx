// FriendsPanel.jsx
import { useEffect, useState } from 'react';
import { X, Users } from 'lucide-react';
import { fetchAndTransformMarkerData, getMarkerCountByUsername } from './markerUtils';
import styles from './FriendsPanel.module.css';

const initialFriends = [
  { name: 'Snoopy', image: '/snoopy.jpg', coordinates: [-79.39665, 43.6598], markerCount: 0 },
  { name: 'Pikachu', image: '/pikachu.jpg', coordinates: [-79.39825, 43.65835], markerCount: 0 },
  { name: 'BMO', image: '/bmo.jpg', coordinates: [-79.4044, 43.6667], markerCount: 0 },
  { name: 'Minion', image: '/minion.jpg', coordinates: [-122.4786, 37.8199], markerCount: 0 },
  { name: 'Stitch', image: '/stitch.jpg', coordinates: [116.3897, 39.9048], markerCount: 0 },
];

const FriendsPanel = ({ isOpen, onClose, onFriendClick }) => {
  const [friends, setFriends] = useState(initialFriends);

  useEffect(() => {
    const fetchData = async () => {
      const markerData = await fetchAndTransformMarkerData();
      const markerCounts = getMarkerCountByUsername(markerData);

      const updatedFriends = initialFriends.map(friend => {
        const matchingMarker = markerData.find(marker => marker.friendImage === friend.image);
        return {
          ...friend,
          name: matchingMarker ? matchingMarker.friendName : friend.name,
          markerCount: markerCounts[matchingMarker ? matchingMarker.friendName : friend.name] || 0
        };
      });

      setFriends(updatedFriends);
    };

    fetchData();
  }, []);

  if (!isOpen) {
    return (
      <button onClick={onClose} className={styles.toggleButton}>
        <Users size={24} />
      </button>
    );
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h2 className={styles.title}>Friends</h2>
        <button onClick={onClose} className={styles.closeButton}>
          <X size={24} />
        </button>
      </div>
      <div className={styles.grid}>
        {friends.map((friend) => (
          <button
            key={friend.name}
            onClick={() => onFriendClick(friend)}
            className={styles.friendButton}
          >
            <img
              src={friend.image}
              alt={friend.name}
              className={styles.friendImage}
            />
            <span className={styles.friendName}>{friend.name}</span>
            {friend.markerCount > 0 && (
              <span className={styles.notificationCircle}>{friend.markerCount}</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FriendsPanel;