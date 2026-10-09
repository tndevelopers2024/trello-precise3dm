import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Loader2 } from "lucide-react";
import api from "../api/axios.js";
import { PALETTE } from "../utils/color.js";
import { useToast } from "../context/ToastContext.jsx";
import DatePicker from "./ui/DatePicker.jsx";

export default function EditProjectModal({ board, onClose, onUpdated }) {
  const toast = useToast();
  const [title, setTitle] = useState(board?.title || "");
  const [description, setDescription] = useState(board?.description || "");
  const [dueDate, setDueDate] = useState(board?.dueDate || null);
  const [color, setColor] = useState(board?.color || PALETTE[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Project title is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.patch(`/boards/${board._id}`, {
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate || null,
        color,
      });

      toast.success(`Project "${title.trim()}" updated successfully!`, { title: "Success" });
      onUpdated?.(res.data);
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update project settings.";
      setError(msg);
      toast.error(msg, { title: "Error" });
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-project-title"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 z-[60] animate-in fade-in duration-200"
      onClick={!loading ? onClose : undefined}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-line rounded-xl sm:rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-pop text-ink"
      >
        <div className="flex items-center justify-between pb-3 border-b border-line mb-4">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full shrink-0 shadow-xs ring-2 ring-black/5"
              style={{ backgroundColor: color }}
            />
            <h3 id="edit-project-title" className="text-base font-semibold text-ink">
              Edit project
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
            className="w-10 h-10 -mr-2 shrink-0 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 mb-3.5">
            {error}
          </p>
        )}

        <div className="space-y-3.5 mb-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Project name
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Client Website Redesign"
              className="w-full text-base sm:text-sm rounded-lg bg-surface border border-slate-300 px-3.5 py-2.5 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="What's this project about?"
              className="w-full text-base sm:text-sm rounded-lg bg-surface border border-slate-300 px-3.5 py-2.5 text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent resize-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-1.5">
              Project Due Date (optional)
            </label>
            <DatePicker
              value={dueDate}
              onChange={(val) => setDueDate(val)}
              placeholder="Select due date"
              className="w-full"
              buttonClassName="w-full justify-between h-10.5 px-3.5 bg-surface border-slate-300 text-ink hover:bg-surface-2 rounded-lg text-sm shadow-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              Board Color Accent
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-all touch-manipulation focus:outline-none ${
                    color === c ? "ring-2 ring-accent ring-offset-2 ring-offset-surface scale-110" : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Select color ${c}`}
                >
                  {color === c && (
                    <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg bg-surface hover:bg-surface-2 text-ink border border-line transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-accent/40 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="btn-press bg-accent hover:bg-accent-dark text-white text-xs sm:text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors disabled:opacity-50 touch-manipulation flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            <span>{loading ? "Saving changes…" : "Save changes"}</span>
          </button>
        </div>
      </form>
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
