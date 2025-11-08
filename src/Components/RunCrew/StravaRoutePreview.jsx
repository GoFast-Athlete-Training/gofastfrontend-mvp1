import React, { useEffect, useRef, useState } from 'react';
import polyline from '@mapbox/polyline';

const loaderCache = {};

const loadGoogleMaps = (apiKey) => {
  if (typeof window === 'undefined') return Promise.reject('No window');
  if (window.google && window.google.maps) return Promise.resolve(window.google.maps);
  if (loaderCache[apiKey]) return loaderCache[apiKey];

  loaderCache[apiKey] = new Promise((resolve, reject) => {
    const existing = document.querySelector('script[data-google-maps-loader="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(window.google.maps));
      existing.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    script.dataset.googleMapsLoader = 'true';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => reject(new Error('Failed to load Google Maps script'));
    document.body.appendChild(script);
  });

  return loaderCache[apiKey];
};

const decodePolylineToPath = (encoded) => {
  try {
    return polyline.decode(encoded).map(([lat, lng]) => ({ lat, lng }));
  } catch (error) {
    console.error('Failed to decode polyline', error);
    return [];
  }
};

const calculateBounds = (maps, path) => {
  const bounds = new maps.LatLngBounds();
  path.forEach((coord) => bounds.extend(coord));
  return bounds;
};

export default function StravaRoutePreview({ polylineString, stravaUrl }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const pathRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!polylineString) {
      setError(null);
      if (pathRef.current) {
        pathRef.current.setMap(null);
        pathRef.current = null;
      }
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setError('Google Maps key missing. Set VITE_GOOGLE_MAPS_API_KEY to preview routes.');
      return;
    }

    let isMounted = true;

    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!isMounted || !mapContainerRef.current) return;

        const path = decodePolylineToPath(polylineString);
        if (!path.length) {
          setError('Unable to decode Strava polyline.');
          return;
        }
        setError(null);

        if (!mapRef.current) {
          mapRef.current = new maps.Map(mapContainerRef.current, {
            zoom: 13,
            center: path[0],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
          });
        }

        if (pathRef.current) {
          pathRef.current.setMap(null);
        }

        pathRef.current = new maps.Polyline({
          path,
          geodesic: true,
          strokeColor: '#FF3B30',
          strokeOpacity: 0.9,
          strokeWeight: 4
        });
        pathRef.current.setMap(mapRef.current);

        const bounds = calculateBounds(maps, path);
        mapRef.current.fitBounds(bounds);
        const listener = maps.event.addListenerOnce(mapRef.current, 'idle', () => {
          if (mapRef.current.getZoom() > 16) {
            mapRef.current.setZoom(16);
          }
          maps.event.removeListener(listener);
        });
      })
      .catch((loadError) => {
        console.error(loadError);
        if (isMounted) setError('Failed to load Google Maps for Strava preview.');
      });

    return () => {
      isMounted = false;
    };
  }, [polylineString]);

  if (!polylineString) return null;

  return (
    <div className="mt-3 border border-gray-300 rounded-lg overflow-hidden bg-white">
      <div
        ref={mapContainerRef}
        className="w-full h-72"
      />
      {error && (
        <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border-t border-red-200">
          {error}
        </div>
      )}
      {stravaUrl && (
        <div className="px-3 py-2 text-xs flex justify-between items-center border-t border-gray-200 bg-gray-50">
          <span className="text-gray-600">Based on Strava route preview</span>
          <a
            href={stravaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 font-semibold"
          >
            View in Strava →
          </a>
        </div>
      )}
    </div>
  );
}
