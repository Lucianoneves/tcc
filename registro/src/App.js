// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './pages/Navbar';
import Login from './Signin/login';
import CadastroUsuario from './SignUp/cadastrarUsuario';
import Perfil from './pages/perfil';
import RedefinirSenha from './pages/redefinirSenha';
import RegistroProblemas from './pages/registroProblemas';
import Ocorrencias from './pages/ocorrencias';
import AdminPage from './pages/adminPage';
import Home from './pages/Home';
import AuthProvider from './contexts/auth';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Private from './routes/Private'
import ProtectedRoute from "./routes/protectedRouter";







function App() {
    return (
        <Router>
            <AuthProvider>
                <ToastContainer autoClose={3000} />
                <Navbar />
                <Routes>
                    <Route path="/" element={<Home />} /> {/* Página inicial */}
                    <Route path="/login" element={<Login />} /> {/* Tela login */}
                    <Route path="/cadastrarUsuario" element={<CadastroUsuario />} /> {/* Tela de cadastro */}
                    <Route path="/perfil" element={<Private><Perfil /> </Private>} />
                    <Route path="/registroProblemas" element={<Private><ProtectedRoute /><RegistroProblemas /> </Private>} />
                    {/* Rota para a página do Administrador */}
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="/redefinir-senha" element={<RedefinirSenha />} /> {/* Tela de redefinir senha */}



                    {/* Rota para a página de Registro de Ocorrências */}
                    <Route path="/ocorrencias" element={<Ocorrencias />} />
                    <Route path="/adminPage" element={<AdminPage />} />



                    {/* Você pode adicionar outras rotas aqui conforme a necessidade */}
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
