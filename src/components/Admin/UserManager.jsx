import React, { useContext, useState } from 'react';
import { AdminContext, calculateUserBalance } from '../../AdminContext';
import { Users, KeyRound, Copy, Building, MapPin, Edit2, Save, X, ChevronDown, ChevronRight, Briefcase } from 'lucide-react';

const UserManager = () => {
    const { users, addClientAccount, updateSiteDetails, addSiteToAccount, addEmployeeToClient, updateClientProfile } = useContext(AdminContext);

    // Invite Client Form State
    const [inviteCompany, setInviteCompany] = useState('');
    const [inviteEmail, setInviteEmail] = useState('');
    const [generatedPassword, setGeneratedPassword] = useState('');
    const [inviteSuccessMsg, setInviteSuccessMsg] = useState('');

    const [expandedClientId, setExpandedClientId] = useState(null);

    // HQ Editing State
    const [editingHqId, setEditingHqId] = useState(null);
    const [editHqCompany, setEditHqCompany] = useState('');
    const [editHqEmail, setEditHqEmail] = useState('');
    const [isSavingHq, setIsSavingHq] = useState(false);

    // Site Editing State
    const [editingSiteId, setEditingSiteId] = useState(null);
    const [editSiteName, setEditSiteName] = useState('');
    const [editSiteLocation, setEditSiteLocation] = useState('');
    const [editSiteTax, setEditSiteTax] = useState('');
    const [isSavingSite, setIsSavingSite] = useState(false);

    // New Site State
    const [newSiteName, setNewSiteName] = useState('');
    const [newSiteLocation, setNewSiteLocation] = useState('');
    const [newSiteTax, setNewSiteTax] = useState('');
    const [addingSiteToClientId, setAddingSiteToClientId] = useState(null);

    // New Employee State
    const [newEmpName, setNewEmpName] = useState('');
    const [newEmpEmail, setNewEmpEmail] = useState('');
    const [addingEmpToClientId, setAddingEmpToClientId] = useState(null);
    const [empSuccessMsg, setEmpSuccessMsg] = useState('');

    // Grouping
    const masterClients = users.filter(u => !u.parentClientId);

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

    const toggleExpandClient = (clientId) => {
        if (expandedClientId === clientId) {
            setExpandedClientId(null);
        } else {
            setExpandedClientId(clientId);
            setEditingSiteId(null);
            setEditingHqId(null);
        }
    };

    const startEditingSite = (site) => {
        setEditingSiteId(site.id);
        setEditSiteName(site.companyName || '');
        setEditSiteLocation(site.location || '');
        setEditSiteTax(site.taxRate || 0);
    };

    const cancelEditingSite = () => {
        setEditingSiteId(null);
        setEditSiteName('');
        setEditSiteLocation('');
        setEditSiteTax('');
    };

    const saveHqDetails = async (clientId) => {
        setIsSavingHq(true);
        await updateClientProfile(clientId, editHqCompany, editHqEmail);
        setIsSavingHq(false);
        setEditingHqId(null);
    };

    const saveSiteDetails = async (clientId, siteId) => {
        setIsSavingSite(true);
        await updateSiteDetails(clientId, siteId, editSiteName, editSiteLocation, editSiteTax);
        setIsSavingSite(false);
        setEditingSiteId(null);
    };

    const handleAddSite = async (e, clientId) => {
        e.preventDefault();
        setIsSavingSite(true);
        await addSiteToAccount(clientId, newSiteName, newSiteLocation, newSiteTax);
        setNewSiteName('');
        setNewSiteLocation('');
        setNewSiteTax('');
        setAddingSiteToClientId(null);
        setIsSavingSite(false);
    };

    const handleAddEmployee = async (e, clientId, allowedSites) => {
        e.preventDefault();
        // Pre-approve all existing sites for the admin-created employee to simplify onboarding
        const siteIds = allowedSites.map(s => s.id);
        const permissions = {
            allowedSites: siteIds,
            canRequestJobs: true,
            canViewInvoices: false
        };
        const tempPass = generateTempPassword();
        const res = await addEmployeeToClient(clientId, newEmpName, newEmpEmail, tempPass, permissions);

        if (res.success) {
            setGeneratedPassword(tempPass);
            setEmpSuccessMsg(`Created ${newEmpName}! Temporary Password below.`);
            setNewEmpName('');
            setNewEmpEmail('');
            setAddingEmpToClientId(null);
            setTimeout(() => setEmpSuccessMsg(''), 10000);
        } else {
            alert('Failed to create sub-account: ' + res.error?.message);
        }
    };

    return (
        <div>
            <div className="dashboard-topbar" style={{ borderBottomColor: 'rgba(255,0,127,0.3)' }}>
                <h2>Client Directory & Access</h2>
                <div className="user-profile">
                    <span className="text-muted">System Administrator</span>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, #ff007f, #7000ff)' }}>S:A</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 'var(--sp-6)', marginTop: 'var(--sp-6)' }}>
                {/* Invite Client Widget */}
                <div className="glass-panel widget" style={{ padding: 'var(--sp-6)', borderColor: 'rgba(0, 255, 100, 0.2)' }}>
                    <div className="widget-header">
                        <KeyRound size={20} color="#00ff64" />
                        <span style={{ color: '#fff' }}>Provision Master Client Account</span>
                    </div>

                    <form onSubmit={handleInviteClient} style={{ marginTop: 'var(--sp-4)', display: 'flex', gap: 'var(--sp-4)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                        <div className="form-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
                            <label className="form-label">Client Company Name</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Wayne Enterprises"
                                value={inviteCompany}
                                onChange={(e) => setInviteCompany(e.target.value)}
                                required
                            />
                        </div>
                        <div className="form-group" style={{ flex: 1, minWidth: '250px', marginBottom: 0 }}>
                            <label className="form-label">Primary Admin Email</label>
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
                            Provision Access
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

                {/* Hierarchical Client Directory */}
                <div className="glass-panel" style={{ padding: 'var(--sp-4)' }}>
                    <div className="widget-header" style={{ marginBottom: 'var(--sp-4)', padding: '0 var(--sp-2)' }}>
                        <Users size={20} color="#ff007f" />
                        <span style={{ color: '#fff' }}>Master Account Directory</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {masterClients.map(client => {
                            const isExpanded = expandedClientId === client.id;
                            const subEmployees = users.filter(u => u.parentClientId === client.id);
                            const balance = calculateUserBalance(client);
                            const sites = client.sites || [];

                            return (
                                <div key={client.id} style={{ background: isExpanded ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.3s ease' }}>

                                    {/* Root Node Header */}
                                    <div
                                        onClick={() => toggleExpandClient(client.id)}
                                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', cursor: 'pointer', userSelect: 'none' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ color: isExpanded ? '#ff007f' : 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                                                {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                            </div>
                                            <div>
                                                <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <Building size={16} color="var(--primary)" /> {client.company}
                                                </div>
                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{client.email}</div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Locations</div>
                                                <div style={{ color: '#00b3ff', fontWeight: '600' }}>1 HQ + {sites.length} Sites</div>
                                            </div>
                                            <div style={{ textAlign: 'center' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Employees</div>
                                                <div style={{ color: '#00ff64', fontWeight: '600' }}>{subEmployees.length} Linked</div>
                                            </div>
                                            <div style={{ textAlign: 'right', minWidth: '100px' }}>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Balance</div>
                                                <div style={{ color: balance > 0 ? '#ff007f' : '#00ff64', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                                    ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Nested Details Body */}
                                    {isExpanded && (
                                        <div style={{ padding: '0 16px 16px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>

                                            {/* Sites Matrix */}
                                            <div style={{ marginTop: '16px' }}>
                                                <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>Registered Sites</h4>

                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
                                                    {/* Primary HQ Always Exhibited */}
                                                    <div style={{ background: 'rgba(0,179,255,0.05)', border: '1px solid rgba(0,179,255,0.2)', padding: '12px', borderRadius: '6px' }}>
                                                        {editingHqId === client.id ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <input type="text" className="form-control" style={{ padding: '6px 8px', fontSize: '0.9rem' }} placeholder="Company Name" value={editHqCompany} onChange={e => setEditHqCompany(e.target.value)} />
                                                                <input type="email" className="form-control" style={{ padding: '6px 8px', fontSize: '0.9rem' }} placeholder="Admin Email" value={editHqEmail} onChange={e => setEditHqEmail(e.target.value)} />
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                                                                    <button onClick={() => saveHqDetails(client.id)} className="btn-primary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }} disabled={isSavingHq}>
                                                                        <Save size={14} /> {isSavingHq ? 'Saving' : 'Save'}
                                                                    </button>
                                                                    <button onClick={() => setEditingHqId(null)} className="btn-secondary" style={{ padding: '6px' }}>
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00b3ff', fontWeight: 'bold', marginBottom: '6px' }}>
                                                                        <MapPin size={16} /> {client.company} (Primary HQ)
                                                                    </div>
                                                                    <button onClick={() => { setEditingHqId(client.id); setEditHqCompany(client.company); setEditHqEmail(client.email); }} style={{ background: 'none', border: 'none', color: '#00b3ff', cursor: 'pointer', padding: '4px' }}>
                                                                        <Edit2 size={14} />
                                                                    </button>
                                                                </div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>{client.email}</div>
                                                                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Default Routing Node</div>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Registered Sites */}
                                                    {sites.map(site => (
                                                        <div key={site.id} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '6px', position: 'relative' }}>
                                                            {editingSiteId === site.id ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                    <input type="text" className="form-control" style={{ padding: '6px 8px', fontSize: '0.9rem' }} placeholder="Site Tag (e.g. Store #4)" value={editSiteName} onChange={e => setEditSiteName(e.target.value)} />
                                                                    <input type="text" className="form-control" style={{ padding: '6px 8px', fontSize: '0.9rem' }} placeholder="123 Example Ave" value={editSiteLocation} onChange={e => setEditSiteLocation(e.target.value)} />
                                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                        <input type="number" step="0.01" className="form-control" style={{ padding: '6px 8px', fontSize: '0.9rem', flex: 1 }} placeholder="Tax %" value={editSiteTax} onChange={e => setEditSiteTax(e.target.value)} />
                                                                        <button onClick={() => saveSiteDetails(client.id, site.id)} className="btn-primary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }} disabled={isSavingSite}>
                                                                            <Save size={14} /> {isSavingSite ? 'Saving' : 'Save'}
                                                                        </button>
                                                                        <button onClick={cancelEditingSite} className="btn-secondary" style={{ padding: '6px' }}>
                                                                            <X size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontWeight: '500', marginBottom: '6px' }}>
                                                                            <MapPin size={16} color="var(--primary)" /> {site.companyName}
                                                                        </div>
                                                                        <button onClick={() => startEditingSite(site)} style={{ background: 'none', border: 'none', color: '#00b3ff', cursor: 'pointer', padding: '4px' }}>
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>{site.location}</div>
                                                                    <div style={{ fontSize: '0.8rem', color: site.taxRate > 0 ? 'orange' : 'var(--text-muted)' }}>
                                                                        Sales Tax: {site.taxRate > 0 ? `${site.taxRate}%` : 'Exempt (0%)'}
                                                                    </div>
                                                                </>
                                                            )}
                                                        </div>
                                                    ))}

                                                    {/* Add Site Button / Form */}
                                                    {addingSiteToClientId === client.id ? (
                                                        <div style={{ background: 'rgba(0, 255, 100, 0.05)', border: '1px solid rgba(0, 255, 100, 0.2)', padding: '12px', borderRadius: '6px' }}>
                                                            <form onSubmit={(e) => handleAddSite(e, client.id)} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                                <input type="text" className="form-control" style={{ padding: '6px 8px', fontSize: '0.9rem' }} placeholder="Location Name" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} required />
                                                                <input type="text" className="form-control" style={{ padding: '6px 8px', fontSize: '0.9rem' }} placeholder="Physical Address" value={newSiteLocation} onChange={e => setNewSiteLocation(e.target.value)} required />
                                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                                    <input type="number" step="0.01" className="form-control" style={{ padding: '6px 8px', fontSize: '0.9rem', flex: 1 }} placeholder="Tax % (Optional)" value={newSiteTax} onChange={e => setNewSiteTax(e.target.value)} />
                                                                    <button type="submit" className="btn-primary" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem' }} disabled={isSavingSite}>
                                                                        <Save size={14} /> Create
                                                                    </button>
                                                                    <button type="button" onClick={() => setAddingSiteToClientId(null)} className="btn-secondary" style={{ padding: '6px' }}>
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => setAddingSiteToClientId(client.id)}
                                                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.2)', color: 'var(--text-muted)', cursor: 'pointer', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', transition: 'all 0.2s ease', ':hover': { borderColor: '#00b3ff', color: '#00b3ff' } }}
                                                        >
                                                            + Provision New Site
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Sub Employees List */}
                                            <div style={{ marginTop: '24px' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '4px' }}>
                                                    <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>Linked Sub-Employees</h4>
                                                    {!addingEmpToClientId && (
                                                        <button
                                                            onClick={() => setAddingEmpToClientId(client.id)}
                                                            style={{ background: 'none', border: 'none', color: '#00ff64', fontSize: '0.8rem', cursor: 'pointer' }}
                                                        >
                                                            + Provision Employee
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Add Employee Inline Form */}
                                                {addingEmpToClientId === client.id && (
                                                    <div style={{ background: 'rgba(0, 255, 100, 0.05)', border: '1px solid rgba(0, 255, 100, 0.2)', padding: '16px', borderRadius: '6px', marginBottom: '16px' }}>
                                                        <form onSubmit={(e) => handleAddEmployee(e, client.id, sites)} style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                                            <div className="form-group" style={{ flex: 1, minWidth: '150px', marginBottom: 0 }}>
                                                                <input type="text" className="form-control" style={{ padding: '8px', fontSize: '0.9rem' }} placeholder="Employee Name" value={newEmpName} onChange={e => setNewEmpName(e.target.value)} required />
                                                            </div>
                                                            <div className="form-group" style={{ flex: 1.5, minWidth: '200px', marginBottom: 0 }}>
                                                                <input type="email" className="form-control" style={{ padding: '8px', fontSize: '0.9rem' }} placeholder="Corporate Email Login" value={newEmpEmail} onChange={e => setNewEmpEmail(e.target.value)} required />
                                                            </div>
                                                            <button type="submit" className="btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', height: '37px' }}>
                                                                <Save size={14} /> Create Employee
                                                            </button>
                                                            <button type="button" onClick={() => setAddingEmpToClientId(null)} className="btn-secondary" style={{ padding: '8px', height: '37px' }}>
                                                                <X size={14} />
                                                            </button>
                                                        </form>
                                                    </div>
                                                )}

                                                {/* Employee Success / Temporary Password Card */}
                                                {(empSuccessMsg && addingEmpToClientId === null) && (
                                                    <div style={{ marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-4)', background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(0, 255, 100, 0.2)' }}>
                                                        <div style={{ color: '#00ff64', fontSize: 'var(--text-sm)', marginBottom: '8px' }}>
                                                            {empSuccessMsg}
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
                                                    </div>
                                                )}

                                                {subEmployees.length > 0 ? (
                                                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                                                        <thead>
                                                            <tr style={{ color: 'var(--text-muted)' }}>
                                                                <th style={{ padding: '8px' }}>Name / Dept</th>
                                                                <th style={{ padding: '8px' }}>Email Login</th>
                                                                <th style={{ padding: '8px', textAlign: 'right' }}>Allowed Sites</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {subEmployees.map(emp => (
                                                                <tr key={emp.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                    <td style={{ padding: '8px', color: '#fff' }}><Briefcase size={14} style={{ display: 'inline', marginRight: '6px', color: '#00ff64' }} />{emp.company}</td>
                                                                    <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{emp.email}</td>
                                                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                                                        <span style={{ background: 'rgba(0, 255, 100, 0.1)', color: '#00ff64', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>
                                                                            {emp.permissions?.allowedSites?.length || 0} Routes
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                ) : (
                                                    <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontStyle: 'italic', fontSize: '0.8rem' }}>
                                                        No sub-employees linked to this master account.
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    )}

                                </div>
                            );
                        })}

                        {masterClients.length === 0 && (
                            <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)', fontStyle: 'italic', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
                                No clients provisioned yet. Use the Invite widget above to generate the first account.
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UserManager;
