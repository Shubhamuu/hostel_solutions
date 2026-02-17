import React, { useState, useEffect } from 'react';
import { apiprivate } from '../../services/api';
import SuperAdminSimpleNavbar from './navbar';
import { toast } from 'react-toastify';
import { FiDollarSign, FiChevronDown, FiChevronUp, FiSend, FiUser, FiHome, FiCheckCircle, FiClock, FiAlertTriangle, FiXCircle } from 'react-icons/fi';

const AllFees = () => {
    const [hostelFees, setHostelFees] = useState([]);
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedHostels, setExpandedHostels] = useState({});
    const [disburseModal, setDisburseModal] = useState({ isOpen: false, hostel: null, summary: null });
    const [disbursing, setDisbursing] = useState(false);
    const [activeTab, setActiveTab] = useState('disburse'); // 'disburse' | 'requests'
    const [actionModal, setActionModal] = useState({ isOpen: false, disbursement: null, action: '' });
    const [rejectReason, setRejectReason] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [feesRes, disbursementsRes] = await Promise.all([
                apiprivate.get('/fees/all-fees'),
                apiprivate.get('/disbursements/all')
            ]);

            if (feesRes.data.success) {
                // Filter: only show hostels that have undisbursed Khalti payments
                const filtered = feesRes.data.data.filter(h => h.summary.undisbursedKhaltiCount > 0);
                setHostelFees(filtered);
            }

            if (disbursementsRes.data.success) {
                // Show pending admin requests
                const pending = disbursementsRes.data.data.filter(d => d.status === 'PENDING');
                setPendingRequests(pending);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch data');
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const toggleHostel = (hostelId) => {
        setExpandedHostels(prev => ({
            ...prev,
            [hostelId]: !prev[hostelId]
        }));
    };

    const handleDisburseClick = (hostelGroup) => {
        const serviceFee = Math.round(hostelGroup.summary.undisbursedKhaltiTotal * 0.001 * 100) / 100;
        const netAmount = Math.round((hostelGroup.summary.undisbursedKhaltiTotal - serviceFee) * 100) / 100;
        setDisburseModal({
            isOpen: true,
            hostel: hostelGroup.hostel,
            summary: {
                total: hostelGroup.summary.undisbursedKhaltiTotal,
                serviceFee,
                netAmount,
                feesCount: hostelGroup.summary.undisbursedKhaltiCount
            }
        });
    };

    const handleDisburseConfirm = async () => {
        try {
            setDisbursing(true);
            const response = await apiprivate.post('/disbursements/disburse', {
                hostelId: disburseModal.hostel._id
            });
            if (response.data.success) {
                toast.success('Payment disbursed! Email sent to admin.');
                setDisburseModal({ isOpen: false, hostel: null, summary: null });
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Disbursement failed');
        } finally {
            setDisbursing(false);
        }
    };

    const handleApproveRequest = async (disbursement) => {
        setActionModal({ isOpen: true, disbursement, action: 'approve' });
    };

    const handleRejectRequest = async (disbursement) => {
        setActionModal({ isOpen: true, disbursement, action: 'reject' });
        setRejectReason('');
    };

    const handleActionConfirm = async () => {
        try {
            setProcessing(true);
            const payload = {
                disbursementId: actionModal.disbursement._id,
                status: actionModal.action === 'approve' ? 'COMPLETED' : 'REJECTED',
            };
            if (actionModal.action === 'reject') {
                if (!rejectReason.trim()) {
                    toast.error('Please provide a reason for rejection');
                    return;
                }
                payload.reason = rejectReason;
            }

            const response = await apiprivate.put('/disbursements/update-status', payload);
            if (response.data.success) {
                toast.success(actionModal.action === 'approve'
                    ? 'Request approved! Email sent to admin.'
                    : 'Request rejected.'
                );
                setActionModal({ isOpen: false, disbursement: null, action: '' });
                setRejectReason('');
                fetchData();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Action failed');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-100">
                <SuperAdminSimpleNavbar />
                <div className="flex items-center justify-center h-[80vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 text-gray-100">
                <SuperAdminSimpleNavbar />
                <div className="flex items-center justify-center h-[80vh]">
                    <div className="text-center">
                        <FiAlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                        <p className="text-red-400">{error}</p>
                        <button onClick={fetchData} className="mt-4 px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition">
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
                        <FiDollarSign className="mr-3 text-green-500" />
                        Fees & Disbursements
                    </h1>
                    <p className="mt-2 text-gray-400">
                        Manage Khalti payment disbursements and admin payment requests
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-gray-800 pb-1">
                    <button
                        onClick={() => setActiveTab('disburse')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition ${activeTab === 'disburse'
                            ? 'bg-gray-800 text-white border-b-2 border-green-500'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FiSend className="w-4 h-4" />
                            Disburse Payments
                            {hostelFees.length > 0 && (
                                <span className="px-2 py-0.5 bg-green-900/40 text-green-400 text-xs rounded-full">
                                    {hostelFees.length}
                                </span>
                            )}
                        </div>
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-5 py-2.5 text-sm font-medium rounded-t-lg transition ${activeTab === 'requests'
                            ? 'bg-gray-800 text-white border-b-2 border-amber-500'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                            }`}
                    >
                        <div className="flex items-center gap-2">
                            <FiClock className="w-4 h-4" />
                            Admin Requests
                            {pendingRequests.length > 0 && (
                                <span className="px-2 py-0.5 bg-amber-900/40 text-amber-400 text-xs rounded-full">
                                    {pendingRequests.length}
                                </span>
                            )}
                        </div>
                    </button>
                </div>

                {/* Tab: Disburse Payments */}
                {activeTab === 'disburse' && (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Hostels with Undisbursed</p>
                                <p className="text-2xl font-bold text-blue-400 mt-1">{hostelFees.length}</p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Undisbursed Amount</p>
                                <p className="text-2xl font-bold text-green-400 mt-1">
                                    Rs. {hostelFees.reduce((s, h) => s + h.summary.undisbursedKhaltiTotal, 0).toFixed(2)}
                                </p>
                            </div>
                            <div className="bg-gray-900 border border-gray-800 rounded-lg p-5">
                                <p className="text-xs text-gray-500 uppercase tracking-wide">Total Undisbursed Fees</p>
                                <p className="text-2xl font-bold text-purple-400 mt-1">
                                    {hostelFees.reduce((s, h) => s + h.summary.undisbursedKhaltiCount, 0)}
                                </p>
                            </div>
                        </div>

                        {hostelFees.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-lg">
                                <FiCheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">All payments have been disbursed!</p>
                                <p className="text-gray-600 text-sm mt-1">No Khalti payments pending disbursement</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {hostelFees.map((hostelGroup) => (
                                    <div
                                        key={hostelGroup.hostel._id}
                                        className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden"
                                    >
                                        {/* Hostel Header */}
                                        <div
                                            className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-800/50 transition"
                                            onClick={() => toggleHostel(hostelGroup.hostel._id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-blue-900/30 rounded-lg">
                                                    <FiHome className="w-5 h-5 text-blue-400" />
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-white">
                                                        {hostelGroup.hostel.name}
                                                    </h3>
                                                    <p className="text-sm text-gray-400">
                                                        {hostelGroup.hostel.admin?.name || 'No admin'} • {hostelGroup.summary.undisbursedKhaltiCount} payment(s) to disburse
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="hidden sm:block text-right mr-4">
                                                    <p className="text-xs text-gray-500">Amount to Disburse</p>
                                                    <p className="text-sm font-bold text-green-400">Rs. {hostelGroup.summary.undisbursedKhaltiTotal.toFixed(2)}</p>
                                                </div>

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDisburseClick(hostelGroup);
                                                    }}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
                                                >
                                                    <FiSend className="w-4 h-4" />
                                                    Disburse
                                                </button>

                                                {expandedHostels[hostelGroup.hostel._id]
                                                    ? <FiChevronUp className="w-5 h-5 text-gray-400" />
                                                    : <FiChevronDown className="w-5 h-5 text-gray-400" />
                                                }
                                            </div>
                                        </div>

                                        {/* Expanded: Show only Khalti-paid undisbursed fees */}
                                        {expandedHostels[hostelGroup.hostel._id] && (
                                            <div className="border-t border-gray-800">
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead>
                                                            <tr className="text-gray-500 text-xs uppercase border-b border-gray-800">
                                                                <th className="px-4 py-3 text-left">Student</th>
                                                                <th className="px-4 py-3 text-right">Amount Paid</th>
                                                                <th className="px-4 py-3 text-center">Payment</th>
                                                                <th className="px-4 py-3 text-left">Paid At</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {hostelGroup.fees
                                                                .filter(fee => fee.paymentReference?.includes('khalti') && fee.status === 'PAID' && !fee.isDisbursed)
                                                                .map((fee) => (
                                                                    <tr key={fee._id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition">
                                                                        <td className="px-4 py-3">
                                                                            <div className="flex items-center gap-2">
                                                                                <FiUser className="text-gray-500 w-4 h-4" />
                                                                                <div>
                                                                                    <p className="text-white font-medium">{fee.studentId?.name || 'Unknown'}</p>
                                                                                    <p className="text-xs text-gray-500">{fee.studentId?.email || ''}</p>
                                                                                </div>
                                                                            </div>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-right text-green-400 font-medium">Rs. {fee.amountPaid?.toFixed(2)}</td>
                                                                        <td className="px-4 py-3 text-center">
                                                                            <span className="px-2 py-0.5 text-xs bg-purple-900/40 text-purple-400 border border-purple-700 rounded-full">Khalti</span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-gray-400 text-xs">
                                                                            {fee.paidAt ? new Date(fee.paidAt).toLocaleDateString() : fee.dueDate ? new Date(fee.dueDate).toLocaleDateString() : '—'}
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Tab: Admin Requests */}
                {activeTab === 'requests' && (
                    <>
                        {pendingRequests.length === 0 ? (
                            <div className="text-center py-16 bg-gray-900 border border-gray-800 rounded-lg">
                                <FiClock className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                                <p className="text-gray-400 text-lg">No pending payment requests</p>
                                <p className="text-gray-600 text-sm mt-1">Admin requests will appear here</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {pendingRequests.map((d) => (
                                    <div
                                        key={d._id}
                                        className="bg-gray-900 border border-gray-800 rounded-lg p-5"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="p-2 bg-amber-900/30 rounded-lg">
                                                        <FiHome className="w-4 h-4 text-amber-400" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-bold text-white">{d.hostelId?.name || 'Unknown Hostel'}</h3>
                                                        <p className="text-sm text-gray-400">
                                                            Requested by: {d.adminId?.name || 'Admin'} ({d.adminId?.email || ''})
                                                        </p>
                                                    </div>
                                                    <span className="px-3 py-1 text-xs font-semibold rounded-full border bg-yellow-900/40 text-yellow-400 border-yellow-700">
                                                        Pending
                                                    </span>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2">
                                                    <div>
                                                        <p className="text-xs text-gray-500">Total Collected</p>
                                                        <p className="text-sm font-semibold text-white">Rs. {d.totalCollected.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Service Fee (0.1%)</p>
                                                        <p className="text-sm font-semibold text-red-400">- Rs. {d.serviceFee.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Net to Disburse</p>
                                                        <p className="text-sm font-bold text-green-400">Rs. {d.amountDisbursed.toFixed(2)}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Fees Included</p>
                                                        <p className="text-sm font-semibold text-gray-300">{d.feeIds?.length || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-gray-500">Requested</p>
                                                        <p className="text-sm text-gray-400">{new Date(d.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleApproveRequest(d)}
                                                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition flex items-center gap-2 font-medium"
                                                >
                                                    <FiCheckCircle className="w-4 h-4" />
                                                    Approve
                                                </button>
                                                <button
                                                    onClick={() => handleRejectRequest(d)}
                                                    className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition flex items-center gap-2 font-medium"
                                                >
                                                    <FiXCircle className="w-4 h-4" />
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Disburse Modal */}
            {disburseModal.isOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl text-gray-100">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-green-900/30 rounded-full mb-4">
                            <FiSend className="w-6 h-6 text-green-500" />
                        </div>

                        <h3 className="text-xl font-bold text-white text-center mb-2">
                            Disburse Payment
                        </h3>

                        <p className="text-gray-400 text-center mb-4">
                            Disburse Khalti payments for{' '}
                            <strong className="text-white">{disburseModal.hostel?.name}</strong>
                        </p>

                        <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Total Collected (Khalti)</span>
                                <span className="text-white font-semibold">Rs. {disburseModal.summary?.total.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Service Fee (0.1%)</span>
                                <span className="text-red-400 font-semibold">- Rs. {disburseModal.summary?.serviceFee.toFixed(2)}</span>
                            </div>
                            <hr className="border-gray-700" />
                            <div className="flex justify-between text-base">
                                <span className="text-gray-300 font-semibold">Net Amount</span>
                                <span className="text-green-400 font-bold text-lg">Rs. {disburseModal.summary?.netAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Fees Included</span>
                                <span className="text-blue-400">{disburseModal.summary?.feesCount} payment(s)</span>
                            </div>
                        </div>

                        <p className="text-xs text-gray-500 mb-4 text-center">
                            A bill will be generated and emailed to the admin
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDisburseModal({ isOpen: false, hostel: null, summary: null })}
                                className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition font-medium"
                                disabled={disbursing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDisburseConfirm}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:bg-green-800 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={disbursing}
                            >
                                <FiSend className="w-4 h-4" />
                                {disbursing ? 'Processing...' : 'Disburse'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve/Reject Modal */}
            {actionModal.isOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-lg max-w-md w-full p-6 shadow-2xl text-gray-100">
                        <div className={`flex items-center justify-center w-12 h-12 mx-auto rounded-full mb-4 ${actionModal.action === 'approve' ? 'bg-green-900/30' : 'bg-red-900/30'}`}>
                            {actionModal.action === 'approve'
                                ? <FiCheckCircle className="w-6 h-6 text-green-500" />
                                : <FiXCircle className="w-6 h-6 text-red-500" />
                            }
                        </div>

                        <h3 className="text-xl font-bold text-white text-center mb-2">
                            {actionModal.action === 'approve' ? 'Approve Request' : 'Reject Request'}
                        </h3>

                        <p className="text-gray-400 text-center mb-4 text-sm">
                            {actionModal.action === 'approve'
                                ? `Approve disbursement of Rs. ${actionModal.disbursement?.amountDisbursed.toFixed(2)} to ${actionModal.disbursement?.hostelId?.name}?`
                                : `Reject the payment request from ${actionModal.disbursement?.hostelId?.name}?`
                            }
                        </p>

                        {actionModal.action === 'approve' && (
                            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Total Collected</span>
                                    <span className="text-white font-semibold">Rs. {actionModal.disbursement?.totalCollected.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Service Fee (0.1%)</span>
                                    <span className="text-red-400 font-semibold">- Rs. {actionModal.disbursement?.serviceFee.toFixed(2)}</span>
                                </div>
                                <hr className="border-gray-700" />
                                <div className="flex justify-between text-base">
                                    <span className="text-gray-300 font-semibold">Net to Disburse</span>
                                    <span className="text-green-400 font-bold">Rs. {actionModal.disbursement?.amountDisbursed.toFixed(2)}</span>
                                </div>
                            </div>
                        )}

                        {actionModal.action === 'reject' && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Reason <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={rejectReason}
                                    onChange={(e) => setRejectReason(e.target.value)}
                                    placeholder="Enter reason for rejecting..."
                                    rows="3"
                                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                                    disabled={processing}
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setActionModal({ isOpen: false, disbursement: null, action: '' });
                                    setRejectReason('');
                                }}
                                className="flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition font-medium"
                                disabled={processing}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleActionConfirm}
                                className={`flex-1 px-4 py-2 text-white rounded-lg transition font-medium disabled:cursor-not-allowed flex items-center justify-center gap-2 ${actionModal.action === 'approve'
                                    ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-800'
                                    : 'bg-red-600 hover:bg-red-700 disabled:bg-red-800'
                                    }`}
                                disabled={processing || (actionModal.action === 'reject' && !rejectReason.trim())}
                            >
                                {processing ? 'Processing...' : actionModal.action === 'approve' ? 'Approve & Disburse' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AllFees;
