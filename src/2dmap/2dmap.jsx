import React, { useEffect, useState, useContext } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import axios from 'axios';
import L from 'leaflet';
import moment from 'moment-timezone';
import { useNavigate } from 'react-router-dom';
import styles from './2dmap.module.css';
import { ThemeContext } from '../ColorTheme';
import { AuthContext } from '../App';

const getColorByUsername = (username) => {
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', 
    '#F67280', '#C06C84', '#6C5B7B', '#355C7D', '#F8B195'
  ];
  const hash = username.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const createPinIcon = (color) => {
  return L.divIcon({
    className: styles.pinIcon,
    html: `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30">
        <path d="M12 0C7.58 0 4 3.58 4 8c0 5.5 8 16 8 16s8-10.5 8-16c0-4.42-3.58-8-8-8zm0 12c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="${color}"/>
        <circle cx="12" cy="8" r="3" fill="white"/>
      </svg>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -30],
  });
};

const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

const EmergencyMap = () => {
  const { authState } = useContext(AuthContext);
  const navigate = useNavigate();
  const [emergencies, setEmergencies] = useState([]);
  const [recentEmergencies, setRecentEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([43.6532, -79.3832]);
  const [mapZoom, setMapZoom] = useState(12);
  const [selectedEmergency, setSelectedEmergency] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    if (authState.token) {
      fetchEmergencies();
      fetchMostRecentEmergencies();
    } else {
      navigate('/login');
    }
  }, [authState.token, navigate]);

  const fetchEmergencies = async () => {
    try {
      const response = await axios.get('http://localhost:3006/get-all-emergencies', {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      setEmergencies(response.data);
    } catch (error) {
      console.error('Error fetching emergencies:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMostRecentEmergencies = async () => {
    try {
      const response = await axios.get('http://localhost:3006/most-recent-emergencies', {
        headers: { Authorization: `Bearer ${authState.token}` }
      });
      setRecentEmergencies(response.data);
    } catch (error) {
      console.error('Error fetching most recent emergencies:', error);
    }
  };

  const handleZoomToEmergency = (emergency) => {
    setMapCenter([emergency.location.latitude, emergency.location.longitude]);
    setMapZoom(15);
    setSelectedEmergency(emergency);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.mapWrapper}>
      <button 
        onClick={toggleSidebar} 
        className={`${styles.toggleButton} ${isCollapsed ? styles.collapsed : ''}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
        Recent Emergencies
      </button>
      <div className={`${styles.recentEmergencies} ${isCollapsed ? styles.collapsed : ''}`}>
        <h2>Recent Emergencies</h2>
        <ul>
          {recentEmergencies.map((emergency, index) => (
            <li key={index} onClick={() => handleZoomToEmergency(emergency)}>
              {emergency.username} - {moment(emergency.timestamp).tz("America/Toronto").format('MM/DD HH:mm')}
            </li>
          ))}
        </ul>
      </div>
      <MapContainer center={mapCenter} zoom={mapZoom} className={styles.mapContainer}>
        <MapController center={mapCenter} zoom={mapZoom} />
        <TileLayer
          url={theme === 'dark' ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"}
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        {emergencies.map((event, index) => {
          if (!event.location || event.location.latitude === undefined || event.location.longitude === undefined) {
            return null;
          }

          const position = [event.location.latitude, event.location.longitude];
          const color = getColorByUsername(event.username);
          const icon = createPinIcon(color);

          return (
            <Marker key={index} position={position} icon={icon}>
              <Popup>
                <div className={styles.popupContent}>
                  <p><strong>User:</strong> {event.username}</p>
                  <p><strong>Location:</strong> {event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)}</p>
                  <p><strong>Description:</strong> {event.description}</p>
                  <p><strong>Timestamp:</strong> {moment(event.timestamp).tz("America/Toronto").format('YYYY-MM-DD HH:mm:ss')}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {selectedEmergency && (
          <Popup
            position={[selectedEmergency.location.latitude, selectedEmergency.location.longitude]}
            onClose={() => setSelectedEmergency(null)}
          >
            <div className={styles.popupContent}>
              <p><strong>User:</strong> {selectedEmergency.username}</p>
              <p><strong>Location:</strong> {selectedEmergency.location.latitude.toFixed(4)}, {selectedEmergency.location.longitude.toFixed(4)}</p>
              <p><strong>Description:</strong> {selectedEmergency.description}</p>
              <p><strong>Timestamp:</strong> {moment(selectedEmergency.timestamp).tz("America/Toronto").format('YYYY-MM-DD HH:mm:ss')}</p>
            </div>
          </Popup>
        )}
      </MapContainer>
    </div>
  );
};

export default EmergencyMap;