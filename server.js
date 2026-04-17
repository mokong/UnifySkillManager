const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const crypto = require("crypto");

const PORT = Number(process.env.PORT || 4310);
const ROOT = __dirname;
const LIBRARY_DIR = path.join(ROOT, "library");
const SKILLS_DIR = path.join(LIBRARY_DIR, "skills");
const RULES_DIR = path.join(LIBRARY_DIR, "rules");
const BACKUPS_DIR = path.join(ROOT, "backups");
const CONFIG_DIR = path.join(ROOT, "config");
const PUBLIC_DIR = path.join(ROOT, "public");
const GENERATED_MARKER = "<!-- Managed by UnifySkillManager. Manual edits may be overwritten. -->";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".txt": "text/plain; charset=utf-8"
};

ensureDirs();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await routeApi(req, res, url);
      return;
    }
    await serveStatic(res, url.pathname);
  } catch (error) {
    sendJson(res, 500, { error: error.message || String(error) });
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`UnifySkillManager running at http://127.0.0.1:${PORT}`);
});

async function routeApi(req, res, url) {
  if (req.method === "GET" && url.pathname === "/api/summary") {
    const entries = await scanEntries();
    const tools = await detectTools(url.searchParams.get("projectRoot") || ROOT);
    sendJson(res, 200, { root: ROOT, entries, tools });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/entries") {
    sendJson(res, 200, { entries: await scanEntries() });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/entry") {
    const body = await readJson(req);
    const result = await saveEntry(body);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "DELETE" && url.pathname === "/api/entry") {
    const file = safeResolve(ROOT, url.searchParams.get("file") || "");
    if (!file.startsWith(LIBRARY_DIR + path.sep)) {
      sendJson(res, 400, { error: "File must be inside library." });
      return;
    }
    if (fs.existsSync(file)) fs.unlinkSync(file);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/tools") {
    sendJson(res, 200, { tools: await detectTools(url.searchParams.get("projectRoot") || ROOT) });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/scan-existing") {
    const result = await scanExistingToolFiles(url.searchParams.get("projectRoot") || ROOT);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/import-existing") {
    const body = await readJson(req);
    const result = await importExistingToolFiles(body.projectRoot || ROOT);
    sendJson(res, 200, result);
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/preview") {
    const body = await readJson(req);
    const entry = await getEntryByFile(body.file);
    const files = renderForTools(entry, body.tools || entry.targets || [], body.scopes || entry.scope || [], body.projectRoot || ROOT);
    sendJson(res, 200, { files });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/sync") {
    const body = await readJson(req);
    const entry = await getEntryByFile(body.file);
    const rendered = renderForTools(entry, body.tools || entry.targets || [], body.scopes || entry.scope || [], body.projectRoot || ROOT);
    const results = [];
    for (const file of rendered) {
      results.push(await writeManagedFile(file));
    }
    sendJson(res, 200, { results });
    return;
  }

  sendJson(res, 404, { error: "Not found" });
}

async function serveStatic(res, pathname) {
  let filePath = pathname === "/" ? path.join(PUBLIC_DIR, "index.html") : path.join(PUBLIC_DIR, decodeURIComponent(pathname));
  filePath = safeResolve(PUBLIC_DIR, path.relative(PUBLIC_DIR, filePath));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendText(res, 403, "Forbidden");
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendText(res, 404, "Not found");
    return;
  }
  res.writeHead(200, {
    "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
    "Cache-Control": "no-store"
  });
  fs.createReadStream(filePath).pipe(res);
}

function ensureDirs() {
  for (const dir of [SKILLS_DIR, RULES_DIR, BACKUPS_DIR, CONFIG_DIR, PUBLIC_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function scanEntries() {
  const files = [
    ...listMd(SKILLS_DIR),
    ...listMd(RULES_DIR)
  ];
  const entries = [];
  for (const file of files) {
    try {
      const raw = fs.readFileSync(file, "utf8");
      entries.push(parseMarkdownEntry(raw, file));
    } catch (error) {
      entries.push({ file, id: path.basename(file, ".md"), type: "skill", name: path.basename(file, ".md"), parseError: error.message });
    }
  }
  return entries.sort((a, b) => `${a.type}:${a.name}`.localeCompare(`${b.type}:${b.name}`));
}

function listMd(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter((name) => name.toLowerCase().endsWith(".md"))
    .map((name) => path.join(dir, name));
}

function listMdRecursive(dir, depth = 3) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const results = [];
  walk(dir, depth);
  return results;

  function walk(current, remaining) {
    if (remaining < 0) return;
    for (const name of fs.readdirSync(current)) {
      if (name === "node_modules" || name === ".git") continue;
      const item = path.join(current, name);
      const stat = fs.statSync(item);
      if (stat.isDirectory()) {
        walk(item, remaining - 1);
      } else if (name.toLowerCase().endsWith(".md")) {
        results.push(item);
      }
    }
  }
}

async function saveEntry(body) {
  const raw = String(body.raw || "");
  if (!raw.trim()) throw new Error("Markdown content is required.");
  const parsed = parseMarkdownEntry(raw, body.originalName || "untitled.md", body.type || "skill");
  const type = parsed.type === "rule" ? "rule" : "skill";
  const id = slugify(body.id || parsed.id || parsed.name || "untitled");
  const now = new Date().toISOString();
  const metadata = {
    id,
    type,
    name: body.name || parsed.name || id,
    description: body.description ?? parsed.description ?? "",
    tags: normalizeArray(body.tags ?? parsed.tags),
    targets: normalizeArray(body.targets ?? parsed.targets),
    scope: normalizeArray(body.scope ?? parsed.scope),
    enabled: body.enabled ?? parsed.enabled ?? true,
    version: body.version || parsed.version || "1.0.0",
    createdAt: parsed.createdAt || now,
    updatedAt: now
  };
  const content = body.content != null ? String(body.content) : parsed.content;
  const markdown = `---\n${stringifyYaml(metadata)}---\n\n${content.trim()}\n`;
  const dir = type === "rule" ? RULES_DIR : SKILLS_DIR;
  const file = path.join(dir, `${id}.md`);
  fs.writeFileSync(file, markdown, "utf8");
  if (body.file) {
    const oldFile = safeResolve(ROOT, body.file);
    if (oldFile !== file && oldFile.startsWith(LIBRARY_DIR + path.sep) && fs.existsSync(oldFile)) {
      fs.unlinkSync(oldFile);
    }
  }
  return { ok: true, entry: parseMarkdownEntry(markdown, file) };
}

async function getEntryByFile(filePath) {
  const file = safeResolve(ROOT, filePath || "");
  if (!file.startsWith(LIBRARY_DIR + path.sep)) throw new Error("Entry file must be inside library.");
  if (!fs.existsSync(file)) throw new Error("Entry file not found.");
  return parseMarkdownEntry(fs.readFileSync(file, "utf8"), file);
}

function parseMarkdownEntry(raw, file, fallbackType = "skill") {
  const { data, content } = parseFrontmatter(raw);
  const title = extractTitle(content);
  const basename = slugify(path.basename(String(file), ".md"));
  const type = data.type === "rule" || String(file).includes(`${path.sep}rules${path.sep}`) ? "rule" : fallbackType;
  return {
    id: slugify(data.id || title || basename),
    type,
    name: data.name || title || basename,
    description: data.description || "",
    tags: normalizeArray(data.tags),
    targets: normalizeArray(data.targets),
    scope: normalizeArray(data.scope),
    enabled: data.enabled !== false && data.enabled !== "false",
    version: data.version || "",
    createdAt: data.createdAt || "",
    updatedAt: data.updatedAt || "",
    content: content.trim(),
    raw,
    file: path.resolve(String(file))
  };
}

function parseFrontmatter(raw) {
  if (!raw.startsWith("---\n")) return { data: {}, content: raw };
  const end = raw.indexOf("\n---", 4);
  if (end === -1) return { data: {}, content: raw };
  const yaml = raw.slice(4, end);
  const content = raw.slice(end + 4).replace(/^\s*\n/, "");
  return { data: parseSimpleYaml(yaml), content };
}

function parseSimpleYaml(text) {
  const result = {};
  const lines = text.split(/\r?\n/);
  let currentKey = null;
  for (const line of lines) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const listMatch = line.match(/^\s*-\s+(.+)$/);
    if (listMatch && currentKey) {
      if (!Array.isArray(result[currentKey])) result[currentKey] = [];
      result[currentKey].push(parseScalar(listMatch[1]));
      continue;
    }
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (!match) continue;
    currentKey = match[1];
    const value = match[2];
    result[currentKey] = value === "" ? [] : parseScalar(value);
  }
  return result;
}

function stringifyYaml(data) {
  return Object.entries(data).map(([key, value]) => {
    if (Array.isArray(value)) {
      if (!value.length) return `${key}: []\n`;
      return `${key}:\n${value.map((item) => `  - ${yamlScalar(item)}`).join("\n")}\n`;
    }
    return `${key}: ${yamlScalar(value)}\n`;
  }).join("");
}

function parseScalar(value) {
  const trimmed = String(value).trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (trimmed === "[]") return [];
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map((item) => parseScalar(item)).filter(Boolean);
  }
  return trimmed.replace(/^["']|["']$/g, "");
}

function yamlScalar(value) {
  if (typeof value === "boolean") return value ? "true" : "false";
  const text = String(value ?? "");
  if (!text) return "\"\"";
  if (/[:#\[\]\n]/.test(text)) return JSON.stringify(text);
  return text;
}

function extractTitle(content) {
  const match = String(content).match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function normalizeArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  return String(value).split(",").map((item) => item.trim()).filter(Boolean);
}

async function detectTools(projectRoot) {
  const adapters = getAdapters(projectRoot);
  const statuses = [];
  for (const adapter of adapters) {
    const version = await commandVersion(adapter.command, adapter.versionArgs);
    const globalPaths = adapter.globalPaths.filter(Boolean);
    const projectPaths = adapter.projectPaths.filter(Boolean);
    statuses.push({
      id: adapter.id,
      name: adapter.name,
      command: adapter.command,
      installed: Boolean(version.ok || globalPaths.some(existsAny) || projectPaths.some(existsAny)),
      version: version.version,
      compatible: version.version ? adapter.compatible(version.version) : "unknown",
      globalPaths: globalPaths.map(pathStatus),
      projectPaths: projectPaths.map(pathStatus),
      warnings: version.error ? [version.error] : []
    });
  }
  return statuses;
}

async function scanExistingToolFiles(projectRoot) {
  const existingEntries = await scanEntries();
  const existingHashes = new Set(existingEntries.map((entry) => contentHash(entry.content)));
  const existingKeys = new Set(existingEntries.map((entry) => entryKey(entry)));
  const seenHashes = new Set();
  const seenKeys = new Set();
  const candidates = [];
  const skipped = [];

  for (const source of getScanSources(projectRoot)) {
    for (const file of listSourceMarkdown(source)) {
      if (file.startsWith(LIBRARY_DIR + path.sep)) continue;
      try {
        const raw = fs.readFileSync(file, "utf8");
        const entry = parseMarkdownEntry(raw, file, source.type);
        entry.type = normalizeTypeFromSource(entry, source);
        entry.targets = entry.targets.length ? entry.targets : [source.tool];
        entry.scope = entry.scope.length ? entry.scope : [source.scope];
        const hash = contentHash(entry.content);
        const key = entryKey(entry);
        const duplicate = existingHashes.has(hash) || existingKeys.has(key) || seenHashes.has(hash) || seenKeys.has(key);
        const candidate = {
          sourceTool: source.tool,
          sourceScope: source.scope,
          sourcePath: file,
          id: entry.id,
          type: entry.type,
          name: entry.name,
          hash,
          duplicate
        };
        if (duplicate) {
          skipped.push(candidate);
        } else {
          candidates.push(candidate);
          seenHashes.add(hash);
          seenKeys.add(key);
        }
      } catch (error) {
        skipped.push({ sourceTool: source.tool, sourceScope: source.scope, sourcePath: file, error: error.message, duplicate: false });
      }
    }
  }

  return { candidates, skipped, total: candidates.length + skipped.length };
}

async function importExistingToolFiles(projectRoot) {
  const scan = await scanExistingToolFiles(projectRoot);
  const imported = [];
  for (const candidate of scan.candidates) {
    const raw = fs.readFileSync(candidate.sourcePath, "utf8");
    const parsed = parseMarkdownEntry(raw, candidate.sourcePath, candidate.type);
    parsed.type = candidate.type;
    parsed.targets = parsed.targets.length ? parsed.targets : [candidate.sourceTool];
    parsed.scope = parsed.scope.length ? parsed.scope : [candidate.sourceScope];
    const id = uniqueLibraryId(parsed.id || candidate.id, parsed.type);
    const now = new Date().toISOString();
    const metadata = {
      id,
      type: parsed.type,
      name: parsed.name || candidate.name || id,
      description: parsed.description || "",
      tags: Array.from(new Set([...normalizeArray(parsed.tags), candidate.sourceTool])),
      targets: normalizeArray(parsed.targets),
      scope: normalizeArray(parsed.scope),
      enabled: parsed.enabled !== false,
      version: parsed.version || "1.0.0",
      sourcePath: candidate.sourcePath,
      importedAt: now,
      createdAt: parsed.createdAt || now,
      updatedAt: now
    };
    const markdown = `---\n${stringifyYaml(metadata)}---\n\n${parsed.content.trim()}\n`;
    const dir = parsed.type === "rule" ? RULES_DIR : SKILLS_DIR;
    const file = path.join(dir, `${id}.md`);
    fs.writeFileSync(file, markdown, "utf8");
    imported.push({ ...candidate, id, file });
  }
  return { imported, skipped: scan.skipped, total: scan.total };
}

function getScanSources(projectRoot) {
  const home = os.homedir();
  return [
    { tool: "codex", scope: "global", type: "skill", path: path.join(home, ".codex", "skills") },
    { tool: "codex", scope: "global", type: "rule", path: path.join(home, ".codex", "rules") },
    { tool: "codex", scope: "project", type: "skill", path: path.join(projectRoot, ".codex", "skills") },
    { tool: "codex", scope: "project", type: "rule", path: path.join(projectRoot, ".codex", "rules") },
    { tool: "claude", scope: "global", type: "skill", path: path.join(home, ".claude", "skills") },
    { tool: "claude", scope: "global", type: "rule", path: path.join(home, ".claude", "rules") },
    { tool: "claude", scope: "project", type: "skill", path: path.join(projectRoot, ".claude", "skills") },
    { tool: "claude", scope: "project", type: "rule", path: path.join(projectRoot, ".claude", "rules") },
    { tool: "cursor", scope: "global", type: "rule", path: path.join(home, ".cursor", "rules") },
    { tool: "cursor", scope: "global", type: "rule", path: path.join(home, "Library", "Application Support", "Cursor", "User", "rules") },
    { tool: "cursor", scope: "project", type: "rule", path: path.join(projectRoot, ".cursor", "rules") },
    { tool: "codebuddy", scope: "global", type: "skill", path: path.join(home, ".codebuddy", "skills") },
    { tool: "codebuddy", scope: "global", type: "rule", path: path.join(home, ".codebuddy", "rules") },
    { tool: "codebuddy", scope: "project", type: "skill", path: path.join(projectRoot, ".codebuddy", "skills") },
    { tool: "codebuddy", scope: "project", type: "rule", path: path.join(projectRoot, ".codebuddy", "rules") }
  ];
}

function listSourceMarkdown(source) {
  if (!fs.existsSync(source.path) || !fs.statSync(source.path).isDirectory()) return [];
  if (source.type === "rule") {
    return listMdRecursive(source.path, 3).filter((file) => !isIgnoredSupportFile(file));
  }

  const files = [];
  for (const name of fs.readdirSync(source.path)) {
    if (name === "references" || name === "templates" || name === "assets" || name === "scripts") continue;
    const item = path.join(source.path, name);
    const stat = fs.statSync(item);
    if (stat.isFile() && name.toLowerCase().endsWith(".md")) {
      files.push(item);
    } else if (stat.isDirectory()) {
      const skillFile = path.join(item, "SKILL.md");
      if (fs.existsSync(skillFile)) files.push(skillFile);
    }
  }
  return files.filter((file) => !isIgnoredSupportFile(file));
}

function isIgnoredSupportFile(file) {
  const parts = file.split(path.sep);
  return parts.includes("references") || parts.includes("templates") || parts.includes("assets") || parts.includes("scripts");
}

function normalizeTypeFromSource(entry, source) {
  if (entry.type === "rule" || entry.type === "skill") return entry.type;
  return source.type;
}

function contentHash(content) {
  const normalized = String(content || "")
    .replace(/\r\n/g, "\n")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function entryKey(entry) {
  return `${entry.type}:${slugify(entry.id || entry.name)}`;
}

function uniqueLibraryId(baseId, type) {
  const dir = type === "rule" ? RULES_DIR : SKILLS_DIR;
  const base = slugify(baseId || "imported");
  let id = base;
  let index = 2;
  while (fs.existsSync(path.join(dir, `${id}.md`))) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

function getAdapters(projectRoot) {
  const home = os.homedir();
  return [
    {
      id: "codex",
      name: "Codex",
      command: "codex",
      versionArgs: ["--version"],
      globalPaths: [path.join(home, ".codex", "skills"), path.join(home, ".codex", "rules")],
      projectPaths: [path.join(projectRoot, ".codex", "skills"), path.join(projectRoot, ".codex", "rules")],
      compatible: () => true
    },
    {
      id: "claude",
      name: "Claude",
      command: "claude",
      versionArgs: ["--version"],
      globalPaths: [path.join(home, ".claude", "skills"), path.join(home, ".claude", "rules"), path.join(home, ".claude", "CLAUDE.md")],
      projectPaths: [path.join(projectRoot, ".claude", "skills"), path.join(projectRoot, ".claude", "rules"), path.join(projectRoot, "CLAUDE.md")],
      compatible: () => true
    },
    {
      id: "cursor",
      name: "Cursor",
      command: "cursor",
      versionArgs: ["--version"],
      globalPaths: [
        path.join(home, ".cursor", "rules"),
        path.join(home, "Library", "Application Support", "Cursor", "User", "rules")
      ],
      projectPaths: [path.join(projectRoot, ".cursor", "rules")],
      compatible: () => true
    },
    {
      id: "codebuddy",
      name: "CodeBuddy",
      command: "codebuddy",
      versionArgs: ["--version"],
      globalPaths: [path.join(home, ".codebuddy", "skills"), path.join(home, ".codebuddy", "rules")],
      projectPaths: [path.join(projectRoot, ".codebuddy", "skills"), path.join(projectRoot, ".codebuddy", "rules")],
      compatible: () => true
    }
  ];
}

function renderForTools(entry, tools, scopes, projectRoot) {
  const selectedTools = normalizeArray(tools).length ? normalizeArray(tools) : ["codex", "claude", "cursor", "codebuddy"];
  const selectedScopes = normalizeArray(scopes).length ? normalizeArray(scopes) : ["project"];
  const adapters = Object.fromEntries(getAdapters(projectRoot).map((adapter) => [adapter.id, adapter]));
  const files = [];
  for (const toolId of selectedTools) {
    const adapter = adapters[toolId];
    if (!adapter) continue;
    for (const scope of selectedScopes) {
      const base = pickWriteBase(adapter, entry, scope);
      if (!base) continue;
      const targetPath = getTargetPath(adapter.id, entry, base);
      files.push({
        tool: toolId,
        scope,
        targetPath,
        content: renderEntry(entry, toolId)
      });
    }
  }
  return files;
}

function getTargetPath(toolId, entry, base) {
  if (entry.type === "skill") {
    if (toolId === "codex" || toolId === "codebuddy") {
      return path.join(base, entry.id, "SKILL.md");
    }
    return path.join(base, `${entry.id}.md`);
  }

  if (toolId === "cursor") {
    return path.join(base, `${entry.id}.mdc`);
  }

  return path.join(base, `${entry.id}.md`);
}

function pickWriteBase(adapter, entry, scope) {
  const paths = scope === "global" ? adapter.globalPaths : adapter.projectPaths;
  const candidates = paths.filter((item) => item && path.extname(item) !== ".md");
  if (adapter.id === "cursor") return candidates[0];
  if (entry.type === "rule") return candidates.find((item) => item.endsWith(`${path.sep}rules`)) || candidates[0];
  return candidates.find((item) => item.endsWith(`${path.sep}skills`)) || candidates[0];
}

function renderEntry(entry, toolId) {
  const body = /^#\s+.+$/m.test(entry.content) ? entry.content.trim() : `# ${entry.name}\n\n${entry.content.trim()}`;
  return `${GENERATED_MARKER}

---
id: ${entry.id}
type: ${entry.type}
name: ${entry.name}
source: UnifySkillManager
tool: ${toolId}
version: ${entry.version || "1.0.0"}
---

${entry.description ? `${entry.description}\n\n` : ""}${body}

`;
}

async function writeManagedFile(file) {
  const target = path.resolve(file.targetPath);
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  let backup = "";
  let conflict = false;
  if (fs.existsSync(target)) {
    const existing = fs.readFileSync(target, "utf8");
    conflict = !existing.includes(GENERATED_MARKER);
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    backup = path.join(BACKUPS_DIR, `${stamp}-${crypto.createHash("sha1").update(target).digest("hex").slice(0, 8)}-${path.basename(target)}`);
    fs.copyFileSync(target, backup);
  }
  fs.writeFileSync(target, file.content, "utf8");
  const verification = verifyWrittenFile(target);
  return { ...file, ok: verification.exists && verification.hasMarker, backup, conflict, verification };
}

function verifyWrittenFile(target) {
  if (!fs.existsSync(target)) {
    return { exists: false, hasMarker: false, bytes: 0 };
  }
  const content = fs.readFileSync(target, "utf8");
  return {
    exists: true,
    hasMarker: content.includes(GENERATED_MARKER),
    bytes: Buffer.byteLength(content, "utf8"),
    modifiedAt: fs.statSync(target).mtime.toISOString()
  };
}

function commandVersion(command, args) {
  return new Promise((resolve) => {
    execFile(command, args, { timeout: 2500 }, (error, stdout, stderr) => {
      if (error) {
        resolve({ ok: false, version: "", error: `${command} not found or version unavailable` });
        return;
      }
      resolve({ ok: true, version: String(stdout || stderr).trim().split(/\r?\n/)[0] || "detected" });
    });
  });
}

function pathStatus(item) {
  return {
    path: item,
    exists: fs.existsSync(item),
    writable: isWritable(item),
    managedFiles: countManagedFiles(item)
  };
}

function countManagedFiles(item) {
  if (!fs.existsSync(item)) return 0;
  const stat = fs.statSync(item);
  const files = stat.isDirectory() ? listManagedCandidateFiles(item, 3) : [item];
  let count = 0;
  for (const file of files) {
    try {
      if (fs.readFileSync(file, "utf8").includes(GENERATED_MARKER)) count += 1;
    } catch {
      // Ignore unreadable files in tool-owned directories.
    }
  }
  return count;
}

function listManagedCandidateFiles(dir, depth = 3) {
  if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const results = [];
  walk(dir, depth);
  return results;

  function walk(current, remaining) {
    if (remaining < 0) return;
    for (const name of fs.readdirSync(current)) {
      const item = path.join(current, name);
      const stat = fs.statSync(item);
      if (stat.isDirectory()) {
        walk(item, remaining - 1);
      } else if (/\.(md|mdc)$/i.test(name)) {
        results.push(item);
      }
    }
  }
}

function existsAny(item) {
  return fs.existsSync(item);
}

function isWritable(item) {
  let target = fs.existsSync(item) ? item : path.dirname(item);
  while (!fs.existsSync(target) && target !== path.dirname(target)) {
    target = path.dirname(target);
  }
  try {
    fs.accessSync(target, fs.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "untitled";
}

function safeResolve(base, relativePath) {
  return path.resolve(base, relativePath);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        reject(new Error("Request body too large."));
        req.destroy();
      }
    });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
  });
}

function sendJson(res, status, data) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(data, null, 2));
}

function sendText(res, status, text) {
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(text);
}
