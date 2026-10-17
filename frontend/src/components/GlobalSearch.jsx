import { useEffect, useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL, authHeaders, parseResponse } from '../api';

const staticResults = [
  { label: 'System Overview', section: 'Dashboard', path: '/dashboard', keywords: 'dashboard overview' },
  { label: 'My Donations', section: 'Donations', path: '/history', keywords: 'donation donations history' },
  { label: 'Digital Donor Passport', section: 'Donors', path: '/donor-qr', keywords: 'donor passport qr identity' },
  { label: 'Donor Profile', section: 'Donors', path: '/profile', keywords: 'donor profile' },
  { label: 'Blood Inventory', section: 'Inventory', path: '/add-blood', keywords: 'blood inventory stock groups' },
  { label: 'Stock Directory', section: 'Inventory', path: '/blood-list', keywords: 'blood inventory stock groups' },
  { label: 'Request Management', section: 'Requests', path: '/request-management', keywords: 'requests patient requests' },
  { label: 'Location Intelligence', section: 'Hospitals', path: '/geopulse-radar', keywords: 'global location hospital donor matching map' },
  { label: 'Staff Management', section: 'Hospitals', path: '/staff-management', keywords: 'staff hospital admin' },
  { label: 'Reports & Analytics', section: 'Analytics', path: '/reports', keywords: 'reports analytics' },
  { label: 'Life Impact Board', section: 'Impact', path: '/life-impact-board', keywords: 'life impact dashboard' },
  { label: 'Account Center', section: 'Account', path: '/account-center', keywords: 'account settings' },
  { label: 'About Us', section: 'Website', path: '/about', keywords: 'about' },
  { label: 'FAQs', section: 'Website', path: '/faq', keywords: 'faq help questions' }
];

const getRecordText = (record) => Object.values(record || {}).filter((value) => ['string', 'number'].includes(typeof value)).join(' ');

const GlobalSearch = ({ variant = 'topbar' }) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    const loadSearchData = async () => {
      setLoading(true);
      setLoadError('');
      const requests = [
        fetch(`${API_URL}/hospital/directory`).then(parseResponse).then((data) => (data.hospitals || []).map((item) => ({
          label: item.name || item.hospitalName || 'Hospital',
          section: 'Hospitals',
          path: '/hospital-onboarding',
          keywords: getRecordText(item)
        })))
      ];

      if (localStorage.getItem('token')) {
        requests.push(
          fetch(`${API_URL}/donations`, { headers: authHeaders() }).then(async (response) => {
            if (!response.ok) return [];
            const data = await parseResponse(response);
            return (Array.isArray(data) ? data : []).map((item) => ({
              label: `${item.donorName || item.name || 'Donor'} - ${item.bloodGroup || item.bloodType || 'Blood group unavailable'}`,
              section: 'Donations / Blood groups',
              path: '/blood-list',
              keywords: getRecordText(item)
            }));
          }),
          fetch(`${API_URL}/patient-requests`, { headers: authHeaders() }).then(async (response) => {
            if (!response.ok) return [];
            const data = await parseResponse(response);
            return (Array.isArray(data) ? data : []).map((item) => ({
              label: `${item.patientName || 'Patient request'} - ${item.bloodGroup || 'Blood group unavailable'}`,
              section: 'Requests',
              path: '/request-management',
              keywords: getRecordText(item)
            }));
          })
        );
      }

      try {
        const loadedRecords = (await Promise.all(requests)).flat();
        setRecords(loadedRecords);
      } catch (error) {
        console.error('Unable to load search data:', error);
        setLoadError('Some live records could not be loaded. You can still search website sections.');
      } finally {
        setLoading(false);
      }
    };
    loadSearchData();
  }, [isOpen]);

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return [];
    return [...staticResults, ...records]
      .filter((item) => `${item.label} ${item.section} ${item.keywords}`.toLowerCase().includes(normalizedQuery))
      .slice(0, 12);
  }, [query, records]);

  const openSearch = () => {
    setIsOpen(true);
    setQuery('');
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
  };

  const selectResult = (path) => {
    closeSearch();
    navigate(path);
  };

  return (
    <>
      {variant === 'topbar' ? (
        <button type="button" className="topbar-search topbar-search-trigger relative text-left" onClick={openSearch} aria-label="Search website content">
          <Search className="topbar-search-icon" aria-hidden="true" />
          <span className="topbar-search-input block w-full border-2 text-xs rounded-xl pl-10 pr-4 py-2.5 text-white font-bold shadow-inner">Search website content...</span>
        </button>
      ) : (
        <button type="button" className="mobile-public-search-button" aria-label="Search website content" onClick={openSearch}>
          <Search aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <div className="global-search-backdrop" role="presentation" onMouseDown={closeSearch}>
          <section className="global-search-dialog" role="dialog" aria-modal="true" aria-label="Search website content" onMouseDown={(event) => event.stopPropagation()}>
            <div className="global-search-header">
              <Search aria-hidden="true" />
              <input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search donations, donors, blood groups, hospitals, requests..." aria-label="Search website content" />
              <button type="button" onClick={closeSearch} aria-label="Close search"><X aria-hidden="true" /></button>
            </div>
            <div className="global-search-results">
              {loading && <p className="global-search-message">Loading live records...</p>}
              {!loading && !query.trim() && <p className="global-search-message">Enter a search term to find website sections and available records.</p>}
              {!loading && query.trim() && results.length === 0 && <p className="global-search-message">No matching results found.</p>}
              {loadError && <p className="global-search-error">{loadError}</p>}
              {results.map((result, index) => (
                <button type="button" className="global-search-result" key={`${result.path}-${result.label}-${index}`} onClick={() => selectResult(result.path)}>
                  <span>{result.label}</span>
                  <small>{result.section}</small>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
