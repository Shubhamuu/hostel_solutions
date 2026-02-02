import React from "react";
import {
  Home,
  MapPin,
  User,
  Mail,
  Phone,
  Building,
  Image as ImageIcon,
  ChevronRight
} from "lucide-react";
import { useNavigate } from "react-router";
import NavBar from "../../components/common/navbar";
import { useFetch } from "../../hooks/useFetch";

const HostelDetails= () => {
  const navigate = useNavigate();

  const { data, loading } = useFetch("/hostels");
  const hostels = Array.isArray(data?.data) ? data.data : [];

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white">
      <NavBar />

      {/* HEADER */}
      <header className="py-16 px-6 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
          All Available Hostels
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Browse complete hostel details including management, contact info,
          location, and facilities.
        </p>
      </header>

      {/* CONTENT */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-8">
            <Home className="text-amber-400 w-7 h-7" />
            <h2 className="text-2xl font-bold">Hostel Listings</h2>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading hostels...</p>
          ) : hostels.length === 0 ? (
            <p className="text-gray-500">No hostels available</p>
          ) : (
            <div className="space-y-6">
              {hostels.map((hostel) => (
                <div
                  key={hostel._id}
                  className="bg-[#1C1F2A] border border-gray-800 rounded-2xl p-6 hover:border-amber-500/40 transition"
                >
                  <div className="grid md:grid-cols-3 gap-6">
                    
                    {/* IMAGE */}
                    <div className="h-48 bg-gray-900 rounded-xl overflow-hidden flex items-center justify-center">
                      {hostel.images?.length > 0 ? (
                        <img
                          src={hostel.images[0].url}
                          alt={hostel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center text-gray-500">
                          <ImageIcon className="w-8 h-8 mb-2" />
                          No Image
                        </div>
                      )}
                    </div>

                    {/* DETAILS */}
                    <div className="md:col-span-2 flex flex-col">
                      <h3 className="text-2xl font-semibold mb-2">
                        {hostel.name}
                      </h3>

                      <p className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                        <MapPin className="w-4 h-4" />
                        {hostel.address}
                      </p>

                      <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-400 mb-4">
                        <p className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Admin: {hostel.adminId?.name || "N/A"}
                        </p>

                        <p className="flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          {hostel.adminId?.email || "N/A"}
                        </p>

                        {hostel.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            {hostel.phone}
                          </p>
                        )}

                        {hostel.type && (
                          <p className="flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Type: {hostel.type}
                          </p>
                        )}
                      </div>

                      {hostel.description && (
                        <p className="text-gray-500 text-sm mb-4">
                          {hostel.description}
                        </p>
                      )}

                      <button
                        onClick={() => navigate(`/rooms/${hostel._id}`)}
                        className="mt-auto self-start flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold hover:scale-[1.02] transition"
                      >
                        View Rooms
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default HostelDetails;
