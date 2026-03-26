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

const sceneGroupMeta = [
  {
    id: "develop",
    label: "开发",
    summary: "写代码、做架构、处理调试与工程质量时，从这里开始。",
    categories: ["coding", "p0-core-dev"]
  },
  {
    id: "design",
    label: "设计",
    summary: "做视觉、分镜、创意生成或创作辅助时，从这里开始。",
    categories: ["design", "p1-creative-tools"]
  },
  {
    id: "product",
    label: "产品",
    summary: "做需求判断、项目推进、用户画像和协作规划时，从这里开始。",
    categories: ["product", "p3-project-management"]
  },
  {
    id: "research",
    label: "研究",
    summary: "做调研、比较、分析和专业工具型任务时，从这里开始。",
    categories: ["research", "p2-professional-tools"]
  },
  {
    id: "writing",
    label: "写作",
    summary: "写文章、改稿、压缩表达或组织结构时，从这里开始。",
    categories: ["writing"]
  }
];

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

function promptCopyButton(prompt, label = "复制 Prompt", className = "copy-button") {
  return `<button class="${escapeHtml(className)}" data-copy-text="${escapeHtml(encodeURIComponent(prompt.content))}">${escapeHtml(label)}</button>`;
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
    ? prompt.steps.slice(0, 2).flatMap((item) => [item?.title])
    : [];

  return compactText(
    [
      prompt.title,
      prompt.description,
      truncateText(prompt.content, 240),
      prompt.goal,
      categoryMeta[prompt.category]?.label,
      prompt.category,
      ...(prompt.tags || []),
      ...(prompt.tips || []),
      ...inputs,
      ...steps
    ].join(" ")
  );
}

function truncateText(value, maxLength = 96) {
  const text = compactText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

function layout({ title, description, body, canonicalPath }) {
  const canonical = `${siteOrigin}/${canonicalPath.replace(/^\/+/, "")}`;
  const navLinks = [
    { label: "首页", href: "/index.html" },
    { label: "按场景开始", href: "/index.html#start" },
    { label: "全部库", href: "/index.html#library" },
    { label: "源文件", href: publicRepoUrl }
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
  const cardPreview = truncateText(prompt.content, 84);
  return `<article class="prompt-card" data-prompt-card data-prompt-category="${escapeHtml(prompt.category)}" data-prompt-roles="${escapeHtml((prompt.roleIds || []).join(","))}" data-prompt-search="${escapeHtml(prompt.searchText || "")}">
  <p class="card-kicker">${escapeHtml(categoryMeta[prompt.category]?.label || prompt.category)}</p>
  <h3 class="prompt-card-title"><a ${anchorAttrs(`/${promptDetailPath(prompt)}`)}>${escapeHtml(prompt.title)}</a></h3>
  <div class="prompt-card-meta">可直接复制 · 先用再细化</div>
  <p class="prompt-card-copy">${escapeHtml(prompt.description)}</p>
  <p class="card-preview">${escapeHtml(cardPreview)}</p>
  <div class="tag-row">${roleBadges}${(prompt.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
  <div class="action-row">
    <a ${anchorAttrs(`/${promptDetailPath(prompt)}`, "button")}>打开并使用</a>
    ${promptCopyButton(prompt, "快速复制", "text-button")}
  </div>
</article>`;
}

function renderCategoryCard(category, prompts) {
  const meta = categoryMeta[category] || { label: category, summary: "Prompt collection." };
  return `<article class="category-card">
  <p class="card-kicker">场景</p>
  <h3 class="category-card-title"><a ${anchorAttrs(`/${categoryPath(category)}`)}>${escapeHtml(meta.label)}</a></h3>
  <div class="category-card-meta">${prompts.length} 条 prompt</div>
  <p class="category-card-copy">${escapeHtml(meta.summary)}</p>
  <div class="action-row">
    <a ${anchorAttrs(`/${categoryPath(category)}`, "ghost-button")}>进入这个场景</a>
  </div>
</article>`;
}

function renderSceneTabsSection({ prompts }) {
  const initialScene = sceneGroupMeta[0]?.id;
  const buttons = sceneGroupMeta
    .map((scene) => {
      const count = prompts.filter((prompt) => scene.categories.includes(prompt.category)).length;
      return `<button class="scene-tab" type="button" data-scene-button="${escapeHtml(scene.id)}">${escapeHtml(scene.label)}<span>${count}</span></button>`;
    })
    .join("");

  const panels = sceneGroupMeta
    .map((scene) => {
      const scenePrompts = prompts.filter((prompt) => scene.categories.includes(prompt.category));
      const featuredPrompts = scenePrompts.slice(0, 4);
      const isActive = scene.id === initialScene;
      return `<section class="scene-panel" data-scene-panel="${escapeHtml(scene.id)}"${isActive ? "" : " hidden"}>
        <div class="scene-panel-head">
          <div>
            <p class="card-kicker">场景</p>
            <h3 class="scene-panel-title">${escapeHtml(scene.label)}</h3>
          </div>
          <div class="detail-meta-line">${scenePrompts.length} 条 prompt</div>
        </div>
        <p class="scene-panel-copy">${escapeHtml(scene.summary)}</p>
        <div class="scene-subnav">
          ${scene.categories
            .map(
              (category) =>
                `<a ${anchorAttrs(`/${categoryPath(category)}`, "scene-subnav-link")}>${escapeHtml(categoryMeta[category]?.label || category)}</a>`
            )
            .join("")}
        </div>
        <div class="scene-panel-actions">
          <a ${anchorAttrs(`/${categoryPath(scene.categories[0])}`, "button")}>进入这个场景</a>
          <a ${anchorAttrs("/index.html#library", "text-button")}>直接去总库筛选</a>
        </div>
        <div class="prompt-grid prompt-grid-scene">
          ${featuredPrompts.map((prompt) => renderPromptCard(prompt)).join("\n")}
        </div>
      </section>`;
    })
    .join("");

  return `<section class="section scene-tabs-section" id="start" data-scene-tabs>
    <div class="section-header">
      <div>
        <p class="section-kicker">开始</p>
        <h2 class="section-title">先选场景，再打开 prompt</h2>
      </div>
      <div class="section-summary">这是首页唯一的主路径。先选你正在做的事，再进入那组最相关的 prompt。</div>
    </div>
    <div class="scene-tab-row" role="tablist" aria-label="场景切换">
      ${buttons}
    </div>
    ${panels}
  </section>`;
}

function renderSceneLinkTabs(categories, activeCategory) {
  return `<nav class="scene-link-row" aria-label="场景切换">
    ${categories
      .map((category) => {
        const isActive = category === activeCategory;
        return `<a ${anchorAttrs(`/${categoryPath(category)}`, `scene-link${isActive ? " is-active" : ""}`)}>${escapeHtml(
          categoryMeta[category]?.label || category
        )}</a>`;
      })
      .join("")}
  </nav>`;
}

function renderLibrarySection({
  prompts,
  categories,
  categoryIds = categories,
  title,
  summary,
  kicker = "Explorer",
  initialCategory = "all",
  showCategoryFilters = true,
  searchPlaceholder = "搜索标题、描述或你要完成的任务"
}) {
  const categoryButtons = [
    `<button class="filter-button" type="button" data-filter-category="all"><span>全部 Prompt</span><span class="filter-count">${prompts.length}</span></button>`,
    ...categoryIds.map((category) => {
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
            <p class="side-title">关键词</p>
            <button class="text-button" type="button" data-library-clear>清空</button>
          </div>
          <input class="search-input" type="search" placeholder="${escapeHtml(searchPlaceholder)}" data-library-search />
          <p class="filter-copy">知道自己要什么时，再来这里细筛；不知道时，先从上面的场景入口开始。</p>
        </div>
        ${
          showCategoryFilters
            ? `<div class="filter-block">
          <p class="side-title">场景</p>
          <div class="filter-stack">${categoryButtons}</div>
        </div>`
            : ""
        }
        <div class="filter-block">
          <p class="side-title">角色</p>
          <div class="filter-stack">${roleButtons}</div>
        </div>
      </aside>
      <div class="library-main">
        <div class="library-toolbar">
          <div>
            <div class="library-status"><span class="mono" data-library-count>${prompts.length}</span> 条结果</div>
            <div class="library-summary" data-library-summary>全部结果</div>
          </div>
          <button class="ghost-button library-toggle" type="button" data-library-toggle>筛选</button>
        </div>
        <div class="prompt-grid prompt-grid-library">
          ${prompts.map((prompt) => renderPromptCard(prompt)).join("\n")}
        </div>
        <div class="empty-card" data-library-empty hidden>
          <p class="card-kicker">结果为空</p>
          <h3 class="prompt-card-title">没有找到匹配的 prompt</h3>
          <p class="empty-copy">试试更短的关键词，或者先清空角色筛选。</p>
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
  const syncLabel = index.lastUpdated ? String(index.lastUpdated).slice(0, 10) : "Live";
  const body = `<main class="page">
  <section class="hero">
    <div>
      <p class="eyebrow">Prompt Hub</p>
      <h1 class="hero-title">先选场景，再打开能直接用的 prompt。</h1>
      <p class="hero-copy">这里不是先让你研究站点结构，而是先让你找到正在做的那类事。先从场景 tabs 进入，再决定要不要继续细筛。</p>
      <div class="hero-actions">
        <a ${anchorAttrs("/index.html#start", "button")}>按场景开始</a>
        <a ${anchorAttrs("/index.html#library", "text-button")}>我已经知道要找什么</a>
      </div>
    </div>
    <div class="hero-side">
      <div class="hero-note"><strong>主路径</strong>首页只有一个主入口: 先选场景。</div>
      <div class="hero-note"><strong>多场景 tabs</strong>保留你熟悉的场景切换方式，但把它放到真正的一等位置。</div>
      <div class="hero-note"><strong>先用后读</strong>详情页先给可复制正文，再把完整说明放到后面。</div>
    </div>
  </section>

  <section class="index-strip">
    <div><span class="mono">${prompts.length}</span> 条 prompt</div>
    <div><span class="mono">${sceneGroupMeta.length}</span> 个主场景</div>
    <div>主动作: 复制并使用</div>
    <div>最近同步: <span class="mono">${escapeHtml(syncLabel)}</span></div>
  </section>

  ${renderSceneTabsSection({ prompts })}
  ${renderLibrarySection({
    prompts,
    categories,
    title: "全部 Prompt 库",
    summary: "当你已经知道自己要找什么，再进入这里做关键词、角色和场景的细筛。",
    kicker: "全部库",
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
  const featuredPrompts = prompts.slice(0, 6);
  return layout({
    title: `${meta.label} · Prompt Hub`,
    description: meta.summary,
    canonicalPath: categoryPath(category),
    body: `<main class="page">
  <section class="page-head">
    <div class="breadcrumb"><a ${anchorAttrs("/index.html")}>首页</a><span>/</span><span>${escapeHtml(meta.label)}</span></div>
    <p class="meta-kicker">场景</p>
    <div class="page-head-row">
      <h1 class="page-title">${escapeHtml(meta.label)}</h1>
      <div class="detail-meta-line">${prompts.length} 条 prompt</div>
    </div>
    <p class="page-subtitle">${escapeHtml(meta.summary)}</p>
    ${renderSceneLinkTabs(categories, category)}
  </section>

  <section class="section scene-focus">
    <div class="section-header">
      <div>
        <p class="section-kicker">当前场景</p>
        <h2 class="section-title">先看这个场景里最常用的 prompt</h2>
      </div>
      <div class="section-summary">先拿到这组高频 prompt，再决定要不要继续展开完整筛选。</div>
    </div>
    <div class="section-actions">
      <a ${anchorAttrs("#library", "button")}>继续细筛</a>
      <a ${anchorAttrs("/index.html#library", "text-button")}>去总库探索</a>
    </div>
    <div class="prompt-grid prompt-grid-scene">
      ${featuredPrompts.map((prompt) => renderPromptCard(prompt)).join("\n")}
    </div>
  </section>
  ${renderLibrarySection({
    prompts,
    categories,
    categoryIds: [category],
    title: `${meta.label} 内继续筛选`,
    summary: `如果你已经接近目标，就在 ${meta.label} 这个场景里继续按关键词或角色缩小范围。`,
    kicker: "筛选",
    initialCategory: category,
    showCategoryFilters: false
  })}
</main>`
  });
}

function buildDetailPage(prompt, related) {
  const categoryLabel = categoryMeta[prompt.category]?.label || prompt.category;
  const examples = Array.isArray(prompt.examples) ? prompt.examples : [];
  const primaryExample = examples[0] || null;
  const extraExamples = examples.slice(1);
  const tips = Array.isArray(prompt.tips) ? prompt.tips : [];
  const sources = Array.isArray(prompt.source) ? prompt.source : [];
  const inputs = Array.isArray(prompt.inputs) ? prompt.inputs : [];
  const steps = Array.isArray(prompt.steps) ? prompt.steps : [];
  const checklist = Array.isArray(prompt.checklist) ? prompt.checklist : [];
  const roleIds = Array.isArray(prompt.roleIds) ? prompt.roleIds : [];
  const reviewedAt = prompt.metadata?.reviewedAt ? String(prompt.metadata.reviewedAt).slice(0, 10) : "";
  const schemaVersion = compactText(prompt.metadata?.schemaVersion || "");
  const hasGuide = Boolean(prompt.goal || inputs.length || steps.length || prompt.outputContract || checklist.length || extraExamples.length || tips.length);

  return layout({
    title: `${prompt.title} · Prompt Hub`,
    description: prompt.description,
    canonicalPath: promptDetailPath(prompt),
    body: `<main class="page">
  <section class="page-head">
    <div class="breadcrumb"><a ${anchorAttrs("/index.html")}>首页</a><span>/</span><a ${anchorAttrs(`/${categoryPath(prompt.category)}`)}>${escapeHtml(categoryLabel)}</a><span>/</span><span>${escapeHtml(prompt.title)}</span></div>
    <p class="meta-kicker">场景 Prompt</p>
    <h1 class="page-title">${escapeHtml(prompt.title)}</h1>
    <p class="page-subtitle">${escapeHtml(prompt.description)}</p>
  </section>

  <section class="detail-layout">
    <article class="detail-main">
      <section class="detail-section" id="overview">
        <p class="detail-kicker">这条 Prompt 适合做什么</p>
        <div class="detail-panel detail-stack">
          <p class="detail-copy">${escapeHtml(prompt.description)}</p>
          ${roleIds.length ? `<div class="tag-row">${roleIds.map((roleId) => `<span class="tag tag-role">${escapeHtml(roleMeta[roleId]?.label || roleId)}</span>`).join("")}</div>` : ""}
        </div>
      </section>
      <section class="detail-section" id="content">
        <div class="detail-head">
          <div>
            <p class="detail-kicker">现在就用</p>
            <h2>直接复制</h2>
          </div>
          <div class="action-row">
            ${promptCopyButton(prompt, "复制这条 Prompt")}
            <a ${anchorAttrs(prompt.githubUrl, "text-button")}>查看源文件</a>
          </div>
        </div>
        <p class="copy-note">如果你只想马上开始，复制下面正文就够了。完整说明放在下方的展开区。</p>
        <div class="detail-panel detail-panel-strong">
          <pre>${escapeHtml(prompt.content)}</pre>
        </div>
      </section>
      ${
        primaryExample
          ? `<section class="detail-section" id="example">
        <h2>最短示例</h2>
        <div class="detail-grid detail-grid-single">
          <article class="detail-card">
            <div class="detail-card-copy"><strong>你可以这样给</strong></div>
            <div class="detail-panel"><pre>${escapeHtml(primaryExample.input)}</pre></div>
            <div class="detail-card-copy"><strong>你会得到</strong></div>
            <div class="detail-panel"><pre>${escapeHtml(primaryExample.output)}</pre></div>
          </article>
        </div>
      </section>`
          : ""
      }
      ${
        hasGuide
          ? `<details class="detail-guide">
        <summary>展开完整使用说明</summary>
        <div class="detail-guide-body">
          ${
            prompt.goal
              ? `<section class="detail-section" id="goal">
          <h2>适用目标</h2>
          <div class="detail-panel detail-copy">${escapeHtml(prompt.goal)}</div>
        </section>`
              : ""
          }
          ${
            inputs.length
              ? `<section class="detail-section" id="inputs">
        <h2>你需要提供</h2>
        <div class="detail-grid">
          ${inputs
            .map(
              (item) => `<article class="detail-card">
            <div class="detail-card-head">
              <h3>${escapeHtml(item.name || "输入项")}</h3>
              ${item.required ? '<span class="required-pill">必填</span>' : ""}
            </div>
            <p class="detail-card-copy">${escapeHtml(item.description || "暂无说明。")}</p>
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
        <h2>使用步骤</h2>
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
        <h2>输出格式</h2>
        <div class="detail-panel">
          <pre>${escapeHtml(prompt.outputContract)}</pre>
        </div>
      </section>`
              : ""
          }
          ${
            checklist.length
              ? `<section class="detail-section" id="checklist">
        <h2>自查清单</h2>
        <ul class="detail-bullets">
          ${checklist.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}
        </ul>
      </section>`
              : ""
          }
          ${
            extraExamples.length
              ? `<section class="detail-section" id="examples">
        <h2>更多示例</h2>
        <div class="detail-grid">
          ${extraExamples
            .map(
              (example) => `<article class="detail-card">
            <h3>示例</h3>
            <div class="detail-card-copy"><strong>你可以这样给</strong></div>
            <div class="detail-panel"><pre>${escapeHtml(example.input)}</pre></div>
            <div class="detail-card-copy"><strong>你会得到</strong></div>
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
        <h2>使用提示</h2>
        <ul class="detail-bullets">${tips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
      </section>`
              : ""
          }
        </div>
      </details>`
          : ""
      }
      ${
        related.length
          ? `<section class="detail-section" id="related">
        <h2>同场景推荐</h2>
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
        <p class="side-title">所在场景</p>
        <div class="side-list"><div><a ${anchorAttrs(`/${categoryPath(prompt.category)}`)}>${escapeHtml(categoryLabel)}</a></div></div>
      </div>
      ${
        roleIds.length
          ? `<div class="side-block">
        <p class="side-title">适合谁</p>
        <div class="tag-row">${roleIds.map((roleId) => `<span class="tag tag-role">${escapeHtml(roleMeta[roleId]?.label || roleId)}</span>`).join("")}</div>
      </div>`
          : ""
      }
      <div class="side-block">
        <p class="side-title">标签</p>
        <div class="tag-row">${(prompt.tags || []).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("") || '<span class="tag">暂无标签</span>'}</div>
      </div>
      <div class="side-block">
        <p class="side-title">源文件</p>
        <div class="side-list"><div><a ${anchorAttrs(prompt.githubUrl)}>查看 GitHub 中的分类源文件</a></div><div><a ${anchorAttrs(publicRepoUrl)}>查看站点仓库</a></div></div>
      </div>
      ${
        sources.length
          ? `<div class="side-block">
        <p class="side-title">参考链接</p>
        <div class="side-list">${sources.map((item) => `<div>${renderLinkedValue(item)}</div>`).join("")}</div>
      </div>`
          : ""
      }
      <div class="side-block">
        <p class="side-title">版本信息</p>
        <div class="side-list">
          <div><span class="mono">${escapeHtml(prompt.id)}</span></div>
          ${reviewedAt ? `<div>更新记录: ${escapeHtml(reviewedAt)}</div>` : ""}
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
