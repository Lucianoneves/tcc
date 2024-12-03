import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../contexts/auth";

function ProtectedRoute({ children }) {
  const { user } = useContext(AuthContext);

  return user ? children : <Navigate to="/" />;
}


<Routes>
  <Route path="/" element={<Login />} />
  <Route
    path="/perfil"
    element={
      <ProtectedRoute>
        <PerfilUsuario />
      </ProtectedRoute>
    }
  />
</Routes>

export default ProtectedRoute;
