import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User } from 'lucide-react';
import { AdminContext } from '../../AdminContext';
import '../../Login.css';

const AdminLogin = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const { login, logoutUser } = React.useContext(AdminContext);
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        const result = await login(email, password);
        if (result.success && result.role === 'admin') {
            navigate('/admin/editor');
        } else if (result.success) {
            // Valid account, but not an admin — don't leave them signed in on the admin portal.
            await logoutUser();
            setError('This account is not authorized for admin access.');
        } else {
            setError(result.message || 'Invalid admin credentials.');
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
                        <label className="form-label">Admin Email</label>
                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#8c8c9a' }} />
                            <input
                                type="email"
                                className="form-control"
                                placeholder="admin@company.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
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
