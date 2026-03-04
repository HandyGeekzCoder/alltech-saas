import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Cpu } from 'lucide-react';

const Navbar = () => {
    const location = useLocation();

    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <header className="navbar">
            <div className="container navbar-container">
                <Link to="/" className="logo">
                    <Cpu className="logo-icon" size={32} />
                    <span>ALLTEK</span>
                </Link>
                <nav className="nav-links">
                    <a href="#services">Capabilities</a>
                    <a href="#about">Architecture</a>
                    <Link to="/login" className="btn-primary">Client Portal</Link>
                </nav>
            </div>
        </header>
    );
};

export default Navbar;
