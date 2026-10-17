import { useRef, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { DEMO_USERS, useAuth, type DemoUser } from '../auth'
import { Button } from '../components/Basics'
import { Brand } from '../components/Brand'
import { checklists, metrics } from '../lib/data'
import { inr, pct } from '../lib/format'
import { useApp } from '../state'
import { useTour } from '../tour/Tour'

export function Login() {
  const { user, login } = useAuth()
  const { setStoreId } = useApp()
  const tour = useTour()
  const signedInOnArrival = useRef(!!user).current
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [failed, setFailed] = useState(false)

  if (signedInOnArrival) return <Navigate to="/app" replace />

  const enter = (u: DemoUser) => {
    setStoreId(u.storeLock ?? '14')
    const from = (location.state as { from?: string } | null)?.from
    navigate(from && from.startsWith('/app') ? from : '/app', { replace: true })
    if (u.startsTour) tour.start()
  }

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const u = login(email, password)
    if (u) enter(u)
    else setFailed(true)
  }

  const quick = (d: DemoUser) => {
    setEmail(d.email)
    setPassword(d.password)
    const u = login(d.email, d.password)
    if (u) enter(u)
  }

  return (
    <div className="login">
      <div className="login-main">
        <div className="login-box">
          <Brand />
          <h1 className="display" style={{ marginTop: 48 }}>
            Sign in
          </h1>
          <p className="meta" style={{ marginTop: 4 }}>
            Demo accounts are hard-coded. Nothing leaves your browser.
          </p>

          <form className="login-form" onSubmit={submit} noValidate>
            <label className="field">
              <span className="label">Email</span>
              <input
                className="input mono"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value)
                  setFailed(false)
                }}
                placeholder="name@phantom.demo"
              />
            </label>
            <label className="field">
              <span className="label">Password</span>
              <input
                className="input mono"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setFailed(false)
                }}
              />
            </label>
            {failed && (
              <p className="login-fail" role="alert">
                Those details do not match a demo account. Pick one below.
              </p>
            )}
            <Button variant="primary" type="submit" className="lg block">
              Sign in
            </Button>
          </form>

          <div className="creds">
            <p className="label">Demo accounts — click one to sign in</p>
            {DEMO_USERS.map((d) => (
              <button key={d.email} type="button" className="cred" onClick={() => quick(d)}>
                <span className="cred-top">
                  <strong>{d.name}</strong>
                  {d.startsTour && <span className="tag ok">Guided walkthrough</span>}
                  <span className="cred-go" aria-hidden="true">
                    Sign in →
                  </span>
                </span>
                <span className="meta">{d.scope}</span>
                <span className="cred-kv">
                  <span className="mono">{d.email}</span>
                  <span className="mono ink3">{d.password}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="login-side">
        <span className="chip">Prototype · simulated dataset</span>
        <h2 className="lp-h3" style={{ marginTop: 24 }}>
          What you will see
        </h2>
        <ol className="login-steps">
          <li>
            <span className="mono">01</span>
            <div>
              <strong>Morning check list</strong>
              <p className="ink2">Twenty shelves, ranked by rupees recovered. One click shows why that beats ranking by confidence.</p>
            </div>
          </li>
          <li>
            <span className="mono">02</span>
            <div>
              <strong>Evidence drawer</strong>
              <p className="ink2">Sales against system stock, the silent run, and the four numbers behind every rupee figure.</p>
            </div>
          </li>
          <li>
            <span className="mono">03</span>
            <div>
              <strong>Aisle walk plan</strong>
              <p className="ink2">The same checks grouped by aisle, ready to print and carry.</p>
            </div>
          </li>
          <li>
            <span className="mono">04</span>
            <div>
              <strong>Method and impact</strong>
              <p className="ink2">The formula, a worked example, the fixed-rule comparison and an annual rupee calculator.</p>
            </div>
          </li>
        </ol>
        <dl className="login-figs">
          <div>
            <dt className="mono">{pct(metrics.precisionAt20)}</dt>
            <dd className="meta">precision@20 across 25 stores</dd>
          </div>
          <div>
            <dt className="mono">{inr(checklists['14'].dropped)}</dt>
            <dd className="meta">Store 14 value a confidence ranking misses</dd>
          </div>
        </dl>
        <Link to="/" className="login-back">
          ← Back to overview
        </Link>
      </aside>
    </div>
  )
}
