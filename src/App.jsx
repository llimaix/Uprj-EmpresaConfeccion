import { useState } from "react";
import Header from "./components/Header";
import ProductosView from "./components/ProductosView";
import InventarioView from "./components/InventarioView";
import OrdenesView from "./components/OrdenesView";
import ProductosCRUD from "./components/ProductosCRUD";
import OrdenesTable from "./components/OrdenesTable";

import "./styles.css";

export default function App() {
  const [view, setView] = useState("productos");

  const renderView = () => {
    switch (view) {
      case "inventario": return <InventarioView />;
      case "ordenes": return <OrdenesView />;
      default: return <ProductosView />;
      case "ordenes": return <OrdenesTable />;
      case "inventario": return <InventarioView />;
      case "ordenes": return <OrdenesView />;
      case "reportes": return <ReportesView />;
      case "productos": return <ProductosCRUD />;
    }

  };

  return (
    <>
      <Header onNav={setView} />
      <main className="container">{renderView()}</main>
    </>
  );
}
