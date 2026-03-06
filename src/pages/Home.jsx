import React, { useContext, useState, useEffect } from 'react';
import { ArrowRight, Shield, Video, Wifi, MonitorSmartphone } from 'lucide-react';
import { AdminContext } from '../AdminContext';

const Home = () => {
    const { siteData } = useContext(AdminContext);
    const heroContent = siteData.hero;

    const [mousePos, setMousePos] = useState({ x: -1000, y: -1000 });

    useEffect(() => {
        const handleMouseMove = (e) => {
            requestAnimationFrame(() => {
                setMousePos({ x: e.pageX, y: e.pageY });
            });
        };

        window.addEventListener('mousemove', handleMouseMove, { passive: true });
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, []);

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
