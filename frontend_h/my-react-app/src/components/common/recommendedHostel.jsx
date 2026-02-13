import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { MapPin, X, Navigation, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-react";

const HostelFinder = () => {
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [selectedHostel, setSelectedHostel] = useState(null);
  const [mapZoom, setMapZoom] = useState(15);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const navigate = useNavigate();

  // Function to find nearby hostels
  const findNearbyHostels = () => {
    setLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `http://localhost:5000/api/hostels/nearby?lat=${latitude}&lng=${longitude}`
          );
          const data = await response.json();
          
          if (data.success) {
            setHostels(Array.isArray(data.data) ? data.data : []);
            console.log(`Found ${data.count} hostels nearby`);
          } else {
            console.error("API Error:", data.message);
            setHostels([]);
          }
        } catch (error) {
          console.error("Error fetching data", error);
          setHostels([]);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        alert("Location access denied. Please enable GPS to find hostels near you.");
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    findNearbyHostels();
  }, []);

  const handleZoomIn = () => {
    setMapZoom((prev) => Math.min(prev + 1, 20));
  };

  const handleZoomOut = () => {
    setMapZoom((prev) => Math.max(prev - 1, 10));
  };

  const toggleMapSize = () => {
    setIsMapExpanded(!isMapExpanded);
  };

  // Helper function to safely get coordinates
  const getCoordinates = (hostel) => {
    if (hostel?.location?.coordinates && Array.isArray(hostel.location.coordinates)) {
      const [lng, lat] = hostel.location.coordinates;
      return { lat, lng, valid: !isNaN(lat) && !isNaN(lng) };
    }
    return { lat: null, lng: null, valid: false };
  };

  return (
    <div className="min-h-screen p-4 sm:p-6 bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 text-white">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-800/50 p-6 rounded-2xl border border-gray-700">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Recommended Hostels
            </h2>
            <p className="text-gray-400 text-sm mt-1">Discover comfortable stays near you</p>
          </div>
          <button 
            onClick={findNearbyHostels}
            disabled={loading}
            className="text-sm bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg font-semibold transition shadow-lg shadow-blue-900/20"
          >
            {loading ? "Refreshing..." : "Refresh Location"}
          </button>
        </header>

        {/* Loading State */}
        {loading ? (
          <div className="flex flex-col items-center py-24 space-y-4 bg-gray-800/30 rounded-2xl border border-gray-700">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500"></div>
              <MapPin className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-blue-400" />
            </div>
            <p className="text-gray-300 font-medium">Scanning your area for hostels...</p>
            <p className="text-gray-500 text-sm">This won't take long</p>
          </div>
        ) : hostels.length === 0 ? (
          <div className="text-center py-24 bg-gray-800/30 rounded-2xl border border-dashed border-gray-600">
            <MapPin className="mx-auto h-16 w-16 text-gray-600 mb-4" />
            <p className="text-gray-300 text-lg font-medium">No hostels found nearby</p>
            <p className="text-gray-500 text-sm mt-2">Try refreshing or check your location settings</p>
          </div>
        ) : (
          <>
            {/* Results Count */}
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Found {hostels.length} {hostels.length === 1 ? 'hostel' : 'hostels'} in your area</span>
            </div>

            {/* Hostel Cards */}
            <div className="grid gap-5">
              {hostels.map((h) => (
                <div
                  key={h._id}
                  className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-2xl overflow-hidden border border-gray-700 hover:border-blue-500/50 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-blue-900/20"
                >
                  <div className="flex flex-col sm:flex-row">
                    {/* Image Section */}
                    <div className="relative sm:w-64 h-56 sm:h-auto">
                      {h.images && h.images.length > 0 ? (
                        <>
                          <img
                            src={h.images[0].url}
                            alt={h.name}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-3 right-3 bg-blue-600/90 backdrop-blur-sm text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {h.distance ? h.distance.toFixed(1) : '0.0'} km
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-800 flex flex-col items-center justify-center text-gray-500">
                          <MapPin className="w-12 h-12 mb-2 opacity-30" />
                          <span className="text-sm">No Image Available</span>
                        </div>
                      )}
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <h3 className="text-2xl font-bold text-transparent bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text leading-tight">
                            {h.name}
                          </h3>
                        </div>
                        
                        <div className="flex items-start gap-2 text-gray-400 mb-4">
                          <MapPin className="w-4 h-4 mt-1 flex-shrink-0 text-blue-400" />
                          <p className="text-sm leading-relaxed">{h.address}</p>
                        </div>

                        {/* Small Map Preview (Optional) */}
                        {getCoordinates(h).valid && (
                          <div className="mb-4 rounded-lg overflow-hidden border border-gray-700 h-32 sm:h-40">
                            <iframe
                              title={`${h.name}-preview`}
                              width="100%"
                              height="100%"
                              className="border-0 pointer-events-none"
                              src={`https://maps.google.com/maps?q=${getCoordinates(h).lat},${getCoordinates(h).lng}&z=14&output=embed`}
                              loading="lazy"
                            ></iframe>
                          </div>
                        )}

                        {/* Additional Info */}
                        {h.description && (
                          <p className="text-gray-400 text-sm line-clamp-2 mb-4">
                            {h.description}
                          </p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3 mt-4">
                        <button
                          onClick={() => navigate(`/rooms/${h._id}`)}
                          className="flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-bold rounded-xl transition-all duration-300 shadow-lg hover:shadow-amber-500/20 hover:scale-105"
                        >
                          View Rooms
                        </button>

                        {getCoordinates(h).valid && (
                          <button
                            onClick={() => {
                              setSelectedHostel(h);
                              setShowMap(true);
                              setMapZoom(15);
                              setIsMapExpanded(false);
                            }}
                            className="flex-1 sm:flex-none px-6 py-3 bg-gray-700/80 hover:bg-gray-600 text-white font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 border border-gray-600 hover:border-blue-500"
                          >
                            <MapPin className="w-4 h-4" /> 
                            Show Map
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Enhanced Map Overlay */}
        {showMap && selectedHostel && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fade-in">
            <div className={`bg-gray-900 rounded-3xl overflow-hidden shadow-2xl border border-gray-700 transition-all duration-300 ${
              isMapExpanded ? 'w-full h-full max-w-none' : 'w-full max-w-4xl'
            }`}>
              {/* Map Header */}
              <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gradient-to-r from-gray-900 to-gray-800">
                <div className="flex-1">
                  <h3 className="text-xl sm:text-2xl font-bold text-transparent bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text">
                    {selectedHostel.name}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 flex items-center gap-2">
                    <MapPin className="w-3 h-3" />
                    {selectedHostel.address}
                  </p>
                </div>
                <button
                  onClick={() => setShowMap(false)}
                  className="p-2 hover:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-gray-400 hover:text-white" />
                </button>
              </div>

              {/* Map Container with Controls */}
              <div className="relative bg-gray-800">
                <div className={`w-full ${isMapExpanded ? 'h-[calc(100vh-180px)]' : 'h-[50vh] sm:h-[500px]'}`}>
                  {(() => {
                    const coords = getCoordinates(selectedHostel);
                    return coords.valid ? (
                      <iframe
                        key={mapZoom} // Force re-render on zoom change
                        title="hostel-map"
                        width="100%"
                        height="100%"
                        className="border-0"
                        src={`https://maps.google.com/maps?q=${coords.lat},${coords.lng}&z=${mapZoom}&output=embed`}
                        allowFullScreen
                        loading="lazy"
                      ></iframe>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-500 bg-gray-800">
                        <MapPin className="w-16 h-16 mb-4 opacity-30" />
                        <p className="text-lg">Coordinates not available for this hostel</p>
                        <p className="text-sm text-gray-600 mt-2">Unable to display map location</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Map Controls - Positioned over the map */}
                {getCoordinates(selectedHostel).valid && (
                  <div className="absolute top-4 right-4 flex flex-col gap-2">
                    {/* Zoom Controls */}
                    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden shadow-xl">
                      <button
                        onClick={handleZoomIn}
                        disabled={mapZoom >= 20}
                        className="p-3 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border-b border-gray-700"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-5 h-5" />
                      </button>
                      <div className="px-3 py-2 text-center text-sm font-mono bg-gray-800 border-b border-gray-700">
                        {mapZoom}
                      </div>
                      <button
                        onClick={handleZoomOut}
                        disabled={mapZoom <= 10}
                        className="p-3 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Expand/Collapse Control */}
                    <button
                      onClick={toggleMapSize}
                      className="p-3 bg-gray-900/90 backdrop-blur-sm hover:bg-blue-600 rounded-lg border border-gray-700 transition-colors shadow-xl"
                      title={isMapExpanded ? "Minimize Map" : "Maximize Map"}
                    >
                      {isMapExpanded ? (
                        <Minimize2 className="w-5 h-5" />
                      ) : (
                        <Maximize2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Map Footer */}
              <div className="p-5 bg-gray-900 border-t border-gray-800">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="hidden sm:flex items-center gap-2 bg-gray-800 px-3 py-1.5 rounded-lg">
                      <span className="text-blue-400">💡</span>
                      <span>Use zoom controls to adjust map view</span>
                    </div>
                    <span className="bg-gray-800 px-3 py-1.5 rounded-lg">
                      {selectedHostel.distance ? selectedHostel.distance.toFixed(1) : '0.0'} km away
                    </span>
                  </div>
                  
                  <div className="flex gap-3 w-full sm:w-auto">
                    {(() => {
                      const coords = getCoordinates(selectedHostel);
                      return coords.valid ? (
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 sm:flex-none px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-blue-500/20"
                        >
                          <Navigation className="w-4 h-4" /> 
                          Get Directions
                        </a>
                      ) : null;
                    })()}
                    <button
                      onClick={() => setShowMap(false)}
                      className="flex-1 sm:flex-none px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl font-semibold transition-all duration-300 border border-gray-700"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HostelFinder;