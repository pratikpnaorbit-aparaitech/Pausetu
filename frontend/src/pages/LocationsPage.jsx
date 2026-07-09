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
    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start', animation: 'fadeIn 0.22s both' }}>
      
      {/* Locations tabular list */}
      <div style={{ flex: '1 1 500px', minWidth: 320 }}>
        {/* Header */}
        <div className="page-header" style={{ marginBottom: 16 }}>
          <div>
            <h2 className="page-title">Location Hierarchy</h2>
            <p className="page-subtitle">{flatLocations.length} active villages mapped</p>
          </div>
        </div>

        {/* Searching & Dependent dropdown filter headers */}
        <div className="filter-bar">
          <div style={{ position: 'relative', flex: '1 1 200px' }}>
            <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input
              type="text"
              className="input input-search"
              style={{ paddingLeft: 34 }}
              placeholder="Search State, District, Village..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* State selector */}
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setDistrictFilter(''); setTalukaFilter(''); setCurrentPage(1); }}
            className="input"
            style={{ width: 140 }}
          >
            <option value="">All States</option>
            {availableStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* District selector */}
          <select
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setTalukaFilter(''); setCurrentPage(1); }}
            className="input"
            style={{ width: 140 }}
          >
            <option value="">All Districts</option>
            {availableDistricts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Taluka selector */}
          <select
            value={talukaFilter}
            onChange={(e) => { setTalukaFilter(e.target.value); setCurrentPage(1); }}
            className="input"
            style={{ width: 140 }}
          >
            <option value="">All Talukas</option>
            {availableTalukas.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="table-container">
          {paginated.length === 0 ? (
            <div className="empty-state" style={{ border: 'none' }}>
              <div className="empty-state-icon">
                <Search size={24} color="var(--text-muted)" />
              </div>
              <h3 style={{ margin: '0 0 6px', fontWeight: '700', fontSize: 16, color: 'var(--text-heading)' }}>
                No locations match filters
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: 0 }}>
                Adjust dropdown values or search terms.
              </p>
            </div>
          ) : (
            <>
              <table className="resizable-table">
                <thead>
                  <tr>
                    <th style={{ cursor: 'pointer' }} onClick={() => triggerSort('stateName')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        State <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => triggerSort('districtName')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        District <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => triggerSort('talukaName')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Taluka <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={{ cursor: 'pointer' }} onClick={() => triggerSort('villageName')}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Village <ArrowUpDown size={12} />
                      </div>
                    </th>
                    <th style={{ width: 110 }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((loc) => (
                    <tr key={loc.id}>
                      <td>
                        <span style={{ fontWeight: '600', color: 'var(--text-heading)', fontSize: 13.5 }}>{loc.stateName}</span>
                      </td>
                      <td style={{ fontSize: 13 }}>{loc.districtName}</td>
                      <td style={{ fontSize: 13 }}>{loc.talukaName}</td>
                      <td style={{ fontSize: 13 }}>{loc.villageName}</td>
                      <td>
                        <span className="badge badge-active">{loc.status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Strip */}
              {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-main)', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* State creation form */}
      <form
        onSubmit={handleAddState}
        className="card-flat"
        style={{ width: 300, padding: 22, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: '700', color: 'var(--text-heading)' }}>
          Add State
        </h3>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">State Name</label>
            <input
              type="text"
              className="input"
              value={locStateForm}
              onChange={(e) => setLocStateForm(e.target.value)}
              placeholder="e.g. Maharashtra"
            />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }}>
            <Plus size={14} /> Add State
          </button>
        </div>
      </form>
    </div>
  );
}
