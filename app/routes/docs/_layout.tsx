import { Outlet, NavLink } from "react-router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function DocsLayout() {
  return (
    <div className="flex flex-col min-h-screen bg-base-100 con">
      <Header />
      <div className="flex flex-1 ">
        <aside className="w-64 shrink-0 border-r border-base-300 bg-base-100 overflow-y-auto">
          <nav className="p-6 flex flex-col gap-2">
            <p className="text-xs font-semibold text-base-content/60 uppercase tracking-widest mb-3">
              Navigation
            </p>
            <NavLink
              to="/docs"
              end
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-content"
                    : "text-base-content/70 hover:bg-base-200"
                }`
              }
            >
              Overview
            </NavLink>
            <NavLink
              to="/docs/profile"
              className={({ isActive }) =>
                `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary text-primary-content"
                    : "text-base-content/70 hover:bg-base-200"
                }`
              }
            >
              GET /profile
            </NavLink>
          </nav>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-6 py-10">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
