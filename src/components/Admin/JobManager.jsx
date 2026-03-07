import React, { useContext, useState } from 'react';
import { AdminContext } from '../../AdminContext';
import { Target, CheckCircle2, Circle, Trash2, PlusCircle, ServerCog, Activity, Clock, DollarSign, Printer } from 'lucide-react';

const JobManager = () => {
    const { users, addTaskToJob, toggleTaskCompletion, deleteTaskFromJob, updateJobNotes, updateJobDetails, updateJobStatus, billingCatalog, taskCatalog, addBatchInvoiceToJob } = useContext(AdminContext);

    const usersWithJobs = users.filter(user => !user.parentClientId && user.jobs && user.jobs.length > 0);

    const [selectedUserId, setSelectedUserId] = useState('ALL');
    const [selectedStatus, setSelectedStatus] = useState('ALL');
    const [selectedSite, setSelectedSite] = useState('');
    const [selectedJobId, setSelectedJobId] = useState('');

    // New Task State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskWeight, setNewTaskWeight] = useState('');
    const [newTaskQuantity, setNewTaskQuantity] = useState(1);
    const [selectedTaskCatalogId, setSelectedTaskCatalogId] = useState('');

    const handleUserSelect = (e) => {
        setSelectedUserId(e.target.value);
        setSelectedSite('');
        setSelectedJobId(''); // Reset job selection when user changes
        setStagedItems([]);
    };

    const handleSiteSelect = (e) => {
        setSelectedSite(e.target.value);
        setSelectedJobId('');
        setStagedItems([]);
    };

    const handleJobSelect = (e) => {
        setSelectedJobId(e.target.value);
        setStagedItems([]);
        setSuccessMsg('');
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (activeJobUserId && selectedJobId && (newTaskTitle || selectedTaskCatalogId)) {
            let finalTitle = newTaskTitle;
            let finalWeight = newTaskWeight;

            if (selectedTaskCatalogId && !newTaskTitle) {
                const catalogItem = taskCatalog.find(c => c.id === selectedTaskCatalogId);
                if (catalogItem) {
                    finalTitle = catalogItem.description;
                    if (catalogItem.defaultWeight && !newTaskWeight) {
                        finalWeight = catalogItem.defaultWeight;
                    }
                }
            }

            await addTaskToJob(activeJobUserId, selectedJobId, finalTitle, finalWeight, newTaskQuantity);
            setNewTaskTitle('');
            setNewTaskWeight('');
            setNewTaskQuantity(1);
            setSelectedTaskCatalogId('');
        }
    };

    const isGlobalMode = selectedUserId === 'ALL' || selectedUserId === '';
    const selectedUser = users.find(u => u.id === selectedUserId);

    // Build options for edit dropdown & job filtering (Primary HQ + Sites)
    const allSiteOptions = selectedUser ? [
        `${selectedUser.company} (Primary HQ)`,
        ...(selectedUser.sites || []).map(s => `${s.companyName} - ${s.location}`)
    ] : [];

    const allJobsContext = isGlobalMode
        ? usersWithJobs.flatMap(u => (u.jobs || []).map(j => ({ ...j, _userName: u.company, _userId: u.id })))
        : (selectedUser?.jobs || []);

    const filteredJobs = allJobsContext.filter(j => {
        const matchesSite = !selectedSite || j.meta?.location === selectedSite;

        let matchesStatus = false;
        if (selectedStatus === 'ALL') {
            matchesStatus = true;
        } else if (selectedStatus === 'Pending') {
            matchesStatus = j.status === 'Pending' || j.status === 'Pending Review';
        } else {
            matchesStatus = j.status === selectedStatus;
        }

        return matchesSite && matchesStatus;
    });

    const activeJobUserId = (isGlobalMode && selectedJobId)
        ? usersWithJobs.find(u => u.jobs?.some(j => j.id === selectedJobId))?.id
        : selectedUserId;

    const realSelectedUser = users.find(u => u.id === activeJobUserId);
    const selectedJob = realSelectedUser?.jobs.find(j => j.id === selectedJobId);

    const [adminNotes, setAdminNotes] = useState('');
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editLocation, setEditLocation] = useState('');
    const [editRequestedBy, setEditRequestedBy] = useState('');
    const [editStatus, setEditStatus] = useState('');
    const [isSavingDetails, setIsSavingDetails] = useState(false);

    React.useEffect(() => {
        if (selectedJob) {
            setAdminNotes(selectedJob.meta?.adminNotes || '');
            setIsEditing(false);
            setEditLocation(selectedJob.meta?.location || '');
            setEditRequestedBy(selectedJob.meta?.requested_by || '');
            setEditStatus(selectedJob.status || 'Active');
            setNewTaskTitle('');
            setNewTaskWeight('');
            setNewTaskQuantity(1);
            setSelectedTaskCatalogId('');
        }
    }, [selectedJobId]);

    const handleSaveDetails = async () => {
        if (!selectedJob) return;
        setIsSavingDetails(true);
        await updateJobDetails(activeJobUserId, selectedJobId, editLocation, editRequestedBy);
        // Only trigger status update if it actually changed
        if (editStatus !== selectedJob.status) {
            await updateJobStatus(activeJobUserId, selectedJobId, editStatus);
        }
        setIsSavingDetails(false);
        setIsEditing(false);
    };

    const handleSaveNotes = async () => {
        if (!selectedJob) return;
        setIsSavingNotes(true);
        await updateJobNotes(activeJobUserId, selectedJobId, adminNotes);
        setIsSavingNotes(false);
    };

    // --- Invoice Builder State & Handlers ---
    const [stagedItems, setStagedItems] = useState([]);
    const [selectedCatalogId, setSelectedCatalogId] = useState('');
    const [chargeDesc, setChargeDesc] = useState('');
    const [chargeAmount, setChargeAmount] = useState('');
    const [chargeQty, setChargeQty] = useState(1);
    const [successMsg, setSuccessMsg] = useState('');

    const handleCatalogSelect = (e) => {
        const val = e.target.value;
        setSelectedCatalogId(val);

        if (val === 'custom' || val === '') {
            setChargeDesc('');
            setChargeAmount('');
        } else {
            const item = billingCatalog.find(c => c.id === val);
            if (item) {
                setChargeDesc(item.description);
                setChargeAmount(item.defaultPrice);
            }
        }
    };

    const handleAddStagedItem = (e) => {
        e.preventDefault();
        if (chargeDesc && chargeAmount && chargeQty > 0) {
            setStagedItems(prev => [
                ...prev,
                {
                    id: `draft_${Date.now()}`,
                    description: chargeDesc,
                    amount: parseFloat(chargeAmount),
                    quantity: parseInt(chargeQty, 10)
                }
            ]);

            setSelectedCatalogId('');
            setChargeDesc('');
            setChargeAmount('');
            setChargeQty(1);
        }
    };

    const removeStagedItem = (draftId) => {
        setStagedItems(prev => prev.filter(item => item.id !== draftId));
    };

    const handleBatchSubmit = () => {
        if (activeJobUserId && selectedJobId && stagedItems.length > 0) {
            addBatchInvoiceToJob(activeJobUserId, selectedJobId, stagedItems);
            setSuccessMsg(`Successfully billed ${stagedItems.length} items to this job.`);
            setStagedItems([]);
            setTimeout(() => setSuccessMsg(''), 4000);
        }
    };

    const stagedTotal = stagedItems.reduce((acc, current) => acc + (current.amount * current.quantity), 0);
    // ----------------------------------------

    // Calculate unweighted vs weighted totals for UI badge
    const tasks = selectedJob?.tasks || [];
    const weightedTasks = tasks.filter(t => t.weight !== null && t.weight > 0);
    const unweightedTasks = tasks.filter(t => t.weight === null || t.weight <= 0);

    let claimedWeight = weightedTasks.reduce((acc, t) => acc + t.weight, 0);
    if (claimedWeight > 100) claimedWeight = 100;
    const defaultWeightPerTask = unweightedTasks.length > 0 ? ((100 - claimedWeight) / unweightedTasks.length) : 0;

    const handlePrintInvoice = () => {
        window.print();
    };

    const hasLineItems = selectedJob?.lineItems && selectedJob.lineItems.length > 0;

    // Auto calculate if there's any tax configuration based on the active Job's site
    let appliedTaxRate = 0;
    if (realSelectedUser && selectedJob?.meta?.location) {
        // Attempt to find the specific site string match to extract the linked decimal tax rate
        const matchedSite = realSelectedUser.sites?.find(s => `${s.companyName} - ${s.location}` === selectedJob.meta.location);
        if (matchedSite && matchedSite.taxRate > 0) {
            appliedTaxRate = matchedSite.taxRate / 100;
        }
    }

    let dbSubtotal = 0;
    if (hasLineItems) {
        dbSubtotal = selectedJob.lineItems.reduce((acc, current) => acc + (current.amount * current.quantity), 0);
    }

    const dbTaxAmount = dbSubtotal * appliedTaxRate;
    const dbGrandTotal = dbSubtotal + dbTaxAmount;

    return (
        <div>
            <div className="dashboard-topbar" style={{ borderBottomColor: 'rgba(0,255,100,0.3)' }}>
                <h2>Job Tracker & Tasks</h2>
                <div className="user-profile">
                    <span className="text-muted">System Administrator</span>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, #00ff64, #00b3ff)' }}>S:A</div>
                </div>
            </div>

            <div className="glass-panel" style={{ marginTop: 'var(--sp-6)', padding: 'var(--sp-6)' }}>
                <div className="widget-header" style={{ marginBottom: 'var(--sp-4)' }}>
                    <Target size={20} color="#00ff64" />
                    <span style={{ color: '#fff' }}>1. Target Activation</span>
                </div>

                <div style={{ display: 'flex', gap: 'var(--sp-4)', flexWrap: 'wrap' }}>
                    <div className="form-group" style={{ flex: 1, minWidth: '150px' }}>
                        <label className="form-label text-muted">Filter By Status</label>
                        <select className="form-control" value={selectedStatus} onChange={(e) => { setSelectedStatus(e.target.value); setSelectedJobId(''); }}>
                            <option value="ALL">All Statuses</option>
                            <option value="Pending">Pending</option>
                            <option value="Active">Active</option>
                            <option value="Completed">Completed</option>
                            <option value="Paid">Paid</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: 1.5, minWidth: '200px' }}>
                        <label className="form-label text-muted">Select Client Account</label>
                        <select className="form-control" value={selectedUserId} onChange={handleUserSelect}>
                            <option value="ALL">-- All Accounts --</option>
                            {usersWithJobs.map(user => (
                                <option key={user.id} value={user.id}>{user.company}</option>
                            ))}
                        </select>
                    </div>

                    {!isGlobalMode && allSiteOptions.length > 0 && (
                        <div className="form-group" style={{ flex: 1.5, minWidth: '200px' }}>
                            <label className="form-label text-muted">Select Site Location</label>
                            <select className="form-control" value={selectedSite} onChange={handleSiteSelect} disabled={!selectedUserId}>
                                <option value="">-- All Sites --</option>
                                {allSiteOptions.map((site, i) => (
                                    <option key={i} value={site}>{site}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="form-group" style={{ flex: 2, minWidth: '250px' }}>
                        <label className="form-label text-muted">Select Active Job</label>
                        <select
                            className="form-control"
                            value={selectedJobId}
                            onChange={handleJobSelect}
                        >
                            <option value="">-- Choose Job --</option>
                            {filteredJobs.map(job => (
                                <option key={job.id} value={job.id}>
                                    {isGlobalMode ? `${job._userName} - ` : ''}{job.title} ({job.status})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {selectedJob && (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 3fr)', gap: 'var(--sp-6)', marginTop: 'var(--sp-6)' }}>

                    {/* Left Column: Tasks */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
                        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
                            <div className="widget-header" style={{ marginBottom: 'var(--sp-4)' }}>
                                <Activity size={20} color="#00ff64" />
                                <span style={{ color: '#fff' }}>Job Progress Metrics</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-4)', marginBottom: 'var(--sp-2)' }}>
                                <div style={{ flex: 1, height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${selectedJob.progress}%`,
                                        height: '100%',
                                        background: selectedJob.progress === 100 ? '#00ff64' : 'linear-gradient(90deg, #00b3ff, #00ff64)',
                                        transition: 'width 0.5s ease-out'
                                    }}></div>
                                </div>
                                <span style={{ color: selectedJob.progress === 100 ? '#00ff64' : '#fff', fontWeight: 'bold' }}>{selectedJob.progress}%</span>
                            </div>
                            <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>
                                ({unweightedTasks.length} unweighted tasks @ ~{defaultWeightPerTask.toFixed(1)}% each)
                            </span>
                        </div>

                        <div className="glass-panel" style={{ padding: 'var(--sp-6)' }}>
                            <div className="widget-header" style={{ marginBottom: 'var(--sp-4)' }}>
                                <ServerCog size={20} color="#00b3ff" />
                                <span style={{ color: '#fff' }}>2. Actionable Tasks</span>
                            </div>

                            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 'var(--sp-2)', marginBottom: 'var(--sp-6)', flexWrap: 'wrap' }}>
                                <div style={{ flex: '1 1 30%', minWidth: '200px' }}>
                                    <select
                                        className="form-control"
                                        value={selectedTaskCatalogId}
                                        onChange={(e) => {
                                            setSelectedTaskCatalogId(e.target.value);
                                            // Auto-fill weight from catalog if empty
                                            if (e.target.value) {
                                                const catItem = taskCatalog.find(c => c.id === e.target.value);
                                                if (catItem && catItem.defaultWeight && !newTaskWeight) {
                                                    setNewTaskWeight(catItem.defaultWeight);
                                                }
                                            } else {
                                                setNewTaskWeight('');
                                            }
                                        }}
                                        style={{ background: 'rgba(0,0,0,0.2)' }}
                                    >
                                        <option value="">-- Predetermined Task --</option>
                                        {taskCatalog.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.description} {item.defaultWeight ? `(${item.defaultWeight}%)` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div style={{ flex: '1 1 40%', minWidth: '200px' }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Or enter custom description..."
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        style={{ background: 'rgba(0,0,0,0.2)' }}
                                        disabled={!!selectedTaskCatalogId}
                                    />
                                </div>
                                <div style={{ flex: '0 0 100px' }}>
                                    <input
                                        type="number"
                                        className="form-control"
                                        title="Quantity"
                                        placeholder="Qty"
                                        value={newTaskQuantity}
                                        onChange={(e) => setNewTaskQuantity(e.target.value)}
                                        min="1"
                                        max="50"
                                        style={{ background: 'rgba(0,0,0,0.2)' }}
                                    />
                                </div>
                                <div style={{ flex: '0 0 120px' }}>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Weight %"
                                        value={newTaskWeight}
                                        onChange={(e) => setNewTaskWeight(e.target.value)}
                                        min="1"
                                        max="100"
                                        style={{ background: 'rgba(0,0,0,0.2)' }}
                                    />
                                </div>
                                <button type="submit" className="btn-secondary" style={{ flex: '0 0 50px', padding: '0', background: 'rgba(0, 179, 255, 0.1)', color: '#00b3ff', border: '1px solid rgba(0, 179, 255, 0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} disabled={!newTaskTitle && !selectedTaskCatalogId}>
                                    <PlusCircle size={20} />
                                </button>
                            </form>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {tasks.map(task => (
                                    <div
                                        key={task.id}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            background: task.isCompleted ? 'rgba(0, 255, 100, 0.05)' : 'rgba(255,255,255,0.02)',
                                            border: `1px solid ${task.isCompleted ? 'rgba(0, 255, 100, 0.2)' : 'rgba(255,255,255,0.05)'}`,
                                            borderRadius: '8px',
                                            transition: 'all 0.2sease'
                                        }}
                                    >
                                        <button
                                            onClick={() => toggleTaskCompletion(activeJobUserId, selectedJobId, task.id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: task.isCompleted ? '#00ff64' : 'var(--text-muted)',
                                                cursor: 'pointer',
                                                padding: 0,
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                        >
                                            {task.isCompleted ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                                        </button>

                                        <span style={{
                                            flex: 1,
                                            color: task.isCompleted ? 'var(--text-muted)' : '#fff',
                                            textDecoration: task.isCompleted ? 'line-through' : 'none'
                                        }}>
                                            {task.title}
                                        </span>

                                        <span style={{
                                            fontSize: 'var(--text-xs)',
                                            background: 'rgba(0,0,0,0.3)',
                                            padding: '2px 8px',
                                            borderRadius: '4px',
                                            color: task.weight ? '#00b3ff' : 'var(--text-muted)'
                                        }}>
                                            {task.weight ? `${task.weight}%` : 'Auto'}
                                        </span>

                                        <button
                                            onClick={() => deleteTaskFromJob(activeJobUserId, selectedJobId, task.id)}
                                            style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px', marginLeft: '8px', opacity: 0.7 }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {tasks.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                                        No tasks assigned to this job yet. Add one above.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-6)' }}>
                        {/* Right Column Top: Job Summary */}
                        <div className="glass-panel" style={{ padding: 'var(--sp-6)', height: 'fit-content' }}>
                            <div className="widget-header" style={{ marginBottom: 'var(--sp-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <Clock size={20} color="var(--primary)" />
                                    <span style={{ color: '#fff' }}>Deploy Details</span>
                                </div>
                                <button
                                    onClick={() => setIsEditing(!isEditing)}
                                    style={{ background: 'none', border: 'none', color: '#00b3ff', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    {isEditing ? 'Cancel Edit' : 'Edit Details'}
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Company</span>
                                    <div style={{ color: '#fff', fontWeight: '500' }}>{realSelectedUser?.company}</div>
                                </div>

                                {isEditing ? (
                                    <>
                                        <div>
                                            <span className="text-muted" style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '4px' }}>Requested By</span>
                                            <input
                                                type="text"
                                                className="form-control"
                                                style={{ padding: '6px', fontSize: '14px' }}
                                                value={editRequestedBy}
                                                onChange={(e) => setEditRequestedBy(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <span className="text-muted" style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '4px' }}>Location</span>
                                            <select
                                                className="form-control"
                                                style={{ padding: '6px', fontSize: '14px' }}
                                                value={editLocation}
                                                onChange={(e) => setEditLocation(e.target.value)}
                                            >
                                                {realSelectedUser ? [
                                                    `${realSelectedUser.company} (Primary HQ)`,
                                                    ...(realSelectedUser.sites || []).map(s => `${s.companyName} - ${s.location}`)
                                                ].map((opt, i) => (
                                                    <option key={i} value={opt}>{opt}</option>
                                                )) : null}
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-muted" style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '4px' }}>Job Status</span>
                                            <select
                                                className="form-control"
                                                style={{ padding: '6px', fontSize: '14px' }}
                                                value={editStatus}
                                                onChange={(e) => setEditStatus(e.target.value)}
                                            >
                                                <option value="Pending Review">Pending Review</option>
                                                <option value="Active">Active</option>
                                                <option value="Completed">Completed</option>
                                                <option value="Paid">Paid</option>
                                            </select>
                                        </div>
                                        <button
                                            className="btn-primary"
                                            style={{ padding: '8px', fontSize: '13px', marginTop: '4px' }}
                                            onClick={handleSaveDetails}
                                            disabled={isSavingDetails}
                                        >
                                            {isSavingDetails ? 'Saving...' : 'Save Details'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        {selectedJob.meta?.requested_by && (
                                            <div>
                                                <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Requested By</span>
                                                <div style={{ color: '#fff' }}>{selectedJob.meta.requested_by}</div>
                                            </div>
                                        )}
                                        {selectedJob.meta?.location && (
                                            <div>
                                                <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Location</span>
                                                <div style={{ color: '#00b3ff' }}>{selectedJob.meta.location}</div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {isEditing ? null : (
                                    <div>
                                        <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Job Status</span>
                                        <div>
                                            <span style={{
                                                color: selectedJob.status === 'Completed' || selectedJob.status === 'Paid' ? '#00ff64' : (selectedJob.status === 'Active' ? '#00b3ff' : 'var(--primary)'),
                                                background: selectedJob.status === 'Completed' || selectedJob.status === 'Paid' ? 'rgba(0,255,100,0.1)' : (selectedJob.status === 'Active' ? 'rgba(0,179,255,0.1)' : 'rgba(255,0,127,0.1)'),
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: 'var(--text-sm)',
                                                fontWeight: '500',
                                                display: 'inline-block'
                                            }}>
                                                {selectedJob.status}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <div>
                                    <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Timeline</span>
                                    <div style={{ color: '#fff' }}>{selectedJob.date}</div>
                                </div>

                                <hr style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '8px 0' }} />

                                <div>
                                    <span className="text-muted" style={{ fontSize: 'var(--text-sm)', display: 'block', marginBottom: '8px' }}>Internal Admin Notes</span>
                                    <textarea
                                        className="form-control"
                                        style={{ background: 'rgba(0,0,0,0.3)', minHeight: '100px', fontSize: '14px', marginBottom: '8px' }}
                                        placeholder="Add private deployment notes here..."
                                        value={adminNotes}
                                        onChange={(e) => setAdminNotes(e.target.value)}
                                    ></textarea>
                                    <button
                                        className="btn-secondary"
                                        style={{ width: '100%', padding: '8px', fontSize: '13px' }}
                                        onClick={handleSaveNotes}
                                        disabled={isSavingNotes}
                                    >
                                        {isSavingNotes ? 'Saving...' : 'Save Notes'}
                                    </button>
                                </div>

                                {hasLineItems && (
                                    <div style={{ marginTop: 'var(--sp-4)', background: 'rgba(0, 0, 0, 0.2)', padding: 'var(--sp-4)', borderRadius: '8px' }}>
                                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px', marginBottom: '8px', color: '#fff', fontWeight: 'bold' }}>
                                            Committed Invoice
                                        </div>
                                        <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                            <thead>
                                                <tr style={{ color: 'var(--text-muted)', textAlign: 'left', borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                                                    <th style={{ paddingBottom: '4px' }}>Item</th>
                                                    <th style={{ paddingBottom: '4px', textAlign: 'right' }}>Price</th>
                                                    <th style={{ paddingBottom: '4px', textAlign: 'right' }}>Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedJob.lineItems.map(item => (
                                                    <tr key={item.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.05)' }}>
                                                        <td style={{ padding: '8px 4px', color: '#e0e0e0' }}>
                                                            {item.quantity}x {item.description}
                                                        </td>
                                                        <td style={{ padding: '8px 4px', textAlign: 'right', color: 'var(--text-muted)' }}>
                                                            ${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td style={{ padding: '8px 4px', textAlign: 'right', color: '#fff', fontWeight: '500' }}>
                                                            ${(item.amount * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>

                                        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                <span>Subtotal:</span>
                                                <span>${dbSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            {appliedTaxRate > 0 && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '4px' }}>
                                                    <span>Sales Tax ({(appliedTaxRate * 100).toFixed(2)}%):</span>
                                                    <span>${dbTaxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                                </div>
                                            )}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#00ff64', fontSize: '1rem', fontWeight: 'bold', marginTop: '4px' }}>
                                                <span>Total:</span>
                                                <span>${dbGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={handlePrintInvoice}
                                            className="btn-secondary"
                                            style={{
                                                width: '100%',
                                                marginTop: 'var(--sp-4)',
                                                display: 'flex',
                                                justifyContent: 'center',
                                                alignItems: 'center',
                                                gap: '8px',
                                                borderColor: '#00b3ff',
                                                color: '#00b3ff'
                                            }}
                                        >
                                            <Printer size={16} /> Print Official Invoice
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column Bottom: Invoice Builder */}
                        <div className="glass-panel widget" style={{ borderTop: '2px solid rgba(0, 240, 255, 0.5)' }}>
                            <div className="widget-header">
                                <DollarSign size={20} color="var(--primary)" />
                                <span style={{ color: '#fff' }}>Stage Job Billing</span>
                            </div>

                            <form onSubmit={handleAddStagedItem} style={{ marginTop: 'var(--sp-4)' }}>
                                <div className="form-group">
                                    <label className="form-label">Select Pre-Priced Item (Optional)</label>
                                    <select
                                        className="form-control"
                                        style={{ appearance: 'none' }}
                                        value={selectedCatalogId}
                                        onChange={handleCatalogSelect}
                                    >
                                        <option value="">-- Choose from Catalog --</option>
                                        {billingCatalog.map(item => (
                                            <option key={item.id} value={item.id}>{item.description} - ${item.defaultPrice}</option>
                                        ))}
                                        <option value="custom">-- Custom Entry --</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Line Item Description</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Hardware / Labor description..."
                                        value={chargeDesc}
                                        onChange={(e) => setChargeDesc(e.target.value)}
                                        required
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
                                    <div className="form-group" style={{ flex: 1 }}>
                                        <label className="form-label">Unit Price (USD)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="form-control"
                                            placeholder="00.00"
                                            value={chargeAmount}
                                            onChange={(e) => setChargeAmount(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ width: '100px' }}>
                                        <label className="form-label">Quantity</label>
                                        <input
                                            type="number"
                                            min="1"
                                            step="1"
                                            className="form-control"
                                            value={chargeQty}
                                            onChange={(e) => setChargeQty(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <button type="submit" className="btn-secondary" style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <PlusCircle size={18} /> Add To Staged Invoice
                                </button>
                            </form>

                            {/* Pending Staged Invoice List */}
                            {stagedItems.length > 0 && (
                                <div style={{ marginTop: 'var(--sp-6)', background: 'rgba(255, 0, 127, 0.05)', padding: 'var(--sp-4)', borderRadius: '8px', border: '1px solid rgba(255, 0, 127, 0.2)' }}>
                                    <div style={{ paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', marginBottom: '8px' }}>
                                        <span style={{ color: '#fff', fontWeight: 'bold' }}>Review & Submit Invoice</span>
                                    </div>

                                    <div style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: 'var(--sp-4)' }}>
                                        <table style={{ width: '100%', fontSize: '0.85rem' }}>
                                            <tbody>
                                                {stagedItems.map(item => (
                                                    <tr key={item.id} style={{ borderBottom: '1px dashed rgba(255,255,255,0.1)' }}>
                                                        <td style={{ padding: '8px 4px', color: '#e0e0e0', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.quantity}x {item.description}
                                                        </td>
                                                        <td style={{ padding: '8px 4px', textAlign: 'right', color: '#fff', width: '70px' }}>
                                                            ${(item.amount * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                                        </td>
                                                        <td style={{ padding: '8px 4px', width: '30px', textAlign: 'right' }}>
                                                            <button
                                                                onClick={() => removeStagedItem(item.id)}
                                                                style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--sp-4)', fontWeight: 'bold' }}>
                                        <span style={{ color: 'var(--text-muted)' }}>Staged Subtotal:</span>
                                        <span style={{ color: '#ff007f', fontSize: '1.1rem' }}>${stagedTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                    </div>

                                    <button onClick={handleBatchSubmit} className="btn-primary" style={{ width: '100%', background: 'linear-gradient(135deg, #ff007f, #7000ff)' }}>
                                        Commit Invoice Payload
                                    </button>
                                </div>
                            )}

                            {successMsg && <div style={{ marginTop: '12px', color: '#00ff64', fontSize: '0.875rem', textAlign: 'center', padding: '8px', background: 'rgba(0, 255, 100, 0.1)', borderRadius: '8px' }}>{successMsg}</div>}
                        </div>
                    </div>

                </div>
            )}

            {/* Print Only Payload */}
            {selectedJob && hasLineItems && (
                <div className="print-only">
                    <div className="print-header">
                        <div>
                            {/* Dummy SVG Logo for printing purposes */}
                            <svg width="180" height="40" viewBox="0 0 180 40" xmlns="http://www.w3.org/2000/svg">
                                <text x="0" y="28" fontFamily="Outfit, sans-serif" fontSize="28" fontWeight="800" fill="#050508">ALLTECH</text>
                                <text x="118" y="28" fontFamily="Outfit, sans-serif" fontSize="28" fontWeight="300" fill="#7000ff">SaaS</text>
                            </svg>
                            <div style={{ marginTop: '8px', color: '#555', fontSize: '0.9rem' }}>
                                123 Tech Boulevard<br />
                                Suite 400<br />
                                Innovation City, IN 40291<br />
                                billing@alltech-saas.com
                            </div>
                        </div>
                        <div className="print-meta">
                            <h2 style={{ color: '#222', margin: '0 0 8px 0', fontSize: '2rem', textTransform: 'uppercase' }}>Invoice</h2>
                            <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px' }}>INV-{selectedJob.id.split('-')[0].toUpperCase()}</div>
                            <div>Date: {new Date().toLocaleDateString()}</div>
                            <div style={{ marginTop: '16px' }}>
                                <strong style={{ color: '#222', display: 'block', marginBottom: '4px' }}>Billed To:</strong>
                                <div>{realSelectedUser?.company}</div>
                                <div>{selectedJob.meta?.requested_by || 'Client Agent'}</div>
                                <div style={{ maxWidth: '200px', marginLeft: 'auto' }}>
                                    {selectedJob.meta?.location || 'Primary HQ'}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '24px', padding: '16px', background: '#f8f9fa', borderLeft: '4px solid #7000ff' }}>
                        <h3 style={{ margin: '0 0 4px 0', color: '#333' }}>Project Reference</h3>
                        <div style={{ fontSize: '1.1rem', fontWeight: '500', color: '#555' }}>{selectedJob.title}</div>
                    </div>

                    <table className="print-table">
                        <thead>
                            <tr>
                                <th style={{ width: '10%' }}>Qty</th>
                                <th style={{ width: '60%' }}>Description</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Unit Price</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Line Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedJob.lineItems.map(item => (
                                <tr key={item.id}>
                                    <td style={{ fontWeight: 'bold' }}>{item.quantity}</td>
                                    <td>{item.description}</td>
                                    <td style={{ textAlign: 'right' }}>${item.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                    <td style={{ textAlign: 'right', fontWeight: '500' }}>${(item.amount * item.quantity).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="print-totals">
                        <div className="print-totals-row">
                            <span>Subtotal:</span>
                            <span>${dbSubtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>

                        {appliedTaxRate > 0 && (
                            <div className="print-totals-row">
                                <span style={{ color: '#666' }}>Sales Tax ({(appliedTaxRate * 100).toFixed(2)}%):</span>
                                <span>${dbTaxAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}

                        <div className="print-totals-row grand-total">
                            <span>Amount Due:</span>
                            <span>${dbGrandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>

                    <div style={{ clear: 'both', paddingTop: '60px', borderTop: '1px solid #eee', marginTop: '60px', textAlign: 'center', color: '#777', fontSize: '0.9rem' }}>
                        <p>Thank you for your business.</p>
                        <p>Please make all checks payable to AllTech SaaS. Payment is due within 30 days.</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default JobManager;
