import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminLogin from './components/Admin/AdminLogin';
import AdminLayout from './pages/Admin';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import { AdminContext } from './AdminContext';
import { Loader2 } from 'lucide-react';
import './App.css';

function App() {
    const { isLoading } = useContext(AdminContext);

    if (isLoading) {
        return (
            <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0a', flexDirection: 'column', gap: '16px' }}>
                <Loader2 className="spinning" size={48} color="#00ff64" />
                <h2 style={{ color: '#fff', letterSpacing: '2px', fontWeight: '300' }}>INITIALIZING <span style={{ color: '#00ff64', fontWeight: 'bold' }}>ALLTEK</span> PLATFORM</h2>
            </div>
        );
    }

    return (
        <Router>
            <div className="app-container">
                <Navbar />
                <main className="main-content">
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/admin-login" element={<AdminLogin />} />
                        <Route path="/admin/*" element={<AdminLayout />} />
                        <Route path="/dashboard/*" element={<Dashboard />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}

export default App;
