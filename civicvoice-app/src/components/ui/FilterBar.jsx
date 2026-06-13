import React from 'react'

export default function FilterBar({
  filterCategory, setFilterCategory,
  filterStatus, setFilterStatus,
  filterLocation, setFilterLocation,
  sortBy, setSortBy
}) {
  const selectStyle = {
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    padding: '8px 12px',
    border: '1px solid var(--line)',
    borderRadius: '4px',
    background: '#fff',
    color: 'var(--ink)',
  }

  return (
    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
      {/* Location Filter (Text Match) */}
      <input
        type="text"
        placeholder="Filter by location..."
        value={filterLocation}
        onChange={e => setFilterLocation(e.target.value)}
        aria-label="Filter by location"
        style={{
          ...selectStyle,
          minWidth: '180px',
        }}
      />

      {/* Category filter */}
      <select
        value={filterCategory}
        onChange={e => setFilterCategory(e.target.value)}
        aria-label="Filter by category"
        style={selectStyle}
      >
        <option value="">All categories</option>
        <option value="road">Road</option>
        <option value="water">Water</option>
        <option value="garbage">Garbage</option>
        <option value="light">Streetlight</option>
      </select>

      {/* Status filter */}
      <select
        value={filterStatus}
        onChange={e => setFilterStatus(e.target.value)}
        aria-label="Filter by status"
        style={selectStyle}
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={e => setSortBy(e.target.value)}
        aria-label="Sort issues"
        style={{
          ...selectStyle,
          fontWeight: 500,
        }}
      >
        <option value="votes">Sort: Most voted</option>
        <option value="recent">Sort: Most recent</option>
        <option value="nearest">Sort: Nearest to me</option>
      </select>
    </div>
  )
}
