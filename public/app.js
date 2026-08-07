const $ = (id) => document.getElementById(id);

const topicEl = $("topic");
const toneEl = $("tone");
const lengthEl = $("length");
const audienceEl = $("audience");
const generateBtn = $("generate");
const resultEl = $("result");
const previewEl = $("preview");
const sourceEl = $("source");
const copyBtn = $("copy");
const downloadBtn = $("download");
const modeBadge = $("mode-badge");
const modeNote = $("mode-note");
const counter = $("counter");

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inline(md) {
  return escapeHtml(md)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
}

function renderMarkdown(md) {
  const lines = md.split("\n");
  const html = [];
  let list = null;
  const closeList = () => { if (list) { html.push("</" + list + ">"); list = null; } };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (line.trim() === "") { closeList(); continue; }
    if (line.startsWith("### ")) { closeList(); html.push("<h3>" + inline(line.slice(4)) + "</h3>"); }
    else if (line.startsWith("## ")) { closeList(); html.push("<h2>" + inline(line.slice(3)) + "</h2>"); }
    else if (line.startsWith("# ")) { closeList(); html.push("<h1>" + inline(line.slice(2)) + "</h1>"); }
    else if (/^-\s+/.test(line) || /^\*\s+/.test(line)) { if (list !== "ul") { closeList(); html.push("<ul>"); list = "ul"; } html.push("<li>" + inline(line.replace(/^[-*]\s+/, "")) + "</li>"); }
    else if (/^\d+\.\s+/.test(line)) { if (list !== "ol") { closeList(); html.push("<ol>"); list = "ol"; } html.push("<li>" + inline(line.replace(/^\d+\.\s+/, "")) + "</li>"); }
    else if (/^>\s?/.test(line)) { closeList(); html.push("<blockquote>" + inline(line.replace(/^>\s?/, "")) + "</blockquote>"); }
    else { closeList(); html.push("<p>" + inline(line) + "</p>"); }
  }
  closeList();
  return html.join("");
}

let currentMode = "demo";

async function generate() {
  const topic = topicEl.value.trim();
  if (!topic) { topicEl.focus(); return; }
  generateBtn.disabled = true;
  generateBtn.textContent = "Writing…";
  resultEl.classList.add("hidden");
  try {
    const res = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: topic, tone: toneEl.value, toneLabel: toneEl.options[toneEl.selectedIndex].text, length: lengthEl.value, lengthLabel: lengthEl.options[lengthEl.selectedIndex].text, audience: audienceEl.value.trim(), audienceLabel: audienceEl.value.trim() || "a general audience" }) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Something went wrong");
    currentMode = data.mode || "demo";
    sourceEl.textContent = data.markdown;
    previewEl.innerHTML = renderMarkdown(data.markdown);
    modeBadge.textContent = currentMode === "openai" ? "● Live AI" : "● Demo mode";
    modeBadge.style.color = currentMode === "openai" ? "var(--green)" : "var(--muted)";
    modeBadge.style.borderColor = currentMode === "openai" ? "rgba(63,185,80,.4)" : "var(--border)";
    switchTab("preview");
    resultEl.classList.remove("hidden");
    resultEl.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) { alert(err.message || "Generation failed. Please try again."); }
  finally { generateBtn.disabled = false; generateBtn.textContent = "Generate article"; }
}

function switchTab(name) {
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
  previewEl.classList.toggle("hidden", name !== "preview");
  sourceEl.classList.toggle("hidden", name !== "source");
}

async function copy() {
  try { await navigator.clipboard.writeText(sourceEl.textContent); copyBtn.textContent = "Copied!"; setTimeout(() => (copyBtn.textContent = "Copy Markdown"), 1500); }
  catch { alert("Could not copy to clipboard."); }
}

function download() {
  const blob = new Blob([sourceEl.textContent], { type: "text/markdown" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "article.md";
  a.click();
  URL.revokeObjectURL(a.href);
}

(async () => {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    if (data.mode === "openai") { modeNote.textContent = "Live AI mode — connected to OpenAI."; }
    else { modeNote.textContent = "Demo mode active — add an OPENAI_API_KEY to generate real articles."; }
  } catch { }
})();

generateBtn.addEventListener("click", generate);
copyBtn.addEventListener("click", copy);
downloadBtn.addEventListener("click", download);
document.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));
topicEl.addEventListener("input", () => (counter.textContent = topicEl.value.length + " / 500"));
topicEl.addEventListener("keydown", (e) => { if ((e.metaKey || e.ctrlKey) && e.key === "Enter") generate(); });