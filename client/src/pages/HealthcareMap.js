import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import GoogleMap from '../components/GoogleMap';



const HealthcareMap = () => {
  const { t } = useTranslation();
  const [clinics, setClinics] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [searchRadius, setSearchRadius] = useState(10000); // 10km default

  // Default location (Pune, Maharashtra)
  const defaultLocation = { lat: 18.5204, lng: 73.8567 };

  useEffect(() => {
    getUserLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyClinics();
    }
  }, [userLocation, selectedType, searchRadius]);

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          setUserLocation(defaultLocation);
          setError('Using default location. Please enable location access for better results.');
        }
      );
    } else {
      setUserLocation(defaultLocation);
      setError('Geolocation not supported. Using default location.');
    }
  };

  const fetchNearbyClinics = async () => {
    if (!userLocation || !window.google?.maps?.places) return;

    setLoading(true);
    setError('');
    
    try {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      const request = {
        location: new window.google.maps.LatLng(userLocation.lat, userLocation.lng),
        radius: searchRadius,
        type: getGooglePlaceType(selectedType),
        keyword: selectedType ? '' : 'hospital clinic pharmacy medical health'
      };

      service.nearbySearch(request, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const formattedClinics = results.map(place => ({
            _id: place.place_id,
            name: place.name,
            type: mapGoogleTypeToLocal(place.types),
            coordinates: {
              latitude: place.geometry.location.lat(),
              longitude: place.geometry.location.lng()
            },
            contact: {
              phone: place.formatted_phone_number || 'Call for details'
            },
            address: {
              street: place.vicinity || place.formatted_address || 'Address not available',
              village: place.vicinity || 'Local area',
              district: 'District'
            },
            rating: place.rating || 0,
            isOpen: place.opening_hours?.open_now,
            distance: calculateDistance(
              userLocation.lat,
              userLocation.lng,
              place.geometry.location.lat(),
              place.geometry.location.lng()
            )
          }));

          // Sort by distance
          formattedClinics.sort((a, b) => a.distance - b.distance);
          setClinics(formattedClinics);
          
          if (formattedClinics.length === 0) {
            setError('No healthcare facilities found. Try increasing search radius or changing facility type.');
          }
        } else {
          setError('Unable to search for healthcare facilities. Please check your internet connection.');
        }
        setLoading(false);
      });

    } catch (error) {
      console.error('Failed to fetch clinics:', error);
      setError('Error searching for healthcare facilities. Please try again.');
      setLoading(false);
    }
  };

  const generateMockClinics = (location, type, radius) => {
    const mockData = [
      {
        _id: 'mock-1',
        name: 'City General Hospital',
        type: 'hospital',
        coordinates: { latitude: location.lat + 0.01, longitude: location.lng + 0.01 },
        contact: { phone: '+91-9876543210' },
        address: { street: 'Main Road', village: 'City Center', district: 'Urban District' },
        rating: 4.2,
        isOpen: true,
        distance: 1.2
      },
      {
        _id: 'mock-2',
        name: 'Family Care Clinic',
        type: 'clinic',
        coordinates: { latitude: location.lat - 0.005, longitude: location.lng + 0.008 },
        contact: { phone: '+91-9876543211' },
        address: { street: 'Health Street', village: 'Medical Colony', district: 'Health District' },
        rating: 4.0,
        isOpen: true,
        distance: 0.8
      },
      {
        _id: 'mock-3',
        name: 'MedPlus Pharmacy',
        type: 'pharmacy',
        coordinates: { latitude: location.lat + 0.003, longitude: location.lng - 0.006 },
        contact: { phone: '+91-9876543212' },
        address: { street: 'Pharmacy Lane', village: 'Medicine Market', district: 'Commercial District' },
        rating: 3.8,
        isOpen: true,
        distance: 0.5
      },
      {
        _id: 'mock-4',
        name: 'Rural Health Center',
        type: 'health_center',
        coordinates: { latitude: location.lat - 0.008, longitude: location.lng - 0.004 },
        contact: { phone: '+91-9876543213' },
        address: { street: 'Village Road', village: 'Rural Area', district: 'Rural District' },
        rating: 3.5,
        isOpen: true,
        distance: 1.0
      }
    ];

    // Filter by type if specified
    let filtered = type ? mockData.filter(clinic => clinic.type === type) : mockData;
    
    // Filter by radius (convert km to degrees roughly)
    const maxDistance = radius / 111000; // Rough conversion
    filtered = filtered.filter(clinic => {
      const distance = Math.sqrt(
        Math.pow(clinic.coordinates.latitude - location.lat, 2) +
        Math.pow(clinic.coordinates.longitude - location.lng, 2)
      );
      return distance <= maxDistance;
    });

    return filtered;
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

  const mapGoogleTypeToLocal = (googleTypes) => {
    if (!googleTypes) return 'clinic';
    if (googleTypes.includes('hospital')) return 'hospital';
    if (googleTypes.includes('pharmacy')) return 'pharmacy';
    if (googleTypes.includes('doctor') || googleTypes.includes('health')) return 'clinic';
    return 'health_center';
  };

  const extractLocationComponent = (place, componentType) => {
    if (!place.address_components) return '';
    const component = place.address_components.find(comp => 
      comp.types.includes(componentType)
    );
    return component ? component.long_name : '';
  };

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c; // Distance in kilometers
    return distance;
  };

  const handleLocationChange = (newLocation) => {
    setUserLocation(newLocation);
  };

  const handleClinicClick = (clinic) => {
    console.log('Clinic clicked:', clinic.name);
  };

  const formatDistance = (distance) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  };

  const getDirections = (clinic) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${clinic.coordinates.latitude},${clinic.coordinates.longitude}`;
    window.open(url, '_blank');
  };

  if (!userLocation) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Getting your location...</p>
      </div>
    );
  }

  return (
    <div className="container map-container fade-in">
      <div className="card-header text-center">
        <h1 className="card-title">{t('map.nearbyHealthcare')}</h1>
        <p>Find healthcare facilities near you</p>
      </div>

      {error && <div className="alert alert-warning">{error}</div>}

      {/* Enhanced Filters */}
      <div className="filter-section">
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">🏥 Facility Type</label>
            <select
              className="form-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">🔍 All Healthcare Facilities</option>
              <option value="hospital">🏥 Hospitals</option>
              <option value="doctor">👨‍⚕️ Clinics & Doctors</option>
              <option value="pharmacy">💊 Pharmacies</option>
              <option value="health">⚕️ Health Centers</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">📍 Search Radius</label>
            <select
              className="form-select"
              value={searchRadius}
              onChange={(e) => setSearchRadius(parseInt(e.target.value))}
            >
              <option value="2000">📍 2 km (Nearby)</option>
              <option value="5000">🚶 5 km (Walking)</option>
              <option value="10000">🚗 10 km (Driving)</option>
              <option value="25000">🛣️ 25 km (Extended)</option>
              <option value="50000">🌍 50 km (Wide Area)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">&nbsp;</label>
            <button className="btn" onClick={fetchNearbyClinics}>
              🔍 Find Healthcare
            </button>
          </div>
        </div>
      </div>

      <div className="healthcare-map-container">
        {/* Google Map */}
        <div className="map-section">
          <div className="map-instructions">
            <div className="instruction-card">
              <span className="instruction-icon">📍</span>
              <div className="instruction-text">
                <strong>Interactive Map:</strong> Drag the blue marker or click anywhere to change your location. 
                Click on healthcare facility markers for details and directions.
              </div>
            </div>
          </div>
          
          <GoogleMap
            center={userLocation}
            zoom={13}
            onLocationChange={handleLocationChange}
            clinics={clinics}
            onClinicClick={handleClinicClick}
            selectedType={selectedType}
            searchRadius={searchRadius}
          />
        </div>

        {/* Clinic List */}
        <div className="facilities-list">
          <div className="facilities-header">
            <h3 className="facilities-title">
              <span className="facilities-icon">🏥</span>
              Nearby Facilities ({clinics.length})
            </h3>
            {loading && (
              <div className="loading-indicator">
                <div className="spinner-small"></div>
                <span>Searching...</span>
              </div>
            )}
          </div>

          <div className="facilities-content">
            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Finding healthcare facilities near you...</p>
              </div>
            ) : clinics.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h4>No facilities found</h4>
                <p>Try increasing the search radius or changing the facility type.</p>
              </div>
            ) : (
              <div className="facilities-scroll">
                {clinics.map((clinic, index) => (
                  <div key={clinic._id} className="facility-card">
                    <div className="facility-header">
                      <div className="facility-info">
                        <h4 className="facility-name">{clinic.name}</h4>
                        <div className="facility-meta">
                          <span className="facility-type">{clinic.type.replace('_', ' ')}</span>
                          <span className="facility-distance">{formatDistance(clinic.distance)}</span>
                          {clinic.rating > 0 && (
                            <span className="facility-rating">
                              {'⭐'.repeat(Math.floor(clinic.rating))} ({clinic.rating})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="facility-rank">#{index + 1}</div>
                    </div>
                    
                    {clinic.address && (
                      <div className="facility-address">
                        📍 {clinic.address.street}
                      </div>
                    )}
                    
                    {clinic.contact?.phone && (
                      <div className="facility-contact">
                        📞 {clinic.contact.phone}
                      </div>
                    )}

                    <div className="facility-actions">
                      <button
                        className="action-btn directions-btn"
                        onClick={() => getDirections(clinic)}
                      >
                        🗺️ Directions
                      </button>
                      {clinic.contact?.phone && (
                        <button
                          className="action-btn call-btn"
                          onClick={() => window.open(`tel:${clinic.contact.phone}`)}
                        >
                          📞 Call
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enhanced Legend */}
      <div className="map-legend">
        <h4>🗺️ Map Legend</h4>
        <div className="legend-grid">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#dc3545' }}></div>
            <span className="legend-label">🏥 Hospitals</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#007bff' }}></div>
            <span className="legend-label">👨‍⚕️ Clinics</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#28a745' }}></div>
            <span className="legend-label">⚕️ Health Centers</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#ffc107' }}></div>
            <span className="legend-label">💊 Pharmacies</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#4285f4' }}></div>
            <span className="legend-label">📍 Your Location</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthcareMap;