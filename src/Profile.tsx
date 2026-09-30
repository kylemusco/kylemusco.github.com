export default function Profile() {
  return (
    <main className="profile" aria-labelledby="profile-name">
      <header className="identity">
        <h1 id="profile-name">Kyle Musco</h1>
        <p className="profile-role">
          <span>Senior iOS Engineer</span>
          <span aria-hidden="true">|</span>
          <span>ForeFlight</span>
        </p>
      </header>

      <nav className="profile-links" aria-label="Profile links">
        <ul className="link-list">
          <li>
            <a
              href="/Kyle%20Musco%20-%20Resume.pdf"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                Resume
                <span className="sr-only"> (PDF, opens in a new tab)</span>
              </span>
              <ExternalArrow />
            </a>
          </li>
          <li>
            <a
              href="https://github.com/kylemusco"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                GitHub<span className="sr-only"> (opens in a new tab)</span>
              </span>
              <ExternalArrow />
            </a>
          </li>
        </ul>
      </nav>
    </main>
  );
}

function ExternalArrow() {
  return (
    <svg
      className="link-arrow"
      viewBox="0 0 16 16"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 12 12 4M4 4h8v8" />
    </svg>
  );
}
