import { useEffect, useState } from "react"
import { api } from "../api"

export default function InventarioView(){
  const [rows, setRows] = useState([])
  const [form, setForm] = useState({ id_instalacion: "", id_producto: "", delta: "", motivo: "" })
  const load = async () => {
    const { data } = await api.get("/inventario")
    setRows(data.rows || [])
  }
  const mov = async () => {
    if(!form.id_instalacion || !form.id_producto || !Number(form.delta)){
      alert("Complete los campos"); return
    }
    await api.post("/inventario/mov", {
      id_instalacion: Number(form.id_instalacion),
      id_producto: Number(form.id_producto),
      delta: Number(form.delta),
      motivo: form.motivo || undefined
    })
    setForm({ id_instalacion:"", id_producto:"", delta:"", motivo:"" })
    load()
  }
  useEffect(()=>{ load() }, [])
  return (
    <div className="card">
      <h3>Inventario</h3>
      <div style={{display:'flex', gap:'.5rem', marginBottom:'.8rem'}}>
        <input placeholder="ID Instalación" value={form.id_instalacion} onChange={e=>setForm({...form,id_instalacion:e.target.value})}/>
        <input placeholder="ID Producto" value={form.id_producto} onChange={e=>setForm({...form,id_producto:e.target.value})}/>
        <input placeholder="Δ Cantidad (+/-)" value={form.delta} onChange={e=>setForm({...form,delta:e.target.value})}/>
        <input placeholder="Motivo (opcional)" value={form.motivo} onChange={e=>setForm({...form,motivo:e.target.value})}/>
        <button onClick={mov}>Registrar movimiento</button>
      </div>
      <table>
        <thead><tr><th>Instalación</th><th>Producto</th><th>Tipo</th><th>Cantidad</th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.ID_INVENTARIO}>
              <td>{r.INSTALACION}</td>
              <td>{r.PRODUCTO}</td>
              <td>{r.TIPO}</td>
              <td>{r.CANTIDAD}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
