const BrandLogo = ({ compact = false, showTagline = false, inverse = false }) => (
  <div className={`brand-logo${compact ? ' brand-logo-compact' : ''}${inverse ? ' brand-logo-inverse' : ''}`}>
    <svg className="brand-logo-mark" viewBox="0 0 64 64" role="img" aria-label="VitalTrack logo">
      <path
        className="brand-logo-drop"
        d="M32 8C23.5 18.7 14 28.3 14 39.2C14 49.2 22.1 56 32 56s18-6.8 18-16.8C50 28.3 40.5 18.7 32 8Z"
        fill="var(--brand-logo-drop, #5A1827)"
      />
      <path d="M25 21.5C20.6 21.5 17 25 17 29.3c0 6 8 12 8 12s8-6 8-12c0-4.3-3.6-7.8-8-7.8Z" fill="#FAF9F6" />
      <circle cx="25" cy="29.2" r="2.7" fill="var(--brand-logo-drop, #5A1827)" />
      <path d="M31 39.5c7.5 0 10.8-5.3 13.6-10.2" fill="none" stroke="var(--brand-logo-accent, #E5C158)" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M31 39.5c5.2 0 8.2 2.4 11.2 6.2" fill="none" stroke="var(--brand-logo-accent, #E5C158)" strokeWidth="2.8" strokeLinecap="round" />
      <circle cx="31" cy="39.5" r="3.2" fill="var(--brand-logo-accent, #E5C158)" stroke="var(--brand-logo-drop, #5A1827)" strokeWidth="1.5" />
      <circle cx="44.6" cy="29.3" r="3.2" fill="var(--brand-logo-accent, #E5C158)" stroke="var(--brand-logo-drop, #5A1827)" strokeWidth="1.5" />
      <circle cx="42.2" cy="45.7" r="3.2" fill="var(--brand-logo-accent, #E5C158)" stroke="var(--brand-logo-drop, #5A1827)" strokeWidth="1.5" />
    </svg>
    <span className="brand-logo-copy">
      <span className="brand-logo-wordmark">Vital<span>Track</span></span>
      {showTagline && <span className="brand-logo-tagline">Intelligent Donor Matching &amp; Tracking System</span>}
    </span>
  </div>
);

export default BrandLogo;
