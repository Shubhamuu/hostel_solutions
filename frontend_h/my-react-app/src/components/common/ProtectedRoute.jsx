import { Navigate, Outlet } from "react-router";

const ProtectedRoute = ({ allowedRoles }) => {
    const userString = localStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    const token = localStorage.getItem("accessToken");

    if (!token || !user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect based on role if unauthorized for current route
        if (user.role === "ADMIN") return <Navigate to="/admin/dashboard" replace />;
        if (user.role === "STUDENT") return <Navigate to="/student/dashboard" replace />;
        if (user.role === "SUPERADMIN") return <Navigate to="/superadmin/dashboard" replace />;

        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
