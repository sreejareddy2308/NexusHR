import { useEffect, useState } from 'react'
import './AIInsights.css'

interface AIInsightsData {
  totalEmployees: number
  activeEmployees: number
  inactiveEmployees: number
  employeesByDepartment: Record<string, number>
  employeesByJobTitle: Record<string, number>
  recommendations: string[]
  predictionStatus: string
  averageTenureYears: number
  employeesByTenure: Record<string, number>
}

export default function AIInsights() {
  const [data, setData] = useState<AIInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        setLoading(true)
        setError('')

        const token = sessionStorage.getItem('nexushr_token')

        if (!token) {
          throw new Error('Authentication token not found. Please log in again.')
        }

        const response = await fetch(
          '/api/ai-insights/dashboard',
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.')
        }

        if (response.status === 403) {
          throw new Error('You do not have permission to access AI Insights.')
        }

        if (!response.ok) {
          throw new Error(`Failed to load AI Insights: HTTP ${response.status}`)
        }

        const result: AIInsightsData = await response.json()

        setData(result)
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Unable to load AI Insights.'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [])

  if (loading) {
    return (
      <div className="ai-insights">
        <div className="ai-message">
          <div className="ai-loader"></div>
          <p>Loading AI Workforce Insights...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="ai-insights">
        <div className="ai-error">
          <h3>Unable to Load AI Insights</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const getPercentage = (value: number) => {
    if (data.totalEmployees === 0) return 0

    return Math.round(
      (value / data.totalEmployees) * 100
    )
  }

  return (
    <div className="ai-insights">

      {/* Header */}

      <div className="ai-header">
        <div>
          <h2>AI Workforce Insights</h2>
          <p>
            Welcome to NexusHR AI-powered workforce intelligence.
          </p>
        </div>

        <span className="ai-status">
          ● Live Workforce Analytics
        </span>
      </div>

      {/* Workforce Overview */}

      <section className="workforce-overview">

        <h3>Workforce Overview</h3>

        <div className="overview-grid">

          <div className="overview-card">
            <span className="overview-icon">👥</span>
            <p>Total Employees</p>
            <h2>{data.totalEmployees}</h2>
          </div>

          <div className="overview-card">
            <span className="overview-icon">✅</span>
            <p>Active Employees</p>
            <h2>{data.activeEmployees}</h2>
          </div>

          <div className="overview-card">
            <span className="overview-icon">⏸️</span>
            <p>Inactive Employees</p>
            <h2>{data.inactiveEmployees}</h2>
          </div>

          <div className="overview-card">
            <span className="overview-icon">📅</span>
            <p>Average Tenure</p>
            <h2>{data.averageTenureYears.toFixed(1)}</h2>
            <small>Years</small>
          </div>

        </div>
      </section>

      {/* AI Feature Cards */}

      <div className="insights-grid">

        <div className="insight-card">
          <div className="card-icon attrition-icon">
            📉
          </div>

          <h3>Employee Attrition</h3>

          <p>
            Analyze employee turnover trends and identify
            potential employee retention risks.
          </p>

          <span className="coming-soon">
            Predictive Model Pending
          </span>
        </div>

        <div className="insight-card">
          <div className="card-icon workforce-icon">
            📊
          </div>

          <h3>Workforce Analytics</h3>

          <p>
            Monitor workforce performance, employee
            distribution and organizational trends.
          </p>

          <span className="feature-active">
            Live Analytics Available
          </span>
        </div>

        <div className="insight-card">
          <div className="card-icon skills-icon">
            🎯
          </div>

          <h3>Skill Gap Analysis</h3>

          <p>
            Identify employee skill gaps and discover
            suitable learning and development opportunities.
          </p>

          <span className="coming-soon">
            Coming Soon
          </span>
        </div>

      </div>

      {/* Department Analytics */}

      <section className="analytics-section">

        <h3>Department-wise Distribution</h3>

        <div className="analytics-card">

          {Object.entries(data.employeesByDepartment).map(
            ([department, count]) => (

              <div className="chart-row" key={department}>
                <div className="chart-label">
                  <strong>{department}</strong>
                  <span>{count} employees</span>
                </div>

                <div className="chart-track">
                  <div
                    className="chart-fill department-fill"
                    style={{
                      width: `${getPercentage(count)}%`,
                    }}
                  />
                </div>
              </div>

            )
          )}

          {Object.keys(data.employeesByDepartment).length === 0 && (
            <p>No department data available.</p>
          )}

        </div>
      </section>

      {/* Job Title Analytics */}

      <section className="analytics-section">

        <h3>Job Title Distribution</h3>

        <div className="analytics-card">

          {Object.entries(data.employeesByJobTitle).map(
            ([jobTitle, count]) => (

              <div className="chart-row" key={jobTitle}>
                <div className="chart-label">
                  <strong>{jobTitle}</strong>
                  <span>{count}</span>
                </div>

                <div className="chart-track">
                  <div
                    className="chart-fill job-fill"
                    style={{
                      width: `${getPercentage(count)}%`,
                    }}
                  />
                </div>
              </div>

            )
          )}

          {Object.keys(data.employeesByJobTitle).length === 0 && (
            <p>No job title data available.</p>
          )}

        </div>
      </section>

      {/* Tenure Analytics */}

      <section className="analytics-section">

        <h3>Employee Tenure Analysis</h3>

        <div className="analytics-card">

          {Object.entries(data.employeesByTenure).map(
            ([tenure, count]) => (

              <div className="chart-row" key={tenure}>
                <div className="chart-label">
                  <strong>{tenure}</strong>
                  <span>{count} employees</span>
                </div>

                <div className="chart-track">
                  <div
                    className="chart-fill tenure-fill"
                    style={{
                      width: `${getPercentage(count)}%`,
                    }}
                  />
                </div>
              </div>

            )
          )}

          {Object.keys(data.employeesByTenure).length === 0 && (
            <p>No tenure data available.</p>
          )}

        </div>
      </section>

      {/* AI Recommendations */}

      <section className="analytics-section">

        <div className="recommendations-card">

          <div className="recommendations-heading">
            <div className="card-icon recommendations-icon">
              🤖
            </div>

            <div>
              <h3>AI Workforce Recommendations</h3>
              <p>
                Insights generated from current workforce data.
              </p>
            </div>
          </div>

          {data.recommendations.length > 0 ? (

            <div className="recommendation-list">

              {data.recommendations.map((recommendation, index) => (

                <div
                  className="recommendation-item"
                  key={index}
                >
                  <span className="recommendation-number">
                    {index + 1}
                  </span>

                  <p>{recommendation}</p>
                </div>

              ))}

            </div>

          ) : (
            <p>No workforce recommendations currently available.</p>
          )}

        </div>
      </section>

      {/* Predictive AI Status */}

      <section className="analytics-section">

        <div className="prediction-card">

          <h3>Predictive AI Model Status</h3>

          <span className="prediction-pending">
            Model Not Connected
          </span>

          <p>{data.predictionStatus}</p>

          <small>
            Predictive results will be displayed after
            connecting and validating the AI model.
          </small>

        </div>
      </section>

    </div>
  )
}
