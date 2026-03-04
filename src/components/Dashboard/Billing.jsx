import React, { useContext, useState } from 'react';
import { AdminContext, calculateUserBalance } from '../../AdminContext';
import { FileText, ChevronDown, ChevronRight, DollarSign } from 'lucide-react';
import ClientAvatarDropdown from '../Client/ClientAvatarDropdown';

const Billing = () => {
    const { users, loggedInUserId } = useContext(AdminContext);
    const loggedInUser = users.find(u => u.id === loggedInUserId);
    const [expandedJobs, setExpandedJobs] = useState({});

    // Toggle job row expansion
    const toggleJob = (jobId) => {
        setExpandedJobs(prev => ({
            ...prev,
            [jobId]: !prev[jobId]
        }));
    };

    if (!loggedInUser) return <div>Loading...</div>;

    const totalBalance = calculateUserBalance(loggedInUser);

    return (
        <div>
            <div className="dashboard-topbar" style={{ borderBottomColor: 'rgba(0, 240, 255, 0.3)' }}>
                <h2>Invoices & Itemized Billing</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                    <div className="user-profile" style={{ marginRight: '8px' }}>
                        <span className="text-muted">Currently Owed:</span>
                        <span style={{ color: '#ff007f', fontWeight: 'bold' }}>
                            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    <ClientAvatarDropdown />
                </div>
            </div>

            <div className="glass-panel" style={{ marginTop: 'var(--sp-6)', padding: 'var(--sp-6)' }}>
                <div className="widget-header" style={{ marginBottom: 'var(--sp-4)' }}>
                    <FileText size={20} color="var(--primary)" />
                    <span style={{ color: '#fff' }}>Billing History & Active Work Orders</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '12px', width: '40px' }}></th>
                                <th style={{ padding: '12px' }}>Job ID</th>
                                <th style={{ padding: '12px' }}>Description</th>
                                <th style={{ padding: '12px' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>Total Job Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loggedInUser.jobs.map(job => {
                                const jobTotal = job.lineItems.reduce((sum, item) => sum + item.amount, 0);
                                const isExpanded = expandedJobs[job.id];

                                return (
                                    <React.Fragment key={job.id}>
                                        {/* Main Job Row */}
                                        <tr
                                            onClick={() => toggleJob(job.id)}
                                            style={{
                                                borderBottom: isExpanded ? 'none' : '1px solid rgba(255,255,255,0.05)',
                                                cursor: 'pointer',
                                                background: isExpanded ? 'rgba(0, 240, 255, 0.05)' : 'transparent',
                                                transition: 'background 0.2s'
                                            }}
                                            className="job-row-hover"
                                        >
                                            <td style={{ padding: '12px', color: 'var(--primary)' }}>
                                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                                            </td>
                                            <td style={{ padding: '12px', fontWeight: '500', color: '#fff' }}>{job.id}</td>
                                            <td style={{ padding: '12px', color: 'var(--text-muted)' }}>{job.title}</td>
                                            <td style={{ padding: '12px' }}>
                                                <span className={`status-badge status-${job.status.toLowerCase()}`}>{job.status}</span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600', color: jobTotal > 0 ? '#ff007f' : '#00ff64' }}>
                                                ${jobTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                            </td>
                                        </tr>

                                        {/* Expanded Itemized Rows */}
                                        {isExpanded && (
                                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                <td colSpan="5" style={{ padding: '0 0 24px 0' }}>
                                                    <div style={{ background: 'rgba(0,0,0,0.3)', padding: 'var(--sp-4)', margin: '0 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                                        <h4 style={{ marginBottom: '12px', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <DollarSign size={14} /> Itemized Charges
                                                        </h4>

                                                        {job.lineItems.length === 0 ? (
                                                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontStyle: 'italic' }}>No charges posted to this job yet.</p>
                                                        ) : (
                                                            <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                                                <tbody>
                                                                    {job.lineItems.map(item => (
                                                                        <tr key={item.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                                                                            <td style={{ padding: '8px 4px', color: '#e0e0e0' }}>{item.description}</td>
                                                                            <td style={{ padding: '8px 4px', color: 'var(--text-muted)', width: '120px' }}>{item.dateAdded}</td>
                                                                            <td style={{ padding: '8px 4px', textAlign: 'right', color: '#fff' }}>
                                                                                ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Billing;
