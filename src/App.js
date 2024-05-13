import React, { useState, useEffect } from 'react';
import mapboxgl from 'mapbox-gl';
import './map.css';
import axios from 'axios'; 
import SearchBox from './SearchBox';

mapboxgl.accessToken = 'pk.eyJ1IjoiZXNwYWNlc2VydmljZSIsImEiOiJjbHZ1dHZjdTQwMDhrMm1uMnoxdWRibzQ4In0.NaprcMBbdX07f4eXXdr-lw';


const App = () => {
  
const [geoJsonData1, setGeoJsonData1] = useState(null);
const [geoJsonData2, setGeoJsonData2] = useState(null);
const [geoJsonData3, setGeoJsonData3] = useState(null);
const [map, setMap] = useState(null); 
const [selectedOption, setSelectedOption] = useState('port'); // Default selected option is 'port'

const handleSearch = async (query) => {
  try {
      let searchResult = null;
      let adjustedQuery = query;

      if (selectedOption === 'port') {
          adjustedQuery += ' port';
      } else if (selectedOption === 'ship') {
          adjustedQuery += ' ship';
      }

      const isShip = adjustedQuery.toLowerCase().includes('ship');
      const isPort = adjustedQuery.toLowerCase().includes('port');

      // console.log(adjustedQuery);

      if (isShip) {
        // console.log("entered is ship")
          const response = await axios.get(`http://localhost:8000/ships/${query}`);
          const data1 = response.data;
          setGeoJsonData1(data1.routes.last2Days);
          setGeoJsonData2(data1.routes.between2And7Days)
          // searchResult = response.data;
      } else if (isPort) {
        console.log("enetered is port")
          const response = await axios.get(`http://localhost:8000/ports/${query}`);
          searchResult = response.data;
          console.log("searchResult: ", searchResult.geometry.coordinates);
      } else {
          console.log('Invalid search query. Please enter a ship or port name.');
          return;
      }

// console.log("got the data :", geoJsonData1);


      if (searchResult && isPort) {
          const [longitude, latitude ] = searchResult.geometry.coordinates;
          map.flyTo({ center: [longitude, latitude], zoom: 10 });
          new mapboxgl.Marker().setLngLat([longitude, latitude]).addTo(map);
      } else {
          console.log('No search result found.');
      }
  } catch (error) {
      console.error('Error searching:', error);
  }
};



useEffect(() => {
    const fetchData = async () => {
        try {
            const response2 = await axios.get("http://localhost:8000/ports");
            const data2 = response2.data;
            setGeoJsonData3(data2[0]);
        } catch (error) {
            console.error(error);
        }
    };

    fetchData();
}, []);

useEffect(() => {
    if (!(geoJsonData1 || geoJsonData3) && !map) { 
        const newMap = new mapboxgl.Map({
            container: 'map',
            style: 'mapbox://styles/mapbox/streets-v11',
            center: [-96, 37.8],
            zoom: 3
        });

        setMap(newMap); 
    }
}, [geoJsonData1, geoJsonData3]);

useEffect(() => {
  // console.log("geoJsonData1 updated:", geoJsonData1);
  if(geoJsonData1){
    if (selectedOption === 'ship') {
      // console.log("selected option is " + selectedOption);
      if (map.getLayer('route_solid')) {
        map.removeLayer('route_solid');
      }
      if (map.getLayer('route_dashed')) {
        map.removeLayer('route_dashed');
      }
      // Remove existing sources with the same ID if they exist
      if (map.getSource('route_solid')) {
        map.removeSource('route_solid');
      }
      if (map.getSource('route_dashed')) {
        map.removeSource('route_dashed');
      }
      map.addLayer({
          'id': 'route_solid',
          'type': 'line',
          'source': {
              'type': 'geojson',
              'data': geoJsonData1
          },
          'layout': {
              'line-join': 'round',
              'line-cap': 'round'
          },
          'paint': {
              'line-color': 'black',
              'line-width': 8
          }
      });
      map.addLayer({
          'id': 'route_dashed',
          'type': 'line',
          'source': {
              'type': 'geojson',
              'data': geoJsonData2
          },
          'layout': {
              'line-join': 'round',
              'line-cap': 'round'
          },
          'paint': {
              'line-color': 'red',
              'line-width': 8,
              'line-dasharray': [2, 2] // Setting a dash array for dotted lines
          }
      });
      const combinedCoordinates = [
        ...geoJsonData1.features[0].geometry.coordinates,
        ...geoJsonData2.features[0].geometry.coordinates
      ];
      const bounds = combinedCoordinates.reduce((bounds, coord) => {
          return bounds.extend(coord);
      }, new mapboxgl.LngLatBounds());

      map.fitBounds(bounds, { padding: 50 });
      }
  }
}, [geoJsonData1]);


useEffect(() => {
    if ((geoJsonData1 || geoJsonData3) && map) { 
        map.on('load', () => {
          map.addLayer({
              'id': 'portData',
              'type': 'circle',
              'source': {
                  'type': 'geojson',
                  'data': geoJsonData3
              },
              'paint': {
                  'circle-radius': 5,
                  'circle-color': 'red'
              }
          });
          
            
        });
    }
}, [map, geoJsonData1, geoJsonData3]);




const handleOptionChange = (event) => {
    setSelectedOption(event.target.value);
};

return (
    <div className="App">
        <div id="map" />
        <div className="options-box">
            <label>
                <input
                    type="radio"
                    value="port"
                    checked={selectedOption === 'port'}
                    onChange={handleOptionChange}
                />
                Port
            </label>
            <label>
                <input
                    type="radio"
                    value="ship"
                    checked={selectedOption === 'ship'}
                    onChange={handleOptionChange}
                />
                Ship
            </label>
        </div>
        <SearchBox onSearch={handleSearch} />
    </div>
);
};

export default App;
