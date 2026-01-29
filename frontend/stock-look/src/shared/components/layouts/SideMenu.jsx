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
                transition-all duration-200
                ${isMobileDrawer && isActive ? "bg-white/5" : ""}
              `}
            >
              {/* ICON */}
              <item.icon
                className={`
                  text-[20px] transition-all duration-300 ease-out transform
                  ${isActive
                    ? "text-blue-500 drop-shadow-[0_0_6px_rgba(59,130,246,0.5)] scale-110"
                    : "text-[var(--text-muted)] group-hover:text-blue-400 group-hover:scale-110 group-hover:-rotate-6"
                  }
                `}
              />

              {/* LABEL */}
              {(!collapsed || isMobileDrawer) && (
                <span
                  className={`
                    text-sm font-medium transition-colors
                    ${isActive
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] group-hover:text-blue-500"
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
            <div className="w-8 h-8 flex-shrink-0 rounded-full overflow-hidden border-2 border-[var(--border-main)]">
              <img
                src={user.profileImage}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-8 h-8 flex-shrink-0 rounded-full bg-[var(--border-main)] flex items-center justify-center border-2 border-dashed border-[var(--border-hover)] text-[var(--text-muted)]">
              <i className="bx bx-user text-lg" />
            </div>
          )}


          {(!collapsed || isMobileDrawer) && (
            <div className="leading-tight">
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {user?.fullName || "Trader"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
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
              ${collapsed && !isMobileDrawer ? "justify-center" : "gap-4 px-4"}
              py-3 rounded-xl
              text-sm text-red-500/80
              transition-all
              hover:text-red-400
              hover:bg-red-500/5
            `}
          >
            <item.icon className="text-[20px]" />
            {(!collapsed || isMobileDrawer) && (
              <span className="font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default SideMenu;
