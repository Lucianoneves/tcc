import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth";

function ProtectedRoute({ children, requiredRole }) {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.role === "admin"; // Presumindo que o papel do usuário é armazenado no contexto ou Firebase

  // Verifica se o usuário está autenticado
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Verifica se a rota exige um administrador e o usuário não é admin
  if (requiredRole === "admin" && !isAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Renderiza o conteúdo protegido
  return children;
}

export default ProtectedRoute;
