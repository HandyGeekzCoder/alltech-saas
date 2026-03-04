import React, { useContext, useState } from 'react';
import { AdminContext } from '../../AdminContext';
import { Target, CheckCircle2, Circle, Trash2, PlusCircle, ServerCog, Activity, Clock } from 'lucide-react';

const JobManager = () => {
    const { users, addTaskToJob, toggleTaskCompletion, deleteTaskFromJob } = useContext(AdminContext);

    // Filter out users who have at least one job
    const usersWithJobs = users.filter(user => user.jobs && user.jobs.length > 0);

    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedJobId, setSelectedJobId] = useState('');

    // New Task State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskWeight, setNewTaskWeight] = useState('');

    const handleUserSelect = (e) => {
        setSelectedUserId(e.target.value);
        setSelectedJobId(''); // Reset job selection when user changes
    };

    const handleJobSelect = (e) => {
        setSelectedJobId(e.target.value);
    };

    const handleAddTask = (e) => {
        e.preventDefault();
        if (selectedUserId && selectedJobId && newTaskTitle) {
            addTaskToJob(selectedUserId, selectedJobId, newTaskTitle, newTaskWeight || null);
            setNewTaskTitle('');
            setNewTaskWeight('');
        }
    };

    // Derived context
    const selectedUser = users.find(u => u.id === selectedUserId);
    const selectedJob = selectedUser?.jobs.find(j => j.id === selectedJobId);

    // Calculate unweighted vs weighted totals for UI badge
    const tasks = selectedJob?.tasks || [];
    const weightedTasks = tasks.filter(t => t.weight !== null && t.weight > 0);
    const unweightedTasks = tasks.filter(t => t.weight === null || t.weight <= 0);

    let claimedWeight = weightedTasks.reduce((acc, t) => acc + t.weight, 0);
    if (claimedWeight > 100) claimedWeight = 100;
    const defaultWeightPerTask = unweightedTasks.length > 0 ? ((100 - claimedWeight) / unweightedTasks.length) : 0;

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

                <div style={{ display: 'flex', gap: 'var(--sp-4)' }}>
                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label text-muted">Select Client Account</label>
                        <select className="form-control" value={selectedUserId} onChange={handleUserSelect}>
                            <option value="">-- Choose Account --</option>
                            {usersWithJobs.map(user => (
                                <option key={user.id} value={user.id}>{user.company}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                        <label className="form-label text-muted">Select Active Job</label>
                        <select
                            className="form-control"
                            value={selectedJobId}
                            onChange={handleJobSelect}
                            disabled={!selectedUserId}
                        >
                            <option value="">-- Choose Job --</option>
                            {selectedUser?.jobs.map(job => (
                                <option key={job.id} value={job.id}>{job.title} ({job.status})</option>
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

                            <form onSubmit={handleAddTask} style={{ display: 'flex', gap: 'var(--sp-3)', marginBottom: 'var(--sp-6)' }}>
                                <div style={{ flex: 3 }}>
                                    <input
                                        type="text"
                                        className="form-control"
                                        placeholder="Enter new task description..."
                                        value={newTaskTitle}
                                        onChange={(e) => setNewTaskTitle(e.target.value)}
                                        required
                                        style={{ background: 'rgba(0,0,0,0.2)' }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <input
                                        type="number"
                                        className="form-control"
                                        placeholder="Weight % (Optional)"
                                        value={newTaskWeight}
                                        onChange={(e) => setNewTaskWeight(e.target.value)}
                                        min="1"
                                        max="100"
                                        style={{ background: 'rgba(0,0,0,0.2)' }}
                                    />
                                </div>
                                <button type="submit" className="btn-secondary" style={{ padding: '0 16px', background: 'rgba(0, 179, 255, 0.1)', color: '#00b3ff', borderColor: 'rgba(0, 179, 255, 0.3)' }}>
                                    <PlusCircle size={18} />
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
                                            onClick={() => toggleTaskCompletion(selectedUserId, selectedJobId, task.id)}
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
                                            onClick={() => deleteTaskFromJob(selectedUserId, selectedJobId, task.id)}
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

                    {/* Right Column: Job Summary */}
                    <div className="glass-panel" style={{ padding: 'var(--sp-6)', height: 'fit-content' }}>
                        <div className="widget-header" style={{ marginBottom: 'var(--sp-4)' }}>
                            <Clock size={20} color="var(--primary)" />
                            <span style={{ color: '#fff' }}>Deploy Details</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Company</span>
                                <div style={{ color: '#fff', fontWeight: '500' }}>{selectedUser.company}</div>
                            </div>
                            <div>
                                <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Job Status</span>
                                <div>
                                    <span style={{
                                        color: selectedJob.status === 'Completed' ? '#00ff64' : (selectedJob.status === 'Active' ? '#00b3ff' : 'var(--primary)'),
                                        background: selectedJob.status === 'Completed' ? 'rgba(0,255,100,0.1)' : (selectedJob.status === 'Active' ? 'rgba(0,179,255,0.1)' : 'rgba(255,0,127,0.1)'),
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
                            <div>
                                <span className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Timeline</span>
                                <div style={{ color: '#fff' }}>{selectedJob.date}</div>
                            </div>
                        </div>
                    </div>

                </div>
            )}
        </div>
    );
};

export default JobManager;
