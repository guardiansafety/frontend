import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Threebox } from 'threebox-plugin';

import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './Dashboard.module.css';

const Map = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const modelCoordinates = [-79.398010, 43.663040]; // Coordinates of the 3D model

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYnJpYW4temhhbmciLCJhIjoiY2x6YmdhbGxzMDBleTJqcHkycTF4ZTU1aiJ9.ESxJl1cwwl3PC_AoDvFWrg';

    mapRef.current = new mapboxgl.Map({
      container: 'map',
      style: 'mapbox://styles/mapbox/navigation-night-v1',
      center: modelCoordinates, // Center the map initially at the model coordinates
      zoom: 15.4,
      pitch: 64.9,
      bearing: 172.5,
      antialias: true
    });

    mapRef.current.on('style.load', () => {
      // Add the 3D buildings layer
      const layers = mapRef.current.getStyle().layers;
      const labelLayerId = layers.find(
        (layer) => layer.type === 'symbol' && layer.layout['text-field']
      ).id;

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

      // Add the Threebox model
      mapRef.current.addLayer({
        id: 'custom-threebox-model',
        type: 'custom',
        renderingMode: '3d',
        onAdd: function () {
          window.tb = new Threebox(
            mapRef.current,
            mapRef.current.getCanvas().getContext('webgl'),
            { defaultLights: true }
          );

          const scale = 0.3;
          const options = {
            obj: "/run.glb", // Ensure this path is correct
            type: 'gltf',
            scale: { x: scale, y: scale, z: scale },
            units: 'meters',
            rotation: { x: 90, y: 130, z: 0 }
          };

          window.tb.loadObj(options, (model) => {
            model.setCoords(modelCoordinates);
            model.setRotation({ x: 0, y: 0, z: 241 });
            window.tb.add(model);

            // Play the default animation
            model.playDefault({ duration: 20000000 }); // Adjust duration if needed
          });
        },

        render: function () {
          window.tb.update();
        }
      });

      // Add the NavigationControl to the map
      const navControl = new mapboxgl.NavigationControl({ showCompass: true });
      mapRef.current.addControl(navControl, 'top-right'); // Position the control in the top-right corner
    });

    return () => mapRef.current.remove();
  }, []);

  const flyToModel = () => {
    mapRef.current.flyTo({
      center: modelCoordinates,
      essential: true, // This ensures the animation is not interrupted
      zoom: 18, // Adjust zoom level as needed
      pitch: 64.9, // Match the pitch of the map
      bearing: 172.5, // Match the bearing of the map
      speed: 1, // Adjust speed of the animation
      curve: 1 // Adjust the curve of the animation
    });
  };

  return (
    <div>
      <div id="map" ref={mapContainerRef} className={styles.dashboardContainer}></div>
      <button onClick={flyToModel} className={styles.flyButton}>
        Fly to Model
      </button>
    </div>
  );
};

export default Map;
