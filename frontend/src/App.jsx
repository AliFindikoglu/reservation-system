import { BrowserRouter, Routes, Route } from "react-router-dom";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Home from "./pages/Home";
import MyReservations from "./pages/MyReservations";
import AdminLayout from "./admin/AdminLayout";
import AdminDashboard from "./admin/AdminDashboard";
import AdminUsers from "./admin/AdminUsers";
import AdminReservations from "./admin/AdminReservations";
import AdminAssignments from "./admin/AdminAssignments";
import AdminRestrictions from "./admin/AdminRestrictions";
import AdminDesks from "./admin/AdminDesks";
import AdminAuditLogs from "./admin/AdminAuditLogs";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/my-reservations"
          element={
            <ProtectedRoute>
              <MyReservations />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="reservations" element={<AdminReservations />} />
          <Route path="assignments" element={<AdminAssignments />} />
          <Route path="restrictions" element={<AdminRestrictions />} />
          <Route path="desks" element={<AdminDesks />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
