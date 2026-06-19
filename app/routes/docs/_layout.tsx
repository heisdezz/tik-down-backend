import { Outlet, NavLink } from "react-router";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { useState } from "react";

export default function DocsLayout() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const NavItems = () => (
    <>
      <p className="text-xs font-semibold text-base-content/60 uppercase tracking-widest mb-3 px-4">
        Navigation
      </p>
      <NavLink
        to="/docs"
        end
        onClick={() => setIsMenuOpen(false)}
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
        to="/docs/tiktok"
        onClick={() => setIsMenuOpen(false)}
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-primary text-primary-content"
              : "text-base-content/70 hover:bg-base-200"
          }`
        }
      >
        POST /tiktok
      </NavLink>
      <NavLink
        to="/docs/tiktok-download"
        onClick={() => setIsMenuOpen(false)}
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-primary text-primary-content"
              : "text-base-content/70 hover:bg-base-200"
          }`
        }
      >
        POST /tiktok/download
      </NavLink>
      <NavLink
        to="/docs/instagram"
        onClick={() => setIsMenuOpen(false)}
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-primary text-primary-content"
              : "text-base-content/70 hover:bg-base-200"
          }`
        }
      >
        POST /instagram
      </NavLink>
      <NavLink
        to="/docs/facebook"
        onClick={() => setIsMenuOpen(false)}
        className={({ isActive }) =>
          `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            isActive
              ? "bg-primary text-primary-content"
              : "text-base-content/70 hover:bg-base-200"
          }`
        }
      >
        POST /facebook
      </NavLink>
    </>
  );

  return (
    <div className="flex flex-col min-h-screen bg-base-100">
      <Header />

      {/* Mobile Menu Button */}
      <div className="lg:hidden px-6 py-3 border-b border-base-300 bg-base-100 sticky top-16 z-20">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="btn btn-sm btn-ghost gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            className="inline-block w-5 h-5 stroke-current"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
          Menu
        </button>
      </div>

      <div className="flex flex-1 relative">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-base-300 bg-base-100 overflow-y-auto sticky top-16 h-[calc(100vh-64px)]">
          <nav className="p-6 flex flex-col gap-2">
            <NavItems />
          </nav>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsMenuOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <aside
          className={`
          lg:hidden fixed inset-y-0 left-0 w-64 bg-base-100 z-40 transform transition-transform duration-300 ease-in-out border-r border-base-300
          ${isMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          <div className="p-6 flex flex-col gap-2">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Docs</span>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="btn btn-sm btn-circle btn-ghost"
              >
                ✕
              </button>
            </div>
            <NavItems />
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto px-4 md:px-6 py-10">
            <Outlet />
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
