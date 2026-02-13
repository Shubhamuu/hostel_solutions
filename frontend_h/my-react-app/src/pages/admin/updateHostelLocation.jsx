import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiprivate } from "../../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function HostelLocation() {
  const [location, setLocation] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ============================
     1️⃣ GET USER CURRENT LOCATION
     ============================ */
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          type: "Point",
          coordinates: [
            position.coords.longitude,
            position.coords.latitude,
          ],
        });
      },
      () => {
        toast.error("Location access denied. Enable GPS.");
      },
      { enableHighAccuracy: true }
    );
  }, []);

  /* ============================
     2️⃣ MAP CLICK HANDLER
     ============================ */
  const LocationMarker = () => {
    useMapEvents({
      click(e) {
        setLocation({
          type: "Point",
          coordinates: [e.latlng.lng, e.latlng.lat],
        });
      },
    });

    if (!location) return null;

    return (
      <Marker
        position={[
          location.coordinates[1],
          location.coordinates[0],
        ]}
      />
    );
  };

  /* ============================
     3️⃣ SAVE LOCATION TO BACKEND
     ============================ */
  const handleSaveLocation = async () => {
    if (!location) return toast.error("Location not selected");

    try {
      setSaving(true);

      await apiprivate.put("/hostels/update", {
        location,
      });

      toast.success("Hostel location updated successfully!");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to update location"
      );
    } finally {
      setSaving(false);
    }
  };

  if (!location) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        Fetching your location…
      </div>
    );
  }

  /* ============================
     4️⃣ UI
     ============================ */
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <ToastContainer theme="dark" />

      <div className="max-w-5xl mx-auto space-y-6">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold text-blue-400">
            Hostel Location
          </h1>
          <p className="text-gray-400">
            We detected your current location. Click the map to adjust it.
          </p>
        </div>

        {/* MAP */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 shadow-lg">
          <div className="h-80 rounded-xl overflow-hidden border border-gray-700">
            <MapContainer
              center={[
                location.coordinates[1],
                location.coordinates[0],
              ]}
              zoom={15}
              className="h-full w-full"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker />
            </MapContainer>
          </div>

          {/* COORDINATES */}
          <div className="flex justify-between mt-3 text-sm text-gray-400">
            <span>
              Longitude:
              <span className="text-blue-400 ml-1">
                {location.coordinates[0].toFixed(6)}
              </span>
            </span>
            <span>
              Latitude:
              <span className="text-blue-400 ml-1">
                {location.coordinates[1].toFixed(6)}
              </span>
            </span>
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button
          onClick={handleSaveLocation}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 transition py-3 rounded-xl font-semibold text-lg disabled:opacity-50"
        >
          {saving ? "Saving Location..." : "Save Location"}
        </button>
      </div>
    </div>
  );
}
