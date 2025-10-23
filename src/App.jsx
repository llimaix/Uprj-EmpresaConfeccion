import { useEffect, useState } from 'react'
import Header from './components/Header.jsx'
import ProductosTable from './components/ProductosTable.jsx'
import { api } from './api.js'

export default function App(){
  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const cargar = async () => {
    setLoading(true)
    setMsg('')
    try {
      const { data } = await api.get('/productos')
      setProductos(data.rows || [])
    } catch (e) {
      setMsg(e?.response?.data?.message || e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ cargar() }, [])

  return (
    <>
      <Header />
      <main className="container grid grid-2">
        <div className="card">
          <h2 style={{marginTop:0}}>Healthcheck API</h2>
          <button onClick={async ()=>{
            try{
              const { data } = await api.get('/health')
              alert(`OK: ${JSON.stringify(data)}`)
            }catch(e){
              alert('Error: ' + (e?.response?.data?.message || e.message))
            }
          }}>Probar API</button>
        </div>

        <div className="card">
          <h2 style={{marginTop:0}}>Consultar Productos</h2>
          <button onClick={cargar} disabled={loading}>{loading?'Cargando...':'Refrescar'}</button>
          {msg && <p style={{color:'tomato'}}>{msg}</p>}
        </div>

        <div className="grid-2" style={{gridColumn:'1 / -1'}}>
          <ProductosTable productos={productos} />
        </div>
      </main>
    </>
  )
}
