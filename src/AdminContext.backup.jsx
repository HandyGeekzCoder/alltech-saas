import React, { createContext, useState, useEffect } from 'react';

// Default initial data if LocalStorage is empty
const defaultSiteData = {
    hero: {
        badge: 'Next-Gen IT Infrastructure',
        titleMain: 'Empowering Your Business with',
        titleGradient: 'Intelligent Technology',
        description: 'AllTech delivers professional IT solutions. From advanced network architectures to high-end surveillance and full AV integration, we engineer environments built for the future.',
        primaryButton: 'Explore Services',
        secondaryButton: 'Client Dashboard'
    }
};

const defaultUsers = [
    {
        id: 'usr_1',
        company: 'Acme Corp',
        email: 'acme@company.com',
        password: 'password123',
        isTemporaryPassword: false,
        jobs: [
            {
                id: 'JOB-4852',
                title: 'Network Infrastructure Upgrade',
                status: 'Active',
                progress: 75,
                date: 'Oct 24, 2026',
                tasks: [
                    { id: 'tsk_1', title: 'Route Cat6 Cable Drops', isCompleted: true, weight: null },
                    { id: 'tsk_2', title: 'Mount & Rack Switch', isCompleted: true, weight: null },
                    { id: 'tsk_3', title: 'Provision Network Configurations', isCompleted: false, weight: null },
                    { id: 'tsk_4', title: 'Final Client Sign-off', isCompleted: false, weight: 10 }
                ],
                lineItems: [
                    { id: 'li_1', description: 'Cisco Meraki MS120-48LP Switch', amount: 1250.00, dateAdded: 'Oct 24, 2026' },
                    { id: 'li_2', description: 'Cat6 Cable Run (x24 Drops)', amount: 1800.00, dateAdded: 'Oct 25, 2026' },
                    { id: 'li_3', description: 'Labor: Network Configuration (8hrs)', amount: 1200.00, dateAdded: 'Oct 26, 2026' }
                ]
            },
            {
                id: 'JOB-4849',
                title: 'Security Camera Installation (Warehouse)',
                status: 'Pending',
                progress: 10,
                date: 'Oct 28, 2026',
                tasks: [
                    { id: 'tsk_5', title: 'Site Survey & Layout Approval', isCompleted: true, weight: 10 },
                    { id: 'tsk_6', title: 'Run Cabling to Warehouse Bays', isCompleted: false, weight: null },
                    { id: 'tsk_7', title: 'Mount Cameras', isCompleted: false, weight: null },
                    { id: 'tsk_8', title: 'Configure NVR & Client Setup', isCompleted: false, weight: null }
                ],
                lineItems: []
            }
        ]
    },
    {
        id: 'usr_2',
        company: 'Starlight Retail',
        email: 'admin@starlight.com',
        password: 'password123',
        isTemporaryPassword: false,
        jobs: []
    },
    {
        id: 'usr_3',
        company: 'Globex Logistics',
        email: 'it@globex.com',
        password: 'password123',
        isTemporaryPassword: false,
        jobs: [
            {
                id: 'JOB-4811',
                title: 'Boardroom A/V Integration',
                status: 'Completed',
                progress: 100,
                date: 'Sep 15, 2026',
                tasks: [
                    { id: 'tsk_9', title: 'Install Commercial Display', isCompleted: true, weight: null },
                    { id: 'tsk_10', title: 'Mount Logitech Rally Speakers & Camera', isCompleted: true, weight: null },
                    { id: 'tsk_11', title: 'Program Crestron Control System', isCompleted: true, weight: 40 },
                    { id: 'tsk_12', title: 'Audio Tuning & Testing', isCompleted: true, weight: null }
                ],
                lineItems: [
                    { id: 'li_4', description: 'Logitech Rally Plus System', amount: 3500.00, dateAdded: 'Sep 15, 2026' },
                    { id: 'li_5', description: '85" Commercial Display (Samsung)', amount: 2800.00, dateAdded: 'Sep 15, 2026' },
                    { id: 'li_6', description: 'Labor: A/V Installation & Tuning (16hrs)', amount: 2400.00, dateAdded: 'Sep 18, 2026' },
                    { id: 'li_7', description: 'Crestron Control Panel', amount: 3800.00, dateAdded: 'Sep 19, 2026' }
                ]
            }
        ]
    }
];

const defaultCatalog = [
    { id: 'cat_1', description: 'Cisco Meraki MS120-48LP Switch', defaultPrice: 1250.00 },
    { id: 'cat_2', description: 'Cat6 Cable Run (x1 Drop)', defaultPrice: 150.00 },
    { id: 'cat_3', description: 'Labor: Network Configuration (1hr)', defaultPrice: 150.00 },
    { id: 'cat_4', description: 'Logitech Rally Plus System', defaultPrice: 3500.00 },
    { id: 'cat_5', description: '85" Commercial Display (Samsung)', defaultPrice: 2800.00 },
    { id: 'cat_6', description: 'Labor: A/V Installation & Tuning (1hr)', defaultPrice: 150.00 },
    { id: 'cat_7', description: 'Crestron Control Panel', defaultPrice: 3800.00 }
];

// Helper to calculate total balance from all line items in all jobs
export const calculateUserBalance = (user) => {
    let total = 0;
    user.jobs.forEach(job => {
        job.lineItems.forEach(item => {
            total += item.amount;
        });
    });
    return total;
};

// Helper to compute progress percentage based on custom weights and even distribution
export const calculateJobProgress = (tasks) => {
    if (!tasks || tasks.length === 0) return 0;

    let totalProgress = 0;

    // Find all explicitly weighted items
    const weightedTasks = tasks.filter(t => t.weight !== null && t.weight > 0);
    const unweightedTasks = tasks.filter(t => t.weight === null || t.weight <= 0);

    // Sum up the total weight claimed by custom items (capped at 100)
    let claimedWeight = weightedTasks.reduce((acc, t) => acc + t.weight, 0);
    if (claimedWeight > 100) claimedWeight = 100;

    const remainingWeight = 100 - claimedWeight;
    const defaultWeightPerTask = unweightedTasks.length > 0 ? (remainingWeight / unweightedTasks.length) : 0;

    // Calculate earned progress from completed items
    tasks.forEach(t => {
        if (t.isCompleted) {
            if (t.weight !== null && t.weight > 0) {
                totalProgress += t.weight;
            } else {
                totalProgress += defaultWeightPerTask;
            }
        }
    });

    // Clamp between 0-100 and round
    return Math.min(100, Math.max(0, Math.round(totalProgress)));
};

export const AdminContext = createContext();

export const AdminProvider = ({ children }) => {
    const [siteData, setSiteData] = useState(() => {
        const saved = localStorage.getItem('alltech_cms_siteData');
        return saved ? JSON.parse(saved) : defaultSiteData;
    });

    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('alltech_cms_users');
        return saved ? JSON.parse(saved) : defaultUsers;
    });

    const [loggedInUserId, setLoggedInUserId] = useState(() => {
        const saved = localStorage.getItem('alltech_cms_loggedInId');
        return saved ? saved : 'usr_1';
    });

    const [billingCatalog, setBillingCatalog] = useState(() => {
        const saved = localStorage.getItem('alltech_cms_catalog');
        return saved ? JSON.parse(saved) : defaultCatalog;
    });

    // Persist to LocalStorage exactly when state changes
    useEffect(() => {
        localStorage.setItem('alltech_cms_siteData', JSON.stringify(siteData));
    }, [siteData]);

    useEffect(() => {
        localStorage.setItem('alltech_cms_users', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        localStorage.setItem('alltech_cms_loggedInId', loggedInUserId);
    }, [loggedInUserId]);

    useEffect(() => {
        localStorage.setItem('alltech_cms_catalog', JSON.stringify(billingCatalog));
    }, [billingCatalog]);

    // Context Actions
    const updateSiteData = (section, key, value) => {
        setSiteData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const addLineItemToJob = (userId, jobId, description, amount) => {
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                // Find the specific job and push the new line item
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        return {
                            ...job,
                            lineItems: [
                                ...job.lineItems,
                                {
                                    id: `li_${Date.now()}`,
                                    description: description,
                                    amount: parseFloat(amount),
                                    dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                }
                            ]
                        };
                    }
                    return job;
                });
                return { ...user, jobs: updatedJobs };
            }
            return user;
        }));
    };

    const loginClient = (email, password) => {
        const user = users.find(u => u.email === email && u.password === password);
        if (user) {
            setLoggedInUserId(user.id);
            return true;
        }
        return false;
    };

    const addClientAccount = (company, email, tempPassword) => {
        const newUser = {
            id: `usr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            company,
            email,
            password: tempPassword,
            isTemporaryPassword: true,
            jobs: []
        };
        setUsers(prev => [...prev, newUser]);
    };

    const updateClientPassword = (userId, newPassword) => {
        setUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, password: newPassword, isTemporaryPassword: false } : user
        ));
    };

    const addJobToAccount = (userId, title, type, urgency, location, details) => {
        const newJob = {
            id: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
            title: title || `${type.toUpperCase()} Request`,
            status: 'Pending Review',
            progress: 0,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            tasks: [],
            lineItems: [],
            // Store some extra meta info for the admin
            meta: { urgency, location, details }
        };

        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                return { ...user, jobs: [newJob, ...user.jobs] };
            }
            return user;
        }));
    };

    const addBatchInvoiceToJob = (userId, jobId, itemsArray) => {
        // Handle automatically appending any new, unrecognized Custom Items to the Global Catalog
        const newCatalogAdditions = [];

        const preparedLineItems = itemsArray.map(item => {
            // Check if this item exists in catalog strictly by description match
            const exists = billingCatalog.find(cat => cat.description.toLowerCase() === item.description.toLowerCase());
            if (!exists) {
                newCatalogAdditions.push({
                    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    description: item.description,
                    defaultPrice: parseFloat(item.amount) // Store unit price based on what admin charged
                });
            }

            return {
                id: `li_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                description: item.description,
                amount: parseFloat(item.amount) * parseInt(item.quantity, 10),
                dateAdded: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
        });

        // Add missing elements to catalog
        if (newCatalogAdditions.length > 0) {
            setBillingCatalog(prev => [...prev, ...newCatalogAdditions]);
        }

        // Push standard items into the Job array
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        return {
                            ...job,
                            lineItems: [...job.lineItems, ...preparedLineItems]
                        };
                    }
                    return job;
                });
                return { ...user, jobs: updatedJobs };
            }
            return user;
        }));
    };

    const addCatalogItem = (description, defaultPrice) => {
        const newItem = {
            id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description,
            defaultPrice: parseFloat(defaultPrice)
        };
        setBillingCatalog(prev => [newItem, ...prev]);
    };

    const updateCatalogItem = (id, description, defaultPrice) => {
        setBillingCatalog(prev => prev.map(item =>
            item.id === id ? { ...item, description, defaultPrice: parseFloat(defaultPrice) } : item
        ));
    };

    const deleteCatalogItem = (id) => {
        setBillingCatalog(prev => prev.filter(item => item.id !== id));
    };

    const addTaskToJob = (userId, jobId, title, customWeight = null) => {
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        const newTasks = [
                            ...(job.tasks || []),
                            {
                                id: `tsk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                title,
                                isCompleted: false,
                                weight: customWeight ? parseFloat(customWeight) : null
                            }
                        ];
                        // Recalculate progress
                        const newProgress = calculateJobProgress(newTasks);
                        return { ...job, tasks: newTasks, progress: newProgress };
                    }
                    return job;
                });
                return { ...user, jobs: updatedJobs };
            }
            return user;
        }));
    };

    const toggleTaskCompletion = (userId, jobId, taskId) => {
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        const newTasks = (job.tasks || []).map(t =>
                            t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
                        );
                        // Recalculate progress
                        const newProgress = calculateJobProgress(newTasks);
                        // Also auto-update status to Completed if progress hits 100
                        let newStatus = job.status;
                        if (newProgress === 100) {
                            newStatus = 'Completed';
                        } else if (newStatus === 'Completed' && newProgress < 100) {
                            newStatus = 'Active';
                        }

                        return { ...job, tasks: newTasks, progress: newProgress, status: newStatus };
                    }
                    return job;
                });
                return { ...user, jobs: updatedJobs };
            }
            return user;
        }));
    };

    const deleteTaskFromJob = (userId, jobId, taskId) => {
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        const newTasks = (job.tasks || []).filter(t => t.id !== taskId);
                        // Recalculate progress
                        const newProgress = calculateJobProgress(newTasks);
                        return { ...job, tasks: newTasks, progress: newProgress };
                    }
                    return job;
                });
                return { ...user, jobs: updatedJobs };
            }
            return user;
        }));
    };

    return (
        <AdminContext.Provider value={{
            siteData, updateSiteData,
            users, addLineItemToJob,
            loggedInUserId, loginClient,
            billingCatalog, addBatchInvoiceToJob,
            addCatalogItem, updateCatalogItem, deleteCatalogItem,
            addTaskToJob, toggleTaskCompletion, deleteTaskFromJob,
            addClientAccount, updateClientPassword, addJobToAccount
        }}>
            {children}
        </AdminContext.Provider>
    );
};
