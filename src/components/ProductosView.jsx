import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function ProductosView() {
  const [data, setData] = useState([]);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");

  const cargar = async () => {
    const res = await api.get("/productos");
    setData(res.data.rows || []);
  };

  const crear = async () => {
    if (!nombre || !tipo) return alert("Faltan campos");
    await api.post("/productos", { nombre, tipo });
    setNombre(""); setTipo("");
    cargar();
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="card">
      <h3>Productos</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input placeholder="Nombre" value={nombre} onChange={e => setNombre(e.target.value)} />
        <input placeholder="Tipo" value={tipo} onChange={e => setTipo(e.target.value)} />
        <button onClick={crear}>Agregar</button>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Nombre</th><th>Tipo</th></tr></thead>
        <tbody>
          {data.map(p => (
            <tr key={p.ID_PRODUCTO}>
              <td>{p.ID_PRODUCTO}</td>
              <td>{p.NOMBRE}</td>
              <td>{p.TIPO}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
