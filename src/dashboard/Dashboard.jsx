import { useEffect, useRef, useContext, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import { Threebox } from 'threebox-plugin';
import { ThemeContext } from '../ColorTheme';
import 'mapbox-gl/dist/mapbox-gl.css';
import styles from './Dashboard.module.css';

const Map = () => {
  const mapContainerRef = useRef();
  const mapRef = useRef();
  const { mapStyle } = useContext(ThemeContext);
  const zoomLevel = 15.4;
  const [showHeatMap, setShowHeatMap] = useState(false);

  useEffect(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiYnJpYW4temhhbmciLCJhIjoiY2x6YmdhbGxzMDBleTJqcHkycTF4ZTU1aiJ9.ESxJl1cwwl3PC_AoDvFWrg';

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: mapStyle,
      center: [-79.39665, 43.6598], // Initial center coordinates
      zoom: zoomLevel,
      pitch: 64.9,
      bearing: 172.5,
      antialias: true
    });

    mapRef.current.on('style.load', () => {
      addCustomLayers();
      addHeatMapLayer();
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
    // Add a new source for the heat map data
    mapRef.current.addSource('heatmap-data', {
      type: 'geojson',
      data: './crime_rates.geojson' // Replace with your GeoJSON data source
    });

    // Add a new layer for the heat map
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

    // Set initial visibility based on showHeatMap state
    mapRef.current.setLayoutProperty(
      'heatmap-layer',
      'visibility',
      showHeatMap ? 'visible' : 'none'
    );
  };

  const flyToModel = (coordinates) => {
    mapRef.current.flyTo({
      center: coordinates,
      essential: true,
      zoom: 18,
      pitch: 64.9,
      bearing: 172.5,
      speed: 1,
      curve: 1
    });
  };

  const toggleHeatMap = () => {
    setShowHeatMap(!showHeatMap);
  };

  return (
    <div>
      <div id="map" ref={mapContainerRef} className={styles.dashboardContainer}></div>
      <div className={styles.buttonContainer}>
        <button onClick={() => flyToModel([-79.39665, 43.6598])} className={styles.flyButton}>
          Fly to Snoopy
        </button>
        <button onClick={() => flyToModel([-79.4044, 43.6667])} className={styles.flyButton}>
          Fly to BMO
        </button>
        <button onClick={() => flyToModel([-79.39825, 43.65835])} className={styles.flyButton}>
          Fly to Pikachu
        </button>
        <button onClick={() => flyToModel([-122.4786, 37.8199])} className={styles.flyButton}>
          Fly to Minion
        </button>
        <button onClick={() => flyToModel([116.3897, 39.9048])} className={styles.flyButton}>
          Fly to Stitch
        </button>
        <button onClick={toggleHeatMap} className={styles.flyButton}>
          {showHeatMap ? 'Hide Heat Map' : 'Show Heat Map'}
        </button>
      </div>
    </div>
  );
};

export default Map;