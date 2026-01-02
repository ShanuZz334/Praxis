import { useEffect } from "react";

const MenuSync = ({ menu, setActiveMenu }) => {
  useEffect(() => {
    setActiveMenu((prev) => {
      if (prev === menu) return prev; // ⛔ prevent infinite loop
      return menu;
    });
  }, [menu, setActiveMenu]);

  return null;
};

export default MenuSync;
