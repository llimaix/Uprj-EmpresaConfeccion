export default function Header({ onNav }) {
  return (
    <header className="card" style={{ display: "flex", justifyContent: "space-between" }}>
      <h2>Control de Confección</h2>
      <nav style={{ display: "flex", gap: "1rem" }}>
        <button onClick={() => onNav("productos")}>Productos</button>
        <button onClick={() => onNav("inventario")}>Inventario</button>
        <button onClick={() => onNav("ordenes")}>Órdenes</button>
      </nav>
    </header>
  );
}
