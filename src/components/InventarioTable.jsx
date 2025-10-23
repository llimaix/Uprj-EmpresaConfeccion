import { useEffect, useState } from 'react'
import { api } from '../api.js'

export default function InventarioTable(){
  const [data, setData] = useState([])
  useEffect(()=>{
    api.get('/inventario').then(res=>setData(res.data.rows))
  },[])
  return (
    <div className="card">
      <h2>Inventario Global</h2>
      <table>
        <thead><tr><th>ID</th><th>Producto</th><th>Instalación</th><th>Cantidad</th></tr></thead>
        <tbody>
          {data.map(d=>(
            <tr key={d.ID_INVENTARIO}>
              <td>{d.ID_INVENTARIO}</td>
              <td>{d.PRODUCTO}</td>
              <td>{d.INSTALACION}</td>
              <td>{d.CANTIDAD}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
