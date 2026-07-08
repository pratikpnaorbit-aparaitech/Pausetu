import React, { useContext, useState } from 'react';
import { AdminContext } from '../context/AdminContext';
import { MapPin, Search, ArrowUpDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

export default function LocationsPage() {
  const {
    locations,
    setLocations,
    showToast
  } = useContext(AdminContext);

  const [locStateForm, setLocStateForm] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('stateName');
  const [sortOrder, setSortOrder] = useState('asc');

  // Filter Dropdowns
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [talukaFilter, setTalukaFilter] = useState('');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleAddState = (e) => {
    e.preventDefault();
    if (!locStateForm.trim()) {
      showToast('State name is required', 'error');
      return;
    }
    const newState = { id: `s_${Date.now()}`, name: locStateForm.trim(), isActive: true };
    setLocations((prev) => ({
      ...prev,
      states: [...(prev.states || []), newState]
    }));
    showToast('State Added Successfully!');
    setLocStateForm('');
  };

  // Compile a flat locations list for tabular grid view
  const flatLocations = [];
  const statesList = locations?.states || [
    { id: 's1', name: 'Maharashtra', districts: [
      { id: 'd1', name: 'Satara', talukas: [
        { id: 't1', name: 'Karad', villages: ['Wather', 'Vithalpur'] }
      ]}
    ]}
  ];

  statesList.forEach((state) => {
    if (state.districts) {
      state.districts.forEach((dist) => {
        if (dist.talukas) {
          dist.talukas.forEach((tal) => {
            if (tal.villages) {
              tal.villages.forEach((vil) => {
                flatLocations.push({
                  id: `${state.name}-${dist.name}-${tal.name}-${vil}`,
                  stateName: state.name,
                  districtName: dist.name,
                  talukaName: tal.name,
                  villageName: vil,
                  status: 'Active'
                });
              });
            }
          });
        }
      });
    } else {
      // Fallback for simple flat structures
      flatLocations.push({
        id: state.id || state._id,
        stateName: state.name,
        districtName: 'Satara',
        talukaName: 'Karad',
        villageName: 'Wather',
        status: 'Active'
      });
    }
  });

  // Filter Locations
  const filtered = flatLocations.filter((loc) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      loc.stateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.districtName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.talukaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      loc.villageName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesState = stateFilter === '' || loc.stateName === stateFilter;
    const matchesDistrict = districtFilter === '' || loc.districtName === districtFilter;
    const matchesTaluka = talukaFilter === '' || loc.talukaName === talukaFilter;

    return matchesSearch && matchesState && matchesDistrict && matchesTaluka;
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

  // Compile dependent dropdown list options
  const availableStates = [...new Set(flatLocations.map((l) => l.stateName))];
  const availableDistricts = [
    ...new Set(flatLocations.filter((l) => stateFilter === '' || l.stateName === stateFilter).map((l) => l.districtName))
  ];
  const availableTalukas = [
    ...new Set(
      flatLocations
        .filter((l) => (stateFilter === '' || l.stateName === stateFilter) && (districtFilter === '' || l.districtName === districtFilter))
        .map((l) => l.talukaName)
    )
  ];

  const triggerSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s', display: 'flex', gap: 20, flexWrap: 'wrap' }}>
      
      {/* Locations tabular list */}
      <div style={{ flex: 1, minWidth: 400, backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: '700', color: 'var(--text-heading)' }}>Location Master Hierarchy</h3>

        {/* Searching & Dependent dropdown filter headers */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={16} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search State, District, Village..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              style={{ width: '100%', height: 36, paddingLeft: 34, border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', fontSize: 13, outline: 'none' }}
            />
          </div>

          {/* State selector */}
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setDistrictFilter(''); setTalukaFilter(''); setCurrentPage(1); }}
            style={{ height: 36, padding: '0 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff' }}
          >
            <option value="">All States</option>
            {availableStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* District selector */}
          <select
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setTalukaFilter(''); setCurrentPage(1); }}
            style={{ height: 36, padding: '0 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff' }}
          >
            <option value="">All Districts</option>
            {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Taluka selector */}
          <select
            value={talukaFilter}
            onChange={(e) => { setTalukaFilter(e.target.value); setCurrentPage(1); }}
            style={{ height: 36, padding: '0 8px', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', backgroundColor: '#fff' }}
          >
            <option value="">All Talukas</option>
            {availableTalukas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {paginated.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>No location records match filters.</div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: 'var(--bg-main)', borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: 10, cursor: 'pointer' }} onClick={() => triggerSort('stateName')}>
                    State <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                  </th>
                  <th style={{ padding: 10, cursor: 'pointer' }} onClick={() => triggerSort('districtName')}>
                    District <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                  </th>
                  <th style={{ padding: 10, cursor: 'pointer' }} onClick={() => triggerSort('talukaName')}>
                    Taluka <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                  </th>
                  <th style={{ padding: 10, cursor: 'pointer' }} onClick={() => triggerSort('villageName')}>
                    Village <ArrowUpDown size={12} style={{ marginLeft: 4 }} />
                  </th>
                  <th style={{ padding: 10 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((loc) => (
                  <tr key={loc.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: 10, fontWeight: '700', color: 'var(--text-heading)' }}>{loc.stateName}</td>
                    <td style={{ padding: 10 }}>{loc.districtName}</td>
                    <td style={{ padding: 10 }}>{loc.talukaName}</td>
                    <td style={{ padding: 10 }}>{loc.villageName}</td>
                    <td style={{ padding: 10 }}>
                      <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: '700', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
                        {loc.status}
                      </span>
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

      {/* State creation form */}
      <form onSubmit={handleAddState} style={{ width: 300, backgroundColor: '#fff', borderRadius: 'var(--radius-md)', padding: 20, border: '1px solid var(--border-color)', height: 'fit-content' }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: '700' }}>Add State</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: '600', display: 'block', marginBottom: 4 }}>State Name</label>
            <input type="text" style={{ width: '100%', border: '1px solid var(--border-color)', padding: 8, borderRadius: 'var(--radius-sm)' }} value={locStateForm} onChange={(e) => setLocStateForm(e.target.value)} />
          </div>
          <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', backgroundColor: 'var(--color-primary)', border: 'none', color: '#fff', padding: 10, borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: '700', marginTop: 12 }}>
            <Plus size={14} />
            <span>Add State</span>
          </button>
        </div>
      </form>
    </div>
  );
}
