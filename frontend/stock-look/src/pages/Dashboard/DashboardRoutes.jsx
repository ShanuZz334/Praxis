import { Routes, Route } from "react-router-dom";

// Pages
import Home from "./home";
import Fundamental from "./fundamental_analysis";
import Technical from "./technical_analysis";
import Options from "./options_analysis";
import Events from "./events";
import PnL from "./pnl";
import Journal from "./journal";
import Foreign from "./foreign_markets";

// Menu sync
import MenuSync from "../../components/common/MenuSync";

const DashboardRoutes = ({ setActiveMenu }) => {
  return (
    <Routes>
      <Route
        path="home"
        element={
          <>
            <MenuSync menu="dashboard" setActiveMenu={setActiveMenu} />
            <Home />
          </>
        }
      />

      <Route
        path="fundamental"
        element={
          <>
            <MenuSync menu="fundamental" setActiveMenu={setActiveMenu} />
            <Fundamental />
          </>
        }
      />

      <Route
        path="technical"
        element={
          <>
            <MenuSync menu="technical" setActiveMenu={setActiveMenu} />
            <Technical />
          </>
        }
      />

      <Route
        path="options"
        element={
          <>
            <MenuSync menu="options" setActiveMenu={setActiveMenu} />
            <Options />
          </>
        }
      />

      <Route
        path="events"
        element={
          <>
            <MenuSync menu="events" setActiveMenu={setActiveMenu} />
            <Events />
          </>
        }
      />

      <Route
        path="pnl"
        element={
          <>
            <MenuSync menu="pnl" setActiveMenu={setActiveMenu} />
            <PnL />
          </>
        }
      />

      <Route
        path="foreign"
        element={
          <>
            <MenuSync menu="foreign" setActiveMenu={setActiveMenu} />
            <Foreign />
          </>
        }
      />

      <Route
        path="journal"
        element={
          <>
            <MenuSync menu="journal" setActiveMenu={setActiveMenu} />
            <Journal />
          </>
        }
      />
    </Routes>
  );
};

export default DashboardRoutes;
