// components/UpdateHostelMap.jsx
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiprivate } from "../../services/api";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

/* =========================
   FIX LEAFLET ICON ISSUE
========================= */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function UpdateHostelMap() {
  const [name, setName] = useState("");
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /* =========================
     FETCH HOSTEL
  ========================= */
  useEffect(() => {
    const fetchHostel = async () => {
      try {
        const res = await apiprivate.get("/hostels/getHostel");
        const hostel = res.data?.data;

        setName(hostel.name || "");

        if (
          hostel?.location?.coordinates &&
          hostel.location.coordinates.length === 2
        ) {
          setLocation(hostel.location);
        } else {
          getCurrentLocation();
        }
      } catch {
        toast.error("Failed to load hostel");
        getCurrentLocation();
      } finally {
        setLoading(false);
      }
    };

    fetchHostel();
  }, []);

  /* =========================
     GPS FALLBACK
  ========================= */
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          type: "Point",
          coordinates: [pos.coords.longitude, pos.coords.latitude],
        });
      },
      () => toast.error("Location access denied"),
      { enableHighAccuracy: true }
    );
  };

  /* =========================
     MAP CLICK HANDLER
  ========================= */
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

  /* =========================
     SAVE NAME + LOCATION
  ========================= */
  const handleSave = async () => {
    if (!name.trim()) {
      return toast.error("Hostel name is required");
    }

    if (!location?.coordinates) {
      return toast.error("Location not selected");
    }

    try {
      setSaving(true);

      await apiprivate.put("/hostels/update", {
       
        location: {
          type: "Point",
          coordinates: [
            Number(location.coordinates[0]),
            Number(location.coordinates[1]),
          ],
        },
      });

      toast.success("Hostel updated successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     LOADING
  ========================= */
  if (loading || !location) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-400">
        Loading hostel…
      </div>
    );
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <ToastContainer theme="dark" />

      <div className="max-w-4xl mx-auto space-y-6">

        

        {/* MAP */}
        <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800">
          <h2 className="text-xl font-bold text-blue-400 mb-2">
            Hostel Location
          </h2>
          <p className="text-gray-400 mb-4">
            Click on the map to change location
          </p>

          <div className="h-80 rounded-xl overflow-hidden border border-gray-700">
            <MapContainer
              center={[
                location.coordinates[1],
                location.coordinates[0],
              ]}
              zoom={15}
              className="h-full w-full"
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <LocationMarker />
            </MapContainer>
          </div>

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

        {/* SAVE */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl font-semibold text-lg disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
