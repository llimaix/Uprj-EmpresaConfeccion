import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function OrdenesTable() {
  const [ordenes, setOrdenes] = useState([]);
  const [idCliente, setIdCliente] = useState("");
  const [estado, setEstado] = useState("PENDIENTE");
  const [items, setItems] = useState([{ id_producto: "", cantidad: 1 }]);

  const cargar = async () => {
    try {
      const { data } = await api.get("/ordenes");
      setOrdenes(data.rows || []);
    } catch (e) {
      console.error(e);
      alert("Error al cargar órdenes");
    }
  };

  const agregarItem = () => {
    setItems([...items, { id_producto: "", cantidad: 1 }]);
  };

  const actualizarItem = (idx, campo, valor) => {
    const nuevo = [...items];
    nuevo[idx][campo] = valor;
    setItems(nuevo);
  };

  const crearOrden = async () => {
    if (!idCliente || !items.length)
      return alert("Debe ingresar cliente y al menos un producto");

    const validItems = items.filter((i) => i.id_producto && i.cantidad > 0);
    if (!validItems.length) return alert("Verifica los productos");

    try {
      await api.post("/ordenes", {
        id_cliente: Number(idCliente),
        estado,
        items: validItems.map((i) => ({
          id_producto: Number(i.id_producto),
          cantidad: Number(i.cantidad),
        })),
      });
      setIdCliente("");
      setItems([{ id_producto: "", cantidad: 1 }]);
      cargar();
    } catch (e) {
      console.error(e);
      alert("Error al crear orden");
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="card">
      <h3>Órdenes de Compra</h3>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          marginBottom: "1rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            placeholder="ID Cliente"
            value={idCliente}
            onChange={(e) => setIdCliente(e.target.value)}
          />
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="PENDIENTE">PENDIENTE</option>
            <option value="APROBADA">APROBADA</option>
            <option value="CANCELADA">CANCELADA</option>
          </select>
        </div>

        <div>
          <h4>Items</h4>
          {items.map((it, idx) => (
            <div key={idx} style={{ display: "flex", gap: "0.5rem" }}>
              <input
                placeholder="ID Producto"
                value={it.id_producto}
                onChange={(e) =>
                  actualizarItem(idx, "id_producto", e.target.value)
                }
                style={{ width: "100px" }}
              />
              <input
                type="number"
                placeholder="Cantidad"
                value={it.cantidad}
                onChange={(e) =>
                  actualizarItem(idx, "cantidad", e.target.value)
                }
                style={{ width: "100px" }}
              />
            </div>
          ))}
          <button onClick={agregarItem} style={{ marginTop: "0.5rem" }}>
            ➕ Agregar producto
          </button>
        </div>

        <button onClick={crearOrden} style={{ marginTop: "1rem" }}>
          Crear Orden
        </button>
      </div>

      <h4>Listado de Órdenes</h4>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Total Ítems</th>
          </tr>
        </thead>
        <tbody>
          {ordenes.map((o) => (
            <tr key={o.ID_ORDEN}>
              <td>{o.ID_ORDEN}</td>
              <td>{o.CLIENTE}</td>
              <td>{o.ESTADO}</td>
              <td>{o.TOTAL_ITEMS}</td>
            </tr>
          ))}
          {!ordenes.length && (
            <tr>
              <td colSpan={4}>Sin órdenes registradas</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
