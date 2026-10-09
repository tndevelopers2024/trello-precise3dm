import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Users, Plus, Tag, Loader2, Archive, ArchiveRestore, ChevronDown, Calendar } from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { useSocket } from "../hooks/useSocket.js";
import { useBoardHeader } from "../context/BoardHeaderContext.jsx";
import { boardGradient } from "../utils/color.js";
import List from "../components/List.jsx";
import CardModal from "../components/CardModal.jsx";
import MembersPanel from "../components/MembersPanel.jsx";
import EditProjectModal from "../components/EditProjectModal.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";
import InviteMemberModal from "../components/InviteMemberModal.jsx";
import FilterPopover from "../components/ui/FilterPopover.jsx";
import BoardSkeleton from "../components/ui/BoardSkeleton.jsx";
import { cardMatchesFilter } from "../utils/filter.js";
import { getLabelDotColor } from "../utils/labels.js";

export default function BoardView() {
  const { id: boardId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [showMembers, setShowMembers] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null,
    loading: false,
  });
  const [newListTitle, setNewListTitle] = useState("");
  const [addingList, setAddingList] = useState(false);
  const [isSubmittingList, setIsSubmittingList] = useState(false);
  const [filters, setFilters] = useState({ members: [], priority: [], dueDate: [], labels: [] });
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const { setBoardHeaderData, clearBoardHeaderData } = useBoardHeader();

  const isManager =
    user?.role === "admin" ||
    user?.role === "superadmin" ||
    board?.members?.some(
      (m) =>
        m?.user &&
        (m.user._id ? m.user._id.toString() : String(m.user)) ===
          (user?._id ? user._id.toString() : "") &&
        m.role === "manager"
    );

  const activeCardData = useMemo(() => {
    if (!activeCard) return null;
    for (const l of lists) {
      const found = (l.cards || []).find((c) => c._id === activeCard);
      if (found) return found;
    }
    return null;
  }, [activeCard, lists]);

  const loadBoard = useCallback((signal = null) => {
    return api
      .get(`/boards/${boardId}`, { signal })
      .then((res) => setBoard(res.data))
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          console.error("Failed to load board:", err);
          if (err.response?.status === 404) {
            toast.error("Board not found or has been removed.");
            navigate("/");
          }
        }
      });
  }, [boardId, navigate, toast]);

  const handleConfirmAction = async () => {
    if (!confirmModal.type || !board) return;
    setConfirmModal((prev) => ({ ...prev, loading: true }));

    try {
      if (confirmModal.type === "archive") {
        await api.patch(`/boards/${boardId}/archive`);
        toast.success(`Project "${board.title}" archived successfully.`, { title: "Archived" });
        setConfirmModal({ isOpen: false, type: null, loading: false });
        navigate("/");
        return;
      } else if (confirmModal.type === "restore") {
        await api.patch(`/boards/${boardId}/restore`);
        toast.success(`Project "${board.title}" restored successfully.`, { title: "Restored" });
        setConfirmModal({ isOpen: false, type: null, loading: false });
        loadBoard();
      } else if (confirmModal.type === "delete") {
        await api.delete(`/boards/${boardId}`);
        toast.success(`Project "${board.title}" deleted successfully.`, { title: "Deleted" });
        setConfirmModal({ isOpen: false, type: null, loading: false });
        navigate("/");
        return;
      }
    } catch (err) {
      const msg = err.response?.data?.message || `Failed to ${confirmModal.type} project.`;
      toast.error(msg, { title: "Error" });
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const loadLists = useCallback((signal = null) => {
    return api
      .get(`/lists/board/${boardId}`, { signal })
      .then((res) => setLists(res.data))
      .catch((err) => {
        if (err.name !== "CanceledError" && err.code !== "ERR_CANCELED") {
          console.error("Failed to load lists:", err);
        }
      });
  }, [boardId]);

  useEffect(() => {
    const controller = new AbortController();
    loadBoard(controller.signal);
    loadLists(controller.signal);

    return () => {
      controller.abort();
    };
  }, [boardId, loadBoard, loadLists]);

  const { emitAction } = useSocket(boardId, {
    "lists:changed": loadLists,
    "card:changed": loadLists,
    "board:changed": loadBoard,
  });
  const broadcastRefresh = useCallback((event) => emitAction(event, { by: user?._id }), [emitAction, user?._id]);

  const addList = async (e) => {
    e?.preventDefault();
    if (!newListTitle.trim() || isSubmittingList) return;
    setIsSubmittingList(true);
    try {
      await api.post("/lists", { title: newListTitle.trim(), board: boardId });
      setNewListTitle("");
      setAddingList(false);
      loadLists();
      broadcastRefresh("lists:changed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create list");
    } finally {
      setIsSubmittingList(false);
    }
  };

  const addCard = useCallback(async (listId, title) => {
    await api.post("/cards", { title, board: boardId, list: listId });
    loadLists();
    broadcastRefresh("card:changed");
  }, [boardId, loadLists, broadcastRefresh]);

  const handleToggleComplete = useCallback(async (targetCard) => {
    const previousLists = lists;
    const nextCompleted = !targetCard.completed;

    // Optimistic local update
    setLists((currentLists) =>
      currentLists.map((l) => ({
        ...l,
        cards: (l.cards || []).map((c) =>
          c._id === targetCard._id ? { ...c, completed: nextCompleted } : c
        ),
      }))
    );

    try {
      await api.patch(`/cards/${targetCard._id}`, { completed: nextCompleted });
      if (nextCompleted) {
        toast.success(`Marked "${targetCard.title}" completed`, { title: "Completed" });
      }
      broadcastRefresh("card:changed");
    } catch (err) {
      // Rollback on failure
      setLists(previousLists);
      toast.error(err.response?.data?.message || "Failed to update card status. Reverted changes.");
    }
  }, [lists, toast, broadcastRefresh]);

  const handleToggleAssignee = useCallback(async (targetCard, userId) => {
    const previousLists = lists;
    const currentAssignees = targetCard.assignees || [];
    const isAlreadyAssigned = currentAssignees.some(
      (a) => (a._id ? a._id.toString() : String(a)) === String(userId)
    );

    let nextAssignees;
    if (isAlreadyAssigned) {
      nextAssignees = currentAssignees.filter(
        (a) => (a._id ? a._id.toString() : String(a)) !== String(userId)
      );
    } else {
      const memberObj = board?.members?.find(
        (m) => (m.user?._id ? m.user._id.toString() : String(m.user)) === String(userId)
      );
      const userPayload = memberObj?.user || { _id: userId, name: "Member" };
      nextAssignees = [...currentAssignees, userPayload];
    }

    const nextAssigneeIds = nextAssignees.map((a) => (a._id ? a._id : a));

    // Optimistic local update
    setLists((currentLists) =>
      currentLists.map((l) => ({
        ...l,
        cards: (l.cards || []).map((c) =>
          c._id === targetCard._id ? { ...c, assignees: nextAssignees } : c
        ),
      }))
    );

    try {
      await api.patch(`/cards/${targetCard._id}`, { assignees: nextAssigneeIds });
      broadcastRefresh("card:changed");
    } catch (err) {
      // Rollback on failure
      setLists(previousLists);
      toast.error(err.response?.data?.message || "Failed to update card members. Reverted changes.");
    }
  }, [lists, board?.members, toast, broadcastRefresh]);

  const handleRemoveLabel = useCallback(async (targetCard, labelToRemove) => {
    const previousLists = lists;
    const nextLabels = (targetCard.labels || []).filter((l) => l !== labelToRemove);

    // Optimistic local update
    setLists((currentLists) =>
      currentLists.map((l) => ({
        ...l,
        cards: (l.cards || []).map((c) =>
          c._id === targetCard._id ? { ...c, labels: nextLabels } : c
        ),
      }))
    );

    try {
      await api.patch(`/cards/${targetCard._id}`, { labels: nextLabels });
      broadcastRefresh("card:changed");
    } catch (err) {
      // Rollback on failure
      setLists(previousLists);
      toast.error(err.response?.data?.message || "Failed to remove label. Reverted changes.");
    }
  }, [lists, toast, broadcastRefresh]);

  const handleToggleLabel = useCallback(async (targetCard, labelName) => {
    const previousLists = lists;
    const currentLabels = targetCard.labels || [];
    const exists = currentLabels.includes(labelName);
    const nextLabels = exists
      ? currentLabels.filter((l) => l !== labelName)
      : [...currentLabels, labelName];

    // Optimistic local update
    setLists((currentLists) =>
      currentLists.map((l) => ({
        ...l,
        cards: (l.cards || []).map((c) =>
          c._id === targetCard._id ? { ...c, labels: nextLabels } : c
        ),
      }))
    );

    try {
      await api.patch(`/cards/${targetCard._id}`, { labels: nextLabels });
      broadcastRefresh("card:changed");
    } catch (err) {
      // Rollback on failure
      setLists(previousLists);
      toast.error(err.response?.data?.message || "Failed to update label. Reverted changes.");
    }
  }, [lists, toast, broadcastRefresh]);

  const isFiltered =
    (filters.members && filters.members.length > 0) ||
    (filters.priority && filters.priority.length > 0) ||
    (filters.dueDate && filters.dueDate.length > 0) ||
    (filters.labels && filters.labels.length > 0);

  const totalCardsCount = useMemo(() => lists.reduce((sum, l) => sum + (l.cards?.length || 0), 0), [lists]);
  const totalMatchingCardsCount = useMemo(() => lists.reduce((sum, l) => {
    const matching = l.cards?.filter((c) => cardMatchesFilter(c, filters)).length || 0;
    return sum + matching;
  }, 0), [lists, filters]);

  const uniqueLabels = useMemo(() => {
    const set = new Set();
    (board?.labels || []).forEach((l) => set.add(l.name));
    lists.forEach((l) => {
      (l.cards || []).forEach((c) => {
        (c.labels || []).forEach((lbl) => {
          if (lbl && lbl.trim()) set.add(lbl.trim());
        });
      });
    });
    return Array.from(set);
  }, [board?.labels, lists]);

  const filterGroups = useMemo(() => [
    {
      id: "labels",
      title: "Labels",
      options: [
        ...uniqueLabels.map((lbl) => {
          const count = lists.reduce(
            (sum, l) =>
              sum +
              (l.cards?.filter((c) => (c.labels || []).includes(lbl)).length || 0),
            0
          );
          const dotColor = getLabelDotColor(lbl, board?.labels || []);
          return {
            value: lbl,
            label: lbl,
            icon: (
              <span
                className="w-2.5 h-2.5 rounded-full inline-block"
                style={{ backgroundColor: dotColor }}
              />
            ),
            badge: count > 0 ? String(count) : undefined,
          };
        }),
        {
          value: "no_label",
          label: "No label",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />,
        },
      ],
    },
    {
      id: "members",
      title: "Members",
      options: (board?.members || [])
        .filter((m) => m && m.user)
        .map((m) => ({
          value: m.user._id || m.user,
          label: m.user.name || "Member",
          badge: m.role === "manager" ? "Manager" : undefined,
          avatarInitial: (m.user.name?.[0] || "U").toUpperCase(),
          avatarColor: m.user.avatarColor || "#0C66E4",
        })),
    },
    {
      id: "priority",
      title: "Priority",
      options: [
        {
          value: "low",
          label: "Low",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />,
        },
        {
          value: "medium",
          label: "Medium",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />,
        },
        {
          value: "high",
          label: "High",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />,
        },
      ],
    },
    {
      id: "dueDate",
      title: "Due Date",
      options: [
        {
          value: "overdue",
          label: "Overdue",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />,
        },
        {
          value: "today",
          label: "Due today",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />,
        },
        {
          value: "tomorrow",
          label: "Due tomorrow",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />,
        },
        {
          value: "this_week",
          label: "Due in next 7 days",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />,
        },
        {
          value: "has_due_date",
          label: "Has due date",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />,
        },
        {
          value: "no_due_date",
          label: "No due date",
          icon: <span className="w-2.5 h-2.5 rounded-full bg-stone-300 inline-block" />,
        },
      ],
    },
  ], [board?.members, lists, uniqueLabels]);

  // Synchronize board metadata and controls with the unified compact Navbar
  useEffect(() => {
    if (board) {
      setBoardHeaderData({
        board,
        filterGroups,
        filters,
        setFilters,
        isManager,
        onManageTeam: () => setShowMembers(true),
        onInviteMember: () => setShowInviteModal(true),
        onEditBoard: () => setShowEditModal(true),
        onArchiveBoard: () => setConfirmModal({ isOpen: true, type: "archive", loading: false }),
        onRestoreBoard: () => setConfirmModal({ isOpen: true, type: "restore", loading: false }),
        onDeleteBoard: () => setConfirmModal({ isOpen: true, type: "delete", loading: false }),
      });
    }
    return () => {
      clearBoardHeaderData();
    };
  }, [board, filterGroups, filters, isManager, setBoardHeaderData, clearBoardHeaderData]);

  const onDragEnd = async (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Handle column / list reordering
    if (type === "column") {
      const newLists = Array.from(lists);
      const [movedList] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, movedList);

      // Optimistically update list order in UI
      setLists(newLists);

      try {
        await api.patch("/lists/reorder", {
          orderedListIds: newLists.map((l) => l._id),
        });
        broadcastRefresh("lists:changed");
      } catch (err) {
        toast.error(err.response?.data?.message || "Failed to save list order");
        loadLists();
      }
      return;
    }

    // Handle card dragging within or between lists
    const newLists = lists.map((l) => ({ ...l, cards: [...l.cards] }));
    const src = newLists.find((l) => l._id === source.droppableId);
    const dst = newLists.find((l) => l._id === destination.droppableId);
    if (!src || !dst) return;

    const realSourceIndex = src.cards.findIndex((c) => c._id === draggableId);
    if (realSourceIndex === -1) return;
    const [movedCard] = src.cards.splice(realSourceIndex, 1);

    let realDestinationIndex;
    if (!isFiltered) {
      realDestinationIndex = destination.index;
    } else {
      const dstVisibleCards = dst.cards.filter((c) => cardMatchesFilter(c, filters));
      if (dstVisibleCards.length === 0) {
        realDestinationIndex = dst.cards.length;
      } else if (destination.index >= dstVisibleCards.length) {
        const lastVisible = dstVisibleCards[dstVisibleCards.length - 1];
        realDestinationIndex = dst.cards.findIndex((c) => c._id === lastVisible._id) + 1;
      } else {
        const targetVisible = dstVisibleCards[destination.index];
        realDestinationIndex = dst.cards.findIndex((c) => c._id === targetVisible._id);
      }
    }

    dst.cards.splice(realDestinationIndex, 0, movedCard);
    setLists(newLists);

    try {
      await api.patch(`/cards/${draggableId}/move`, {
        list: destination.droppableId,
        order: realDestinationIndex,
      });
      broadcastRefresh("card:changed");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to move card");
      loadLists();
    }
  };

  if (!board) {
    return <BoardSkeleton />;
  }

  return (
    <div
      className="board-canvas min-h-[calc(100vh-56px)] flex flex-col"
      style={{ background: boardGradient(board.color) }}
    >
      {/* Archived Project Banner */}
      {board.archived && (
        <div className="bg-amber-500/25 border-b border-amber-500/35 px-4 sm:px-6 py-2.5 backdrop-blur-md flex items-center justify-between gap-3 text-amber-950 text-xs sm:text-sm font-medium">
          <div className="flex items-center gap-2">
            <Archive size={16} className="text-amber-800 shrink-0" />
            <span>This project is currently archived. It is hidden from the active dashboard.</span>
          </div>
          {isManager && (
            <button
              type="button"
              onClick={() => setConfirmModal({ isOpen: true, type: "restore", loading: false })}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-xs transition-colors shadow-xs cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <ArchiveRestore size={13} />
              <span>Restore Project</span>
            </button>
          )}
        </div>
      )}

      {/* Filter notice if all cards on the board are hidden */}
      {isFiltered && totalCardsCount > 0 && totalMatchingCardsCount === 0 && (
        <div className="px-4 sm:px-6 pt-3">
          <div className="bg-surface border border-line rounded-xl px-4 py-2.5 flex items-center justify-between text-xs sm:text-sm text-ink shadow-sm">
            <span>No cards on this board match your active filters.</span>
            <button
              type="button"
              onClick={() => setFilters({ members: [], priority: [], dueDate: [], labels: [] })}
              className="text-accent font-semibold hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      {/* Board Title & Description Header (Below Menubar) */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-5 pb-1 sm:pb-2">
        <div className="flex items-start gap-3 max-w-5xl">
          {/* Vertical Project Accent Pill */}
          <div
            className="w-1.5 self-stretch rounded-full shrink-0 min-h-[28px] shadow-xs"
            style={{ backgroundColor: board.color || "#EA580C" }}
          />

          <div className="flex-1 min-w-0 flex flex-col gap-1">
            {/* Title & Status Badges */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {board.title}
              </h1>

              {board.dueDate && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface/90 border border-line text-slate-700 shadow-xs">
                  <Calendar size={12} className="text-orange-600" />
                  <span>
                    Due {new Date(board.dueDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </span>
              )}

              {board.archived && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 border border-amber-500/30">
                  Archived
                </span>
              )}
            </div>

            {/* Description Accordion */}
            {board.description && (
              <div className="mt-0.5">
                <div
                  className={`text-xs sm:text-sm text-slate-600 font-normal leading-relaxed whitespace-pre-wrap transition-all ${
                    !isDescriptionExpanded ? "line-clamp-2" : ""
                  }`}
                >
                  {board.description}
                </div>

                {(board.description.length > 120 || board.description.includes("\n")) && (
                  <button
                    type="button"
                    onClick={() => setIsDescriptionExpanded((prev) => !prev)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors mt-1 cursor-pointer select-none"
                  >
                    <span>{isDescriptionExpanded ? "Show less" : "Show more"}</span>
                    <ChevronDown
                      size={13}
                      className={`transition-transform duration-200 ${
                        isDescriptionExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive Drag and Drop Board Canvas */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div
          className="flex-1 overflow-x-auto scrollbar-hide px-4 sm:px-6 py-4 sm:py-5 min-h-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex gap-4 h-full items-start pb-4 min-w-full w-max pr-16 sm:pr-28">
            <Droppable droppableId="board-columns" direction="horizontal" type="column">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex gap-4 h-full items-start min-w-max transition-colors rounded-xl ${
                    snapshot.isDraggingOver ? "bg-accent/5" : ""
                  }`}
                >
                  {lists.map((list, index) => (
                    <Draggable key={list._id} draggableId={list._id} index={index}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className="h-full shrink-0 flex flex-col"
                        >
                          <List
                            list={list}
                            boardMembers={board.members || []}
                            boardLabels={board.labels || []}
                            filters={filters}
                            onAddCard={addCard}
                            onOpenCard={setActiveCard}
                            onToggleComplete={handleToggleComplete}
                            onToggleAssignee={handleToggleAssignee}
                            onRemoveLabel={handleRemoveLabel}
                            onToggleLabel={handleToggleLabel}
                            onChanged={() => {
                              loadLists();
                              broadcastRefresh("lists:changed");
                            }}
                            dragHandleProps={dragProvided.dragHandleProps}
                            isDragging={dragSnapshot.isDragging}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>

            {/* "Add list" control placed outside the Droppable to prevent dimension interference */}
            <div className="w-[82vw] max-w-[300px] sm:w-72 shrink-0">
              {addingList ? (
                <form onSubmit={addList} className="bg-surface border border-line rounded-xl p-3 shadow-pop">
                  <input
                    autoFocus
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onBlur={() => !newListTitle && setAddingList(false)}
                    placeholder="List name"
                    className="w-full text-base sm:text-sm rounded-lg bg-surface-2 border border-line text-ink placeholder:text-muted/60 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent/40"
                  />
                  <div className="flex gap-2 mt-2.5">
                    <button
                      type="submit"
                      disabled={isSubmittingList || !newListTitle.trim()}
                      className={`text-xs sm:text-sm bg-accent hover:bg-accent-dark text-white font-medium rounded-lg px-3.5 py-1.5 transition-colors touch-manipulation flex items-center gap-1.5 ${
                        isSubmittingList || !newListTitle.trim() ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      {isSubmittingList && <Loader2 size={12} className="animate-spin" />}
                      <span>{isSubmittingList ? "Adding…" : "Add list"}</span>
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingList}
                      onClick={() => setAddingList(false)}
                      className="text-xs sm:text-sm text-muted hover:text-ink px-2.5 py-1.5 touch-manipulation cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setAddingList(true)}
                  className="w-full text-left text-xs sm:text-sm font-medium text-muted hover:text-ink hover:bg-surface/90 bg-surface/60 rounded-xl px-3.5 py-2.5 sm:py-3 border border-dashed border-line transition-all touch-manipulation flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus size={16} className="shrink-0" />
                  <span>Add another list</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DragDropContext>

      {activeCard && (
        <CardModal
          cardId={activeCard}
          initialCard={activeCardData}
          boardMembers={board.members}
          boardLabels={board.labels || []}
          boardId={board._id}
          onClose={() => setActiveCard(null)}
          onChanged={() => {
            loadLists();
            broadcastRefresh("card:changed");
          }}
          onBoardChanged={() => {
            loadBoard();
            broadcastRefresh("board:changed");
          }}
        />
      )}

      {showMembers && (
        <MembersPanel
          board={board}
          onClose={() => setShowMembers(false)}
          onChanged={(updated) => {
            setBoard(updated);
            broadcastRefresh("board:changed");
          }}
        />
      )}

      {showInviteModal && board && (
        <InviteMemberModal
          defaultBoardId={board._id}
          onClose={() => setShowInviteModal(false)}
          onInvited={() => {
            loadBoard();
            broadcastRefresh("board:changed");
          }}
        />
      )}

      {showEditModal && board && (
        <EditProjectModal
          board={board}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setBoard(updated);
            broadcastRefresh("board:changed");
          }}
        />
      )}

      {confirmModal.isOpen && (
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: null, loading: false })}
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
              ? `Archive "${board.title}"?`
              : confirmModal.type === "delete"
              ? `Delete "${board.title}"?`
              : `Restore "${board.title}"?`
          }
          message={
            confirmModal.type === "archive"
              ? `Are you sure you want to archive "${board.title}"? It will be moved to the Archived Projects section and hidden from the active dashboard. You can restore it at any time.`
              : confirmModal.type === "delete"
              ? `Are you sure you want to delete "${board.title}"? It will be removed from normal views. All project data and records are preserved safely in the database via soft delete and remain recoverable.`
              : `Are you sure you want to restore "${board.title}"? It will be moved back to the Active Projects dashboard.`
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
    </div>
  );
}
