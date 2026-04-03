import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleGate({ requireAuth = false, roles, permissions, children }) {
  const { user } = useAuth();

  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return children || <Outlet />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permissions && permissions.length > 0) {
    const permissionSet = new Set(user.permissions || []);
    const allowed = permissions.every((permission) => permissionSet.has(permission));
    if (!allowed) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children || <Outlet />;
}