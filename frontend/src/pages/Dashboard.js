import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "react-chartjs-2";
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
const API_URL = "https://placement-portal-cell.onrender.com";

function Dashboard() {
  const navigate = useNavigate();

  // State variables
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCompanies: 0,
    totalJobs: 0,
    totalApplications: 0,
  });

  // Data collections
  const [jobs, setJobs] = useState([]);
  const [students, setStudents] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [applications, setApplications] = useState([]);

  // Profile management for active student
  const [studentProfile, setStudentProfile] = useState({
    cgpa: "",
    branch: "",
    skills: "",
    resumeLink: "",
  });
  const [profileExists, setProfileExists] = useState(false);
  const [profileId, setProfileId] = useState("");

  // Modals visibility
  const [showJobModal, setShowJobModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);

  // Form states
  const [jobForm, setJobForm] = useState({
    title: "",
    companyName: "",
    location: "",
    salary: "",
    skillsRequired: "",
    description: "",
  });

  const [companyForm, setCompanyForm] = useState({
    companyName: "",
    email: "",
    location: "",
    website: "",
    description: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [resumeScore, setResumeScore] = useState(null);
  const [foundSkills, setFoundSkills] = useState([]);
  const [missingSkills, setMissingSkills] = useState([]);

  // Parse JWT token helper
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch (e) {
      return null;
    }
  };

  // Check login session
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const decoded = parseJwt(token);
    if (!decoded) {
      localStorage.removeItem("token");
      navigate("/");
      return;
    }

    setCurrentUser(decoded);
  }, [navigate]);

  // Fetch Dashboard Stats and Tab Data
  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/dashboard`);
      setStats(res.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/jobs`);
      setJobs(res.data);
    } catch (err) {
      console.error("Error fetching jobs:", err);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/students`);
      setStudents(res.data);

      // If active user is student, check if their profile exists
      if (currentUser && currentUser.role === "student") {
        const activeProfile = res.data.find(
          (s) => s.email === currentUser.email
        );
        if (activeProfile) {
          setProfileExists(true);
          setProfileId(activeProfile._id);
          setStudentProfile({
            cgpa: activeProfile.cgpa || "",
            branch: activeProfile.branch || "",
            skills: activeProfile.skills ? activeProfile.skills.join(", ") : "",
            resumeLink: activeProfile.resumeLink || "",
          });
        }
      }
    } catch (err) {
      console.error("Error fetching students:", err);
    }
  }, [currentUser]);

  const fetchCompanies = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/companies`);
      setCompanies(res.data);
    } catch (err) {
      console.error("Error fetching companies:", err);
    }
  }, []);

  const fetchApplications = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/applications`);
      setApplications(res.data);
    } catch (err) {
      console.error("Error fetching applications:", err);
    }
  }, []);

  // Fetch data on startup and when active tab or user changes
  useEffect(() => {
    if (currentUser) {
      fetchStats();
      fetchJobs();
      fetchStudents();
      fetchCompanies();
      fetchApplications();
    }
  }, [currentUser, fetchStats, fetchJobs, fetchStudents, fetchCompanies, fetchApplications]);

  // Log out handler
  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Job Application submission
  const handleApplyJob = async (job) => {
    if (!currentUser) return;
    setError("");
    setSuccess("");

    // Check if student profile is complete or registered
    if (!profileExists) {
      setError("Please fill out and save your Student Profile under the 'Students' tab before applying.");
      return;
    }

    // Check if already applied
    const alreadyApplied = applications.some(
      (app) => app.studentEmail === currentUser.email && app.jobTitle === job.title && app.companyName === job.companyName
    );

    if (alreadyApplied) {
      setError("You have already applied for this job!");
      return;
    }

    try {
      await axios.post(`${API_URL}/api/applications`, {
        studentName: currentUser.name,
        studentEmail: currentUser.email,
        jobTitle: job.title,
        companyName: job.companyName,
      });

      setSuccess(`Successfully applied for the ${job.title} position at ${job.companyName}!`);
      fetchApplications();
      fetchStats();
      setTimeout(() => setSuccess(""), 4000);
    } catch (err) {
      console.error(err);
      setError("Failed to apply for job.");
    }
  };

  // Student profile creation or updating
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      name: currentUser.name,
      email: currentUser.email,
      cgpa: Number(studentProfile.cgpa),
      branch: studentProfile.branch,
      skills: studentProfile.skills.split(",").map((s) => s.trim()).filter((s) => s),
      resumeLink: studentProfile.resumeLink,
    };

    try {
      if (profileExists) {
        // Update existing student profile
        await axios.put(`${API_URL}/api/students/${profileId}`, payload);
        setSuccess("Student profile updated successfully!");
      } else {
        // Create new student profile
        const res = await axios.post(`${API_URL}/api/students`, payload);
        setProfileExists(true);
        setProfileId(res.data._id);
        setSuccess("Student profile created successfully!");
      }

      fetchStudents();
      fetchStats();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to save profile.");
    }
  };

  // Job creation handler
  const handleCreateJob = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      ...jobForm,
      skillsRequired: jobForm.skillsRequired.split(",").map((s) => s.trim()).filter((s) => s),
    };

    try {
      await axios.post(`${API_URL}/api/jobs`, payload);
      setSuccess("New job posted successfully!");
      setShowJobModal(false);
      setJobForm({
        title: "",
        companyName: "",
        location: "",
        salary: "",
        skillsRequired: "",
        description: "",
      });
      fetchJobs();
      fetchStats();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to post job.");
    }
  };

  // Company creation handler
  const handleCreateCompany = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      await axios.post(`${API_URL}/api/companies`, companyForm);
      setSuccess("New company registered successfully!");
      setShowCompanyModal(false);
      setCompanyForm({
        companyName: "",
        email: "",
        location: "",
        website: "",
        description: "",
      });
      fetchCompanies();
      fetchStats();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error(err);
      setError("Failed to register company.");
    }
  };
  const reviewResume = () => {
  const requiredSkills = [
    "Java",
    "Python",
    "React",
    "Node",
    "MongoDB",
    "SQL"
  ];

  const found = requiredSkills.filter(skill =>
    resumeText.toLowerCase().includes(skill.toLowerCase())
  );

  const missing = requiredSkills.filter(
    skill => !found.includes(skill)
  );

  const score = Math.round(
    (found.length / requiredSkills.length) * 100
  );

  setFoundSkills(found);
  setMissingSkills(missing);
  setResumeScore(score);
};
const chartData = {
  labels: ["Students", "Companies", "Jobs", "Applications"],
  datasets: [
    {
      label: "Portal Analytics",
      data: [
        stats.totalStudents,
        stats.totalCompanies,
        stats.totalJobs,
        stats.totalApplications
      ]
    }
  ]
};
  if (!currentUser) {
    return <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>Loading portal workspace...</div>;
  }
  const filteredJobs = jobs.filter((job) =>
  job.title.toLowerCase().includes(searchTerm.toLowerCase())
);

const recommendedJobs = jobs.filter((job) => {
  if (!studentProfile.skills) return false;

  const studentSkills = studentProfile.skills
    .toLowerCase()
    .split(",")
    .map((skill) => skill.trim());

  return job.skillsRequired?.some((skill) =>
    studentSkills.includes(skill.toLowerCase())
  );
});

  return (
    <div className="dashboard-container">
      {/* Top Header Navbar */}
      <header className="dashboard-header">
        <div className="header-logo">
          <span>✦</span> Placement Cell Portal
        </div>

        <div className="header-user-info">
          <div className="user-profile">
            <div className="user-avatar">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div className="user-details">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{currentUser.role}</span>
            </div>
          </div>
          <button className="btn-logout" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace layout */}
      <div className="dashboard-content">
        
        {/* Navigation Sidebar */}
        <aside className="dashboard-sidebar">
          <ul className="nav-menu">
            <li
              className={`nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              📊 Overview
            </li>
            <li
              className={`nav-item ${activeTab === "jobs" ? "active" : ""}`}
              onClick={() => setActiveTab("jobs")}
            >
              💼 Job Openings
            </li>
            <li
              className={`nav-item ${activeTab === "students" ? "active" : ""}`}
              onClick={() => setActiveTab("students")}
            >
              🎓 Student Profiles
            </li>
            <li
              className={`nav-item ${activeTab === "companies" ? "active" : ""}`}
              onClick={() => setActiveTab("companies")}
            >
              🏢 Partner Companies
            </li>
            <li
              className={`nav-item ${activeTab === "applications" ? "active" : ""}`}
              onClick={() => setActiveTab("applications")}
            >
              📝 Applications
            </li>
            <li
  className={`nav-item ${activeTab === "recommended" ? "active" : ""}`}
  onClick={() => setActiveTab("recommended")}
>
  ⭐ Recommended Jobs
</li>
          </ul>
        </aside>

        {/* Dashboard Workspace Panel */}
        <main className="main-panel">
          
          {/* Notification Messages */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: "20px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success" style={{ marginBottom: "20px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              <span>{success}</span>
            </div>
          )}

          {/* ================= OVERVIEW TAB ================= */}
          {activeTab === "overview" && (
            <div>
              <div className="panel-header">
                <h2 className="panel-title">Placement Dashboard Summary</h2>
              </div>

              <div className="section-alert">
                <span>🔔 Welcome to the Placement Cell Portal. Review active stats, job lists, and candidate profiles below.</span>
              </div>

              <div className="stats-grid">
                <div className="stats-card">
                  <span className="stats-label">Registered Students</span>
                  <span className="stats-value">{stats.totalStudents}</span>
                  <span className="stats-desc">Total candidates enrolled</span>
                </div>
                <div
  style={{
    marginTop: "40px",
    padding: "25px",
    background: "rgba(8,11,17,0.3)",
    borderRadius: "16px",
    border: "1px solid var(--border-color)"
  }}
>
  <h3 style={{ marginBottom: "20px" }}>Analytics Dashboard</h3>
  <Bar data={chartData} />
</div>
                <div className="stats-card">
                  <span className="stats-label">Partner Companies</span>
                  <span className="stats-value">{stats.totalCompanies}</span>
                  <span className="stats-desc">Hiring organizations active</span>
                </div>
                <div className="stats-card">
                  <span className="stats-label">Active Job Openings</span>
                  <span className="stats-value">{stats.totalJobs}</span>
                  <span className="stats-desc">Available postings listed</span>
                </div>
                <div className="stats-card">
                  <span className="stats-label">Job Applications</span>
                  <span className="stats-value">{stats.totalApplications}</span>
                  <span className="stats-desc">Applications submitted</span>
                </div>
              </div>

              <div style={{ marginTop: "40px", padding: "30px", background: "rgba(8, 11, 17, 0.3)", borderRadius: "16px", border: "1px solid var(--border-color)" }}>
                <h3 style={{ marginBottom: "12px", color: "var(--text-primary)" }}>Quick Operations</h3>
                <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginBottom: "20px", lineHeight: "1.6" }}>
                  Navigate through the sidebar panels to list openings, create profiles, register companies, and submit application requests. If you are logged in as a <strong>Company Recruiter</strong> or <strong>Portal Administrator</strong>, you can add new jobs and partner companies directly using active action buttons inside each panel.
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <div
  style={{
    marginTop: "30px",
    padding: "25px",
    background: "rgba(8, 11, 17, 0.3)",
    borderRadius: "16px",
    border: "1px solid var(--border-color)"
  }}
>
  <h3>AI Resume Review</h3>

  <textarea
    rows="8"
    placeholder="Paste resume text here..."
    value={resumeText}
    onChange={(e) => setResumeText(e.target.value)}
    style={{
      width: "100%",
      padding: "12px",
      marginTop: "15px",
      borderRadius: "8px"
    }}
  />

  <button
    className="btn-primary"
    style={{ marginTop: "15px", width: "auto" }}
    onClick={reviewResume}
  >
    Review Resume
  </button>

  {resumeScore !== null && (
    <div style={{ marginTop: "20px" }}>
      <h3>Resume Score: {resumeScore}%</h3>
      <p><b>Skills Found:</b> {foundSkills.join(", ") || "None"}</p>
      <p><b>Missing Skills:</b> {missingSkills.join(", ") || "None"}</p>
    </div>
  )}
</div>
                  <button className="btn-primary" style={{ width: "auto" }} onClick={() => setActiveTab("jobs")}>View Jobs</button>
                  <button className="btn-secondary" onClick={() => setActiveTab("students")}>Verify Students</button>
                </div>
              </div>
            </div>
          )}

          {/* ================= JOBS TAB ================= */}
          {activeTab === "jobs" && (
            <div>
              <div className="panel-header">
                <h2 className="panel-title">Active Job Postings</h2>
                <input
  type="text"
  placeholder="Search jobs..."
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    margin: "15px 0",
    borderRadius: "8px"
  }}
/>
                {(currentUser.role === "company" || currentUser.role === "admin") && (
                  <button className="btn-primary" style={{ width: "auto" }} onClick={() => setShowJobModal(true)}>
                    + Post New Job
                  </button>
                )}
              </div>

              {jobs.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>No job openings listed at the moment.</div>
              ) : (
                <div className="data-grid">
                  {filteredJobs.map((job) => {
                    const studentApplied = applications.some(
                      (app) => app.studentEmail === currentUser.email && app.jobTitle === job.title && app.companyName === job.companyName
                    );

                    return (
                      <div className="data-card" key={job._id}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "4px" }}>
                            <h3 className="card-title">{job.title}</h3>
                            {studentApplied && <span className="badge badge-accepted">Applied</span>}
                          </div>
                          <span className="card-subtitle">{job.companyName}</span>
                          <div className="card-meta">
                            <span className="meta-item">📍 {job.location || "Remote"}</span>
                            <span className="meta-item">💰 {job.salary || "Not Specified"}</span>
                          </div>
                          <p className="card-desc" style={{ marginTop: "12px" }}>{job.description}</p>
                        </div>
                        <div>
                          <div style={{ margin: "14px 0" }}>
                            <span style={{ fontSize: "12px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>SKILLS REQUIRED</span>
                            <div className="tag-list">
                              {job.skillsRequired && job.skillsRequired.map((s, idx) => (
                                <span className="tag" key={idx}>{s}</span>
                              ))}
                            </div>
                          </div>
                          {currentUser.role === "student" && (
                            <button
                              className="btn-primary"
                              style={{ width: "100%", background: studentApplied ? "rgba(255, 255, 255, 0.05)" : "var(--grad-primary)", border: studentApplied ? "1px solid var(--border-color)" : "none", color: studentApplied ? "var(--text-muted)" : "white", cursor: studentApplied ? "not-allowed" : "pointer", boxShadow: studentApplied ? "none" : "0 4px 15px rgba(139, 92, 246, 0.3)" }}
                              onClick={() => handleApplyJob(job)}
                              disabled={studentApplied}
                            >
                              {studentApplied ? "Application Submitted" : "Apply for Job"}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ================= STUDENTS TAB ================= */}
          {activeTab === "recommended" && (
  <div>
    <div className="panel-header">
      <h2 className="panel-title">Recommended Jobs</h2>
    </div>

    {recommendedJobs.length === 0 ? (
      <div>No recommended jobs found.</div>
    ) : (
      <div className="data-grid">
        {recommendedJobs.map((job) => (
          <div className="data-card" key={job._id}>
            <h3>{job.title}</h3>
            <p>{job.companyName}</p>
          </div>
        ))}
      </div>
    )}
  </div>
)}
          {activeTab === "students" && (
            <div>
              <div className="panel-header">
                <h2 className="panel-title">Student Registration Registry</h2>
              </div>

              {/* Student active profile editor */}
              {currentUser.role === "student" && (
                <div style={{ background: "rgba(139, 92, 246, 0.04)", border: "1px solid rgba(139, 92, 246, 0.15)", borderRadius: "16px", padding: "24px", marginBottom: "35px" }}>
                  <h3 style={{ fontSize: "16px", marginBottom: "14px", color: "var(--text-primary)" }}>My Student Profile Settings</h3>
                  <form onSubmit={handleSaveProfile} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", alignItems: "end" }}>
                    <div style={{ textAlign: "left" }}>
                      <label className="form-label">CGPA</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max="10"
                        className="form-input"
                        placeholder="e.g. 9.15"
                        value={studentProfile.cgpa}
                        onChange={(e) => setStudentProfile({ ...studentProfile, cgpa: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <label className="form-label">Branch</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. Computer Science"
                        value={studentProfile.branch}
                        onChange={(e) => setStudentProfile({ ...studentProfile, branch: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <label className="form-label">Skills (Comma-separated)</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. React, Node.js, Python"
                        value={studentProfile.skills}
                        onChange={(e) => setStudentProfile({ ...studentProfile, skills: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ textAlign: "left" }}>
                      <label className="form-label">Resume Link</label>
                      <input
                        type="url"
                        className="form-input"
                        placeholder="e.g. https://drive.google.com/..."
                        value={studentProfile.resumeLink}
                        onChange={(e) => setStudentProfile({ ...studentProfile, resumeLink: e.target.value })}
                        required
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ width: "100%" }}>
                      {profileExists ? "Update Profile" : "Register Profile"}
                    </button>
                  </form>
                </div>
              )}

              {students.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>No student profiles enrolled yet.</div>
              ) : (
                <div className="table-container">
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Candidate Name</th>
                        <th>Email ID</th>
                        <th>Branch</th>
                        <th>CGPA Score</th>
                        <th>Skillsets</th>
                        <th>Resume Portfolio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {students.map((student) => (
                        <tr key={student._id}>
                          <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{student.name}</td>
                          <td>{student.email}</td>
                          <td>{student.branch || "N/A"}</td>
                          <td style={{ fontWeight: "700", color: "var(--accent-secondary)" }}>{student.cgpa ? student.cgpa.toFixed(2) : "N/A"}</td>
                          <td>
                            <div className="tag-list">
                              {student.skills && student.skills.map((s, idx) => (
                                <span className="tag" key={idx}>{s}</span>
                              ))}
                            </div>
                          </td>
                          <td>
                            {student.resumeLink ? (
                              <a href={student.resumeLink} target="_blank" rel="noreferrer" className="auth-link" style={{ marginLeft: 0 }}>
                                View Resume ↗
                              </a>
                            ) : (
                              <span style={{ color: "var(--text-muted)" }}>Not Uploaded</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ================= COMPANIES TAB ================= */}
          {activeTab === "companies" && (
            <div>
              <div className="panel-header">
                <h2 className="panel-title">Corporate Hiring Partners</h2>
                {(currentUser.role === "company" || currentUser.role === "admin") && (
                  <button className="btn-primary" style={{ width: "auto" }} onClick={() => setShowCompanyModal(true)}>
                    + Register Company
                  </button>
                )}
              </div>

              {companies.length === 0 ? (
                <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>No corporate partners registered yet.</div>
              ) : (
                <div className="data-grid">
                  {companies.map((c) => (
                    <div className="data-card" key={c._id}>
                      <div>
                        <h3 className="card-title">{c.companyName}</h3>
                        <span className="card-subtitle">🏢 {c.location || "Global"}</span>
                        <p className="card-desc" style={{ marginTop: "12px" }}>{c.description}</p>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-color)", paddingTop: "12px", marginTop: "12px" }}>
                        <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{c.email}</span>
                        {c.website && (
                          <a href={c.website} target="_blank" rel="noreferrer" className="auth-link" style={{ marginLeft: 0 }}>
                            Website ↗
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================= APPLICATIONS TAB ================= */}
          {activeTab === "applications" && (
            <div>
              <div className="panel-header">
                <h2 className="panel-title">Submitted Applications</h2>
              </div>

              {(() => {
                // Filter applications based on logged-in student email
                const list = currentUser.role === "student"
                  ? applications.filter((app) => app.studentEmail === currentUser.email)
                  : applications;

                if (list.length === 0) {
                  return <div style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>No applications submitted yet.</div>;
                }

                return (
                  <div className="table-container">
                    <table className="custom-table">
                      <thead>
                        <tr>
                          <th>Job Position</th>
                          <th>Company Name</th>
                          <th>Candidate Name</th>
                          <th>Candidate Email</th>
                          <th>Status Badge</th>
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((app) => (
                          <tr key={app._id}>
                            <td style={{ fontWeight: "600", color: "var(--text-primary)" }}>{app.jobTitle}</td>
                            <td>{app.companyName}</td>
                            <td>{app.studentName}</td>
                            <td>{app.studentEmail}</td>
                            <td>
                              <span className={`badge badge-${app.status ? app.status.toLowerCase() : "applied"}`}>
                                {app.status || "Applied"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })()}
            </div>
          )}
        </main>
      </div>

      {/* ================= POST JOB MODAL ================= */}
      {showJobModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Post a New Job Opportunity</h3>
              <button className="modal-close" onClick={() => setShowJobModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateJob}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Software Engineer"
                    value={jobForm.title}
                    onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Google"
                    value={jobForm.companyName}
                    onChange={(e) => setJobForm({ ...jobForm, companyName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Mountain View, CA or Remote"
                    value={jobForm.location}
                    onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary Package</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. $150,000"
                    value={jobForm.salary}
                    onChange={(e) => setJobForm({ ...jobForm, salary: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Skills Required (Comma-separated)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. React, Node.js, Go"
                    value={jobForm.skillsRequired}
                    onChange={(e) => setJobForm({ ...jobForm, skillsRequired: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Job Description</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    placeholder="Provide details about the job responsibilities and expectations..."
                    value={jobForm.description}
                    onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
                    style={{ resize: "vertical" }}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowJobModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: "auto" }}>Publish Job</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= REGISTER COMPANY MODAL ================= */}
      {showCompanyModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 className="modal-title">Register Partner Company</h3>
              <button className="modal-close" onClick={() => setShowCompanyModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateCompany}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Microsoft"
                    value={companyForm.companyName}
                    onChange={(e) => setCompanyForm({ ...companyForm, companyName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">HR Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="e.g. contact@microsoft.com"
                    value={companyForm.email}
                    onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Corporate Headquarters</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Redmond, WA"
                    value={companyForm.location}
                    onChange={(e) => setCompanyForm({ ...companyForm, location: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Website URL</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="e.g. https://microsoft.com"
                    value={companyForm.website}
                    onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Company Profile Description</label>
                  <textarea
                    className="form-input"
                    rows="4"
                    placeholder="Brief summary of what the company does..."
                    value={companyForm.description}
                    onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                    style={{ resize: "vertical" }}
                    required
                  ></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCompanyModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: "auto" }}>Save Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;