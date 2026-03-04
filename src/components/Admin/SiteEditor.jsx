import React, { useContext, useState } from 'react';
import { AdminContext } from '../../AdminContext';
import { Save } from 'lucide-react';

const SiteEditor = () => {
    const { siteData, updateSiteData } = useContext(AdminContext);
    const [saveStatus, setSaveStatus] = useState('');

    const handleChange = (e, key) => {
        updateSiteData('hero', key, e.target.value);
    };

    const handleSave = (e) => {
        e.preventDefault();
        setSaveStatus('Site Data Saved!');
        setTimeout(() => setSaveStatus(''), 2000);
    }

    return (
        <div>
            <div className="dashboard-topbar" style={{ borderBottomColor: 'rgba(255,0,127,0.3)' }}>
                <h2>Site Text Editor</h2>
                <div className="user-profile">
                    <span className="text-muted">System Administrator</span>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, #ff007f, #7000ff)' }}>S:A</div>
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 'var(--sp-8)' }}>
                <p className="text-muted" style={{ marginBottom: 'var(--sp-6)' }}>
                    Update the display text on the public-facing landing page dynamically.
                </p>

                <form className="request-form" onSubmit={handleSave}>
                    <div className="form-group">
                        <label className="form-label">Hero Badge Text</label>
                        <input
                            type="text"
                            className="form-control"
                            value={siteData.hero.badge}
                            onChange={(e) => handleChange(e, 'badge')}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Hero Title (Main)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={siteData.hero.titleMain}
                                onChange={(e) => handleChange(e, 'titleMain')}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Hero Title (Gradient Emphasis)</label>
                            <input
                                type="text"
                                className="form-control"
                                value={siteData.hero.titleGradient}
                                onChange={(e) => handleChange(e, 'titleGradient')}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Hero Description</label>
                        <textarea
                            className="form-control"
                            value={siteData.hero.description}
                            onChange={(e) => handleChange(e, 'description')}
                            style={{ minHeight: '120px' }}
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Primary Button Text</label>
                            <input
                                type="text"
                                className="form-control"
                                value={siteData.hero.primaryButton}
                                onChange={(e) => handleChange(e, 'primaryButton')}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Secondary Button Text</label>
                            <input
                                type="text"
                                className="form-control"
                                value={siteData.hero.secondaryButton}
                                onChange={(e) => handleChange(e, 'secondaryButton')}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: 'var(--sp-4)' }}>
                        <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg, #ff007f, #7000ff)' }}>
                            <Save size={18} style={{ marginRight: '8px' }} />
                            Publish Changes
                        </button>
                        {saveStatus && <span style={{ color: '#00ff64', fontSize: '0.875rem' }}>{saveStatus}</span>}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SiteEditor;
