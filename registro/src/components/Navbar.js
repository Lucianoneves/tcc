// src/components/Navbar.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-logo">
                <Link to="/">MeuApp</Link>
            </div>
            <ul className="navbar-links">
                <li><Link to="/">Home</Link></li>
                <li><Link to="/cadastro">Cadastro</Link></li>
                <li><Link to="/registroProblemas">Registrar Problema</Link></li>
                <li><Link to="/ocorrencias">Ocorrências</Link></li>
                <li><Link to="/adminPage">Administrador</Link></li>
            </ul>
        </nav>
    );
}

export default Navbar;
