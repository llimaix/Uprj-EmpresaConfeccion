export default function InventarioTable({ data }) {
  if (!data || data.length === 0)
    return <p style={{ textAlign: "center" }}>No hay registros de inventario</p>;

  return (
    <table>
      <thead>
        <tr>
          <th>Instalación</th>
          <th>Producto</th>
          <th>Tipo</th>
          <th>Cantidad</th>
        </tr>
      </thead>
      <tbody>
        {data.map((item, idx) => (
          <tr key={idx}>
            <td>{item.INSTALACION || item.instalacion}</td>
            <td>{item.PRODUCTO || item.producto}</td>
            <td>{item.TIPO || item.tipo}</td>
            <td>{item.CANTIDAD || item.cantidad}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
