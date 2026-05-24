import { Link, NavLink, Route, Routes } from "react-router-dom";
import Landing from "./pages/Landing";
import Artist from "./pages/Artist";
import Labels from "./pages/Labels";
import Funds from "./pages/Funds";
import Investigate from "./pages/Investigate";
import Receipt from "./pages/Receipt";

const navItems = [
  { to: "/", label: "Artists" },
  { to: "/labels", label: "Labels" },
  { to: "/funds", label: "Funds" },
  { to: "/investigate", label: "Investigate" },
];

function NavBar() {
  return (
    <header className="border-b border-ink-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-ink-900 text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12h2l3-8 4 16 3-12 2 8h4" />
            </svg>
          </div>
          <div className="text-base font-semibold text-ink-900 tracking-tight">
            provenance<span className="text-accent-700">.fm</span>
          </div>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.to === "/"}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm transition ${
                  isActive
                    ? "bg-ink-900 text-white"
                    : "text-ink-600 hover:bg-ink-100"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-full bg-ink-50">
      <NavBar />
      <main>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/artist/:id?" element={<Artist />} />
          <Route path="/labels" element={<Labels />} />
          <Route path="/funds" element={<Funds />} />
          <Route path="/investigate" element={<Investigate />} />
          <Route path="/receipt/:id" element={<Receipt />} />
        </Routes>
      </main>
      <footer className="border-t border-ink-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-xs text-ink-400">
          <div>
            <span className="font-medium text-ink-900">provenance.fm</span> · A Pitchfork Innovation studio project · audio is fingerprinted client-side and never uploaded.
          </div>
          <div className="flex items-center gap-3">
            <Link to="/labels" className="hover:text-ink-900">Labels</Link>
            <Link to="/funds" className="hover:text-ink-900">Funds</Link>
            <Link to="/investigate" className="hover:text-ink-900">Investigate</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
