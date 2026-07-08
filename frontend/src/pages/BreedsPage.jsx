import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Edit2, Search, ArrowUpDown, ChevronLeft, ChevronRight, ShieldAlert, Shield } from 'lucide-react';

export default function BreedsPage() {
  const {
    breeds,
    setBreeds,
    categories,
    showToast
  } = useContext(AdminContext);

  const [breedForm, setBreedForm] = useState({ id: '', categoryId: categories[0]?.id || '1', categoryName: categories[0]?.name || 'Cow', name: '', description: '', isEdit: false, isActive: true });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSaveBreed = (e) => {
    e.preventDefault();
    if (!breedForm.name) {
      showToast('Breed Name is required', 'error');
      return;
    }
    const cat = categories.find((c) => c.id === breedForm.categoryId || c._id === breedForm.categoryId) || { name: 'Cow' };
    const payload = { ...breedForm, categoryName: cat.name };

    if (breedForm.isEdit) {
      setBreeds((prev) => prev.map((b) => b.id === breedForm.id || b._id === breedForm.id ? { ...payload, isEdit: false } : b));
      showToast('Breed Updated Successfully!');
    } else {
      const newBreed = { ...payload, id: `b_${Date.now()}`, _id: `b_${Date.now()}` };
      setBreeds((prev) => [...prev, newBreed]);
      showToast('Breed Created Successfully!');
    }
    setBreedForm({ id: '', categoryId: categories[0]?.id || '1', categoryName: categories[0]?.name || 'Cow', name: '', description: '', isEdit: false, isActive: true });
  };

  const toggleStatus = (breed) => {
    const nextStatus = !breed.isActive;
    setBreeds((prev) =>
      prev.map((b) => (b.id === breed.id || b._id === breed.id || b._id === breed._id ? { ...b, isActive: nextStatus } : b))
    );
    showToast(`Breed status set to ${nextStatus ? 'Enabled' : 'Disabled'}`, 'success');
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
  const filtered = breeds.map(b => ({ ...b, isActive: b.isActive !== false })).filter((b) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.description && b.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCat =
      selectedCatFilter === '' ||
      b.categoryId === selectedCatFilter;

    return matchesSearch && matchesCat;
  });

  // Sorting
  const sorted = [...filtered].sort((a, b) => {
    const aVal = String(a[sortField]).toLowerCase();
    const bVal = String(b[sortField]).toLowerCase();
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
      
      {/* Breeds listings table */}
      <div style={{ flex: 1, minWidth: 400, backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: '700', color: 'var(--text-heading)' }}>Breeds CRUD</h3>

        {/* Searching & Filter strip */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search breed name, description..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', height: 36, paddingLeft: 34, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none' }}
            />
          </div>
          <select
            value={selectedCatFilter}
            onChange={(e) => { setSelectedCatFilter(e.target.value); setCurrentPage(1); }}
            style={{ height: 36, padding: '0 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff' }}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id || cat._id} value={cat.id || cat._id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {paginated.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No breeds matched.</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: 10, cursor: 'pointer' }} onClick={() => triggerSort('name')}>
                    Breed Name <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                  </th>
                  <th style={{ padding: 10, cursor: 'pointer' }} onClick={() => triggerSort('categoryName')}>
                    Category <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                  </th>
                  <th style={{ padding: 10 }}>Description</th>
                  <th style={{ padding: 10 }}>Status</th>
                  <th style={{ padding: 10 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b) => (
                  <tr key={b.id || b._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 10, fontWeight: '700', color: 'var(--text-heading)' }}>{b.name}</td>
                    <td style={{ padding: 10 }}>{b.categoryName}</td>
                    <td style={{ padding: 10 }}>{b.description}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: '700',
                        backgroundColor: b.isActive ? 'var(--color-primary-light)' : '#f1f5f9',
                        color: b.isActive ? 'var(--color-primary)' : 'var(--text-muted)'
                      }}>
                        {b.isActive ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td style={{ padding: 10, display: 'flex', gap: 8 }}>
                      <button onClick={() => setBreedForm({ ...b, id: b.id || b._id, isEdit: true })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-primary)' }} title="Edit"><Edit2 size={16} /></button>
                      <button onClick={() => toggleStatus(b)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: b.isActive ? 'var(--color-danger)' : 'var(--color-primary)' }} title={b.isActive ? 'Disable' : 'Enable'}>
                        {b.isActive ? <ShieldAlert size={16} /> : <Shield size={16} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Strip */}
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

      {/* Creation form */}
      <form onSubmit={handleSaveBreed} style={{ width: 300, backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)', height: 'fit-content' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: '700' }}>{breedForm.isEdit ? 'Edit' : 'Create'} Breed</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>Breed Name</label>
            <input type="text" style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={breedForm.name} onChange={(e) => setBreedForm({ ...breedForm, name: e.target.value })} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>Category</label>
            <select style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)', backgroundColor: '#fff' }} value={breedForm.categoryId} onChange={(e) => setBreedForm({ ...breedForm, categoryId: e.target.value })}>
              {categories.map((c) => (
                <option key={c.id || c._id} value={c.id || c._id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>Description</label>
            <textarea style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={breedForm.description} onChange={(e) => setBreedForm({ ...breedForm, description: e.target.value })} />
          </div>
          <button type="submit" style={{ width: '100%', backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', padding: 10, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700', marginTop: 12 }}>
            {breedForm.isEdit ? 'Save Changes' : 'Create Breed'}
          </button>
        </div>
      </form>
    </div>
  );
}
