
import { useEffect, useState } from 'react'
import {
  Activity, Shield, LayoutDashboard, Boxes, Flag,
  BrainCircuit, Settings, ExternalLink, RefreshCw,
  Terminal, Server, Wifi, Clock3
} from 'lucide-react'
import './App.css'

type Container = {
  name: string
  service: string
  state: string
  status: string
  ports: {
    URL: string
    TargetPort: number
    PublishedPort: number
    Protocol: string
  }[]
}

type LabResponse = {
  count: number
  containers: Container[]
}

const API = 'http://127.0.0.1:8000'

const labInfo: Record<string, {
  title: string
  description: string
  url: string
  port: number
}> = {
  'juice-shop': {
    title: 'OWASP Juice Shop',
    description: 'Практика веб-уязвимостей и OWASP Top 10',
    url: 'http://127.0.0.1:3000',
    port: 3000,
  },
  webgoat: {
    title: 'OWASP WebGoat',
    description: 'Интерактивное обучение безопасности веб-приложений',
    url: 'http://127.0.0.1:8080/WebGoat',
    port: 8080,
  },
}

function App() {
  const [data, setData] = useState<LabResponse | null>(null)
  const [apiOnline, setApiOnline] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState('')

  async function loadData() {
    try {
      const [health, labs] = await Promise.all([
        fetch(`${API}/api/health`),
        fetch(`${API}/api/labs`),
      ])

      if (!health.ok || !labs.ok) throw new Error('API error')

      const labData: LabResponse = await labs.json()
      setData(labData)
      setApiOnline(true)
      setLastUpdate(new Date().toLocaleTimeString())
    } catch {
      setApiOnline(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
  const initialTimer = window.setTimeout(() => {
    void loadData()
  }, 0)

  const intervalTimer = window.setInterval(() => {
    void loadData()
  }, 5000)

  return () => {
    window.clearTimeout(initialTimer)
    window.clearInterval(intervalTimer)
  }
}, [])

  const running = data?.containers.filter(
    c => c.state === 'running'
  ).length ?? 0

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon"><Shield size={25} /></div>
          <div>
            <h2>HACK<span>LAB</span></h2>
            <small>CYBERSECURITY PLATFORM</small>
          </div>
        </div>

        <div className="nav-label">WORKSPACE</div>
        <nav>
          <a className="nav-item active"><LayoutDashboard size={18} /> Dashboard</a>
          <a className="nav-item"><Boxes size={18} /> Laboratories</a>
          <a className="nav-item"><Flag size={18} /> CTF Challenges</a>
          <a className="nav-item"><BrainCircuit size={18} /> AI Mentor</a>
        </nav>

        <div className="nav-label tools-label">SYSTEM</div>
        <nav>
          <a className="nav-item"><Terminal size={18} /> Terminal</a>
          <a className="nav-item"><Activity size={18} /> Monitoring</a>
          <a className="nav-item"><Settings size={18} /> Settings</a>
        </nav>

        <div className="sidebar-bottom">
          <div className="local-badge"><span /> LOCAL ENVIRONMENT</div>
          <small>HackLab v0.1.0</small>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div>
            <div className="breadcrumb">WORKSPACE / OVERVIEW</div>
            <h1>Dashboard</h1>
          </div>
          <div className="top-actions">
            <div className={`connection ${apiOnline ? 'online' : 'offline'}`}>
              <span /> API {apiOnline ? 'CONNECTED' : 'OFFLINE'}
            </div>
            <button className="refresh" onClick={loadData} title="Refresh">
              <RefreshCw size={17} />
            </button>
          </div>
        </header>

        <section className="welcome">
          <div>
            <div className="eyebrow">SECURITY TRAINING ENVIRONMENT</div>
            <h2>Welcome to <span>HackLab</span></h2>
            <p>Your local cybersecurity laboratory is ready.</p>
          </div>
          <Shield className="welcome-icon" size={90} />
        </section>

        <section className="stats">
          <div className="stat-card">
            <div className="stat-top"><span>ACTIVE CONTAINERS</span><Boxes /></div>
            <strong>{data ? running.toString().padStart(2, '0') : '--'}</strong>
            <small>Running Docker services</small>
          </div>
          <div className="stat-card">
            <div className="stat-top"><span>AVAILABLE LABS</span><Shield /></div>
            <strong>{data ? data.count.toString().padStart(2, '0') : '--'}</strong>
            <small>Registered containers</small>
          </div>
          <div className="stat-card">
            <div className="stat-top"><span>API STATUS</span><Wifi /></div>
            <strong className={apiOnline ? 'green' : 'red'}>
              {apiOnline ? 'ONLINE' : 'OFFLINE'}
            </strong>
            <small>FastAPI connection</small>
          </div>
        </section>

        <section className="section-heading">
          <div>
            <div className="eyebrow">YOUR ENVIRONMENT</div>
            <h2>Laboratories</h2>
          </div>
          <div className="updated"><Clock3 size={14} /> Updated: {lastUpdate || '—'}</div>
        </section>

        <section className="labs-grid">
          {Object.entries(labInfo).map(([service, info]) => {
            const container = data?.containers.find(c => c.service === service)
            const isRunning = container?.state === 'running'
            const isHealthy = container?.status.toLowerCase().includes('unhealthy') === false

            return (
              <article className="lab-card" key={service}>
                <div className="lab-card-top">
                  <div className="lab-icon"><Shield size={24} /></div>
                  <span className={`status ${isRunning && isHealthy ? 'good' : isRunning ? 'warning' : 'stopped'}`}>
                    <span /> {loading ? 'CHECKING' : !container ? 'NOT FOUND' : !isRunning ? 'STOPPED' : isHealthy ? 'RUNNING' : 'CHECK HEALTH'}
                  </span>
                </div>
                <h3>{info.title}</h3>
                <p>{info.description}</p>
                <div className="lab-meta">
                  <span><Server size={14} /> Docker</span>
                  <span>PORT {info.port}</span>
                </div>
                <div className="lab-footer">
                  <span className="container-name">{container?.name ?? 'Waiting for API...'}</span>
                  <a
                    className={`open-button ${!isRunning ? 'disabled' : ''}`}
                    href={info.url}
                    target="_blank"
                    rel="noreferrer"
                    onClick={e => { if (!isRunning) e.preventDefault() }}
                  >
                    Open <ExternalLink size={14} />
                  </a>
                </div>
              </article>
            )
          })}
        </section>

        <section className="activity-panel">
          <div className="section-heading">
            <div>
              <div className="eyebrow">SYSTEM</div>
              <h2>Environment status</h2>
            </div>
            <Activity size={20} />
          </div>
          <div className="activity-row">
            <span>Docker integration</span>
            <span className={data ? 'green' : 'red'}>{data ? 'CONNECTED' : 'UNAVAILABLE'}</span>
          </div>
          <div className="activity-row">
            <span>API endpoint</span>
            <span>127.0.0.1:8000</span>
          </div>
          <div className="activity-row">
            <span>Auto refresh</span>
            <span>5 seconds</span>
          </div>
        </section>

        <footer>HACKLAB © 2026 <span>BUILT FOR LEARNING · BUILT FOR SECURITY</span></footer>
      </main>
    </div>
  )
}

export default App
