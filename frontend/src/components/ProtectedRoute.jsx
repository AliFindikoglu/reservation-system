import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children }) {
  const { currentUser, loadingUser } = useAuth();

  if (loadingUser) return null;

  if (!currentUser) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
