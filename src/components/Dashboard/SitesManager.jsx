import React, { useContext, useState } from 'react';
import { AdminContext } from '../../AdminContext';
import { Building2, MapPin, Plus, Trash2, Building } from 'lucide-react';

const SitesManager = () => {
    const { users, loggedInUserId, addSiteToAccount, deleteSiteFromAccount } = useContext(AdminContext);
    const loggedInUser = users.find(u => u.id === loggedInUserId);
    const sites = loggedInUser?.sites || [];

    const [isAdding, setIsAdding] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [location, setLocation] = useState('');

    const handleAddSite = async (e) => {
        e.preventDefault();
        if (companyName && location) {
            await addSiteToAccount(loggedInUser.id, companyName, location);
            setCompanyName('');
            setLocation('');
            setIsAdding(false);
        }
    };

    return (
        <div>
            <div className="dashboard-topbar">
                <h2>My Sites & Locations</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                    <span className="text-muted">{loggedInUser?.company}</span>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 'var(--sp-6)', marginBottom: 'var(--sp-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-6)' }}>
                    <p className="text-muted" style={{ margin: 0, maxWidth: '600px' }}>
                        Manage the business names and physical locations associated with your account. You can select these sites when requesting new IT services.
                    </p>
                    {!isAdding && (
                        <button className="btn-primary" onClick={() => setIsAdding(true)} style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> Add New Site
                        </button>
                    )}
                </div>

                {isAdding && (
                    <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(0, 255, 100, 0.2)', padding: 'var(--sp-6)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--sp-6)' }}>
                        <h3 style={{ color: '#fff', marginBottom: 'var(--sp-4)', fontSize: '1.1rem' }}>Register New Location</h3>
                        <form onSubmit={handleAddSite} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-4)' }}>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Business / Company Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. AllTek North Branch"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Physical Address</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="e.g. 123 Corporate Blvd, Suite 400"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    required
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--sp-4)', marginTop: 'var(--sp-2)' }}>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Site</button>
                                <button type="button" className="btn-secondary" style={{ flex: 1 }} onClick={() => setIsAdding(false)}>Cancel</button>
                            </div>
                        </form>
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--sp-4)' }}>
                    {/* Default Base Account Profile as the "Primary Site" implicitly */}
                    <div className="job-card" style={{ border: '1px solid rgba(0, 179, 255, 0.3)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                                <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Building2 size={18} color="#00b3ff" />
                                    {loggedInUser?.company}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                    <MapPin size={14} />
                                    Primary HQ
                                </div>
                            </div>
                            <div style={{ background: 'rgba(0, 179, 255, 0.1)', color: '#00b3ff', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Default</div>
                        </div>
                    </div>

                    {/* Additional dynamically added sites */}
                    {sites.map(site => (
                        <div key={site.id} className="job-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Building size={18} color="#00ff64" />
                                        {site.companyName}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                        <MapPin size={14} />
                                        {site.location}
                                    </div>
                                </div>
                                <button
                                    onClick={() => deleteSiteFromAccount(loggedInUser.id, site.id)}
                                    className="btn-secondary"
                                    style={{ padding: '6px', border: 'none', background: 'rgba(255, 0, 127, 0.1)', color: '#ff007f' }}
                                    title="Delete Site"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SitesManager;
