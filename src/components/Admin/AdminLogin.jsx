import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { AdminContext } from '../../AdminContext';
import '../../Login.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { adminLogin } = React.useContext(AdminContext);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        if (username === 'Admin' && password === 'Admin') {
            const result = await adminLogin();
            if (result.success) {
                navigate('/admin/editor');
            } else {
                setError(result.message);
            }
        } else {
            setError('Invalid admin credentials.');
        }
        setIsLoading(false);
    };

    return (
        <div className="login-container">
            <div className="tech-grid-bg" style={{ animationDuration: '40s', opacity: 0.3 }}></div>

            <div className="login-card glass-panel" style={{ borderTop: '1px solid #ff007f' }}>
                <div className="login-header">
                    <h2>Admin Portal</h2>
                    <p>Restricted access. Authorized IT personnel only.</p>
                </div>

                {error && <div style={{ color: '#ff007f', marginBottom: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>{error}</div>}

                <form onSubmit={handleLogin}>
                    <div className="form-group">
                        <label className="form-label">Admin Username</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#8c8c9a' }} />
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Admin"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                style={{ paddingLeft: '40px' }}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Admin Password</label>
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

                    <button type="submit" className="btn-primary auth-btn" style={{ background: 'linear-gradient(135deg, #ff007f, #7000ff)' }} disabled={isLoading}>
                        {isLoading ? 'Authenticating...' : 'Authenticate Admin'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AdminLogin;
