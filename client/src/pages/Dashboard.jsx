import { useEffect, useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  FolderKanban,
  Filter,
  ArrowRight,
  Search,
  Boxes,
  Sparkles,
  Users,
  Layers,
  CheckCircle2,
  X,
  LayoutGrid,
  UserPlus,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit3,
  MoreVertical,
  Calendar,
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { boardBannerGradient } from "../utils/color.js";
import NewProjectModal from "../components/NewProjectModal.jsx";
import EditProjectModal from "../components/EditProjectModal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import InviteMemberModal from "../components/InviteMemberModal.jsx";
import FilterPopover from "../components/ui/FilterPopover.jsx";
import DashboardSkeleton from "../components/ui/DashboardSkeleton.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const { boards, loading: projectsLoading, fetchBoards } = useProjects();
  const [archivedBoards, setArchivedBoards] = useState([]);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("active"); // 'active' | 'archived'

  const [allUsers, setAllUsers] = useState([]);
  const [filters, setFilters] = useState({ members: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [editingBoard, setEditingBoard] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // 3-dots action menu on cards
  const [openMenuBoardId, setOpenMenuBoardId] = useState(null);

  // Confirmation modal state for archive, delete, and restore
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'archive' | 'delete' | 'restore'
    board: null,
    loading: false,
  });

  const canManageProjects = user?.role === "admin" || user?.role === "superadmin";

  // Fetch archived boards
  const fetchArchivedBoards = useCallback(async () => {
    try {
      setArchivedLoading(true);
      const res = await api.get("/boards/archived");
      setArchivedBoards(res.data);
    } catch (err) {
      console.error("Failed to load archived projects:", err);
    } finally {
      setArchivedLoading(false);
    }
  }, []);

  // Initial fetch of archived boards and secondary users
  useEffect(() => {
    fetchArchivedBoards();

    const controller = new AbortController();
    api
      .get("/auth/users", { signal: controller.signal, silentRequest: true })
      .then((res) => setAllUsers(res.data))
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          // ignore secondary fetch failure
        }
      });

    return () => {
      controller.abort();
    };
  }, [fetchArchivedBoards]);

  // Close card action menu on outside clicks
  useEffect(() => {
    if (!openMenuBoardId) return;
    const handleOutsideClick = () => setOpenMenuBoardId(null);
    window.addEventListener("click", handleOutsideClick);
    return () => window.removeEventListener("click", handleOutsideClick);
  }, [openMenuBoardId]);

  const filterGroups = useMemo(
    () => [
      {
        id: "members",
        title: "Members",
        options: allUsers.map((u) => ({
          value: u._id,
          label: u.name,
          badge: u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "PM" : "Employee",
          avatarInitial: u.name?.[0]?.toUpperCase(),
          avatarColor: u.avatarColor || "#EA580C",
        })),
      },
    ],
    [allUsers]
  );

  const isFiltered = filters.members && filters.members.length > 0;

  // Select board list based on active tab
  const currentBoardsList = activeTab === "active" ? boards : archivedBoards;

  const filteredBoards = useMemo(() => {
    return currentBoardsList.filter((board) => {
      // Member filter
      if (isFiltered) {
        const hasMember = board.members?.some((m) =>
          filters.members.includes(m.user?._id || m.user)
        );
        if (!hasMember) return false;
      }

      // Search text query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = board.title?.toLowerCase().includes(query);
        const matchDesc = board.description?.toLowerCase().includes(query);
        if (!matchTitle && !matchDesc) return false;
      }

      return true;
    });
  }, [currentBoardsList, isFiltered, filters.members, searchQuery]);

  // Handle confirmation action execution
  const handleConfirmAction = async () => {
    if (!confirmModal.board) return;
    const boardId = confirmModal.board._id;
    const boardTitle = confirmModal.board.title;
    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      if (confirmModal.type === "archive") {
        await api.patch(`/boards/${boardId}/archive`);
        toast.success(`Project "${boardTitle}" archived successfully.`, { title: "Archived" });
      } else if (confirmModal.type === "restore") {
        await api.patch(`/boards/${boardId}/restore`);
        toast.success(`Project "${boardTitle}" restored to Active Projects.`, { title: "Restored" });
      } else if (confirmModal.type === "delete") {
        await api.delete(`/boards/${boardId}`);
        toast.success(`Project "${boardTitle}" deleted successfully.`, { title: "Deleted" });
      }

      setConfirmModal({ isOpen: false, type: null, board: null, loading: false });
      await Promise.all([fetchBoards(true), fetchArchivedBoards()]);
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${confirmModal.type} project.`;
      toast.error(msg, { title: "Error" });
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  // Only show skeleton while initial projects are loading and we have no cached boards
  if (projectsLoading && boards.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9 animate-in fade-in duration-150">
      {/* ================= HERO & HEADER SECTION ================= */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-5 mb-6 pb-6 border-b border-line/60">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-orange-500/10 text-orange-700 border border-orange-500/20">
            <Boxes size={12} className="text-orange-600 animate-pulse" />
            <span>Workspace Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-2.5">
            <span>Projects</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 text-muted border border-line">
              {boards.length} Active
            </span>
            {archivedBoards.length > 0 && (
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 border border-amber-500/20">
                {archivedBoards.length} Archived
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            {canManageProjects
              ? "Oversee 3D engineering deliverables, track milestones, and manage team boards."
              : "Access your assigned project boards, deliverables, and engineering tasks."}
          </p>
        </div>

        {/* Action Controls & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-3 flex-wrap">
          {/* Quick Search */}
          <div className="relative min-w-[200px] sm:w-64">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects…"
              className="w-full rounded-xl bg-surface border border-line pl-9 pr-8 py-2 text-xs sm:text-sm text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5 rounded-md"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <FilterPopover
            groups={filterGroups}
            selected={filters}
            onChange={setFilters}
            onClear={() => setFilters({ members: [] })}
            align="right"
          />

          {canManageProjects && (
            <>
              <button
                type="button"
                onClick={() => setShowInviteModal(true)}
                className="btn-press bg-surface hover:bg-orange-50/60 hover:border-orange-300 text-slate-700 hover:text-orange-700 border border-line text-xs sm:text-sm font-semibold rounded-xl px-3.5 py-2.5 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer select-none"
                title="Invite new employee or manager by email"
              >
                <UserPlus size={15} className="text-orange-600 shrink-0" />
                <span>Invite Member</span>
              </button>

              <button
                type="button"
                onClick={() => setShowNewProject(true)}
                className="btn-press bg-gradient-to-r from-orange-500 via-orange-600 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:from-orange-700 active:to-orange-800 text-white text-xs sm:text-sm font-semibold rounded-xl px-4 py-2.5 transition-all shadow-md shadow-orange-500/20 hover:shadow-orange-500/30 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-orange-500/40 touch-manipulation flex items-center gap-2 cursor-pointer"
              >
                <Plus size={16} className="shrink-0" />
                <span>New Project</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ================= SECTION TABS: ACTIVE VS ARCHIVED ================= */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`h-9 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "active"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-surface hover:bg-surface-2 text-muted hover:text-ink border border-line"
          }`}
        >
          <LayoutGrid size={14} />
          <span>Active Projects</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "active" ? "bg-white/20 text-white" : "bg-surface-2 text-muted"
            }`}
          >
            {boards.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("archived")}
          className={`h-9 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "archived"
              ? "bg-amber-600 text-white shadow-sm"
              : "bg-surface hover:bg-surface-2 text-muted hover:text-ink border border-line"
          }`}
        >
          <Archive size={14} />
          <span>Archived Projects</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === "archived" ? "bg-white/20 text-white" : "bg-surface-2 text-muted"
            }`}
          >
            {archivedBoards.length}
          </span>
        </button>
      </div>

      {/* ================= EMPTY STATES ================= */}
      {/* 1. Active Tab Empty */}
      {activeTab === "active" && !projectsLoading && boards.length === 0 && (
        <div className="text-center py-16 sm:py-24 border-2 border-dashed border-line rounded-2xl bg-surface/60 p-8 shadow-xs max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 mx-auto mb-4">
            <FolderKanban size={28} className="shrink-0" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-ink">No active projects</h3>
          <p className="text-xs sm:text-sm text-muted mt-1.5 max-w-md mx-auto leading-relaxed">
            {canManageProjects
              ? "Create your first precise3dm project board to start assigning 3D deliverables, tracking phases, and collaborating with your team."
              : "You haven't been assigned to any workspace projects yet. Contact your project manager."}
          </p>
          {canManageProjects && (
            <button
              type="button"
              onClick={() => setShowNewProject(true)}
              className="mt-5 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white text-xs sm:text-sm font-semibold rounded-xl px-5 py-2.5 transition-all shadow-md shadow-orange-500/20 inline-flex items-center gap-2 cursor-pointer"
            >
              <Plus size={16} className="shrink-0" />
              <span>Create First Project</span>
            </button>
          )}
        </div>
      )}

      {/* 2. Archived Tab Empty */}
      {activeTab === "archived" && !archivedLoading && archivedBoards.length === 0 && (
        <div className="text-center py-16 sm:py-24 border-2 border-dashed border-line rounded-2xl bg-surface/60 p-8 shadow-xs max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 mx-auto mb-4">
            <Archive size={28} className="shrink-0" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-ink">No archived projects</h3>
          <p className="text-xs sm:text-sm text-muted mt-1.5 max-w-md mx-auto leading-relaxed">
            Completed or retired projects that you archive will be preserved and organized here. You can easily restore them back to active at any time.
          </p>
        </div>
      )}

      {/* 3. Search/Filter Empty */}
      {currentBoardsList.length > 0 && filteredBoards.length === 0 && (
        <div className="text-center py-16 sm:py-20 border border-dashed border-line rounded-2xl bg-surface/60 p-8 shadow-xs max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-surface-2 flex items-center justify-center text-muted mx-auto mb-3">
            <Filter size={24} className="text-muted shrink-0" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-ink">No matching projects</h3>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No projects match "${searchQuery}". Try a different keyword.`
              : "None of your projects include the selected members."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="bg-surface hover:bg-surface-2 border border-line text-ink text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
              >
                Clear search
              </button>
            )}
            {isFiltered && (
              <button
                type="button"
                onClick={() => setFilters({ members: [] })}
                className="bg-accent hover:bg-accent-dark text-white text-xs font-semibold rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
              >
                Clear filter
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= PROJECT CARDS GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
        {filteredBoards.map((board) => {
          const membersList = board.members || [];
          const isArchived = Boolean(board.archived);

          return (
            <div
              key={board._id}
              className="group rounded-2xl border border-line/80 bg-surface overflow-hidden hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 shadow-card flex flex-col relative"
            >
              {/* Card Banner Header */}
              <div
                className="h-28 sm:h-32 relative overflow-hidden p-4 sm:p-5 flex flex-col justify-between border-b border-line/40 text-white"
                style={{ background: boardBannerGradient(board.color) }}
              >
                {/* 3D Grid Overlay & Ambient Light */}
                <div
                  className="absolute inset-0 opacity-20 pointer-events-none"
                  style={{
                    backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.4) 1px, transparent 1px)`,
                    backgroundSize: `16px 16px`,
                  }}
                />
                <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-white/10 blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                {/* Top Row: Category Pill & Project Action Menu */}
                <div className="relative z-10 flex items-center justify-between">
                  {isArchived ? (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/25 backdrop-blur-md border border-amber-300/30 text-amber-100 shadow-xs">
                      <Archive size={11} className="text-amber-300" />
                      <span>Archived</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span>Active Project</span>
                    </div>
                  )}

                  {/* Actions for Admin and Super Admin */}
                  {canManageProjects && (
                    <div className="relative">
                      {isArchived ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmModal({
                                isOpen: true,
                                type: "restore",
                                board,
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/20 text-white text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                            title="Restore project to active"
                          >
                            <ArchiveRestore size={12} />
                            <span>Restore</span>
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setConfirmModal({
                                isOpen: true,
                                type: "delete",
                                board,
                              });
                            }}
                            className="w-7 h-7 rounded-lg bg-rose-500/20 hover:bg-rose-500/35 backdrop-blur-md border border-rose-300/30 flex items-center justify-center text-rose-100 hover:text-white transition-all cursor-pointer shadow-xs"
                            title="Delete project"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ) : (
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setOpenMenuBoardId(openMenuBoardId === board._id ? null : board._id);
                            }}
                            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/25 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 hover:text-white transition-colors cursor-pointer"
                            title="Project actions"
                            aria-label="Project actions"
                          >
                            <MoreVertical size={14} />
                          </button>

                          {/* 3-dots Dropdown Menu */}
                          {openMenuBoardId === board._id && (
                            <div
                              className="absolute right-0 top-8 z-30 w-44 rounded-xl bg-surface border border-line p-1 shadow-pop text-ink animate-in fade-in zoom-in-95"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuBoardId(null);
                                  setEditingBoard(board);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-ink hover:bg-surface-2 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit3 size={14} className="text-muted" />
                                <span>Edit Project</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuBoardId(null);
                                  setConfirmModal({
                                    isOpen: true,
                                    type: "archive",
                                    board,
                                  });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Archive size={14} className="text-amber-600" />
                                <span>Archive Project</span>
                              </button>

                              <div className="h-px bg-line/60 my-1" />

                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuBoardId(null);
                                  setConfirmModal({
                                    isOpen: true,
                                    type: "delete",
                                    board,
                                  });
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={14} className="text-rose-500" />
                                <span>Delete Project</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Row inside banner: Live metadata */}
                <div className="relative z-10 flex items-center gap-3 text-[11px] text-white/80 font-medium">
                  <span className="flex items-center gap-1">
                    <Layers size={12} className="text-white/70" />
                    <span>4 Lists</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users size={12} className="text-white/70" />
                    <span>{membersList.length} Team {membersList.length === 1 ? "Member" : "Members"}</span>
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <Link
                to={`/boards/${board._id}`}
                className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-surface focus:outline-none"
              >
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-ink group-hover:text-orange-600 transition-colors break-words tracking-tight">
                    {board.title}
                  </h3>

                  {board.description && (
                    <p className="text-xs sm:text-sm text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {board.description}
                    </p>
                  )}

                  {board.dueDate && (
                    <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-surface-2 text-slate-700 border border-line shadow-xs">
                      <Calendar size={13} className="text-orange-600 shrink-0" />
                      <span>
                        Due {new Date(board.dueDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-between mt-5 pt-3.5 border-t border-line/60">
                  {/* Stacked Member Avatars */}
                  <div className="flex items-center -space-x-2">
                    {membersList.slice(0, 4).map((m) => {
                      const u = m.user || {};
                      return (
                        <span
                          key={u._id || Math.random()}
                          title={u.name || "Member"}
                          className="w-7 h-7 rounded-full border-2 border-surface flex items-center justify-center text-[10px] text-white font-bold shadow-xs transition-transform group-hover:scale-105"
                          style={{ backgroundColor: u.avatarColor || "#EA580C" }}
                        >
                          {u.name?.[0]?.toUpperCase() || "M"}
                        </span>
                      );
                    })}
                    {membersList.length > 4 && (
                      <span className="w-7 h-7 rounded-full border-2 border-surface bg-surface-3 flex items-center justify-center text-[10px] text-ink font-bold shadow-xs">
                        +{membersList.length - 4}
                      </span>
                    )}
                  </div>

                  {/* Open Board Action */}
                  <div className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 group-hover:text-orange-700 transition-colors">
                    <span>{isArchived ? "View archived" : "Open board"}</span>
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </Link>
            </div>
          );
        })}
      </div>

      {/* New Project Modal */}
      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => {
            fetchBoards(true);
            fetchArchivedBoards();
          }}
        />
      )}

      {/* Edit Project Modal */}
      {editingBoard && (
        <EditProjectModal
          board={editingBoard}
          onClose={() => setEditingBoard(null)}
          onUpdated={() => {
            fetchBoards(true);
            fetchArchivedBoards();
          }}
        />
      )}

      {/* Confirmation Modal for Delete, Archive, Restore */}
      {confirmModal.isOpen && confirmModal.board && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: null, board: null, loading: false })}
          onConfirm={handleConfirmAction}
          loading={confirmModal.loading}
          variant={
            confirmModal.type === "delete"
              ? "destructive"
              : confirmModal.type === "archive"
              ? "warning"
              : "primary"
          }
          title={
            confirmModal.type === "archive"
              ? `Archive "${confirmModal.board.title}"?`
              : confirmModal.type === "delete"
              ? `Delete "${confirmModal.board.title}"?`
              : `Restore "${confirmModal.board.title}"?`
          }
          message={
            confirmModal.type === "archive"
              ? `Are you sure you want to archive "${confirmModal.board.title}"? It will be moved to the Archived Projects section and hidden from the active dashboard. You can restore it at any time.`
              : confirmModal.type === "delete"
              ? `Are you sure you want to delete "${confirmModal.board.title}"? It will be removed from normal views. All project data and history are preserved safely in the database via soft delete and remain recoverable.`
              : `Are you sure you want to restore "${confirmModal.board.title}"? It will be moved back to the Active Projects dashboard.`
          }
          confirmText={
            confirmModal.type === "archive"
              ? "Archive Project"
              : confirmModal.type === "delete"
              ? "Delete Project"
              : "Restore Project"
          }
        />
      )}

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal
          onClose={() => setShowInviteModal(false)}
          onInvited={(newUser) => {
            setAllUsers((prev) => [...prev, newUser]);
          }}
        />
      )}
    </div>
  );
}
