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
    const [taskCatalog, setTaskCatalog] = useState([]);
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

            // 2. Fetch billing catalog
            const { data: catRes } = await supabase.from('catalog').select('*');
            if (catRes) {
                setBillingCatalog(catRes.map(c => ({
                    id: c.id,
                    description: c.description,
                    defaultPrice: Number(c.default_price)
                })));
            }

            // 2.5 Fetch task catalog
            const { data: taskCatRes } = await supabase.from('task_catalog').select('*');
            if (taskCatRes) {
                setTaskCatalog(taskCatRes.map(c => ({
                    id: c.id,
                    description: c.description,
                    defaultWeight: c.default_weight !== null ? Number(c.default_weight) : null
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
                                id: l.id,
                                description: l.description,
                                amount: Number(l.amount),
                                quantity: l.quantity ? Number(l.quantity) : 1, // Fallback to 1 for backwards compatibility with legacy rows
                                dateAdded: l.date_added
                            }))
                        };
                    }));

                    return {
                        id: profile.id,
                        company: profile.company,
                        email: profile.email,
                        taxRate: profile.tax_rate !== null ? Number(profile.tax_rate) : 0,
                        isTemporaryPassword: profile.is_temporary_password,
                        role: profile.role,
                        parentClientId: profile.parent_client_id,
                        permissions: profile.permissions || {},
                        sites: sitesList.map(s => ({
                            id: s.id,
                            companyName: s.company_name,
                            location: s.location,
                            taxRate: s.tax_rate || 0
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
                    taxRate: 0,
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

    const updateClientProfile = async (clientId, company, email, taxRate) => {
        const parsedTax = taxRate !== '' ? parseFloat(taxRate) : 0;
        const { error } = await supabase.from('profiles').update({ company, email, tax_rate: parsedTax }).eq('id', clientId);
        if (!error) {
            setUsers(prev => prev.map(u => u.id === clientId ? { ...u, company, email, taxRate: parsedTax } : u));
        } else {
            console.error("Failed to update client profile:", error);
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
                    taxRate: 0,
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

    const addSiteToAccount = async (userId, companyName, location, taxRate) => {
        const { data, error } = await supabase.from('sites').insert({
            user_id: userId,
            company_name: companyName,
            location: location,
            tax_rate: parseFloat(taxRate) || 0
        }).select().single();

        if (data && !error) {
            setUsers(prev => prev.map(user => {
                if (user.id === userId) {
                    return {
                        ...user,
                        sites: [...(user.sites || []), {
                            id: data.id,
                            companyName: data.company_name,
                            location: data.location,
                            taxRate: data.tax_rate || 0
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

    const updateSiteDetails = async (userId, siteId, updatedCompanyName, updatedLocation, updatedTaxRate) => {
        const { error } = await supabase.from('sites').update({
            company_name: updatedCompanyName,
            location: updatedLocation,
            tax_rate: parseFloat(updatedTaxRate) || 0
        }).eq('id', siteId);

        if (!error) {
            setUsers(prev => prev.map(user => {
                if (user.id === userId) {
                    return {
                        ...user,
                        sites: (user.sites || []).map(s =>
                            s.id === siteId ? {
                                ...s,
                                companyName: updatedCompanyName,
                                location: updatedLocation,
                                taxRate: parseFloat(updatedTaxRate) || 0
                            } : s
                        )
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

    const updateJobStatus = async (userId, jobId, newStatus) => {
        // UI Optimistic Update
        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                return {
                    ...user,
                    jobs: user.jobs.map(job =>
                        job.id === jobId ? { ...job, status: newStatus } : job
                    )
                };
            }
            return user;
        }));

        // DB Update
        await supabase.from('jobs').update({ status: newStatus }).eq('id', jobId);
    };

    const addBatchInvoiceToJob = async (userId, jobId, itemsArray) => {
        const newCatalogAdditions = [];

        // --- Tax Auto-Calculation Logic ---
        const targetUser = users.find(u => u.id === userId);
        const targetJob = targetUser?.jobs.find(j => j.id === jobId);

        let applicableTaxRate = 0;
        if (targetUser) {
            const jobLocation = targetJob?.meta?.location || `${targetUser.company} (Primary HQ)`;
            const isPrimaryHQ = jobLocation === `${targetUser.company} (Primary HQ)` || jobLocation === 'Primary HQ';

            if (isPrimaryHQ && targetUser.taxRate > 0) {
                applicableTaxRate = parseFloat(targetUser.taxRate);
            } else if (!isPrimaryHQ) {
                const matchedSite = targetUser.sites?.find(
                    s => `${s.companyName} - ${s.location}` === jobLocation
                );
                if (matchedSite && matchedSite.taxRate) {
                    applicableTaxRate = parseFloat(matchedSite.taxRate);
                }
            }
        }

        let runningSubtotal = 0;
        // ----------------------------------

        const preparedLineItems = itemsArray.map(item => {
            const exists = billingCatalog.find(cat => cat.description.toLowerCase() === item.description.toLowerCase());
            if (!exists) {
                newCatalogAdditions.push({
                    id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    description: item.description,
                    default_price: parseFloat(item.amount) // DB column is default_price
                });
            }

            const itemLineTotal = parseFloat(item.amount) * parseInt(item.quantity, 10);
            runningSubtotal += itemLineTotal;

            return {
                id: `li_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                job_id: jobId,
                description: item.description,
                amount: parseFloat(item.amount),
                quantity: parseInt(item.quantity, 10),
                date_added: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            };
        });

        // Inject automated Sales Tax line item if physical site warrants it
        if (applicableTaxRate > 0 && runningSubtotal > 0) {
            const taxAmount = runningSubtotal * (applicableTaxRate / 100);
            preparedLineItems.push({
                id: `li_${Date.now()}_${Math.random().toString(36).substr(2, 9)}_tax`,
                job_id: jobId,
                description: `Sales Tax (${applicableTaxRate}%)`,
                amount: parseFloat(taxAmount.toFixed(2)),
                quantity: 1,
                date_added: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            });
        }

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
                quantity: li.quantity,
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

    const addTaskCatalogItem = async (description, defaultWeight) => {
        const newItem = {
            id: `tcat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            description,
            default_weight: defaultWeight !== '' && defaultWeight !== null ? parseFloat(defaultWeight) : null
        };
        await supabase.from('task_catalog').insert(newItem);
        setTaskCatalog(prev => [{ ...newItem, defaultWeight: newItem.default_weight }, ...prev]);
    };

    const updateTaskCatalogItem = async (id, description, defaultWeight) => {
        const parsedWeight = defaultWeight !== '' && defaultWeight !== null ? parseFloat(defaultWeight) : null;
        await supabase.from('task_catalog').update({ description, default_weight: parsedWeight }).eq('id', id);
        setTaskCatalog(prev => prev.map(item =>
            item.id === id ? { ...item, description, defaultWeight: parsedWeight } : item
        ));
    };

    const deleteTaskCatalogItem = async (id) => {
        await supabase.from('task_catalog').delete().eq('id', id);
        setTaskCatalog(prev => prev.filter(item => item.id !== id));
    };

    const addTaskToJob = async (userId, jobId, title, customWeight = null, quantity = 1) => {
        const q = parseInt(quantity, 10) || 1;
        const newTasksForDB = [];
        const newTasksForUI = [];

        for (let i = 0; i < q; i++) {
            const uid = `tsk_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
            const taskTitle = q > 1 ? `${title} ${i + 1}/${q}` : title;
            const parsedWeight = customWeight ? parseFloat(customWeight) : null;

            newTasksForDB.push({
                id: uid,
                job_id: jobId,
                title: taskTitle,
                is_completed: false,
                weight: parsedWeight
            });

            newTasksForUI.push({
                id: uid,
                title: taskTitle,
                isCompleted: false,
                weight: parsedWeight
            });
        }

        await supabase.from('tasks').insert(newTasksForDB);

        setUsers(prev => prev.map(user => {
            if (user.id === userId) {
                const updatedJobs = user.jobs.map(job => {
                    if (job.id === jobId) {
                        const newTasks = [
                            ...(job.tasks || []),
                            ...newTasksForUI
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
            taskCatalog, addTaskCatalogItem, updateTaskCatalogItem, deleteTaskCatalogItem,
            addCatalogItem, updateCatalogItem, deleteCatalogItem,
            addTaskToJob, toggleTaskCompletion, deleteTaskFromJob, updateJobStatus,
            addClientAccount, updateClientProfile, updateClientPassword, addJobToAccount, updateJobNotes, updateJobDetails,
            addSiteToAccount, deleteSiteFromAccount, updateSiteDetails, addEmployeeToClient,
            isLoading
        }}>
            {children}
        </AdminContext.Provider>
    );
};
