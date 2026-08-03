import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function AdminRoute({ children }) {
  const { currentUser, loadingUser } = useAuth();

  if (loadingUser) {
    return (
      <div className="admin-route-loading">
        <span className="admin-spinner" />
        <p>Preparing your workspace...</p>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/" replace />;
  if (currentUser.role !== "ADMIN") return <Navigate to="/" replace />;

  return children;
}

export default AdminRoute;
