import React, { useState, useEffect } from 'react';
import './styles.css';
import api from './services/api';

const AGE_GROUPS = [
  { id: '10-25', min: 10, max: 25, label: '10-25' },
  { id: '26-35', min: 26, max: 35, label: '26-35' },
  { id: '36-50', min: 36, max: 50, label: '36-50' },
  { id: '50+', min: 46, max: 100, label: '50+' },
];

// Header Component
const AppHeader = () => {
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    <header className="app-header">
      <div className="header-left">
        <button 
          className="menu-button" 
          onClick={() => document.querySelector('.sidebar').classList.toggle('open')}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1 className="app-title">Client Dashboard</h1>
      </div>
      
      <div className="header-center">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search clients..."
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <span className="search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </span>
        </div>
      </div>
      
      <div className="header-right">
        <div className="user-profile">
          <span className="user-initials">AD</span>
          <span className="user-name">Admin User</span>
        </div>
      </div>
    </header>
  );
};

function App() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('cards');
  const [error, setError] = useState(null);
  const [genders, setGenders] = useState([]);
  const [genderCounts, setGenderCounts] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    gender: null,
    age: null
  });

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (isSidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('.menu-button')) {
        setIsSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  // Initialize genders and counts
  useEffect(() => {
    const initializeGenders = async () => {
      try {
        const gendersData = await api.getGenderList();
        setGenders(gendersData);
        
        const counts = {};
        for (const gender of gendersData) {
          try {
            const countData = await api.getGenderCount(gender);
            counts[gender] = countData.count;
          } catch (err) {
            console.error(`Error getting count for ${gender}:`, err);
            counts[gender] = 0;
          }
        }
        setGenderCounts(counts);
      } catch (err) {
        console.error('Error initializing genders:', err);
        setError('Failed to load gender data');
      }
    };

    initializeGenders();
  }, []);

  // Fetch clients when filter changes
  useEffect(() => {
    const fetchClients = async () => {
      setLoading(true);
      setError(null);
      
      try {
        let data = await api.getAllClients();
        
        // Apply gender filter if selected
        if (selectedFilters.gender) {
          data = data.filter(client => client.PTY_Gender === selectedFilters.gender);
        }
        
        // Apply age filter if selected
        if (selectedFilters.age) {
          const { min, max } = selectedFilters.age;
          data = data.filter(client => 
            client.PTY_Age >= min && client.PTY_Age <= max
          );
        }
        
        setClients(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching clients:', err);
        setError('Failed to fetch clients. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchClients();
  }, [selectedFilters]);

  const handleGenderClick = (gender) => {
    setSelectedFilters(prev => ({
      ...prev,
      gender: prev.gender === gender ? null : gender
    }));
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleAgeGroupClick = (min, max) => {
    const ageValue = { min, max };
    setSelectedFilters(prev => ({
      ...prev,
      age: JSON.stringify(prev.age) === JSON.stringify(ageValue) ? null : ageValue
    }));
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleAllGendersClick = () => {
    setSelectedFilters(prev => ({ ...prev, gender: null }));
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const isGenderSelected = (gender) => {
    return selectedFilters.gender === gender;
  };

  const isAgeGroupSelected = (min, max) => {
    return selectedFilters.age?.min === min && selectedFilters.age?.max === max;
  };

  const isAllGendersSelected = !selectedFilters.gender;
  const isAllSelected = !selectedFilters.gender && !selectedFilters.age;

  if (loading && clients.length === 0) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <AppHeader />
      <div className="container">
        <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
          <div className="filter-card">
            <div className="filter-section">
              <h4 className="section-title">Gender</h4>
              <div className="filter-options">
                <div 
                  className={`filter-option ${isAllGendersSelected ? 'active' : ''}`}
                  onClick={handleAllGendersClick}
                >
                  <span className="option-text">All Genders</span>
                </div>
                {genders.map((gender) => (
                  <div 
                    key={gender}
                    className={`filter-option ${isGenderSelected(gender) ? 'active' : ''}`}
                    onClick={() => handleGenderClick(gender)}
                  >
                    <span className="option-text">{gender}</span>
                    <span className="option-count">{genderCounts[gender] || 0}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="filter-section">
              <h4 className="section-title">Age Groups</h4>
              <div className="filter-options">
                {AGE_GROUPS.map((group) => (
                  <div
                    key={group.id}
                    className={`filter-option ${isAgeGroupSelected(group.min, group.max) ? 'active' : ''}`}
                    onClick={() => handleAgeGroupClick(group.min, group.max)}
                  >
                    <span className="option-text">{group.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
      </aside>
      
      <main 
        className="main-content"
        onClick={() => window.innerWidth <= 768 && isSidebarOpen && setIsSidebarOpen(false)}
      >
        {error ? (
          <div className="error">{error}</div>
        ) : (
          <div className="client-grid">
            <div className="view-header">
              <h2>
                {selectedFilters.age 
                  ? `Clients aged ${selectedFilters.age.min}-${selectedFilters.age.max}` 
                  : selectedFilters.gender 
                    ? `${selectedFilters.gender} Clients`
                    : 'All Clients'}
                {selectedFilters.age && selectedFilters.gender && ` (${selectedFilters.gender})`}
              </h2>
              <div className="view-header-inner">
                <div className="client-count">
                  {clients.length} {clients.length === 1 ? 'client' : 'clients'} 
                </div>
                <div className="view-dropdown">
                  <button 
                    className="dropdown-toggle"
                    onClick={(e) => {
                      e.stopPropagation();
                      document.querySelector('.dropdown-menu').classList.toggle('show');
                    }}
                    title="Change view"
                  >
                    {viewMode === 'table' ? '≡ Table View' : '☷ Card View'}
                    <span className="dropdown-arrow">▼</span>
                  </button>
                  <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                    <div 
                      className={`dropdown-item ${viewMode === 'table' ? 'active' : ''}`}
                      onClick={() => {
                        setViewMode('table');
                        document.querySelector('.dropdown-menu').classList.remove('show');
                      }}
                    >
                      ≡ Table View
                    </div>
                    <div 
                      className={`dropdown-item ${viewMode === 'cards' ? 'active' : ''}`}
                      onClick={() => {
                        setViewMode('cards');
                        document.querySelector('.dropdown-menu').classList.remove('show');
                      }}
                    >
                      ☷ Card View
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {clients.length > 0 ? (
              viewMode === 'table' ? (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Gender</th>
                        <th>Age</th>
                        <th>Phone</th>
                        <th>SSN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clients.map((client) => (
                        <tr key={client.PTY_ID}>
                          <td>{`${client.PTY_FirstName} ${client.PTY_LastName}`}</td>
                          <td>{client.PTY_Gender}</td>
                          <td>{client.PTY_Age}</td>
                          <td>{client.PTY_Phone || '-'}</td>
                          <td>•••-••-{client.PTY_SSN ? client.PTY_SSN.slice(-4) : '••••'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="cards-container">
                  {clients.map((client) => (
                    <div key={client.PTY_ID} className="client-card">
                      <div className="card-header">
                        <h3>{`${client.PTY_FirstName} ${client.PTY_LastName}`}</h3>
                        <span className={`gender-badge ${client.PTY_Gender.toLowerCase()}`}>
                          {client.PTY_Gender}
                        </span>
                      </div>
                      <div className="card-details">
                        <p><strong>Age:</strong> {client.PTY_Age}</p>
                        <p><strong>Phone:</strong> {client.PTY_Phone || '-'}</p>
                        <p><strong>SSN:</strong> •••-••-{client.PTY_SSN ? client.PTY_SSN.slice(-4) : '••••'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="no-clients">
                No clients found
                <p>Try adjusting your filters or check back later</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  </div>
);
}

export default App;