import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";

import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/UserContext";

const SideMenu = ({ collapsed, activeMenu, topOffset, isMobileDrawer = false }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleClick = (route) => {
    if (route === "/logout") {
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
                    ? "text-[#3005f1] drop-shadow-[0_0_6px_rgba(48,5,241,0.5)] scale-110"
                    : "text-white/60 group-hover:text-[#5f7cff] group-hover:scale-110 group-hover:-rotate-6"
                  }
                `}
              />

              {/* LABEL */}
              {(!collapsed || isMobileDrawer) && (
                <span
                  className={`
                    text-sm font-medium transition-colors
                    ${isActive
                      ? "text-white"
                      : "text-white/70 group-hover:text-[#8fa2ff]"
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
      <div className="px-3 pb-5">
        <div
          className={`
            flex items-center
            ${collapsed && !isMobileDrawer ? "justify-center" : "gap-3"}
            p-3 rounded-xl
            transition
          `}
        >
          {user?.profileImageUrl ? (
            <div className="w-9 h-9 rounded-full overflow-hidden">
              <img
                src={user.profileImageUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
              ?
            </div>
          )}


          {(!collapsed || isMobileDrawer) && (
            <div className="leading-tight">
              <p className="text-sm font-medium text-white">
                {user?.fullName || "Trader"}
              </p>
              <p className="text-xs text-white/60">
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
              mt-2 flex items-center
              ${collapsed && !isMobileDrawer ? "justify-center" : "gap-4"}
              px-4 py-3 rounded-xl
              text-sm text-red-400
              transition-colors
              hover:text-red-300
            `}
          >
            <item.icon className="text-[18px]" />
            {(!collapsed || isMobileDrawer) && <span>{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default SideMenu;
