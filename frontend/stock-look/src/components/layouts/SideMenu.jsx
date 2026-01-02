import React, { useContext, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SIDE_MENU_DATA } from "../../utils/data";
import { UserContext } from "../../context/userContext";
import { ChevronLeft } from "lucide-react";
import logo from "../../assets/images/logo.png"; // ✅ ADD LOGO

const SideMenu = ({ activeMenu }) => {
  const { user, clearUser } = useContext(UserContext);
  const navigate = useNavigate();

  // Sidebar opens in COLLAPSED mode by default
  const [collapsed, setCollapsed] = useState(true);
  const menuRef = useRef(null);

  const handleClick = (route) => {
    if (route === "/logout") {
      localStorage.clear();
      clearUser();
      navigate("/login", { replace: true });
      return;
    }
    navigate(route);
  };

  /* ================= CLICK OUTSIDE → COLLAPSE ================= */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setCollapsed(true);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <aside
      ref={menuRef}
      className={`
        fixed top-23 left-5 mt-2
        h-[calc(83vh-140px)]
        flex flex-col
        rounded-2xl
        bg-white/10 backdrop-blur-xl
        border border-white/20
        shadow-[0_30px_80px_rgba(0,0,0,0.6)]
        text-white
        transition-all duration-300 ease-in-out
        z-40
        ${collapsed ? "w-16" : "w-[256px]"}
      `}
    >
      {/* ================= HEADER ================= */}
      <div
        className={`
          flex items-center
          ${collapsed ? "justify-center" : "justify-between"}
          px-3 py-4
        `}
      >
        {/* COLLAPSED → LOGO ONLY */}
        {collapsed ? (
          <img
            src={logo}
            alt="Stocky Logo"
            className="w-11 h-11 object-contain opacity-90"
          />
        ) : (
          /* EXPANDED → PROFILE + NAME */
          <div className="flex items-center gap-3">
            {user?.profileImageUrl ? (
              <img
                src={user.profileImageUrl}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-white/30"
                alt="Profile"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-black/40 flex items-center justify-center">
                ?
              </div>
            )}

            <div className="leading-tight">
              <p className="text-sm font-medium">
                {user?.fullName || "Trader"}
              </p>
              <p className="text-xs text-white/60">Active</p>
            </div>
          </div>
        )}

        {/* ▶ COLLAPSE ARROW (ONLY WHEN EXPANDED) */}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-white/60 hover:text-white transition"
            aria-label="Collapse sidebar"
          >
            <ChevronLeft size={22} />
          </button>
        )}
      </div>

      {/* ▶ EXPAND ARROW (ICON MODE) */}
      {collapsed && (
        <div className="flex justify-center mb-3">
          <button
            onClick={() => setCollapsed(false)}
            className="text-white/60 hover:text-white transition"
            aria-label="Expand sidebar"
          >
            <ChevronLeft size={22} className="rotate-180" />
          </button>
        </div>
      )}

      {/* ================= MENU ================= */}
      <div className="flex-1 flex flex-col gap-2 px-2 pb-3 overflow-hidden">
        {SIDE_MENU_DATA.filter(i => i.key !== "logout").map((item) => {
          const isActive = activeMenu === item.key;

          return (
            <button
              key={item.id}
              onClick={() => handleClick(item.path)}
              className={`
                group flex items-center
                ${collapsed ? "justify-center" : "gap-3"}
                px-3 py-2.5 rounded-xl
              `}
            >
              <item.icon
                className={`
                  text-[18px]
                  transition-colors duration-200
                  ${
                    isActive
                      ? "text-[#3005f1]"
                      : "text-white/60 group-hover:text-[#3b68a3]"
                  }
                `}
              />

              {!collapsed && (
                <span
                  className={`text-sm whitespace-nowrap ${
                    isActive ? "text-white" : "text-white/70"
                  }`}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ================= LOGOUT ================= */}
      <div className="border-t border-white/20 pt-2 px-2 mb-2">
        {SIDE_MENU_DATA.filter(i => i.key === "logout").map((item) => (
          <button
            key={item.id}
            onClick={() => handleClick(item.path)}
            className={`
              flex items-center
              ${collapsed ? "justify-center" : "gap-3"}
              px-3 py-2.5 rounded-xl
              text-sm text-red-400
            `}
          >
            <item.icon className="text-[18px]" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>
    </aside>
  );
};

export default SideMenu;
