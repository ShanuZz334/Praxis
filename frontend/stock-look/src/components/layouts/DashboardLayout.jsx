import React, { useState, useCallback } from "react";
import Navbar from "./Navbar";
import SideMenu from "./SideMenu";
import DashboardRoutes from "../../pages/Dashboard/DashboardRoutes";

const DashboardLayout = () => {
  const [openSideMenu, setOpenSideMenu] = useState(false);
  const [activeMenu, setActiveMenu] = useState("DASHBOARD");

  // toggle ONLY for navbar button
  const toggleSideMenu = useCallback(() => {
    setOpenSideMenu((prev) => !prev);
  }, []);

  return (
    <div className="flex bg-black text-white min-h-screen relative">
      
      {/* SIDEMENU */}
      {openSideMenu && (
        <SideMenu
          activeMenu={activeMenu}
          setOpenSideMenu={setOpenSideMenu}   
        />
      )}

      {/* MAIN AREA */}
      <div className="flex-1">
        <Navbar
          openSideMenu={openSideMenu}
          setOpenSideMenu={toggleSideMenu}    
        />

        <div className="p-5">
          <DashboardRoutes setActiveMenu={setActiveMenu} />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
