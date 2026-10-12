import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  CheckSquare,
  ShieldCheck,
  Plus,
  FolderKanban,
  Boxes,
  Search,
  X,
  ChevronUp,
  Users,
  Calendar,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import NewProjectModal from "./NewProjectModal.jsx";

// Fixed floating bottom navigation bar inspired by modern floating pill docks
// with clean distinct styling, centered "+ Add Project" action, and interactive projects popup cards
export default function ProjectSwitcherBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { boards, loading, fetchBoards } = useProjects();

  const [showProjectsPopup, setShowProjectsPopup] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Extract active board id if on /boards/:id
  const matchBoard = location.pathname.match(/^\/boards\/([^/]+)/);
  const activeBoardId = matchBoard ? matchBoard[1] : null;
  const activeBoard = useMemo(
    () => boards.find((b) => b._id === activeBoardId),
    [boards, activeBoardId]
  );

  // Guarantee projects are loaded if user enters directly
  useEffect(() => {
    if (user && boards.length === 0 && !loading) {
      fetchBoards();
    }
  }, [user, boards.length, loading, fetchBoards]);

  // Close popup cards on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowProjectsPopup(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter projects inside the popup cards
  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return boards;
    const q = searchQuery.toLowerCase().trim();
    return boards.filter(
      (b) =>
        b.title?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q)
    );
  }, [boards, searchQuery]);

  const handleAddProjectClick = () => {
    setShowProjectsPopup(false);
    if (user?.role && user.role !== "admin" && user.role !== "superadmin") {
      toast.warning("Only workspace administrators can create new projects.", {
        title: "Admin Only",
      });
      return;
    }
    setShowNewProject(true);
  };

  return (
    <>
      {/* ================= FIXED FLOATING BOTTOM DOCK ================= */}
      <aside
        id="floating-bottom-dock"
        aria-label="Floating bottom navigation bar"
        className="fixed bottom-2.5 xs:bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-[45] max-w-[calc(100vw-8px)] xs:max-w-[calc(100vw-16px)] sm:max-w-fit pointer-events-auto"
      >
        <div className="flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 md:gap-2 px-1 xs:px-2 sm:px-3 md:px-4 py-1 xs:py-1.5 rounded-full bg-slate-900 text-slate-200 border border-slate-800 shadow-2xl shadow-slate-950/60 select-none max-w-full overflow-hidden">
          {/* 1. Projects (Dashboard) Navigation Button */}
          <button
            type="button"
            id="nav-projects-button"
            onClick={() => {
              setShowProjectsPopup(false);
              navigate("/");
            }}
            className={`flex items-center gap-1 xs:gap-1.5 px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer touch-manipulation shrink-0 ${
              location.pathname === "/"
                ? "bg-slate-800 text-white shadow-xs border border-slate-700/80 ring-1 ring-white/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
            title="Projects Dashboard"
          >
            <LayoutGrid
              size={13}
              className={`xs:w-3.5 xs:h-3.5 ${location.pathname === "/" ? "text-orange-400" : "text-slate-400"}`}
            />
            <span className="hidden sm:inline">Projects</span>
          </button>

          {/* 2. My Tasks Navigation Button */}
          <button
            type="button"
            id="nav-tasks-button"
            onClick={() => {
              setShowProjectsPopup(false);
              navigate("/my-tasks");
            }}
            className={`flex items-center gap-1 xs:gap-1.5 px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer touch-manipulation shrink-0 ${
              location.pathname === "/my-tasks"
                ? "bg-slate-800 text-white shadow-xs border border-slate-700/80 ring-1 ring-white/10"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
            title="My Assigned Tasks"
          >
            <CheckSquare
              size={13}
              className={`xs:w-3.5 xs:h-3.5 ${location.pathname === "/my-tasks" ? "text-orange-400" : "text-slate-400"}`}
            />
            <span className="hidden sm:inline">Tasks</span>
          </button>

          {/* Superadmin Link (if applicable) */}
          {user?.role === "superadmin" && (
            <button
              type="button"
              id="nav-admin-button"
              onClick={() => {
                setShowProjectsPopup(false);
                navigate("/superadmin");
              }}
              className={`flex items-center gap-1 xs:gap-1.5 px-1.5 xs:px-2 sm:px-2.5 md:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer touch-manipulation shrink-0 ${
                location.pathname === "/superadmin"
                  ? "bg-purple-950/70 text-purple-200 border border-purple-700/60 shadow-xs"
                  : "text-slate-400 hover:text-purple-300 hover:bg-slate-800/60"
              }`}
              title="Super Admin Workspace"
            >
              <ShieldCheck size={13} className="xs:w-3.5 xs:h-3.5 text-purple-400" />
              <span className="hidden md:inline">Admin</span>
            </button>
          )}

          {/* ================= 3. CENTERED "+ ADD PROJECT" BUTTON ================= */}
          <button
            type="button"
            id="nav-add-project-button"
            onClick={handleAddProjectClick}
            className="btn-press flex items-center gap-0.5 xs:gap-1 sm:gap-1.5 px-2 xs:px-2.5 sm:px-3.5 md:px-4 py-1 xs:py-1.5 rounded-full bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:from-orange-700 text-white font-semibold text-[11px] xs:text-xs sm:text-sm shadow-md shadow-orange-500/30 transition-all cursor-pointer touch-manipulation shrink-0"
            title="Create a new project"
          >
            <Plus size={12} className="shrink-0 stroke-[2.5]" />
            <span className="font-bold whitespace-nowrap tracking-normal hidden xs:inline">Add Project</span>
            <span className="font-bold whitespace-nowrap tracking-normal xs:hidden">Add</span>
          </button>

          {/* ================= 4. VERTICAL DIVIDER ================= */}
          <div className="h-3.5 xs:h-4 sm:h-5 w-px bg-slate-700/80 mx-0.5 sm:mx-1 shrink-0" />

          {/* ================= 5. PROJECTS CARDS SWITCHER BUTTON ================= */}
          <button
            type="button"
            id="nav-projects-switcher-button"
            onClick={() => setShowProjectsPopup((prev) => !prev)}
            aria-expanded={showProjectsPopup}
            aria-haspopup="dialog"
            className={`flex items-center gap-1 xs:gap-1.5 md:gap-2 px-1 xs:px-1.5 sm:px-2.5 md:px-3 py-1 xs:py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer touch-manipulation shrink min-w-0 ${
              showProjectsPopup
                ? "bg-orange-500/20 text-orange-400 border border-orange-500/40 shadow-xs"
                : "text-slate-300 hover:text-white hover:bg-slate-800/80"
            }`}
            title="Browse all projects as popup cards"
          >
            {activeBoard ? (
              <>
                <span
                  className="w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full shrink-0 ring-2 ring-white/10"
                  style={{ backgroundColor: activeBoard.color || "#0C66E4" }}
                />
                <span className="max-w-[34px] xs:max-w-[65px] sm:max-w-[120px] md:max-w-[150px] truncate text-[11px] xs:text-xs">
                  {activeBoard.title}
                </span>
              </>
            ) : (
              <>
                <FolderKanban size={13} className="text-orange-400 shrink-0" />
                <span className="hidden sm:inline">All Projects</span>
                <span className="sm:hidden text-[11px] xs:text-xs">Projects</span>
              </>
            )}
            <span className="hidden xs:inline-block px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-800 text-orange-400 border border-slate-700 shrink-0">
              {boards.length}
            </span>
            <ChevronUp
              size={12}
              className={`xs:w-3.5 xs:h-3.5 transition-transform duration-200 shrink-0 ${
                showProjectsPopup ? "rotate-180 text-orange-400" : "text-slate-400"
              }`}
            />
          </button>
        </div>
      </aside>

      {/* ================= PROJECTS POPUP CARDS ================= */}
      {showProjectsPopup && (
        <>
          {/* Backdrop (solid dim overlay, no glass blur) */}
          <div
            className="fixed inset-0 bg-slate-900/60 z-[50] animate-in fade-in duration-150"
            onClick={() => setShowProjectsPopup(false)}
          />

          {/* Popup Card Container (Solid opaque pure white, no glass blur) */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Projects popup cards"
            style={{ backgroundColor: "#ffffff" }}
            className="fixed bottom-16 xs:bottom-20 sm:bottom-22 left-1/2 -translate-x-1/2 z-[60] w-[calc(100vw-12px)] xs:w-[95vw] sm:w-[90vw] max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-2xl p-2.5 xs:p-4 sm:p-5 text-slate-900 animate-in slide-in-from-bottom-3 zoom-in-95 duration-200 flex flex-col max-h-[76vh] sm:max-h-[80vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2.5 xs:pb-3.5 border-b border-slate-200 gap-1.5 xs:gap-2 mb-2.5 xs:mb-3">
              <div className="flex items-center gap-1.5 xs:gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 xs:w-9 xs:h-9 rounded-lg xs:rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600 shrink-0 shadow-xs">
                  <Boxes size={16} className="xs:w-[18px] xs:h-[18px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 xs:gap-2 min-w-0">
                    <h3 className="font-bold text-xs xs:text-sm sm:text-base text-slate-900 truncate">Workspace Projects</h3>
                    <span className="hidden xs:inline-block text-[10px] xs:text-[11px] font-bold px-1.5 xs:px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                      {boards.length} Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 hidden sm:block">
                    Click any project card to open its workspace board
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 xs:gap-1.5 shrink-0">
                {(user?.role === "admin" || user?.role === "superadmin") && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowProjectsPopup(false);
                      setShowNewProject(true);
                    }}
                    className="btn-press bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-[11px] xs:text-xs font-semibold rounded-lg xs:rounded-xl px-2 xs:px-2.5 sm:px-3 py-1 xs:py-1.5 shadow-xs transition-all flex items-center gap-1 cursor-pointer shrink-0"
                  >
                    <Plus size={12} className="xs:w-[13px] xs:h-[13px]" />
                    <span className="hidden sm:inline">New Project</span>
                    <span className="sm:hidden">New</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowProjectsPopup(false)}
                  aria-label="Close projects popup"
                  className="w-7 h-7 xs:w-8 xs:h-8 flex items-center justify-center rounded-lg xs:rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Quick Search Input with generous padding so text never collides with icon */}
            <div className="relative mb-3.5">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400">
                <Search size={16} className="stroke-[2.2]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by title or description..."
                className="w-full h-10 sm:h-11 rounded-xl bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-orange-500 pl-10 sm:pl-11 pr-9 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search query"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer transition-colors"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Grid of Project Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 overflow-y-auto pr-1 flex-1 min-h-[160px] max-h-[50vh]">
              {filteredProjects.length === 0 ? (
                <div className="col-span-full py-10 text-center text-slate-500 text-xs sm:text-sm">
                  {searchQuery ? `No projects matching "${searchQuery}"` : "No active projects found"}
                </div>
              ) : (
                filteredProjects.map((board) => {
                  const isActive = board._id === activeBoardId;
                  const memberCount = (board.members || []).length;
                  return (
                    <div
                      key={board._id}
                      role="button"
                      tabIndex={0}
                      data-project-id={board._id}
                      onClick={() => {
                        setShowProjectsPopup(false);
                        navigate(`/boards/${board._id}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          setShowProjectsPopup(false);
                          navigate(`/boards/${board._id}`);
                        }
                      }}
                      style={{ backgroundColor: isActive ? undefined : "#ffffff" }}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all cursor-pointer touch-manipulation group flex flex-col justify-between relative overflow-hidden select-none ${
                        isActive
                          ? "bg-orange-50/70 border-orange-300 ring-2 ring-orange-500/20 shadow-xs"
                          : "bg-white hover:bg-slate-50/80 border-slate-200 hover:border-orange-300 shadow-xs hover:shadow-sm"
                      }`}
                    >
                      {/* Top Accent Strip */}
                      <div
                        className="absolute top-0 left-0 right-0 h-1"
                        style={{ backgroundColor: board.color || "#F97316" }}
                      />

                      <div className="pt-0.5">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-orange-600 transition-colors truncate">
                            {board.title}
                          </span>
                          {isActive && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-orange-600 text-white shrink-0 shadow-xs">
                              Current
                            </span>
                          )}
                        </div>
                        {board.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                            {board.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 mt-2">
                        <div className="flex items-center gap-1.5">
                          <Users size={12} className="text-slate-400" />
                          <span>
                            {memberCount} {memberCount === 1 ? "member" : "members"}
                          </span>
                        </div>
                        {board.dueDate && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500">
                            <Calendar size={11} className="text-orange-600" />
                            <span>
                              {new Date(board.dueDate).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })}
                            </span>
                          </div>
                        )}
                        <span className="text-[11px] font-semibold text-orange-600 group-hover:text-orange-700 group-hover:translate-x-0.5 transition-all flex items-center gap-0.5 ml-auto">
                          Open →
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* ================= NEW PROJECT MODAL ================= */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => fetchBoards(true)}
        />
      )}
    </>
  );
}
