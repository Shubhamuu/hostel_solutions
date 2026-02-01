// components/FeeDetails.js
import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { apiprivate } from '../../services/api';

const FeeDetails = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [users, setUsers] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortOrder, setSortOrder] = useState('desc');

  // Form states
  const [updateData, setUpdateData] = useState({
    status: '',
    paymentReference: '',
    amountPaid: '',
    paidAt: ''
  });

  const [newFee, setNewFee] = useState({
    studentId: '',
    amountDue: '',
    dueDate: '',
    description: ''
  });

  // Fetch all fees
  const fetchFees = async () => {
    try {
      setLoading(true);
      const response = await apiprivate.get('/fees/viewFee');
      setFees(response.data);
    } catch (error) {
      toast.error('Failed to fetch fees');
      console.error('Error fetching fees:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all users for dropdown
  const fetchUsers = async () => {
    try {
      const response = await apiprivate.get('/users/');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    fetchFees();
    fetchUsers();
  }, []);

  // Filter and sort fees
  const filteredAndSortedFees = fees
    .filter(fee => {
      // Search filter
      const matchesSearch = 
        searchTerm === '' ||
        fee.studentId.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fee.paymentReference && fee.paymentReference.some(ref => 
          ref.toLowerCase().includes(searchTerm.toLowerCase())
        ));

      // Status filter
      const matchesStatus = statusFilter === 'all' || fee.status === statusFilter;

      // Date filter
      const now = new Date();
      const dueDate = new Date(fee.dueDate);
      let matchesDate = true;
      
      switch (dateFilter) {
        case 'overdue':
          matchesDate = dueDate < now && fee.status !== 'PAID';
          break;
        case 'thisWeek':
          const oneWeekLater = new Date();
          oneWeekLater.setDate(now.getDate() + 7);
          matchesDate = dueDate <= oneWeekLater && dueDate >= now;
          break;
        case 'thisMonth':
          const oneMonthLater = new Date();
          oneMonthLater.setMonth(now.getMonth() + 1);
          matchesDate = dueDate <= oneMonthLater && dueDate >= now;
          break;
        default:
          matchesDate = true;
      }

      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'amountDue':
          aValue = a.amountDue;
          bValue = b.amountDue;
          break;
        case 'amountPaid':
          aValue = a.amountPaid;
          bValue = b.amountPaid;
          break;
        case 'dueDate':
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        default:
          aValue = new Date(a.dueDate);
          bValue = new Date(b.dueDate);
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

  // Calculate statistics
  const calculateStats = () => {
    const totalFees = fees.length;
    const totalDue = fees.reduce((sum, fee) => sum + fee.amountDue, 0);
    const totalPaid = fees.reduce((sum, fee) => sum + fee.amountPaid, 0);
    const totalOutstanding = totalDue - totalPaid;
    
    const paidFees = fees.filter(fee => fee.status === 'PAID').length;
    const pendingFees = fees.filter(fee => fee.status === 'PENDING').length;
    const overdueFees = fees.filter(fee => {
      const dueDate = new Date(fee.dueDate);
      return dueDate < new Date() && fee.status !== 'PAID';
    }).length;

    const collectionRate = totalDue > 0 ? (totalPaid / totalDue * 100).toFixed(1) : 0;
    const avgFee = totalFees > 0 ? (totalDue / totalFees).toFixed(0) : 0;

    return {
      totalFees,
      totalDue,
      totalPaid,
      totalOutstanding,
      paidFees,
      pendingFees,
      overdueFees,
      collectionRate,
      avgFee
    };
  };

  const stats = calculateStats();

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Not paid';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'OVERDUE': return 'bg-red-100 text-red-800';
      case 'PARTIAL': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Calculate days remaining
  const getDaysRemaining = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get days remaining color
  const getDaysRemainingColor = (days) => {
    if (days < 0) return 'text-red-600';
    if (days <= 3) return 'text-yellow-600';
    if (days <= 7) return 'text-blue-600';
    return 'text-green-600';
  };

  // Open update modal
  const openUpdateModal = (fee) => {
    setSelectedFee(fee);
    setUpdateData({
      status: fee.status,
      paymentReference: fee.paymentReference?.[0] || '',
      amountPaid: fee.amountPaid,
      paidAt: fee.paidAt ? new Date(fee.paidAt).toISOString().split('T')[0] : ''
    });
    setShowUpdateModal(true);
  };

  // Handle update fee
  const handleUpdateFee = async () => {
    if (!updateData.status) {
      toast.error('Please select a status');
      return;
    }

    try {
      setUpdating(true);
      
      const updatePayload = {
        feeId: selectedFee._id,
        studentId: selectedFee.studentId._id,
        status: updateData.status
      };

      // Add optional fields if they have values
      if (updateData.paymentReference) {
        updatePayload.paymentReference = updateData.paymentReference;
      }
      
      if (updateData.amountPaid) {
        updatePayload.amountPaid = Number(updateData.amountPaid);
      }
      
      if (updateData.paidAt) {
        updatePayload.paidAt = new Date(updateData.paidAt).toISOString();
      }

      updatePayload.updatedAt = new Date().toISOString();

      const response = await apiprivate.put('/fees/updatefee', updatePayload);

      if (response.status === 200) {
        toast.success('Fee updated successfully');
        setShowUpdateModal(false);
        fetchFees();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update fee');
      console.error('Error updating fee:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Handle add new fee
  const handleAddFee = async () => {
    if (!newFee.studentId || !newFee.amountDue || !newFee.dueDate) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      const response = await apiprivate.post('/fees/create', {
        studentId: newFee.studentId,
        amountDue: Number(newFee.amountDue),
        dueDate: new Date(newFee.dueDate).toISOString(),
        description: newFee.description
      });

      if (response.status === 201) {
        toast.success('Fee record created successfully');
        setShowAddModal(false);
        setNewFee({
          studentId: '',
          amountDue: '',
          dueDate: '',
          description: ''
        });
        fetchFees();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create fee record');
    }
  };

  // Handle delete fee
  const handleDeleteFee = async (feeId) => {
    if (!window.confirm('Are you sure you want to delete this fee record?')) return;

    try {
      await apiprivate.delete(`/fees/delete/${feeId}`);
      toast.success('Fee record deleted successfully');
      fetchFees();
    } catch (error) {
      toast.error('Failed to delete fee record');
    }
  };

  // Calculate amount due after payment
  const calculateRemainingAmount = (amountDue, amountPaid) => {
    return amountDue - amountPaid;
  };

  // Export fees to CSV
  const handleExportFees = () => {
    const csvContent = [
      ['Fee ID', 'Student Email', 'Amount Due', 'Amount Paid', 'Remaining', 'Status', 'Due Date', 'Paid At', 'Payment Reference'],
      ...filteredAndSortedFees.map(fee => [
        fee._id,
        fee.studentId.email,
        formatCurrency(fee.amountDue),
        formatCurrency(fee.amountPaid),
        formatCurrency(calculateRemainingAmount(fee.amountDue, fee.amountPaid)),
        fee.status,
        formatDate(fee.dueDate),
        formatDate(fee.paidAt),
        fee.paymentReference?.join(', ') || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fees_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Fee Management</h1>
        <div className="flex gap-3">
          <button
            onClick={handleExportFees}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Fee Record
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500">
          <div className="text-center">
            <h3 className="text-gray-500 text-sm font-medium">Total Fees</h3>
            <p className="text-3xl font-bold text-gray-800 mt-2">{stats.totalFees}</p>
            <p className="text-sm text-gray-500 mt-1">
              Avg: {formatCurrency(stats.avgFee)}
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500">
          <div className="text-center">
            <h3 className="text-gray-500 text-sm font-medium">Amount Collected</h3>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {formatCurrency(stats.totalPaid)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.collectionRate}% collection rate
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="text-center">
            <h3 className="text-gray-500 text-sm font-medium">Pending Fees</h3>
            <p className="text-3xl font-bold text-yellow-600 mt-2">
              {stats.pendingFees + stats.overdueFees}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {stats.overdueFees} overdue
            </p>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm p-6 border-l-4 border-red-500">
          <div className="text-center">
            <h3 className="text-gray-500 text-sm font-medium">Outstanding Amount</h3>
            <p className="text-3xl font-bold text-red-600 mt-2">
              {formatCurrency(stats.totalOutstanding)}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              From {stats.totalDue} total due
            </p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Fees
            </label>
            <input
              type="text"
              placeholder="Search by student email, fee ID, or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="OVERDUE">Overdue</option>
              <option value="PARTIAL">Partial</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Due Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Dates</option>
              <option value="overdue">Overdue</option>
              <option value="thisWeek">Due This Week</option>
              <option value="thisMonth">Due This Month</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sort By
            </label>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="dueDate">Due Date</option>
                <option value="amountDue">Amount Due</option>
                <option value="amountPaid">Amount Paid</option>
                <option value="createdAt">Created Date</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fees Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAndSortedFees.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No fees found</h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                ? 'Try changing your filters or search terms' 
                : 'No fee records available'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student & Fee Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status & Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Info
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedFees.map((fee) => {
                  const daysRemaining = getDaysRemaining(fee.dueDate);
                  const remainingAmount = calculateRemainingAmount(fee.amountDue, fee.amountPaid);
                  const paymentProgress = fee.amountDue > 0 ? (fee.amountPaid / fee.amountDue * 100) : 0;

                  return (
                    <tr key={fee._id} className="hover:bg-gray-50">
                      {/* Student & Fee Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {fee.studentId.email}
                            </div>
                            <div className="text-xs text-gray-500">
                              Fee ID: {fee._id.substring(0, 8)}...
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            Created: {formatDate(fee.createdAt)}
                          </div>
                        </div>
                      </td>

                      {/* Amount Details */}
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Due: {formatCurrency(fee.amountDue)}
                            </div>
                            <div className="text-sm text-green-600">
                              Paid: {formatCurrency(fee.amountPaid)}
                            </div>
                            <div className={`text-sm font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              Remaining: {formatCurrency(remainingAmount)}
                            </div>
                          </div>
                          
                          {/* Payment Progress Bar */}
                          <div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${paymentProgress === 100 ? 'bg-green-500' : paymentProgress > 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                                style={{ width: `${Math.min(paymentProgress, 100)}%` }}
                              ></div>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {paymentProgress.toFixed(1)}% paid
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Status & Dates */}
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div className="flex flex-col gap-2">
                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(fee.status)}`}>
                              {fee.status}
                            </span>
                            
                            <div className="text-sm">
                              <div className="font-medium text-gray-900">Due Date:</div>
                              <div className={`${getDaysRemainingColor(daysRemaining)}`}>
                                {formatDate(fee.dueDate)}
                                {daysRemaining >= 0 ? (
                                  <span className="ml-2">({daysRemaining} days left)</span>
                                ) : (
                                  <span className="ml-2 text-red-600">({Math.abs(daysRemaining)} days overdue)</span>
                                )}
                              </div>
                            </div>
                            
                            {fee.paidAt && (
                              <div className="text-sm">
                                <div className="font-medium text-gray-900">Paid At:</div>
                                <div className="text-green-600">
                                  {formatDate(fee.paidAt)}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Payment Info */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {fee.paymentReference && fee.paymentReference.length > 0 ? (
                            <div>
                              <div className="text-sm font-medium text-gray-900 mb-1">
                                Payment References:
                              </div>
                              <div className="space-y-1">
                                {fee.paymentReference.map((ref, index) => (
                                  <div key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                    {ref}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No payment references</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => openUpdateModal(fee)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Update Fee
                          </button>
                          
                          {remainingAmount > 0 && (
                            <button
                              onClick={() => {
                                setSelectedFee(fee);
                                setUpdateData(prev => ({
                                  ...prev,
                                  status: 'PAID',
                                  amountPaid: fee.amountDue
                                }));
                                setShowUpdateModal(true);
                              }}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                            >
                              Mark as Paid
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteFee(fee._id)}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Update Fee Modal */}
      {showUpdateModal && selectedFee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Update Fee Record
                </h2>
                <button
                  onClick={() => setShowUpdateModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Current Fee Details</h3>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-blue-700">Student:</div>
                    <div>{selectedFee.studentId.email}</div>
                    
                    <div className="text-blue-700">Amount Due:</div>
                    <div>{formatCurrency(selectedFee.amountDue)}</div>
                    
                    <div className="text-blue-700">Amount Paid:</div>
                    <div>{formatCurrency(selectedFee.amountPaid)}</div>
                    
                    <div className="text-blue-700">Remaining:</div>
                    <div className={calculateRemainingAmount(selectedFee.amountDue, selectedFee.amountPaid) > 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'}>
                      {formatCurrency(calculateRemainingAmount(selectedFee.amountDue, selectedFee.amountPaid))}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status *
                  </label>
                  <select
                    value={updateData.status}
                    onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Status</option>
                    <option value="PAID">Paid</option>
                    <option value="PENDING">Pending</option>
                    <option value="OVERDUE">Overdue</option>
                    <option value="PARTIAL">Partial Payment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Amount Paid (₹)
                  </label>
                  <input
                    type="number"
                    value={updateData.amountPaid}
                    onChange={(e) => setUpdateData({...updateData, amountPaid: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount paid"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Current paid: {formatCurrency(selectedFee.amountPaid)} | 
                    New total: {formatCurrency(selectedFee.amountPaid + Number(updateData.amountPaid || 0))}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Reference
                  </label>
                  <input
                    type="text"
                    value={updateData.paymentReference}
                    onChange={(e) => setUpdateData({...updateData, paymentReference: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter transaction/reference ID"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    value={updateData.paidAt}
                    onChange={(e) => setUpdateData({...updateData, paidAt: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowUpdateModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      disabled={updating}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleUpdateFee}
                      disabled={updating}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updating ? 'Updating...' : 'Update Fee'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Fee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">
                  Add New Fee Record
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Student *
                  </label>
                  <select
                    value={newFee.studentId}
                    onChange={(e) => setNewFee({...newFee, studentId: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a student</option>
                    {users
                      .filter(user => user.role === 'STUDENT')
                      .map(user => (
                        <option key={user._id} value={user._id}>
                          {user.name} ({user.email})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Due (₹) *
                  </label>
                  <input
                    type="number"
                    value={newFee.amountDue}
                    onChange={(e) => setNewFee({...newFee, amountDue: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter amount due"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    value={newFee.dueDate}
                    onChange={(e) => setNewFee({...newFee, dueDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newFee.description}
                    onChange={(e) => setNewFee({...newFee, description: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Add any description or notes..."
                  ></textarea>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddFee}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Create Fee Record
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default FeeDetails;
