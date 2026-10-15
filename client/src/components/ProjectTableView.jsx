import { useState, useMemo, useEffect, useCallback, Fragment } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Filter,
  X,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  Users,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit3,
  ExternalLink,
  Clock,
  AlertCircle,
  FolderKanban,
  CheckCircle2,
  Layers,
  ChevronRight,
  ChevronDown,
  Check,
  CheckSquare,
  Tag,
  Loader2,
  UserCheck,
} from "lucide-react";
import api from "../api/axios.js";
import { useToast } from "../context/ToastContext.jsx";
import { boardBannerGradient } from "../utils/color.js";
import CardModal from "./CardModal.jsx";

const priorityBadge = {
  high: "bg-rose-50 text-rose-700 border-rose-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-surface-2 text-stone-600 border-line",
};

const getListBadgeStyle = (listTitle = "") => {
  const lower = listTitle.toLowerCase();
  if (lower.includes("done") || lower.includes("completed")) {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (lower.includes("review") || lower.includes("qa") || lower.includes("testing")) {
    return "bg-purple-50 text-purple-700 border-purple-200";
  }
  if (lower.includes("progress") || lower.includes("doing") || lower.includes("active")) {
    return "bg-blue-50 text-blue-700 border-blue-200";
  }
  return "bg-surface-2 text-slate-700 border-line";
};

export default function ProjectTableView({
  activeBoards = [],
  archivedBoards = [],
  allUsers = [],
  globalSearchQuery = "",
  globalMemberFilters = [],
  onClearGlobalMembers,
  onUpdateGlobalMembers,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  canManageProjects = false,
}) {
  const toast = useToast();

  // Local table filters
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'active' | 'archived'
  const [localMemberFilter, setLocalMemberFilter] = useState("all"); // 'all' | userId
  const [dateFilter, setDateFilter] = useState("all"); // 'all' | 'overdue' | 'this_week' | 'has_date' | 'no_date'
  const [localSearch, setLocalSearch] = useState("");

  // Sorting
  const [sortField, setSortField] = useState("createdAt"); // 'title' | 'status' | 'members' | 'dueDate' | 'createdAt'
  const [sortOrder, setSortOrder] = useState("desc"); // 'asc' | 'desc'

  // Card Modal state for viewing/editing a card directly from the table
  const [modalCardId, setModalCardId] = useState(null);
  const [modalBoardId, setModalBoardId] = useState(null);

  // Collapsed / expanded projects state for cards view
  const [collapsedProjectIds, setCollapsedProjectIds] = useState(new Set());

  // Cards assigned to selected members
  const [assignedCards, setAssignedCards] = useState([]);
  const [cardsLoading, setCardsLoading] = useState(false);

  // Active selected member IDs (combines global filter popover with local dropdown)
  const activeSelectedMemberIds = useMemo(() => {
    const ids = new Set();
    if (Array.isArray(globalMemberFilters)) {
      globalMemberFilters.forEach((id) => {
        if (id) ids.add(id.toString());
      });
    }
    if (localMemberFilter && localMemberFilter !== "all") {
      ids.add(localMemberFilter.toString());
    }
    return Array.from(ids);
  }, [globalMemberFilters, localMemberFilter]);

  const isMembersFilterActive = activeSelectedMemberIds.length > 0;

  // Fetch cards assigned to the selected members
  const fetchAssignedCards = useCallback(async (memberIds, signal) => {
    if (!memberIds || memberIds.length === 0) {
      setAssignedCards([]);
      return;
    }

    try {
      setCardsLoading(true);
      const res = await api.get(`/cards?members=${memberIds.join(",")}`, { signal });
      setAssignedCards(res.data || []);
    } catch (err) {
      if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
        console.error("Failed to load cards for selected members:", err);
      }
    } finally {
      setCardsLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (isMembersFilterActive) {
      fetchAssignedCards(activeSelectedMemberIds, controller.signal);
    } else {
      setAssignedCards([]);
    }
    return () => controller.abort();
  }, [isMembersFilterActive, activeSelectedMemberIds, fetchAssignedCards]);

  // Combine active and archived boards
  const allBoards = useMemo(() => {
    return [
      ...activeBoards.map((b) => ({ ...b, statusType: "active" })),
      ...archivedBoards.map((b) => ({ ...b, statusType: "archived" })),
    ];
  }, [activeBoards, archivedBoards]);

  // Combined search term
  const effectiveSearch = (localSearch || globalSearchQuery || "").trim().toLowerCase();

  // Filter the boards
  const filteredBoards = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysLater = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    return allBoards.filter((board) => {
      const isArchived = Boolean(board.archived);

      // 1. Status Filter
      if (statusFilter === "active" && isArchived) return false;
      if (statusFilter === "archived" && !isArchived) return false;

      // 2. Members Filter
      if (isMembersFilterActive) {
        // Project matches if:
        // - At least one of the selected members is a member of the project, OR
        // - At least one task card in this project is assigned to the selected members
        const isProjectMember = board.members?.some((m) => {
          const mId = (m.user?._id || m.user || "").toString();
          return activeSelectedMemberIds.includes(mId);
        });

        const hasCardInProject = assignedCards.some((c) => {
          const cardBoardId = (c.board?._id || c.board || "").toString();
          return cardBoardId === board._id.toString();
        });

        if (!isProjectMember && !hasCardInProject) return false;
      }

      // 3. Due Date Filter
      if (dateFilter !== "all") {
        if (dateFilter === "no_date") {
          if (board.dueDate) return false;
        } else if (dateFilter === "has_date") {
          if (!board.dueDate) return false;
        } else if (dateFilter === "overdue") {
          if (!board.dueDate || isArchived) return false;
          const due = new Date(board.dueDate);
          if (due >= today) return false;
        } else if (dateFilter === "this_week") {
          if (!board.dueDate) return false;
          const due = new Date(board.dueDate);
          if (due < today || due > sevenDaysLater) return false;
        }
      }

      // 4. Text Search
      if (effectiveSearch) {
        const matchTitle = board.title?.toLowerCase().includes(effectiveSearch);
        const matchDesc = board.description?.toLowerCase().includes(effectiveSearch);
        const matchMember = board.members?.some((m) =>
          m.user?.name?.toLowerCase().includes(effectiveSearch)
        );
        const matchCard = assignedCards.some((c) => {
          const cardBoardId = (c.board?._id || c.board || "").toString();
          return (
            cardBoardId === board._id.toString() &&
            c.title?.toLowerCase().includes(effectiveSearch)
          );
        });

        if (!matchTitle && !matchDesc && !matchMember && !matchCard) return false;
      }

      return true;
    });
  }, [
    allBoards,
    statusFilter,
    isMembersFilterActive,
    activeSelectedMemberIds,
    assignedCards,
    dateFilter,
    effectiveSearch,
  ]);

  // Sort the boards
  const sortedBoards = useMemo(() => {
    return [...filteredBoards].sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "title":
          comparison = (a.title || "").localeCompare(b.title || "");
          break;
        case "status": {
          const aStatus = a.archived ? "archived" : "active";
          const bStatus = b.archived ? "archived" : "active";
          comparison = aStatus.localeCompare(bStatus);
          break;
        }
        case "members": {
          const aLen = a.members?.length || 0;
          const bLen = b.members?.length || 0;
          comparison = aLen - bLen;
          break;
        }
        case "dueDate": {
          if (!a.dueDate && !b.dueDate) comparison = 0;
          else if (!a.dueDate) comparison = 1;
          else if (!b.dueDate) comparison = -1;
          else comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
          break;
        }
        case "createdAt":
        default: {
          const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          comparison = aTime - bTime;
          break;
        }
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredBoards, sortField, sortOrder]);

  // Toggle sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortOrder(field === "title" ? "asc" : "desc");
    }
  };

  const getSortIcon = (field) => {
    if (sortField !== field) {
      return <ArrowUpDown size={12} className="opacity-40" />;
    }
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="text-orange-600" />
    ) : (
      <ArrowDown size={12} className="text-orange-600" />
    );
  };

  // Toggle collapsing of a project's task cards section
  const toggleProjectCollapse = (projectId) => {
    setCollapsedProjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  // Expanded cards state for mobile/tablet dropdown cards view
  const [expandedMobileCardIds, setExpandedMobileCardIds] = useState(new Set());

  // Toggle expanding/collapsing of mobile dropdown cards
  const toggleMobileCard = (projectId) => {
    setExpandedMobileCardIds((prev) => {
      const next = new Set(prev);
      if (next.has(projectId)) {
        next.delete(projectId);
      } else {
        next.add(projectId);
      }
      return next;
    });
  };

  const allMobileExpanded =
    sortedBoards.length > 0 &&
    sortedBoards.every((b) => expandedMobileCardIds.has(b._id));

  const toggleAllMobile = () => {
    if (allMobileExpanded) {
      setExpandedMobileCardIds(new Set());
    } else {
      setExpandedMobileCardIds(new Set(sortedBoards.map((b) => b._id)));
    }
  };

  // Toggle card completion status
  const handleToggleCard = async (e, card) => {
    e.preventDefault();
    e.stopPropagation();
    const prevCompleted = card.completed;
    const nextCompleted = !card.completed;

    // Optimistic update
    setAssignedCards((prev) =>
      prev.map((c) => (c._id === card._id ? { ...c, completed: nextCompleted } : c))
    );

    try {
      await api.patch(`/cards/${card._id}`, { completed: nextCompleted });
      if (nextCompleted) {
        toast.success(`Marked "${card.title}" complete`, { title: "Completed" });
      }
    } catch (err) {
      // Revert on failure
      setAssignedCards((prev) =>
        prev.map((c) => (c._id === card._id ? { ...c, completed: prevCompleted } : c))
      );
      toast.error(err.response?.data?.message || "Failed to update card status");
    }
  };

  // Check if any filter is active
  const hasActiveFilters =
    statusFilter !== "all" ||
    isMembersFilterActive ||
    dateFilter !== "all" ||
    Boolean(localSearch);

  // Clear all filters
  const clearAllFilters = () => {
    setStatusFilter("all");
    setLocalMemberFilter("all");
    setDateFilter("all");
    setLocalSearch("");
    onClearGlobalMembers?.();
  };

  // Get selected member objects for labels
  const selectedMemberObjects = useMemo(() => {
    return allUsers.filter((u) => activeSelectedMemberIds.includes(u._id.toString()));
  }, [allUsers, activeSelectedMemberIds]);

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* ================= FILTER & SEARCH TOOLBAR ================= */}
      <div className="bg-surface rounded-2xl border border-line p-3 sm:p-5 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 bg-surface-2 rounded-xl border border-line/60 self-start sm:self-auto overflow-x-auto max-w-full scrollbar-none">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                statusFilter === "all"
                  ? "bg-white text-ink shadow-xs border border-line/40 font-bold"
                  : "text-muted hover:text-ink"
              }`}
            >
              All Projects ({allBoards.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("active")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                statusFilter === "active"
                  ? "bg-white text-emerald-700 shadow-xs border border-line/40 font-bold"
                  : "text-muted hover:text-ink"
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active ({activeBoards.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter("archived")}
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 shrink-0 ${
                statusFilter === "archived"
                  ? "bg-white text-amber-700 shadow-xs border border-line/40 font-bold"
                  : "text-muted hover:text-ink"
              }`}
            >
              <Archive size={11} className="text-amber-600" />
              Archived ({archivedBoards.length})
            </button>
          </div>

          {/* Controls: Search + Dropdown Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-2.5 w-full lg:w-auto">
            {/* Quick in-table search */}
            <div className="relative w-full sm:w-48 md:w-56">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search table or tasks…"
                className="w-full rounded-xl bg-surface-2 border border-line pl-8 pr-7 py-1.5 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-xs"
              />
              {localSearch && (
                <button
                  type="button"
                  onClick={() => setLocalSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-ink p-0.5 rounded-md"
                  aria-label="Clear table search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Quick Member Filter Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={localMemberFilter}
                onChange={(e) => {
                  const val = e.target.value;
                  setLocalMemberFilter(val);
                  if (val === "all") {
                    onClearGlobalMembers?.();
                  } else {
                    onUpdateGlobalMembers?.([val]);
                  }
                }}
                className={`w-full sm:w-auto rounded-xl border px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-xs cursor-pointer ${
                  isMembersFilterActive
                    ? "bg-orange-500/10 text-orange-800 border-orange-500/30 font-semibold"
                    : "bg-surface-2 text-ink border-line"
                }`}
              >
                <option value="all">
                  {isMembersFilterActive
                    ? `Members Filtered (${activeSelectedMemberIds.length})`
                    : `Filter by Member (${allUsers.length})`}
                </option>
                {allUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "PM" : "Employee"})
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date Filter */}
            <div className="relative w-full sm:w-auto">
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full sm:w-auto rounded-xl bg-surface-2 border border-line px-3 py-1.5 text-xs font-medium text-ink focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all shadow-xs cursor-pointer"
              >
                <option value="all">All Deadlines</option>
                <option value="overdue">Overdue Deadlines</option>
                <option value="this_week">Due This Week</option>
                <option value="has_date">Has Due Date</option>
                <option value="no_date">No Due Date</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-xl bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 text-xs font-semibold border border-orange-500/20 transition-all cursor-pointer w-full sm:w-auto"
                title="Reset all filters and restore full project list"
              >
                <X size={12} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Pill Bar & Live Status */}
        <div className="mt-3 pt-3 border-t border-line/60 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-muted font-medium">
              Showing <span className="font-bold text-ink">{sortedBoards.length}</span> of {allBoards.length} projects
            </span>

            {/* Members Filter Active Notice with Task Cards Count */}
            {isMembersFilterActive && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-orange-500/10 text-orange-800 border border-orange-500/25 text-[11px] font-semibold">
                <UserCheck size={12} className="text-orange-600" />
                <span>
                  Members:{" "}
                  <strong>
                    {selectedMemberObjects.length === 1
                      ? selectedMemberObjects[0].name
                      : `${selectedMemberObjects.length} selected`}
                  </strong>
                </span>
                <span className="ml-1 text-[10px] bg-orange-500/20 text-orange-900 px-1.5 py-0.2 rounded-full font-bold">
                  {cardsLoading ? (
                    <Loader2 size={10} className="animate-spin inline" />
                  ) : (
                    `${assignedCards.length} assigned task${assignedCards.length === 1 ? "" : "s"}`
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setLocalMemberFilter("all");
                    onClearGlobalMembers?.();
                  }}
                  className="hover:text-rose-600 p-0.5 ml-0.5 cursor-pointer"
                  title="Clear members filter and restore all projects"
                >
                  <X size={11} />
                </button>
              </span>
            )}

            {statusFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-2 border border-line text-[11px] font-medium text-slate-700">
                Status: <strong className="capitalize">{statusFilter}</strong>
                <button
                  type="button"
                  onClick={() => setStatusFilter("all")}
                  className="hover:text-rose-600 p-0.5 cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {dateFilter !== "all" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-2 border border-line text-[11px] font-medium text-slate-700">
                Due: <strong className="capitalize">{dateFilter.replace("_", " ")}</strong>
                <button
                  type="button"
                  onClick={() => setDateFilter("all")}
                  className="hover:text-rose-600 p-0.5 cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            )}

            {effectiveSearch && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-2 border border-line text-[11px] font-medium text-slate-700">
                Search: <strong>&ldquo;{effectiveSearch}&rdquo;</strong>
                <button
                  type="button"
                  onClick={() => setLocalSearch("")}
                  className="hover:text-rose-600 p-0.5 cursor-pointer"
                >
                  <X size={10} />
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isMembersFilterActive && (
              <button
                type="button"
                onClick={() => {
                  setLocalMemberFilter("all");
                  onClearGlobalMembers?.();
                }}
                className="text-xs font-semibold text-orange-600 hover:text-orange-700 underline cursor-pointer"
              >
                Clear Members Filter
              </button>
            )}
            <span className="text-[11px] text-muted hidden sm:inline">
              Click headers to sort
            </span>
          </div>
        </div>
      </div>

      {/* ================= TABLE CONTAINER ================= */}
      {sortedBoards.length === 0 ? (
        <div className="text-center py-16 sm:py-20 border-2 border-dashed border-line rounded-2xl bg-surface/80 p-8 shadow-xs max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 mx-auto mb-3">
            <Filter size={22} className="shrink-0" />
          </div>
          <h3 className="text-base font-bold text-ink">No projects match the selected filter</h3>
          <p className="text-xs sm:text-sm text-muted mt-1 max-w-sm mx-auto">
            {isMembersFilterActive
              ? "None of the projects or tasks are currently assigned to the selected member(s)."
              : "Try adjusting your search or deadline criteria to see more results."}
          </p>
          <button
            type="button"
            onClick={clearAllFilters}
            className="mt-4 bg-surface hover:bg-surface-2 border border-line text-ink text-xs font-semibold rounded-xl px-4 py-2 transition-all cursor-pointer shadow-xs"
          >
            Clear all filters & restore list
          </button>
        </div>
      ) : (
        <>
          <div className="hidden lg:block rounded-2xl border border-line bg-surface shadow-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-2/70 text-[11px] font-bold uppercase tracking-wider text-muted select-none">
                  <th
                    className="py-3.5 pl-6 pr-4 cursor-pointer hover:text-ink transition-colors w-[32%] min-w-[220px]"
                    onClick={() => handleSort("title")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Project</span>
                      {getSortIcon("title")}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 cursor-pointer hover:text-ink transition-colors whitespace-nowrap w-[110px]"
                    onClick={() => handleSort("status")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      {getSortIcon("status")}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 cursor-pointer hover:text-ink transition-colors whitespace-nowrap w-[150px]"
                    onClick={() => handleSort("members")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Team Members</span>
                      {getSortIcon("members")}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 cursor-pointer hover:text-ink transition-colors whitespace-nowrap w-[140px]"
                    onClick={() => handleSort("dueDate")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Deadline</span>
                      {getSortIcon("dueDate")}
                    </div>
                  </th>
                  <th
                    className="py-3.5 px-3 cursor-pointer hover:text-ink transition-colors whitespace-nowrap w-[110px]"
                    onClick={() => handleSort("createdAt")}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Created</span>
                      {getSortIcon("createdAt")}
                    </div>
                  </th>
                  <th className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap w-[180px]">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-line/60 text-xs text-ink">
                {sortedBoards.map((board) => {
                  const isArchived = Boolean(board.archived);
                  const membersList = board.members || [];
                  const now = new Date();
                  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                  const dueDateObj = board.dueDate ? new Date(board.dueDate) : null;
                  const isOverdue = dueDateObj && !isArchived && dueDateObj < today;

                  // Tasks belonging to this board that are assigned to the selected members
                  const projectAssignedCards = isMembersFilterActive
                    ? assignedCards.filter(
                        (c) => (c.board?._id || c.board || "").toString() === board._id.toString()
                      )
                    : [];

                  const isCollapsed = collapsedProjectIds.has(board._id);

                  return (
                    <Fragment key={board._id}>
                      {/* ================= PRIMARY PROJECT ROW ================= */}
                      <tr
                        className={`hover:bg-surface-2/40 transition-colors group border-b border-line/60 ${
                          isMembersFilterActive && projectAssignedCards.length > 0
                            ? "bg-orange-50/15"
                            : ""
                        }`}
                      >
                        {/* 1. Project Title & Description */}
                        <td className="py-3.5 pl-6 pr-4">
                          <div className="flex items-start gap-3">
                            {/* Color bar */}
                            <div
                              className="w-2.5 h-10 rounded-full shrink-0 mt-0.5 shadow-xs"
                              style={{ background: boardBannerGradient(board.color) }}
                            />

                            <div className="min-w-0 max-w-sm sm:max-w-md">
                              <div className="flex items-center gap-2">
                                <Link
                                  to={`/boards/${board._id}`}
                                  className="font-bold text-sm text-ink group-hover:text-orange-600 transition-colors hover:underline truncate"
                                  title={board.title}
                                >
                                  {board.title}
                                </Link>

                                {/* When filtered by members, show badge indicating associated task cards */}
                                {isMembersFilterActive && (
                                  projectAssignedCards.length > 0 ? (
                                    <button
                                      type="button"
                                      onClick={() => toggleProjectCollapse(board._id)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-700 hover:bg-orange-500/25 border border-orange-500/30 transition-all cursor-pointer shrink-0"
                                      title={isCollapsed ? "Expand assigned tasks" : "Collapse assigned tasks"}
                                    >
                                      <CheckSquare size={11} className="shrink-0" />
                                      <span>
                                        {projectAssignedCards.length}{" "}
                                        {projectAssignedCards.length === 1 ? "task" : "tasks"}
                                      </span>
                                      {isCollapsed ? (
                                        <ChevronRight size={11} />
                                      ) : (
                                        <ChevronDown size={11} />
                                      )}
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-2 text-muted border border-line shrink-0">
                                      <span>0 tasks</span>
                                    </span>
                                  )
                                )}
                              </div>

                              {board.description ? (
                                <p className="text-[11px] text-muted truncate mt-0.5 max-w-xs sm:max-w-sm">
                                  {board.description}
                                </p>
                              ) : (
                                <span className="text-[11px] text-muted/60 italic">
                                  No description
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* 2. Status Badge */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {isArchived ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-500/20">
                              <Archive size={11} className="text-amber-600" />
                              <span>Archived</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-800 border border-emerald-500/20">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span>Active</span>
                            </span>
                          )}
                        </td>

                        {/* 3. Team Members */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-2">
                              {membersList.slice(0, 3).map((m) => {
                                const u = m.user || {};
                                const isMemberSelected = activeSelectedMemberIds.includes(
                                  (u._id || m.user || "").toString()
                                );
                                return (
                                  <span
                                    key={u._id || Math.random()}
                                    title={`${u.name || "Member"}${
                                      u.role ? ` (${u.role})` : ""
                                    }`}
                                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] text-white font-bold shadow-xs transition-transform ${
                                      isMemberSelected
                                        ? "ring-2 ring-orange-500 scale-110 z-10 border-white"
                                        : "border-surface ring-1 ring-black/5"
                                    }`}
                                    style={{
                                      backgroundColor: u.avatarColor || "#EA580C",
                                    }}
                                  >
                                    {u.name?.[0]?.toUpperCase() || "M"}
                                  </span>
                                );
                              })}
                              {membersList.length > 3 && (
                                <span className="w-7 h-7 rounded-full border-2 border-surface bg-surface-2 text-muted flex items-center justify-center text-[10px] font-bold shadow-xs">
                                  +{membersList.length - 3}
                                </span>
                              )}
                            </div>

                            <span className="text-[11px] text-muted font-medium">
                              {membersList.length}{" "}
                              {membersList.length === 1 ? "member" : "members"}
                            </span>
                          </div>
                        </td>

                        {/* 4. Due Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap">
                          {dueDateObj ? (
                            <div className="inline-flex items-center gap-1.5">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border shadow-xs ${
                                  isOverdue
                                    ? "bg-rose-50 text-rose-700 border-rose-200"
                                    : "bg-surface-2 text-slate-700 border-line"
                                }`}
                              >
                                {isOverdue ? (
                                  <AlertCircle size={12} className="text-rose-600 shrink-0" />
                                ) : (
                                  <Calendar size={12} className="text-orange-600 shrink-0" />
                                )}
                                <span>
                                  {dueDateObj.toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  })}
                                </span>
                              </span>
                              {isOverdue && (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">
                                  Overdue
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted/60 text-[11px] italic">
                              No deadline
                            </span>
                          )}
                        </td>

                        {/* 5. Created Date */}
                        <td className="py-3.5 px-3 whitespace-nowrap text-muted text-[11px]">
                          {board.createdAt
                            ? new Date(board.createdAt).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })
                            : "—"}
                        </td>

                        {/* 6. Action Controls */}
                        <td className="py-3.5 pl-3 pr-6 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 justify-end">
                            <Link
                              to={`/boards/${board._id}`}
                              className="h-7 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                              title="Open project board"
                            >
                              <span>Open</span>
                              <ChevronRight size={13} />
                            </Link>

                            {canManageProjects && (
                              <div className="inline-flex items-center gap-0.5 bg-surface-2 p-0.5 rounded-lg border border-line/70">
                                {!isArchived ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => onEdit?.(board)}
                                      className="w-6 h-6 rounded-md hover:bg-white text-muted hover:text-ink hover:shadow-2xs transition-all flex items-center justify-center cursor-pointer"
                                      title="Edit project details"
                                    >
                                      <Edit3 size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => onArchive?.(board)}
                                      className="w-6 h-6 rounded-md hover:bg-amber-100/60 text-muted hover:text-amber-700 transition-all flex items-center justify-center cursor-pointer"
                                      title="Archive project"
                                    >
                                      <Archive size={13} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => onRestore?.(board)}
                                    className="w-6 h-6 rounded-md hover:bg-emerald-100/60 text-muted hover:text-emerald-700 transition-all flex items-center justify-center cursor-pointer"
                                    title="Restore project to active"
                                  >
                                    <ArchiveRestore size={13} />
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => onDelete?.(board)}
                                  className="w-6 h-6 rounded-md hover:bg-rose-100/60 text-muted hover:text-rose-600 transition-all flex items-center justify-center cursor-pointer"
                                  title="Delete project"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* ================= ASSOCIATED TASK CARDS ROW (ONLY WHEN MEMBERS FILTERED & TASKS EXIST) ================= */}
                      {isMembersFilterActive && projectAssignedCards.length > 0 && !isCollapsed && (
                        <tr className="bg-gradient-to-b from-orange-50/20 to-surface-2/30 border-b border-line/60">
                          <td colSpan={6} className="p-0 border-t border-line/40">
                            <div className="pl-6 sm:pl-10 pr-4 sm:pr-6 py-3.5 space-y-2.5">
                              {/* Subheader */}
                              <div className="flex items-center justify-between gap-2 text-[11px] font-semibold text-slate-700">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                                  <span className="uppercase tracking-wider text-orange-950 font-bold">
                                    Assigned Task Cards
                                  </span>
                                  <span className="text-muted">
                                    ({projectAssignedCards.length}{" "}
                                    {projectAssignedCards.length === 1 ? "task" : "tasks"} for selected member(s))
                                  </span>
                                </div>

                                <Link
                                  to={`/boards/${board._id}`}
                                  className="text-[11px] font-medium text-orange-600 hover:text-orange-700 inline-flex items-center gap-1 hover:underline"
                                >
                                  <span>View board tasks</span>
                                  <ExternalLink size={11} />
                                </Link>
                              </div>

                              {/* Task Cards List */}
                              {projectAssignedCards.length === 0 ? (
                                <div className="py-3 px-4 rounded-xl bg-white border border-line/80 text-center text-xs text-muted">
                                  No task cards currently assigned to the selected member(s) in this project.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {projectAssignedCards.map((card) => {
                                    const cardDue = card.dueDate ? new Date(card.dueDate) : null;
                                    const isCardOverdue = cardDue && !card.completed && cardDue < today;

                                    return (
                                      <div
                                        key={card._id}
                                        onClick={() => {
                                          setModalCardId(card._id);
                                          setModalBoardId(board._id);
                                        }}
                                        className="group/card flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-line hover:border-orange-400/50 hover:shadow-md transition-all duration-150 cursor-pointer"
                                      >
                                        {/* Left: Checkbox + Title + List Badge */}
                                        <div className="flex items-center gap-3 min-w-0">
                                          {/* Completed Toggle Button */}
                                          <button
                                            type="button"
                                            aria-checked={Boolean(card.completed)}
                                            onClick={(e) => handleToggleCard(e, card)}
                                            className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                                              card.completed
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "border-slate-300 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-emerald-600"
                                            }`}
                                            title={card.completed ? "Mark incomplete" : "Mark complete"}
                                          >
                                            <Check
                                              size={12}
                                              strokeWidth={3}
                                              className={card.completed ? "opacity-100" : "opacity-0 group-hover/card:opacity-60"}
                                            />
                                          </button>

                                          <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span
                                                className={`font-semibold text-xs transition-colors break-words ${
                                                  card.completed
                                                    ? "line-through text-muted"
                                                    : "text-ink group-hover/card:text-orange-600"
                                                }`}
                                              >
                                                {card.title}
                                              </span>

                                              {/* Stage / List Badge */}
                                              {card.list?.title && (
                                                <span
                                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${getListBadgeStyle(
                                                    card.list.title
                                                  )}`}
                                                >
                                                  {card.list.title}
                                                </span>
                                              )}
                                            </div>

                                            {card.description && (
                                              <p className="text-[11px] text-muted truncate mt-0.5 max-w-md">
                                                {card.description}
                                              </p>
                                            )}
                                          </div>
                                        </div>

                                        {/* Right: Due Date + Priority + Assigned Members */}
                                        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto pl-8 sm:pl-0">
                                          {/* Priority Badge */}
                                          {card.priority && (
                                            <span
                                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                                                priorityBadge[card.priority] || priorityBadge.low
                                              }`}
                                            >
                                              {card.priority}
                                            </span>
                                          )}

                                          {/* Due Date */}
                                          {cardDue && (
                                            <span
                                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${
                                                isCardOverdue
                                                  ? "bg-rose-50 text-rose-700 border-rose-200"
                                                  : "bg-surface-2 text-slate-700 border-line"
                                              }`}
                                            >
                                              {isCardOverdue ? (
                                                <AlertCircle size={11} className="text-rose-600" />
                                              ) : (
                                                <Calendar size={11} className="text-orange-600" />
                                              )}
                                              <span>
                                                {cardDue.toLocaleDateString(undefined, {
                                                  month: "short",
                                                  day: "numeric",
                                                })}
                                              </span>
                                            </span>
                                          )}

                                          {/* Card Assignees Avatar Stack */}
                                          {card.assignees && card.assignees.length > 0 && (
                                            <div className="flex items-center -space-x-1.5">
                                              {card.assignees.map((assignee) => {
                                                const isHighlighted = activeSelectedMemberIds.includes(
                                                  (assignee._id || assignee).toString()
                                                );
                                                return (
                                                  <span
                                                    key={assignee._id || Math.random()}
                                                    title={assignee.name || "Assignee"}
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[9px] text-white font-bold shadow-xs ${
                                                      isHighlighted
                                                        ? "ring-2 ring-orange-500 scale-110 z-10 border-white"
                                                        : "border-white"
                                                    }`}
                                                    style={{
                                                      backgroundColor:
                                                        assignee.avatarColor || "#EA580C",
                                                    }}
                                                  >
                                                    {assignee.name?.[0]?.toUpperCase() || "A"}
                                                  </span>
                                                );
                                              })}
                                            </div>
                                          )}

                                          <ChevronRight
                                            size={14}
                                            className="text-muted group-hover/card:text-orange-600 group-hover/card:translate-x-0.5 transition-all"
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* ================= MOBILE & TABLET DROPDOWN CARDS VIEW (UP TO 1024px / DOWN TO 320px) ================= */}
        <div className="block lg:hidden space-y-3">
          {/* Mobile Controls Bar */}
          <div className="flex items-center justify-between gap-2 px-1 text-xs">
            <div className="flex items-center gap-1.5 text-muted">
              <span className="font-bold text-ink">{sortedBoards.length}</span>
              <span>{sortedBoards.length === 1 ? "project" : "projects"}</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile Sorting */}
              <div className="flex items-center gap-1">
                <span className="text-[11px] text-muted hidden sm:inline">Sort:</span>
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="text-xs bg-surface border border-line rounded-lg px-2 py-1 text-ink focus:outline-none focus:ring-1 focus:ring-orange-500 font-medium cursor-pointer shadow-2xs"
                >
                  <option value="createdAt">Created</option>
                  <option value="title">Project</option>
                  <option value="status">Status</option>
                  <option value="members">Members</option>
                  <option value="dueDate">Deadline</option>
                </select>
                <button
                  type="button"
                  onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}
                  className="p-1.5 rounded-lg bg-surface border border-line hover:bg-surface-2 text-ink cursor-pointer shadow-2xs"
                  title={sortOrder === "asc" ? "Ascending order" : "Descending order"}
                  aria-label={sortOrder === "asc" ? "Ascending order" : "Descending order"}
                >
                  {sortOrder === "asc" ? (
                    <ArrowUp size={12} className="text-orange-600" />
                  ) : (
                    <ArrowDown size={12} className="text-orange-600" />
                  )}
                </button>
              </div>

              {/* Expand/Collapse All */}
              <button
                type="button"
                onClick={toggleAllMobile}
                className="text-[11px] font-semibold text-orange-600 hover:text-orange-700 whitespace-nowrap cursor-pointer px-1.5 py-1 rounded hover:bg-orange-50 transition-colors"
              >
                {allMobileExpanded ? "Collapse All" : "Expand All"}
              </button>
            </div>
          </div>

          {/* List of Mobile Dropdown Cards */}
          <div className="space-y-2.5">
            {sortedBoards.map((board) => {
              const isArchived = Boolean(board.archived);
              const membersList = board.members || [];
              const now = new Date();
              const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
              const dueDateObj = board.dueDate ? new Date(board.dueDate) : null;
              const isOverdue = dueDateObj && !isArchived && dueDateObj < today;

              const projectAssignedCards = isMembersFilterActive
                ? assignedCards.filter(
                    (c) => (c.board?._id || c.board || "").toString() === board._id.toString()
                  )
                : [];

              const isExpanded = expandedMobileCardIds.has(board._id);

              return (
                <div
                  key={board._id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden bg-surface shadow-2xs ${
                    isExpanded
                      ? "border-orange-500/40 shadow-sm ring-1 ring-orange-500/10"
                      : "border-line hover:border-line/80"
                  } ${
                    isMembersFilterActive && projectAssignedCards.length > 0 ? "bg-orange-50/10" : ""
                  }`}
                >
                  {/* Card Header - Clickable dropdown toggle */}
                  <div
                    onClick={() => toggleMobileCard(board._id)}
                    className="p-3 sm:p-4 cursor-pointer hover:bg-surface-2/30 transition-colors select-none"
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleMobileCard(board._id);
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      {/* Left: Color Bar + Title + Badges */}
                      <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div
                          className="w-2 sm:w-2.5 h-9 sm:h-10 rounded-full shrink-0 mt-0.5 shadow-xs"
                          style={{ background: boardBannerGradient(board.color) }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Link
                              to={`/boards/${board._id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-bold text-sm text-ink hover:text-orange-600 transition-colors line-clamp-1"
                              title={board.title}
                            >
                              {board.title}
                            </Link>
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                                isArchived
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isArchived ? "bg-amber-500" : "bg-emerald-500"
                                }`}
                              />
                              <span>{isArchived ? "Archived" : "Active"}</span>
                            </span>
                          </div>

                          {/* Collapsed metadata summary */}
                          <div className="flex items-center gap-2 mt-1.5 text-[11px] text-muted flex-wrap">
                            <span className="flex items-center gap-1">
                              <Users size={11} className="shrink-0" />
                              <span>
                                {membersList.length} {membersList.length === 1 ? "member" : "members"}
                              </span>
                            </span>
                            <span>•</span>
                            {dueDateObj ? (
                              <span
                                className={`flex items-center gap-1 ${
                                  isOverdue ? "text-rose-600 font-semibold" : ""
                                }`}
                              >
                                <Calendar size={11} className="shrink-0" />
                                <span>
                                  Due {dueDateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                                </span>
                              </span>
                            ) : (
                              <span className="italic text-muted/60">No deadline</span>
                            )}

                            {isMembersFilterActive && (
                              projectAssignedCards.length > 0 ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-700 border border-orange-500/30">
                                  <CheckSquare size={10} />
                                  <span>{projectAssignedCards.length} tasks</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.2 rounded-full text-[10px] bg-surface-2 text-muted border border-line">
                                  0 tasks
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Open & Dropdown Chevron */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-1">
                        <Link
                          to={`/boards/${board._id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="h-7 px-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold inline-flex items-center gap-1 shadow-xs transition-colors shrink-0"
                          title="Open project board"
                        >
                          <span>Open</span>
                          <ChevronRight size={12} />
                        </Link>

                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-200 ${
                            isExpanded
                              ? "bg-orange-500/15 text-orange-700 rotate-180"
                              : "bg-surface-2 hover:bg-surface-3 text-muted hover:text-ink"
                          }`}
                          aria-label={isExpanded ? "Collapse project details" : "Expand project details"}
                        >
                          <ChevronDown size={15} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dropdown Card Body (Accordion Details) */}
                  {isExpanded && (
                    <div className="px-3 sm:px-4 pb-3.5 pt-1 border-t border-line/60 bg-surface-2/30 space-y-3 text-xs animate-in slide-in-from-top-1 duration-150">
                      {/* Description */}
                      {board.description && (
                        <p className="text-muted text-xs leading-relaxed bg-surface p-2.5 rounded-xl border border-line/50">
                          {board.description}
                        </p>
                      )}

                      {/* 2-Column Metadata Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-surface border border-line/50 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                            Deadline
                          </span>
                          {dueDateObj ? (
                            <div className="flex items-center gap-1.5 font-medium text-slate-800">
                              {isOverdue ? (
                                <AlertCircle size={13} className="text-rose-600 shrink-0" />
                              ) : (
                                <Calendar size={13} className="text-orange-600 shrink-0" />
                              )}
                              <span className={isOverdue ? "text-rose-600 font-bold" : ""}>
                                {dueDateObj.toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </span>
                              {isOverdue && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 ml-1">
                                  Overdue
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted/60 italic text-[11px]">No deadline set</span>
                          )}
                        </div>

                        <div className="p-2.5 rounded-xl bg-surface border border-line/50 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                            Created Date
                          </span>
                          <span className="font-medium text-slate-800 text-[11px]">
                            {board.createdAt
                              ? new Date(board.createdAt).toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "—"}
                          </span>
                        </div>
                      </div>

                      {/* Team Members List */}
                      <div className="p-2.5 rounded-xl bg-surface border border-line/50 space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                          Team Members ({membersList.length})
                        </span>
                        {membersList.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {membersList.map((m) => {
                              const u = m.user || {};
                              return (
                                <div
                                  key={u._id || m._id}
                                  className="inline-flex items-center gap-1.5 pl-1 pr-2.5 py-0.5 rounded-full bg-surface-2 border border-line text-[11px]"
                                >
                                  <span
                                    className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0 shadow-2xs"
                                    style={{ background: u.avatarColor || "#EA580C" }}
                                  >
                                    {u.name?.[0]?.toUpperCase() || "U"}
                                  </span>
                                  <span className="font-medium text-slate-800 truncate max-w-[130px]">
                                    {u.name || "Member"}
                                  </span>
                                  {u.role && (
                                    <span className="text-[9px] text-muted capitalize">
                                      • {u.role === "superadmin" ? "Admin" : u.role}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-muted/60 italic text-[11px]">No members assigned</span>
                        )}
                      </div>

                      {/* Action Toolbar */}
                      {canManageProjects && (
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-line/50 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">
                            Manage Project
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {!isArchived ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => onEdit?.(board)}
                                  className="h-7 px-2.5 rounded-lg bg-surface hover:bg-surface-2 text-slate-700 text-xs font-semibold border border-line flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Edit3 size={12} />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onArchive?.(board)}
                                  className="h-7 px-2.5 rounded-lg bg-surface hover:bg-amber-50 text-slate-700 hover:text-amber-700 text-xs font-semibold border border-line flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                  <Archive size={12} />
                                  <span>Archive</span>
                                </button>
                              </>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onRestore?.(board)}
                                className="h-7 px-2.5 rounded-lg bg-surface hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 text-xs font-semibold border border-line flex items-center gap-1.5 cursor-pointer shadow-2xs"
                              >
                                <ArchiveRestore size={12} />
                                <span>Restore</span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDelete?.(board)}
                              className="h-7 px-2.5 rounded-lg bg-surface hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-semibold border border-line flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Nested Assigned Task Cards */}
                      {isMembersFilterActive && projectAssignedCards.length > 0 && (
                        <div className="pt-2 border-t border-line/60 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-orange-950 uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                              <span>Assigned Tasks ({projectAssignedCards.length})</span>
                            </div>
                            <span className="text-[10px] text-muted">
                              {projectAssignedCards.filter((c) => c.completed).length} of {projectAssignedCards.length} done
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {projectAssignedCards.map((card) => {
                              const cardDueDate = card.dueDate ? new Date(card.dueDate) : null;
                              const cardOverdue = cardDueDate && !card.completed && cardDueDate < today;
                              const cardAssignees = card.assignees || [];

                              return (
                                <div
                                  key={card._id}
                                  className="p-2 sm:p-2.5 rounded-xl bg-surface border border-line/70 hover:border-orange-500/30 flex items-start justify-between gap-2 transition-all shadow-2xs"
                                >
                                  <div className="flex items-start gap-2 min-w-0 flex-1">
                                    <button
                                      type="button"
                                      onClick={(e) => handleToggleCard(e, card)}
                                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition-colors cursor-pointer ${
                                        card.completed
                                          ? "bg-emerald-600 text-white"
                                          : "border-2 border-muted/50 hover:border-orange-500 bg-surface"
                                      }`}
                                      title={card.completed ? "Mark incomplete" : "Mark complete"}
                                    >
                                      {card.completed && <Check size={11} strokeWidth={3} />}
                                    </button>
                                    <div className="min-w-0 flex-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setModalCardId(card._id);
                                          setModalBoardId(board._id);
                                        }}
                                        className={`text-xs font-semibold text-left hover:text-orange-600 transition-colors line-clamp-1 cursor-pointer ${
                                          card.completed ? "line-through text-muted" : "text-ink"
                                        }`}
                                        title={card.title}
                                      >
                                        {card.title}
                                      </button>
                                      <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted flex-wrap">
                                        {card.listTitle && (
                                          <span
                                            className={`px-1.5 py-0.2 rounded font-medium border ${getListBadgeStyle(
                                              card.listTitle
                                            )}`}
                                          >
                                            {card.listTitle}
                                          </span>
                                        )}
                                        {card.priority && (
                                          <span
                                            className={`px-1.5 py-0.2 rounded font-medium border ${
                                              priorityBadge[card.priority] || "bg-surface-2 text-muted border-line"
                                            }`}
                                          >
                                            {card.priority}
                                          </span>
                                        )}
                                        {cardDueDate && (
                                          <span
                                            className={`flex items-center gap-1 ${
                                              cardOverdue ? "text-rose-600 font-bold" : "text-slate-600"
                                            }`}
                                          >
                                            <Clock size={10} />
                                            <span>
                                              {cardDueDate.toLocaleDateString(undefined, {
                                                month: "short",
                                                day: "numeric",
                                              })}
                                            </span>
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0 ml-1">
                                    {cardAssignees.length > 0 && (
                                      <div className="flex items-center -space-x-1">
                                        {cardAssignees.slice(0, 2).map((a) => {
                                          const isSel = activeSelectedMemberIds.includes(
                                            (a._id || a).toString()
                                          );
                                          return (
                                            <span
                                              key={a._id || Math.random()}
                                              className={`w-5 h-5 rounded-full text-white text-[8px] font-bold flex items-center justify-center border border-surface shadow-2xs ${
                                                isSel ? "ring-1 ring-orange-500" : ""
                                              }`}
                                              style={{ backgroundColor: a.avatarColor || "#EA580C" }}
                                            >
                                              {a.name?.[0]?.toUpperCase() || "A"}
                                            </span>
                                          );
                                        })}
                                      </div>
                                    )}

                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalCardId(card._id);
                                        setModalBoardId(board._id);
                                      }}
                                      className="p-1 rounded-md text-muted hover:text-orange-600 cursor-pointer"
                                      title="Open card details"
                                    >
                                      <ExternalLink size={12} />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        </>
      )}

      {/* ================= OPTIONAL CARD MODAL ================= */}
      {modalCardId && (
        <CardModal
          cardId={modalCardId}
          boardId={modalBoardId}
          onClose={() => {
            setModalCardId(null);
            setModalBoardId(null);
          }}
          onChanged={() => {
            if (isMembersFilterActive) {
              fetchAssignedCards(activeSelectedMemberIds);
            }
          }}
        />
      )}
    </div>
  );
}
