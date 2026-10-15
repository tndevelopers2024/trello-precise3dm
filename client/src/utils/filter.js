export const checkDueDateFilter = (card, dueDateFilters) => {
  if (!dueDateFilters || dueDateFilters.length === 0) return true;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayEnd = todayStart + 24 * 60 * 60 * 1000 - 1;
  const tomorrowStart = todayEnd + 1;
  const tomorrowEnd = tomorrowStart + 24 * 60 * 60 * 1000 - 1;
  const weekEnd = todayStart + 7 * 24 * 60 * 60 * 1000 - 1;

  const cardDueDate = card.dueDate ? new Date(card.dueDate).getTime() : null;

  return dueDateFilters.some((filterVal) => {
    if (filterVal === "no_due_date") {
      return !cardDueDate;
    }
    if (filterVal === "has_due_date") {
      return !!cardDueDate;
    }
    if (!cardDueDate) return false;

    if (filterVal === "overdue") {
      return cardDueDate < todayStart && !card.completed;
    }
    if (filterVal === "today") {
      return cardDueDate >= todayStart && cardDueDate <= todayEnd;
    }
    if (filterVal === "tomorrow") {
      return cardDueDate >= tomorrowStart && cardDueDate <= tomorrowEnd;
    }
    if (filterVal === "this_week") {
      return cardDueDate >= todayStart && cardDueDate <= weekEnd;
    }
    return true;
  });
};

export const cardMatchesFilter = (card, filters) => {
  if (!filters) return true;

  // 1. Members Filter
  if (filters.members && filters.members.length > 0) {
    const memberFilterIds = filters.members.map((id) => (id?._id || id).toString());
    const hasMember = card.assignees?.some((a) => {
      const aId = (a?._id || a)?.toString();
      return memberFilterIds.includes(aId);
    });
    if (!hasMember) return false;
  }

  // 2. Priority Filter
  if (filters.priority && filters.priority.length > 0) {
    if (!filters.priority.includes(card.priority)) return false;
  }

  // 3. Due Date Filter
  if (filters.dueDate && filters.dueDate.length > 0) {
    if (!checkDueDateFilter(card, filters.dueDate)) return false;
  }

  // 4. Labels Filter
  if (filters.labels && filters.labels.length > 0) {
    const cardLabels = (card.labels || []).map((l) =>
      (typeof l === "string" ? l : l?.name || "").trim().toLowerCase()
    );
    const matches = filters.labels.some((lbl) => {
      if (lbl === "no_label") {
        return cardLabels.length === 0;
      }
      const filterName = (typeof lbl === "string" ? lbl : lbl?.name || "").trim().toLowerCase();
      return cardLabels.includes(filterName);
    });
    if (!matches) return false;
  }

  return true;
};
