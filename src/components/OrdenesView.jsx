import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function OrdenesView() {
  const [data, setData] = useState([]);
  const [idCliente, setIdCliente] = useState("");
  const [estado, setEstado] = useState("PENDIENTE");

  const cargar = async () => {
    const res = await api.get("/ordenes");
    setData(res.data.rows || []);
  };

  const crear = async () => {
    if (!idCliente) return alert("Ingrese ID del cliente");
    await api.post("/ordenes", {
      id_cliente: Number(idCliente),
      estado,
      items: [{ id_producto: 1, cantidad: 2 }],
    });
    setIdCliente("");
    cargar();
  };

  useEffect(() => { cargar(); }, []);

  return (
    <div className="card">
      <h3>Órdenes de Compra</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input placeholder="ID Cliente" value={idCliente} onChange={e => setIdCliente(e.target.value)} />
        <select value={estado} onChange={e => setEstado(e.target.value)}>
          <option>PENDIENTE</option>
          <option>APROBADA</option>
          <option>CANCELADA</option>
        </select>
        <button onClick={crear}>Crear Orden</button>
      </div>
      <table>
        <thead><tr><th>ID</th><th>Cliente</th><th>Estado</th><th>Items</th></tr></thead>
        <tbody>
          {data.map(o => (
            <tr key={o.ID_ORDEN}>
              <td>{o.ID_ORDEN}</td>
              <td>{o.CLIENTE}</td>
              <td>{o.ESTADO}</td>
              <td>{o.TOTAL_ITEMS}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
