export default function Header({ onNav, currentView }) {
  const navItems = [
    { id: "productos", label: "Productos", icon: "📦" },
    { id: "inventario", label: "Inventario", icon: "🏭" },
    { id: "ordenes", label: "Órdenes", icon: "📋" },
    { id: "reportes", label: "Reportes", icon: "📊" }
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <h1>🧵 Control de Confección</h1>
          <p className="header-subtitle">Sistema Integral de Gestión</p>
        </div>
        <nav className="header-nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNav(item.id)}
              className={`nav-btn ${currentView === item.id ? 'nav-btn-active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
