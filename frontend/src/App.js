import React, { useState } from "react";
import axios from "axios";

function App() {
  const [resume, setResume] = useState(null);
  const [jobDescription, setJobDescription] = useState("");
  const [result, setResult] = useState(null);

  const handleFileUpload = (e) => {
    setResume(e.target.files[0]);
  };

  const handleAnalyze = async () => {
    const formData = new FormData();
    formData.append("resume", resume);  // File upload
    formData.append("job_description", jobDescription);  // Text input

    try {
        const response = await axios.post("http://127.0.0.1:5000/analyze", formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        console.log("Match Score:", response.data.match_score);
        console.log("Matched Skills:", response.data.matched_skills);
    } catch (error) {
        console.error("Error analyzing resume:", error);
    }
};

  return (
    <div>
      <h2>AI Resume Analyzer</h2>
      <input type="file" accept=".pdf" onChange={handleFileUpload} />
      <textarea
        placeholder="Paste Job Description Here"
        value={jobDescription}
        onChange={(e) => setJobDescription(e.target.value)}
      />
      <button onClick={handleAnalyze}>Analyze</button>

      {result && (
        <div>
          <h3>Match Score: {result.match_score}%</h3>
          <p>Matched Skills: {result.matched_skills.join(", ")}</p>
        </div>
      )}
    </div>
  );
}

export default App;
