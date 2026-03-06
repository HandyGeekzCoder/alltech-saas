import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { Cpu, Edit, Users, LogOut, BookOpen, Target, ListTodo } from 'lucide-react';

const AdminSidebar = () => {
    return (
        <aside className="dashboard-sidebar" style={{ borderRightColor: 'rgba(255,0,127,0.3)' }}>
            <div className="sidebar-header">
                <Link to="/" className="logo">
                    <Cpu className="logo-icon" size={24} style={{ color: '#ff007f', animation: 'none' }} />
                    <span style={{ color: '#ff007f' }}>ALLTEK OS</span>
                </Link>
            </div>

            <nav className="sidebar-nav">
                <ul>
                    <li>
                        <NavLink
                            to="/admin/editor"
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                            style={({ isActive }) => isActive ? { color: '#ff007f', borderLeftColor: '#ff007f', background: 'rgba(255,0,127,0.05)' } : {}}
                        >
                            <Edit size={20} />
                            Site Editor
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                            style={({ isActive }) => isActive ? { color: '#ff007f', borderLeftColor: '#ff007f', background: 'rgba(255,0,127,0.05)' } : {}}
                        >
                            <Users size={20} />
                            User Manager
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/jobs"
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                            style={({ isActive }) => isActive ? { color: '#00ff64', borderLeftColor: '#00ff64', background: 'rgba(0,255,100,0.05)' } : {}}
                        >
                            <Target size={20} />
                            Job Tracker
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/catalog"
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                            style={({ isActive }) => isActive ? { color: '#ff007f', borderLeftColor: '#ff007f', background: 'rgba(255,0,127,0.05)' } : {}}
                        >
                            <BookOpen size={20} />
                            Billing Catalog
                        </NavLink>
                    </li>
                    <li>
                        <NavLink
                            to="/admin/tasks"
                            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                            style={({ isActive }) => isActive ? { color: '#00b3ff', borderLeftColor: '#00b3ff', background: 'rgba(0,179,255,0.05)' } : {}}
                        >
                            <ListTodo size={20} />
                            Task Catalog
                        </NavLink>
                    </li>
                </ul>
            </nav>

            <div className="sidebar-footer">
                <Link to="/" className="nav-item">
                    <LogOut size={20} />
                    Exit OS
                </Link>
            </div>
        </aside>
    );
};

export default AdminSidebar;
