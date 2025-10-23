import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function InventarioView() {
  const [data, setData] = useState([]);

  useEffect(() => {
    api.get("/inventario").then(res => setData(res.data.rows || []));
  }, []);

  return (
    <div className="card">
      <h3>Inventario</h3>
      <table>
        <thead><tr><th>ID</th><th>Producto</th><th>Instalación</th><th>Cantidad</th></tr></thead>
        <tbody>
          {data.map(i => (
            <tr key={i.ID_INVENTARIO}>
              <td>{i.ID_INVENTARIO}</td>
              <td>{i.PRODUCTO}</td>
              <td>{i.INSTALACION}</td>
              <td>{i.CANTIDAD}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
