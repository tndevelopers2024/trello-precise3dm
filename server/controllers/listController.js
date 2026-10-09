import List from "../models/List.js";
import Card from "../models/Card.js";

// GET /api/boards/:boardId/lists  - lists + their cards, board layout
export const getListsForBoard = async (req, res) => {
  try {
    const lists = await List.find({ board: req.params.boardId, isDeleted: { $ne: true } }).sort({ order: 1 });
    const cards = await Card.find({ board: req.params.boardId, isDeleted: { $ne: true } })
      .populate("assignees", "name email avatarColor")
      .sort({ order: 1 });

    const listsWithCards = lists.map((list) => ({
      ...list.toObject(),
      cards: cards.filter((c) => c.list.equals(list._id)),
    }));

    res.json(listsWithCards);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lists  { title, board }
export const createList = async (req, res) => {
  try {
    const { title, board } = req.body;
    const count = await List.countDocuments({ board, isDeleted: { $ne: true } });
    const list = await List.create({ title, board, order: count });
    res.status(201).json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/lists/:id  { title?, order? }
export const updateList = async (req, res) => {
  try {
    const list = await List.findOne({ _id: req.params.id, isDeleted: { $ne: true } });
    if (!list) return res.status(404).json({ message: "List not found" });

    if (req.body.title !== undefined) list.title = req.body.title;
    if (req.body.order !== undefined) list.order = req.body.order;
    await list.save();

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lists/:id  (SOFT DELETE ONLY)
export const deleteList = async (req, res) => {
  try {
    const list = await List.findById(req.params.id);
    if (!list || list.isDeleted) return res.status(404).json({ message: "List not found" });

    const now = new Date();
    await Card.updateMany(
      { list: req.params.id },
      { isDeleted: true, deletedAt: now, deletedBy: req.user._id }
    );

    list.isDeleted = true;
    list.deletedAt = now;
    list.deletedBy = req.user._id;
    await list.save();

    res.json({ message: "List deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/lists/reorder  { boardId, orderedListIds: [id1, id2, ...] }
export const reorderLists = async (req, res) => {
  try {
    const { orderedListIds } = req.body;
    if (!Array.isArray(orderedListIds)) {
      return res.status(400).json({ message: "orderedListIds must be an array" });
    }
    await Promise.all(
      orderedListIds.map((id, index) => List.findByIdAndUpdate(id, { order: index }))
    );
    res.json({ message: "Lists reordered" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
