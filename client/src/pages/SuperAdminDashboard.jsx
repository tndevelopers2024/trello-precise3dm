import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  ShieldAlert,
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Search,
  Filter,
  RefreshCw,
  MoreVertical,
  ChevronRight,
  Shield,
  Trash2,
  UserCog,
  Mail,
  Calendar,
  AlertTriangle,
  ArrowRight,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import ConfirmationModal from "../components/ConfirmationModal.jsx";

export default function SuperAdminDashboard() {
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    managers: 0,
    employees: 0,
    superadmins: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending' | 'approved' | 'rejected'
  const [roleFilter, setRoleFilter] = useState("all"); // 'all' | 'admin' | 'member'
  const [searchQuery, setSearchQuery] = useState("");

  // Modals state
  const [actionLoading, setActionLoading] = useState(null); // id of user undergoing action
  const [rejectModalUser, setRejectModalUser] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRole, setNewRole] = useState("member");
  const [deleteModalUser, setDeleteModalUser] = useState(null);

  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const res = await api.get("/superadmin/users");
      setUsers(res.data.users || []);
      setStats(res.data.stats || {});
    } catch (err) {
      console.error("Failed to load users for superadmin:", err);
      toast.error(err.response?.data?.message || "Failed to load users", {
        title: "Super Admin",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handle Approve
  const handleApprove = async (userToApprove) => {
    setActionLoading(userToApprove._id);
    try {
      const res = await api.patch(`/superadmin/users/${userToApprove._id}/approve`);
      toast.success(res.data.message || `${userToApprove.name} has been approved.`, {
        title: "Account Approved",
      });
      // Update in local state
      setUsers((prev) =>
        prev.map((u) => (u._id === userToApprove._id ? res.data.user : u))
      );
      // Refresh stats
      fetchUsers(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve account", {
        title: "Approval Failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!rejectModalUser) return;
    setActionLoading(rejectModalUser._id);
    try {
      const res = await api.patch(`/superadmin/users/${rejectModalUser._id}/reject`, {
        reason: rejectReason.trim(),
      });
      toast.info(res.data.message || `${rejectModalUser.name} has been rejected.`, {
        title: "Account Rejected",
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === rejectModalUser._id ? res.data.user : u))
      );
      setRejectModalUser(null);
      setRejectReason("");
      fetchUsers(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject account", {
        title: "Rejection Failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Role Change
  const handleConfirmRoleChange = async () => {
    if (!roleModalUser) return;
    setActionLoading(roleModalUser._id);
    try {
      const res = await api.patch(`/superadmin/users/${roleModalUser._id}/role`, {
        role: newRole,
      });
      toast.success(res.data.message || "User role updated successfully.", {
        title: "Role Updated",
      });
      setUsers((prev) =>
        prev.map((u) => (u._id === roleModalUser._id ? res.data.user : u))
      );
      setRoleModalUser(null);
      fetchUsers(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update role", {
        title: "Update Failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteModalUser) return;
    setActionLoading(deleteModalUser._id);
    try {
      const res = await api.delete(`/superadmin/users/${deleteModalUser._id}`);
      toast.success(res.data.message || "User deleted successfully.", {
        title: "User Removed",
      });
      setUsers((prev) => prev.filter((u) => u._id !== deleteModalUser._id));
      setDeleteModalUser(null);
      fetchUsers(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete user", {
        title: "Deletion Failed",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      // Status filter
      if (statusFilter === "pending" && u.status !== "pending") return false;
      if (
        statusFilter === "approved" &&
        u.status !== "approved" &&
        u.status !== "active"
      )
        return false;
      if (statusFilter === "rejected" && u.status !== "rejected") return false;

      // Role filter
      if (roleFilter !== "all" && u.role !== roleFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = u.name?.toLowerCase().includes(query);
        const matchesEmail = u.email?.toLowerCase().includes(query);
        if (!matchesName && !matchesEmail) return false;
      }

      return true;
    });
  }, [users, statusFilter, roleFilter, searchQuery]);

  // Pending users specifically for the spotlight section
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.status === "pending");
  }, [users]);

  return (
    <div className="max-w-[1400px] mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 animate-in fade-in duration-150">
      {/* ================= TOP HEADER ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-line/80">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase bg-orange-500/10 text-orange-600 border border-orange-500/20 shadow-xs">
            <ShieldCheck size={13} className="text-orange-600" />
            <span>Workspace Administration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-2.5">
            <span>Super Admin Dashboard</span>
            {stats.pending > 0 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs animate-pulse">
                <Clock size={12} />
                {stats.pending} Pending Review
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-muted max-w-2xl leading-relaxed">
            Review user registration requests, approve or reject account access, and manage employee and manager permissions across all projects.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <button
            type="button"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="btn-press inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-surface hover:bg-surface-2 border border-line text-ink shadow-xs cursor-pointer disabled:opacity-50 transition-all"
            title="Refresh user list"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin text-orange-600" : "text-muted"} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ================= STATS SUMMARY CARDS ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {/* Total Users */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-surface border border-line shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Total Accounts</span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-ink">{stats.total}</span>
            <Users size={18} className="text-muted/70" />
          </div>
        </div>

        {/* Pending Approval (Spotlight) */}
        <button
          type="button"
          onClick={() => setStatusFilter("pending")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
            statusFilter === "pending"
              ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-400/30"
              : "bg-surface hover:bg-amber-50/40 border-line hover:border-amber-300"
          }`}
        >
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Pending Approval
            </span>
            {stats.pending > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
            )}
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-700">{stats.pending}</span>
            <Clock size={18} className="text-amber-600" />
          </div>
        </button>

        {/* Approved Accounts */}
        <button
          type="button"
          onClick={() => setStatusFilter("approved")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
            statusFilter === "approved"
              ? "bg-emerald-50/90 border-emerald-400 ring-2 ring-emerald-400/30"
              : "bg-surface hover:bg-emerald-50/40 border-line hover:border-emerald-300"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            Approved
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-700">{stats.approved}</span>
            <CheckCircle2 size={18} className="text-emerald-600" />
          </div>
        </button>

        {/* Rejected Accounts */}
        <button
          type="button"
          onClick={() => setStatusFilter("rejected")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
            statusFilter === "rejected"
              ? "bg-rose-50/90 border-rose-400 ring-2 ring-rose-400/30"
              : "bg-surface hover:bg-rose-50/40 border-line hover:border-rose-300"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
            Rejected
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-700">{stats.rejected}</span>
            <XCircle size={18} className="text-rose-600" />
          </div>
        </button>

        {/* Managers (Admin) */}
        <button
          type="button"
          onClick={() => setRoleFilter(roleFilter === "admin" ? "all" : "admin")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
            roleFilter === "admin"
              ? "bg-orange-50/90 border-orange-400 ring-2 ring-orange-400/30"
              : "bg-surface hover:bg-orange-50/40 border-line hover:border-orange-300"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800">
            Managers (PM)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-orange-700">{stats.managers}</span>
            <Shield size={18} className="text-orange-600" />
          </div>
        </button>

        {/* Employees (Members) */}
        <button
          type="button"
          onClick={() => setRoleFilter(roleFilter === "member" ? "all" : "member")}
          className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all cursor-pointer shadow-xs flex flex-col justify-between ${
            roleFilter === "member"
              ? "bg-sky-50/90 border-sky-400 ring-2 ring-sky-400/30"
              : "bg-surface hover:bg-sky-50/40 border-line hover:border-sky-300"
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-800">
            Employees
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-sky-700">{stats.employees}</span>
            <UserCheck size={18} className="text-sky-600" />
          </div>
        </button>
      </div>

      {/* ================= PENDING APPROVAL SPOTLIGHT BANNER ================= */}
      {pendingUsers.length > 0 && (
        <div className="rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-surface border border-amber-300/80 p-4 sm:p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0 shadow-xs">
                <Clock size={22} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-amber-950 tracking-tight flex items-center gap-2">
                  <span>Pending Approval Queue</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 border border-amber-300">
                    {pendingUsers.length} awaiting review
                  </span>
                </h2>
                <p className="text-xs text-amber-800/90">
                  Users in this queue cannot log in or access projects until approved.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className="text-xs font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Filter Table to Pending</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Quick Action Grid of Pending Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {pendingUsers.map((pendingUser) => {
              const isWorking = actionLoading === pendingUser._id;
              return (
                <div
                  key={pendingUser._id}
                  className="p-3.5 rounded-2xl bg-white border border-amber-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs ring-2 ring-white"
                        style={{ backgroundColor: pendingUser.avatarColor || "#EA580C" }}
                      >
                        {pendingUser.name?.[0]?.toUpperCase() || "U"}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {pendingUser.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                          <Mail size={11} className="text-slate-400 shrink-0" />
                          <span>{pendingUser.email}</span>
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0 ${
                        pendingUser.role === "admin"
                          ? "bg-orange-100 text-orange-800 border border-orange-200"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {pendingUser.role === "admin" ? "PM (Manager)" : "Employee"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Calendar size={11} className="text-slate-400" />
                      <span>{new Date(pendingUser.createdAt).toLocaleDateString()}</span>
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setRoleModalUser(pendingUser);
                        setNewRole(pendingUser.role);
                      }}
                      className="text-[11px] font-semibold text-slate-600 hover:text-orange-600 hover:underline cursor-pointer"
                    >
                      Change Role
                    </button>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      data-testid={`approve-btn-${pendingUser.email}`}
                      disabled={isWorking}
                      onClick={() => handleApprove(pendingUser)}
                      className="btn-press bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                    >
                      <Check size={14} />
                      <span>Approve</span>
                    </button>

                    <button
                      type="button"
                      data-testid={`reject-btn-${pendingUser.email}`}
                      disabled={isWorking}
                      onClick={() => {
                        setRejectModalUser(pendingUser);
                        setRejectReason("");
                      }}
                      className="btn-press bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl py-2 px-3 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                    >
                      <X size={14} />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= SEARCH & FILTER CONTROLS ================= */}
      <div className="bg-surface rounded-2xl border border-line p-3 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-surface-2 rounded-xl border border-line/70 overflow-x-auto max-w-full">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === "all"
                  ? "bg-surface text-ink shadow-xs border border-line"
                  : "text-muted hover:text-ink hover:bg-surface/50 border border-transparent"
              }`}
            >
              All Users ({users.length})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("pending")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                statusFilter === "pending"
                  ? "bg-amber-500 text-white shadow-xs font-bold"
                  : "text-amber-700 hover:bg-amber-50"
              }`}
            >
              <Clock size={12} />
              <span>Pending</span>
              {stats.pending > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-600 text-white font-mono">
                  {stats.pending}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("approved")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                statusFilter === "approved"
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              <CheckCircle2 size={12} />
              <span>Approved</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("rejected")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                statusFilter === "rejected"
                  ? "bg-rose-600 text-white shadow-xs font-bold"
                  : "text-rose-700 hover:bg-rose-50"
              }`}
            >
              <XCircle size={12} />
              <span>Rejected</span>
            </button>
          </div>

          {/* Search & Role Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-64">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or email…"
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-surface-2 border border-line focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 text-ink placeholder:text-muted"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Role Filter Dropdown */}
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 text-xs rounded-xl bg-surface-2 border border-line text-ink font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/30 cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="member">Employees only</option>
              <option value="admin">Managers (PM) only</option>
              <option value="superadmin">Super Admins only</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= FULL USERS MANAGEMENT TABLE ================= */}
      <div className="bg-surface rounded-2xl border border-line shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center space-y-3">
            <RefreshCw size={24} className="animate-spin text-orange-600 mx-auto" />
            <p className="text-xs font-semibold text-muted">Loading workspace users…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <Users size={32} className="text-muted/60 mx-auto" />
            <h3 className="text-sm font-bold text-ink">No users found</h3>
            <p className="text-xs text-muted max-w-sm mx-auto">
              No workspace users matched your selected status, role, or search filter.
            </p>
            {(statusFilter !== "all" || roleFilter !== "all" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setRoleFilter("all");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs font-semibold text-orange-600 hover:underline cursor-pointer"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-[11px] font-bold uppercase tracking-wider text-muted">
                  <th className="py-3 px-4 sm:px-6">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 hidden md:table-cell">Registered</th>
                  <th className="py-3 px-4 hidden lg:table-cell">Approval Details</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60 text-xs text-ink">
                {filteredUsers.map((u) => {
                  const isPending = u.status === "pending";
                  const isApproved = u.status === "approved" || u.status === "active";
                  const isRejected = u.status === "rejected";
                  const isCurrent = u._id === currentUser?._id;
                  const isTargetSuperAdmin = u.role === "superadmin";
                  const isWorking = actionLoading === u._id;

                  return (
                    <tr
                      key={u._id}
                      className={`hover:bg-surface-2/40 transition-colors ${
                        isPending ? "bg-amber-50/20" : ""
                      }`}
                    >
                      {/* User Info */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-xs ring-2 ring-white"
                            style={{ backgroundColor: u.avatarColor || "#EA580C" }}
                          >
                            {u.name?.[0]?.toUpperCase() || "U"}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-ink truncate max-w-[160px] sm:max-w-[220px]">
                                {u.name}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-orange-100 text-orange-800">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-muted truncate block max-w-[180px] sm:max-w-[240px]">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">
                        {u.role === "superadmin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            <ShieldCheck size={11} className="text-purple-600" />
                            SUPER ADMIN
                          </span>
                        ) : u.role === "admin" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-orange-50 text-orange-700 border border-orange-200">
                            <Shield size={11} className="text-orange-600" />
                            MANAGER (PM)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <UserCheck size={11} className="text-slate-500" />
                            EMPLOYEE
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isPending ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            <Clock size={11} className="text-amber-600" />
                            PENDING
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={11} className="text-emerald-600" />
                            APPROVED
                          </span>
                        ) : isRejected ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
                            <XCircle size={11} className="text-rose-600" />
                            REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-700">
                            {u.status}
                          </span>
                        )}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 px-4 hidden md:table-cell text-muted text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      {/* Approval Audit details */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-[11px] text-muted">
                        {isApproved && u.approvedAt ? (
                          <div className="space-y-0.5">
                            <span className="text-emerald-700 font-semibold block">
                              Approved {new Date(u.approvedAt).toLocaleDateString()}
                            </span>
                            {u.approvedBy?.name && (
                              <span className="text-[10px] text-muted">by {u.approvedBy.name}</span>
                            )}
                          </div>
                        ) : isRejected ? (
                          <div className="space-y-0.5">
                            <span className="text-rose-700 font-semibold block">
                              Rejected {u.rejectedAt ? new Date(u.rejectedAt).toLocaleDateString() : ""}
                            </span>
                            {u.rejectionReason && (
                              <span className="text-[10px] text-muted truncate max-w-[150px] block" title={u.rejectionReason}>
                                {u.rejectionReason}
                              </span>
                            )}
                          </div>
                        ) : isPending ? (
                          <span className="text-amber-700 font-medium italic">Awaiting review</span>
                        ) : (
                          <span>—</span>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                disabled={isWorking}
                                onClick={() => handleApprove(u)}
                                className="btn-press bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 shadow-xs cursor-pointer transition-all disabled:opacity-50"
                                title="Approve this account"
                              >
                                <Check size={13} />
                                <span className="hidden sm:inline">Approve</span>
                              </button>

                              <button
                                type="button"
                                disabled={isWorking}
                                onClick={() => {
                                  setRejectModalUser(u);
                                  setRejectReason("");
                                }}
                                className="btn-press bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all disabled:opacity-50"
                                title="Reject this account"
                              >
                                <X size={13} />
                                <span className="hidden sm:inline">Reject</span>
                              </button>
                            </>
                          )}

                          {isApproved && !isTargetSuperAdmin && (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => {
                                setRejectModalUser(u);
                                setRejectReason("Account access suspended by administrator.");
                              }}
                              className="btn-press text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg px-2 py-1 text-xs font-medium cursor-pointer transition-all disabled:opacity-50"
                              title="Suspend or Revoke Approval"
                            >
                              Revoke
                            </button>
                          )}

                          {isRejected && (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => handleApprove(u)}
                              className="btn-press bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg px-2 py-1 text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
                              title="Approve previously rejected account"
                            >
                              Re-Approve
                            </button>
                          )}

                          {/* Role Management */}
                          {!isTargetSuperAdmin && (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => {
                                setRoleModalUser(u);
                                setNewRole(u.role);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                              title="Manage role"
                            >
                              <UserCog size={15} />
                            </button>
                          )}

                          {/* Delete Action (Cannot delete self or superadmin) */}
                          {!isCurrent && !isTargetSuperAdmin && (
                            <button
                              type="button"
                              disabled={isWorking}
                              onClick={() => setDeleteModalUser(u)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Delete account"
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ================= REJECT USER MODAL ================= */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface border border-line rounded-3xl shadow-pop w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertOctagon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-ink">Reject Account Access</h3>
                <p className="text-xs text-muted mt-0.5">
                  Deny access for <strong>{rejectModalUser.name}</strong> ({rejectModalUser.email}).
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-1.5">
                Rejection Note / Reason (Optional)
              </label>
              <textarea
                rows={3}
                data-testid="rejection-reason-input"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Please register using your official @precise3dm.com company email address."
                className="w-full text-xs rounded-xl bg-surface-2 border border-line p-3 focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 text-ink resize-none placeholder:text-muted"
              />
              <p className="text-[11px] text-muted mt-1">
                This note will be included in the denial notification and visible if the user attempts to sign in.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRejectModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                data-testid="confirm-rejection-btn"
                onClick={handleConfirmReject}
                className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CHANGE ROLE MODAL ================= */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface border border-line rounded-3xl shadow-pop w-full max-w-md p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center shrink-0">
                <UserCog size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-bold text-ink">Manage Workspace Role</h3>
                <p className="text-xs text-muted mt-0.5">
                  Update role and permission tier for <strong>{roleModalUser.name}</strong>.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setNewRole("member")}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  newRole === "member"
                    ? "bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20"
                    : "bg-surface-2 border-line hover:border-orange-300"
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-ink">Employee (Team Member)</p>
                  <p className="text-[11px] text-muted">
                    Can collaborate on tasks, checklists, attachments, and comments.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                  MEMBER
                </span>
              </button>

              <button
                type="button"
                onClick={() => setNewRole("admin")}
                className={`w-full p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  newRole === "admin"
                    ? "bg-orange-500/10 border-orange-500 ring-2 ring-orange-500/20"
                    : "bg-surface-2 border-line hover:border-orange-300"
                }`}
              >
                <div>
                  <p className="text-xs font-bold text-ink">Project Manager (Admin)</p>
                  <p className="text-[11px] text-muted">
                    Can create projects, invite members, and manage board workflows.
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-orange-100 text-orange-800">
                  ADMIN
                </span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmRoleChange}
                className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
              >
                Save Role Change
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DELETE USER MODAL ================= */}
      {deleteModalUser && (
        <ConfirmationModal
          isOpen={!!deleteModalUser}
          title="Delete Workspace Account"
          message={`Are you sure you want to permanently delete the account for ${deleteModalUser.name} (${deleteModalUser.email})? This action cannot be undone.`}
          confirmLabel="Delete Account"
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteModalUser(null)}
        />
      )}
    </div>
  );
}
