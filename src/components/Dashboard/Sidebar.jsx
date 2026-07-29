import React, { useContext } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Cpu, LayoutDashboard, PlusCircle, LogOut, FileText, MapPin, Users } from 'lucide-react';
import { AdminContext } from '../../AdminContext';

const Sidebar = () => {
    const { users, loggedInUserId, logoutUser } = useContext(AdminContext);
    const navigate = useNavigate();
    const loggedInUser = users.find(u => u.id === loggedInUserId);

    const handleSignOut = async () => {
        await logoutUser();
        navigate('/');
    };

    const isEmployee = !!loggedInUser?.parentClientId;
    const canViewBilling = !isEmployee || loggedInUser?.permissions?.canViewBilling;

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
                    {/* Only Primary Account Holders can manage sites and team */}
                    {!isEmployee && (
                        <>
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
                                    to="/dashboard/team"
                                    className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                                >
                                    <Users size={20} />
                                    Team / Employees
                                </NavLink>
                            </li>
                        </>
                    )}

                    <li>
                        <NavLink
                            to="/dashboard/request"
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                        >
                            <PlusCircle size={20} />
                            New Request
                        </NavLink>
                    </li>

                    {/* Conditionally reveal Billing based on explicit JSON permissions */}
                    {canViewBilling && (
                        <li>
                            <NavLink
                                to="/dashboard/billing"
                                className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                            >
                                <FileText size={20} />
                                Invoices & Billing
                            </NavLink>
                        </li>
                    )}
                </ul>
            </nav>

            <div className="sidebar-footer">
                <button onClick={handleSignOut} className="nav-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                    <LogOut size={20} />
                    Sign Out
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
