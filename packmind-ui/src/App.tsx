// packmind-ui/src/App.tsx
import { useEffect, useState } from "react";
import YAML from "js-yaml";
import ReactMarkdown from "react-markdown";
import "./App.css";

//
// 1) Define TypeScript interfaces for manifest data and ADR content
//
interface ManifestRule {
  id:       string;
  tool:     string;
  rule_id:  string;
  severity: string;
}

interface AdrFrontmatter {
  id:       string;
  title:    string;
  type?:    string;
  status?:  string;
  enforcement: {
    tool:     string;
    rule_id:  string;
    severity: string;
  };
}

interface AdrContent {
  frontmatter: AdrFrontmatter;
  contextMarkdown: string;
}

export default function App() {
  // ───────────────────── State ─────────────────────
  const [manifest, setManifest] = useState<ManifestRule[]>([]);
  const [selectedAdr, setSelectedAdr] = useState<string | null>(null);
  const [adrData, setAdrData] = useState<AdrContent | null>(null);
  const [loadingAdr, setLoadingAdr] = useState(false);

  // ───────────────────── Config / URLs ─────────────────────
  const REPO_KEY     = "mySpace"; // must match REPO_NAME in your FastAPI server
  const MANIFEST_URL = `http://localhost:8000/manifest/${REPO_KEY}`;
  const ADR_URL_BASE = `http://localhost:8000/adr/`; // e.g. /adr/ADR-CS-001

  // ───────────────────── Fetch manifest on mount ─────────────────────
  useEffect(() => {
    fetch(MANIFEST_URL)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.rules)) {
          setManifest(data.rules);
        }
      })
      .catch((err) => console.error("Error loading manifest:", err));
  }, []);

  // ───────────────────── When selectedAdr changes, fetch its Markdown ─────────────────────
  useEffect(() => {
    if (!selectedAdr) {
      setAdrData(null);
      return;
    }

    setLoadingAdr(true);
    fetch(`${ADR_URL_BASE}${selectedAdr}`)
      .then((res) => {
        if (!res.ok) throw new Error("ADR not found");
        return res.json();
      })
      .then((data: { content: string }) => {
        const raw = data.content; // full Markdown including front-matter

        // Split off the YAML front-matter:
        // raw.split("---") → ["", "yaml…", "restOfMd…"]
        const parts = raw.split("---");
        if (parts.length < 3) {
          throw new Error("ADR frontmatter missing or malformed");
        }
        const yamlText = parts[1];
        const mdText   = parts.slice(2).join("---").trim();

        // Parse YAML into a JS object
        const fm = YAML.load(yamlText) as any;

        setAdrData({
          frontmatter: fm as AdrFrontmatter,
          contextMarkdown: mdText,
        });
      })
      .catch((err) => {
        console.error("Failed to load ADR content:", err);
        setAdrData(null);
      })
      .finally(() => {
        setLoadingAdr(false);
      });
  }, [selectedAdr]);

  // ───────────────────── Render ─────────────────────
  return (
    <div className="app-container">
      {/* ─────────────────── Header ─────────────────── */}
      <header className="app-header">
        <h1>Packmind ADR Explorer</h1>
      </header>

      {/* ─────────────────── Two-pane layout: Main + Sidebar ─────────────────── */}
      <div className="content-wrapper">
        {/* ─── Main Panel: ADR Details ─── */}
        <div className="main-panel">
          {!selectedAdr ? (
            <div className="placeholder">
              <p>Select an ADR on the right to view its details.</p>
            </div>
          ) : loadingAdr ? (
            <div className="placeholder">
              <p>Loading ADR…</p>
            </div>
          ) : adrData ? (
            <article className="adr-detail">
              {/* ADR title */}
              <h2>{adrData.frontmatter.title}</h2>

              {/* Badges for frontmatter attributes */}
              <div className="fm-badges">
                <span className="badge-id">{adrData.frontmatter.id}</span>
                {"type" in adrData.frontmatter && adrData.frontmatter.type && (
                  <span className="badge-type">{adrData.frontmatter.type}</span>
                )}
                {"status" in adrData.frontmatter && adrData.frontmatter.status && (
                  <span className="badge-status">
                    {adrData.frontmatter.status}
                  </span>
                )}
                <span className="badge-tool">
                  tool: {adrData.frontmatter.enforcement.tool}
                </span>
                <span className="badge-rule">
                  rule_id: {adrData.frontmatter.enforcement.rule_id}
                </span>
                <span className="badge-severity">
                  severity: {adrData.frontmatter.enforcement.severity}
                </span>
              </div>

              {/* Context section as Markdown */}
              <section className="adr-context">
                <ReactMarkdown>{adrData.contextMarkdown}</ReactMarkdown>
              </section>
            </article>
          ) : (
            <div className="placeholder">
              <p>Failed to load ADR details.</p>
            </div>
          )}
        </div>

        {/* ─── Sidebar: List of ADRs ─── */}
        <nav className="sidebar">
          <h3>All ADRs</h3>
          {manifest.length === 0 ? (
            <p className="sidebar-empty">No ADRs available.</p>
          ) : (
            <ul className="sidebar-list">
              {manifest.map((r) => (
                <li
                  key={r.id}
                  className={
                    r.id === selectedAdr ? "sidebar-item selected" : "sidebar-item"
                  }
                  onClick={() => setSelectedAdr(r.id)}
                >
                  <div className="adr-id">{r.id}</div>
                  <div className="adr-subtitle">
                    {r.tool} / {r.rule_id}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </nav>
      </div>
    </div>
  );
}
