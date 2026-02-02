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
  Filter,
  Download,
  Calendar,
  UserCheck,
  UserX,
  Clock,
  Building,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [expandedAdmin, setExpandedAdmin] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(null);

  /* ================= FETCH ADMINS ================= */
  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await apiprivate.get("/users/Admins");
      setAdmins(res.data);
    } catch (err) {
      console.error("Failed to load admins", err);
      alert("Failed to load admins. Please try again.");
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

  /* ================= APPROVE ================= */
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
      alert(err?.response?.data?.message || "Approval failed");
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= REJECT ================= */
  const rejectAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to reject this admin application?")) return;

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
      alert(err?.response?.data?.message || "Rejection failed");
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= DELETE ================= */
  const deleteAdmin = async (adminId) => {
    if (!window.confirm("Are you sure you want to delete this admin permanently? This action cannot be undone.")) return;

    try {
      setActionLoading(`delete-${adminId}`);
      await apiprivate.delete(`/user/admin/${adminId}`);
      setAdmins((prev) => prev.filter((a) => a._id !== adminId));
    } catch (err) {
      alert("Delete failed. Please try again.");
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg flex flex-col items-center">
          <Loader2 className="animate-spin text-indigo-600 mb-4" size={48} />
          <h2 className="text-xl font-semibold text-gray-700">Loading Admin Applications</h2>
          <p className="text-gray-500 mt-2">Please wait while we fetch the data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Applications Dashboard</h1>
            <p className="text-gray-600 mt-2">Review and manage hostel admin applications</p>
          </div>
          <button
            onClick={fetchAdmins}
            className="mt-4 md:mt-0 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <Loader2 size={18} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Applications</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.ALL}</p>
              </div>
              <UserCheck className="text-blue-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.PENDING}</p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Approved</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.APPROVED}</p>
              </div>
              <CheckCircle className="text-green-500" size={24} />
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Rejected</p>
                <p className="text-2xl font-bold text-gray-800">{statusCounts.REJECTED}</p>
              </div>
              <UserX className="text-red-500" size={24} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {["ALL", "PENDING", "APPROVED", "REJECTED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    statusFilter === status
                      ? "bg-indigo-100 text-indigo-700 border border-indigo-300"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Showing {filteredAdmins.length} of {admins.length} applications
          </div>
        </div>

        {/* Admins List */}
        <div className="space-y-4">
          {filteredAdmins.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <UserX className="mx-auto text-gray-300 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-700">No applications found</h3>
              <p className="text-gray-500 mt-1">
                {searchTerm || statusFilter !== "ALL"
                  ? "Try adjusting your search or filter"
                  : "No admin applications to display"}
              </p>
            </div>
          ) : (
            filteredAdmins.map((admin) => (
              <div
                key={admin._id}
                className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow"
              >
                {/* Admin Summary */}
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="bg-indigo-100 p-3 rounded-lg">
                        <Building className="text-indigo-600" size={24} />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-800">{admin.name}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold
                              ${
                                admin.approvalStatus === "APPROVED"
                                  ? "bg-green-100 text-green-700 border border-green-200"
                                  : admin.approvalStatus === "REJECTED"
                                  ? "bg-red-100 text-red-700 border border-red-200"
                                  : "bg-yellow-100 text-yellow-700 border border-yellow-200"
                              }`}
                          >
                            {admin.approvalStatus || "PENDING"}
                          </span>
                        </div>
                        <p className="text-gray-600 mt-1">{admin.email}</p>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar size={14} />
                            Applied: {formatDate(admin.createdAt)}
                          </div>
                          {admin.managedHostelId && (
                            <div className="flex items-center gap-1">
                              <Building size={14} />
                              Hostel ID: {admin.managedHostelId.substring(0, 8)}...
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {admin.approvalStatus !== "APPROVED" && (
                        <>
                          <button
                            onClick={() => approveAdmin(admin._id)}
                            disabled={actionLoading === `approve-${admin._id}`}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {actionLoading === `approve-${admin._id}` ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                            Approve
                          </button>
                          <button
                            onClick={() => rejectAdmin(admin._id)}
                            disabled={actionLoading === `reject-${admin._id}`}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            {actionLoading === `reject-${admin._id}` ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <XCircle size={16} />
                            )}
                            Reject
                          </button>
                        </>
                      )}
                      
                      {admin.approvalStatus === "APPROVED" && (
                        <button
                          onClick={() => deleteAdmin(admin._id)}
                          disabled={actionLoading === `delete-${admin._id}`}
                          className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {expandedAdmin === admin._id ? (
                          <ChevronUp size={20} />
                        ) : (
                          <ChevronDown size={20} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedAdmin === admin._id && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Documents Section */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                          <FileText size={18} />
                          Verification Documents
                        </h4>
                        {admin.verificationDocuments?.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {admin.verificationDocuments.map((doc, i) => (
                              <div
                                key={i}
                                className="relative group bg-white rounded-lg border border-gray-300 overflow-hidden hover:shadow-md transition-shadow"
                              >
                                <img
                                  src={doc.url}
                                  alt={`Document ${i + 1}`}
                                  className="w-full h-32 object-cover"
                                  onError={(e) => {
                                    e.target.src = "https://via.placeholder.com/150?text=Document";
                                  }}
                                />
                                <div className="p-2">
                                  <p className="text-xs text-gray-600 truncate">
                                    {doc.type || "Document"}
                                  </p>
                                  <div className="flex justify-between items-center mt-1">
                                    <a
                                      href={doc.url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                                    >
                                      <Eye size={12} />
                                      View
                                    </a>
                                    <a
                                      href={doc.url}
                                      download
                                      className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                                    >
                                      <Download size={12} />
                                      Download
                                    </a>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-400 italic">No documents uploaded</div>
                        )}
                      </div>

                      {/* Admin Details */}
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-3">Admin Details</h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Verification Status:</span>
                            <span className={`font-medium ${
                              admin.isVerified ? "text-green-600" : "text-red-600"
                            }`}>
                              {admin.isVerified ? "Verified" : "Not Verified"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Managed Hostel ID:</span>
                            <span className="font-medium text-gray-800">
                              {admin.managedHostelId || "Not assigned"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Created:</span>
                            <span className="font-medium text-gray-800">
                              {formatDate(admin.createdAt)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Last Updated:</span>
                            <span className="font-medium text-gray-800">
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
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>• Click on any row to expand and view detailed information</p>
          <p className="mt-1">• Documents can be viewed or downloaded individually</p>
        </div>
      </div>
    </div>
  );
}