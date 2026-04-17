const state = {
  entries: [],
  tools: [],
  selected: null,
  filter: "all",
  root: ""
};

const els = {
  stats: document.querySelector("#stats"),
  refreshBtn: document.querySelector("#refreshBtn"),
  fileType: document.querySelector("#fileType"),
  fileInput: document.querySelector("#fileInput"),
  scanExistingBtn: document.querySelector("#scanExistingBtn"),
  importExistingBtn: document.querySelector("#importExistingBtn"),
  scanResult: document.querySelector("#scanResult"),
  toggleComposerBtn: document.querySelector("#toggleComposerBtn"),
  composerPanel: document.querySelector("#composerPanel"),
  pasteType: document.querySelector("#pasteType"),
  markdownInput: document.querySelector("#markdownInput"),
  saveMarkdownBtn: document.querySelector("#saveMarkdownBtn"),
  loadTemplateBtn: document.querySelector("#loadTemplateBtn"),
  projectRootInput: document.querySelector("#projectRootInput"),
  toolGrid: document.querySelector("#toolGrid"),
  entryList: document.querySelector("#entryList"),
  entryDetail: document.querySelector("#entryDetail"),
  toast: document.querySelector("#toast")
};

init();

function init() {
  els.refreshBtn.addEventListener("click", refresh);
  els.fileInput.addEventListener("change", importFile);
  els.scanExistingBtn.addEventListener("click", scanExisting);
  els.importExistingBtn.addEventListener("click", importExisting);
  els.toggleComposerBtn.addEventListener("click", toggleComposer);
  els.saveMarkdownBtn.addEventListener("click", savePastedMarkdown);
  els.loadTemplateBtn.addEventListener("click", loadTemplate);
  els.projectRootInput.addEventListener("change", refresh);
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      state.filter = tab.dataset.filter;
      document.querySelectorAll(".tab").forEach((item) => item.classList.toggle("active", item === tab));
      renderEntries();
    });
  });
  refresh();
}

async function refresh() {
  const projectRoot = els.projectRootInput.value || "";
  const summary = await api(`/api/summary?projectRoot=${encodeURIComponent(projectRoot)}`);
  state.entries = summary.entries || [];
  state.tools = summary.tools || [];
  state.root = summary.root;
  if (!els.projectRootInput.value) els.projectRootInput.value = summary.root;
  if (state.selected) {
    state.selected = state.entries.find((entry) => entry.file === state.selected.file) || null;
  }
  render();
}

function render() {
  renderStats();
  renderTools();
  renderEntries();
  renderDetail();
}

function renderStats() {
  const skillCount = state.entries.filter((entry) => entry.type === "skill").length;
  const ruleCount = state.entries.filter((entry) => entry.type === "rule").length;
  const installed = state.tools.filter((tool) => tool.installed).length;
  els.stats.innerHTML = `
    <div class="stat"><strong>${skillCount}</strong><span>Skills</span></div>
    <div class="stat"><strong>${ruleCount}</strong><span>Rules</span></div>
    <div class="stat"><strong>${installed}</strong><span>已检测工具</span></div>
    <div class="stat"><strong>${state.tools.length}</strong><span>支持工具</span></div>
  `;
}

function renderTools() {
  els.toolGrid.innerHTML = state.tools.map((tool) => {
    const globalPaths = tool.globalPaths.map((item) => `<li>${escapeHtml(shortPath(item.path))} ${pathLabel(item)}</li>`).join("");
    const projectPaths = tool.projectPaths.map((item) => `<li>${escapeHtml(shortPath(item.path))} ${pathLabel(item)}</li>`).join("");
    return `
      <article class="tool">
        <h3>${escapeHtml(tool.name)}</h3>
        <span class="pill ${tool.installed ? "ok" : "warn"}">${tool.installed ? "Detected" : "Unknown"}</span>
        <p>${escapeHtml(tool.version || "Version unknown")}</p>
        <ul class="pathList">
          <li><strong>Global</strong></li>
          ${globalPaths}
          <li><strong>Project</strong></li>
          ${projectPaths}
        </ul>
      </article>
    `;
  }).join("");
}

function renderEntries() {
  const entries = state.entries.filter((entry) => state.filter === "all" || entry.type === state.filter);
  if (!entries.length) {
    els.entryList.innerHTML = `<div class="entryItem"><strong>还没有内容</strong><small>先添加一个 Markdown 文件。</small></div>`;
    return;
  }
  els.entryList.innerHTML = entries.map((entry) => `
    <button class="entryItem ${state.selected && state.selected.file === entry.file ? "active" : ""}" data-file="${escapeAttr(entry.file)}">
      <strong>${escapeHtml(entry.name)}</strong>
      <small>${escapeHtml(entry.type)} · ${escapeHtml(entry.id)}</small>
      <small>${escapeHtml(entry.targets.join(", ") || "未选择工具")} · ${escapeHtml(entry.scope.join(", ") || "未选择范围")}</small>
      <small>${escapeHtml(shortPath(entry.file))}</small>
    </button>
  `).join("");
  els.entryList.querySelectorAll(".entryItem[data-file]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selected = state.entries.find((entry) => entry.file === button.dataset.file);
      render();
    });
  });
}

function renderDetail() {
  const entry = state.selected;
  if (!entry) {
    els.entryDetail.className = "detail empty";
    els.entryDetail.innerHTML = `<h3>选择一个 Skill 或 Rule</h3><p>可以查看 Markdown 原文、修改内容、预览目标工具输出并同步。</p>`;
    return;
  }
  els.entryDetail.className = "detail";
  const toolChecks = state.tools.map((tool) => `
    <label class="check"><input type="checkbox" name="targetTool" value="${tool.id}" ${entry.targets.includes(tool.id) ? "checked" : ""}>${tool.name}</label>
  `).join("");
  const scopeChecks = ["global", "project"].map((scope) => `
    <label class="check"><input type="checkbox" name="targetScope" value="${scope}" ${entry.scope.includes(scope) ? "checked" : ""}>${scope === "global" ? "全局" : "当前项目"}</label>
  `).join("");
  els.entryDetail.innerHTML = `
    <div class="sectionHead">
      <div>
        <p class="eyebrow">${escapeHtml(entry.type)}</p>
        <h2>${escapeHtml(entry.name)}</h2>
      </div>
      <button id="deleteEntryBtn" class="button danger">删除</button>
    </div>
    <div class="metaGrid">
      <label>ID<input id="editId" value="${escapeAttr(entry.id)}"></label>
      <label>名称<input id="editName" value="${escapeAttr(entry.name)}"></label>
      <label>描述<input id="editDescription" value="${escapeAttr(entry.description)}"></label>
      <label>标签<input id="editTags" value="${escapeAttr(entry.tags.join(", "))}"></label>
    </div>
    <p><strong>目标工具</strong></p>
    <div class="checkboxGrid">${toolChecks}</div>
    <p><strong>作用范围</strong></p>
    <div class="checkboxGrid">${scopeChecks}</div>
    <label>Markdown 正文
      <textarea id="editContent" spellcheck="false">${escapeHtml(entry.content)}</textarea>
    </label>
    <div class="row">
      <button id="saveEntryBtn" class="button primary">保存修改</button>
      <button id="previewBtn" class="button">预览输出</button>
      <button id="syncBtn" class="button primary">同步到工具</button>
    </div>
    <p><strong>文件</strong> ${escapeHtml(entry.file)}</p>
    <div id="previewOutput"></div>
  `;
  document.querySelector("#saveEntryBtn").addEventListener("click", saveEditedEntry);
  document.querySelector("#previewBtn").addEventListener("click", previewEntry);
  document.querySelector("#syncBtn").addEventListener("click", syncEntry);
  document.querySelector("#deleteEntryBtn").addEventListener("click", deleteEntry);
}

async function importFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const raw = await file.text();
  await saveMarkdown(raw, els.fileType.value, file.name);
  event.target.value = "";
}

async function scanExisting() {
  const projectRoot = els.projectRootInput.value || state.root;
  const result = await api(`/api/scan-existing?projectRoot=${encodeURIComponent(projectRoot)}`);
  renderScanResult(result, false);
}

async function importExisting() {
  const projectRoot = els.projectRootInput.value || state.root;
  const result = await api("/api/import-existing", {
    method: "POST",
    body: JSON.stringify({ projectRoot })
  });
  renderScanResult(result, true);
  toast(`已导入 ${result.imported.length} 个，跳过 ${result.skipped.length} 个。`);
  await refresh();
}

function renderScanResult(result, importedMode) {
  const items = importedMode ? result.imported : result.candidates;
  const title = importedMode ? "导入结果" : "扫描候选";
  els.scanResult.innerHTML = `
    <strong>${title}: ${items.length} 个；跳过重复/异常: ${result.skipped.length} 个</strong>
    <ul>
      ${items.slice(0, 8).map((item) => `<li>${escapeHtml(item.type)} · ${escapeHtml(item.name)} · ${escapeHtml(item.sourceTool)} · ${escapeHtml(shortPath(item.sourcePath))}</li>`).join("")}
    </ul>
    ${items.length > 8 ? `<span>还有 ${items.length - 8} 个未显示。</span>` : ""}
  `;
}

async function savePastedMarkdown() {
  await saveMarkdown(els.markdownInput.value, els.pasteType.value, "pasted.md");
  els.markdownInput.value = "";
}

async function saveMarkdown(raw, type, originalName) {
  if (!raw.trim()) {
    toast("Markdown 内容不能为空。");
    return;
  }
  await api("/api/entry", {
    method: "POST",
    body: JSON.stringify({ raw, type, originalName })
  });
  toast("Markdown 已保存。");
  await refresh();
}

async function saveEditedEntry() {
  const entry = state.selected;
  const body = collectDetailBody(entry);
  await api("/api/entry", {
    method: "POST",
    body: JSON.stringify(body)
  });
  toast("修改已保存。");
  await refresh();
}

async function previewEntry() {
  const entry = state.selected;
  const body = collectSyncBody(entry);
  const result = await api("/api/preview", {
    method: "POST",
    body: JSON.stringify(body)
  });
  document.querySelector("#previewOutput").innerHTML = result.files.map((file) => `
    <h3>${escapeHtml(file.tool)} · ${file.scope}</h3>
    <p>${escapeHtml(file.targetPath)}</p>
    <pre class="preview">${escapeHtml(file.content)}</pre>
  `).join("") || "<p>请选择至少一个工具和作用范围。</p>";
}

async function syncEntry() {
  const entry = state.selected;
  const saved = await api("/api/entry", {
    method: "POST",
    body: JSON.stringify(collectDetailBody(entry))
  });
  const body = collectSyncBody(saved.entry);
  const result = await api("/api/sync", {
    method: "POST",
    body: JSON.stringify(body)
  });
  const lines = result.results.map((item) => {
    const verify = item.verification || {};
    const status = item.ok ? "已写入并校验" : "写入后校验失败";
    const backup = item.backup ? "，已备份旧文件" : "";
    return `${item.tool}/${item.scope}: ${status}，${verify.bytes || 0} bytes${backup}\n${item.targetPath}`;
  });
  document.querySelector("#previewOutput").innerHTML = `<pre class="preview">${escapeHtml(lines.join("\n\n"))}</pre>`;
  toast("同步完成。");
  await refresh();
}

async function deleteEntry() {
  const entry = state.selected;
  if (!confirm(`删除 ${entry.name}？`)) return;
  await api(`/api/entry?file=${encodeURIComponent(entry.file)}`, { method: "DELETE" });
  state.selected = null;
  toast("已删除。");
  await refresh();
}

function collectDetailBody(entry) {
  return {
    file: entry.file,
    raw: entry.raw,
    id: document.querySelector("#editId").value,
    type: entry.type,
    name: document.querySelector("#editName").value,
    description: document.querySelector("#editDescription").value,
    tags: document.querySelector("#editTags").value.split(",").map((item) => item.trim()).filter(Boolean),
    targets: checkedValues("targetTool"),
    scope: checkedValues("targetScope"),
    content: document.querySelector("#editContent").value,
    enabled: true,
    version: entry.version || "1.0.0"
  };
}

function collectSyncBody(entry) {
  return {
    file: entry.file,
    tools: checkedValues("targetTool"),
    scopes: checkedValues("targetScope"),
    projectRoot: els.projectRootInput.value
  };
}

function pathLabel(item) {
  const status = item.exists ? "存在" : "未创建";
  const managed = item.managedFiles ? ` · ${item.managedFiles} managed` : "";
  return `${status}${managed}`;
}

function checkedValues(name) {
  return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`)).map((item) => item.value);
}

function loadTemplate() {
  const type = els.pasteType.value;
  const id = type === "skill" ? "my-new-skill" : "my-new-rule";
  const title = type === "skill" ? "My New Skill" : "My New Rule";
  els.markdownInput.value = `---\nid: ${id}\ntype: ${type}\nname: ${title}\ndescription: Describe when to use this ${type}.\ntags:\n  - workflow\ntargets:\n  - codex\n  - claude\n  - cursor\n  - codebuddy\nscope:\n  - project\nenabled: true\nversion: 1.0.0\n---\n\n# ${title}\n\nWrite the ${type} instructions here.\n`;
}

function toggleComposer() {
  els.composerPanel.hidden = !els.composerPanel.hidden;
  els.toggleComposerBtn.textContent = els.composerPanel.hidden ? "粘贴 / 新建" : "收起编辑器";
}

async function api(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

function toast(message) {
  els.toast.textContent = message;
  els.toast.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => {
    els.toast.hidden = true;
  }, 2800);
}

function shortPath(value) {
  const root = state.root || "";
  return value && root && value.startsWith(root) ? value.replace(root, ".") : value;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}
