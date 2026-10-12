import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Plus, Crown, ShieldCheck, Loader2, UserPlus } from "lucide-react";
import api from "../api/axios.js";
import Select from "./ui/Select.jsx";
import ConfirmationModal from "./ConfirmationModal.jsx";
import InviteMemberModal from "./InviteMemberModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function MembersPanel({ board, onClose, onChanged }) {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [allUsers, setAllUsers] = useState([]);
  const [selected, setSelected] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [demoteTarget, setDemoteTarget] = useState(null);
  const [removeTarget, setRemoveTarget] = useState(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    api.get("/auth/users").then((res) => setAllUsers(res.data));
  }, []);

  const isCurrentUserBoardManager =
    currentUser?.role === "admin" ||
    currentUser?.role === "superadmin" ||
    (board?.members || []).some(
      (m) =>
        m?.user &&
        (m.user._id ? m.user._id.toString() : String(m.user)) ===
          (currentUser?._id ? currentUser._id.toString() : "") &&
        m.role === "manager"
    );

  const managerCount = (board?.members || []).filter((m) => m?.role === "manager").length;
  const isSoleManager = managerCount <= 1;

  const memberIds = (board?.members || [])
    .filter((m) => m && m.user)
    .map((m) => (m.user._id ? m.user._id.toString() : String(m.user)));
  const nonMembers = allUsers.filter((u) => !memberIds.includes(u._id?.toString()));

  const nonMemberOptions = nonMembers.map((u) => ({
    value: u._id,
    label: u.name,
    sublabel: u.email,
    badge: u.role === "superadmin" ? "Super Admin" : u.role === "admin" ? "PM" : "Employee",
    avatarColor: u.avatarColor || "#0C66E4",
    avatarInitial: u.name?.[0]?.toUpperCase(),
  }));

  const addMember = async () => {
    if (!selected || isAdding) return;
    const userToAdd = nonMembers.find((u) => u._id === selected);
    setIsAdding(true);
    try {
      const res = await api.post(`/boards/${board._id}/members`, { userId: selected, role: "member" });
      onChanged(res.data);
      setSelected("");
      toast.success(`Added ${userToAdd?.name || "member"} to ${board.title}`, { title: "Member Added" });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add member to project", { title: "Error" });
    } finally {
      setIsAdding(false);
    }
  };

  const executeRoleUpdate = async (userId, newRole) => {
    const targetUser = (board?.members || []).find(
      (m) => m?.user && (m.user._id ? m.user._id.toString() : String(m.user)) === String(userId)
    )?.user;
    setIsUpdatingRole(true);
    try {
      const res = await api.patch(`/boards/${board._id}/members/${userId}`, { role: newRole });
      onChanged(res.data);
      toast.success(
        `Changed ${targetUser?.name || "member"}'s board role to ${newRole === "manager" ? "Manager" : "Member"}`,
        { title: "Role Updated" }
      );
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role", { title: "Error" });
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleRoleChange = (member, newRole) => {
    if (member.role === newRole) return;
    if (newRole === "member") {
      if (member.role === "manager" && isSoleManager) {
        toast.error("Assign another manager before demoting this one", { title: "Cannot Demote" });
        return;
      }
      setDemoteTarget(member);
    } else {
      executeRoleUpdate(member.user._id, "manager");
    }
  };

  const confirmDemote = async () => {
    if (!demoteTarget) return;
    await executeRoleUpdate(demoteTarget.user._id, "member");
    setDemoteTarget(null);
  };

  const confirmRemove = async () => {
    if (!removeTarget) return;
    const userToRemove = removeTarget.user;
    setIsRemoving(true);
    try {
      const res = await api.delete(`/boards/${board._id}/members/${userToRemove._id}`);
      onChanged(res.data);
      toast.info(`Removed ${userToRemove.name || "member"} from project`, { title: "Member Removed" });
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove member", { title: "Error" });
    } finally {
      setIsRemoving(false);
    }
  };

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Team members"
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-2 xs:p-3 sm:p-6 z-50 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-line rounded-2xl w-full max-w-lg p-3 xs:p-4 sm:p-6 shadow-pop text-ink max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between pb-2.5 xs:pb-3 border-b border-line mb-3 gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-xs xs:text-sm sm:text-base font-bold text-ink leading-snug line-clamp-2">
              Team on {board.title}
            </h3>
            <p className="text-[10px] xs:text-xs text-muted mt-0.5">
              {board.members.length} active member{board.members.length === 1 ? "" : "s"} · {managerCount} manager{managerCount === 1 ? "" : "s"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="w-7 h-7 xs:w-8 xs:h-8 -mr-1 shrink-0 flex items-center justify-center text-muted hover:text-ink hover:bg-surface-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40 touch-manipulation cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-1.5 xs:space-y-2 mb-3 xs:mb-4 max-h-[48vh] sm:max-h-80 overflow-y-auto pr-0.5 xs:pr-1">
          {(board.members || [])
            .filter((m) => m && m.user)
            .map((m) => {
            const isThisMemberSoleManager = m.role === "manager" && isSoleManager;

            return (
              <div
                key={m.user._id}
                className="flex items-center justify-between gap-1.5 xs:gap-2 p-1.5 xs:p-2 sm:p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition-colors"
              >
                {/* User Identity Info */}
                <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-2.5 min-w-0 flex-1">
                  <span
                    className="w-7 h-7 xs:w-8 xs:h-8 rounded-full flex items-center justify-center text-[10px] xs:text-xs text-white font-bold shrink-0 shadow-xs"
                    style={{ backgroundColor: m.user.avatarColor || "#0C66E4" }}
                  >
                    {m.user.name?.[0]?.toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 min-w-0">
                      <p className="text-[11px] xs:text-xs sm:text-sm font-semibold text-ink truncate">
                        {m.user.name}
                      </p>
                      {m.user.role === "superadmin" ? (
                        <span
                          className="text-[7px] xs:text-[8px] sm:text-[9px] uppercase tracking-wider px-1 xs:px-1.5 py-0.2 rounded font-bold bg-purple-100 text-purple-700 shrink-0 whitespace-nowrap"
                          title="Workspace Super Admin"
                        >
                          SUPER ADMIN
                        </span>
                      ) : m.user.role === "admin" ? (
                        <span
                          className="text-[7px] xs:text-[8px] sm:text-[9px] uppercase tracking-wider px-1 xs:px-1.5 py-0.2 rounded font-bold bg-orange-100 text-orange-700 shrink-0 whitespace-nowrap"
                          title="Workspace PM"
                        >
                          PM
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[9px] xs:text-[10px] sm:text-[11px] text-muted truncate">{m.user.email}</p>
                  </div>
                </div>

                {/* Role and Action Controls */}
                <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 shrink-0">
                  {/* Board Role Control */}
                  {isCurrentUserBoardManager ? (
                    isThisMemberSoleManager ? (
                      <span
                        className="text-[9px] xs:text-[10px] uppercase tracking-wider px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md xs:rounded-lg bg-orange-50 text-orange-700 font-bold border border-orange-200 flex items-center gap-0.5 xs:gap-1 shrink-0"
                        title="Sole manager — assign another manager before demoting"
                      >
                        <Crown size={10} className="shrink-0 text-orange-600" />
                        <span>Manager</span>
                      </span>
                    ) : (
                      <div className="w-20 xs:w-26 sm:w-30">
                        <Select
                          value={m.role}
                          onChange={(newRole) => handleRoleChange(m, newRole)}
                          options={[
                            {
                              value: "manager",
                              label: "Manager",
                              icon: <Crown size={11} className="text-accent shrink-0" />,
                            },
                            {
                              value: "member",
                              label: "Member",
                              icon: <ShieldCheck size={11} className="text-muted shrink-0" />,
                            },
                          ]}
                          className="text-xs"
                          buttonClassName="py-0.5 xs:py-1 px-1 xs:px-1.5 text-[11px] xs:text-xs h-6.5 xs:h-7.5"
                          menuClassName="w-28 xs:w-30 right-0 left-auto"
                        />
                      </div>
                    )
                  ) : m.role === "manager" ? (
                    <span className="text-[9px] xs:text-[10px] uppercase tracking-wider px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md xs:rounded-lg bg-orange-50 text-orange-700 font-bold border border-orange-200 shrink-0 flex items-center gap-0.5 xs:gap-1">
                      <Crown size={10} className="shrink-0" />
                      <span>Manager</span>
                    </span>
                  ) : (
                    <span className="text-[9px] xs:text-[10px] uppercase tracking-wider px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-md xs:rounded-lg bg-slate-100 text-slate-700 font-medium shrink-0">
                      Member
                    </span>
                  )}

                  {/* Remove Member Action */}
                  {isCurrentUserBoardManager && (
                    !isThisMemberSoleManager && (
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(m)}
                        aria-label={`Remove ${m.user?.name || "member"}`}
                        className="w-6 h-6 xs:w-7 xs:h-7 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0 touch-manipulation cursor-pointer"
                        title="Remove member from project"
                      >
                        <X size={14} />
                      </button>
                    )
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {nonMembers.length === 0 ? (
          <div className="pt-3 xs:pt-4 border-t border-line">
            <div className="p-2.5 xs:p-3.5 bg-surface-2 border border-line rounded-xl text-center">
              <p className="text-xs sm:text-sm text-muted font-medium">
                Everyone in the workspace is already on this project
              </p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2 xs:gap-2.5 pt-3 xs:pt-4 border-t border-line items-stretch sm:items-center">
            <div className="flex-1 min-w-0">
              <Select
                value={selected}
                onChange={setSelected}
                options={nonMemberOptions}
                placeholder="Add an employee…"
                aria-label="Add an employee"
              />
            </div>
            <button
              type="button"
              onClick={addMember}
              disabled={!selected || isAdding}
              className={`text-xs sm:text-sm font-semibold rounded-lg px-3 xs:px-4 py-2 xs:py-2.5 transition-all shrink-0 touch-manipulation flex items-center justify-center gap-1.5 shadow-sm ${
                selected && !isAdding
                  ? "bg-accent hover:bg-accent-dark text-white cursor-pointer active:scale-[0.98]"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              {isAdding ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} className="shrink-0" />}
              <span>{isAdding ? "Adding…" : "Add member"}</span>
            </button>
          </div>
        )}

        {/* Invite by email option for managers */}
        {isCurrentUserBoardManager && (
          <div className="pt-2.5 xs:pt-3 flex flex-col xs:flex-row items-center justify-between gap-1 text-center xs:text-left">
            <span className="text-[11px] xs:text-xs text-muted">Need someone not listed?</span>
            <button
              type="button"
              onClick={() => setShowInviteModal(true)}
              className="text-[11px] xs:text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <UserPlus size={12} />
              <span>Invite new member by email</span>
            </button>
          </div>
        )}
      </div>

      {/* Confirmation modal for demoting a manager */}
      <ConfirmationModal
        isOpen={!!demoteTarget}
        onClose={() => setDemoteTarget(null)}
        onConfirm={confirmDemote}
        title="Demote manager"
        message={`Are you sure you want to demote ${demoteTarget?.user?.name} to Member? They will lose manager permissions on this board.`}
        confirmText="Demote to member"
        variant="warning"
        loading={isUpdatingRole}
      />

      {/* Confirmation modal for removing a member */}
      <ConfirmationModal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title="Remove member"
        message={`Are you sure you want to remove ${removeTarget?.user?.name} from ${board.title}?`}
        confirmText="Remove member"
        isDestructive={true}
        loading={isRemoving}
      />

      {/* Invite Member Modal */}
      {showInviteModal && (
        <InviteMemberModal
          defaultBoardId={board._id}
          onClose={() => setShowInviteModal(false)}
          onInvited={async () => {
            const [usersRes, boardRes] = await Promise.all([
              api.get("/auth/users"),
              api.get(`/boards/${board._id}`),
            ]);
            setAllUsers(usersRes.data);
            if (boardRes.data) onChanged(boardRes.data);
          }}
        />
      )}
    </div>
  );

  return typeof document !== "undefined" ? createPortal(content, document.body) : content;
}
