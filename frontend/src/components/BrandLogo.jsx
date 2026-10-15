const BrandLogo = ({ compact = false, showTagline = false, inverse = false }) => (
  <div className={`brand-logo${compact ? ' brand-logo-compact' : ''}${inverse ? ' brand-logo-inverse' : ''}`}>
    <svg className="brand-logo-mark" viewBox="0 0 48 52" role="img" aria-label="VitalTrack logo">
      <rect x="1" y="1" width="46" height="50" rx="14" fill="#FAF9F6" />
      <path
        d="M24 2C17.5 11.2 8 21.5 8 32.2A16 16 0 0 0 40 32.2C40 21.5 30.5 11.2 24 2Z"
        fill="#5A1827"
      />
      <path d="M24 13v18c0 7 4.6 11.2 10.7 11.2" fill="none" stroke="#FAF9F6" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 25.5c-4.6 0-7.8 2.3-10 5.2" fill="none" stroke="#FAF9F6" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="13" r="3" fill="#FAF9F6" />
      <circle cx="24" cy="31" r="3" fill="#FAF9F6" />
      <circle cx="34.7" cy="42.2" r="3" fill="#FAF9F6" />
      <path d="M24 19.5a5 5 0 1 0 0 10 5 5 0 0 0 0-10Z" fill="#FAF9F6" />
      <circle cx="24" cy="24.5" r="1.7" fill="#5A1827" />
    </svg>
    <span className="brand-logo-copy">
      <span className="brand-logo-wordmark">Vital<span>Track</span></span>
      {showTagline && <span className="brand-logo-tagline">Intelligent Donor Matching &amp; Tracking System</span>}
    </span>
  </div>
);

export default BrandLogo;
