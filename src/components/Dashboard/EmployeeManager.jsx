import React, { useContext, useState } from 'react';
import { AdminContext } from '../../AdminContext';
import { Users, UserPlus, Shield, MapPin, CheckSquare, Square } from 'lucide-react';

const EmployeeManager = () => {
    const { users, loggedInUserId, addEmployeeToClient } = useContext(AdminContext);
    const loggedInUser = users.find(u => u.id === loggedInUserId);

    // An employee can't access this page, but just in case:
    if (loggedInUser?.parentClientId) return <div style={{ color: 'white', padding: '20px' }}>Access Denied. Only Primary Account Holders can manage employees.</div>;

    const employees = users.filter(u => u.parentClientId === loggedInUserId);
    const sites = loggedInUser?.sites || [];

    const [isAdding, setIsAdding] = useState(false);
    const [empName, setEmpName] = useState('');
    const [empEmail, setEmpEmail] = useState('');
    const [empPassword, setEmpPassword] = useState('');

    // Permission states
    const [canRequestJobs, setCanRequestJobs] = useState(true);
    const [canViewBilling, setCanViewBilling] = useState(false);

    // We store allowed site IDs in an array. 
    // By default, let's select all. The Primary HQ doesn't have an ID in the sites array, it's just the default.
    // Let's use a magic string 'primary-hq' for the main location.
    const [allowedSites, setAllowedSites] = useState(['primary-hq', ...sites.map(s => s.id)]);

    const toggleSite = (siteId) => {
        if (allowedSites.includes(siteId)) {
            setAllowedSites(allowedSites.filter(id => id !== siteId));
        } else {
            setAllowedSites([...allowedSites, siteId]);
        }
    };

    const handleAddEmployee = async (e) => {
        e.preventDefault();

        const permissions = {
            canRequestJobs,
            canViewBilling,
            allowedSites
        };

        const res = await addEmployeeToClient(loggedInUser.id, empName, empEmail, empPassword, permissions);
        if (res.success) {
            setIsAdding(false);
            setEmpName('');
            setEmpEmail('');
            setEmpPassword('');
            setCanRequestJobs(true);
            setCanViewBilling(false);
            setAllowedSites(['primary-hq', ...sites.map(s => s.id)]);
        } else {
            alert("Error creating employee: " + res.error?.message);
        }
    };

    return (
        <div>
            <div className="dashboard-topbar">
                <h2>Team / Employees</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                    <span className="text-muted">{loggedInUser?.company}</span>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-6)' }}>
                    <p className="text-muted" style={{ margin: 0, maxWidth: '600px' }}>
                        Create sub-accounts for your team members. You can precisely control which locations they can manage and whether they have access to billing information.
                    </p>
                    {!isAdding && (
                        <button className="btn-primary" onClick={() => setIsAdding(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <UserPlus size={18} /> Add Employee
                        </button>
                    )}
                </div>

                {isAdding && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(0, 255, 100, 0.2)', padding: 'var(--sp-6)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--sp-6)' }}>
                        <h3 style={{ color: '#fff', marginBottom: 'var(--sp-4)', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Shield size={20} color="#00ff64" /> Register Employee Access
                        </h3>
                        <form onSubmit={handleAddEmployee} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--sp-4)' }}>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Employee Full Name</label>
                                    <input type="text" className="form-control" placeholder="Jane Doe" value={empName} onChange={(e) => setEmpName(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Email Address (Login)</label>
                                    <input type="email" className="form-control" placeholder="jane@company.com" value={empEmail} onChange={(e) => setEmpEmail(e.target.value)} required />
                                </div>
                                <div className="form-group" style={{ marginBottom: 0 }}>
                                    <label className="form-label">Temporary Password</label>
                                    <input type="text" className="form-control" placeholder="TempPass123!" value={empPassword} onChange={(e) => setEmpPassword(e.target.value)} required />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-6)', background: 'rgba(0,0,0,0.2)', padding: 'var(--sp-4)', borderRadius: '8px' }}>
                                {/* Action Permissions */}
                                <div>
                                    <h4 style={{ color: '#fff', marginBottom: '12px', fontSize: '0.95rem' }}>Allowed Actions</h4>

                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px', color: canRequestJobs ? '#fff' : 'var(--text-muted)' }}
                                        onClick={() => setCanRequestJobs(!canRequestJobs)}
                                    >
                                        {canRequestJobs ? <CheckSquare color="#00ff64" size={20} /> : <Square color="var(--text-muted)" size={20} />}
                                        <span style={{ fontSize: '0.95rem' }}>Request IT Service Jobs</span>
                                    </div>

                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', color: canViewBilling ? '#fff' : 'var(--text-muted)' }}
                                        onClick={() => setCanViewBilling(!canViewBilling)}
                                    >
                                        {canViewBilling ? <CheckSquare color="#00ff64" size={20} /> : <Square color="var(--text-muted)" size={20} />}
                                        <span style={{ fontSize: '0.95rem' }}>View Billing & Invoices</span>
                                    </div>
                                </div>

                                {/* Site Permissions */}
                                <div>
                                    <h4 style={{ color: '#fff', marginBottom: '12px', fontSize: '0.95rem' }}>Allowed Locations (Sites)</h4>

                                    <div
                                        style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px', color: allowedSites.includes('primary-hq') ? '#fff' : 'var(--text-muted)' }}
                                        onClick={() => toggleSite('primary-hq')}
                                    >
                                        {allowedSites.includes('primary-hq') ? <CheckSquare color="#00b3ff" size={20} /> : <Square color="var(--text-muted)" size={20} />}
                                        <span style={{ fontSize: '0.95rem' }}>{loggedInUser?.company} (Primary HQ)</span>
                                    </div>

                                    {sites.map(site => (
                                        <div
                                            key={site.id}
                                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', marginBottom: '8px', color: allowedSites.includes(site.id) ? '#fff' : 'var(--text-muted)' }}
                                            onClick={() => toggleSite(site.id)}
                                        >
                                            {allowedSites.includes(site.id) ? <CheckSquare color="#00b3ff" size={20} /> : <Square color="var(--text-muted)" size={20} />}
                                            <span style={{ fontSize: '0.95rem' }}>{site.companyName} - {site.location}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: 'var(--sp-4)', marginTop: 'var(--sp-2)' }}>
                                <button type="submit" className="btn-primary" style={{ width: '200px' }}>Create Employee</button>
                                <button type="button" className="btn-secondary" style={{ width: '150px' }} onClick={() => setIsAdding(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 'var(--sp-4)' }}>
                    {employees.map(emp => (
                        <div key={emp.id} className="job-card" style={{ border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #00b3ff, #00ff64)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontWeight: 'bold' }}>
                                    {emp.company.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '4px' }}>{emp.company}</h3>
                                    <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '12px' }}>{emp.email}</p>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {emp.permissions?.canRequestJobs && (
                                            <span style={{ background: 'rgba(0, 255, 100, 0.1)', color: '#00ff64', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Can Request Jobs</span>
                                        )}
                                        {emp.permissions?.canViewBilling && (
                                            <span style={{ background: 'rgba(0, 179, 255, 0.1)', color: '#00b3ff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>Can View Billing</span>
                                        )}
                                        <span style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#ccc', padding: '4px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                                            {(emp.permissions?.allowedSites || []).length} Sites Allowed
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {employees.length === 0 && !isAdding && (
                        <div className="text-muted" style={{ padding: '20px', textAlign: 'center', gridColumn: '1 / -1', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                            You have not added any sub-accounts to your team yet.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default EmployeeManager;
