import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { Check, Trash2 } from 'lucide-react';

export default function AnimalsPage() {
  const {
    animals,
    setAnimals,
    columnWidths,
    handleMouseDownResize,
    handleMarkSoldListing,
    triggerConfirm,
    handleSoftDeleteListing,
    showToast
  } = useContext(AdminContext);

  const [selectedAnimals, setSelectedAnimals] = useState([]);

  const activeAnimals = animals.filter(a => !a.isDeleted);

  const handleSelectAllAnimals = (e) => {
    if (e.target.checked) {
      setSelectedAnimals(activeAnimals.map(a => a.id));
    } else {
      setSelectedAnimals([]);
    }
  };

  const handleSelectAnimal = (id) => {
    setSelectedAnimals((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = () => {
    setAnimals((prev) => prev.map((a) => selectedAnimals.includes(a.id) ? { ...a, status: 'approved' } : a));
    showToast(`Bulk approved ${selectedAnimals.length} listings!`);
    setSelectedAnimals([]);
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 24, fontWeight: '800', color: 'var(--text-heading)', margin: 0 }}>Animal Listings</h2>
        
        {selectedAnimals.length > 0 && (
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ fontSize: 13, alignSelf: 'center', fontWeight: '600' }}>{selectedAnimals.length} selected</span>
            <button onClick={handleBulkApprove} style={{ padding: '8px 16px', backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700' }}>
              Bulk Approve
            </button>
          </div>
        )}
      </div>

      <div style={{ backgroundColor: '#fff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        <table className="resizable-table">
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
              <th style={{ padding: '12px 16px', width: 40 }}><input type="checkbox" onChange={handleSelectAllAnimals} /></th>
              <th className="resizable-th" style={{ padding: 12, width: columnWidths.title }}>
                Title
                <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'title')} />
              </th>
              <th className="resizable-th" style={{ padding: 12, width: columnWidths.category }}>
                Category
                <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'category')} />
              </th>
              <th className="resizable-th" style={{ padding: 12, width: columnWidths.breed }}>
                Breed
                <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'breed')} />
              </th>
              <th className="resizable-th" style={{ padding: 12, width: columnWidths.price }}>
                Price
                <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'price')} />
              </th>
              <th className="resizable-th" style={{ padding: 12, width: columnWidths.status }}>
                Status
                <div className="column-resizer" onMouseDown={(e) => handleMouseDownResize(e, 'status')} />
              </th>
              <th style={{ padding: 12, width: 120 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeAnimals.map((a) => (
              <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background-color 0.2s' }}>
                <td style={{ padding: '12px 16px' }}><input type="checkbox" checked={selectedAnimals.includes(a.id)} onChange={() => handleSelectAnimal(a.id)} /></td>
                <td style={{ padding: 12, fontWeight: '700', color: 'var(--text-heading)' }}>{a.title}</td>
                <td style={{ padding: 12 }}>Cow</td>
                <td style={{ padding: 12 }}>Gir</td>
                <td style={{ padding: 12, fontWeight: '700' }}>₹{a.price.toLocaleString()}</td>
                <td style={{ padding: 12 }}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: 12,
                    fontSize: 11,
                    fontWeight: '700',
                    backgroundColor: a.status === 'approved' ? 'var(--color-primary-light)' : a.status === 'pending' ? 'var(--color-warning-light)' : 'var(--color-danger-light)',
                    color: a.status === 'approved' ? 'var(--color-primary)' : a.status === 'pending' ? 'var(--color-warning)' : 'var(--color-danger)'
                  }}>
                    {a.status}
                  </span>
                </td>
                <td style={{ padding: 12, display: 'flex', gap: 8 }}>
                  <button onClick={() => handleMarkSoldListing(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-info)' }} title="Mark Sold"><Check size={18} /></button>
                  <button onClick={() => triggerConfirm('Soft Delete', a, `Soft delete listing "${a.title}"? (It will be hidden from buyers but remains recoverable)`, () => handleSoftDeleteListing(a))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger)' }} title="Soft Delete"><Trash2 size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
