import { Link, Outlet, useRouterState } from '@tanstack/react-router'

function navItems() {
  return [
    { to: '/', label: 'Home' },
    { to: '/events', label: 'Events' },
    { to: '/orders', label: 'My Orders' },
    { to: '/organizer', label: 'Organizer' },
  ] as const
}

export function AppShell() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })

  return (
    <div className="shell">
      <header className="shell-header">
        <Link aria-label="Go to homepage" className="shell-brand" to="/">
          <p className="eyebrow">Live Events And Workshops</p>
          <h1 className="shell-title">Eventku</h1>
        </Link>
        <nav className="shell-nav" aria-label="Primary navigation">
          {navItems().map((item) => {
            const isActive =
              item.to === '/'
                ? pathname === '/'
                : pathname.startsWith(item.to)

            return (
              <Link
                key={item.to}
                className={isActive ? 'shell-nav-link shell-nav-link-active' : 'shell-nav-link'}
                to={item.to}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </header>
      <main className="shell-main">
        <Outlet />
      </main>
    </div>
  )
}
