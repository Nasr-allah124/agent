import { useState, useEffect } from "react";
import ServiceSelector from "./pages/ServiceSelector";
import CvPage from "./pages/CvPage";
import FacturePage from "./pages/FacturePage";

function App() {
  const [serviceActif, setServiceActif] = useState(() => localStorage.getItem("service_actif") || null);

  useEffect(() => {
    if (serviceActif) {
      localStorage.setItem("service_actif", serviceActif);
    } else {
      localStorage.removeItem("service_actif");
    }
  }, [serviceActif]);

  if (serviceActif === "cv") return <CvPage onRetour={() => setServiceActif(null)} />;
  if (serviceActif === "facture") return <FacturePage onRetour={() => setServiceActif(null)} />;
  return <ServiceSelector onSelect={setServiceActif} />;
}

export default App;