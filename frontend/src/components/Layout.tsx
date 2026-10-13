import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../lib/store";

const menu = [
  { path: "/dashboard", label: "Dashboard", icon: "📊" },
  { path: "/patients", label: "Pasien", icon: "👥" },
  { path: "/appointments", label: "Jadwal", icon: "📅" },
  { path: "/queue", label: "Antrian", icon: "🎫" },
  { path: "/invoices", label: "Invoice", icon: "💰" },
  { path: "/schedules", label: "Jam Praktik", icon: "⏰" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-primary-600">🦷 Dental App</h1>
          <p className="text-xs text-gray-500 mt-1">Practice Management</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {menu.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary-50 text-primary-700 font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="mb-3">
            <p className="text-sm font-medium text-gray-800">{user?.name}</p>
            <p className="text-xs text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="btn-secondary w-full text-sm"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
