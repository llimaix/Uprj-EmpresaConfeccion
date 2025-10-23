export default function ProductosTable({ productos=[] }){
  return (
    <div className="card">
      <h2 style={{marginTop:0}}>Inventario / Productos</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th><th>Nombre</th><th>Tipo</th>
          </tr>
        </thead>
        <tbody>
          {productos.map(p=>(
            <tr key={p.ID_PRODUCTO}>
              <td>{p.ID_PRODUCTO}</td>
              <td>{p.NOMBRE}</td>
              <td>{p.TIPO}</td>
            </tr>
          ))}
          {!productos.length && (
            <tr><td colSpan={3}>Sin datos</td></tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
