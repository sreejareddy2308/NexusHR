import { useState } from 'react'
import './AdminSettings.css'

interface AdminSettingsData {
  companyName: string
  email: string
  timezone: string
  notifications: boolean
  leaveAlerts: boolean
  payrollAlerts: boolean
}

const defaultSettings: AdminSettingsData = {
  companyName: 'NexusHR',
  email: '',
  timezone: 'Asia/Kolkata',
  notifications: true,
  leaveAlerts: true,
  payrollAlerts: true,
}

function loadSettings(): AdminSettingsData {
  try {
    const saved = localStorage.getItem('nexushr_admin_settings')

    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings
  } catch {
    return defaultSettings
  }
}

function AdminSettings() {
  const [settings, setSettings] =
    useState<AdminSettingsData>(loadSettings)

  const [savedMessage, setSavedMessage] = useState('')

  const updateSetting = <K extends keyof AdminSettingsData>(
    key: K,
    value: AdminSettingsData[K]
  ) => {
    setSettings(previous => ({
      ...previous,
      [key]: value,
    }))
    setSavedMessage('')
  }

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    localStorage.setItem(
      'nexushr_admin_settings',
      JSON.stringify(settings)
    )

    setSavedMessage('Your settings have been saved successfully.')
  }

  return (
    <div className="admin-settings">

      {/* PAGE HEADER */}
      <div className="settings-page-header">
        <div>
          <span className="settings-eyebrow">
            ADMINISTRATION
          </span>

          <h1>Settings</h1>

          <p>
            Manage your organization and application preferences.
          </p>
        </div>

        <div className="settings-header-icon">
          <span>⚙</span>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <div className="settings-layout">

          <div className="settings-main">

            {/* COMPANY PROFILE */}
            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-icon">🏢</div>

                <div>
                  <h2>Company Profile</h2>
                  <p>
                    Manage your organization's basic information.
                  </p>
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-form-grid">

                <div className="settings-field">
                  <label htmlFor="companyName">
                    Company Name
                  </label>

                  <input
                    id="companyName"
                    type="text"
                    value={settings.companyName}
                    onChange={e =>
                      updateSetting('companyName', e.target.value)
                    }
                    placeholder="Enter company name"
                    required
                  />
                </div>

                <div className="settings-field">
                  <label htmlFor="adminEmail">
                    Administrator Email
                  </label>

                  <input
                    id="adminEmail"
                    type="email"
                    value={settings.email}
                    onChange={e =>
                      updateSetting('email', e.target.value)
                    }
                    placeholder="admin@company.com"
                  />
                </div>

              </div>
            </section>

            {/* REGIONAL SETTINGS */}
            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-icon">🌐</div>

                <div>
                  <h2>Regional Preferences</h2>
                  <p>
                    Configure your preferred regional settings.
                  </p>
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-field">
                <label htmlFor="timezone">
                  Time Zone
                </label>

                <select
                  id="timezone"
                  value={settings.timezone}
                  onChange={e =>
                    updateSetting('timezone', e.target.value)
                  }
                >
                  <option value="Asia/Kolkata">
                    India Standard Time (IST)
                  </option>

                  <option value="UTC">
                    Coordinated Universal Time (UTC)
                  </option>

                  <option value="America/New_York">
                    Eastern Time (New York)
                  </option>

                  <option value="Europe/London">
                    Greenwich Mean Time (London)
                  </option>
                </select>

                <small>
                  Select the time zone used for your organization.
                </small>
              </div>
            </section>

            {/* NOTIFICATION SETTINGS */}
            <section className="settings-card">
              <div className="settings-card-header">
                <div className="settings-icon">🔔</div>

                <div>
                  <h2>Notification Preferences</h2>
                  <p>
                    Control the alerts you want to receive.
                  </p>
                </div>
              </div>

              <div className="settings-divider" />

              <div className="settings-option">
                <div>
                  <h3>Admin Notifications</h3>
                  <p>
                    Enable or disable all admin notifications.
                  </p>
                </div>

                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={e =>
                      updateSetting(
                        'notifications',
                        e.target.checked
                      )
                    }
                  />

                  <span className="settings-slider" />
                </label>
              </div>

              <div className="settings-option">
                <div>
                  <h3>Leave Request Alerts</h3>
                  <p>
                    Receive notifications about employee leave requests.
                  </p>
                </div>

                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.leaveAlerts}
                    disabled={!settings.notifications}
                    onChange={e =>
                      updateSetting(
                        'leaveAlerts',
                        e.target.checked
                      )
                    }
                  />

                  <span className="settings-slider" />
                </label>
              </div>

              <div className="settings-option">
                <div>
                  <h3>Payroll Alerts</h3>
                  <p>
                    Receive notifications about payroll activities.
                  </p>
                </div>

                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={settings.payrollAlerts}
                    disabled={!settings.notifications}
                    onChange={e =>
                      updateSetting(
                        'payrollAlerts',
                        e.target.checked
                      )
                    }
                  />

                  <span className="settings-slider" />
                </label>
              </div>
            </section>

          </div>

          {/* INFORMATION SIDEBAR */}
          <aside className="settings-sidebar">

            <div className="settings-info-card">
              <div className="settings-info-icon">🛡️</div>

              <h3>Account Preferences</h3>

              <p>
                Manage your organization preferences from one place.
                Changes made here are saved in this browser.
              </p>
            </div>

            <div className="settings-info-card settings-help-card">
              <h3>Need Assistance?</h3>

              <p>
                Review your settings carefully before saving
                your changes.
              </p>
            </div>

          </aside>

        </div>

        {/* SAVE FOOTER */}
        <div className="settings-footer">

          <div
            className="settings-save-message"
            role="status"
          >
            {savedMessage && (
              <span>✓ {savedMessage}</span>
            )}
          </div>

          <button
            type="submit"
            className="settings-save-button"
          >
            Save Changes
          </button>

        </div>
      </form>
    </div>
  )
}

export default AdminSettings


