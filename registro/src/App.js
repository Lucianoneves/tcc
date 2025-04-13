// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './pages/Navbar';
import Login from './Signin/login';
import CadastroUsuario from './SignUp/cadastrarUsuario';
import Perfil from './pages/perfilUsuario';
import RedefinirSenha from './pages/redefinirSenha';
import RegistroProblemas from './pages/registroProblemas';
import Ocorrencias from './pages/ocorrencias';
import AdminPage from './pages/adminPage';
import MapaOcorrencias from './pages/MapaOcorrencias';
import Home from './pages/Home';
import AuthProvider from './contexts/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Private from './routes/Private'
import ProtectedRoute from "./routes/protectedRouter";
import PerfilUsuario from './pages/perfilUsuario';





function App() {
    return (
        <Router>
            <AuthProvider>
                <ToastContainer autoClose={3000} /> 
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/cadastrarUsuario" element={<CadastroUsuario />} />
                    <Route path="/perfil" element={<Private><Perfil /></Private>} />
                    <Route path="/registroProblemas" element={<Private><ProtectedRoute /><RegistroProblemas /></Private>} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                    <Route path="/ocorrencias" element={<Ocorrencias />} />
                    <Route path="/adminPage" element={<AdminPage />} />
                    <Route path="/MapaOcorrencias" element={<MapaOcorrencias />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}
export default App;