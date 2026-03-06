import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/Admin/AdminSidebar';
import SiteEditor from '../components/Admin/SiteEditor';
import UserManager from '../components/Admin/UserManager';
import CatalogManager from '../components/Admin/CatalogManager';
import TaskCatalogManager from '../components/Admin/TaskCatalogManager';
import JobManager from '../components/Admin/JobManager';
import '../Dashboard.css'; // Reuse dashboard layout structure

const AdminLayout = () => {
    return (
        <div className="dashboard-layout">
            <AdminSidebar />
            <main className="dashboard-main">
                <Routes>
                    <Route path="/" element={<Navigate to="editor" replace />} />
                    <Route path="editor" element={<SiteEditor />} />
                    <Route path="users" element={<UserManager />} />
                    <Route path="jobs" element={<JobManager />} />
                    <Route path="catalog" element={<CatalogManager />} />
                    <Route path="tasks" element={<TaskCatalogManager />} />
                </Routes>
            </main>
        </div>
    );
};

export default AdminLayout;
