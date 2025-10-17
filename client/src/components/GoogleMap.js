import { useState, useEffect, useRef } from 'react';

const GoogleMap = ({ 
  center, 
  zoom = 13, 
  onLocationChange, 
  clinics = [], 
  onClinicClick,
  selectedType,
  searchRadius 
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userMarker, setUserMarker] = useState(null);
  const [clinicMarkers, setClinicMarkers] = useState([]);
  const [placesService, setPlacesService] = useState(null);

  // Initialize Google Map
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const mapInstance = new window.google.maps.Map(mapRef.current, {
      center: { lat: center.lat, lng: center.lng },
      zoom: zoom,
      styles: [
        {
          "featureType": "poi.medical",
          "elementType": "geometry",
          "stylers": [{ "color": "#ffeaa7" }]
        },
        {
          "featureType": "poi.medical",
          "elementType": "labels.text.fill",
          "stylers": [{ "color": "#dc143c" }]
        }
      ],
      mapTypeControl: true,
      streetViewControl: true,
      fullscreenControl: true,
      zoomControl: true,
      gestureHandling: 'cooperative'
    });

    setMap(mapInstance);
    setPlacesService(new window.google.maps.places.PlacesService(mapInstance));

    // Add click listener for map
    mapInstance.addListener('click', (event) => {
      const newLocation = {
        lat: event.latLng.lat(),
        lng: event.latLng.lng()
      };
      onLocationChange(newLocation);
    });

  }, [center.lat, center.lng, zoom, onLocationChange]);

  // Update user marker
  useEffect(() => {
    if (!map || !window.google) return;

    // Remove existing user marker
    if (userMarker) {
      userMarker.setMap(null);
    }

    // Create new user marker
    const marker = new window.google.maps.Marker({
      position: { lat: center.lat, lng: center.lng },
      map: map,
      title: 'Your Location',
      draggable: true,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#4285f4" width="32" height="32">
            <circle cx="12" cy="12" r="8" fill="#4285f4" stroke="#ffffff" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="#ffffff"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 32),
        anchor: new window.google.maps.Point(16, 16)
      }
    });

    // Add drag listener
    marker.addListener('dragend', () => {
      const newPosition = marker.getPosition();
      onLocationChange({
        lat: newPosition.lat(),
        lng: newPosition.lng()
      });
    });

    setUserMarker(marker);

    // Center map on user location
    map.setCenter({ lat: center.lat, lng: center.lng });

  }, [map, center.lat, center.lng, onLocationChange]);

  // Update clinic markers
  useEffect(() => {
    if (!map || !window.google) return;

    // Clear existing clinic markers
    clinicMarkers.forEach(marker => marker.setMap(null));

    // Create new clinic markers
    const newMarkers = clinics.map(clinic => {
      const marker = new window.google.maps.Marker({
        position: { 
          lat: clinic.coordinates.latitude, 
          lng: clinic.coordinates.longitude 
        },
        map: map,
        title: clinic.name,
        icon: getClinicIcon(clinic.type)
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 10px; max-width: 250px;">
            <h3 style="margin: 0 0 8px 0; color: #333;">${clinic.name}</h3>
            <p style="margin: 4px 0; color: #666;"><strong>Type:</strong> ${clinic.type.replace('_', ' ')}</p>
            <p style="margin: 4px 0; color: #666;"><strong>Distance:</strong> ${formatDistance(clinic.distance)}</p>
            ${clinic.rating ? `<p style="margin: 4px 0; color: #666;"><strong>Rating:</strong> ${'⭐'.repeat(Math.floor(clinic.rating))} (${clinic.rating})</p>` : ''}
            ${clinic.contact?.phone ? `<p style="margin: 4px 0; color: #666;"><strong>Phone:</strong> ${clinic.contact.phone}</p>` : ''}
            ${clinic.address ? `<p style="margin: 4px 0; color: #666;"><strong>Address:</strong> ${clinic.address.street || clinic.address.village}</p>` : ''}
            <div style="margin-top: 10px;">
              <button onclick="window.open('https://www.google.com/maps/dir/?api=1&destination=${clinic.coordinates.latitude},${clinic.coordinates.longitude}', '_blank')" 
                      style="background: #4285f4; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer; margin-right: 8px;">
                🗺️ Directions
              </button>
              ${clinic.contact?.phone ? `
                <button onclick="window.open('tel:${clinic.contact.phone}')" 
                        style="background: #34a853; color: white; border: none; padding: 8px 12px; border-radius: 4px; cursor: pointer;">
                  📞 Call
                </button>
              ` : ''}
            </div>
          </div>
        `
      });

      marker.addListener('click', () => {
        infoWindow.open(map, marker);
        if (onClinicClick) {
          onClinicClick(clinic);
        }
      });

      return marker;
    });

    setClinicMarkers(newMarkers);

  }, [map, clinics, onClinicClick]);

  // Search for nearby places using Google Places API
  useEffect(() => {
    if (!placesService || !center.lat || !center.lng) return;

    const request = {
      location: new window.google.maps.LatLng(center.lat, center.lng),
      radius: searchRadius || 10000,
      type: getGooglePlaceType(selectedType)
    };

    placesService.nearbySearch(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        // This will be handled by the parent component
        console.log('Found places:', results.length);
      }
    });

  }, [placesService, center.lat, center.lng, selectedType, searchRadius]);

  const getClinicIcon = (type) => {
    const iconConfig = {
      hospital: { color: '#dc3545', symbol: 'H' },
      clinic: { color: '#007bff', symbol: 'C' },
      health_center: { color: '#28a745', symbol: 'HC' },
      pharmacy: { color: '#ffc107', symbol: 'P' },
      diagnostic_center: { color: '#6f42c1', symbol: 'D' }
    };

    const config = iconConfig[type] || iconConfig.clinic;

    const svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40" width="40" height="40">
        <circle cx="20" cy="20" r="18" fill="${config.color}" stroke="#ffffff" stroke-width="2"/>
        <text x="20" y="26" text-anchor="middle" font-size="12" font-weight="bold" fill="white">${config.symbol}</text>
      </svg>
    `;

    return {
      url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svgIcon),
      scaledSize: new window.google.maps.Size(40, 40),
      anchor: new window.google.maps.Point(20, 20)
    };
  };

  const getGooglePlaceType = (localType) => {
    const typeMap = {
      'hospital': 'hospital',
      'clinic': 'doctor',
      'health_center': 'health',
      'pharmacy': 'pharmacy',
      'diagnostic_center': 'health'
    };
    return typeMap[localType] || 'health';
  };

  const formatDistance = (distance) => {
    if (!distance) return 'N/A';
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  return (
    <div 
      ref={mapRef} 
      style={{ 
        width: '100%', 
        height: '500px',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
      }} 
    />
  );
};

export default GoogleMap;