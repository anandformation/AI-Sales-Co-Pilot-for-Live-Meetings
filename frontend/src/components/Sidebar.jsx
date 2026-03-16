import { NavLink } from 'react-router-dom'

function Sidebar() {
  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      position: 'fixed',
      left: 0,
      top: 0,
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 100
    }}>
      {/* Logo */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '40px',
        paddingLeft: '8px'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          background: 'linear-gradient(135deg, var(--accent-primary), #8b5cf6)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '1.2rem',
          boxShadow: '0 2px 8px var(--accent-glow)',
          color: 'white'
        }}>
          🧠
        </div>
        <div>
          <h1 style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}>
            MeetGenius
          </h1>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            AI Sales Coach
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
        <SidebarLink to="/" icon="📊" label="Dashboard" />
        <SidebarLink to="/new" icon="➕" label="New Meeting" />
        <SidebarLink to="/history" icon="📚" label="History" />
      </nav>

      {/* Bottom section */}
      <div style={{
        padding: '16px',
        background: 'rgba(99, 102, 241, 0.05)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid rgba(99, 102, 241, 0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span style={{ fontSize: '0.85rem' }}>✨</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-primary)' }}>SPIN Selling AI</span>
        </div>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
          Real-time sales coaching powered by Gemini AI
        </p>
      </div>
    </aside>
  )
}

function SidebarLink({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        borderRadius: 'var(--radius-md)',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
        background: isActive ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
        border: isActive ? '1px solid rgba(99, 102, 241, 0.15)' : '1px solid transparent',
        transition: 'all var(--transition-base)',
        textDecoration: 'none'
      })}
    >
      <span style={{ fontSize: '1.1rem' }}>{icon}</span>
      {label}
    </NavLink>
  )
}

export default Sidebar
