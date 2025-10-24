import { useEffect, useState } from "react"
import { api } from "../api"

export default function OrdenesView(){
  const [rows, setRows] = useState([])
  const [estado, setEstado] = useState("APROBADA")
  const load = async () => {
    const { data } = await api.get("/ordenes")
    setRows(data.rows || [])
  }
  const actualizar = async (id) => {
    await api.put(`/ordenes/${id}`, { estado })
    load()
  }
  useEffect(()=>{ load() }, [])
  return (
    <div className="card">
      <h3>Órdenes</h3>
      <div style={{display:'flex', gap:'.5rem', marginBottom:'.8rem'}}>
        <label>Nuevo estado:</label>
        <select value={estado} onChange={e=>setEstado(e.target.value)}>
          <option>PENDIENTE</option>
          <option>APROBADA</option>
          <option>CANCELADA</option>
        </select>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Cliente</th><th>Estado</th><th>Items</th><th>Acciones</th></tr></thead>
        <tbody>
          {rows.map(o=>(
            <tr key={o.ID_ORDEN}>
              <td>{o.ID_ORDEN}</td>
              <td>{o.CLIENTE}</td>
              <td>{o.ESTADO}</td>
              <td>{o.TOTAL_ITEMS}</td>
              <td><button onClick={()=>actualizar(o.ID_ORDEN)}>Cambiar estado</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
