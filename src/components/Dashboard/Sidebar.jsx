import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Cpu, LayoutDashboard, PlusCircle, LogOut, FileText, MapPin } from 'lucide-react';

const Sidebar = () => {
    return (
        <aside className="dashboard-sidebar">
            <div className="sidebar-header">
                <Link to="/" className="logo">
                    <Cpu className="logo-icon" size={24} />
                    <span>ALLTEK</span>
                </Link>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <NavLink
                            to="/dashboard"
                            end
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                        >
                            <LayoutDashboard size={20} />
                            Overview
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/dashboard/sites"
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                        >
                            <MapPin size={20} />
                            My Sites
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/dashboard/request"
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                        >
                            <PlusCircle size={20} />
                            New Request
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/dashboard/billing"
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                        >
                            <FileText size={20} />
                            Invoices & Billing
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                <Link to="/" className="nav-item">
                    <LogOut size={20} />
                    Sign Out
                </Link>
            </div>
        </aside>
    );
};

export default Sidebar;
