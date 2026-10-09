import { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  LogOut,
  ChevronDown,
  LayoutGrid,
  CheckSquare,
  Users,
  Shield,
  ShieldCheck,
  Layers,
  Sparkles,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useBoardHeader } from "../context/BoardHeaderContext.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import ChangePasswordModal from "./ChangePasswordModal.jsx";
import FilterPopover from "./ui/FilterPopover.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Consume board header data (available when inside a BoardView)
  const { boardHeaderData } = useBoardHeader();

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
      if (
        mobileMenuOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest("button[aria-label='Toggle navigation menu']")
      ) {
        setMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setProfileDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleConfirmLogout = () => {
    setShowSignoutModal(false);
    setProfileDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    toast.info("Signed out successfully", { title: "Goodbye" });
    navigate("/login");
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  // Check if we are currently on a board page with active board data
  const isBoardView = location.pathname.startsWith("/boards/") && !!boardHeaderData?.board;
  const board = boardHeaderData?.board;
  const members = (board?.members || []).filter((m) => m && m.user);
  const maxVisibleAvatars = 4;
  const visibleMembers = members.slice(0, maxVisibleAvatars);
  const extraMembersCount = Math.max(0, members.length - maxVisibleAvatars);

  return (
    <>
      <header className="border-b border-line/80 bg-surface/95 backdrop-blur-md sticky top-0 z-40 transition-colors shadow-xs">
        <div className="w-full px-3 sm:px-5 lg:px-6 h-14 sm:h-15 flex items-center justify-between gap-3 sm:gap-4 max-w-[1700px] mx-auto">
          {/* ================= LEFT SECTION: LOGO, NAV TABS & BOARD CONTEXT ================= */}
          <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 min-w-0 flex-1 sm:flex-initial">
            {/* Brand Logo */}
            <Link
              to="/"
              onClick={closeMobileMenu}
              className="flex items-center gap-2 py-1 focus:outline-none focus:ring-2 focus:ring-orange-500/40 rounded-xl group shrink-0"
              title="precise3dm - Home"
            >
              <img
                src="/precise-logo.png"
                alt="precise3dm"
                className="h-7 sm:h-8 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
              />
            </Link>

            {/* Segmented Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center h-9 p-1 bg-surface-2/80 rounded-xl border border-line/70 shadow-xs shrink-0">
              <Link
                to="/"
                className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center transition-all duration-150 ${
                  location.pathname === "/"
                    ? "bg-white text-orange-600 shadow-xs border border-orange-200/60"
                    : "text-muted hover:text-ink hover:bg-surface-2 border border-transparent"
                }`}
              >
                Projects
              </Link>
              <Link
                to="/my-tasks"
                className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center transition-all duration-150 ${
                  location.pathname === "/my-tasks"
                    ? "bg-white text-orange-600 shadow-xs border border-orange-200/60"
                    : "text-muted hover:text-ink hover:bg-surface-2 border border-transparent"
                }`}
              >
                My tasks
              </Link>
              {user?.role === "superadmin" && (
                <Link
                  to="/superadmin"
                  className={`h-7 px-3 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 ${
                    location.pathname === "/superadmin"
                      ? "bg-white text-purple-700 shadow-xs border border-purple-200/70"
                      : "text-muted hover:text-purple-700 hover:bg-purple-50/50 border border-transparent"
                  }`}
                >
                  <ShieldCheck
                    size={13}
                    className={location.pathname === "/superadmin" ? "text-purple-600" : "text-purple-500"}
                  />
                  <span>Super Admin</span>
                </Link>
              )}
            </nav>

            {/* Board Context Indicator (When inside a Board) */}
            {isBoardView && (
              <>
                <div className="hidden md:block w-px h-5 bg-line/80 shrink-0" />

                <div
                  className="min-w-0 h-9 flex items-center gap-2 bg-surface-2/70 hover:bg-surface-2 border border-line/70 rounded-xl px-3 transition-colors shadow-xs"
                  title={board.description ? `${board.title} — ${board.description}` : board.title}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-black/5 shrink-0 shadow-xs"
                    style={{ backgroundColor: board.color || "#EA580C" }}
                  />

                  <h1 className="text-xs sm:text-sm font-semibold text-slate-800 tracking-tight truncate max-w-[160px] sm:max-w-[220px] md:max-w-[280px] lg:max-w-[360px] xl:max-w-[440px]">
                    {board.title}
                  </h1>
                </div>
              </>
            )}
          </div>

          {/* ================= RIGHT SECTION: BOARD ACTIONS & PROFILE ================= */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Board Controls (Visible on Desktop / Tablet when on Board) */}
            {isBoardView && (
              <div className="hidden sm:flex items-center gap-2 lg:gap-2.5">
                {/* Filter Popover */}
                {boardHeaderData.filterGroups && (
                  <FilterPopover
                    groups={boardHeaderData.filterGroups}
                    selected={boardHeaderData.filters}
                    onChange={boardHeaderData.setFilters}
                    onClear={() =>
                      boardHeaderData.setFilters({
                        members: [],
                        priority: [],
                        dueDate: [],
                        labels: [],
                      })
                    }
                    align="right"
                    buttonClassName="h-9 text-xs font-semibold bg-surface hover:bg-orange-50/50 hover:border-orange-300 text-ink border border-line shadow-xs rounded-xl px-3 transition-colors"
                  />
                )}

                {/* Manage Team Button */}
                {boardHeaderData.isManager && (
                  <button
                    type="button"
                    onClick={boardHeaderData.onManageTeam}
                    className="btn-press h-9 text-xs font-semibold text-slate-700 bg-surface hover:bg-orange-50 hover:text-orange-700 hover:border-orange-300 border border-line shadow-xs rounded-xl px-3 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/30 flex items-center gap-1.5 cursor-pointer select-none"
                    title="Manage team members & roles"
                  >
                    <Users size={14} className="shrink-0 text-slate-400 group-hover:text-orange-500" />
                    <span className="hidden lg:inline">Manage team</span>
                    <span className="lg:hidden">Team</span>
                  </button>
                )}

                <div className="w-px h-5 bg-line/80 mx-0.5 shrink-0" />
              </div>
            )}

            {/* ================= USER PROFILE CAPSULE ================= */}
            <div className="relative hidden md:block" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="menu"
                className={`h-9 flex items-center gap-2 pl-1.5 pr-2.5 rounded-xl transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer select-none bg-surface shadow-xs ${
                  profileDropdownOpen
                    ? "bg-orange-50/70 border-orange-300 ring-2 ring-orange-500/20"
                    : "hover:bg-surface-2 border-line/80 hover:border-line"
                }`}
              >
                {/* Avatar Badge */}
                <span
                  className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[11px] font-bold shrink-0 shadow-xs"
                  style={{ backgroundColor: user?.avatarColor || "#EA580C" }}
                >
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>

                {/* User Name */}
                <span className="text-xs font-semibold text-slate-800 max-w-[120px] lg:max-w-[160px] truncate">
                  {user?.name}
                </span>

                {/* Role Pill */}
                {user?.role === "superadmin" ? (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-bold border border-purple-200/80">
                    SUPER ADMIN
                  </span>
                ) : user?.role === "admin" ? (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 font-bold border border-orange-200/60">
                    PM
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200/70">
                    MEMBER
                  </span>
                )}

                {/* Chevron */}
                <ChevronDown
                  size={14}
                  className={`text-slate-400 transition-transform duration-200 ${
                    profileDropdownOpen ? "rotate-180 text-orange-600" : ""
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div
                  role="menu"
                  aria-label="User menu"
                  className="absolute right-0 mt-2 w-64 rounded-2xl bg-surface border border-line shadow-pop p-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-150 text-ink"
                >
                  {/* Header: User Info Card */}
                  <div className="px-3 py-2.5 bg-surface-2/60 rounded-xl mb-1 flex items-center gap-3">
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-xs"
                      style={{ backgroundColor: user?.avatarColor || "#EA580C" }}
                    >
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-ink truncate">{user?.name}</p>
                      <p className="text-[11px] text-muted truncate">{user?.email}</p>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.2 rounded ${
                            user?.role === "superadmin"
                              ? "bg-purple-500/15 text-purple-700 border border-purple-500/30"
                              : user?.role === "admin"
                              ? "bg-orange-500/15 text-orange-700 border border-orange-500/30"
                              : "bg-surface-3 text-ink"
                          }`}
                        >
                          {user?.role === "superadmin"
                            ? "Super Administrator"
                            : user?.role === "admin"
                            ? "Project Manager"
                            : "Employee"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Super Admin Dashboard Link */}
                  {user?.role === "superadmin" && (
                    <Link
                      to="/superadmin"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                    >
                      <ShieldCheck size={15} className="text-purple-600" />
                      <span>Super Admin Dashboard</span>
                    </Link>
                  )}

                  {/* Navigation item inside dropdown */}
                  <Link
                    to="/my-tasks"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-surface-2 transition-colors"
                  >
                    <CheckSquare size={15} className="text-muted" />
                    <span>My Assigned Tasks</span>
                  </Link>

                  {/* Change password button */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowChangePasswordModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-surface-2 transition-colors text-left cursor-pointer"
                  >
                    <KeyRound size={15} className="text-muted" />
                    <span>Change password</span>
                  </button>

                  <div className="h-px bg-line/60 my-1" />

                  {/* Sign out button */}
                  <button
                    type="button"
                    onClick={() => {
                      setProfileDropdownOpen(false);
                      setShowSignoutModal(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
                  >
                    <LogOut size={15} className="text-rose-500" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>

            {/* ================= MOBILE HAMBURGER BUTTON ================= */}
            <div className="flex md:hidden items-center gap-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen((prev) => !prev)}
                aria-label="Toggle navigation menu"
                aria-expanded={mobileMenuOpen}
                className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-2 hover:bg-surface-3 border border-line text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer"
              >
                {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
              </button>
            </div>
          </div>
        </div>

        {/* ================= MOBILE DRAWER MENU ================= */}
        {mobileMenuOpen && (
          <div
            ref={mobileMenuRef}
            className="md:hidden border-t border-line bg-surface px-4 py-4 space-y-4 shadow-pop animate-in slide-in-from-top-2 duration-150"
          >
            {/* User Profile in Mobile Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-line/60">
              <div className="flex items-center gap-3">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-xs"
                  style={{ backgroundColor: user?.avatarColor || "#EA580C" }}
                >
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>
                <div>
                  <p className="text-xs font-bold text-ink">{user?.name}</p>
                  <p className="text-[11px] text-muted">{user?.email}</p>
                </div>
              </div>
              {user?.role === "admin" && (
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-700 border border-orange-500/20">
                  PM
                </span>
              )}
            </div>

            {/* If in Board View on Mobile: show quick actions */}
            {isBoardView && (
              <div className="p-3 bg-surface-2/60 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: board.color || "#EA580C" }}
                    />
                    <span className="text-xs font-bold text-ink truncate max-w-[200px]">
                      {board.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold text-muted">
                    {members.length} member{members.length === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center -space-x-1.5">
                    {visibleMembers.map((m) => (
                      <span
                        key={m.user?._id || m._id}
                        className="w-6 h-6 rounded-full border border-surface flex items-center justify-center text-[9px] text-white font-bold"
                        style={{ backgroundColor: m.user?.avatarColor || "#EA580C" }}
                      >
                        {(m.user?.name?.[0] || "M").toUpperCase()}
                      </span>
                    ))}
                    {extraMembersCount > 0 && (
                      <span className="w-6 h-6 rounded-full border border-surface bg-surface-3 flex items-center justify-center text-[9px] text-ink font-bold shadow-xs">
                        +{extraMembersCount}
                      </span>
                    )}
                  </div>

                  {boardHeaderData.isManager && (
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        boardHeaderData.onManageTeam?.();
                      }}
                      className="text-xs font-semibold text-orange-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Users size={12} />
                      <span>Manage team</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Nav Links */}
            <nav className="space-y-1">
              <Link
                to="/"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  location.pathname === "/"
                    ? "bg-orange-500/10 text-orange-700 font-bold border border-orange-500/20"
                    : "text-muted hover:text-ink hover:bg-surface-2"
                }`}
              >
                <LayoutGrid size={16} />
                <span>Projects</span>
              </Link>
              <Link
                to="/my-tasks"
                onClick={closeMobileMenu}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  location.pathname === "/my-tasks"
                    ? "bg-orange-500/10 text-orange-700 font-bold border border-orange-500/20"
                    : "text-muted hover:text-ink hover:bg-surface-2"
                }`}
              >
                <CheckSquare size={16} />
                <span>My tasks</span>
              </Link>
              {user?.role === "superadmin" && (
                <Link
                  to="/superadmin"
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                    location.pathname === "/superadmin"
                      ? "bg-purple-500/10 text-purple-700 font-bold border border-purple-500/20"
                      : "text-muted hover:text-ink hover:bg-surface-2"
                  }`}
                >
                  <ShieldCheck size={16} className="text-purple-600" />
                  <span>Super Admin Dashboard</span>
                </Link>
              )}
              <button
                type="button"
                onClick={() => {
                  closeMobileMenu();
                  setShowChangePasswordModal(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-muted hover:text-ink hover:bg-surface-2 transition-colors text-left cursor-pointer"
              >
                <KeyRound size={16} />
                <span>Change password</span>
              </button>
            </nav>

            {/* Mobile Logout Button */}
            <div className="pt-2 border-t border-line/60">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowSignoutModal(true);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer"
              >
                <LogOut size={16} />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {showChangePasswordModal && (
        <ChangePasswordModal onClose={() => setShowChangePasswordModal(false)} />
      )}

      <ConfirmationModal
        isOpen={showSignoutModal}
        onClose={() => setShowSignoutModal(false)}
        onConfirm={handleConfirmLogout}
        title="Sign out"
        message="Are you sure you want to sign out of your precise3dm session?"
        confirmText="Sign out"
        cancelText="Stay signed in"
        variant="destructive"
      />
    </>
  );
}
