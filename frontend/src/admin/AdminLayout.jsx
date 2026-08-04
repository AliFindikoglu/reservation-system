import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; 
import Sidebar from "../components/Sidebar/Sidebar"; 
import Header from "../components/Header/Header";
import "../styles/Admin.css";

function AdminLayout() {
  const { currentUser } = useAuth();

  return (
    <div className="admin-shell">
      
      <Sidebar isAdmin={true} />

      <section className="admin-main">
        
        <Header isAdmin={true} />        
        <main className="admin-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}

export default AdminLayout;