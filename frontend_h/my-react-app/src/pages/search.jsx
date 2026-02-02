import React, { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { MapPin, Search, ChevronRight } from "lucide-react";
import NavBar from "../components/common/navbar";
import { useFetch } from "../hooks/useFetch";

const normalize = (text = "") =>
  text
    .toLowerCase()
    .replace(/,/g, "")
    .split(/\s+/);

const SearchPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const query = params.get("q") || "";
  const searchTokens = normalize(query);

  const { data, loading } = useFetch("/hostels");
  const hostels = Array.isArray(data?.data) ? data.data : [];

  const filteredHostels = useMemo(() => {
    if (!query) return [];

    return hostels.filter((hostel) => {
      const addressTokens = normalize(hostel.address);
      const nameTokens = normalize(hostel.name);

      return searchTokens.some((token) =>
        addressTokens.includes(token) ||
        nameTokens.includes(token)
      );
    });
  }, [hostels, searchTokens, query]);

  return (
    <div className="min-h-screen bg-[#0B0D10] text-white">
      <NavBar />

      <header className="py-14 text-center">
        <h1 className="text-3xl font-bold mb-2">Search Results</h1>
        <p className="text-gray-400">
          Results for{" "}
          <span className="text-amber-400 font-semibold">
            "{query}"
          </span>
        </p>
      </header>

      <section className="pb-24">
        <div className="max-w-5xl mx-auto px-6">
          {loading ? (
            <p className="text-gray-500">Searching hostels...</p>
          ) : filteredHostels.length === 0 ? (
            <p className="text-gray-500">
              No hostels found for "{query}"
            </p>
          ) : (
            <div className="space-y-4">
              {filteredHostels.map((hostel) => (
                <div
                  key={hostel._id}
                  className="bg-[#1C1F2A] border border-gray-800 rounded-xl p-5 flex items-center justify-between hover:border-amber-500/40 transition"
                >
                  <div>
                    <h3 className="text-lg font-semibold">
                      {hostel.name}
                    </h3>
                    <p className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="w-4 h-4" />
                      {hostel.address}
                    </p>
                  </div>

                  <button
                    onClick={() => navigate(`/rooms/${hostel._id}`)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold"
                  >
                    View Rooms
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default SearchPage;
