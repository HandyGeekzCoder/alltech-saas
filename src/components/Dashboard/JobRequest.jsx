import React, { useState, useContext } from 'react';
import { Send } from 'lucide-react';
import { AdminContext } from '../../AdminContext';
import ClientAvatarDropdown from '../Client/ClientAvatarDropdown';

const JobRequest = () => {
    const { users, loggedInUserId, addJobToAccount } = useContext(AdminContext);
    const loggedInUser = users.find(u => u.id === loggedInUserId);
    const [submitted, setSubmitted] = useState(false);

    // Form states
    const [serviceType, setServiceType] = useState('');
    const [urgency, setUrgency] = useState('normal');
    // Default location holds a special token or the literal primary HQ string
    const [location, setLocation] = useState(`${loggedInUser?.company} (Primary HQ)`);
    const [details, setDetails] = useState('');

    const sites = loggedInUser?.sites || [];

    const handleSubmit = (e) => {
        e.preventDefault();

        let title = '';
        switch (serviceType) {
            case 'network': title = 'Network Infrastructure'; break;
            case 'av': title = 'Audio / Video System'; break;
            case 'surveillance': title = 'Video Surveillance'; break;
            case 'security': title = 'Security Access Control'; break;
            default: title = 'IT Service Request'; break;
        }

        addJobToAccount(loggedInUser.id, title, serviceType, urgency, location, details);

        setSubmitted(true);
        // Reset form
        setServiceType('');
        setUrgency('normal');
        setLocation(`${loggedInUser?.company} (Primary HQ)`);
        setDetails('');

        setTimeout(() => setSubmitted(false), 3000);
    };

    return (
        <div>
            <div className="dashboard-topbar">
                <h2>Request New Job</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)' }}>
                    <span className="text-muted">{loggedInUser?.company}</span>
                    <ClientAvatarDropdown />
                </div>
            </div>

            <div className="glass-panel" style={{ padding: 'var(--sp-8)' }}>
                <p className="text-muted" style={{ marginBottom: 'var(--sp-6)' }}>
                    Submit a request for our IT experts. We will review your requirements and provide an immediate assessment.
                </p>

                <form className="request-form" onSubmit={handleSubmit}>

                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Service Type</label>
                            <select
                                className="form-control"
                                required
                                style={{ appearance: 'none' }}
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value)}
                            >
                                <option value="">Select Service...</option>
                                <option value="network">Network Infrastructure</option>
                                <option value="av">Audio / Video System</option>
                                <option value="surveillance">Video Surveillance</option>
                                <option value="security">Security Access Control</option>
                                <option value="other">Other IT Service</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Urgency</label>
                            <select
                                className="form-control"
                                style={{ appearance: 'none' }}
                                value={urgency}
                                onChange={(e) => setUrgency(e.target.value)}
                            >
                                <option value="normal">Standard Timeline (1-2 Weeks)</option>
                                <option value="urgent">Urgent / Emergency</option>
                                <option value="future">Future Planning (1+ Month)</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Select Business Location</label>
                        <select
                            className="form-control"
                            required
                            style={{ appearance: 'none' }}
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                        >
                            <option value={`${loggedInUser?.company} (Primary HQ)`}>
                                {loggedInUser?.company} (Primary HQ)
                            </option>
                            {sites.map(site => (
                                <option key={site.id} value={`${site.companyName} - ${site.location}`}>
                                    {site.companyName} - {site.location}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Project Details</label>
                        <textarea
                            className="form-control"
                            placeholder="Describe the scope of work, technical requirements, and any specific hardware preferences..."
                            required
                            value={details}
                            onChange={(e) => setDetails(e.target.value)}
                        ></textarea>
                    </div>

                    <button type="submit" className="btn-primary" disabled={submitted} style={{ width: 'auto' }}>
                        {submitted ? 'Request Sent Successfully' : (
                            <>
                                <Send size={18} style={{ marginRight: '8px' }} />
                                Submit Job Request
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default JobRequest;
