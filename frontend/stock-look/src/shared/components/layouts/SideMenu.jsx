/**
 * @file SideMenu.jsx
 * @purpose Primary collapsible sidebar navigation.
 * @responsibilities
 * - Renders navigation links defined in SIDE_MENU_DATA.
 * - Handles navigation state and highlighting.
 * - Manages user profile summary and logout actions.
 * - Adapts styles for Mobile Drawer vs Desktop Sidebar modes.
 * @key_exports
 * - SideMenu (Default)
 * @dependencies
 * - UserContext (Profile data)
 * - userService (Logout logic)
 * - react-router-dom
 * @lifecycle
 * - Rendered by DashboardLayout (Mobile & Desktop).
 * @date 2026-02-03
 */

// =============================
// Imports
// =============================

import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { motion } from "framer-motion";
import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/UserContext";
import { usePaiWidget } from "../../context/PaiWidgetContext";
import { logoutUser } from "../../../services/userService";
import paiIcon from "@/assets/icons/pai-round-bgless.png";
import paiLabelImg from "@/assets/icons/pai-label-bgless.png";
import GhostLogo from "../ui/GhostLogo";


// =============================
// Component
// =============================

const SideMenu = ({ collapsed, activeMenu, topOffset, theme = 'dark' }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();
  
  const { isDocked, setIsDocked, setIsChatOpen, setSidebarRect } = usePaiWidget();
  const paiItemRef = React.useRef(null);

  // Sync sidebar rect for magnetic pull
  React.useEffect(() => {
    const updateRect = () => {
        if (paiItemRef.current) {
            const rect = paiItemRef.current.getBoundingClientRect();
            setSidebarRect({
                x: rect.x,
                y: rect.y,
                width: rect.width,
                height: rect.height,
                centerX: rect.x + rect.width / 2,
                centerY: rect.y + rect.height / 2
            });
        }
    };
    
    updateRect();
    window.addEventListener('resize', updateRect);
    return () => window.removeEventListener('resize', updateRect);
  }, [collapsed, isDocked, setSidebarRect]);

  const handleClick = async (route, itemKey) => {
    if (itemKey === "pai" && collapsed) {
        // Detach and open chat only when the sidebar is collapsed
        setIsDocked(false);
        setIsChatOpen(true);
        return;
    }
    
    if (route === "/logout") {
      try {
        await logoutUser();
      } catch (err) {
        console.error("Logout API failed:", err);
      }
      localStorage.clear();
      clearUser();
      navigate("/login", { replace: true });
      return;
    }
    navigate(route);
  };

  // Drawer is always desktop in this setup
  const isDarkDrawer = false;

  return (
    <aside
      style={{
        width: collapsed ? 69 : 200,
        top: topOffset,
        height: `calc(100vh - ${topOffset}px)`,
        position: "fixed",
      }}
      className={`
        fixed left-0 z-40
        flex flex-col
        transition-[width] duration-300 ease-in-out
      `}
    >
      {/* ================= MENU ================= */}
      <div className="flex-1 flex flex-col gap-4 px-1 pt-2 overflow-y-auto no-scrollbar">
        {SIDE_MENU_DATA.filter(i => i.key !== "logout").map((item) => {
          const isActive = activeMenu === item.key;

          if (item.key === 'pai' && collapsed) {
             return (
                 <div id="pai-sidebar-dock-slot" key={item.id} ref={paiItemRef} className="relative w-[48px] h-[48px] mx-auto flex items-center justify-center my-2">
                     {isDocked ? (
                         <motion.button
                             onClick={() => handleClick(item.path, item.key)}
                             className="absolute inset-0 flex items-center justify-center group pointer-events-auto"
                         >
                             <div className={`pointer-events-none transition-all duration-300 ease-out transform ${isActive ? "scale-110 opacity-100" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"}`}>
                              <GhostLogo style={{ transform: 'scale(0.34)' }} />
                            </div>

                         </motion.button>
                     ) : (
                         <div className="w-[48px] h-[48px] opacity-10" />
                     )}
                 </div>
             );
          }

          return (
            <button
              id={item.key === 'pai' ? "pai-sidebar-dock-slot" : undefined}
              key={item.id}
              ref={item.key === 'pai' ? paiItemRef : null}
              onClick={() => handleClick(item.path, item.key)}
              className={`
                group flex items-center
                ${collapsed ? "justify-center" : "gap-4"}
                ${item.key === 'pai' && collapsed ? 'px-1' : 'px-4'} ${item.key === 'pai' && !collapsed ? 'py-1.5' : 'py-3'} rounded-xl
                transition-all duration-300
                relative
              `}
            >
              {/* Icon: custom image (e.g. PAI) or standard react-icon */}
              {item.customIcon === 'pai' ? (
                  // Expanded: fix icon to 20px slot (same as other icons)
                  <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', flexShrink: 0 }}>
                    <div className={`pointer-events-none transition-all duration-300 ease-out transform ${isActive ? "scale-110 opacity-100" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"}`}>
                      <GhostLogo style={{ transform: 'scale(0.23)' }} />
                    </div>
                  </div>
              ) : (
                <item.icon
                  className={`
                    text-[20px] transition-all duration-300 ease-out transform
                    ${isActive
                      ? "text-blue-700 scale-110"
                      : isDarkDrawer
                        ? "text-white/80 group-hover:text-white group-hover:scale-115"
                        : "text-text-tertiary group-hover:text-blue-400 group-hover:scale-115"
                    }
                  `}
                />
              )}

              {/* LABEL */}
              {!collapsed && (
                item.key === 'pai' ? (
                  <motion.img
                    src={paiLabelImg}
                    alt="PAI"
                    className="h-8 object-contain transition-all duration-300 group-hover:translate-x-2 group-hover:opacity-100 opacity-90"
                  />
                ) : (
                <span
                  className={`
                    text-sm transition-all duration-300
                    font-semibold
                    ${isActive
                      ? 'text-blue-700'
                        : 'text-text-secondary group-hover:text-blue-400 group-hover:translate-x-2'
                    }
                  `}
                >
                  {item.label}
                </span>
                )
              )}
            </button>
          );
        })}
      </div>

      {/* ================= USER PROFILE ================= */}
      <div className="px-1 pb-5">
        <div
          className={`
            w-full flex items-center
            ${collapsed ? "justify-center" : "gap-4 px-4"}
            py-3 rounded-xl
            transition
          `}
        >
          {user?.profileImage ? (
            <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden border-2 border-border-default transition-transform duration-300 hover:scale-110">
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-background-surface flex items-center justify-center border-2 border-dashed border-border-subtle text-text-tertiary transition-transform duration-300 hover:scale-110">
              <i className="bx bx-user text-lg" />
            </div>
          )}


          {!collapsed && (
            <div className="leading-tight">
              <p className={`text-sm font-medium text-text-primary`}>
                {user?.fullName || "Trader"}
              </p>
              <p className={`text-xs text-text-tertiary`}>
                {user?.email || "Active"}
              </p>
            </div>
          )}
        </div>

        {/* LOGOUT */}
        {SIDE_MENU_DATA.filter(i => i.key === "logout").map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.path)}
            className={`
              w-full mt-2 flex items-center
              group
              ${collapsed ? "justify-center" : "gap-4 px-4"}
              py-3 rounded-xl
              text-sm text-red-500/80
              transition-all duration-300
              hover:text-red-500
              hover:bg-red-500/[0.08]
            `}
          >
            <item.icon className="text-[20px] transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            {!collapsed && (
              <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default SideMenu;
