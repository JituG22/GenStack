import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./NotificationBell";
import {
  HomeIcon,
  DocumentIcon,
  CubeIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ChartBarIcon,
  WifiIcon,
  UsersIcon,
  Cog6ToothIcon,
  RocketLaunchIcon,
  CodeBracketIcon,
} from "@heroicons/react/24/outline";

interface LayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/", icon: HomeIcon },
  { name: "Projects", href: "/projects", icon: DocumentIcon },
  {
    name: "Enhanced Projects",
    href: "/projects-enhanced",
    icon: RocketLaunchIcon,
  },
  { name: "Templates", href: "/templates", icon: CubeIcon },
  { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
  { name: "GitHub Config", href: "/github-config", icon: Cog6ToothIcon },
  {
    name: "Integration Demo",
    href: "/integration-demo",
    icon: RocketLaunchIcon,
  },
  { name: "WebSocket Test", href: "/websocket-test", icon: WifiIcon },
  { name: "Collaborative Test", href: "/collaborative-test", icon: UsersIcon },
  { name: "Collaboration Demo", href: "/collaboration-demo", icon: UsersIcon },
];

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden ${
          sidebarOpen ? "" : "hidden"
        }`}
      >
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75"
          onClick={() => setSidebarOpen(false)}
        />

        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <h1 className="text-xl font-bold text-gray-900">GenStack</h1>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      isActive
                        ? "bg-gray-100 text-gray-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="mr-4 h-6 w-6" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white shadow">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <h1 className="text-xl font-bold text-gray-900">GenStack</h1>
              </div>
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        isActive
                          ? "bg-gray-100 text-gray-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      }`}
                    >
                      <item.icon className="mr-3 h-6 w-6" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <button
            type="button"
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" />
          </button>

          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">{/* Search could go here */}</div>

            <div className="ml-4 flex items-center md:ml-6">
              {/* Notification Bell */}
              <NotificationBell />

              {/* Profile section */}
              <div className="ml-3 relative">
                <div className="flex items-center space-x-3 bg-gray-50 rounded-lg px-3 py-2">
                  {/* User Icon */}
                  <div
                    className="flex-shrink-0"
                    title={
                      user?.firstName && user?.lastName && user?.email
                        ? `${user.firstName} ${user.lastName} (${user.email})`
                        : "User Profile"
                    }
                  >
                    <UserIcon className="h-8 w-8 text-indigo-600" />
                  </div>

                  {/* User Name - Hidden on small screens */}
                  <div className="hidden md:flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {(() => {
                        console.log("User data in Layout:", user);
                        if (user?.firstName && user?.lastName) {
                          return `${user.firstName} ${user.lastName}`;
                        } else if (user?.email) {
                          // Fallback to email if firstName/lastName not available
                          return user.email.split("@")[0];
                        } else {
                          return isLoading ? "Loading..." : "User";
                        }
                      })()}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user?.email || ""}
                    </span>
                  </div>

                  {/* Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                    title="Logout"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          {children}
        </main>
      </div>
    </div>
  );
}
