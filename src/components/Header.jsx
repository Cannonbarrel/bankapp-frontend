function Header({ currentPage, onNavigate, onLogout, isAdmin }) {
  const pages = ['home', 'about', 'contact', 'services']

  return (
    <header className="site-header card">
      <div className="brand-wrap">
        <span className="brand-mark" aria-hidden="true">LOL</span>
        <div>
          <p className="brand-eyebrow">TopFloorBoss Bank</p>
          <p className="brand-title">Money Making Dashboard</p>
        </div>
      </div>
      <nav aria-label="Primary" className="header-nav">
        {pages.map((page) => (
          <button
            key={page}
            type="button"
            className="nav-link nav-btn"
            aria-current={currentPage === page ? 'page' : undefined}
            onClick={() => onNavigate(page)}
          >
            {page.charAt(0).toUpperCase() + page.slice(1)}
          </button>
        ))}
        {isAdmin ? (
          <button
            type="button"
            className="nav-link nav-btn"
            onClick={onLogout}
          >
            Logout
          </button>
        ) : (
          <button
            type="button"
            className="nav-link nav-btn"
            aria-current={currentPage === 'login' ? 'page' : undefined}
            onClick={() => onNavigate('login')}
          >
            Login
          </button>
        )}
      </nav>
    </header>
  )
}

export default Header
