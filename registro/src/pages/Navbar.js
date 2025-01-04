import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar() {
    const [isAdmin, setIsAdmin] = useState(false);
    const navigate = useNavigate();
  

    useEffect(() => {
        // Verifica se o usuário é administrador
        const adminStatus = localStorage.getItem('isAdmin') === 'true';
        setIsAdmin(adminStatus);
    }, []);

    const handleRegistroProblemasClick = () => {
        navigate('/'); // Redireciona para a página Home
    };

    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <a href="/">MeuApp</a>
            </div>
            <ul className="navbar-links">
                <li><a href="/">Home</a></li>
                <li><a href="/login">Login</a></li>
                <li><a href="/cadastrarUsuario">Cadastro</a></li>
                {/* Adiciona a lógica de redirecionamento ao clicar em "Registrar Problema" */}
                <li><button onClick={handleRegistroProblemasClick} className="link-button">Registrar Problema</button></li>
                {isAdmin && <li><a href="/ocorrencias">Ocorrências</a></li>}
                <li><a href="/adminPage">Administrador</a></li>
            </ul>
        </nav>
    );
}

export default Navbar;
