import { useEffect, useState } from "react";
import { api } from "../api.js";
import InventarioTable from "./InventarioTable";

export default function InventarioView() {
  const [inventario, setInventario] = useState([]);
  const [idInstalacion, setIdInstalacion] = useState("");
  const [idProducto, setIdProducto] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [motivo, setMotivo] = useState("");

  // 🔁 Carga el inventario desde el backend
  const loadInventario = async () => {
    try {
      const { data } = await api.get("/inventario");
      setInventario(data.rows || []);
    } catch (err) {
      console.error("Error al cargar inventario:", err);
      alert("No se pudo cargar el inventario");
    }
  };

  // ➕ Registrar movimiento (entrada/salida)
  const registrar = async () => {
    if (!idInstalacion || !idProducto || !cantidad) {
      alert("Debe ingresar instalación, producto y cantidad");
      return;
    }

    try {
      await api.post("/mov", {
        id_instalacion: idInstalacion,
        id_producto: idProducto,
        delta: Number(cantidad),
        motivo,
      });

      // Limpiar campos
      setIdInstalacion("");
      setIdProducto("");
      setCantidad("");
      setMotivo("");

      // Recargar datos
      loadInventario();
    } catch (err) {
      console.error("Error al registrar movimiento:", err);
      alert("Error al registrar movimiento");
    }
  };

  useEffect(() => {
    loadInventario();
  }, []);

  return (
    <div className="card">
      <h3>Inventario</h3>

      <div style={{ display: "flex", gap: ".5rem", marginBottom: "1rem" }}>
        <input
          placeholder="ID Instalación"
          value={idInstalacion}
          onChange={(e) => setIdInstalacion(e.target.value)}
        />
        <input
          placeholder="ID Producto"
          value={idProducto}
          onChange={(e) => setIdProducto(e.target.value)}
        />
        <input
          placeholder="Δ Cantidad (+/-)"
          value={cantidad}
          onChange={(e) => setCantidad(e.target.value)}
        />
        <input
          placeholder="Motivo (opcional)"
          value={motivo}
          onChange={(e) => setMotivo(e.target.value)}
        />
        <button onClick={registrar}>Registrar movimiento</button>
      </div>

      <InventarioTable data={inventario} />
    </div>
  );
}
