import { useEffect, useState } from "react";
import { apiprivate } from "../../services/api";
import {
  CheckCircle,
  XCircle,
  Trash2,
  FileText,
  Loader2,
} from "lucide-react";

export default function SuperAdminDashboard() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

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

  /* ================= APPROVE ================= */
  const approveAdmin = async (adminId) => {
    try {
      setActionLoading(adminId);
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
    if (!window.confirm("Reject this admin?")) return;

    try {
      setActionLoading(adminId);
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

  /* ================= DELETE (OPTIONAL) ================= */
  const deleteAdmin = async (adminId) => {
    if (!window.confirm("Delete this admin permanently?")) return;

    try {
      setActionLoading(adminId);
      await apiprivate.delete(`/user/admin/${adminId}`);
      setAdmins((prev) => prev.filter((a) => a._id !== adminId));
    } catch (err) {
      alert("Delete failed");
    } finally {
      setActionLoading(null);
    }
  };

  /* ================= UI ================= */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Super Admin Dashboard – Admin Approvals
      </h1>

      <div className="overflow-x-auto bg-white shadow rounded-xl">
        <table className="w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Email</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center">Documents</th>
              <th className="p-3 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {admins.map((admin) => (
              <tr key={admin._id} className="border-t">
                <td className="p-3">{admin.name}</td>
                <td className="p-3">{admin.email}</td>

                {/* STATUS */}
                <td className="p-3 text-center">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold
                      ${
                        admin.approvalStatus === "APPROVED"
                          ? "bg-green-100 text-green-700"
                          : admin.approvalStatus === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                  >
                    {admin.approvalStatus || "PENDING"}
                  </span>
                </td>

                {/* DOCUMENTS */}
                <td className="p-3 text-center">
                  {admin.verificationDocuments?.length > 0 ? (
                    admin.verificationDocuments.map((doc, i) => (
                      <a
                        key={i}
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:underline mr-2"
                      >
                        <FileText size={16} />
                        Doc
                      </a>
                    ))
                  ) : (
                    <span className="text-gray-400">None</span>
                  )}
                </td>

                {/* ACTIONS */}
                <td className="p-3 text-center space-x-2">
                  {admin.approvalStatus !== "APPROVED" && (
                    <>
                      <button
                        onClick={() => approveAdmin(admin._id)}
                        disabled={actionLoading === admin._id}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <CheckCircle size={16} />
                      </button>

                      <button
                        onClick={() => rejectAdmin(admin._id)}
                        disabled={actionLoading === admin._id}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        <XCircle size={16} />
                      </button>
                    </>
                  )}

                  {admin.approvalStatus === "APPROVED" && (
                    <button
                      onClick={() => deleteAdmin(admin._id)}
                      disabled={actionLoading === admin._id}
                      className="px-3 py-1 bg-gray-700 text-white rounded hover:bg-black"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
