import { useEffect, useRef, useContext, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Threebox } from 'threebox-plugin';
import { ThemeContext } from '../ColorTheme';
import FriendsPanel from './FriendsPanel';
import FriendDetails from './FriendDetails';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './Dashboard.module.css';
import { testFetch } from './testFetch.js'
import moment from 'moment-timezone';


// const markerData = [
//   // Snoopy markers
//   {
//     friendName: 'Snoopy',
//     friendImage: '/snoopy.jpg',
//     location: [-79.39675, 43.6600],
//     description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
//   },
//   {
//     friendName: 'Snoopy',
//     friendImage: '/snoopy.jpg',
//     location: [-79.39655, 43.6596],
//     description: 'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
//   },
//   // Pikachu markers
//   {
//     friendName: 'Pikachu',
//     friendImage: '/pikachu.jpg',
//     location: [-79.39835, 43.65845],
//     description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.'
//   },
//   {
//     friendName: 'Pikachu',
//     friendImage: '/pikachu.jpg',
//     location: [-79.39815, 43.65825],
//     description: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.'
//   },
//   // BMO markers
//   {
//     friendName: 'BMO',
//     friendImage: '/bmo.jpg',
//     location: [-79.4046, 43.6669],
//     description: 'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.'
//   },
//   {
//     friendName: 'BMO',
//     friendImage: '/bmo.jpg',
//     location: [-79.4042, 43.6665],
//     description: 'Deserunt mollit anim id est laborum.'
//   },
//   // Minion markers
//   {
//     friendName: 'Minion',
//     friendImage: '/minion.jpg',
//     location: [-122.4788, 37.8201],
//     description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.'
//   },
//   {
//     friendName: 'Minion',
//     friendImage: '/minion.jpg',
//     location: [-122.4784, 37.8197],
//     description: 'Incididunt ut labore et dolore magna aliqua.'
//   },
//   // Stitch markers
//   {
//     friendName: 'Stitch',
//     friendImage: '/stitch.jpg',
//     location: [116.3899, 39.9050],
//     description: 'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.'
//   },
//   {
//     friendName: 'Stitch',
//     friendImage: '/stitch.jpg',
//     location: [116.3895, 39.9046],
//     description: 'Ex ea commodo consequat. Duis aute irure dolor in reprehenderit.'
//   }
// ];

const Map = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const { mapStyle } = useContext(ThemeContext);
  const zoomLevel = 17.4;
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showFriendsPanel, setShowFriendsPanel] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [markerData, setMarkerData] = useState([]);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYnJpYW4temhhbmciLCJhIjoiY2x6YmdhbGxzMDBleTJqcHkycTF4ZTU1aiJ9.ESxJl1cwwl3PC_AoDvFWrg';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-79.39665, 43.6598],
      zoom: zoomLevel,
      pitch: 64.9,
      bearing: 172.5,
      antialias: true
    });

    const fetchDataAndSetMarkers = async () => {
      const data = await testFetch();
      const transformedData = data.map((item) => ({
        friendName: item.username,
        location: [item.location.longitude, item.location.latitude],
        description: item.description,
        timestamp: moment(item.timestamp).tz("America/Toronto").format('YYYY-MM-DD HH:mm:ss'),
      }));
    
      const images = ['/snoopy.jpg', '/pikachu.jpg', '/bmo.jpg', '/minion.jpg', '/stitch.jpg'];
      const usernameToImageMap = {};
      let imageIndex = 0;
    
      const finalData = transformedData.map((item) => {
        if (!usernameToImageMap[item.friendName]) {
          usernameToImageMap[item.friendName] = images[imageIndex % images.length];
          imageIndex++;
        }
        return {
          ...item,
          friendImage: usernameToImageMap[item.friendName],
        };
      });
    
      setMarkerData(finalData);
    };

    mapRef.current.on('load', () => {
      addCustomLayers();
      addHeatMapLayer();
      fetchDataAndSetMarkers();
    });

    return () => mapRef.current.remove();
  }, [mapStyle]);

  useEffect(() => {
    if (mapRef.current) {
      const heatMapLayer = mapRef.current.getLayer('heatmap-layer');
      if (heatMapLayer) {
        mapRef.current.setLayoutProperty(
          'heatmap-layer',
          'visibility',
          showHeatMap ? 'visible' : 'none'
        );
      }
    }
  }, [showHeatMap]);

  const addCustomLayers = () => {
    const layers = mapRef.current.getStyle().layers;
    const labelLayerId = layers.find(
      (layer) => layer.type === 'symbol' && layer.layout['text-field']
    ).id;

    const models = [
      { id: 'snoopy', coordinates: [-79.39665, 43.6598], scale: 100, path: '/snoopy.glb' },
      { id: 'bmo', coordinates: [-79.4044, 43.6667], scale: 120, path: '/bmo.glb' },
      { id: 'pika', coordinates: [-79.39825, 43.65835], scale: 50, path: '/pikachu.glb' },
      { id: 'minion', coordinates: [-122.4786, 37.8199], scale: 60, path: '/minion.glb' },
      { id: 'stitch', coordinates: [116.3897, 39.9048], scale: 80, path: '/stitch.glb' }
    ];

    models.forEach(model => {
      mapRef.current.addLayer({
        id: `${model.id}-threebox-model`,
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
          window.tb = new Threebox(
            mapRef.current,
            mapRef.current.getCanvas().getContext('webgl2'),
            { defaultLights: true }
          );

          const options = {
            obj: model.path,
            type: 'gltf',
            scale: { x: model.scale, y: model.scale, z: model.scale },
            units: 'meters',
            rotation: { x: 90, y: 130, z: 0 }
          };

          window.tb.loadObj(options, (loadedModel) => {
            loadedModel.setCoords(model.coordinates);
            loadedModel.setRotation({ x: 0, y: 0, z: 241 });
            window.tb.add(loadedModel);
            loadedModel.playDefault({ duration: 20000000 });
          });
        },
        render: function () {
          window.tb.update();
        }
      });
    });

    mapRef.current.addLayer(
      {
        id: 'add-3d-buildings',
        source: 'composite',
        'source-layer': 'building',
        filter: ['==', 'extrude', 'true'],
        type: 'fill-extrusion',
        minzoom: 15,
        paint: {
          'fill-extrusion-color': '#aaa',
          'fill-extrusion-height': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'height']
          ],
          'fill-extrusion-base': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            0,
            15.05,
            ['get', 'min_height']
          ],
          'fill-extrusion-opacity': 0.6
        }
      },
      labelLayerId
    );

    const navControl = new mapboxgl.NavigationControl({ showCompass: true });
    mapRef.current.addControl(navControl, 'top-right');
  };

  const addHeatMapLayer = () => {
    mapRef.current.addSource('heatmap-data', {
      type: 'geojson',
      data: './crime_rates.geojson'
    });

    mapRef.current.addLayer({
      id: 'heatmap-layer',
      type: 'heatmap',
      source: 'heatmap-data',
      maxzoom: 15,
      paint: {
        'heatmap-weight': [
          'interpolate',
          ['linear'],
          ['get', 'mag'],
          0, 0,
          6, 1
        ],
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          15, 20
        ],
        'heatmap-opacity': 0.8
      }
    }, 'add-3d-buildings');

    mapRef.current.setLayoutProperty(
      'heatmap-layer',
      'visibility',
      showHeatMap ? 'visible' : 'none'
    );
  };

  useEffect(() => {
    if (mapRef.current) {
      markerData.forEach((marker) => {
        const el = document.createElement('div');
        el.className = 'marker';
        el.style.backgroundImage = `url(${marker.friendImage})`;
        el.style.width = '50px';
        el.style.height = '50px';
        el.style.backgroundSize = '100%';
        el.style.borderRadius = '50%';
        el.style.border = '2px solid var(--marker-border-color)';
  
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(
          `<div style="padding: 10px; border-radius: 10px; background-color: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
             <div style="margin-bottom: 10px; padding: 10px; border-radius: 10px; background-color: #f0f0f0;">
               <h3 style="color: black; margin: 0; font-weight: bold;">Username: ${marker.friendName}</h3>
             </div>
             <div style="margin-bottom: 10px; padding: 10px; border-radius: 10px; background-color: #f0f0f0;">
               <p style="color: black; margin: 0;"><strong>Description:</strong> ${marker.description}</p>
             </div>
             <div style="padding: 10px; border-radius: 10px; background-color: #f0f0f0;">
               <p style="color: black; margin: 0;"><strong>Time:</strong> ${marker.timestamp}</p>
             </div>
           </div>`
        );
  
        new mapboxgl.Marker(el)
          .setLngLat(marker.location)
          .setPopup(popup)
          .addTo(mapRef.current);
      });
    }
  }, [markerData]);

  const flyToModel = (friend) => {
    setShowFriendsPanel(false);
    const offsetCoordinates = [
      friend.coordinates[0] - 0.0008, // Adjust this value to set how much east you want to move
      friend.coordinates[1] - 0.0008 // Adjust this value to set how much north you want to move
    ];
    mapRef.current.flyTo({
      center: offsetCoordinates,
      essential: true,
      zoom: 18,
      pitch: 64.9,
      bearing: 172.5,
      speed: 1.3,
      curve: 1.5
    });
    mapRef.current.once('moveend', () => {
      setSelectedFriend(friend);
    });
  };

  const toggleHeatMap = () => {
    setShowHeatMap(!showHeatMap);
  };

  const toggleFriendsPanel = () => {
    setShowFriendsPanel(!showFriendsPanel);
  };

  const handleFriendClick = (friend) => {
    flyToModel(friend);
  };

  const closeFriendDetails = () => {
    setSelectedFriend(null);
  };

  return (
    <div>
      <div id="map" ref={mapContainerRef} className={styles.dashboardContainer}></div>
      <FriendsPanel
        isOpen={showFriendsPanel}
        onClose={toggleFriendsPanel}
        onFriendClick={handleFriendClick}
      />
      <FriendDetails
        friend={selectedFriend}
        onClose={closeFriendDetails}
      />
      <button
        onClick={toggleHeatMap}
        className={styles.heatMapToggle}
      >
        {showHeatMap ? 'Hide Heat Map' : 'Show Heat Map'}
      </button>
    </div>
  );
};

export default Map;