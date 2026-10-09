import Board from "../models/Board.js";
import List from "../models/List.js";
import Card from "../models/Card.js";

// GET /api/boards - boards the logged-in user belongs to (or all, if admin)
export const getBoards = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" || req.user.role === "superadmin"
        ? {}
        : { $or: [{ createdBy: req.user._id }, { "members.user": req.user._id }] };

    const boards = await Board.find({ ...filter, archived: false, isDeleted: { $ne: true } })
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatarColor role")
      .sort({ createdAt: -1 });

    boards.forEach((b) => {
      if (b.members && b.members.length > 0) {
        b.members = b.members.filter((m) => m && m.user);
      }
      if (b.labels && b.labels.length > 0) {
        b.labels = b.labels.filter((l) => !l.isDeleted);
      }
    });

    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/boards/archived - archived boards for admin/superadmin or members
export const getArchivedBoards = async (req, res) => {
  try {
    const filter =
      req.user.role === "admin" || req.user.role === "superadmin"
        ? {}
        : { $or: [{ createdBy: req.user._id }, { "members.user": req.user._id }] };

    const boards = await Board.find({ ...filter, archived: true, isDeleted: { $ne: true } })
      .populate("createdBy", "name email")
      .populate("archivedBy", "name email")
      .populate("members.user", "name email avatarColor role")
      .sort({ archivedAt: -1, updatedAt: -1 });

    boards.forEach((b) => {
      if (b.members && b.members.length > 0) {
        b.members = b.members.filter((m) => m && m.user);
      }
      if (b.labels && b.labels.length > 0) {
        b.labels = b.labels.filter((l) => !l.isDeleted);
      }
    });

    res.json(boards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const DEFAULT_LABELS = [
  { name: "Planning", color: "#0284c7" },
  { name: "Site Work", color: "#d97706" },
  { name: "Structural", color: "#57534e" },
  { name: "Electrical", color: "#ca8a04" },
  { name: "Plumbing", color: "#0891b2" },
  { name: "Procurement", color: "#9333ea" },
  { name: "Safety", color: "#e11d48" },
  { name: "Inspection", color: "#059669" },
];

// GET /api/boards/:id
export const getBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("archivedBy", "name email")
      .populate("members.user", "name email avatarColor role");
    if (!board || board.isDeleted) return res.status(404).json({ message: "Board not found" });

    // Filter out orphaned / deleted members where population returned null
    if (board.members && board.members.length > 0) {
      board.members = board.members.filter((m) => m && m.user);
    }

    // Filter out soft-deleted labels
    if (board.labels && board.labels.length > 0) {
      board.labels = board.labels.filter((l) => !l.isDeleted);
    }

    // Initialize default labels if empty
    if (!board.labels || board.labels.length === 0) {
      board.labels = DEFAULT_LABELS;
      await board.save();
    }

    res.json(board);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/boards  (admin/PM only)
export const createBoard = async (req, res) => {
  try {
    const { title, description, color, dueDate } = req.body;
    const board = await Board.create({
      title,
      description,
      color,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: "manager" }],
      labels: DEFAULT_LABELS,
    });

    // Seed default lists like a real Trello project
    const defaultLists = ["To Do", "In Progress", "Review", "Done"];
    await List.insertMany(
      defaultLists.map((title, i) => ({ title, board: board._id, order: i }))
    );

    const populated = await board.populate("members.user", "name email avatarColor role");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/boards/:id
export const updateBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board || board.isDeleted) return res.status(404).json({ message: "Board not found" });

    const allowedUpdates = ["title", "description", "color", "dueDate"];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        if (field === "dueDate") {
          board.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
        } else {
          board[field] = req.body[field];
        }
      }
    });

    await board.save();

    const populated = await Board.findById(board._id)
      .populate("createdBy", "name email")
      .populate("archivedBy", "name email")
      .populate("members.user", "name email avatarColor role");

    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/boards/:id/archive  (admin & superadmin & board manager)
export const archiveBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board || board.isDeleted) return res.status(404).json({ message: "Board not found" });

    board.archived = true;
    board.archivedAt = new Date();
    board.archivedBy = req.user._id;
    await board.save();

    const populated = await Board.findById(board._id)
      .populate("createdBy", "name email")
      .populate("archivedBy", "name email")
      .populate("members.user", "name email avatarColor role");

    res.json({ message: "Project archived successfully", board: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/boards/:id/restore  (admin & superadmin & board manager)
export const restoreBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board || board.isDeleted) return res.status(404).json({ message: "Board not found" });

    board.archived = false;
    board.archivedAt = undefined;
    board.archivedBy = undefined;
    await board.save();

    const populated = await Board.findById(board._id)
      .populate("createdBy", "name email")
      .populate("members.user", "name email avatarColor role");

    res.json({ message: "Project restored successfully", board: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/boards/:id  (SOFT DELETE ONLY: never permanently delete)
export const deleteBoard = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board || board.isDeleted) return res.status(404).json({ message: "Board not found" });

    const now = new Date();

    // Soft delete all cards on this board
    await Card.updateMany(
      { board: req.params.id },
      { isDeleted: true, deletedAt: now, deletedBy: req.user._id }
    );

    // Soft delete all lists on this board
    await List.updateMany(
      { board: req.params.id },
      { isDeleted: true, deletedAt: now, deletedBy: req.user._id }
    );

    // Soft delete the board record
    board.isDeleted = true;
    board.deletedAt = now;
    board.deletedBy = req.user._id;
    await board.save();

    res.json({ message: "Board deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/boards/:id/members  { userId, role }
export const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const already = board.members.some((m) => m.user.equals(userId));
    if (already) return res.status(400).json({ message: "User already a member" });

    board.members.push({ user: userId, role: role === "manager" ? "manager" : "member" });
    await board.save();
    const populated = await board.populate("members.user", "name email avatarColor role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/boards/:id/members/:userId  { role: "manager" | "member" }
export const updateMemberRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["manager", "member"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be 'manager' or 'member'" });
    }

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const memberIndex = board.members.findIndex((m) => m.user.equals(req.params.userId));
    if (memberIndex === -1) {
      return res.status(404).json({ message: "Member not found on this board" });
    }

    const currentRole = board.members[memberIndex].role;
    if (currentRole === "manager" && role === "member") {
      const managerCount = board.members.filter((m) => m.role === "manager").length;
      if (managerCount <= 1) {
        return res.status(400).json({
          message: "Assign another manager before demoting this one",
        });
      }
    }

    board.members[memberIndex].role = role;
    await board.save();
    const populated = await board.populate("members.user", "name email avatarColor role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/boards/:id/members/:userId
export const removeMember = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const member = board.members.find((m) => m.user.equals(req.params.userId));
    if (!member) {
      return res.status(404).json({ message: "Member not found on this board" });
    }

    if (member.role === "manager") {
      const managerCount = board.members.filter((m) => m.role === "manager").length;
      if (managerCount <= 1) {
        return res.status(400).json({
          message: "Assign another manager before removing this one",
        });
      }
    }

    board.members = board.members.filter((m) => !m.user.equals(req.params.userId));
    await board.save();
    const populated = await board.populate("members.user", "name email avatarColor role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/boards/:id/labels  { name, color }
export const addBoardLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Label name is required" });
    }

    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const trimmedName = name.trim();
    const existingIndex = (board.labels || []).findIndex(
      (l) => l.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (existingIndex !== -1) {
      if (color) {
        board.labels[existingIndex].color = color;
      }
    } else {
      board.labels.push({ name: trimmedName, color: color || "#0284c7" });
    }

    await board.save();
    const populated = await board.populate("members.user", "name email avatarColor role");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/boards/:id/labels/:labelId  { name, color }
export const updateBoardLabel = async (req, res) => {
  try {
    const { name, color } = req.body;
    const board = await Board.findById(req.params.id);
    if (!board) return res.status(404).json({ message: "Board not found" });

    const label = board.labels.id(req.params.labelId);
    if (!label) return res.status(404).json({ message: "Label not found" });

    const oldName = label.name;
    if (name && name.trim()) {
      label.name = name.trim();
    }
    if (color) {
      label.color = color;
    }

    await board.save();

    // If renamed, update cards on this board that used the old name
    if (name && name.trim() && name.trim() !== oldName) {
      await Card.updateMany(
        { board: board._id, labels: oldName },
        { $set: { "labels.$[elem]": name.trim() } },
        { arrayFilters: [{ elem: oldName }] }
      );
    }

    const populated = await board.populate("members.user", "name email avatarColor role");
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/boards/:id/labels/:labelId  (SOFT DELETE)
export const deleteBoardLabel = async (req, res) => {
  try {
    const board = await Board.findById(req.params.id);
    if (!board || board.isDeleted) return res.status(404).json({ message: "Board not found" });

    const label = board.labels.id(req.params.labelId);
    if (!label) return res.status(404).json({ message: "Label not found" });

    label.isDeleted = true;
    await board.save();

    const populated = await board.populate("members.user", "name email avatarColor role");
    if (populated.labels) {
      populated.labels = populated.labels.filter((l) => !l.isDeleted);
    }
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

