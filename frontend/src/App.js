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
      <div className="container">
        <h1 className="title">Resume Matcher</h1>
        <p className="subtitle">Upload your resume and job description to see how well they match</p>

        <form onSubmit={handleSubmit} className="form">
          <div className="file-upload-container">
            <label className="file-upload-label">
              <div className="file-upload-button">{fileName ? fileName : "Choose Resume (PDF)"}</div>
              <input type="file" accept=".pdf" onChange={handleFileChange} className="file-input" />
            </label>
          </div>

          <label className="label">Job Description</label>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="Paste the job description here..."
            className="textarea"
          />

          <button type="submit" className="button" disabled={loading}>
            {loading ? "Analyzing..." : "Analyze Match"}
          </button>
        </form>

        {loading && (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Analyzing your resume...</p>
          </div>
        )}

        {result && !loading && (
          <div className="result-box">
            <h2 className="result-title">Analysis Results</h2>

            <div className="result-section">
              <h3>Match Score</h3>
              <div className="match-score">
                <div className="match-progress" style={{ width: `${result.match_percentage || 0}%` }}></div>
                <span className="match-text">{result.match_percentage || 0}%</span>
              </div>
            </div>

            {result.skills && result.skills.length > 0 && (
              <div className="result-section">
                <h3>Key Skills</h3>
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
                <h3>Match Analysis</h3>
                <ul className="reasons-list">
                  {result.reasons.map((reason, index) => (
                    <li key={index}>{reason}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.suggested_jobs && result.suggested_jobs.length > 0 && (
              <div className="result-section">
                <h3>Suggested Job Roles</h3>
                <ul className="jobs-list">
                  {result.suggested_jobs.map((job, index) => (
                    <li key={index}>{job}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        :root {
          --bg-primary: #121212;
          --bg-secondary: #1e1e1e;
          --bg-tertiary: #2d2d2d;
          --text-primary: #e0e0e0;
          --text-secondary: #a0a0a0;
          --accent-color: #8a2be2;
          --accent-hover: #9d4edd;
          --success-color: #4caf50;
          --error-color: #f44336;
        }

        body {
          margin: 0;
          padding: 0;
          background-color: var(--bg-primary);
          color: var(--text-primary);
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        .app-container {
          min-height: 100vh;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 20px;
          background-color: var(--bg-primary);
        }

        .container {
          width: 100%;
          max-width: 800px;
          padding: 30px;
          border-radius: 12px;
          background-color: var(--bg-secondary);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .title {
          text-align: center;
          font-size: 32px;
          margin-bottom: 10px;
          color: var(--text-primary);
          font-weight: 600;
        }

        .subtitle {
          text-align: center;
          color: var(--text-secondary);
          margin-bottom: 30px;
        }

        .form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .label {
          font-weight: 500;
          margin-bottom: -15px;
          color: var(--text-primary);
        }

        .file-upload-container {
          margin-bottom: 5px;
        }

        .file-upload-label {
          display: block;
          cursor: pointer;
        }

        .file-upload-button {
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          padding: 12px 16px;
          border-radius: 8px;
          text-align: center;
          transition: all 0.3s ease;
          border: 1px dashed var(--text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .file-upload-button:hover {
          background-color: rgba(138, 43, 226, 0.1);
          border-color: var(--accent-color);
        }

        .file-input {
          display: none;
        }

        .textarea {
          padding: 12px;
          border: 1px solid var(--bg-tertiary);
          border-radius: 8px;
          background-color: var(--bg-tertiary);
          color: var(--text-primary);
          min-height: 120px;
          resize: vertical;
          font-family: inherit;
          transition: border 0.3s ease;
        }

        .textarea:focus {
          outline: none;
          border-color: var(--accent-color);
        }

        .button {
          background-color: var(--accent-color);
          color: white;
          padding: 14px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 16px;
          transition: background-color 0.3s ease;
          margin-top: 10px;
        }

        .button:hover {
          background-color: var(--accent-hover);
        }

        .button:disabled {
          background-color: var(--bg-tertiary);
          cursor: not-allowed;
          opacity: 0.7;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-top: 30px;
          color: var(--text-secondary);
        }

        .loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top: 4px solid var(--accent-color);
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 15px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .result-box {
          margin-top: 30px;
          padding: 25px;
          border-radius: 10px;
          background-color: var(--bg-tertiary);
          animation: fadeIn 0.5s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .result-title {
          margin-top: 0;
          color: var(--text-primary);
          font-size: 24px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 15px;
          margin-bottom: 20px;
        }

        .result-section {
          margin-bottom: 25px;
        }

        .result-section h3 {
          color: var(--text-primary);
          margin-bottom: 12px;
          font-size: 18px;
          font-weight: 500;
        }

        .match-score {
          height: 30px;
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 15px;
          position: relative;
          overflow: hidden;
        }

        .match-progress {
          height: 100%;
          background: linear-gradient(90deg, #8a2be2, #9d4edd);
          border-radius: 15px;
          transition: width 1s ease-in-out;
        }

        .match-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-weight: bold;
          text-shadow: 0 0 3px rgba(0, 0, 0, 0.5);
        }

        .skills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .skill-tag {
          background-color: rgba(138, 43, 226, 0.2);
          color: var(--text-primary);
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 14px;
          border: 1px solid rgba(138, 43, 226, 0.3);
        }

        .reasons-list, .jobs-list {
          margin: 0;
          padding-left: 20px;
          color: var(--text-primary);
        }

        .reasons-list li, .jobs-list li {
          margin-bottom: 8px;
          line-height: 1.5;
        }

        @media (max-width: 600px) {
          .container {
            padding: 20px;
          }
          
          .title {
            font-size: 24px;
          }
          
          .result-title {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  )
}

export default App
