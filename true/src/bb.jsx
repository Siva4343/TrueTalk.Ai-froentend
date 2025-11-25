import React, { useState, useEffect } from "react";
import "./ang.css";

// API base URL - adjust this to your Django server URL
const API_BASE_URL = "http://localhost:8000/api";

// Job List Component
const JobList = ({ onJobSelect }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch jobs from backend
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/jobs/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setJobs(data);
    } catch (err) {
      setError("Failed to load jobs. Please try again later.");
      console.error("Error fetching jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (loading) {
    return (
      <div className="job-list">
        <h2 className="section-title">Available Jobs</h2>
        <div className="loading">Loading jobs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="job-list">
        <h2 className="section-title">Available Jobs</h2>
        <div className="error">{error}</div>
        <button onClick={fetchJobs} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="job-list">
      <h2 className="section-title">Available Jobs</h2>
      <div className="jobs-grid">
        {jobs.map(job => (
          <div key={job.id} className="job-card" onClick={() => onJobSelect(job)}>
            <div className="job-header">
              <h3 className="job-title">{job.title}</h3>
              <span className="company-name">{job.company}</span>
            </div>
            <div className="job-details">
              <div className="detail-item">
                <span className="icon">📍</span>
                <span>{job.location}</span>
              </div>
              <div className="detail-item">
                <span className="icon">💰</span>
                <span>${job.salary}</span>
              </div>
              <div className="detail-item">
                <span className="icon">⚡</span>
                <span>{job.get_employment_type_display || job.employment_type}</span>
              </div>
            </div>
            <p className="job-description">{job.description}</p>
            <button className="apply-btn">Apply Now</button>
          </div>
        ))}
      </div>
    </div>
  );
};

// Job Apply Component
const JobApply = ({ job, onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    resume: null,
    cover_letter: "",
    experience_years: "",
    expected_salary: "",
    portfolio_link: "",
    linkedin_profile: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('job', job.id);
      submitData.append('cover_letter', formData.cover_letter);
      submitData.append('resume', formData.resume);
      submitData.append('phone', formData.phone);
      submitData.append('experience_years', formData.experience_years);
      submitData.append('expected_salary', formData.expected_salary);
      submitData.append('portfolio_link', formData.portfolio_link);
      submitData.append('linkedin_profile', formData.linkedin_profile);

      const response = await fetch(`${API_BASE_URL}/jobs/apply/`, {
        method: 'POST',
        body: submitData,
        // Don't set Content-Type header for FormData - browser will set it automatically with boundary
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit application');
      }

      const result = await response.json();
      console.log('Application submitted:', result);
      onSuccess();
      
    } catch (err) {
      setError(err.message);
      console.error('Error submitting application:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.files[0]
    });
  };

  return (
    <div className="job-apply">
      <div className="apply-header">
        <h2>Apply for {job.title}</h2>
        <p className="company-name">{job.company} • {job.location}</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="application-form">
        <div className="form-group">
          <label htmlFor="name">Full Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="email">Email Address *</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="phone">Phone Number *</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="experience_years">Years of Experience</label>
          <input
            type="number"
            id="experience_years"
            name="experience_years"
            value={formData.experience_years}
            onChange={handleChange}
            min="0"
            max="50"
          />
        </div>

        <div className="form-group">
          <label htmlFor="expected_salary">Expected Salary ($)</label>
          <input
            type="number"
            id="expected_salary"
            name="expected_salary"
            value={formData.expected_salary}
            onChange={handleChange}
            min="0"
          />
        </div>

        <div className="form-group">
          <label htmlFor="portfolio_link">Portfolio Link</label>
          <input
            type="url"
            id="portfolio_link"
            name="portfolio_link"
            value={formData.portfolio_link}
            onChange={handleChange}
            placeholder="https://"
          />
        </div>

        <div className="form-group">
          <label htmlFor="linkedin_profile">LinkedIn Profile</label>
          <input
            type="url"
            id="linkedin_profile"
            name="linkedin_profile"
            value={formData.linkedin_profile}
            onChange={handleChange}
            placeholder="https://linkedin.com/in/yourprofile"
          />
        </div>

        <div className="form-group">
          <label htmlFor="resume">Upload Resume *</label>
          <input
            type="file"
            id="resume"
            name="resume"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="cover_letter">Cover Letter</label>
          <textarea
            id="cover_letter"
            name="cover_letter"
            value={formData.cover_letter}
            onChange={handleChange}
            rows="5"
            placeholder="Tell us why you're a good fit for this position..."
          ></textarea>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="cancel-btn"
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Application List Component
const ApplicationList = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/jobs/applications/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setApplications(data);
    } catch (err) {
      setError("Failed to load applications. Please try again later.");
      console.error("Error fetching applications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'SELECTED': return 'status-approved';
      case 'REJECTED': return 'status-rejected';
      case 'REVIEWED': return 'status-reviewed';
      default: return 'status-pending';
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'PENDING': 'Pending',
      'REVIEWED': 'Reviewed',
      'REJECTED': 'Rejected',
      'SELECTED': 'Selected'
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="application-list">
        <h2 className="section-title">My Applications</h2>
        <div className="loading">Loading applications...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="application-list">
        <h2 className="section-title">My Applications</h2>
        <div className="error">{error}</div>
        <button onClick={fetchApplications} className="retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="application-list">
      <h2 className="section-title">My Applications</h2>
      
      {applications.length === 0 ? (
        <div className="empty-state">
          <p>No applications submitted yet.</p>
          <p>Browse jobs and apply to see your applications here.</p>
        </div>
      ) : (
        <div className="applications-grid">
          {applications.map(app => (
            <div key={app.id} className="application-card">
              <div className="app-header">
                <h3 className="job-title">{app.job_title || `Job #${app.job}`}</h3>
                <span className={`status-badge ${getStatusColor(app.status)}`}>
                  {getStatusDisplay(app.status)}
                </span>
              </div>
              
              <div className="application-details">
                <div className="detail-row">
                  <span className="label">Applied on:</span>
                  <span>{new Date(app.applied_date).toLocaleDateString()}</span>
                </div>
                <div className="detail-row">
                  <span className="label">Phone:</span>
                  <span>{app.phone || 'Not provided'}</span>
                </div>
                {app.experience_years && (
                  <div className="detail-row">
                    <span className="label">Experience:</span>
                    <span>{app.experience_years} years</span>
                  </div>
                )}
                {app.expected_salary && (
                  <div className="detail-row">
                    <span className="label">Expected Salary:</span>
                    <span>${app.expected_salary}</span>
                  </div>
                )}
              </div>

              {app.cover_letter && (
                <div className="cover-letter">
                  <strong>Cover Letter:</strong>
                  <p>{app.cover_letter}</p>
                </div>
              )}

              {app.notes && (
                <div className="admin-notes">
                  <strong>Admin Notes:</strong>
                  <p>{app.notes}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Post Job Component
const PostJob = ({ onCancel, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    company: "",
    location: "",
    salary: "",
    description: "",
    employment_type: "FT",
    experience_level: "EN"
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/jobs/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          salary: formData.salary ? parseFloat(formData.salary.replace(/[^0-9.-]+/g, "")) : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to post job');
      }

      const result = await response.json();
      console.log("Job posted successfully:", result);
      alert("Job posted successfully!");
      onSuccess();
      
    } catch (err) {
      setError(err.message);
      console.error("Error posting job:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="post-job">
      <div className="post-job-header">
        <h2>Post a New Job</h2>
        <p>Fill in the details below to post a new job opening</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="post-job-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="title">Job Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g. Frontend Developer"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="company">Company Name *</label>
            <input
              type="text"
              id="company"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. Tech Corp"
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="location">Location *</label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. Remote, New York, NY"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="salary">Salary</label>
            <input
              type="text"
              id="salary"
              name="salary"
              value={formData.salary}
              onChange={handleChange}
              placeholder="e.g. 70000.00"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="employment_type">Employment Type</label>
            <select
              id="employment_type"
              name="employment_type"
              value={formData.employment_type}
              onChange={handleChange}
            >
              <option value="FT">Full-Time</option>
              <option value="PT">Part-Time</option>
              <option value="CT">Contract</option>
              <option value="IN">Internship</option>
              <option value="TM">Temporary</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="experience_level">Experience Level</label>
            <select
              id="experience_level"
              name="experience_level"
              value={formData.experience_level}
              onChange={handleChange}
            >
              <option value="EN">Entry Level</option>
              <option value="MI">Mid Level</option>
              <option value="SE">Senior Level</option>
              <option value="EX">Executive</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="description">Job Description *</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            placeholder="Describe the job responsibilities and requirements..."
            required
          ></textarea>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            className="cancel-btn"
            disabled={submitting}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="submit-btn"
            disabled={submitting}
          >
            {submitting ? 'Posting...' : 'Post Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Main App Component
export default function App() {
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplications, setShowApplications] = useState(false);
  const [showPostJob, setShowPostJob] = useState(false);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="header-top">
          <h1 className="app-title">Job Portal</h1>
          <button 
            className="post-job-btn"
            onClick={() => setShowPostJob(true)}
          >
            📝 Post Job
          </button>
        </div>

        <div className="header-actions">
          <button
            onClick={() => {
              setShowApplications(false);
              setSelectedJob(null);
              setShowPostJob(false);
            }}
            className={`nav-btn ${!showApplications && !showPostJob ? 'nav-btn-active' : ''}`}
          >
            Browse Jobs
          </button>

          <button
            onClick={() => {
              setShowApplications(true);
              setSelectedJob(null);
              setShowPostJob(false);
            }}
            className={`nav-btn ${showApplications ? 'nav-btn-active' : ''}`}
          >
            My Applications
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="app-content">
        {/* Show Post Job Page */}
        {showPostJob ? (
          <PostJob
            onCancel={() => setShowPostJob(false)}
            onSuccess={() => setShowPostJob(false)}
          />
        ) : /* Show Job Apply Page */
        selectedJob && !showApplications ? (
          <JobApply
            job={selectedJob}
            onCancel={() => setSelectedJob(null)}
            onSuccess={() => {
              setSelectedJob(null);
              setShowApplications(true);
            }}
          />
        ) : !showApplications ? (
          /* Show Job List */
          <JobList onJobSelect={(job) => setSelectedJob(job)} />
        ) : (
          /* Show Application List */
          <ApplicationList />
        )}
      </div>
    </div>
  );
};