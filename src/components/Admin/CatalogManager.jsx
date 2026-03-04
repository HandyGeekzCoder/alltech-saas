import React, { useContext, useState } from 'react';
import { AdminContext } from '../../AdminContext';
import { BookOpen, Edit2, Trash2, CheckCircle, X, PlusCircle } from 'lucide-react';

const CatalogManager = () => {
    const { billingCatalog, addCatalogItem, updateCatalogItem, deleteCatalogItem } = useContext(AdminContext);
    const [editingId, setEditingId] = useState(null);
    const [editDesc, setEditDesc] = useState('');
    const [editPrice, setEditPrice] = useState('');

    // New Item State
    const [newDesc, setNewDesc] = useState('');
    const [newPrice, setNewPrice] = useState('');

    const handleEditClick = (item) => {
        setEditingId(item.id);
        setEditDesc(item.description);
        setEditPrice(item.defaultPrice);
    };

    const handleSave = () => {
        if (editDesc && editPrice) {
            updateCatalogItem(editingId, editDesc, editPrice);
            setEditingId(null);
            setEditDesc('');
            setEditPrice('');
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditDesc('');
        setEditPrice('');
    };

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to permanently delete this catalog item? This will not affect existing invoices, only the predetermined selections.')) {
            deleteCatalogItem(id);
        }
    };

    const handleAddNew = (e) => {
        e.preventDefault();
        if (newDesc && newPrice) {
            addCatalogItem(newDesc, newPrice);
            setNewDesc('');
            setNewPrice('');
        }
    };

    return (
        <div>
            <div className="dashboard-topbar" style={{ borderBottomColor: 'rgba(255,0,127,0.3)' }}>
                <h2>Invoice Catalog Manager</h2>
                <div className="user-profile">
                    <span className="text-muted">System Administrator</span>
                    <div className="avatar" style={{ background: 'linear-gradient(135deg, #ff007f, #7000ff)' }}>S:A</div>
                </div>
            </div>

            <div className="glass-panel" style={{ marginTop: 'var(--sp-6)', padding: 'var(--sp-6)' }}>
                <div className="widget-header" style={{ marginBottom: 'var(--sp-4)' }}>
                    <PlusCircle size={20} color="#00ff64" />
                    <span style={{ color: '#fff' }}>Add New Catalog Item</span>
                </div>
                <form onSubmit={handleAddNew} style={{ display: 'flex', gap: 'var(--sp-4)', alignItems: 'flex-end' }}>
                    <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                        <label className="form-label">Service / Hardware Description</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="e.g. Ubiquiti UniFi AP AC Pro"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
                        <label className="form-label">Default Price (USD)</label>
                        <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            placeholder="149.00"
                            value={newPrice}
                            onChange={(e) => setNewPrice(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit" className="btn-secondary" style={{ height: '42px', padding: '0 24px', whiteSpace: 'nowrap' }}>
                        Add Item
                    </button>
                </form>
            </div>

            <div className="glass-panel" style={{ marginTop: 'var(--sp-6)', padding: 'var(--sp-6)' }}>
                <div className="widget-header" style={{ marginBottom: 'var(--sp-4)' }}>
                    <BookOpen size={20} color="#ff007f" />
                    <span style={{ color: '#fff' }}>Predetermined Services & Hardware Directory</span>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                                <th style={{ padding: '12px' }}>Description</th>
                                <th style={{ padding: '12px', textAlign: 'right', width: '150px' }}>Default Price (USD)</th>
                                <th style={{ padding: '12px', textAlign: 'right', width: '120px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {billingCatalog.map(item => {
                                const isEditing = editingId === item.id;

                                return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: isEditing ? 'rgba(255,0,127,0.05)' : 'transparent' }}>
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
                                                    step="0.01"
                                                    className="form-control"
                                                    value={editPrice}
                                                    onChange={(e) => setEditPrice(e.target.value)}
                                                    required
                                                />
                                            ) : (
                                                <span style={{ color: '#00ff64', fontWeight: '500' }}>
                                                    ${parseFloat(item.defaultPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                                                    <button onClick={() => handleEditClick(item)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }} title="Edit Item">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }} title="Delete Item">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                            {billingCatalog.length === 0 && (
                                <tr>
                                    <td colSpan="3" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                                        No items exist in the catalog. Add custom entries through the User Manager invoice builder to automatically populate this catalog.
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

export default CatalogManager;
