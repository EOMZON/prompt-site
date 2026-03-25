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

function layout({ title, description, body, canonicalPath }) {
  const canonical = `${siteOrigin}/${canonicalPath.replace(/^\/+/, "")}`;
  const navLinks = [
    { label: "Home", href: "/index.html" },
    { label: "All Prompts", href: "/index.html#prompts" },
    { label: "GitHub", href: publicRepoUrl },
    { label: "Skills", href: "https://skills.zondev.top/" }
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
          <a class="brand" href="/index.html"><strong>Prompt</strong><span>Site</span></a>
          <nav class="nav">
            ${navLinks.map((link) => `<a ${anchorAttrs(link.href)}>${escapeHtml(link.label)}</a>`).join("")}
          </nav>
        </div>
      </header>
      ${body}
      <footer class="footer">
        <div>Prompt Site · copy-first prompt library · source repo <a ${anchorAttrs(publicRepoUrl)}>EOMZON/prompt-site</a> · author <a ${anchorAttrs(authorGithubUrl)}>@EOMZON</a></div>
      </footer>
    </div>
    <script src="/prompt.js"></script>
  </body>
</html>
`;
}

function renderPromptCard(prompt) {
  return `<article class="prompt-card">
  <p class="card-kicker">${escapeHtml(categoryMeta[prompt.category]?.label || prompt.category)}</p>
  <h3 class="prompt-card-title"><a ${anchorAttrs(`/${promptDetailPath(prompt)}`)}>${escapeHtml(prompt.title)}</a></h3>
  <div class="prompt-card-meta">${escapeHtml(prompt.category)} · ${escapeHtml(prompt.id)}</div>
  <p class="prompt-card-copy">${escapeHtml(prompt.description)}</p>
  <div class="tag-row">${(prompt.tags || []).slice(0, 4).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
  <div class="action-row">
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

function buildHome({ index, prompts, categories }) {
  const featured = prompts.slice(0, 12);
  const syncLabel = index.lastUpdated ? String(index.lastUpdated).slice(0, 10) : "Live";
  const body = `<main class="page">
  <section class="hero">
    <div>
      <p class="eyebrow">Prompt-Only Frontend</p>
      <h1 class="hero-title">Pure prompts, separate from skills.</h1>
      <p class="hero-copy">这里不再讨论 skills，也不再把 prompt 当成迁移入口。这个站点只做 prompt：浏览、打开、复制、回到 GitHub 查看源文件。</p>
      <div class="hero-actions">
        <a ${anchorAttrs("/index.html#prompts", "button")}>Browse Prompts</a>
        <a ${anchorAttrs(publicRepoUrl, "ghost-button")}>Open GitHub</a>
        <a ${anchorAttrs("https://skills.zondev.top/", "ghost-button")}>Open Skills</a>
      </div>
    </div>
    <div class="hero-side">
      <div class="hero-note"><strong>Copy-first</strong>详情页把 prompt 内容直接展开，并提供稳定的复制动作。</div>
      <div class="hero-note"><strong>Prompt-only</strong>这个前台不再承接 skills 的发现逻辑，信息结构彻底分开。</div>
      <div class="hero-note"><strong>Repo-backed</strong>每条 prompt 都能回到 GitHub 中对应的分类源文件。</div>
    </div>
  </section>

  <section class="stats-strip">
    <div><span class="stat-value">${prompts.length}</span><span class="stat-label">Prompts</span></div>
    <div><span class="stat-value">${categories.length}</span><span class="stat-label">Categories</span></div>
    <div><span class="stat-value">Copy</span><span class="stat-label">Primary Action</span></div>
    <div><span class="stat-value">${escapeHtml(syncLabel)}</span><span class="stat-label">Last Sync</span></div>
  </section>

  <section class="section">
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

  <section class="section" id="prompts">
    <div class="section-header">
      <div>
        <p class="section-kicker">Prompts</p>
        <h2 class="section-title">先打开，再复制</h2>
      </div>
      <div class="section-summary">首页只展示最值得先看的 prompt 卡片；完整内容在详情页里展开，避免首页被超长文本淹没。</div>
    </div>
    <div class="prompt-grid">
      ${featured.map((prompt) => renderPromptCard(prompt)).join("\n")}
    </div>
  </section>
</main>`;

  return layout({
    title: "Prompt Site",
    description: "Prompt-only site for browsing, copying, and sourcing reusable prompts.",
    canonicalPath: "index.html",
    body
  });
}

function buildCategoryPage(category, prompts) {
  const meta = categoryMeta[category] || { label: category, summary: "Prompt collection." };
  return layout({
    title: `${meta.label} · Prompt Site`,
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
  <section class="section">
    <div class="prompt-grid">
      ${prompts.map((prompt) => renderPromptCard(prompt)).join("\n")}
    </div>
  </section>
</main>`
  });
}

function buildDetailPage(prompt, related) {
  const categoryLabel = categoryMeta[prompt.category]?.label || prompt.category;
  const examples = Array.isArray(prompt.examples) ? prompt.examples : [];
  const tips = Array.isArray(prompt.tips) ? prompt.tips : [];
  const sources = Array.isArray(prompt.source) ? prompt.source : [];

  return layout({
    title: `${prompt.title} · Prompt Site`,
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
      <section class="detail-section">
        <p class="detail-kicker">Prompt Content</p>
        <div class="action-row">
          ${promptCopyButton(prompt)}
          <a ${anchorAttrs(prompt.githubUrl, "ghost-button")}>Open GitHub</a>
        </div>
        <p class="copy-note">主动作是复制 prompt 本身；GitHub 作为源文件与版本历史入口。</p>
        <pre>${escapeHtml(prompt.content)}</pre>
      </section>
      ${
        examples.length
          ? `<section class="detail-section">
        <h2>Examples</h2>
        ${examples
          .map(
            (example) => `<div class="detail-meta-copy"><strong>Input</strong><br />${escapeHtml(example.input)}<br /><br /><strong>Output</strong><br />${escapeHtml(example.output)}</div>`
          )
          .join("")}
      </section>`
          : ""
      }
      ${
        tips.length
          ? `<section class="detail-section">
        <h2>Tips</h2>
        <div class="side-list">${tips.map((tip) => `<div>${escapeHtml(tip)}</div>`).join("")}</div>
      </section>`
          : ""
      }
      ${
        related.length
          ? `<section class="detail-section">
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
        <div class="side-list">${sources.map((item) => `<div>${escapeHtml(item)}</div>`).join("")}</div>
      </div>`
          : ""
      }
      <div class="side-block">
        <p class="side-title">Prompt ID</p>
        <div class="side-list"><div class="mono">${escapeHtml(prompt.id)}</div></div>
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
    writeFile(path.join(distRoot, categoryPath(category)), buildCategoryPage(category, categoryPrompts));
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
