import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const dataRoot = path.join(root, "data", "prompts");
const distRoot = path.join(root, "dist");
const stylesSrc = path.join(root, "src", "site.css");
const scriptSrc = path.join(root, "src", "prompt.js");
const faviconSrc = path.join(root, "src", "favicon.svg");
const siteOrigin = normalizeUrl(process.env.PROMPT_SITE_ORIGIN || "https://prompt.zondev.top");
const publicRepoUrl = normalizeUrl(process.env.PROMPT_SITE_REPO_URL || "https://github.com/EOMZON/prompt-site");
const publicRepoBranch = process.env.PROMPT_SITE_REPO_BRANCH || "main";
const authorGithubUrl = process.env.PROMPT_SITE_AUTHOR_GITHUB_URL || "https://github.com/EOMZON";

const categoryMeta = {
  coding: { label: "编程开发", summary: "面向工程实现、调试、架构和代码质量。" },
  design: { label: "设计创意", summary: "面向视觉表达、风格探索和创意生成。" },
  product: { label: "产品策略", summary: "面向产品规划、需求定义和策略判断。" },
  research: { label: "调研分析", summary: "面向比较、证据整理和深度分析。" },
  writing: { label: "写作表达", summary: "面向文章、文档、提案和表达优化。" },
  "p0-core-dev": { label: "核心开发", summary: "聚焦基础开发场景和高频工程动作。" },
  "p1-creative-tools": { label: "创意工具", summary: "聚焦创作辅助和多模态工具工作流。" },
  "p2-professional-tools": { label: "专业工具", summary: "聚焦偏专业协作和特定用途模板。" },
  "p3-project-management": { label: "项目管理", summary: "聚焦协作推进、流程组织和项目节奏。" }
};

const roleMeta = {
  developer: { label: "开发", summary: "代码、架构、工程实现与调试。" },
  designer: { label: "设计", summary: "视觉表达、体验设计与创意生成。" },
  product: { label: "产品", summary: "需求定义、方案判断与协同推进。" },
  writer: { label: "写作", summary: "内容组织、表达优化与文档写作。" },
  researcher: { label: "研究", summary: "调研、比较、证据整理与分析。" },
  analysis: { label: "分析", summary: "偏分析型、专业型与结构化判断任务。" }
};

const roleCategoryMap = {
  developer: ["coding", "p0-core-dev", "p1-creative-tools", "p2-professional-tools"],
  designer: ["design", "p1-creative-tools"],
  product: ["product", "p3-project-management"],
  writer: ["writing", "p1-creative-tools"],
  researcher: ["research"],
  analysis: ["research", "p2-professional-tools"]
};

function normalizeUrl(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath, content) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content);
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function isExternalHref(href) {
  return /^https?:\/\//i.test(String(href || ""));
}

function anchorAttrs(href, className = "") {
  const classAttr = className ? ` class="${className}"` : "";
  const external = isExternalHref(href) ? ` target="_blank" rel="noreferrer noopener"` : "";
  return `${classAttr} href="${escapeHtml(href)}"${external}`;
}

function slugPath(...parts) {
  return parts.filter(Boolean).join("/");
}

function compactText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function repoBlobPath(filePath) {
  return `${publicRepoUrl}/blob/${publicRepoBranch}/${filePath.replace(/^\/+/, "")}`;
}

function promptCopyButton(prompt, label = "Copy Prompt") {
  return `<button class="copy-button" data-copy-text="${escapeHtml(encodeURIComponent(prompt.content))}">${escapeHtml(label)}</button>`;
}

function promptDetailPath(prompt) {
  return slugPath("prompts", prompt.id, "index.html");
}

function categoryPath(category) {
  return slugPath("categories", category, "index.html");
}

function derivePromptRoles(prompt) {
  return Object.keys(roleCategoryMap).filter((roleId) => roleCategoryMap[roleId].includes(prompt.category));
}

function buildPromptSearchText(prompt) {
  const inputs = Array.isArray(prompt.inputs)
    ? prompt.inputs.flatMap((item) => [item?.name, item?.description, item?.example])
    : [];
  const steps = Array.isArray(prompt.steps)
    ? prompt.steps.flatMap((item) => [item?.title, item?.description])
    : [];

  return compactText(
    [
      prompt.title,
      prompt.description,
      prompt.content,
      prompt.goal,
      prompt.outputContract,
      categoryMeta[prompt.category]?.label,
      prompt.category,
      ...(prompt.tags || []),
      ...(prompt.tips || []),
      ...(prompt.checklist || []),
      ...inputs,
      ...steps
    ].join(" ")
  );
}

function layout({ title, description, body, canonicalPath }) {
  const canonical = `${siteOrigin}/${canonicalPath.replace(/^\/+/, "")}`;
  const navLinks = [
    { label: "Home", href: "/index.html" },
    { label: "Categories", href: "/index.html#categories" },
    { label: "Explorer", href: "/index.html#library" },
    { label: "GitHub", href: publicRepoUrl }
  ];

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="${escapeHtml(description)}" />
    <title>${escapeHtml(title)}</title>
    <link rel="canonical" href="${escapeHtml(canonical)}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/site.css" />
  </head>
  <body>
    <div class="site-shell">
      <header class="topbar">
        <div class="topbar-inner">
          <a class="brand" href="/index.html"><strong>Prompt</strong><span>Hub</span></a>
          <nav class="nav">
            ${navLinks.map((link) => `<a ${anchorAttrs(link.href)}>${escapeHtml(link.label)}</a>`).join("")}
          </nav>
        </div>
      </header>
      ${body}
      <footer class="footer">
        <div>Prompt Hub · prompt-first library · source repo <a ${anchorAttrs(publicRepoUrl)}>EOMZON/prompt-site</a> · author <a ${anchorAttrs(authorGithubUrl)}>@EOMZON</a></div>
      </footer>
    </div>
    <script src="/prompt.js"></script>
  </body>
</html>
`;
}

function renderPromptCard(prompt) {
  const roleBadges = (prompt.roleIds || []).slice(0, 3).map((roleId) => `<span class="tag tag-role">${escapeHtml(roleMeta[roleId]?.label || roleId)}</span>`).join("");
  return `<article class="prompt-card" data-prompt-card data-prompt-category="${escapeHtml(prompt.category)}" data-prompt-roles="${escapeHtml((prompt.roleIds || []).join(","))}" data-prompt-search="${escapeHtml(prompt.searchText || "")}">
  <p class="card-kicker">${escapeHtml(categoryMeta[prompt.category]?.label || prompt.category)}</p>
  <h3 class="prompt-card-title"><a ${anchorAttrs(`/${promptDetailPath(prompt)}`)}>${escapeHtml(prompt.title)}</a></h3>
  <div class="prompt-card-meta">${escapeHtml(prompt.category)} · ${escapeHtml(prompt.id)}</div>
  <p class="prompt-card-copy">${escapeHtml(prompt.description)}</p>
  <div class="tag-row">${roleBadges}${(prompt.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
  <div class="action-row">
    ${promptCopyButton(prompt, "Quick Copy")}
    <a ${anchorAttrs(`/${promptDetailPath(prompt)}`, "ghost-button")}>Open Prompt</a>
    <a ${anchorAttrs(prompt.githubUrl, "ghost-button")}>GitHub</a>
  </div>
</article>`;
}

function renderCategoryCard(category, prompts) {
  const meta = categoryMeta[category] || { label: category, summary: "Prompt collection." };
  return `<article class="category-card">
  <p class="card-kicker">Category</p>
  <h3 class="category-card-title"><a ${anchorAttrs(`/${categoryPath(category)}`)}>${escapeHtml(meta.label)}</a></h3>
  <div class="category-card-meta">${prompts.length} prompts · ${escapeHtml(category)}</div>
  <p class="category-card-copy">${escapeHtml(meta.summary)}</p>
  <div class="action-row">
    <a ${anchorAttrs(`/${categoryPath(category)}`, "ghost-button")}>Browse Category</a>
    <a ${anchorAttrs(repoBlobPath(`data/prompts/${category}.json`), "ghost-button")}>View JSON</a>
  </div>
</article>`;
}

function renderLibrarySection({
  prompts,
  categories,
  title,
  summary,
  kicker = "Explorer",
  initialCategory = "all"
}) {
  const categoryButtons = [
    `<button class="filter-button" type="button" data-filter-category="all"><span>全部 Prompt</span><span class="filter-count">${prompts.length}</span></button>`,
    ...categories.map((category) => {
      const count = prompts.filter((prompt) => prompt.category === category).length;
      return `<button class="filter-button" type="button" data-filter-category="${escapeHtml(category)}"><span>${escapeHtml(categoryMeta[category]?.label || category)}</span><span class="filter-count">${count}</span></button>`;
    })
  ].join("");

  const roleButtons = Object.keys(roleMeta)
    .map((roleId) => {
      const count = prompts.filter((prompt) => (prompt.roleIds || []).includes(roleId)).length;
      return `<button class="filter-button" type="button" data-filter-role="${escapeHtml(roleId)}"><span>${escapeHtml(roleMeta[roleId].label)}</span><span class="filter-count">${count}</span></button>`;
    })
    .join("");

  return `<section class="section library-section" id="library" data-library data-initial-category="${escapeHtml(initialCategory)}">
    <div class="section-header">
      <div>
        <p class="section-kicker">${escapeHtml(kicker)}</p>
        <h2 class="section-title">${escapeHtml(title)}</h2>
      </div>
      <div class="section-summary">${escapeHtml(summary)}</div>
    </div>
    <div class="library-shell">
      <aside class="library-sidebar" data-library-sidebar>
        <div class="filter-block">
          <div class="filter-head">
            <p class="side-title">Search</p>
            <button class="text-button" type="button" data-library-clear>Clear</button>
          </div>
          <input class="search-input" type="search" placeholder="搜索标题、描述、正文、标签" data-library-search />
          <p class="filter-copy">保留 prompt-hub 的基础使用链路：先筛选，再打开，最后复制。</p>
        </div>
        <div class="filter-block">
          <p class="side-title">Scenes</p>
          <div class="filter-stack">${categoryButtons}</div>
        </div>
        <div class="filter-block">
          <p class="side-title">Roles</p>
          <div class="filter-stack">${roleButtons}</div>
        </div>
      </aside>
      <div class="library-main">
        <div class="library-toolbar">
          <div>
            <div class="library-status"><span class="mono" data-library-count>${prompts.length}</span> results</div>
            <div class="library-summary" data-library-summary>全部 prompt</div>
          </div>
          <button class="ghost-button library-toggle" type="button" data-library-toggle>Filters</button>
        </div>
        <div class="prompt-grid prompt-grid-library">
          ${prompts.map((prompt) => renderPromptCard(prompt)).join("\n")}
        </div>
        <div class="empty-card" data-library-empty hidden>
          <p class="card-kicker">Empty</p>
          <h3 class="prompt-card-title">没有找到匹配的 prompt</h3>
          <p class="empty-copy">可以试试更短的关键词，或者先清空角色与场景筛选。</p>
        </div>
      </div>
    </div>
  </section>`;
}

function renderLinkedValue(value) {
  const href = String(value || "").trim();
  if (isExternalHref(href)) {
    return `<a ${anchorAttrs(href)}>${escapeHtml(href)}</a>`;
  }
  return escapeHtml(href);
}

function buildHome({ index, prompts, categories }) {
  const featured = prompts.slice(0, 12);
  const syncLabel = index.lastUpdated ? String(index.lastUpdated).slice(0, 10) : "Live";
  const body = `<main class="page">
  <section class="hero">
    <div>
      <p class="eyebrow">Prompt Library</p>
      <h1 class="hero-title">Reusable prompts, organized by scene.</h1>
      <p class="hero-copy">这个站点只做 prompt 本身：按场景浏览，打开详情，直接复制，需要时再回到 GitHub 查看源文件和版本历史。</p>
      <div class="hero-actions">
        <a ${anchorAttrs("/index.html#categories", "button")}>Browse Categories</a>
        <a ${anchorAttrs("/index.html#library", "ghost-button")}>Open Explorer</a>
        <a ${anchorAttrs(publicRepoUrl, "ghost-button")}>Open GitHub</a>
      </div>
    </div>
    <div class="hero-side">
      <div class="hero-note"><strong>Copy-first</strong>详情页把 prompt 内容直接展开，并提供稳定的复制动作。</div>
      <div class="hero-note"><strong>Scene-based</strong>保持应用场景作为最小组织单位，先判断用途，再进入具体 prompt。</div>
      <div class="hero-note"><strong>Repo-backed</strong>每条 prompt 都能回到 GitHub 中对应的分类源文件。</div>
    </div>
  </section>

  <section class="stats-strip">
    <div><span class="stat-value">${prompts.length}</span><span class="stat-label">Prompts</span></div>
    <div><span class="stat-value">${categories.length}</span><span class="stat-label">Categories</span></div>
    <div><span class="stat-value">Copy</span><span class="stat-label">Primary Action</span></div>
    <div><span class="stat-value">${escapeHtml(syncLabel)}</span><span class="stat-label">Last Sync</span></div>
  </section>

  <section class="section" id="categories">
    <div class="section-header">
      <div>
        <p class="section-kicker">Categories</p>
        <h2 class="section-title">按 prompt 场景分组</h2>
      </div>
      <div class="section-summary">保留 category 作为最小组织层，让你先判断大致用途，再进入具体 prompt。</div>
    </div>
    <div class="category-grid">
      ${categories.map((category) => renderCategoryCard(category, prompts.filter((prompt) => prompt.category === category))).join("\n")}
    </div>
  </section>

  <section class="section" id="featured">
    <div class="section-header">
      <div>
        <p class="section-kicker">Featured</p>
        <h2 class="section-title">先打开，再复制</h2>
      </div>
      <div class="section-summary">首页先呈现一组值得优先查看的 prompt；完整内容在详情页里展开，按场景浏览则放在上方 categories。</div>
    </div>
    <div class="prompt-grid">
      ${featured.map((prompt) => renderPromptCard(prompt)).join("\n")}
    </div>
  </section>
  ${renderLibrarySection({
    prompts,
    categories,
    title: "Prompt Explorer",
    summary: "复用 prompt-hub 的核心能力：左侧筛选、角色/场景联动、关键词搜索，以及卡片级快速复制。",
    initialCategory: "all"
  })}
</main>`;

  return layout({
    title: "Prompt Hub",
    description: "Prompt-first site for browsing, copying, and sourcing reusable prompts.",
    canonicalPath: "index.html",
    body
  });
}

function buildCategoryPage(category, prompts, allPrompts, categories) {
  const meta = categoryMeta[category] || { label: category, summary: "Prompt collection." };
  return layout({
    title: `${meta.label} · Prompt Hub`,
    description: meta.summary,
    canonicalPath: categoryPath(category),
    body: `<main class="page">
  <section class="page-head">
    <div class="breadcrumb"><a ${anchorAttrs("/index.html")}>Home</a><span>/</span><span>${escapeHtml(meta.label)}</span></div>
    <p class="meta-kicker">Category</p>
    <div class="page-head-row">
      <h1 class="page-title">${escapeHtml(meta.label)}</h1>
      <div class="detail-meta-line">${prompts.length} prompts</div>
    </div>
    <p class="page-subtitle">${escapeHtml(meta.summary)}</p>
  </section>
  ${renderLibrarySection({
    prompts: allPrompts,
    categories,
    title: `${meta.label} Explorer`,
    summary: `默认聚焦在 ${meta.label}，但保留 prompt-hub 式的侧边栏筛选，你可以继续切换到别的场景或角色。`,
    initialCategory: category
  })}
</main>`
  });
}

function buildDetailPage(prompt, related) {
  const categoryLabel = categoryMeta[prompt.category]?.label || prompt.category;
  const examples = Array.isArray(prompt.examples) ? prompt.examples : [];
  const tips = Array.isArray(prompt.tips) ? prompt.tips : [];
  const sources = Array.isArray(prompt.source) ? prompt.source : [];
  const inputs = Array.isArray(prompt.inputs) ? prompt.inputs : [];
  const steps = Array.isArray(prompt.steps) ? prompt.steps : [];
  const checklist = Array.isArray(prompt.checklist) ? prompt.checklist : [];
  const roleIds = Array.isArray(prompt.roleIds) ? prompt.roleIds : [];
  const promptKind = compactText(prompt.kind || "prompt");
  const promptKindLabel = promptKind === "skill" ? "prompt" : promptKind;
  const reviewedAt = prompt.metadata?.reviewedAt ? String(prompt.metadata.reviewedAt).slice(0, 10) : "";
  const schemaVersion = compactText(prompt.metadata?.schemaVersion || "");
  const tableOfContents = [
    { id: "overview", label: "Overview" },
    { id: "content", label: "Prompt Content" },
    prompt.goal ? { id: "goal", label: "Goal" } : null,
    inputs.length ? { id: "inputs", label: "Inputs" } : null,
    steps.length ? { id: "method", label: "Method" } : null,
    prompt.outputContract ? { id: "output-contract", label: "Output Contract" } : null,
    checklist.length ? { id: "checklist", label: "Checklist" } : null,
    examples.length ? { id: "examples", label: "Examples" } : null,
    tips.length ? { id: "tips", label: "Tips" } : null,
    related.length ? { id: "related", label: "Related" } : null
  ].filter(Boolean);

  return layout({
    title: `${prompt.title} · Prompt Hub`,
    description: prompt.description,
    canonicalPath: promptDetailPath(prompt),
    body: `<main class="page">
  <section class="page-head">
    <div class="breadcrumb"><a ${anchorAttrs("/index.html")}>Home</a><span>/</span><a ${anchorAttrs(`/${categoryPath(prompt.category)}`)}>${escapeHtml(categoryLabel)}</a><span>/</span><span>${escapeHtml(prompt.title)}</span></div>
    <p class="meta-kicker">Prompt</p>
    <h1 class="page-title">${escapeHtml(prompt.title)}</h1>
    <p class="page-subtitle">${escapeHtml(prompt.description)}</p>
  </section>

  <section class="detail-layout">
    <article class="detail-main">
      <section class="detail-section" id="overview">
        <p class="detail-kicker">Overview</p>
        <div class="detail-panel detail-stack">
          <p class="detail-copy">${escapeHtml(prompt.description)}</p>
          ${roleIds.length ? `<div class="tag-row">${roleIds.map((roleId) => `<span class="tag tag-role">${escapeHtml(roleMeta[roleId]?.label || roleId)}</span>`).join("")}</div>` : ""}
        </div>
      </section>
      <section class="detail-section" id="content">
        <p class="detail-kicker">Prompt Content</p>
        <div class="action-row">
          ${promptCopyButton(prompt)}
          <a ${anchorAttrs(prompt.githubUrl, "ghost-button")}>Open GitHub</a>
        </div>
        <p class="copy-note">主动作是复制 prompt 本身；GitHub 作为源文件与版本历史入口。</p>
        <pre>${escapeHtml(prompt.content)}</pre>
      </section>
      ${
        prompt.goal
          ? `<section class="detail-section" id="goal">
        <h2>Goal</h2>
        <div class="detail-panel detail-copy">${escapeHtml(prompt.goal)}</div>
      </section>`
          : ""
      }
      ${
        inputs.length
          ? `<section class="detail-section" id="inputs">
        <h2>Inputs</h2>
        <div class="detail-grid">
          ${inputs
            .map(
              (item) => `<article class="detail-card">
            <div class="detail-card-head">
              <h3>${escapeHtml(item.name || "Input")}</h3>
              ${item.required ? '<span class="required-pill">Required</span>' : ""}
            </div>
            <p class="detail-card-copy">${escapeHtml(item.description || "No description yet.")}</p>
            ${item.example ? `<div class="detail-panel"><pre>${escapeHtml(item.example)}</pre></div>` : ""}
          </article>`
            )
            .join("")}
        </div>
      </section>`
          : ""
      }
      ${
        steps.length
          ? `<section class="detail-section" id="method">
        <h2>Method</h2>
        <ol class="detail-steps">
          ${steps
            .map(
              (step, index) => `<li class="detail-step">
            <div class="detail-step-index">${index + 1}</div>
            <div>
              <h3>${escapeHtml(step.title || `Step ${index + 1}`)}</h3>
              <p class="detail-card-copy">${escapeHtml(step.description || "")}</p>
            </div>
          </li>`
            )
            .join("")}
        </ol>
      </section>`
          : ""
      }
      ${
        prompt.outputContract
          ? `<section class="detail-section" id="output-contract">
        <h2>Output Contract</h2>
        <div class="detail-panel">
          <pre>${escapeHtml(prompt.outputContract)}</pre>
        </div>
      </section>`
          : ""
      }
      ${
        checklist.length
          ? `<section class="detail-section" id="checklist">
        <h2>Checklist</h2>
        <ul class="detail-bullets">
          ${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>`
          : ""
      }
      ${
        examples.length
          ? `<section class="detail-section" id="examples">
        <h2>Examples</h2>
        <div class="detail-grid">
          ${examples
            .map(
              (example) => `<article class="detail-card">
            <h3>Example</h3>
            <div class="detail-card-copy"><strong>Input</strong></div>
            <div class="detail-panel"><pre>${escapeHtml(example.input)}</pre></div>
            <div class="detail-card-copy"><strong>Output</strong></div>
            <div class="detail-panel"><pre>${escapeHtml(example.output)}</pre></div>
          </article>`
            )
            .join("")}
        </div>
      </section>`
          : ""
      }
      ${
        tips.length
          ? `<section class="detail-section" id="tips">
        <h2>Tips</h2>
        <ul class="detail-bullets">${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
      </section>`
          : ""
      }
      ${
        related.length
          ? `<section class="detail-section" id="related">
        <h2>Related Prompts</h2>
        <div class="related-grid">${related
          .map(
            (item) => `<article class="related-card">
            <p class="card-kicker">${escapeHtml(categoryLabel)}</p>
            <h3 class="related-title"><a ${anchorAttrs(`/${promptDetailPath(item)}`)}>${escapeHtml(item.title)}</a></h3>
            <div class="related-meta">${escapeHtml(item.id)}</div>
          </article>`
          )
          .join("")}</div>
      </section>`
          : ""
      }
    </article>
    <aside class="detail-side">
      <div class="side-block">
        <p class="side-title">Contents</p>
        <nav class="detail-toc">${tableOfContents.map((item) => `<a ${anchorAttrs(`#${item.id}`)}>${escapeHtml(item.label)}</a>`).join("")}</nav>
      </div>
      <div class="side-block">
        <p class="side-title">Format</p>
        <div class="side-list">
          <div>${escapeHtml(promptKindLabel)}</div>
          <div>${escapeHtml(roleIds.length)} roles · ${escapeHtml((prompt.tags || []).length)} tags</div>
        </div>
      </div>
      <div class="side-block">
        <p class="side-title">Category</p>
        <div class="side-list"><div><a ${anchorAttrs(`/${categoryPath(prompt.category)}`)}>${escapeHtml(categoryLabel)}</a></div><div>${escapeHtml(prompt.category)}</div></div>
      </div>
      <div class="side-block">
        <p class="side-title">Tags</p>
        <div class="tag-row">${(prompt.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || '<span class="tag">No tags</span>'}</div>
      </div>
      <div class="side-block">
        <p class="side-title">Source</p>
        <div class="side-list"><div><a ${anchorAttrs(prompt.githubUrl)}>Category JSON on GitHub</a></div><div><a ${anchorAttrs(publicRepoUrl)}>Prompt Site Repo</a></div></div>
      </div>
      ${
        sources.length
          ? `<div class="side-block">
        <p class="side-title">References</p>
        <div class="side-list">${sources.map((item) => `<div>${renderLinkedValue(item)}</div>`).join("")}</div>
      </div>`
          : ""
      }
      <div class="side-block">
        <p class="side-title">Usage Flow</p>
        <div class="side-list">
          <div>1. Browse by scene or role.</div>
          <div>2. Open the full prompt.</div>
          <div>3. Copy, adapt, then trace back to source if needed.</div>
        </div>
      </div>
      <div class="side-block">
        <p class="side-title">Metadata</p>
        <div class="side-list">
          <div><span class="mono">${escapeHtml(prompt.id)}</span></div>
          ${reviewedAt ? `<div>Reviewed: ${escapeHtml(reviewedAt)}</div>` : ""}
          ${schemaVersion ? `<div>Schema: ${escapeHtml(schemaVersion)}</div>` : ""}
        </div>
      </div>
    </aside>
  </section>
</main>`
  });
}

function buildRobotsTxt() {
  return `User-agent: *\nAllow: /\n\nSitemap: ${siteOrigin}/sitemap.xml\n`;
}

function buildSitemap(paths) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths
    .map((pagePath) => `  <url><loc>${escapeHtml(`${siteOrigin}/${pagePath.replace(/^\/+/, "")}`)}</loc></url>`)
    .join("\n")}\n</urlset>\n`;
}

function main() {
  const index = readJson(path.join(dataRoot, "index.json"));
  const categories = Object.keys(index.promptCounts);
  const prompts = categories.flatMap((category, categoryOrder) => {
    const filePath = path.join(dataRoot, `${category}.json`);
    const entries = readJson(filePath);
    return entries.map((prompt, entryOrder) => ({
      ...prompt,
      categoryOrder,
      entryOrder,
      roleIds: derivePromptRoles(prompt),
      searchText: buildPromptSearchText(prompt),
      sourceFile: `data/prompts/${category}.json`,
      githubUrl: repoBlobPath(`data/prompts/${category}.json`)
    }));
  });

  prompts.sort((a, b) => {
    if (a.categoryOrder !== b.categoryOrder) return a.categoryOrder - b.categoryOrder;
    return a.entryOrder - b.entryOrder;
  });

  ensureDir(distRoot);
  fs.copyFileSync(stylesSrc, path.join(distRoot, "site.css"));
  fs.copyFileSync(scriptSrc, path.join(distRoot, "prompt.js"));
  fs.copyFileSync(faviconSrc, path.join(distRoot, "favicon.svg"));

  writeFile(path.join(distRoot, "index.html"), buildHome({ index, prompts, categories }));

  for (const category of categories) {
    const categoryPrompts = prompts.filter((prompt) => prompt.category === category);
    writeFile(path.join(distRoot, categoryPath(category)), buildCategoryPage(category, categoryPrompts, prompts, categories));
    writeFile(
      path.join(distRoot, "data", "categories", `${category}.json`),
      JSON.stringify(categoryPrompts, null, 2) + "\n"
    );
  }

  for (const prompt of prompts) {
    const related = prompts.filter((item) => item.category === prompt.category && item.id !== prompt.id).slice(0, 4);
    writeFile(path.join(distRoot, promptDetailPath(prompt)), buildDetailPage(prompt, related));
  }

  writeFile(
    path.join(distRoot, "data", "prompts.json"),
    JSON.stringify(
      {
        generated_at: new Date().toISOString(),
        total_prompts: prompts.length,
        categories,
        prompts
      },
      null,
      2
    ) + "\n"
  );

  const sitemapPaths = [
    "index.html",
    ...categories.map((category) => categoryPath(category)),
    ...prompts.map((prompt) => promptDetailPath(prompt))
  ];

  writeFile(path.join(distRoot, "robots.txt"), buildRobotsTxt());
  writeFile(path.join(distRoot, "sitemap.xml"), buildSitemap(sitemapPaths));
  console.log(`Built prompt-site into ${distRoot}`);
}

main();
