import { useEffect, useState, useMemo } from "react";
import { apiprivate } from "../../services/api";
import {
  CheckCircle,
  XCircle,
  Trash2,
  FileText,
  Loader2,
  Eye,
  Search,
  Download,
  Calendar,
  UserCheck,
  UserX,
  Clock,
  Building,
  ChevronDown,
  ChevronUp,
  Shield,
  RefreshCw,
  AlertCircle,
  CheckSquare,
  XSquare,
  Users,
  FileCheck,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedAdmin, setExpandedAdmin] = useState(null);

  /* ================= FETCH ADMINS ================= */
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await apiprivate.get("/users/Admins");
      setAdmins(res.data);
    } catch (err) {
      console.error("Failed to load admins", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  /* ================= FILTER ADMINS ================= */
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      const matchesSearch = 
        admin.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        admin.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "ALL" || 
        admin.approvalStatus === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [admins, searchTerm, statusFilter]);

  /* ================= STATUS COUNTS ================= */
  const statusCounts = useMemo(() => {
    return admins.reduce(
      (acc, admin) => {
        acc[admin.approvalStatus] = (acc[admin.approvalStatus] || 0) + 1;
        acc.ALL++;
        return acc;
      },
      { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 }
    );
  }, [admins]);

  /* ================= ACTIONS ================= */
  const approveAdmin = async (adminId) => {
    try {
      setActionLoading(`approve-${adminId}`);
      await apiprivate.post("/users/admin/approve", { adminId });
      
      setAdmins((prev) =>
        prev.map((a) =>
          a._id === adminId
            ? { ...a, approvalStatus: "APPROVED" }
            : a
        )
      );
    } catch (err) {
      console.error("Approval failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const rejectAdmin = async (adminId) => {
    try {
      setActionLoading(`reject-${adminId}`);
      await apiprivate.post("/users/admin/reject", { adminId });

      setAdmins((prev) =>
        prev.map((a) =>
          a._id === adminId
            ? { ...a, approvalStatus: "REJECTED" }
            : a
        )
      );
    } catch (err) {
      console.error("Rejection failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  const deleteAdmin = async (adminId) => {
    try {
      setActionLoading(`delete-${adminId}`);
      await apiprivate.delete(`/user/admin/${adminId}`);
      setAdmins((prev) => prev.filter((a) => a._id !== adminId));
    } catch (err) {
      console.error("Delete failed", err);
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= FORMAT DATE ================= */
  const formatDate = (dateString) => {
    if (!dateString) return "Not available";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ================= LOADING STATE ================= */
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] via-[#111827] to-[#0B0D10] flex items-center justify-center p-4">
        <div className="bg-gray-900/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-800 shadow-2xl flex flex-col items-center">
          <Loader2 className="animate-spin text-amber-400 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-white">Loading Admin Applications</h2>
          <p className="text-gray-400 mt-2">Fetching data from server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0D10] via-[#111827] to-[#0B0D10] px-4 py-8 sm:px-6 lg:px-8 text-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl">
                <Shield className="text-white" size={24} />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                Admin Applications
              </h1>
            </div>
            <p className="text-gray-400">Review and manage hostel admin applications</p>
          </div>
          
          <button
            onClick={fetchAdmins}
            className="mt-4 md:mt-0 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl hover:from-amber-700 hover:to-orange-700 transition-all duration-300 flex items-center gap-2 group"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform"} />
            Refresh Data
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-blue-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Applications</p>
                <p className="text-2xl font-bold text-white mt-1">{statusCounts.ALL}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
                <Users size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-yellow-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending Review</p>
                <p className="text-2xl font-bold text-white mt-1">{statusCounts.PENDING}</p>
              </div>
              <div className="p-3 rounded-xl bg-yellow-500/20 text-yellow-400">
                <Clock size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-green-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Approved</p>
                <p className="text-2xl font-bold text-white mt-1">{statusCounts.APPROVED}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500/20 text-green-400">
                <CheckCircle size={24} />
              </div>
            </div>
          </div>
          
          <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl p-6 border border-gray-800 hover:border-red-500/30 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Rejected</p>
                <p className="text-2xl font-bold text-white mt-1">{statusCounts.REJECTED}</p>
              </div>
              <div className="p-3 rounded-xl bg-red-500/20 text-red-400">
                <UserX size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Filters Card */}
        <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl focus:ring-2 focus:ring-amber-500/50 focus:border-transparent text-white placeholder-gray-400"
                />
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                    statusFilter === status
                      ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg"
                      : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-400 flex items-center gap-2">
            <FileCheck size={16} />
            Showing {filteredAdmins.length} of {admins.length} applications
          </div>
        </div>

        {/* Admins List */}
        <div className="space-y-4">
          {filteredAdmins.length === 0 ? (
            <div className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800 p-12 text-center">
              <AlertCircle className="mx-auto text-gray-500 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-300">No applications found</h3>
              <p className="text-gray-500 mt-2">
                {searchTerm || statusFilter !== "ALL"
                  ? "Try adjusting your search or filter criteria"
                  : "No admin applications to display"}
              </p>
            </div>
          ) : (
            filteredAdmins.map((admin) => (
              <div
                key={admin._id}
                className="bg-gray-900/40 backdrop-blur-sm rounded-2xl border border-gray-800 overflow-hidden hover:border-amber-500/30 transition-all duration-300 group"
              >
                {/* Admin Summary */}
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20">
                        <Building className="text-amber-400" size={24} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">{admin.name}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              admin.approvalStatus === "APPROVED"
                                ? "bg-green-500/10 text-green-300 border-green-500/30"
                                : admin.approvalStatus === "REJECTED"
                                ? "bg-red-500/10 text-red-300 border-red-500/30"
                                : "bg-yellow-500/10 text-yellow-300 border-yellow-500/30"
                            }`}
                          >
                            {admin.approvalStatus || "PENDING"}
                          </span>
                        </div>
                        <p className="text-gray-300">{admin.email}</p>
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-400">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} />
                            Applied: {formatDate(admin.createdAt)}
                          </div>
                          {admin.managedHostelId && (
                            <div className="flex items-center gap-2">
                              <Building size={14} />
                              Hostel: {admin.managedHostelId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {admin.approvalStatus !== "APPROVED" && (
                        <>
                          <button
                            onClick={() => approveAdmin(admin._id)}
                            disabled={actionLoading === `approve-${admin._id}`}
                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                          >
                            {actionLoading === `approve-${admin._id}` ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckSquare size={16} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => rejectAdmin(admin._id)}
                            disabled={actionLoading === `reject-${admin._id}`}
                            className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl hover:from-red-700 hover:to-rose-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                          >
                            {actionLoading === `reject-${admin._id}` ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <XSquare size={16} />
                            )}
                            Reject
                          </button>
                        </>
                      )}
                      
                      {admin.approvalStatus === "APPROVED" && (
                        <button
                          onClick={() => deleteAdmin(admin._id)}
                          disabled={actionLoading === `delete-${admin._id}`}
                          className="px-4 py-2 bg-gradient-to-r from-gray-700 to-gray-800 text-white rounded-xl hover:from-gray-800 hover:to-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 group"
                        >
                          {actionLoading === `delete-${admin._id}` ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                          Delete
                        </button>
                      )}
                      
                      <button
                        onClick={() => setExpandedAdmin(expandedAdmin === admin._id ? null : admin._id)}
                        className="p-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-xl transition-all duration-300 group"
                      >
                        {expandedAdmin === admin._id ? (
                          <ChevronUp size={20} className="text-gray-300 group-hover:text-white" />
                        ) : (
                          <ChevronDown size={20} className="text-gray-300 group-hover:text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedAdmin === admin._id && (
                  <div className="border-t border-gray-800 p-6 bg-gradient-to-r from-gray-900/30 to-gray-800/10">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Documents Section */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <FileText size={20} className="text-amber-400" />
                          <h4 className="font-semibold text-white">Verification Documents</h4>
                        </div>
                        {admin.verificationDocuments?.length > 0 ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {admin.verificationDocuments.map((doc, i) => (
                              <div
                                key={i}
                                className="relative group bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden hover:border-amber-500/50 transition-all duration-300"
                              >
                                <div className="relative h-40 overflow-hidden">
                                  <img
                                    src={doc.url}
                                    alt={`Document ${i + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      e.target.src = "https://via.placeholder.com/400x200/1a1a1a/666666?text=Document";
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <div className="p-4">
                                  <p className="text-sm text-gray-300 font-medium mb-2">
                                    {doc.type || "Verification Document"}
                                  </p>
                                  <div className="flex justify-between items-center">
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-sm text-amber-400 hover:text-amber-300 flex items-center gap-2 group/view"
                                    >
                                      <Eye size={14} />
                                      View Full
                                    </a>
                                    <a
                                      href={doc.url}
                                      download
                                      className="text-sm text-gray-400 hover:text-white flex items-center gap-2 group/download"
                                    >
                                      <Download size={14} />
                                      Download
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500 bg-gray-800/30 rounded-xl">
                            No verification documents uploaded
                          </div>
                        )}
                      </div>

                      {/* Admin Details */}
                      <div>
                        <h4 className="font-semibold text-white mb-4">Admin Details</h4>
                        <div className="space-y-4 bg-gray-800/30 rounded-xl p-6">
                          <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                            <span className="text-gray-400">Verification Status</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                              admin.isVerified 
                                ? "bg-green-500/20 text-green-300 border border-green-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                            }`}>
                              {admin.isVerified ? "Verified" : "Not Verified"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                            <span className="text-gray-400">Managed Hostel ID</span>
                            <span className="font-medium text-white font-mono">
                              {admin.managedHostelId || "Not assigned"}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pb-3 border-b border-gray-700">
                            <span className="text-gray-400">Account Created</span>
                            <span className="font-medium text-white">
                              {formatDate(admin.createdAt)}
                            </span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">Last Updated</span>
                            <span className="font-medium text-white">
                              {formatDate(admin.updatedAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-gray-400 space-y-1">
          <p>• Click on any row to expand and view detailed information</p>
          <p>• Documents can be viewed or downloaded individually</p>
          <p className="mt-4 text-xs text-gray-500">Super Admin Dashboard • {new Date().getFullYear()}</p>
        </div>
      </div>
    </div>
  );
}