import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const zoom = 15;

const icon = L.icon({
  iconSize: [25, 41],
  iconAnchor: [10, 41],
  popupAnchor: [2, -40],
  iconUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7/dist/images/marker-shadow.png",
});
let theMarker = null;

function DisplayPosition({ map, coordinates, setCoordinates }) {
  useEffect(() => {
    if (!map) return;
    map.locate({
      setView: true,
    });
    map.on("locationfound", function (locationEvent) {
      setCoordinates(locationEvent.latlng);
    });
  }, []);

  useEffect(() => {
    if (theMarker !== null) {
      map.removeLayer(theMarker);
    } else {
      // initial value if user denies current location ? geo maybe?
    }
    theMarker = L.marker(coordinates, { icon }).addTo(map);
  });

  useEffect(() => {
    const onClick = (e) => {
      setCoordinates(e.latlng);
    };
    map.on("click", onClick);
    return () => {
      map.off("click", onClick);
    };
  }, [map]);

  return null;
}

function Map({ coordinates, setCoordinates }) {
  const [map, setMap] = useState(null);

  const displayMap = useMemo(
    () => (
      <MapContainer
        center={coordinates}
        zoom={zoom}
        whenCreated={setMap}
        style={{ height: "50vh" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
      </MapContainer>
    ),
    [coordinates]
  );

  return (
    <div>
      {map ? (
        <DisplayPosition
          map={map}
          coordinates={coordinates}
          setCoordinates={setCoordinates}
        />
      ) : null}
      {displayMap}
    </div>
  );
}

export default Map;
