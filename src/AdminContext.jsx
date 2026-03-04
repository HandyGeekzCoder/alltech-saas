import React, { createContext, useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

// Default initial data if LocalStorage/Supabase is empty
const defaultSiteData = {
    hero: {
        badge: 'Next-Gen IT Infrastructure',
        titleMain: 'Empowering Your Business with',
        titleGradient: 'Intelligent Technology',
        description: 'AllTek delivers professional IT solutions. From advanced network architectures to high-end surveillance and full AV integration, we engineer environments built for the future.',
        primaryButton: 'Explore Services',
        secondaryButton: 'Client Dashboard'
    }
};


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
    const [siteData, setSiteData] = useState(defaultSiteData);
    const [users, setUsers] = useState([]);
    const [billingCatalog, setBillingCatalog] = useState([]);
    const [loggedInUserId, setLoggedInUserId] = useState(() => {
        const saved = localStorage.getItem('alltech_cms_loggedInId');
        return saved ? saved : null;
    });

    const [isLoading, setIsLoading] = useState(true);

    const fetchRemoteData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch site data
            const { data: siteRes } = await supabase.from('site_data').select('*');
            if (siteRes && siteRes.length > 0) {
                const parsedData = { ...defaultSiteData };
                siteRes.forEach(row => {
                    if (!parsedData[row.section]) parsedData[row.section] = {};
                    parsedData[row.section][row.key] = row.value;
                });
                setSiteData(parsedData);
            }

            // 2. Fetch catalog
            const { data: catRes } = await supabase.from('catalog').select('*');
            if (catRes) {
                setBillingCatalog(catRes.map(c => ({
                    id: c.id,
                    description: c.description,
                    defaultPrice: Number(c.default_price)
                })));
            }

            // 3. Fetch Full User Hierarchy
            // Note: We're doing nested queries here to rebuild our local array format.
            const { data: profilesRes } = await supabase.from('profiles').select('*');

            if (profilesRes) {
                const fullUsers = await Promise.all(profilesRes.map(async (profile) => {
                    const targetProfileId = profile.parent_client_id || profile.id;

                    // Get Sites for Profile
                    const { data: sitesRes } = await supabase.from('sites').select('*').eq('user_id', targetProfileId);
                    const sitesList = sitesRes || [];

                    // Get Jobs for Profile
                    const { data: jobsRes } = await supabase.from('jobs').select('*').eq('user_id', targetProfileId);
                    let jobsList = jobsRes || [];

                    // ---------------- Employee Job Sandboxing ----------------
                    if (profile.parent_client_id) {
                        const allowedIds = profile.permissions?.allowedSites || [];
                        const canSeePrimary = allowedIds.includes('primary-hq');

                        const parentProfile = profilesRes.find(p => p.id === profile.parent_client_id);
                        const primaryHQLabel = `${parentProfile?.company} (Primary HQ)`;

                        const allowedSiteLabels = sitesList
                            .filter(s => allowedIds.includes(s.id))
                            .map(s => `${s.company_name} - ${s.location}`);

                        const allowedLocations = [...allowedSiteLabels];
                        if (canSeePrimary) allowedLocations.push(primaryHQLabel);

                        // Strictly filter out any jobs not matching allowed locations
                        jobsList = jobsList.filter(job => allowedLocations.includes(job.meta?.location));
                    }
                    // ---------------------------------------------------------

                    // Hydrate Jobs
                    const hydratedJobs = await Promise.all(jobsList.map(async (job) => {
                        const { data: tasksRes } = await supabase.from('tasks').select('*').eq('job_id', job.id);
                        const { data: liRes } = await supabase.from('line_items').select('*').eq('job_id', job.id);

                        return {
                            id: job.id,
                            title: job.title,
                            status: job.status,
                            progress: job.progress,
                            date: job.date,
                            meta: job.meta || {},
                            tasks: (tasksRes || []).map(t => ({
                                ...t,
                                isCompleted: t.is_completed
                            })),
                            lineItems: (liRes || []).map(l => ({
                                ...l,
                                dateAdded: l.date_added
                            }))
                        };
                    }));

                    return {
                        id: profile.id,
                        company: profile.company,
                        email: profile.email,
                        isTemporaryPassword: profile.is_temporary_password,
                        role: profile.role,
                        parentClientId: profile.parent_client_id,
                        permissions: profile.permissions || {},
                        sites: sitesList.map(s => ({
                            id: s.id,
                            companyName: s.company_name,
                            location: s.location
                        })),
                        jobs: hydratedJobs
                    };
                }));

                if (fullUsers.length > 0) {
                    setUsers(fullUsers);
                } else {
                    console.log("No users found in Supabase.");
                }
            } else {
                console.log("Profiles query returned no data.");
            }

            setIsLoading(false);
        } catch (err) {
            console.error("Supabase data fetch failed", err);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        // Fetch everything on mount
        fetchRemoteData();

        // Add a safety timeout in case the Supabase connection hangs indefinitely
        const timeoutId = setTimeout(() => {
            if (isLoading) {
                console.warn("Supabase fetch timeout. Forcing app load.");
                setIsLoading(false);
            }
        }, 5000);

        // Clear timeout if fetchRemoteData completes before timeout
        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        if (loggedInUserId) {
            localStorage.setItem('alltech_cms_loggedInId', loggedInUserId);
        } else {
            localStorage.removeItem('alltech_cms_loggedInId');
        }
    }, [loggedInUserId]);

    // Context Actions
    const updateSiteData = async (section, key, value) => {
        // Optimistic UI Update
        setSiteData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));

        // Supabase DB Update
        await supabase
            .from('site_data')
            .upsert({ section, key, value }, { onConflict: 'section,key' });
    };

    const addLineItemToJob = async (userId, jobId, description, amount) => {
        const newItem = {
            id: `li_${Date.now()}`,
            job_id: jobId,
            description,
            amount: parseFloat(amount),
            date_added: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };

        // UI Optimistic Update
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        return {
                            ...job,
                            lineItems: [
                                ...job.lineItems,
                                {
                                    id: newItem.id,
                                    description: newItem.description,
                                    amount: newItem.amount,
                                    dateAdded: newItem.date_added
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

        // DB Update
        await supabase.from('line_items').insert(newItem);
    };

    const loginClient = async (email, password) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                return { success: false, message: error.message };
            }

            if (data.user) {
                setLoggedInUserId(data.user.id);
                // Re-fetch all data now that we are authenticated, so RLS policies allow us to see our jobs & profile!
                await fetchRemoteData();
                return { success: true };
            }
            return { success: false, message: 'Invalid credentials.' };
        } catch (err) {
            return { success: false, message: 'Authentication failed.' };
        }
    };

    const adminLogin = async () => {
        try {
            const adminEmail = 'admin@alltek.local';
            const adminPass = 'SuperAdminSecure123!';

            // Try explicit login
            let { data, error } = await supabase.auth.signInWithPassword({
                email: adminEmail,
                password: adminPass
            });

            // Auto-provision if it doesn't exist
            if (error && error.message.includes('Invalid login credentials')) {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: adminEmail,
                    password: adminPass
                });
                if (!signUpError && signUpData.user) {
                    await supabase.from('profiles').upsert({
                        id: signUpData.user.id,
                        company: 'AllTek Master Admin',
                        email: adminEmail,
                        role: 'admin',
                        is_temporary_password: false
                    });
                    data = signUpData;
                    error = null;
                }
            }

            if (!error && data?.user) {
                setLoggedInUserId(data.user.id);
                await fetchRemoteData();
                return { success: true };
            }
            return { success: false, message: 'Admin Supabase provision failed.' };
        } catch (err) {
            return { success: false, message: 'Admin authentication failed.' };
        }
    };

    const addClientAccount = async (company, email, tempPassword) => {
        // Since we disabled Email Confirmations, we can create the user and they will be auto-confirmed
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password: tempPassword,
        });

        if (authError) {
            console.error("Auth creation failed:", authError);
            return;
        }

        if (authData?.user) {
            const newProfile = {
                id: authData.user.id,
                company,
                email,
                is_temporary_password: true,
                role: 'client'
            };

            // Insert into our Profiles table
            const { error: profileError } = await supabase.from('profiles').insert(newProfile);

            if (!profileError) {
                // Optimistically update the UI so the admin sees the new account instantly without refreshing
                const uiUser = {
                    id: newProfile.id,
                    company: newProfile.company,
                    email: newProfile.email,
                    isTemporaryPassword: newProfile.is_temporary_password,
                    role: newProfile.role,
                    parentClientId: null,
                    permissions: {},
                    sites: [],
                    jobs: [],
                    password: tempPassword // keep this just for the admin UI to display it
                };
                setUsers(prev => [...prev, uiUser]);
            }
        }
    };

    const addEmployeeToClient = async (parentClientId, employeeName, employeeEmail, tempPassword, permissions) => {
        // Create Supabase Auth User
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: employeeEmail,
            password: tempPassword,
        });

        if (authError || !authData?.user) {
            console.error("Auth creation failed:", authError);
            return { error: authError };
        }

        const newProfile = {
            id: authData.user.id,
            company: employeeName,
            email: employeeEmail,
            is_temporary_password: true,
            role: 'client',
            parent_client_id: parentClientId,
            permissions: permissions
        };

        const { error: profileError } = await supabase.from('profiles').insert(newProfile);

        if (!profileError) {
            // Find parent to inherit jobs and sites for the UI state
            setUsers(prev => {
                const parent = prev.find(u => u.id === parentClientId);
                const uiUser = {
                    id: newProfile.id,
                    company: newProfile.company,
                    email: newProfile.email,
                    isTemporaryPassword: newProfile.is_temporary_password,
                    role: newProfile.role,
                    parentClientId: newProfile.parent_client_id,
                    permissions: newProfile.permissions,
                    sites: parent ? parent.sites : [],
                    jobs: parent ? parent.jobs : [],
                    password: tempPassword
                };
                return [...prev, uiUser];
            });
            return { success: true };
        }
        return { error: profileError };
    };

    const updateClientPassword = async (userId, newPassword) => {
        // Technically, Supabase Auth requires the user to be logged in to update their own password, 
        // or we need a service role key. For our simplified transition, we will fire the auth update.
        // Assuming the client is currently logged in:
        await supabase.auth.updateUser({ password: newPassword });

        // Update the profile flag
        await supabase.from('profiles').update({ is_temporary_password: false }).eq('id', userId);

        // Optimistic UI
        setUsers(prev => prev.map(user =>
            user.id === userId ? { ...user, password: newPassword, isTemporaryPassword: false } : user
        ));
    };

    const addSiteToAccount = async (userId, companyName, location) => {
        const { data, error } = await supabase.from('sites').insert({
            user_id: userId,
            company_name: companyName,
            location: location
        }).select().single();

        if (data && !error) {
            setUsers(prev => prev.map(user => {
                if (user.id === userId) {
                    return {
                        ...user,
                        sites: [...(user.sites || []), {
                            id: data.id,
                            companyName: data.company_name,
                            location: data.location
                        }]
                    };
                }
                return user;
            }));
        }
    };

    const deleteSiteFromAccount = async (userId, siteId) => {
        const { error } = await supabase.from('sites').delete().eq('id', siteId);
        if (!error) {
            setUsers(prev => prev.map(user => {
                if (user.id === userId) {
                    return {
                        ...user,
                        sites: (user.sites || []).filter(s => s.id !== siteId)
                    };
                }
                return user;
            }));
        }
    };

    const addJobToAccount = async (userId, title, type, urgency, location, details) => {
        // If the acting userId belongs to an employee, resolve the parent ID
        const actingUser = users.find(u => u.id === userId);
        const targetUserId = actingUser?.parentClientId || userId;

        const newJob = {
            id: `JOB-${Math.floor(1000 + Math.random() * 9000)}`,
            user_id: targetUserId,
            title: title || `${type.toUpperCase()} Request`,
            status: 'Pending Review',
            progress: 0,
            date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            meta: { urgency, location, details, requested_by: actingUser?.company }
        };

        // UI Optimistic
        setUsers(prev => prev.map(user => {
            const resolvedId = user.parentClientId || user.id;
            if (resolvedId === targetUserId) {
                return { ...user, jobs: [{ ...newJob, tasks: [], lineItems: [] }, ...user.jobs] };
            }
            return user;
        }));

        // DB Update
        await supabase.from('jobs').insert(newJob);
    };

    const updateJobNotes = async (userId, jobId, notes) => {
        // UI Optimistic Update
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                return {
                    ...user,
                    jobs: user.jobs.map(job =>
                        job.id === jobId ? { ...job, meta: { ...job.meta, adminNotes: notes } } : job
                    )
                };
            }
            return user;
        }));

        // Fetch existing meta first
        const { data: jobData } = await supabase.from('jobs').select('meta').eq('id', jobId).single();
        const currentMeta = jobData?.meta || {};

        // Push merged JSONB to DB
        await supabase.from('jobs').update({ meta: { ...currentMeta, adminNotes: notes } }).eq('id', jobId);
    };

    const updateJobDetails = async (userId, jobId, newLocation, newRequestedBy) => {
        // UI Optimistic Update
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                return {
                    ...user,
                    jobs: user.jobs.map(job =>
                        job.id === jobId ? {
                            ...job,
                            meta: { ...job.meta, location: newLocation, requested_by: newRequestedBy }
                        } : job
                    )
                };
            }
            return user;
        }));

        // Fetch existing meta first
        const { data: jobData } = await supabase.from('jobs').select('meta').eq('id', jobId).single();
        const currentMeta = jobData?.meta || {};

        // Push merged JSONB to DB
        await supabase.from('jobs').update({ meta: { ...currentMeta, location: newLocation, requested_by: newRequestedBy } }).eq('id', jobId);
    };

    const addBatchInvoiceToJob = async (userId, jobId, itemsArray) => {
        const newCatalogAdditions = [];

        const preparedLineItems = itemsArray.map(item => {
            const exists = billingCatalog.find(cat => cat.description.toLowerCase() === item.description.toLowerCase());
            if (!exists) {
                newCatalogAdditions.push({
                    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    description: item.description,
                    default_price: parseFloat(item.amount) // DB column is default_price
                });
            }

            return {
                id: `li_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                job_id: jobId,
                description: item.description,
                amount: parseFloat(item.amount) * parseInt(item.quantity, 10),
                date_added: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
        });

        // Add missing elements to catalog
        if (newCatalogAdditions.length > 0) {
            await supabase.from('catalog').insert(newCatalogAdditions);
            // Optimistic UI updates mapping default_price to defaultPrice
            setBillingCatalog(prev => [...prev, ...newCatalogAdditions.map(c => ({ ...c, defaultPrice: c.default_price }))]);
        }

        // Push standard items into the Job array DB
        if (preparedLineItems.length > 0) {
            await supabase.from('line_items').insert(preparedLineItems);

            // Map the snake_case back to camelCase for the UI
            const uiLineItems = preparedLineItems.map(li => ({
                id: li.id,
                description: li.description,
                amount: li.amount,
                dateAdded: li.date_added
            }));

            setUsers(prev => prev.map(user => {
                if (user.id === userId) {
                    const updatedJobs = user.jobs.map(job => {
                        if (job.id === jobId) {
                            return { ...job, lineItems: [...job.lineItems, ...uiLineItems] };
                        }
                        return job;
                    });
                    return { ...user, jobs: updatedJobs };
                }
                return user;
            }));
        }
    };

    const addCatalogItem = async (description, defaultPrice) => {
        const newItem = {
            id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description,
            default_price: parseFloat(defaultPrice)
        };
        await supabase.from('catalog').insert(newItem);
        setBillingCatalog(prev => [{ ...newItem, defaultPrice: newItem.default_price }, ...prev]);
    };

    const updateCatalogItem = async (id, description, defaultPrice) => {
        await supabase.from('catalog').update({ description, default_price: parseFloat(defaultPrice) }).eq('id', id);
        setBillingCatalog(prev => prev.map(item =>
            item.id === id ? { ...item, description, defaultPrice: parseFloat(defaultPrice) } : item
        ));
    };

    const deleteCatalogItem = async (id) => {
        await supabase.from('catalog').delete().eq('id', id);
        setBillingCatalog(prev => prev.filter(item => item.id !== id));
    };

    const addTaskToJob = async (userId, jobId, title, customWeight = null) => {
        const uid = `tsk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newTaskForDB = {
            id: uid,
            job_id: jobId,
            title,
            is_completed: false,
            weight: customWeight ? parseFloat(customWeight) : null
        };

        await supabase.from('tasks').insert(newTaskForDB);

        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        const newTasks = [
                            ...(job.tasks || []),
                            {
                                id: uid,
                                title,
                                isCompleted: false,
                                weight: newTaskForDB.weight
                            }
                        ];
                        // Recalculate progress
                        const newProgress = calculateJobProgress(newTasks);
                        // Fire-and-forget job progress update to DB
                        supabase.from('jobs').update({ progress: newProgress }).eq('id', jobId).then();

                        return { ...job, tasks: newTasks, progress: newProgress };
                    }
                    return job;
                });
                return { ...user, jobs: updatedJobs };
            }
            return user;
        }));
    };

    const toggleTaskCompletion = async (userId, jobId, taskId) => {
        let newIsCompleted = false;

        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        const newTasks = (job.tasks || []).map(t => {
                            if (t.id === taskId) {
                                newIsCompleted = !t.isCompleted;
                                return { ...t, isCompleted: newIsCompleted };
                            }
                            return t;
                        });

                        // Recalculate progress
                        const newProgress = calculateJobProgress(newTasks);
                        // Also auto-update status to Completed if progress hits 100
                        let newStatus = job.status;
                        if (newProgress === 100) {
                            newStatus = 'Completed';
                        } else if (newStatus === 'Completed' && newProgress < 100) {
                            newStatus = 'Active';
                        }

                        // Fire-and-forget sync wrapper
                        const syncJobStats = async () => {
                            await supabase.from('jobs').update({ progress: newProgress, status: newStatus }).eq('id', jobId);
                            await supabase.from('tasks').update({ is_completed: newIsCompleted }).eq('id', taskId);
                        };
                        syncJobStats();

                        return { ...job, tasks: newTasks, progress: newProgress, status: newStatus };
                    }
                    return job;
                });
                return { ...user, jobs: updatedJobs };
            }
            return user;
        }));
    };

    const deleteTaskFromJob = async (userId, jobId, taskId) => {
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        const newTasks = (job.tasks || []).filter(t => t.id !== taskId);
                        // Recalculate progress
                        const newProgress = calculateJobProgress(newTasks);

                        const syncJobStats = async () => {
                            await supabase.from('jobs').update({ progress: newProgress }).eq('id', jobId);
                            await supabase.from('tasks').delete().eq('id', taskId);
                        };
                        syncJobStats();

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
            loggedInUserId, loginClient, adminLogin,
            billingCatalog, addBatchInvoiceToJob,
            addCatalogItem, updateCatalogItem, deleteCatalogItem,
            addTaskToJob, toggleTaskCompletion, deleteTaskFromJob,
            addClientAccount, updateClientPassword, addJobToAccount, updateJobNotes, updateJobDetails,
            addSiteToAccount, deleteSiteFromAccount, addEmployeeToClient,
            isLoading
        }}>
            {children}
        </AdminContext.Provider>
    );
};
