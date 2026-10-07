import React, { useEffect } from "react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import L from "leaflet";

import "leaflet/dist/leaflet.css";

/*
|--------------------------------------------------------------------------
| SafeWalk custom marker
|--------------------------------------------------------------------------
*/

const safeWalkIcon = L.divIcon({
  className: "safewalk-marker-wrapper",

  html: `
    <div class="safewalk-marker">
      <div class="safewalk-marker-dot"></div>
    </div>
  `,

  iconSize: [40, 48],
  iconAnchor: [20, 48],
  popupAnchor: [0, -42],
});

/*
|--------------------------------------------------------------------------
| Map center updater
|--------------------------------------------------------------------------
*/

function MapCenterUpdater({ lat, lng }) {
  const map = useMap();

  useEffect(() => {
    if (
      Number.isFinite(Number(lat)) &&
      Number.isFinite(Number(lng))
    ) {
      map.setView(
        [Number(lat), Number(lng)],
        map.getZoom(),
        {
          animate: true,
        }
      );
    }
  }, [lat, lng, map]);

  return null;
}

/*
|--------------------------------------------------------------------------
| MapView
|--------------------------------------------------------------------------
|
| Props:
| lat
| lng
| markerLabel
| height
|--------------------------------------------------------------------------
*/

export default function MapView({
  lat,
  lng,
  markerLabel = "Reported location",
  height = 360,
}) {
  const latitude = Number(lat);
  const longitude = Number(lng);

  /*
  | Invalid coordinates
  */

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return (
      <div
        className="safewalk-map safewalk-map-error"
        style={{ height }}
      >
        <div className="map-error-content">
          <strong>Location unavailable</strong>

          <span>
            Valid GPS coordinates were not provided.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="safewalk-map"
      style={{ height }}
    >
      <MapContainer
        center={[latitude, longitude]}
        zoom={16}
        scrollWheelZoom={true}
        zoomControl={true}
        attributionControl={true}
        className="safewalk-leaflet-map"
      >

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
          maxZoom={19}
        />

        <MapCenterUpdater
          lat={latitude}
          lng={longitude}
        />

        <Marker
          position={[
            latitude,
            longitude,
          ]}
          icon={safeWalkIcon}
        >
          <Popup>
            <div className="safewalk-popup">
              <strong>
                {markerLabel}
              </strong>

              <span>
                {latitude.toFixed(6)},{" "}
                {longitude.toFixed(6)}
              </span>
            </div>
          </Popup>
        </Marker>

      </MapContainer>
    </div>
  );
}