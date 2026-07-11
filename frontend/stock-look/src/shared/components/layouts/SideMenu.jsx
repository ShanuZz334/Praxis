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

import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/UserContext";
import { logoutUser } from "../../../services/userService";
import paiIcon from "@/assets/icons/pai-round-bgless.png";
import paiLabelImg from "@/assets/icons/pai-label-bgless.png";

// =============================
// Component
// =============================

const SideMenu = ({ collapsed, activeMenu, topOffset, isMobileDrawer = false, theme = 'dark' }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleClick = async (route) => {
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

  const isDarkDrawer = isMobileDrawer && theme === 'dark';

  return (
    <aside
      style={{
        width: isMobileDrawer ? "100%" : (collapsed ? 69 : 200),
        top: topOffset,
        height: isMobileDrawer ? "100%" : `calc(100vh - ${topOffset}px)`,
        position: isMobileDrawer ? "relative" : "fixed",
      }}
      className={`
        ${isMobileDrawer ? "" : "fixed left-0 z-40"}
        flex flex-col
        transition-[width] duration-300 ease-in-out
      `}
    >
      {/* ================= MENU ================= */}
      <div className="flex-1 flex flex-col gap-4 px-1 pt-2 overflow-y-auto no-scrollbar">
        {SIDE_MENU_DATA.filter(i => i.key !== "logout").map((item) => {
          const isActive = activeMenu === item.key;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.path)}
              className={`
                group flex items-center
                ${collapsed && !isMobileDrawer ? "justify-center" : "gap-4"}
                ${item.key === 'pai' && collapsed && !isMobileDrawer ? 'px-1' : 'px-4'} ${item.key === 'pai' && !collapsed && !isMobileDrawer ? 'py-1.5' : 'py-3'} rounded-xl
                transition-all duration-300
                relative
              `}
            >
              {/* Icon: custom image (e.g. PAI) or standard react-icon */}
              {item.customIcon === 'pai' ? (
                collapsed && !isMobileDrawer ? (
                  // Collapsed: full size, no wrapper needed
                  <img
                    src={paiIcon}
                    alt="PAI"
                    style={{ width: '48px', height: '48px', minWidth: '48px' }}
                    className={`flex-shrink-0 object-contain transition-all duration-300 ease-out transform
                      ${isActive ? "scale-110 opacity-100" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"}
                    `}
                  />
                ) : (
                  // Expanded: fix icon to 20px slot (same as other icons) — image overflows visually
                  <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'visible', flexShrink: 0 }}>
                    <img
                      src={paiIcon}
                      alt="PAI"
                      style={{ width: '32px', height: '32px', minWidth: '32px' }}
                      className={`flex-shrink-0 object-contain transition-all duration-300 ease-out transform
                        ${isActive ? "scale-110 opacity-100" : "opacity-70 group-hover:opacity-100 group-hover:scale-110"}
                      `}
                    />
                  </div>
                )
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
              {(!collapsed || isMobileDrawer) && (
                item.key === 'pai' ? (
                  <img
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
                      : isDarkDrawer
                        ? 'text-white/90 group-hover:text-white group-hover:translate-x-2'
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
            ${collapsed && !isMobileDrawer ? "justify-center" : "gap-4 px-4"}
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


          {(!collapsed || isMobileDrawer) && (
            <div className="leading-tight">
              <p className={`text-sm font-medium ${isDarkDrawer ? 'text-white' : 'text-text-primary'}`}>
                {user?.fullName || "Trader"}
              </p>
              <p className={`text-xs ${isDarkDrawer ? 'text-white/60' : 'text-text-tertiary'}`}>
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
              ${collapsed && !isMobileDrawer ? "justify-center" : "gap-4 px-4"}
              py-3 rounded-xl
              text-sm text-red-500/80
              transition-all duration-300
              hover:text-red-500
              hover:bg-red-500/[0.08]
            `}
          >
            <item.icon className="text-[20px] transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12" />
            {(!collapsed || isMobileDrawer) && (
              <span className="font-semibold transition-transform duration-300 group-hover:translate-x-1">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default SideMenu;
