import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Symptom Checker', to: '/symptom-checker' },
  { label: 'Features', to: '/features' },
  { label: 'How to Use', to: '/how-to-use' },
  { label: 'About Project', to: '/about' },
  { label: 'Team', to: '/team' },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)

  const closeMenu = () => setMenuOpen(false)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'rgba(2, 6, 23, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '14px 20px',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        <div className="navbar-shell">
          <Link
            to="/"
            onClick={closeMenu}
            style={{
              color: 'white',
              textDecoration: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              minWidth: 0,
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: '17px',
                lineHeight: 1.2,
              }}
            >
              Smart Preventive
            </span>
            <span
              style={{
                color: '#7dd3fc',
                fontWeight: 600,
                fontSize: '13px',
                lineHeight: 1.2,
              }}
            >
              Healthcare System
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            aria-controls="primary-navigation"
            className="navbar-menu-button"
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>

          <nav
            aria-label="Primary Navigation"
            id="primary-navigation"
            className={`navbar-links ${menuOpen ? 'open' : ''}`}
          >
            <ul className="navbar-list">
              {navItems.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    onClick={closeMenu}
                    className={({ isActive }) =>
                      `navbar-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      <style>{`
        .navbar-shell {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          width: 100%;
        }

        .navbar-menu-button {
          display: none;
          background: transparent;
          border: 1px solid rgba(148, 163, 184, 0.2);
          color: white;
          border-radius: 10px;
          padding: 10px 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
        }

        .navbar-links {
          display: block;
          flex: 1;
        }

        .navbar-list {
          list-style: none;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin: 0;
          padding: 0;
          align-items: center;
          flex-wrap: wrap;
        }

        .navbar-link {
          color: #cbd5e1;
          text-decoration: none;
          font-weight: 500;
          padding: 10px 12px;
          border-radius: 10px;
          background-color: transparent;
          border: 1px solid transparent;
          display: inline-block;
          transition: all 0.2s ease;
          white-space: nowrap;
        }

        .navbar-link:hover {
          color: #67e8f9 !important;
          background: rgba(34, 211, 238, 0.08) !important;
        }

        .navbar-link.active {
          color: #67e8f9 !important;
          font-weight: 700;
          background-color: rgba(34, 211, 238, 0.12);
          border: 1px solid rgba(34, 211, 238, 0.18);
        }

        .navbar-link:focus-visible,
        .navbar-menu-button:focus-visible {
          outline: 2px solid #22d3ee;
          outline-offset: 2px;
        }

        @media (max-width: 960px) {
          .navbar-shell {
            flex-wrap: wrap;
          }

          .navbar-menu-button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-left: auto;
          }

          .navbar-links {
            display: none;
            width: 100%;
            margin-top: 14px;
          }

          .navbar-links.open {
            display: block;
          }

          .navbar-list {
            flex-direction: column;
            align-items: stretch;
            justify-content: flex-start;
            gap: 8px;
            padding-top: 8px;
          }

          .navbar-links li,
          .navbar-link {
            width: 100%;
          }

          .navbar-link {
            display: block;
            padding: 12px 14px;
            background: rgba(15, 23, 42, 0.92);
            border: 1px solid rgba(148, 163, 184, 0.12);
            box-sizing: border-box;
          }

          .navbar-link.active {
            background: rgba(34, 211, 238, 0.12);
            border: 1px solid rgba(34, 211, 238, 0.18);
          }
        }

        @media (min-width: 961px) {
          .navbar-links {
            display: block !important;
          }
        }
      `}</style>
    </header>
  )
}