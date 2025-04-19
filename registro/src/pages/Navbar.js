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
                <Link to="/"></Link>
            </div>
            <ul className="navbar-links">
                <li><Link to="/">Home</Link></li>                
                <li><Link to="/adminPage">Administrador</Link></li>
                
                <li>
                    <button onClick={handleRegistroProblemasClick} className="link-button">
                        Registrar Problema
                    </button>
                </li>
                
           
            </ul>
        </nav>
    );
}

export default Navbar;