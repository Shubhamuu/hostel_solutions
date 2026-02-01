import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router";
import { 
  Home,
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  CreditCard, 
  Calendar,
  Wallet,
  Receipt,
  ExternalLink,
  Download,
  History,
  Shield,
  TrendingUp,
  AlertTriangle,
  X
} from "lucide-react";
import { apiprivate } from "../../services/api";

export default function Fee() {
  const navigate = useNavigate();
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    totalDue: 0,
    totalPaid: 0,
    pendingCount: 0,
    paidCount: 0
  });

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const res = await apiprivate.get("/fees/viewFeeBystudent");
        console.log("Fee response:", res);
        const data = res.data;

        if (res.status !== 200) {
          setError(data.message || "Failed to fetch fee details");
          return;
        }

        setFees(data);
        
        // Calculate statistics
        const calculatedStats = {
          totalDue: data.reduce((sum, fee) => sum + fee.amountDue, 0),
          totalPaid: data.reduce((sum, fee) => sum + fee.amountPaid, 0),
          pendingCount: data.filter(fee => fee.status === "PENDING").length,
          paidCount: data.filter(fee => fee.status === "PAID").length
        };
        setStats(calculatedStats);

      } catch (err) {
        console.error("Error fetching fees:", err);
        setError(err?.response?.data?.message || "Server not reachable");
      } finally {
        setLoading(false);
      }
    };

    fetchFees();
  }, []);

  const clearError = () => {
    setError("");
  };

  const StatusBadge = ({ status }) => {
    const config = {
      PAID: { color: "bg-emerald-500/20 text-emerald-400", icon: CheckCircle },
      PENDING: { color: "bg-amber-500/20 text-amber-400", icon: AlertTriangle },
      OVERDUE: { color: "bg-rose-500/20 text-rose-400", icon: AlertCircle },
      default: { color: "bg-gray-500/20 text-gray-400", icon: Wallet }
    };

    const { color, icon: Icon } = config[status] || config.default;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${color}`}>
        <Icon size={14} />
        <span className="text-sm font-medium capitalize">{status.toLowerCase()}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gradient-to-b from-gray-900 to-black">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <div className="absolute inset-0 animate-ping bg-indigo-500/20 rounded-full"></div>
        </div>
        <p className="mt-4 text-gray-400 text-lg font-medium">Loading fee details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 p-4 rounded-xl bg-rose-900/30 border border-rose-800 text-rose-300">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="flex-shrink-0" />
                <p className="font-medium">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-rose-400 hover:text-rose-300 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8 text-center">
            <AlertCircle className="mx-auto text-rose-400 mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white mb-3">
              Unable to Load Fees
            </h3>
            <p className="text-gray-400 mb-6">
              We encountered an issue while loading your fee details. Please try again later.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
              >
                Retry
              </button>
              <Link
                to="/"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold rounded-xl transition-colors"
              >
                Go to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                Fee Management
              </h1>
              <p className="text-gray-400">
                View and manage your hostel fee payments
              </p>
            </div>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard
                icon={<Wallet size={18} />}
                label="Total Due"
                value={`₹${stats.totalDue}`}
                color="text-rose-400"
              />
              <StatCard
                icon={<CreditCard size={18} />}
                label="Total Paid"
                value={`₹${stats.totalPaid}`}
                color="text-emerald-400"
              />
              <StatCard
                icon={<AlertTriangle size={18} />}
                label="Pending"
                value={stats.pendingCount}
                color="text-amber-400"
              />
              <StatCard
                icon={<CheckCircle size={18} />}
                label="Paid"
                value={stats.paidCount}
                color="text-emerald-400"
              />
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Link
              to="/payment-history"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <History size={16} />
              Payment History
            </Link>
            
            <Link
              to="/support"
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm flex items-center gap-2"
            >
              <Shield size={16} />
              Payment Support
            </Link>
          </div>
        </div>

        {/* Main Content */}
        {fees.length === 0 ? (
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-12 text-center">
            <Wallet className="mx-auto text-gray-500 mb-4" size={48} />
            <h3 className="text-2xl font-bold text-white mb-3">
              No Fee Records Found
            </h3>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              You don't have any fee records at the moment. Fees will appear here once they are generated.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors"
            >
              <Home size={18} />
              Return to Dashboard
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Fee Cards */}
            {fees.map((fee) => {
              const balance = fee.amountDue - fee.amountPaid;
              const isOverdue = new Date(fee.dueDate) < new Date() && fee.status === "PENDING";

              return (
                <div
                  key={fee._id}
                  className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                      {/* Left Section */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h2 className="text-xl font-bold text-white mb-1">
                              Hostel Fee - {fee.semester || "Academic Year"}
                            </h2>
                            <div className="flex items-center gap-3">
                              <StatusBadge status={isOverdue ? "OVERDUE" : fee.status} />
                              <span className="text-sm text-gray-400">
                                Fee ID: {fee._id.slice(-8)}
                              </span>
                            </div>
                          </div>
                          
                          {isOverdue && (
                            <div className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-full text-sm font-medium">
                              Overdue
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <DetailItem
                            icon={<Calendar size={16} />}
                            label="Due Date"
                            value={new Date(fee.dueDate).toLocaleDateString('en-IN', {
                              weekday: 'short',
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                            highlight={isOverdue}
                          />
                          <DetailItem
                            icon={<Receipt size={16} />}
                            label="Fee Period"
                            value={`${fee.month || "Semester"} ${fee.year || new Date().getFullYear()}`}
                          />
                          <DetailItem
                            icon={<TrendingUp size={16} />}
                            label="Balance"
                            value={`₹${balance > 0 ? balance : 0}`}
                            highlight={balance > 0}
                          />
                        </div>

                        {fee.paymentReference?.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm text-gray-400 mb-2">Payment References:</p>
                            <div className="flex flex-wrap gap-2">
                              {fee.paymentReference.map((ref, index) => (
                                <span
                                  key={index}
                                  className="px-3 py-1 bg-gray-900/50 text-gray-300 rounded-lg text-xs font-mono"
                                >
                                  {ref.slice(0, 8)}...
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Section - Amount & Actions */}
                      <div className="lg:w-1/3">
                        <div className="bg-gray-900/30 rounded-xl p-5">
                          <div className="space-y-4">
                            <AmountItem
                              label="Amount Due"
                              value={fee.amountDue}
                              color="text-white"
                              size="text-2xl"
                            />
                            <AmountItem
                              label="Amount Paid"
                              value={fee.amountPaid}
                              color="text-emerald-400"
                              size="text-lg"
                            />
                            <div className="pt-4 border-t border-gray-700">
                              <AmountItem
                                label="Remaining Balance"
                                value={balance > 0 ? balance : 0}
                                color={balance > 0 ? "text-rose-400" : "text-emerald-400"}
                                size="text-xl"
                              />
                            </div>
                          </div>

                          <div className="mt-6 space-y-3">
                            {fee.status === "PENDING" && (
                              <Link
                                to={`/khaltipayment/${fee._id}`}
                                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                              >
                                <CreditCard size={18} />
                                Pay Now
                              </Link>
                            )}

                            {fee.status === "PAID" && (
                              <div className="text-center p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                                <div className="flex items-center justify-center gap-2 text-emerald-400">
                                  <CheckCircle size={18} />
                                  <span className="font-medium">Payment Completed</span>
                                </div>
                                <p className="text-sm text-gray-400 mt-1">
                                  Paid on {new Date(fee.updatedAt).toLocaleDateString()}
                                </p>
                              </div>
                            )}

                            <Link
                              to={`/fee/${fee._id}`}
                              className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                            >
                              <ExternalLink size={14} />
                              View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gray-800/30 backdrop-blur-sm rounded-2xl border border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Need Help with Payments?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <HelpItem
              icon={<Shield size={18} />}
              title="Payment Security"
              description="All payments are secured with SSL encryption"
            />
            <HelpItem
              icon={<AlertCircle size={18} />}
              title="24/7 Support"
              description="Contact support for payment-related queries"
            />
            <HelpItem
              icon={<Receipt size={18} />}
              title="Instant Receipts"
              description="Download receipts immediately after payment"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Components
const StatCard = ({ icon, label, value, color }) => (
  <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700 p-4">
    <div className="flex items-center gap-3 mb-2">
      <div className="text-gray-400">
        {icon}
      </div>
      <span className="text-sm text-gray-400">{label}</span>
    </div>
    <div className={`text-xl font-bold ${color}`}>{value}</div>
  </div>
);

const DetailItem = ({ icon, label, value, highlight = false }) => (
  <div className={`p-3 rounded-lg ${highlight ? 'bg-rose-500/10 border border-rose-500/20' : 'bg-gray-900/30'}`}>
    <div className="flex items-center gap-2 mb-1">
      <div className="text-gray-400">
        {icon}
      </div>
      <p className="text-sm text-gray-400">{label}</p>
    </div>
    <p className={`font-medium ${highlight ? 'text-rose-400' : 'text-white'}`}>{value}</p>
  </div>
);

const AmountItem = ({ label, value, color, size }) => (
  <div>
    <p className="text-sm text-gray-400 mb-1">{label}</p>
    <div className={`font-bold ${size} ${color}`}>₹{value}</div>
  </div>
);

const HelpItem = ({ icon, title, description }) => (
  <div className="p-4 rounded-lg bg-gray-900/30 border border-gray-700">
    <div className="flex items-center gap-3 mb-3">
      <div className="text-indigo-400">
        {icon}
      </div>
      <h4 className="font-semibold text-white">{title}</h4>
    </div>
    <p className="text-sm text-gray-400">{description}</p>
  </div>
);