"use client"

import { useState } from "react"
import axios from "axios"

function App() {
  const [resumeFile, setResumeFile] = useState(null)
  const [jobDesc, setJobDesc] = useState("")
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [fileName, setFileName] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!resumeFile || !jobDesc) {
      alert("Please upload resume and enter job description")
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append("resume", resumeFile)
    formData.append("job_description", jobDesc)

    try {
      const response = await axios.post("http://127.0.0.1:5000/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      })
      setResult(response.data)
    } catch (error) {
      console.error("Error uploading:", error)
      alert("Failed to process resume.")
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setResumeFile(file)
      setFileName(file.name)
    }
  }

  return (
    <div className="app-container">
      <div className="content-wrapper">
        <header className="app-header">
          <h1 className="title">Resume Matcher</h1>
          <p className="subtitle">Upload your resume and job description to see how well they match</p>
        </header>

        <div className="card form-card">
          <form onSubmit={handleSubmit} className="form">
            <div className="form-group">
              <label className="label">Resume</label>
              <div className="file-upload-container">
                <label className="file-upload-label">
                  <div className="file-upload-button">
                    <span className="upload-icon">📄</span>
                    {fileName ? fileName : "Choose Resume (PDF)"}
                  </div>
                  <input type="file" accept=".pdf" onChange={handleFileChange} className="file-input" />
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="label">Job Posting URL</label>
              <input
                type="url"
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                placeholder="Enter job posting URL..."
                className="input"
                required
              />
            </div>

            <button type="submit" className="button submit-button" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing...
                </>
              ) : (
                "Analyze Match"
              )}
            </button>
          </form>
        </div>

        {/* {loading && (
          <div className="card loading-card">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Analyzing your resume...</p>
            </div>
          </div>
        )} */}

        {result && !loading && (
          <div className="card result-card">
            <h2 className="result-title">Analysis Results</h2>

            {result.skills && result.skills.length > 0 && (
              <div className="result-section skills-section">
                <h3>
                  <span className="section-icon">💪</span>
                  Key Skills of Candidate
                </h3>
                <div className="skills-container">
                  {result.skills.map((skill, index) => (
                    <span key={index} className="skill-tag">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {result.reasons && (
              <div className="result-section">
                <h3>
                  <span className="section-icon">🔍</span>
                  Match Analysis
                </h3>
                <ul className="reasons-list">
                  {result.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.improvement_suggestions && result.improvement_suggestions.length > 0 && (
              <div className="result-section">
                <h3>
                  <span className="section-icon">💡</span>
                  Improvement Suggestions
                </h3>
                <ul className="suggestions-list">
                  {result.improvement_suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.cold_emails && result.cold_emails.length > 0 && (
              <div className="result-section">
                <h3>
                  <span className="section-icon">✉️</span>
                  Cold Email Template
                </h3>
                <div className="email-templates">
                  {result.cold_emails.map((email, index) => (
                    <div key={index} className="email-template">
                      <pre className="email-content">{email}</pre>
                      <button 
                        className="copy-button"
                        onClick={() => {
                          navigator.clipboard.writeText(email);
                          alert('Email template copied to clipboard!');
                        }}
                      >
                        <span className="copy-icon">📋</span>
                        Copy to Clipboard
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <footer className="app-footer">
          <p>AI-Powered Resume Matcher &copy; 2025</p>
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        
        :root {
          --bg-gradient: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          --card-bg: #1e293b;
          --card-bg-hover: #273549;
          --accent-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
          --accent-color: #8b5cf6;
          --accent-hover: #a78bfa;
          --text-primary: #f1f5f9;
          --text-secondary: #94a3b8;
          --text-tertiary: #64748b;
          --success-color: #10b981;
          --warning-color: #f59e0b;
          --error-color: #ef4444;
          --card-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          --card-border: 1px solid rgba(255, 255, 255, 0.1);
          --input-bg: rgba(255, 255, 255, 0.05);
          --input-border: 1px solid rgba(255, 255, 255, 0.1);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          margin: 0;
          padding: 0;
          background: var(--bg-gradient);
          color: var(--text-primary);
          font-family: 'Poppins', sans-serif;
          min-height: 100vh;
        }

        .app-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          padding: 40px 20px;
        }

        .content-wrapper {
          width: 100%;
          max-width: 900px;
          display: flex;
          flex-direction: column;
          gap: 30px;
        }

        .app-header {
          text-align: center;
          margin-bottom: 10px;
        }

        .title {
          font-size: 2.5rem;
          font-weight: 700;
          background: var(--accent-gradient);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 16px;
          letter-spacing: -0.5px;
        }

        .subtitle {
          color: var(--text-secondary);
          font-size: 1.1rem;
          font-weight: 300;
          max-width: 600px;
          margin: 0 auto;
        }

        .card {
          background-color: var(--card-bg);
          border-radius: 16px;
          box-shadow: var(--card-shadow);
          border: var(--card-border);
          padding: 32px;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          backdrop-filter: blur(10px);
        }

        .card:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }

        .form-card {
          position: relative;
          overflow: hidden;
        }

        .form-card::before {
          content: '';
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          height: 5px;
          background: var(--accent-gradient);
          border-radius: 5px;
          opacity: 0.7;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .label {
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.95rem;
          margin-bottom: 4px;
        }

        .file-upload-container {
          width: 100%;
        }

        .file-upload-label {
          display: block;
          cursor: pointer;
          width: 100%;
        }

        .file-upload-button {
          background-color: var(--input-bg);
          color: var(--text-primary);
          padding: 14px 20px;
          border-radius: 12px;
          text-align: center;
          transition: all 0.3s ease;
          border: var(--input-border);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .upload-icon {
          font-size: 1.2rem;
        }

        .file-upload-button:hover {
          border-color: var(--accent-color);
          background-color: rgba(139, 92, 246, 0.1);
        }

        .file-input {
          display: none;
        }

        .input {
          padding: 14px 20px;
          background-color: var(--input-bg);
          border: var(--input-border);
          border-radius: 12px;
          color: var(--text-primary);
          font-family: inherit;
          font-size: 1rem;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
          width: 100%;
        }

        .input:focus {
          outline: none;
          border-color: var(--accent-color);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
        }

        .input::placeholder {
          color: var(--text-tertiary);
        }

        .button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: var(--accent-gradient);
          color: white;
          padding: 14px 20px;
          border: none;
          border-radius: 12px;
          cursor: pointer;
          font-weight: 500;
          font-size: 1rem;
          transition: all 0.3s ease;
          width: 100%;
        }

        .button:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
        }

        .button:disabled {
          background: var(--text-tertiary);
          cursor: not-allowed;
          transform: none;
        }

        .submit-button {
          margin-top: 10px;
          position: relative;
          overflow: hidden;
          z-index: 1;
        }

        .submit-button::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(45deg, rgba(255,255,255,0), rgba(255,255,255,0.2), rgba(255,255,255,0));
          transform: translateX(-100%);
          transition: transform 0.6s;
          z-index: -1;
        }

        .submit-button:hover::after {
          transform: translateX(100%);
        }

        .spinner {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }

        .loading-card {
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 40px;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: var(--text-secondary);
          gap: 16px;
        }

        .loading-spinner {
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top: 3px solid var(--accent-color);
          width: 50px;
          height: 50px;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .result-card {
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .result-title {
          color: var(--text-primary);
          font-size: 1.75rem;
          font-weight: 600;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 16px;
          margin-bottom: 24px;
        }

        .result-section {
          position: relative;
          overflow: hidden;
          margin-bottom: 32px;
          background-color: rgba(255, 255, 255, 0.03);
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: transform 0.3s ease;
        }

        .result-section:hover {
          transform: translateY(-3px);
        }

        .section-icon {
          margin-right: 10px;
          font-size: 1.2rem;
        }

        .result-section h3 {
          color: var(--text-primary);
          margin-bottom: 16px;
          font-size: 1.25rem;
          font-weight: 500;
          display: flex;
          align-items: center;
        }

        .skills-section {
          background-color: rgba(99, 102, 241, 0.05);
        }

        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .skill-tag {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
          color: var(--text-primary);
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          border: 1px solid rgba(139, 92, 246, 0.3);
          transition: all 0.2s ease;
        }

        .skill-tag:hover {
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%);
          transform: translateY(-2px);
        }

        .reasons-list, .suggestions-list {
          margin: 0;
          padding-left: 20px;
          color: var(--text-primary);
        }

        .reasons-list li, .suggestions-list li {
          margin-bottom: 12px;
          line-height: 1.6;
          position: relative;
        }

        .reasons-list li::marker, .suggestions-list li::marker {
          color: var(--accent-color);
        }

        .email-templates {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .email-template {
          background-color: rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 20px;
          position: relative;
          border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .email-content {
          white-space: pre-wrap;
          font-family: inherit;
          margin: 0;
          color: var(--text-primary);
          line-height: 1.7;
          font-size: 0.95rem;
        }

        .copy-button {
          display: flex;
          align-items: center;
          gap: 8px;
          background-color: rgba(139, 92, 246, 0.2);
          color: var(--text-primary);
          border: 1px solid rgba(139, 92, 246, 0.3);
          border-radius: 8px;
          padding: 10px 16px;
          margin-top: 16px;
          cursor: pointer;
          font-size: 0.9rem;
          transition: all 0.2s ease;
        }

        .copy-button:hover {
          background-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-2px);
        }

        .copy-icon {
          font-size: 1.1rem;
        }

        .app-footer {
          text-align: center;
          color: var(--text-tertiary);
          font-size: 0.9rem;
          margin-top: 30px;
          padding: 20px 0;
        }

        @media (max-width: 768px) {
          .app-container {
            padding: 20px 15px;
          }
          
          .card {
            padding: 24px;
          }
          
          .title {
            font-size: 1.8rem;
          }
          
          .result-title {
            font-size: 1.5rem;
          }
          
          .result-section {
            padding: 20px;
          }
          
          .skill-tag {
            padding: 6px 12px;
            font-size: 0.85rem;
          }
        }
      `}</style>
    </div>
  )
}

export default App
