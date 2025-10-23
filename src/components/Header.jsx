export default function Header(){
  return (
    <header className="container" style={{paddingTop:'1.2rem'}}>
      <div className="card" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h1 style={{margin:0}}>Sistema de Control de Confección</h1>
        <nav style={{display:'flex', gap:'.6rem'}}>
          <a href="#" onClick={(e)=>e.preventDefault()}>Inicio</a>
          <a href="#" onClick={(e)=>e.preventDefault()}>Productos</a>
          <a href="#" onClick={(e)=>e.preventDefault()}>Órdenes</a>
        </nav>
      </div>
    </header>
  )
}
