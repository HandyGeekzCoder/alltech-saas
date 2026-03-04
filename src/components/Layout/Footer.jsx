import React from 'react';
import { useLocation, Link } from 'react-router-dom';

const Footer = () => {
    const location = useLocation();

    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')) {
        return null;
    }

    return (
        <footer className="footer">
            <div className="footer-content">
                <p>&copy; {new Date().getFullYear()} AllTek IT Solutions. All rights reserved.</p>
                <div style={{ marginTop: '0.5rem' }}>
                    <a href="/admin-login" style={{ color: '#8c8c9a', textDecoration: 'none', fontSize: '0.85rem', opacity: 0.7, '&:hover': { opacity: 1 } }}>Admin Access</a>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
