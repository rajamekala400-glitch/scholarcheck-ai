
import { useState } from "react";
import "./App.css";

export default function App() {
  const [mode, setMode] = useState("plagiarism");
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  async function checkText() {
    if (!text.trim()) {
      setResult("Please paste your text before continuing.");
      return;
    }

    if (mode === "plagiarism") {
      setResult("Checking text against sample references...");

      try {
        const API_BASE_URL =
          import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

        const response = await fetch(`${API_BASE_URL}/api/check`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });

        if (!response.ok) {
          throw new Error("API request failed");
        }

        const data = await response.json();

        const report = data.matches
          .map(
            (match) =>
              `${match.source_title}: ${match.similarity_percent}% similarity`
          )
          .join("\n");

        setResult(
          `Analysis complete\nWord count: ${data.word_count}\n\n${report}\n\n${data.notice}`
        );
      } catch {
        setResult(
          "Could not connect to the backend. Check the API URL and confirm that the backend is running."
        );
      }
    } else {
      setResult(
        "The humanization service is not connected yet. We will implement it next."
      );
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <h2>
          <span>✦</span> ScholarCheck AI
        </h2>

        <p className="nav-label">WORKSPACE</p>

        <button className="nav-button active">Dashboard</button>

        <button
          className="nav-button"
          onClick={() => {
            setMode("plagiarism");
            setResult("");
          }}
        >
          Plagiarism Checker
        </button>

        <button
          className="nav-button"
          onClick={() => {
            setMode("humanizer");
            setResult("");
          }}
        >
          AI Humanizer
        </button>

        <div className="sidebar-note">
          <strong>Academic Writing</strong>
          <p>Write clearly. Check carefully.</p>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <span>Workspace / Dashboard</span>
          <span className="status">Prototype</span>
        </header>

        <section className="welcome">
          <p className="eyebrow">YOUR ACADEMIC WRITING ASSISTANT</p>
          <h1>Write with confidence.</h1>
          <p>Review text similarity and improve your academic writing.</p>
        </section>

        <section className="feature-grid">
          <button
            className={`feature-card ${
              mode === "plagiarism" ? "selected" : ""
            }`}
            onClick={() => {
              setMode("plagiarism");
              setResult("");
            }}
          >
            <span className="feature-icon">◎</span>
            <strong>Plagiarism Checker</strong>
            <span>Compare text against available sources.</span>
          </button>

          <button
            className={`feature-card ${
              mode === "humanizer" ? "selected" : ""
            }`}
            onClick={() => {
              setMode("humanizer");
              setResult("");
            }}
          >
            <span className="feature-icon blue">✧</span>
            <strong>AI Humanizer</strong>
            <span>Improve clarity and readability.</span>
          </button>
        </section>

        <section className="editor-panel">
          <div className="editor-heading">
            <div>
              <h2>
                {mode === "plagiarism"
                  ? "Check your text"
                  : "Improve your writing"}
              </h2>
              <p>
                Paste a paragraph from your assignment or research paper.
              </p>
            </div>

            <span>
              {text.trim() ? text.trim().split(/\s+/).length : 0} words
            </span>
          </div>

          <textarea
            value={text}
            onChange={(event) => {
              setText(event.target.value);
              setResult("");
            }}
            placeholder="Paste your academic text here..."
          />

          <div className="editor-footer">
            <span>
              Text is sent to the configured backend only when you click the
              button.
            </span>

            <button className="primary-button" onClick={checkText}>
              {mode === "plagiarism" ? "Check Text →" : "Humanize Text →"}
            </button>
          </div>

          {result && (
            <div className="result">
              <pre>{result}</pre>
            </div>
          )}
        </section>

        <p className="disclaimer">
          Prototype only — similarity is checked against two built-in sample
          references. It is not a comprehensive plagiarism verdict.
        </p>
      </main>
    </div>
  );
}
