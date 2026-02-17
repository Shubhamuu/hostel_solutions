import React, { useState, useEffect } from 'react';
import { apiprivate } from '../../services/api';
import SuperAdminSimpleNavbar from './navbar';
import { FiHome, FiUsers, FiMapPin, FiCheckCircle, FiXCircle, FiClock, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AllHostel = () => {
    const [hostels, setHostels] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, hostel: null });
    const [deletionReason, setDeletionReason] = useState('');
    const [deleting, setDeleting] = useState(false);

    useEffect(() => {
        fetchAllHostels();
    }, []);

    const fetchAllHostels = async () => {
        try {
            setLoading(true);
            const response = await apiprivate.get('/hostels/all-hostels');

            if (response.data.success) {
                setHostels(response.data.data);
            } else {
                setError('Failed to fetch hostels');
                toast.error('Failed to fetch hostels');
            }
        } catch (err) {
            console.error('Error fetching hostels:', err);
            setError(err.response?.data?.message || 'An error occurred');
            toast.error(err.response?.data?.message || 'Failed to fetch hostels');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClick = (hostel) => {
        setDeleteModal({ isOpen: true, hostel });
        setDeletionReason('');
    };

    const handleDeleteConfirm = async () => {
        if (!deletionReason.trim()) {
            toast.error('Please provide a reason for deletion');
            return;
        }

        try {
            setDeleting(true);
            const response = await apiprivate.delete('/hostels/delete-hostel', {
                data: {
                    hostelId: deleteModal.hostel._id,
                    reason: deletionReason
                }
            });

            if (response.data.success) {
                toast.success('Hostel deleted successfully! Email sent to admin.');
                setDeleteModal({ isOpen: false, hostel: null });
                setDeletionReason('');
                fetchAllHostels();
            }
        } catch (err) {
            console.error('Error deleting hostel:', err);
            toast.error(err.response?.data?.message || 'Failed to delete hostel');
        } finally {
            setDeleting(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            APPROVED: { icon: FiCheckCircle, color: 'bg-green-100 text-green-800', text: 'Approved' },
            PENDING: { icon: FiClock, color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
            REJECTED: { icon: FiXCircle, color: 'bg-red-100 text-red-800', text: 'Rejected' }
        };

        const config = statusConfig[status] || statusConfig.PENDING;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <Icon className="w-4 h-4 mr-1" />
                {config.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <SuperAdminSimpleNavbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600 text-lg">Loading hostels...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50">
                <SuperAdminSimpleNavbar />
                <div className="flex items-center justify-center h-screen">
                    <div className="text-center">
                        <FiXCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-red-600 text-xl">{error}</p>
                        <button
                            onClick={fetchAllHostels}
                            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
        <SuperAdminSimpleNavbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-white flex items-center">
                    <FiHome className="mr-3 text-blue-500" />
                    All Hostels
                </h1>
                <p className="mt-2 text-gray-400">
                    Total Hostels:{' '}
                    <span className="font-semibold text-white">
                        {hostels.length}
                    </span>
                </p>
            </div>

            {hostels.length === 0 ? (
                <div className="text-center py-12">
                    <FiHome className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                        No hostels found in the system
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {hostels.map((hostel) => (
                        <div
                            key={hostel._id}
                            className="bg-gray-900 border border-gray-800 rounded-lg shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden"
                        >
                            <div className="relative h-48 bg-gradient-to-r from-blue-700 to-blue-900">
                                {hostel.images && hostel.images.length > 0 ? (
                                    <img
                                        src={hostel.images[0].url}
                                        alt={hostel.name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full">
                                        <FiHome className="w-16 h-16 text-white opacity-30" />
                                    </div>
                                )}

                                <div className="absolute top-3 right-3">
                                    {hostel.isActive ? (
                                        <span className="px-3 py-1 bg-green-600 text-white text-xs font-semibold rounded-full">
                                            Active
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-gray-700 text-white text-xs font-semibold rounded-full">
                                            Inactive
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="p-6">
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {hostel.name}
                                </h3>

                                <div className="flex items-start text-gray-400 mb-3">
                                    <FiMapPin className="w-5 h-5 mr-2 mt-1 flex-shrink-0 text-blue-400" />
                                    <p className="text-sm">
                                        {hostel.address || 'Address not provided'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between mb-4 p-3 bg-blue-900/30 border border-blue-800 rounded-lg">
                                    <div className="flex items-center">
                                        <FiUsers className="w-5 h-5 text-blue-400 mr-2" />
                                        <span className="text-sm font-medium text-gray-300">
                                            Students
                                        </span>
                                    </div>
                                    <span className="text-2xl font-bold text-blue-400">
                                        {hostel.studentCount || 0}
                                    </span>
                                </div>

                                {hostel.adminId && (
                                    <div className="border-t border-gray-800 pt-4 mt-4">
                                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
                                            Admin Details
                                        </p>
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-white">
                                                {hostel.adminId.name}
                                            </p>
                                            <p className="text-sm text-gray-400">
                                                {hostel.adminId.email}
                                            </p>
                                            <div className="mt-2">
                                                {getStatusBadge(
                                                    hostel.adminId.approvalStatus
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleDeleteClick(hostel)}
                                    className="mt-4 w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition font-medium"
                                >
                                    <FiTrash2 className="w-4 h-4 mr-2" />
                                    Delete Hostel
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>

        {deleteModal.isOpen && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl text-gray-100">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-900/30 rounded-full mb-4">
                        <FiAlertTriangle className="w-6 h-6 text-red-500" />
                    </div>

                    <h3 className="text-xl font-bold text-white text-center mb-2">
                        Delete Hostel
                    </h3>

                    <p className="text-gray-400 text-center mb-4">
                        You are about to delete{' '}
                        <strong className="text-white">
                            {deleteModal.hostel?.name}
                        </strong>
                    </p>

                    <div className="bg-yellow-900/30 border-l-4 border-yellow-600 p-3 mb-4">
                        <p className="text-sm text-yellow-300 font-semibold">
                            Warning:
                        </p>
                        <ul className="list-disc list-inside text-sm text-yellow-300 mt-1">
                            <li>The hostel and all its rooms</li>
                            <li>The admin account</li>
                            <li>All associated students</li>
                        </ul>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Reason for Deletion{' '}
                            <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={deletionReason}
                            onChange={(e) =>
                                setDeletionReason(e.target.value)
                            }
                            placeholder="Enter reason for deleting this hostel..."
                            rows="4"
                            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                            disabled={deleting}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            This reason will be sent to the admin via email
                        </p>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={() => {
                                setDeleteModal({
                                    isOpen: false,
                                    hostel: null,
                                });
                                setDeletionReason('');
                            }}
                            className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition font-medium"
                            disabled={deleting}
                        >
                            Cancel
                        </button>

                        <button
                            onClick={handleDeleteConfirm}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 transition font-medium disabled:bg-red-400 disabled:cursor-not-allowed"
                            disabled={deleting || !deletionReason.trim()}
                        >
                            {deleting ? 'Deleting...' : 'Delete Hostel'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
);

};

export default AllHostel;
