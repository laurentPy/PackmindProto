import { useEffect, useState } from "react";
import YAML from "js-yaml";
import ReactMarkdown from "react-markdown";
import { DashboardPage } from "./pages/DashboardPage";
import "./App.css";

//
// 1) Type definitions
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

interface Violation {
  adr_id:  string;
  file:    string;
  line:    number;
  message: string;
}

export default function App() {
  // ─────────────────────────── State ───────────────────────────
  const [manifest, setManifest]         = useState<ManifestRule[]>([]);
  const [selectedAdr, setSelectedAdr]   = useState<string | null>(null);
  const [adrData, setAdrData]           = useState<AdrContent | null>(null);
  const [loadingAdr, setLoadingAdr]     = useState(false);
  const [violations, setViolations]     = useState<Violation[]>([]);
  const [violationsError, setViolationsError] = useState<string | null>(null);

  // ─────────────────────────── Config / URLs ───────────────────────────
  const REPO_KEY       = "mySpace"; 
  const MANIFEST_URL   = `http://localhost:8000/manifest/${REPO_KEY}`;
  const ADR_URL_BASE   = `http://localhost:8000/adr/`;             
  const VIOLATIONS_URL = `http://localhost:8000/api/violations/${REPO_KEY}`;

  // ─────────────────────────── Fetch manifest on mount ───────────────────────────
// NEW: poll /manifest every 10 seconds
useEffect(() => {
  const loadManifest = () => {
    fetch(MANIFEST_URL)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.rules)) {
          setManifest(data.rules);
        }
      })
      .catch((err) => {
        console.error("Error loading manifest:", err);
        setManifest([]);
      });
  };

  // initial load
  loadManifest();

  // re‐load every 10 seconds
  const id = window.setInterval(loadManifest, 10_000);
  return () => window.clearInterval(id);
}, []);




  // ─────────────────────────── Fetch ADR content when selection changes ───────────────────────────
  useEffect(() => {
    if (!selectedAdr || selectedAdr === "dashboard") {
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
        const raw: string = data.content;
        const parts = raw.split("---");
        if (parts.length < 3) {
          throw new Error("ADR frontmatter missing or malformed");
        }
        const yamlText = parts[1];
        const mdText   = parts.slice(2).join("---").trim();

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
      .finally(() => setLoadingAdr(false));
  }, [selectedAdr]);

  // ─────────────────────────── Poll for live violations every 5s ───────────────────────────
  useEffect(() => {
    let intervalId: number;
    const fetchViolations = () => {
      fetch(VIOLATIONS_URL)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch violations");
          return res.json();
        })
        .then((data: { violations: Violation[] }) => {
          if (Array.isArray(data.violations)) {
            setViolations(data.violations);
            setViolationsError(null);
          }
        })
        .catch((err) => {
          console.error("Error fetching violations:", err);
          setViolationsError("Could not load violations");
        });
    };

    fetchViolations();
    intervalId = window.setInterval(fetchViolations, 5000);
    return () => window.clearInterval(intervalId);
  }, []);

  // ─────────────────────────── Filter violations for the selected ADR ───────────────────────────
  const filteredViolations = violations.filter((v) => v.adr_id === selectedAdr);

  // ─────────────────────────── Render ───────────────────────────
  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <h1>Packmind - Home for technical decisions</h1>
      </header>

      {/* Two‐pane layout: Sidebar on left, Main on right */}
      <div className="content-wrapper">
        {/* ─── Sidebar ─── */}
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
              {/* ─── Dashboard menu entry ─── */}
              <li
                key="dashboard"
                className={selectedAdr === "dashboard" ? "sidebar-item selected" : "sidebar-item"}
                onClick={() => setSelectedAdr("dashboard")}
              >
                <div className="adr-id">📊 Dashboard</div>
              </li>
            </ul>
          )}
        </nav>

        {/* ─── Main Panel ─── */}
        <main className="main-panel">
          {selectedAdr === "dashboard" ? (
            /* Dashboard view */
            <DashboardPage />
          ) : !selectedAdr ? (
            <div className="placeholder">
              <p>Select an ADR on the left to view its details.</p>
            </div>
          ) : loadingAdr ? (
            <div className="placeholder">
              <p>Loading ADR…</p>
            </div>
          ) : adrData ? (
            <article className="adr-detail">
              {/* ADR Title */}
              <h2>{adrData.frontmatter.title}</h2>

              {/* Frontmatter Badges */}
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

              {/* ADR Context (Markdown) */}
              <section className="adr-context">
                <ReactMarkdown>{adrData.contextMarkdown}</ReactMarkdown>
              </section>

              {/* Live Violations */}
              <section className="violations-section">
                <h3>Live Violations</h3>
                {violationsError && (
                  <p className="error-text">{violationsError}</p>
                )}
                {!violationsError && filteredViolations.length === 0 ? (
                  <p className="placeholder">No violations reported.</p>
                ) : (
                  <ul className="violation-list">
                    {filteredViolations.map((v, idx) => (
                      <li key={idx} className="violation-item">
                        <div>
                          <strong>ADR:</strong> {v.adr_id}
                        </div>
                        <div>
                          <strong>Location:</strong> {v.file}:{v.line}
                        </div>
                        <div>{v.message}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </article>
          ) : (
            <div className="placeholder">
              <p>Failed to load ADR details.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
