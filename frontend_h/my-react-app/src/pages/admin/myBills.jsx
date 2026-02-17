import React, { useState, useEffect } from 'react';
import { apiprivate } from '../../services/api';
import AdminNavbar from '../../components/common/adminNavbar';
import { toast } from 'react-toastify';
import { FiDollarSign, FiSend, FiCheckCircle, FiClock, FiXCircle, FiAlertTriangle, FiFileText } from 'react-icons/fi';

const MyBills = () => {
    const [disbursements, setDisbursements] = useState([]);
    const [summary, setSummary] = useState({ totalReceived: 0, totalPending: 0, totalServiceFees: 0, totalDisbursements: 0 });
    const [loading, setLoading] = useState(true);
    const [requesting, setRequesting] = useState(false);
    const [requestModal, setRequestModal] = useState(false);

    useEffect(() => {
        fetchDisbursements();
    }, []);

    const fetchDisbursements = async () => {
        try {
            setLoading(true);
            const response = await apiprivate.get('/disbursements/my-bills');
            if (response.data.success) {
                setDisbursements(response.data.data);
                setSummary(response.data.summary);
            }
        } catch (err) {
            console.error('Fetch disbursements error:', err);
            toast.error('Failed to load bill data');
        } finally {
            setLoading(false);
        }
    };

    const handleRequestPayment = async () => {
        try {
            setRequesting(true);
            const response = await apiprivate.post('/disbursements/request');
            if (response.data.success) {
                toast.success('Payment request submitted successfully!');
                setRequestModal(false);
                fetchDisbursements();
            }
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to submit request');
        } finally {
            setRequesting(false);
        }
    };

    const getStatusBadge = (status) => {
        const config = {
            COMPLETED: { icon: FiCheckCircle, text: 'Completed', style: 'bg-green-900/40 text-green-400 border-green-700' },
            PENDING: { icon: FiClock, text: 'Pending', style: 'bg-yellow-900/40 text-yellow-400 border-yellow-700' },
            REJECTED: { icon: FiXCircle, text: 'Rejected', style: 'bg-red-900/40 text-red-400 border-red-700' }
        };
        const c = config[status] || config.PENDING;
        const Icon = c.icon;
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${c.style}`}>
                <Icon className="w-3 h-3" />
                {c.text}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0B0D10] text-gray-100">
                <AdminNavbar />
                <div className="flex items-center justify-center h-[80vh]">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-400">Loading bills...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0D10] text-gray-100">
            <AdminNavbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            <FiFileText className="mr-3 text-amber-500" />
                            My Bills
                        </h1>
                        <p className="mt-2 text-gray-400">
                            Payment disbursements and transaction history
                        </p>
                    </div>
                    <button
                        onClick={() => setRequestModal(true)}
                        className="px-5 py-2.5 bg-amber-600 text-white rounded-xl hover:bg-amber-700 transition flex items-center gap-2 font-medium shadow-lg shadow-amber-900/20"
                    >
                        <FiSend className="w-4 h-4" />
                        Request Payment
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-green-900/30 rounded-lg">
                                <FiCheckCircle className="w-4 h-4 text-green-400" />
                            </div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Received</p>
                        </div>
                        <p className="text-2xl font-bold text-green-400">Rs. {summary.totalReceived.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-yellow-900/30 rounded-lg">
                                <FiClock className="w-4 h-4 text-yellow-400" />
                            </div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Pending</p>
                        </div>
                        <p className="text-2xl font-bold text-yellow-400">Rs. {summary.totalPending.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-red-900/30 rounded-lg">
                                <FiDollarSign className="w-4 h-4 text-red-400" />
                            </div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Service Fees</p>
                        </div>
                        <p className="text-2xl font-bold text-red-400">Rs. {summary.totalServiceFees.toFixed(2)}</p>
                    </div>
                    <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-blue-900/30 rounded-lg">
                                <FiFileText className="w-4 h-4 text-blue-400" />
                            </div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Total Bills</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-400">{summary.totalDisbursements}</p>
                    </div>
                </div>

                {/* Disbursements List */}
                {disbursements.length === 0 ? (
                    <div className="text-center py-16">
                        <FiFileText className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                        <p className="text-gray-400 text-lg">No bills yet</p>
                        <p className="text-gray-600 text-sm mt-1">Request a payment to get started</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {disbursements.map((d) => (
                            <div
                                key={d._id}
                                className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition"
                            >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            {getStatusBadge(d.status)}
                                            <span className="text-xs text-gray-500">
                                                {d.requestedBy === 'ADMIN' ? 'You requested' : 'SuperAdmin initiated'}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3">
                                            <div>
                                                <p className="text-xs text-gray-500">Collected</p>
                                                <p className="text-sm font-semibold text-white">Rs. {d.totalCollected.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Service Fee</p>
                                                <p className="text-sm font-semibold text-red-400">- Rs. {d.serviceFee.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Net Amount</p>
                                                <p className="text-sm font-bold text-green-400">Rs. {d.amountDisbursed.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Fees</p>
                                                <p className="text-sm font-semibold text-gray-300">{d.feeIds?.length || 0}</p>
                                            </div>
                                        </div>
                                        {d.reason && (
                                            <p className="mt-2 text-xs text-red-400 bg-red-900/20 border border-red-800/30 px-3 py-1.5 rounded-lg">
                                                Reason: {d.reason}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs text-gray-500">
                                            {d.processedAt ? `Processed: ${new Date(d.processedAt).toLocaleDateString()}` : `Created: ${new Date(d.createdAt).toLocaleDateString()}`}
                                        </p>
                                        <p className="text-xs text-gray-600 mt-0.5">
                                            {d.processedAt ? new Date(d.processedAt).toLocaleTimeString() : new Date(d.createdAt).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Request Payment Modal */}
            {requestModal && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl text-gray-100">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-900/30 rounded-full mb-4">
                            <FiSend className="w-6 h-6 text-amber-500" />
                        </div>

                        <h3 className="text-xl font-bold text-white text-center mb-2">
                            Request Payment
                        </h3>

                        <p className="text-gray-400 text-center mb-4 text-sm">
                            Request the super admin to disburse your pending Khalti payments.
                            A 0.1% service fee will be deducted from the total.
                        </p>

                        <div className="bg-amber-900/20 border border-amber-800/30 rounded-lg p-3 mb-4">
                            <div className="flex items-start gap-2">
                                <FiAlertTriangle className="text-amber-500 w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-400">
                                    Only fees paid via Khalti that haven't been disbursed yet will be included in this request.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setRequestModal(false)}
                                className="flex-1 px-4 py-2.5 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition font-medium"
                                disabled={requesting}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRequestPayment}
                                className="flex-1 px-4 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition font-medium disabled:bg-amber-800 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                disabled={requesting}
                            >
                                <FiSend className="w-4 h-4" />
                                {requesting ? 'Submitting...' : 'Submit Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyBills;
