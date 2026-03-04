import React, { useState } from 'react';
import { KeyRound, ShieldCheck, AlertCircle, X } from 'lucide-react';

const PasswordResetModal = ({ onComplete, onCancel }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        onComplete(newPassword);
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div className="glass-panel" style={{
                maxWidth: '450px',
                width: '100%',
                padding: 'var(--sp-8)',
                borderTop: '4px solid #00ff64',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'radial-gradient(circle, rgba(0,255,100,0.1) 0%, transparent 70%)', borderRadius: '50%' }}></div>

                {onCancel && (
                    <button
                        onClick={onCancel}
                        style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        aria-label="Close"
                    >
                        <X size={24} />
                    </button>
                )}

                <div style={{ textAlign: 'center', marginBottom: 'var(--sp-6)' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'rgba(0, 255, 100, 0.1)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto var(--sp-4)'
                    }}>
                        <KeyRound size={32} color="#00ff64" />
                    </div>
                    <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '8px' }}>Secure Your Account</h2>
                    <p className="text-muted" style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>
                        Welcome to the AllTek Client Portal. For your security, you must replace your temporary password before accessing your dashboard.
                    </p>
                </div>

                {error && (
                    <div style={{
                        background: 'rgba(255, 68, 68, 0.1)',
                        color: '#ff4444',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: 'var(--sp-6)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.9rem'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                    <div className="form-group">
                        <label className="form-label text-muted">New Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Min. 8 characters"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label text-muted">Confirm Password</label>
                        <input
                            type="password"
                            className="form-control"
                            placeholder="Re-enter password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn-primary"
                        style={{
                            marginTop: 'var(--sp-2)',
                            background: 'linear-gradient(135deg, #00ff64, #00b3ff)',
                            color: '#000',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px'
                        }}
                    >
                        <ShieldCheck size={20} />
                        Update & Continue
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordResetModal;
