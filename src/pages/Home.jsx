import React, { useContext, useState, useEffect } from 'react';
import { ArrowRight, Shield, Video, Wifi, MonitorSmartphone, Phone, CheckCircle } from 'lucide-react';
import { AdminContext } from '../AdminContext';
import { supabase } from '../supabaseClient';

const FALLBACK_PHONE_DISPLAY = '(555) 123-4567';
const FALLBACK_PHONE_TEL = '+15551234567';

const Home = () => {
    const { siteData } = useContext(AdminContext);
    const heroContent = siteData.hero;

    // Phone number: read from siteData if present, otherwise use placeholder
    const phoneDisplay = heroContent.phone || FALLBACK_PHONE_DISPLAY;
    const rawPhone = heroContent.phoneTel || heroContent.phone || FALLBACK_PHONE_TEL;
    const phoneTel = `tel:${rawPhone.replace(/[^\d+]/g, '')}`;

    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

    // Lead form state
    const [leadForm, setLeadForm] = useState({ name: '', phone: '', message: '', website: '' });
    const [leadStatus, setLeadStatus] = useState('idle'); // idle | submitting | success | error

    useEffect(() => {
        const handleMouseMove = (e) => {
            requestAnimationFrame(() => {
                setMousePos({ x: e.pageX, y: e.pageY });
            });
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

    const handleLeadChange = (e) => {
        const { name, value } = e.target;
        setLeadForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleLeadSubmit = async (e) => {
        e.preventDefault();

        // Honeypot: silently accept (show success) but do not insert
        if (leadForm.website) {
            setLeadStatus('success');
            return;
        }

        setLeadStatus('submitting');

        const { error } = await supabase.from('leads').insert({
            name: leadForm.name.trim() || null,
            phone: leadForm.phone.trim(),
            message: leadForm.message.trim() || null,
            source: 'hero'
        });

        if (error) {
            console.error('Lead submission failed:', error);
            setLeadStatus('error');
            return;
        }

        setLeadStatus('success');
    };

    return (
        <div style={{ '--mouse-x': `${mousePos.x}px`, '--mouse-y': `${mousePos.y}px` }}>
            {/* Background Animated Tech Grid */}
            <div className="tech-grid-wrapper">
                <div className="tech-grid-bg"></div>
                <div className="tech-grid-mid"></div>
                <div className="tech-grid-peak"></div>
            </div>

            {/* Spacer for fixed Navbar */}
            <div className="navbar-spacer"></div>

            {/* Hero Section */}
            <section className="hero container">
                <div className="hero-grid">
                    <div className="hero-content">
                        <div className="hero-badge">{heroContent.badge}</div>
                        <h1>
                            {heroContent.titleMain} <br />
                            <span className="text-gradient">{heroContent.titleGradient}</span>
                        </h1>
                        <p>
                            {heroContent.description}
                        </p>
                        <div className="hero-cta">
                            <a href="#services" className="btn-primary">{heroContent.primaryButton} <ArrowRight size={18} style={{ marginLeft: '8px' }} /></a>
                            <a href="/login" className="btn-secondary">{heroContent.secondaryButton}</a>
                        </div>
                    </div>

                    {/* Lead Capture Card */}
                    <div className="hero-lead-card glass-panel">
                        <a href={phoneTel} className="lead-call-btn">
                            <Phone size={22} />
                            <span className="lead-call-text">
                                <span className="lead-call-label">Call us now</span>
                                <span className="lead-call-number">{phoneDisplay}</span>
                            </span>
                        </a>

                        <div className="lead-divider"><span>or request a callback</span></div>

                        {leadStatus === 'success' ? (
                            <div className="lead-success" role="status">
                                <CheckCircle size={36} />
                                <h3>Request received</h3>
                                <p>Thanks{leadForm.name ? `, ${leadForm.name}` : ''} — we'll call you back shortly.</p>
                                <p className="lead-success-urgent">
                                    Need help right now? <a href={phoneTel}>Call {phoneDisplay}</a>
                                </p>
                            </div>
                        ) : (
                            <form className="lead-form" onSubmit={handleLeadSubmit}>
                                <label className="lead-field">
                                    <span>Name</span>
                                    <input
                                        type="text"
                                        name="name"
                                        value={leadForm.name}
                                        onChange={handleLeadChange}
                                        placeholder="Your name"
                                        autoComplete="name"
                                    />
                                </label>
                                <label className="lead-field">
                                    <span>Phone *</span>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={leadForm.phone}
                                        onChange={handleLeadChange}
                                        placeholder="(555) 123-4567"
                                        autoComplete="tel"
                                        required
                                    />
                                </label>
                                <label className="lead-field">
                                    <span>What do you need help with?</span>
                                    <textarea
                                        name="message"
                                        value={leadForm.message}
                                        onChange={handleLeadChange}
                                        placeholder="Optional — tell us briefly"
                                        rows="3"
                                    />
                                </label>

                                {/* Honeypot — hidden from humans, catches bots */}
                                <label className="lead-honeypot" aria-hidden="true" tabIndex="-1">
                                    Website
                                    <input
                                        type="text"
                                        name="website"
                                        value={leadForm.website}
                                        onChange={handleLeadChange}
                                        tabIndex="-1"
                                        autoComplete="off"
                                    />
                                </label>

                                {leadStatus === 'error' && (
                                    <p className="lead-error" role="alert">
                                        Something went wrong. Please call us at <a href={phoneTel}>{phoneDisplay}</a>.
                                    </p>
                                )}

                                <button type="submit" className="btn-primary lead-submit" disabled={leadStatus === 'submitting'}>
                                    {leadStatus === 'submitting' ? 'Sending...' : 'Request a Callback'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </section>

            {/* Services Section */}
            <section id="services" className="services-section container">
                <div className="section-header">
                    <h2>Our Core Capabilities</h2>
                    <p className="text-muted">Enterprise-grade implementation backed by deep technical expertise. We architect solutions that scale seamlessly.</p>
                </div>

                <div className="services-grid">
                    <div className="service-card glass-panel">
                        <div className="service-icon">
                            <Wifi size={32} />
                        </div>
                        <h3>Network Infrastructure</h3>
                        <p>High-performance data lines, mesh access points, and enterprise-grade routing configured for zero latency and maximum throughput.</p>
                    </div>

                    <div className="service-card glass-panel">
                        <div className="service-icon">
                            <MonitorSmartphone size={32} />
                        </div>
                        <h3>Audio & Video Systems</h3>
                        <p>Immersive A/V setup for boardrooms, retail spaces, and complex environments. Custom automation and crisp distribution matrices.</p>
                    </div>

                    <div className="service-card glass-panel">
                        <div className="service-icon">
                            <Video size={32} />
                        </div>
                        <h3>Video Surveillance</h3>
                        <p>High-resolution IP camera systems with intelligent motion tracking, cloud redundancy, and secure remote viewing architectures.</p>
                    </div>

                    <div className="service-card glass-panel">
                        <div className="service-icon">
                            <Shield size={32} />
                        </div>
                        <h3>Security Access Control</h3>
                        <p>Biometric and keycard access point systems tailored to secure sensitive areas, maintaining granular access logs and instant revocability.</p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
