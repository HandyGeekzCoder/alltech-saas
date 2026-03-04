import React, { useContext, useState, useMemo } from 'react';
import { AdminContext, calculateUserBalance } from '../../AdminContext';
import { Users, DollarSign, Plus, Trash2, CheckCircle, KeyRound, Copy } from 'lucide-react';

const UserManager = () => {
    const { users, billingCatalog, addBatchInvoiceToJob, addClientAccount, addJobToAccount } = useContext(AdminContext);

    // Core Selection
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedJob, setSelectedJob] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // Invite Client Form State
    const [inviteCompany, setInviteCompany] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

    // Item Staging Draft
    const [stagedItems, setStagedItems] = useState([]);

    // New Item Form State
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [chargeDesc, setChargeDesc] = useState('');
    const [chargeAmount, setChargeAmount] = useState('');
    const [chargeQty, setChargeQty] = useState(1);

    // New Job Form State
    const [showNewJobForm, setShowNewJobForm] = useState(false);
    const [newJobTitle, setNewJobTitle] = useState('');

    const activeUserJobs = useMemo(() => {
        if (!selectedUser) return [];
        const user = users.find(u => u.id === selectedUser);
        return user ? user.jobs : [];
    }, [selectedUser, users]);

    // Generate secure temp password
    const generateTempPassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    const handleInviteClient = (e) => {
        e.preventDefault();
        if (inviteCompany && inviteEmail) {
            const tempPass = generateTempPassword();
            addClientAccount(inviteCompany, inviteEmail, tempPass);
            setGeneratedPassword(tempPass);
            setInviteSuccessMsg(`Successfully invited ${inviteCompany}! Provide them the password below.`);
            setInviteCompany('');
            setInviteEmail('');

            setTimeout(() => setInviteSuccessMsg(''), 10000);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        alert("Copied to clipboard!");
    };

    const handleCreateJob = (e) => {
        e.preventDefault();
        if (selectedUser && newJobTitle) {
            addJobToAccount(selectedUser, newJobTitle, 'Admin Created', 'Normal', '', '');
            setNewJobTitle('');
            setShowNewJobForm(false);
            setSuccessMsg(`Successfully created job: "${newJobTitle}"`);
            setTimeout(() => setSuccessMsg(''), 4000);
        }
    };

    // When catalog selection changes, prepopulate the text fields
    const handleCatalogSelect = (e) => {
        const val = e.target.value;
        setSelectedCatalogId(val);

        if (val === 'custom' || val === '') {
            setChargeDesc('');
            setChargeAmount('');
        } else {
            const item = billingCatalog.find(c => c.id === val);
            if (item) {
                setChargeDesc(item.description);
                setChargeAmount(item.defaultPrice);
            }
        }
    };

    const handleAddStagedItem = (e) => {
        e.preventDefault();
        if (chargeDesc && chargeAmount && chargeQty > 0) {
            setStagedItems(prev => [
                ...prev,
                {
                    id: `draft_${Date.now()}`,
                    description: chargeDesc,
                    amount: parseFloat(chargeAmount),
                    quantity: parseInt(chargeQty, 10)
                }
            ]);

            // Reset item form
            setSelectedCatalogId('');
            setChargeDesc('');
            setChargeAmount('');
            setChargeQty(1);
        }
    };

    const removeStagedItem = (draftId) => {
        setStagedItems(prev => prev.filter(item => item.id !== draftId));
    };

    const handleBatchSubmit = () => {
        if (selectedUser && selectedJob && stagedItems.length > 0) {
            addBatchInvoiceToJob(selectedUser, selectedJob, stagedItems);
            setSuccessMsg(`Successfully billed ${stagedItems.length} items to the job.`);

            // Reset builder
            setStagedItems([]);
            setSelectedJob('');
            setTimeout(() => setSuccessMsg(''), 4000);
        }
    };

    const stagedTotal = stagedItems.reduce((acc, current) => acc + (current.amount * current.quantity), 0);

    return (
        <div>
            <div className="dashboard-topbar" style={{ borderBottomColor: 'rgba(255,0,127,0.3)' }}>
                <h2>User Account Management</h2>
                <div className="user-profile">
                    <span className="text-muted">System Administrator</span>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, #ff007f, #7000ff)' }}>S:A</div>
                </div>
            </div>

            <div className="dashboard-grid">
                {/* Advanced Invoice Builder Container */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>

                    {/* Routing selection widget */}
                    <div className="glass-panel widget">
                        <div className="widget-header">
                            <CheckCircle size={20} color="#ff007f" />
                            <span style={{ color: '#fff' }}>1. Invoice Target</span>
                        </div>
                        <div style={{ marginTop: 'var(--sp-4)' }}>
                            <div className="form-group">
                                <label className="form-label">Select Client Account</label>
                                <select
                                    className="form-control"
                                    value={selectedUser}
                                    onChange={(e) => {
                                        setSelectedUser(e.target.value);
                                        setSelectedJob('');
                                    }}
                                    style={{ appearance: 'none' }}
                                >
                                    <option value="">Select an account...</option>
                                    {users.map(u => (
                                        <option key={u.id} value={u.id}>{u.company} ({u.email})</option>
                                    ))}
                                </select>
                            </div>

                            {selectedUser && (
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Select Active Job To Bill</label>
                                    <select
                                        className="form-control"
                                        value={selectedJob}
                                        onChange={(e) => setSelectedJob(e.target.value)}
                                        style={{ appearance: 'none' }}
                                    >
                                        <option value="">Select a job...</option>
                                        {activeUserJobs.map(job => (
                                            <option key={job.id} value={job.id}>{job.title} ({job.id})</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {selectedUser && !showNewJobForm && (
                                <div style={{ marginTop: '16px' }}>
                                    <button type="button" onClick={() => setShowNewJobForm(true)} className="btn-secondary" style={{ width: '100%', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                        <Plus size={16} /> Create New Job
                                    </button>
                                </div>
                            )}

                            {selectedUser && showNewJobForm && (
                                <form onSubmit={handleCreateJob} style={{ marginTop: '16px', padding: '16px', background: 'rgba(255,0,127,0.05)', borderRadius: '8px', border: '1px solid rgba(255,0,127,0.2)' }}>
                                    <h4 style={{ color: '#fff', marginBottom: '12px', fontSize: '0.95rem' }}>Create New Job</h4>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Job Title (e.g. Network Upgrade)"
                                        value={newJobTitle}
                                        onChange={e => setNewJobTitle(e.target.value)}
                                        required
                                        style={{ marginBottom: '12px' }}
                                    />
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button type="submit" className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }}>Create</button>
                                        <button type="button" className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '0.9rem' }} onClick={() => setShowNewJobForm(false)}>Cancel</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>

                    {/* Staging Form Component */}
                    {selectedJob && (
                        <div className="glass-panel widget" style={{ borderTop: '2px solid rgba(0, 240, 255, 0.5)' }}>
                            <div className="widget-header">
                                <DollarSign size={20} color="var(--primary)" />
                                <span style={{ color: '#fff' }}>2. Stage Custom Charges</span>
                            </div>

                            <form onSubmit={handleAddStagedItem} style={{ marginTop: 'var(--sp-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Select Pre-Priced Item (Optional)</label>
                                    <select
                                        className="form-control"
                                        style={{ appearance: 'none' }}
                                        value={selectedCatalogId}
                                        onChange={handleCatalogSelect}
                                    >
                                        <option value="">-- Choose from Catalog --</option>
                                        {billingCatalog.map(item => (
                                            <option key={item.id} value={item.id}>{item.description} - ${item.defaultPrice}</option>
                                        ))}
                                        <option value="custom">-- Custom Entry --</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Line Item Description</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Hardware / Labor description..."
                                        value={chargeDesc}
                                        onChange={(e) => setChargeDesc(e.target.value)}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Unit Price (USD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="00.00"
                                            value={chargeAmount}
                                            onChange={(e) => setChargeAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ width: '100px' }}>
                                        <label className="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            className="form-control"
                                            value={chargeQty}
                                            onChange={(e) => setChargeQty(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <Plus size={18} /> Add To Staged Invoice
                                </button>
                            </form>
                        </div>
                    )}

                    {/* Pending Staged Invoice List */}
                    {stagedItems.length > 0 && (
                        <div className="glass-panel widget" style={{ background: 'rgba(255, 0, 127, 0.05)', borderColor: 'rgba(255, 0, 127, 0.2)' }}>
                            <div className="widget-header border-bottom pb-3" style={{ marginBottom: 'var(--sp-4)' }}>
                                <span style={{ color: '#fff', fontWeight: 'bold' }}>3. Review & Submit Invoice</span>
                            </div>

                            <div style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: 'var(--sp-4)' }}>
                                <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                    <tbody>
                                        {stagedItems.map(item => (
                                            <tr key={item.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                                                <td style={{ padding: '8px 4px', color: '#e0e0e0', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.quantity}x {item.description}
                                                </td>
                                                <td style={{ padding: '8px 4px', textAlign: 'right', color: '#fff', width: '80px' }}>
                                                    ${(item.amount * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                                <td style={{ padding: '8px 4px', width: '30px', textAlign: 'right' }}>
                                                    <button
                                                        onClick={() => removeStagedItem(item.id)}
                                                        style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)', fontWeight: 'bold' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Staged Total:</span>
                                <span style={{ color: '#ff007f', fontSize: '1.2rem' }}>${stagedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <button onClick={handleBatchSubmit} className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #ff007f, #7000ff)' }}>
                                Commit Final Invoice
                            </button>
                        </div>
                    )}

                    {successMsg && <div style={{ color: '#00ff64', fontSize: '0.875rem', textAlign: 'center', padding: '12px', background: 'rgba(0, 255, 100, 0.1)', borderRadius: '8px' }}>{successMsg}</div>}
                </div>

                {/* Right Column: Invite Tool + User Table Summary */}
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>

                    {/* Invite Client Widget */}
                    <div className="glass-panel" style={{ padding: 'var(--sp-6)', borderColor: 'rgba(0, 255, 100, 0.2)' }}>
                        <div className="widget-header">
                            <KeyRound size={20} color="#00ff64" />
                            <span style={{ color: '#fff' }}>Invite New Client</span>
                        </div>

                        <form onSubmit={handleInviteClient} style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-4)', alignItems: 'flex-end' }}>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label">Company Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Wayne Enterprises"
                                    value={inviteCompany}
                                    onChange={(e) => setInviteCompany(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                                <label className="form-label">Primary Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    placeholder="bruce@wayne.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <button type="submit" className="btn-secondary" style={{ height: '42px', padding: '0 24px', background: 'rgba(0, 255, 100, 0.1)', color: '#00ff64', borderColor: 'rgba(0, 255, 100, 0.3)' }}>
                                Provision
                            </button>
                        </form>

                        {generatedPassword && (
                            <div style={{ marginTop: 'var(--sp-4)', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 100, 0.2)' }}>
                                <div style={{ color: '#00ff64', fontSize: 'var(--text-sm)', marginBottom: '8px' }}>
                                    {inviteSuccessMsg}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <span className="text-muted" style={{ marginRight: '8px' }}>Temporary Password:</span>
                                        <code style={{ background: '#000', padding: '4px 8px', borderRadius: '4px', color: '#fff', fontSize: '1.1rem', letterSpacing: '1px' }}>
                                            {generatedPassword}
                                        </code>
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(generatedPassword)}
                                        style={{ background: 'none', border: 'none', color: '#00b3ff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <Copy size={16} /> Copy
                                    </button>
                                </div>
                                <div style={{ fontSize: 'var(--text-xs)', color: '#ff4444', marginTop: '8px' }}>
                                    * The client will be forced to reset this password upon their first login.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Active Directory Widget */}
                    <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
                        <div className="widget-header">
                            <Users size={20} color="#ff007f" />
                            <span style={{ color: '#fff' }}>Active Client Directory</span>
                        </div>

                        <div style={{ marginTop: 'var(--sp-4)', overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                        <th style={{ padding: '12px' }}>Company</th>
                                        <th style={{ padding: '12px' }}>Email Contact</th>
                                        <th style={{ padding: '12px' }}>Active Jobs</th>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>Current Balance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => {
                                        const computedBalance = calculateUserBalance(u);
                                        return (
                                            <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td style={{ padding: '12px', fontWeight: '500', color: '#fff' }}>{u.company}</td>
                                                <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{u.email}</td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{ background: 'rgba(0, 240, 255, 0.1)', padding: '4px 8px', borderRadius: '4px', color: 'var(--primary)' }}>
                                                        {u.jobs.length} Jobs
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: computedBalance > 0 ? '#ff007f' : '#00ff64' }}>
                                                    ${computedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserManager;
