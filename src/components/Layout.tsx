import { NavLink, Outlet } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Inbox', icon: '📥', end: true },
  { to: '/lists', label: 'Lists', icon: '🗂️', end: false },
  { to: '/settings', label: 'Settings', icon: '⚙️', end: false },
]

export default function Layout() {
  return (
    <div className="app-shell">
      <main className="content">
        <Outlet />
      </main>
      <nav className="tabbar">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) => 'tab' + (isActive ? ' tab--active' : '')}
          >
            <span className="tab__icon">{t.icon}</span>
            <span className="tab__label">{t.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
