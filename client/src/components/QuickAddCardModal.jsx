import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Loader2, FolderKanban, Layers, AlertCircle, Calendar, Flag } from "lucide-react";
import api from "../api/axios.js";
import { useProjects } from "../context/ProjectsContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import DatePicker from "./ui/DatePicker.jsx";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-slate-100 text-slate-700 border-slate-200" },
  { value: "medium", label: "Medium", color: "bg-amber-50 text-amber-800 border-amber-200" },
  { value: "high", label: "High", color: "bg-rose-50 text-rose-700 border-rose-200" },
];

export default function QuickAddCardModal({ isOpen, onClose, defaultBoardId, onCardCreated }) {
  const toast = useToast();
  const { boards } = useProjects();
  
  const [selectedBoardId, setSelectedBoardId] = useState(defaultBoardId || boards[0]?._id || "");
  const [lists, setLists] = useState([]);
  const [loadingLists, setLoadingLists] = useState(false);
  const [selectedListId, setSelectedListId] = useState("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Sync default board when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialBoard = defaultBoardId && boards.some((b) => b._id === defaultBoardId)
        ? defaultBoardId
        : boards[0]?._id || "";
      setSelectedBoardId(initialBoard);
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(null);
      setError("");
    }
  }, [isOpen, defaultBoardId, boards]);

  // Fetch lists for currently selected board
  useEffect(() => {
    if (!isOpen || !selectedBoardId) {
      setLists([]);
      setSelectedListId("");
      return;
    }

    let isCurrent = true;
    setLoadingLists(true);
    api
      .get(`/lists/board/${selectedBoardId}`)
      .then((res) => {
        if (!isCurrent) return;
        const fetchedLists = Array.isArray(res.data) ? res.data : [];
        setLists(fetchedLists);
        if (fetchedLists.length > 0) {
          setSelectedListId(fetchedLists[0]._id);
        } else {
          setSelectedListId("");
        }
      })
      .catch((err) => {
        if (isCurrent) {
          console.error("Failed to load lists for board:", err);
          setLists([]);
        }
      })
      .finally(() => {
        if (isCurrent) setLoadingLists(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [isOpen, selectedBoardId]);

  if (!isOpen) return null;

  const currentBoard = boards.find((b) => b._id === selectedBoardId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a card title.");
      return;
    }
    if (!selectedBoardId) {
      setError("Please select a target project board.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      let targetListId = selectedListId;

      // If board has no lists yet, auto-create a default "To Do" list
      if (!targetListId) {
        const listRes = await api.post("/lists", {
          title: "To Do",
          board: selectedBoardId,
        });
        targetListId = listRes.data._id;
      }

      const payload = {
        title: title.trim(),
        board: selectedBoardId,
        list: targetListId,
        description: description.trim(),
        priority,
        dueDate: dueDate || undefined,
      };

      const cardRes = await api.post("/cards", payload);

      toast.success(`Card "${title.trim()}" added to ${currentBoard?.title || "project"}!`, {
        title: "Card Created",
      });

      // Dispatch global refresh event so any active BoardView immediately syncs lists
      window.dispatchEvent(
        new CustomEvent("refresh-board-lists", {
          detail: { boardId: selectedBoardId, card: cardRes.data },
        })
      );

      onCardCreated?.(cardRes.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to create card. Please try again.";
      setError(msg);
      toast.error(msg, { title: "Error" });
    } finally {
      setSubmitting(false);
    }
  };

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-card-modal-title"
      className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 sm:p-6 z-[70] animate-in fade-in duration-200"
      onClick={!submitting ? onClose : undefined}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl text-slate-900 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200/80 flex items-center justify-center text-orange-600">
              <Plus size={18} />
            </div>
            <div>
              <h3 id="add-card-modal-title" className="text-base font-bold text-slate-900">
                Add New Card
              </h3>
              <p className="text-xs text-slate-500">Create a deliverable task or milestone item</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close dialog"
            className="w-9 h-9 shrink-0 flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/40 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 text-xs sm:text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-xl px-3.5 py-2.5 mb-4">
            <AlertCircle size={15} className="shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Scrollable Form Body */}
        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {/* Project & List Pickers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Project Board */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <FolderKanban size={13} className="text-orange-600" />
                <span>Project</span>
              </label>
              <select
                value={selectedBoardId}
                onChange={(e) => setSelectedBoardId(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-all font-medium"
              >
                {boards.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>

            {/* List Selection */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                <Layers size={13} className="text-orange-600" />
                <span>List / Column</span>
              </label>
              {loadingLists ? (
                <div className="h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 size={13} className="animate-spin text-orange-600" />
                  <span>Loading lists…</span>
                </div>
              ) : lists.length > 0 ? (
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 px-3 py-2.5 text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-all font-medium"
                >
                  {lists.map((l) => (
                    <option key={l._id} value={l._id}>
                      {l.title}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="h-10 rounded-xl bg-slate-50 border border-slate-200 px-3 flex items-center text-xs text-slate-400">
                  <span>Will create "To Do" list</span>
                </div>
              )}
            </div>
          </div>

          {/* Card Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Card Title <span className="text-rose-500">*</span>
            </label>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Conduct Einscan FreeScan dimensional inspection"
              className="w-full text-sm rounded-xl bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/25 focus:border-orange-500 transition-all font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key deliverable requirements or context…"
              className="w-full text-sm rounded-xl bg-surface border border-line px-3.5 py-2.5 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all resize-none"
            />
          </div>

          {/* Priority & Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Priority Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1.5">
                <Flag size={13} className="text-orange-600" />
                <span>Priority</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`h-9 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center justify-center ${
                      priority === opt.value
                        ? `${opt.color} ring-2 ring-orange-500/30 font-bold shadow-xs scale-102`
                        : "bg-surface-2/70 text-muted border-line hover:text-ink hover:bg-surface-2"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date Picker */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5 flex items-center gap-1.5">
                <Calendar size={13} className="text-orange-600" />
                <span>Due Date (Optional)</span>
              </label>
              <DatePicker
                value={dueDate}
                onChange={(date) => setDueDate(date)}
                placeholder="Pick due date"
                className="w-full"
                buttonClassName="w-full justify-between h-9 px-3 bg-surface border-line text-ink hover:bg-surface-2 rounded-xl text-xs shadow-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-line mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-surface hover:bg-surface-2 text-ink border border-line transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !title.trim()}
            className="btn-press bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 active:from-orange-700 text-white text-xs sm:text-sm font-semibold rounded-xl px-5 py-2 transition-all shadow-md shadow-orange-500/20 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {submitting ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} className="shrink-0" />
            )}
            <span>{submitting ? "Adding card…" : "Create Card"}</span>
          </button>
        </div>
      </form>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
