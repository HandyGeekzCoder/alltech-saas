import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { AdminContext } from '../AdminContext';
import '../Login.css';

const Login = () => {
    const navigate = useNavigate();
    const { loginClient } = useContext(AdminContext);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const result = await loginClient(email, password);
            if (result.success) {
                navigate('/dashboard');
            } else {
                setError(result.message || 'Invalid client credentials.');
            }
        } catch (err) {
            setError('An unexpected error occurred during login.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-container">
            {/* Background Graphic */}
            <div className="tech-grid-bg" style={{ animationDuration: '40s', opacity: 0.5 }}></div>

            <div className="login-card glass-panel">
                <div className="login-header">
                    <h2>Client Portal</h2>
                    <p>Secure access to your AllTek services</p>
                </div>

                {error && <div style={{ color: '#ff007f', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Email Address</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#8c8c9a' }} />
                            <input
                                type="email"
                                className="form-control"
                                placeholder="client@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#8c8c9a' }} />
                            <input
                                type="password"
                                className="form-control"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                                required
                            />
                        </div>
                    </div>

                    <div className="login-actions">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" /> Remember Desktop
                        </label>
                        <a href="#">Forgot Password?</a>
                    </div>

                    <button type="submit" className="btn-primary auth-btn" disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Secure Login'}
                    </button>
                </form>

                <div className="login-footer">
                    <p>Need access? <a href="/#services">Request a Consultation</a></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
