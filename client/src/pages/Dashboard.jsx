import { useEffect, useState, useMemo } from "react";
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
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useProjects } from "../context/ProjectsContext.jsx";
import { boardBannerGradient } from "../utils/color.js";
import NewProjectModal from "../components/NewProjectModal.jsx";
import InviteMemberModal from "../components/InviteMemberModal.jsx";
import FilterPopover from "../components/ui/FilterPopover.jsx";
import DashboardSkeleton from "../components/ui/DashboardSkeleton.jsx";

export default function Dashboard() {
  const { user } = useAuth();
  const { boards, loading: projectsLoading, fetchBoards } = useProjects();
  const [allUsers, setAllUsers] = useState([]);
  const [filters, setFilters] = useState({ members: [] });
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewProject, setShowNewProject] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Fetch secondary user directory data in the background
  useEffect(() => {
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
  }, []);

  const filterGroups = useMemo(
    () => [
      {
        id: "members",
        title: "Members",
        options: allUsers.map((u) => ({
          value: u._id,
          label: u.name,
          badge: u.role === "admin" ? "PM" : "Employee",
          avatarInitial: u.name?.[0]?.toUpperCase(),
          avatarColor: u.avatarColor || "#EA580C",
        })),
      },
    ],
    [allUsers]
  );

  const isFiltered = filters.members && filters.members.length > 0;

  const filteredBoards = useMemo(() => {
    return boards.filter((board) => {
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
  }, [boards, isFiltered, filters.members, searchQuery]);

  // Only show skeleton while initial projects are loading and we have no cached boards
  if (projectsLoading && boards.length === 0) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-9 animate-in fade-in duration-150">
      {/* ================= HERO & HEADER SECTION ================= */}
      <div className="relative z-20 flex flex-col md:flex-row md:items-center justify-between gap-5 mb-7 sm:mb-9 pb-6 border-b border-line/60">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-orange-500/10 text-orange-700 border border-orange-500/20">
            <Boxes size={12} className="text-orange-600 animate-pulse" />
            <span>Workspace Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-2.5">
            <span>Projects</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 text-muted border border-line">
              {boards.length} {boards.length === 1 ? "Board" : "Boards"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-xl">
            {user?.role === "admin"
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

          {user?.role === "admin" && (
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

      {/* ================= EMPTY STATES ================= */}
      {!projectsLoading && boards.length === 0 && (
        <div className="text-center py-16 sm:py-24 border-2 border-dashed border-line rounded-2xl bg-surface/60 p-8 shadow-xs max-w-2xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 mx-auto mb-4">
            <FolderKanban size={28} className="shrink-0" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-ink">No projects yet</h3>
          <p className="text-xs sm:text-sm text-muted mt-1.5 max-w-md mx-auto leading-relaxed">
            {user?.role === "admin"
              ? "Create your first precise3dm project board to start assigning 3D deliverables, tracking phases, and collaborating with your team."
              : "You haven't been assigned to any workspace projects yet. Contact your project manager."}
          </p>
          {user?.role === "admin" && (
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

      {!projectsLoading && boards.length > 0 && filteredBoards.length === 0 && (
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
          const labelsList = (board.labels || []).slice(0, 3);

          return (
            <Link
              key={board._id}
              to={`/boards/${board._id}`}
              className="group rounded-2xl border border-line/80 bg-surface overflow-hidden hover:border-orange-500/40 hover:shadow-xl hover:shadow-orange-500/10 hover:-translate-y-1 active:translate-y-0 transition-all duration-200 shadow-card flex flex-col relative"
            >
              {/* Card Banner Header with High-Tech Isometric Graphic */}
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

                {/* Top Row: Category Pill & Board Badge */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/15 backdrop-blur-md border border-white/20 text-white shadow-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Active Project</span>
                  </div>

                  <div className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/90 group-hover:bg-white/20 transition-colors">
                    <LayoutGrid size={14} />
                  </div>
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
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between bg-surface">
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-ink group-hover:text-orange-600 transition-colors break-words tracking-tight">
                    {board.title}
                  </h3>

                  {board.description && (
                    <p className="text-xs sm:text-sm text-muted mt-1.5 line-clamp-2 leading-relaxed">
                      {board.description}
                    </p>
                  )}

                  {/* Domain/Label preview chips */}
                  {labelsList.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-3.5">
                      {labelsList.map((lbl, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md border text-slate-700 bg-slate-100/70 border-slate-200/80"
                        >
                          {lbl.name}
                        </span>
                      ))}
                      {board.labels && board.labels.length > 3 && (
                        <span className="text-[10px] text-muted font-medium">
                          +{board.labels.length - 3} more
                        </span>
                      )}
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
                    <span>Open board</span>
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                    />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {showNewProject && (
        <NewProjectModal
          onClose={() => setShowNewProject(false)}
          onCreated={() => fetchBoards(true)}
        />
      )}

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
