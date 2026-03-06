import React, { useContext, useState } from 'react';
import { AdminContext } from '../../AdminContext';
import { ListTodo, Edit2, Trash2, CheckCircle, X, PlusCircle } from 'lucide-react';

const TaskCatalogManager = () => {
    const { taskCatalog, addTaskCatalogItem, updateTaskCatalogItem, deleteTaskCatalogItem } = useContext(AdminContext);
    const [editingId, setEditingId] = useState(null);
    const [editDesc, setEditDesc] = useState('');
    const [editWeight, setEditWeight] = useState('');

    // New Item State
    const [newDesc, setNewDesc] = useState('');
    const [newWeight, setNewWeight] = useState('');

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setEditDesc(item.description);
        setEditWeight(item.defaultWeight || '');
    };

    const handleSave = () => {
        if (editDesc) {
            updateTaskCatalogItem(editingId, editDesc, editWeight);
            setEditingId(null);
            setEditDesc('');
            setEditWeight('');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditDesc('');
        setEditWeight('');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to permanently delete this task from the catalog? Ongoing jobs will not be affected.')) {
            deleteTaskCatalogItem(id);
        }
    };

    const handleAddNew = (e) => {
        e.preventDefault();
        if (newDesc) {
            addTaskCatalogItem(newDesc, newWeight);
            setNewDesc('');
            setNewWeight('');
        }
    };

    return (
        <div>
            <div className="dashboard-topbar" style={{ borderBottomColor: 'rgba(0,179,255,0.3)' }}>
                <h2>Task Catalog Manager</h2>
                <div className="user-profile">
                    <span className="text-muted">System Administrator</span>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, #00b3ff, #00ff64)' }}>S:A</div>
                </div>
            </div>

            <div className="glass-panel" style={{ marginTop: 'var(--sp-6)', padding: 'var(--sp-6)' }}>
                <div className="widget-header" style={{ marginBottom: 'var(--sp-4)' }}>
                    <PlusCircle size={20} color="#00ff64" />
                    <span style={{ color: '#fff' }}>Add New Predetermined Task</span>
                </div>
                <form onSubmit={handleAddNew} style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                        <label className="form-label">Task Description</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Install Unifi Access Point"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">Default Weight % (Optional)</label>
                        <input
                            type="number"
                            min="1"
                            max="100"
                            className="form-control"
                            placeholder="Auto"
                            value={newWeight}
                            onChange={(e) => setNewWeight(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn-secondary" style={{ height: '42px', padding: '0 24px', whiteSpace: 'nowrap', borderColor: '#00b3ff', color: '#00b3ff' }}>
                        Add Task
                    </button>
                </form>
            </div>

            <div className="glass-panel" style={{ marginTop: 'var(--sp-6)', padding: 'var(--sp-6)' }}>
                <div className="widget-header" style={{ marginBottom: 'var(--sp-4)' }}>
                    <ListTodo size={20} color="#00b3ff" />
                    <span style={{ color: '#fff' }}>Predetermined Tasks Directory</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '12px' }}>Description</th>
                                <th style={{ padding: '12px', textAlign: 'right', width: '150px' }}>Default Weight</th>
                                <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {taskCatalog.map(item => {
                                const isEditing = editingId === item.id;

                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isEditing ? 'rgba(0,179,255,0.05)' : 'transparent' }}>
                                        <td style={{ padding: '12px', color: '#fff' }}>
                                            {isEditing ? (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={editDesc}
                                                    onChange={(e) => setEditDesc(e.target.value)}
                                                    required
                                                />
                                            ) : (
                                                item.description
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="100"
                                                    className="form-control"
                                                    value={editWeight}
                                                    onChange={(e) => setEditWeight(e.target.value)}
                                                    placeholder="Auto"
                                                />
                                            ) : (
                                                <span style={{ color: item.defaultWeight ? '#00b3ff' : 'var(--text-muted)', fontWeight: '500' }}>
                                                    {item.defaultWeight ? `${item.defaultWeight}%` : 'Auto'}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px', textAlign: 'right' }}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button onClick={handleSave} style={{ background: 'none', border: 'none', color: '#00ff64', cursor: 'pointer', padding: '4px' }} title="Save">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }} title="Cancel">
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button onClick={() => handleEditClick(item)} style={{ background: 'none', border: 'none', color: '#00b3ff', cursor: 'pointer', padding: '4px' }} title="Edit Task">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }} title="Delete Task">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {taskCatalog.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        No items exist in the task catalog. Start adding tasks above to reuse them during job deployments.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TaskCatalogManager;
