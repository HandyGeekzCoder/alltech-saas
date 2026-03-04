import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from '../components/Dashboard/Sidebar';
import Overview from '../components/Dashboard/Overview';
import JobRequest from '../components/Dashboard/JobRequest';
import Billing from '../components/Dashboard/Billing';
import SitesManager from '../components/Dashboard/SitesManager';
import EmployeeManager from '../components/Dashboard/EmployeeManager';
import PasswordResetModal from '../components/Client/PasswordResetModal';
import { AdminContext } from '../AdminContext';
import '../Dashboard.css';

const Dashboard = () => {
    const { users, loggedInUserId, updateClientPassword } = React.useContext(AdminContext);
    const currentUser = users.find(u => u.id === loggedInUserId);

    const handlePasswordReset = (newPassword) => {
        updateClientPassword(currentUser.id, newPassword);
    };

    return (
        <div className="dashboard-layout">
            <Sidebar />
            <main className="dashboard-main">
                {currentUser?.isTemporaryPassword && (
                    <PasswordResetModal onComplete={handlePasswordReset} />
                )}

                <Routes>
                    <Route path="/" element={<Overview />} />
                    <Route path="sites" element={<SitesManager />} />
                    <Route path="team" element={<EmployeeManager />} />
                    <Route path="request" element={<JobRequest />} />
                    <Route path="billing" element={<Billing />} />
                </Routes>
            </main>
        </div>
    );
};

export default Dashboard;
