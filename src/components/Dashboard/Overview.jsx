import React, { useContext } from 'react';
import { DollarSign, Clock, CheckCircle, Activity } from 'lucide-react';
import { AdminContext, calculateUserBalance } from '../../AdminContext';
import ClientAvatarDropdown from '../Client/ClientAvatarDropdown';

const Overview = () => {
    const { users, loggedInUserId } = useContext(AdminContext);

    // Find the currently logged in user
    const loggedInUser = users.find(u => u.id === loggedInUserId);
    const computedBalance = loggedInUser ? calculateUserBalance(loggedInUser) : 0;

    // Mock Data
    const jobs = loggedInUser ? loggedInUser.jobs : [];

    return (
        <div>
            <div className="dashboard-topbar">
                <h2>Client Dashboard Overview</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                    <span className="text-muted">Welcome back, {loggedInUser?.company}.</span>
                    <ClientAvatarDropdown />
                </div>
            </div>

            {/* Widgets Grid */}
            <div className="dashboard-grid">
                <div className="widget glass-panel">
                    <div className="widget-header">
                        <DollarSign size={20} />
                        <span>Currently Owed Balance</span>
                    </div>
                    <div className="widget-value">
                        ${computedBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>USD</span>
                    </div>
                    <button className="btn-primary" style={{ marginTop: 'var(--sp-4)', width: '100%', padding: 'var(--sp-2)' }}>Pay Invoice</button>
                </div>

                <div className="widget glass-panel">
                    <div className="widget-header">
                        <Activity size={20} />
                        <span>Active Projects</span>
                    </div>
                    <div className="widget-value">
                        {jobs.filter(j => j.status !== 'Completed').length} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>Ongoing</span>
                    </div>
                    <p className="text-muted" style={{ marginTop: 'var(--sp-2)', fontSize: 'var(--text-sm)' }}>Estimated completion for next project: 4 Days</p>
                </div>
            </div>

            {/* Job Tracker */}
            <div className="job-tracker">
                <h3 style={{ marginBottom: 'var(--sp-4)' }}>Recent Job Progress</h3>

                {jobs.map(job => (
                    <div className="job-item" key={job.id}>
                        <div className="job-info">
                            <h4>{job.title}</h4>
                            <div className="job-meta">
                                <span>{job.id}</span>
                                <span>Started: {job.date}</span>
                            </div>
                        </div>

                        <div className="job-status-col" style={{ textAlign: 'right' }}>
                            <span className={`status-badge status-${job.status.toLowerCase()}`}>{job.status}</span>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${job.progress}%` }}></div>
                            </div>
                        </div>
                    </div>
                ))}

            </div>
        </div>
    );
};

export default Overview;
