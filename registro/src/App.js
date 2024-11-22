// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import CadastroUsuario from './components/cadastroUsuario';
import RedefinirSenha from './components/redefinirSenha';
import RegistroProblemas from './components/registroProblemas';
import Ocorrencias from './components/ocorrencias';
import AdminPage from './components/adminPage';
import Home from './pages/Home';





function App() {
    return (
        <Router>
            <Navbar />
            <Routes>
                <Route path="/" element={<Home />} /> {/* Página inicial */}
                <Route path="/Cadastro" element={<CadastroUsuario />} /> {/* Tela de cadastro */}
                <Route path="/redefinir-senha" element={<RedefinirSenha />} /> {/* Tela de redefinir senha */}
                <Route path="/registroProblemas" element={<RegistroProblemas />} /> {/* Tela de registro */}
                
                {/* Rota para a página do Administrador */}
                <Route path="/admin" element={<AdminPage />} />

                {/* Rota para a página de Registro de Ocorrências */}
                <Route path="/ocorrencias" element={<Ocorrencias />} />
                <Route path="/adminPage" element={<AdminPage />} />

                {/* Você pode adicionar outras rotas aqui conforme a necessidade */}
            </Routes>
        </Router>
    );
}

export default App;
