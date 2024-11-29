// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './Signin/login';
import CadastroUsuario from './SignUp/cadastrarUsuario';
import Dashboard   from './pages/Dashboard/dashboard';
import RedefinirSenha from './components/redefinirSenha';
import RegistroProblemas from './components/registroProblemas';
import Ocorrencias from './components/ocorrencias';
import AdminPage from './components/adminPage';
import Home from './pages/Home';
import AuthProvider from './contexts/auth';
import {ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';





function App() {
    return (
        <Router>
            <AuthProvider>
                <ToastContainer autoClose={3000}/>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} /> {/* Página inicial */}
                <Route path="/login" element={<Login />} /> {/* Tela login de cadastro */}
                <Route path="/cadastrarUsuario" element={<CadastroUsuario />} /> {/* Tela de cadastro */}
                <Route path="/registroProblemas" element={<RegistroProblemas />} /> {/* Tela de registro */}
                <Route path="/redefinir-senha" element={<RedefinirSenha />} /> {/* Tela de redefinir senha */}
                <Route path="/dashboard" element={<Dashboard/>} /> {/* Tela de redefinir senha */}
                
                {/* Rota para a página do Administrador */}
                <Route path="/admin" element={<AdminPage />} />

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
