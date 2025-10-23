import { useEffect, useState } from "react";
import { api } from "../api.js";

export default function ProductosCRUD() {
  const [productos, setProductos] = useState([]);
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [editId, setEditId] = useState(null);

  const cargar = async () => {
    try {
      const { data } = await api.get("/productos");
      setProductos(data.rows || []);
    } catch (e) {
      console.error(e);
      alert("Error al cargar productos");
    }
  };

  const guardar = async () => {
    if (!nombre || !tipo) return alert("Todos los campos son requeridos");
    try {
      if (editId) {
        // actualizar
        await api.put(`/productos/${editId}`, { nombre, tipo });
      } else {
        // crear
        await api.post("/productos", { nombre, tipo });
      }
      setNombre("");
      setTipo("");
      setEditId(null);
      cargar();
    } catch (e) {
      console.error(e);
      alert("Error al guardar producto");
    }
  };

  const eliminar = async (id) => {
    if (!confirm("¿Seguro de eliminar este producto?")) return;
    try {
      await api.delete(`/productos/${id}`);
      cargar();
    } catch (e) {
      console.error(e);
      alert("Error al eliminar producto");
    }
  };

  const editar = (p) => {
    setEditId(p.ID_PRODUCTO);
    setNombre(p.NOMBRE);
    setTipo(p.TIPO);
  };

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="card">
      <h3>Gestión de Productos</h3>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
        <input
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <input
          placeholder="Tipo"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />
        <button onClick={guardar}>
          {editId ? "Actualizar" : "Agregar"}
        </button>
        {editId && (
          <button
            onClick={() => {
              setEditId(null);
              setNombre("");
              setTipo("");
            }}
          >
            Cancelar
          </button>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Tipo</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {productos.map((p) => (
            <tr key={p.ID_PRODUCTO}>
              <td>{p.ID_PRODUCTO}</td>
              <td>{p.NOMBRE}</td>
              <td>{p.TIPO}</td>
              <td>
                <button onClick={() => editar(p)}>✏️</button>{" "}
                <button onClick={() => eliminar(p.ID_PRODUCTO)}>🗑️</button>
              </td>
            </tr>
          ))}
          {!productos.length && (
            <tr>
              <td colSpan={4}>No hay productos</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
