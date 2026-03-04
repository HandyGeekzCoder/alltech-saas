import React, { useState, useContext, useRef, useEffect } from 'react';
import { AdminContext } from '../../AdminContext';
import { KeyRound, LogOut } from 'lucide-react';
import PasswordResetModal from './PasswordResetModal';
import { useNavigate } from 'react-router-dom';

const ClientAvatarDropdown = () => {
    const { users, loggedInUserId, updateClientPassword, setLoggedInUserId } = useContext(AdminContext);
    const currentUser = users.find(u => u.id === loggedInUserId);
    const [isOpen, setIsOpen] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    // click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handlePasswordReset = (newPassword) => {
        updateClientPassword(currentUser.id, newPassword);
        setIsChangingPassword(false);
        setIsOpen(false);
    };

    if (!currentUser) return null;

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
                className="user-profile"
                style={{ cursor: 'pointer', transition: 'transform 0.2s', padding: '4px 8px', borderRadius: '8px' }}
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
                <div className="avatar">
                    {currentUser.company.substring(0, 2).toUpperCase()}
                </div>
            </div>

            {isOpen && (
                <div className="glass-panel" style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    minWidth: '220px',
                    padding: 'var(--sp-2)',
                    zIndex: 50,
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    marginTop: '8px'
                }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Signed in as</span>
                        <div style={{ fontWeight: '500', color: '#fff', fontSize: '0.9rem', wordBreak: 'break-word' }}>{currentUser.company}</div>
                    </div>

                    <button
                        onClick={() => {
                            setIsOpen(false);
                            setIsChangingPassword(true);
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: 'none', color: '#fff',
                            padding: '10px 12px', cursor: 'pointer', borderRadius: '6px',
                            width: '100%', textAlign: 'left', transition: 'background 0.2s',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <KeyRound size={16} color="#00ff64" /> Change Password
                    </button>

                    <button
                        onClick={() => {
                            setLoggedInUserId(null);
                            navigate('/');
                        }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            background: 'transparent', border: 'none', color: '#ff4444',
                            padding: '10px 12px', cursor: 'pointer', borderRadius: '6px',
                            width: '100%', textAlign: 'left', transition: 'background 0.2s',
                            fontSize: '0.9rem'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,68,68,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <LogOut size={16} /> Sign Out
                    </button>
                </div>
            )}

            {isChangingPassword && (
                <PasswordResetModal
                    onComplete={handlePasswordReset}
                    onCancel={() => setIsChangingPassword(false)}
                />
            )}
        </div>
    );
};

export default ClientAvatarDropdown;
