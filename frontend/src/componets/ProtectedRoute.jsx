import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { currentUser, userData } = useAuth();

  // Not logged in
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Still loading role
  if (!userData) {
    return null; // or loading spinner
  }

  // If roles are provided, check them
  if (allowedRoles && !allowedRoles.includes(userData.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}
