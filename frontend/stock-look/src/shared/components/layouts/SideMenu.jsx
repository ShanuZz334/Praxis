import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/UserContext";
import { logoutUser } from "../../../services/userService";

const SideMenu = ({ collapsed, activeMenu, topOffset, isMobileDrawer = false }) => {
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
                px-4 py-3 rounded-xl
                transition-all duration-300
                hover:bg-background-surface
                relative
                ${isActive ? "bg-accent-glow/10" : ""}
              `}
            >
              {/* ICON */}
              <item.icon
                className={`
                  text-[20px] transition-all duration-300 ease-out transform
                  ${isActive
                    ? "text-blue-700 scale-110"
                    : "text-text-tertiary group-hover:text-blue-400 group-hover:scale-110"
                  }
                `}
              />

              {/* LABEL */}
              {(!collapsed || isMobileDrawer) && (
                <span
                  className={`
                    text-sm font-semibold transition-all duration-300
                    ${isActive
                      ? "text-blue-700"
                      : "text-text-secondary group-hover:text-blue-400 group-hover:translate-x-1"
                    }
                  `}
                >
                  {item.label}
                </span>
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
              <p className="text-sm font-medium text-text-primary">
                {user?.fullName || "Trader"}
              </p>
              <p className="text-xs text-text-tertiary">
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
