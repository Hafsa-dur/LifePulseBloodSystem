import { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';

const informationalAnswers = [
  {
    id: 'vitaltrack',
    title: 'How VitalTrack works',
    answer: 'VitalTrack connects blood donors and hospitals through an organized workflow. It records donations, helps match suitable donors with hospital requests, supports blood inventory management, and tracks dispatch activity.',
    terms: ['vitaltrack', 'how does vitaltrack work', 'how vitaltrack works', 'system work', 'platform work']
  },
  {
    id: 'donation',
    title: 'How blood donation works',
    answer: 'Blood donation is a voluntary process in which an eligible donor gives blood at an approved collection location. The donation is recorded with its blood group and available units, then it can be considered for hospital needs according to the system workflow.',
    terms: ['blood donation', 'donate blood', 'donating blood', 'how donation works', 'donor contribution']
  },
  {
    id: 'hospital-request',
    title: 'How hospitals request blood',
    answer: 'Authorized hospital staff submit a patient blood request with details such as the required blood group, units, patient information, and hospital location. The request then enters the hospital workflow for review, matching, and fulfillment.',
    terms: ['hospital request', 'request blood', 'hospital submit', 'submit blood request', 'patient request', 'how can a hospital']
  },
  {
    id: 'matching',
    title: 'How donor matching works',
    answer: 'VitalTrack uses blood-group compatibility, donor eligibility and availability, and saved location information to help identify a suitable donor for a hospital request. If a suitable donor is unavailable, the workflow can check available blood inventory.',
    terms: ['donor matching', 'donor match', 'matching process', 'match donors', 'location matching', 'nearest donor']
  },
  {
    id: 'inventory',
    title: 'What blood inventory means',
    answer: 'Blood inventory refers to the available blood units recorded by blood group. Authorized hospital staff use VitalTrack to manage available units, review stock, and process blood requests through the hospital workflow.',
    terms: ['blood inventory', 'inventory', 'blood stock', 'stock management', 'available blood', 'blood units']
  },
  {
    id: 'dispatch',
    title: 'How blood dispatch and tracking work',
    answer: 'After a request is approved and compatible blood is available, authorized hospital staff can record the dispatch. VitalTrack keeps the request and dispatch workflow connected so the movement of blood can be followed through the available tracking and dispatch records.',
    terms: ['blood dispatch', 'dispatch blood', 'dispatch work', 'blood tracking', 'track blood', 'transport tracking']
  },
  {
    id: 'location',
    title: 'What Location Intelligence does',
    answer: 'Location Intelligence helps hospital teams compare saved donor and hospital locations. It uses location information and straight-line distance to rank suitable donor matches from nearest to farthest when location data is available.',
    terms: ['location intelligence', 'global location', 'location matching', 'donor location', 'hospital location', 'nearest']
  },
  {
    id: 'passport',
    title: 'What a Digital Donor Passport is',
    answer: 'The Digital Donor Passport is a QR-based donor identity display. It presents the donor identity and blood group information stored for the account so it can be used as part of the donor workflow.',
    terms: ['digital donor passport', 'donor passport', 'qr passport', 'qr donor', 'digital identity']
  },
  {
    id: 'impact',
    title: 'How donors help save lives',
    answer: 'A donation can support patients who need blood by adding compatible units to the available supply. VitalTrack helps organize the journey from donation and matching to hospital request and dispatch, making each contribution easier to coordinate.',
    terms: ['save lives', 'saving lives', 'donor help', 'donors contribute', 'why donate', 'impact of donation']
  }
];

const privateRequestPatterns = [
  /\b(show|find|display|give|list|see|view)\b.*\b(records?|donors?|patients?|emails?|histories?|data)\b/i,
  /\b(donor|patient|hospital|donation|inventory)\b.*\b(records?|names?|emails?|contacts?|details?|data)\b/i,
  /\b(admin|administrator|dashboard|donor panel|admin panel|internal panel)\b/i,
  /\b(open|go to|navigate to|access)\b.*\b(panel|dashboard|inventory|requests?|location intelligence|staff management)\b/i
];

const normalize = (value) => value.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();

const getAnswer = (query) => {
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) {
    return {
      title: 'Ask about VitalTrack',
      answer: 'Search is an informational assistant. Ask how VitalTrack, blood donation, hospital requests, donor matching, inventory, dispatch, tracking, or Location Intelligence works.'
    };
  }

  if (privateRequestPatterns.some((pattern) => pattern.test(query))) {
    return {
      title: 'Public information only',
      answer: 'I can explain VitalTrack features, but I cannot open internal panels or show donor, patient, hospital, donation, inventory, or other private records. Please use the authorized sign-in workflow for protected information.'
    };
  }

  const queryTerms = new Set(normalizedQuery.split(' '));
  const rankedAnswers = informationalAnswers
    .map((item) => {
      const score = item.terms.reduce((total, term) => {
        const normalizedTerm = normalize(term);
        if (normalizedQuery.includes(normalizedTerm)) return total + normalizedTerm.split(' ').length + 2;
        return total + normalizedTerm.split(' ').filter((word) => queryTerms.has(word)).length;
      }, 0);
      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((first, second) => second.score - first.score);

  if (rankedAnswers.length > 0) {
    const { title, answer } = rankedAnswers[0].item;
    return { title, answer };
  }

  return {
    title: 'VitalTrack information',
    answer: 'I can help with information about VitalTrack and blood donation, including hospital requests, donor matching, blood inventory, dispatch and tracking, Location Intelligence, and the Digital Donor Passport. Please ask a question in one of these areas.'
  };
};

const GlobalSearch = ({ variant = 'topbar' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const response = useMemo(() => getAnswer(query), [query]);

  const openSearch = () => {
    setIsOpen(true);
    setQuery('');
  };

  const closeSearch = () => {
    setIsOpen(false);
    setQuery('');
  };

  return (
    <>
      {variant === 'topbar' ? (
        <button type="button" className="topbar-search topbar-search-trigger relative text-left" onClick={openSearch} aria-label="Ask about VitalTrack">
          <Search className="topbar-search-icon" aria-hidden="true" />
          <span className="topbar-search-input block w-full border-2 text-xs rounded-xl pl-10 pr-4 py-2.5 text-white font-bold shadow-inner">Ask about VitalTrack...</span>
        </button>
      ) : (
        <button type="button" className="mobile-public-search-button" aria-label="Ask about VitalTrack" onClick={openSearch}>
          <Search aria-hidden="true" />
        </button>
      )}

      {isOpen && (
        <div className="global-search-backdrop" role="presentation" onMouseDown={closeSearch}>
          <section className="global-search-dialog" role="dialog" aria-modal="true" aria-label="VitalTrack informational search" onMouseDown={(event) => event.stopPropagation()}>
            <div className="global-search-header">
              <Search aria-hidden="true" />
              <input
                autoFocus
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask how VitalTrack or blood donation works..."
                aria-label="Ask about VitalTrack"
              />
              <button type="button" onClick={closeSearch} aria-label="Close search"><X aria-hidden="true" /></button>
            </div>
            <div className="global-search-results">
              <article className="global-search-answer">
                <small>VitalTrack information</small>
                <h2>{response.title}</h2>
                <p>{response.answer}</p>
              </article>
            </div>
          </section>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
