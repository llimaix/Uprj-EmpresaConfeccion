import { useEffect, useState } from "react"
import { api } from "../api"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from "recharts"

export default function ReportesView(){
  const [data, setData] = useState({ inventarioPorTipo:[], ordenesPorEstado:[], stockPorInstalacion:[], topProductos:[] })
  useEffect(()=>{
    api.get('/reportes').then(res=>setData(res.data))
  },[])
  return (
    <div className="card">
      <h3>Dashboard</h3>

      <div className="grid" style={{display:'grid', gap:'1rem', gridTemplateColumns:'1fr 1fr'}}>
        <div className="card">
          <h4>Inventario por tipo</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.inventarioPorTipo}>
              <XAxis dataKey="TIPO" /><YAxis /><Tooltip />
              <Bar dataKey="TOTAL" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h4>Órdenes por estado</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.ordenesPorEstado}>
              <XAxis dataKey="ESTADO" /><YAxis /><Tooltip />
              <Bar dataKey="TOTAL" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h4>Top productos (ventas)</h4>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.topProductos}>
              <CartesianGrid strokeDasharray="3 3"/>
              <XAxis dataKey="PRODUCTO" /><YAxis /><Tooltip />
              <Line type="monotone" dataKey="TOTAL" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h4>Stock por instalación</h4>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.stockPorInstalacion}>
              <XAxis dataKey="INSTALACION" /><YAxis /><Tooltip />
              <Bar dataKey="TOTAL" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
