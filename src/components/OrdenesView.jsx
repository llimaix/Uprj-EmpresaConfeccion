import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function OrdenesView() {
  const [ordenes, setOrdenes] = useState([]);
  const [estado, setEstado] = useState("PENDIENTE");

  const load = async () => {
    const { data } = await api.get("/ordenes");
    setOrdenes(data.rows || []);
  };

  const cambiarEstado = async (id) => {
    await api.put(`/ordenes/${id}`, { estado });
    load();
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="card">
      <h3>Órdenes</h3>
      <div style={{ marginBottom: "1rem" }}>
        <label>Nuevo estado: </label>
        <select value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option>PENDIENTE</option>
          <option>APROBADA</option>
          <option>CANCELADA</option>
        </select>
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Items</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((o) => (
            <tr key={o.ID_ORDEN || o.id_orden}>
              <td>{o.ID_ORDEN || o.id_orden}</td>
              <td>{o.CLIENTE || o.cliente}</td>
              <td>{o.ESTADO || o.estado}</td>
              <td>{o.ITEMS || o.items}</td>
              <td>
                <button onClick={() => cambiarEstado(o.ID_ORDEN || o.id_orden)}>
                  Cambiar estado
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
