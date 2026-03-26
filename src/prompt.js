function normalize(value) {
  return String(value || "").trim();
}

function normalizedIncludes(haystack, needle) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

async function handleCopy(event) {
  const button = event.target.closest("[data-copy-text]");
  if (!button) return false;

  const original = button.textContent;
  const encoded = button.getAttribute("data-copy-text") || "";
  const text = decodeURIComponent(encoded);

  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1400);
  } catch (error) {
    button.textContent = "Copy Failed";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1600);
  }

  return true;
}

function initLibrary(library) {
  const searchInput = library.querySelector("[data-library-search]");
  const categoryButtons = Array.from(library.querySelectorAll("[data-filter-category]"));
  const roleButtons = Array.from(library.querySelectorAll("[data-filter-role]"));
  const cards = Array.from(library.querySelectorAll("[data-prompt-card]"));
  const countNode = library.querySelector("[data-library-count]");
  const summaryNode = library.querySelector("[data-library-summary]");
  const emptyNode = library.querySelector("[data-library-empty]");
  const clearButton = library.querySelector("[data-library-clear]");
  const toggleButton = library.querySelector("[data-library-toggle]");
  const shell = library.querySelector(".library-shell");

  const params = new URLSearchParams(window.location.search);
  const initialCategory = normalize(params.get("category") || library.getAttribute("data-initial-category") || "all");
  const initialRole = normalize(params.get("role") || "");
  const initialQuery = normalize(params.get("q") || "");

  const state = {
    category: initialCategory,
    role: initialRole,
    query: initialQuery
  };

  if (searchInput) {
    searchInput.value = state.query;
  }

  function updateButtons(buttons, value, key) {
    buttons.forEach((button) => {
      const isActive = normalize(button.getAttribute(key)) === value;
      button.classList.toggle("is-active", isActive);
    });
  }

  function updateUrl() {
    const next = new URLSearchParams(window.location.search);
    ["q", "category", "role"].forEach((key) => next.delete(key));
    if (state.query) next.set("q", state.query);
    if (state.category && state.category !== "all") next.set("category", state.category);
    if (state.role) next.set("role", state.role);
    const query = next.toString();
    const nextUrl = `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }

  function updateSummary(visibleCount) {
    if (!summaryNode) return;
    const parts = [];
    if (state.category && state.category !== "all") {
      const button = categoryButtons.find((item) => normalize(item.getAttribute("data-filter-category")) === state.category);
      parts.push(button ? button.querySelector("span")?.textContent || state.category : state.category);
    }
    if (state.role) {
      const button = roleButtons.find((item) => normalize(item.getAttribute("data-filter-role")) === state.role);
      parts.push(button ? button.querySelector("span")?.textContent || state.role : state.role);
    }
    if (state.query) {
      parts.push(`搜索: ${state.query}`);
    }
    summaryNode.textContent = parts.length > 0 ? parts.join(" / ") : "全部 prompt";
    if (countNode) countNode.textContent = String(visibleCount);
  }

  function applyFilters() {
    const query = normalize(state.query).toLowerCase();
    let visibleCount = 0;

    cards.forEach((card) => {
      const cardCategory = normalize(card.getAttribute("data-prompt-category"));
      const cardRoles = normalize(card.getAttribute("data-prompt-roles")).split(",").filter(Boolean);
      const cardSearch = normalize(card.getAttribute("data-prompt-search")).toLowerCase();

      const matchesCategory = state.category === "all" || cardCategory === state.category;
      const matchesRole = !state.role || cardRoles.includes(state.role);
      const matchesQuery = !query || normalizedIncludes(cardSearch, query);
      const visible = matchesCategory && matchesRole && matchesQuery;

      card.hidden = !visible;
      if (visible) visibleCount += 1;
    });

    if (emptyNode) {
      emptyNode.hidden = visibleCount !== 0;
    }

    updateButtons(categoryButtons, state.category, "data-filter-category");
    updateButtons(roleButtons, state.role, "data-filter-role");
    updateSummary(visibleCount);
    updateUrl();
  }

  categoryButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = normalize(button.getAttribute("data-filter-category") || "all");
      state.category = next;
      applyFilters();
    });
  });

  roleButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const next = normalize(button.getAttribute("data-filter-role"));
      state.role = state.role === next ? "" : next;
      applyFilters();
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      state.query = normalize(searchInput.value);
      applyFilters();
    });
  }

  if (clearButton) {
    clearButton.addEventListener("click", () => {
      state.category = normalize(library.getAttribute("data-initial-category") || "all");
      state.role = "";
      state.query = "";
      if (searchInput) searchInput.value = "";
      applyFilters();
    });
  }

  if (toggleButton && shell) {
    toggleButton.addEventListener("click", () => {
      shell.classList.toggle("is-open");
    });
  }

  applyFilters();
}

document.addEventListener("click", async (event) => {
  const copied = await handleCopy(event);
  if (copied) return;
});

document.querySelectorAll("[data-library]").forEach((library) => {
  initLibrary(library);
});
