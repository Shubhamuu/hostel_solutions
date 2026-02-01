import React from "react";
import {
  Home,
  MapPin,
  User,
  ChevronRight,
  Phone,
  Mail
} from "lucide-react";
import { useNavigate } from "react-router";

import NavBar from "../../components/common/navbar";
import { useFetch } from "../../hooks/useFetch";

export default function Landing() {
  const navigate = useNavigate();

  // FETCH HOSTELS
  const { data, loading } = useFetch("/hostels");
  // Ensure hostels array exists
  const hostels = Array.isArray(data?.data) ? data.data : [];

  const handleViewRooms = (hostelId) => {
    navigate(`/rooms/${hostelId}`);
  };

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white">
      <NavBar />

      {/* HERO */}
      <header className="py-24 text-center px-6">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6">
           Your Perfect
          <span className="block bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
             Hostels
          </span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Choose from verified hostels with safe environments, healthy food, and
          student-friendly facilities.
        </p>
      </header>

      {/* HOSTELS */}
      <section className="pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-10">
            <Home className="text-amber-400 w-7 h-7" />
            <h2 className="text-3xl font-bold">Available Hostels</h2>
          </div>

          {loading ? (
            <p className="text-gray-500">Loading hostels...</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hostels.map((hostel) => (
                <div
                  key={hostel._id}
                  className="bg-[#1C1F2A] border border-gray-800 rounded-2xl overflow-hidden hover:border-amber-500/40 transition flex flex-col"
                >
                  {/* Image Display */}
                  <div className="h-48 w-full bg-gray-900 relative flex items-center justify-center">
                    {hostel.images && hostel.images.length > 0 ? (
                      <img
                        src={hostel.images[0].url}
                        alt={hostel.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-500 text-sm">
                        No images available
                      </span>
                    )}
                  </div>

                  <div className="p-6 flex flex-col flex-1">
                    <h3 className="text-xl font-semibold mb-2">
                      {hostel.name}
                    </h3>

                    <p className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <MapPin className="w-4 h-4" />
                      {hostel.address}
                    </p>

                    <p className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                      <User className="w-4 h-4" />
                      Managed by {hostel.adminId?.name}
                    </p>
                    <p className="flex items-center gap-2 text-gray-500 text-sm mb-6">
                      <Mail className="w-4 h-4" />
                       {hostel.adminId?.email}
                    </p>

                    <button
                      onClick={() => handleViewRooms(hostel._id)}
                      className="mt-auto w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold hover:scale-[1.02] transition"
                    >
                      View Available Rooms
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-[#151821] to-black text-center">
        <h2 className="text-4xl font-bold mb-4">Need Help Choosing?</h2>
        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
          Our team will guide you to the right hostel based on your budget and preferences.
        </p>

        <a
          href="#contact"
          className="inline-flex items-center gap-3 px-10 py-4 bg-amber-500 text-black font-bold rounded-xl hover:scale-105 transition"
        >
          <Phone className="w-5 h-5" />
          Contact Support
        </a>
      </section>
    </div>
  );
}
