import { useState } from "react";
import Header from "./components/Header";
import ProductosView from "./components/ProductosView";
import InventarioView from "./components/InventarioView";
import OrdenesView from "./components/OrdenesView";
import ProductosCRUD from "./components/ProductosCRUD";
import ReportesView from "./components/ReportesView";
import PersonasView from "./components/PersonasView";
import EmpleadosView from "./components/EmpleadosView";
import InstalacionesView from "./components/InstalacionesView";
import FinanzasView from "./components/FinanzasView";

import "./styles.css";

export default function App() {
  const [view, setView] = useState("productos");

  const renderView = () => {
    switch (view) {
      case "inventario": 
        return <InventarioView />;
      case "ordenes": 
        return <OrdenesView />;
      case "personas": 
        return <PersonasView />;
      case "empleados": 
        return <EmpleadosView />;
      case "instalaciones": 
        return <InstalacionesView />;
      case "finanzas": 
        return <FinanzasView />;
      case "reportes": 
        return <ReportesView />;
      case "productos": 
        return <ProductosCRUD />;
      default: 
        return <ProductosCRUD />;
    }
  };

  return (
    <>
      <Header onNav={setView} currentView={view} />
      <main className="container">{renderView()}</main>
    </>
  );
}
