import { NavLink, Outlet } from "react-router-dom";

const tabs = [
  { to: "/", icon: "🍅", label: "计时" },
  { to: "/tasks", icon: "📋", label: "任务" },
  { to: "/stats", icon: "📊", label: "统计" },
  { to: "/settings", icon: "⚙️", label: "设置" },
];

export default function Layout() {
  return (
    <div className="flex flex-col h-screen bg-[#1a1a1a]">
      <div className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 flex">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === "/"}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                isActive ? "text-red-500" : "text-gray-400 hover:text-gray-200"
              }`
            }
          >
            <span className="text-xl">{tab.icon}</span>
            <span className="mt-0.5">{tab.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
