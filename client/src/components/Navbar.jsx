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
  Layers,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useBoardHeader } from "../context/BoardHeaderContext.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import FilterPopover from "./ui/FilterPopover.jsx";

export default function Navbar() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showSignoutModal, setShowSignoutModal] = useState(false);

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
  const members = board?.members || [];
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
            <nav className="hidden md:flex items-center p-1 bg-surface-2/90 rounded-xl border border-line/70 shadow-xs shrink-0">
              <Link
                to="/"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  location.pathname === "/"
                    ? "bg-white text-orange-600 shadow-xs border border-orange-200/60"
                    : "text-muted hover:text-ink hover:bg-surface-2 border border-transparent"
                }`}
              >
                Projects
              </Link>
              <Link
                to="/my-tasks"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
                  location.pathname === "/my-tasks"
                    ? "bg-white text-orange-600 shadow-xs border border-orange-200/60"
                    : "text-muted hover:text-ink hover:bg-surface-2 border border-transparent"
                }`}
              >
                My tasks
              </Link>
            </nav>

            {/* Board Context Indicator (When inside a Board) */}
            {isBoardView && (
              <>
                <div className="hidden lg:block w-px h-6 bg-line/80 shrink-0" />

                <div className="min-w-0 flex items-center gap-2.5 bg-surface-2/50 border border-line/60 rounded-xl px-2.5 sm:px-3 py-1">
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-2 ring-orange-500/20 shrink-0 shadow-xs"
                    style={{ backgroundColor: board.color || "#EA580C" }}
                  />

                  <div className="min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-2">
                      <h1
                        className="text-xs sm:text-sm font-bold text-ink tracking-tight truncate max-w-[140px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[300px] xl:max-w-[380px]"
                        title={board.title}
                      >
                        {board.title}
                      </h1>
                      <span className="hidden xl:inline-flex text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-200/70">
                        3D Project
                      </span>
                    </div>

                    {board.description ? (
                      <p
                        className="text-[10px] sm:text-[11px] text-muted truncate max-w-[140px] sm:max-w-[200px] md:max-w-[240px] lg:max-w-[300px] xl:max-w-[380px] leading-none"
                        title={board.description}
                      >
                        {board.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ================= RIGHT SECTION: BOARD ACTIONS & PROFILE ================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
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

                {/* Team Avatars Cluster */}
                {members.length > 0 && (
                  <div
                    className="flex items-center bg-surface-2/70 border border-line/70 px-2 py-1 rounded-xl gap-1"
                    title={`${members.length} team member${members.length === 1 ? "" : "s"}`}
                  >
                    <div className="flex items-center -space-x-1.5 hover:space-x-0.5 transition-all duration-200">
                      {visibleMembers.map((m) => (
                        <span
                          key={m.user._id || m._id}
                          title={`${m.user.name} (${m.role === "manager" ? "Manager" : "Member"})`}
                          className="w-6.5 h-6.5 rounded-full border-2 border-surface flex items-center justify-center text-[10px] text-white font-bold shadow-xs transition-transform hover:scale-110 hover:z-10 cursor-default"
                          style={{ backgroundColor: m.user.avatarColor || "#EA580C" }}
                        >
                          {m.user.name?.[0]?.toUpperCase()}
                        </span>
                      ))}
                      {extraMembersCount > 0 && (
                        <span
                          title={`${extraMembersCount} more members`}
                          className="w-6.5 h-6.5 rounded-full border-2 border-surface bg-surface-3 flex items-center justify-center text-[9px] text-ink font-bold shadow-xs cursor-default"
                        >
                          +{extraMembersCount}
                        </span>
                      )}
                    </div>
                  </div>
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

                <div className="w-px h-6 bg-line/80 ml-0.5 shrink-0" />
              </div>
            )}

            {/* ================= USER PROFILE CAPSULE ================= */}
            <div className="relative hidden md:block" ref={profileMenuRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen((prev) => !prev)}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="menu"
                className={`flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-xl transition-all duration-150 border focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer select-none bg-surface shadow-xs ${
                  profileDropdownOpen
                    ? "bg-orange-50/70 border-orange-300 ring-2 ring-orange-500/20"
                    : "hover:bg-surface-2 border-line/80 hover:border-line"
                }`}
              >
                {/* Avatar Badge */}
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs ring-2 ring-white/40"
                  style={{ backgroundColor: user?.avatarColor || "#EA580C" }}
                >
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </span>

                {/* User Name */}
                <span className="text-xs sm:text-sm font-semibold text-slate-800 max-w-[120px] lg:max-w-[150px] truncate">
                  {user?.name}
                </span>

                {/* Role Pill */}
                {user?.role === "admin" ? (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-700 font-bold border border-orange-500/20">
                    PM
                  </span>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-bold border border-slate-200">
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
                            user?.role === "admin"
                              ? "bg-orange-500/15 text-orange-700 border border-orange-500/30"
                              : "bg-surface-3 text-ink"
                          }`}
                        >
                          {user?.role === "admin" ? "Project Manager" : "Employee"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Navigation item inside dropdown */}
                  <Link
                    to="/my-tasks"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-ink hover:bg-surface-2 transition-colors"
                  >
                    <CheckSquare size={15} className="text-muted" />
                    <span>My Assigned Tasks</span>
                  </Link>

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
                        key={m.user._id || m._id}
                        className="w-6 h-6 rounded-full border border-surface flex items-center justify-center text-[9px] text-white font-bold"
                        style={{ backgroundColor: m.user.avatarColor || "#EA580C" }}
                      >
                        {m.user.name?.[0]?.toUpperCase()}
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
