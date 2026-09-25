// The rest of the page stays on the legacy renderer until steps 3–5.
export default function App() {
  return (
    <nav
      className="nav-container"
      id="nav-container"
      aria-label="Profile links"
    >
      <ul id="nav-list" className="nav-list">
        <li id="resume">
          <a
            href="/Kyle%20Musco%20-%20Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
          >
            Resume
          </a>
        </li>
        <li id="contact">
          <a
            href="https://github.com/kylemusco"
            target="_blank"
            rel="noopener noreferrer"
          >
            Github
          </a>
        </li>
      </ul>
    </nav>
  );
}
