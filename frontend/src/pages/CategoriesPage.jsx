import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Edit2, Search, ArrowUpDown, Shield, ShieldAlert, ChevronLeft, ChevronRight } from 'lucide-react';

export default function CategoriesPage() {
  const {
    categories,
    setCategories,
    showToast
  } = useContext(AdminContext);

  const [catForm, setCatForm] = useState({ id: '', name: '', slug: '', description: '', sortOrder: '', isEdit: false, isActive: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState('sortOrder');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSaveCategory = (e) => {
    e.preventDefault();
    if (!catForm.name || !catForm.slug) {
      showToast('Name and Slug are required', 'error');
      return;
    }
    if (catForm.isEdit) {
      setCategories((prev) => prev.map((c) => c.id === catForm.id || c._id === catForm.id ? { ...catForm, isEdit: false } : c));
      showToast('Category Updated Successfully!');
    } else {
      const newCat = { ...catForm, id: `c_${Date.now()}`, _id: `c_${Date.now()}` };
      setCategories((prev) => [...prev, newCat]);
      showToast('Category Created Successfully!');
    }
    setCatForm({ id: '', name: '', slug: '', description: '', sortOrder: '', isEdit: false, isActive: true });
  };

  const toggleStatus = (cat) => {
    const nextStatus = !cat.isActive;
    setCategories((prev) =>
      prev.map((c) => (c.id === cat.id || c._id === cat.id || c._id === cat._id ? { ...c, isActive: nextStatus } : c))
    );
    showToast(`Category status set to ${nextStatus ? 'Enabled' : 'Disabled'}`, 'success');
  };

  const triggerSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtering Logic
  const filtered = categories.filter((c) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === '' ||
      (statusFilter === 'active' && c.isActive) ||
      (statusFilter === 'inactive' && !c.isActive);

    return matchesSearch && matchesStatus;
  });

  // Sorting logic
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];
    if (sortField === 'sortOrder') {
      aVal = Number(aVal) || 0;
      bVal = Number(bVal) || 0;
    } else {
      aVal = String(aVal).toLowerCase();
      bVal = String(bVal).toLowerCase();
    }
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination calculation
  const totalItems = sorted.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const paginated = sorted.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div style={{ animation: 'fadeIn 0.25s', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      
      {/* CRUD Listing Grid */}
      <div style={{ flex: 1, minWidth: 400, backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: '700', color: 'var(--text-heading)' }}>Animal Categories</h3>
        </div>

        {/* Searching & Filter inputs */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search category name, slug..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', height: 36, paddingLeft: 34, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none' }}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ height: 36, padding: '0 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff' }}
          >
            <option value="">All States</option>
            <option value="active">Enabled</option>
            <option value="inactive">Disabled</option>
          </select>
        </div>

        {paginated.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No categories match search.</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: 10, cursor: 'pointer' }} onClick={() => triggerSort('name')}>
                    Name <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                  </th>
                  <th style={{ padding: 10 }}>Slug</th>
                  <th style={{ padding: 10, cursor: 'pointer' }} onClick={() => triggerSort('sortOrder')}>
                    Order <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                  </th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id || c._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 10, fontWeight: '700', color: 'var(--text-heading)' }}>{c.name}</td>
                    <td style={{ padding: 10 }}>{c.slug}</td>
                    <td style={{ padding: 10 }}>{c.sortOrder}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: '700',
                        backgroundColor: c.isActive ? 'var(--color-primary-light)' : '#f1f5f9',
                        color: c.isActive ? 'var(--color-primary)' : 'var(--text-muted)'
                      }}>
                        {c.isActive ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: 10, display: 'flex', gap: 8 }}>
                      <button onClick={() => setCatForm({ ...c, id: c.id || c._id, isEdit: true })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }} title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => toggleStatus(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.isActive ? 'var(--color-danger)' : 'var(--color-primary)' }} title={c.isActive ? 'Disable' : 'Enable'}>
                        {c.isActive ? <ShieldAlert size={16} /> : <Shield size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination strip */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Page {currentPage} of {totalPages}</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} style={{ padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}><ChevronLeft size={14} /></button>
                  <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} style={{ padding: '4px 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}><ChevronRight size={14} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* CRUD Entry form */}
      <form onSubmit={handleSaveCategory} style={{ width: 300, backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)', height: 'fit-content' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: '700' }}>{catForm.isEdit ? 'Edit' : 'Create'} Category</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>Name</label>
            <input type="text" style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>Slug</label>
            <input type="text" style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={catForm.slug} onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>Sort Order</label>
            <input type="number" style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={catForm.sortOrder} onChange={(e) => setCatForm({ ...catForm, sortOrder: e.target.value })} />
          </div>
          <button type="submit" style={{ width: '100%', backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', padding: 10, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700', marginTop: 12 }}>
            {catForm.isEdit ? 'Save Changes' : 'Create Category'}
          </button>
        </div>
      </form>
    </div>
  );
}
