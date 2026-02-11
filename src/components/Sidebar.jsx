import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ isCollapsed, onToggle }) {
  const location = useLocation()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const menuItems = [
    { path: '/', icon: '📊', label: 'Tableau de bord' },
    { path: '/create', icon: '✏️', label: 'Nouvelle facture' },
    { path: '/clients', icon: '👥', label: 'Clients' },
    { path: '/stock', icon: '📦', label: 'Stock' },
    { path: '/settings', icon: '⚙️', label: 'Paramètres' },
  ]

  const handleLinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsMobileOpen(false)
    }
  }

  const sidebarClasses = `sidebar ${isCollapsed ? 'sidebar--collapsed' : ''} ${
    isMobileOpen ? 'sidebar--open' : ''
  }`

  return (
    <>
      {/* Overlay mobile */}
      {isMobileOpen && (
        <div
          className="sidebar__overlay sidebar__overlay--active"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={sidebarClasses}>
        {/* Header */}
        <div className="sidebar__header">
          <div className="sidebar__brand">📋 MG-Inventory</div>
          <button
            className="sidebar__toggle"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            {isCollapsed ? '☰' : '✕'}
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          <ul className="sidebar__menu">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path
              const linkClasses = `sidebar__link ${
                isActive ? 'sidebar__link--active' : ''
              }`

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={linkClasses}
                    onClick={handleLinkClick}
                  >
                    <span className="sidebar__link-icon">{item.icon}</span>
                    <span className="sidebar__link-text">{item.label}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        {!isCollapsed && (
          <div className="sidebar__footer">
            <p>© 2026 MG-Inventory</p>
            <p className="u-text-sm u-text-secondary">v2.0.0</p>
          </div>
        )}
      </aside>

      {/* Bouton ouvrir sidebar mobile */}
      {!isMobileOpen && window.innerWidth <= 768 && (
        <button
          className="btn btn--primary btn--icon"
          onClick={() => setIsMobileOpen(true)}
          style={{
            position: 'fixed',
            top: '20px',
            left: '20px',
            zIndex: 999,
          }}
          aria-label="Open menu"
        >
          ☰
        </button>
      )}
    </>
  )
}
