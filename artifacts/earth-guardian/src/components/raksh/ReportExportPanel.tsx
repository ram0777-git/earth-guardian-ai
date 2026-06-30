import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check, Download, Printer, FileText, X, FileBarChart, Shield } from "lucide-react";

function simpleMarkdownToHtml(md: string): string {
  let html = md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const lines = html.split("\n");
  const out: string[] = [];
  let inList = false;
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (line.match(/^\|(.+)\|$/)) {
      if (!inTable) { out.push("<table>"); inTable = true; }
      const cells = line.split("|").slice(1, -1).map(c => c.trim());
      const isHeader = lines[i + 1]?.match(/^\|[-| :]+\|$/);
      if (isHeader) {
        out.push("<tr>" + cells.map(c => `<th>${c}</th>`).join("") + "</tr>");
        i++;
      } else if (!lines[i - 1]?.match(/^\|[-| :]+\|$/) || i === 0) {
        out.push("<tr>" + cells.map(c => `<td>${c}</td>`).join("") + "</tr>");
      }
      continue;
    } else if (inTable) {
      out.push("</table>");
      inTable = false;
    }

    if (line.match(/^[-*] \[[ x]\]/)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      const checked = line.includes("[x]") || line.includes("[X]");
      const text = line.replace(/^[-*] \[[ xX]\] /, "").trim();
      out.push(`<li>${checked ? "&#9745;" : "&#9744;"} ${formatInline(text)}</li>`);
      continue;
    }

    if (line.match(/^[-*] /)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${formatInline(line.replace(/^[-*] /, "").trim())}</li>`);
      continue;
    }

    if (line.match(/^\d+\. /)) {
      if (!inList) { out.push("<ol>"); inList = true; }
      out.push(`<li>${formatInline(line.replace(/^\d+\. /, "").trim())}</li>`);
      continue;
    }

    if (inList) { out.push(inList ? "</ul>" : "</ol>"); inList = false; }

    if (line.match(/^---+$/)) { out.push("<hr>"); continue; }
    if (line.match(/^# /)) { out.push(`<h1>${formatInline(line.replace(/^# /, ""))}</h1>`); continue; }
    if (line.match(/^## /)) { out.push(`<h2>${formatInline(line.replace(/^## /, ""))}</h2>`); continue; }
    if (line.match(/^### /)) { out.push(`<h3>${formatInline(line.replace(/^### /, ""))}</h3>`); continue; }
    if (line.trim() === "") { out.push("<br>"); continue; }
    out.push(`<p>${formatInline(line)}</p>`);
  }

  if (inList) out.push("</ul>");
  if (inTable) out.push("</table>");
  return out.join("\n");
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

function buildPrintHtml(content: string, generatedAt: string): string {
  const dateStr = new Date(generatedAt).toLocaleString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", timeZoneName: "short",
  });
  const bodyHtml = simpleMarkdownToHtml(content);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Earth Guardian AI — Disaster Intelligence Report</title>
<style>
  @page { margin: 1.1in 0.9in; size: A4 portrait; }
  * { box-sizing: border-box; }
  body { font-family: "Times New Roman", Times, serif; font-size: 11pt; line-height: 1.7; color: #111; background: #fff; margin: 0; padding: 0; }
  .stamp {
    display: block; width: 100%; text-align: center;
    font-family: Arial, Helvetica, sans-serif; font-weight: 700;
    font-size: 8.5pt; letter-spacing: 3px; text-transform: uppercase;
    border: 2pt solid #333; padding: 5pt 0; margin-bottom: 18pt;
  }
  h1 { font-size: 15pt; border-bottom: 2pt solid #111; padding-bottom: 5pt; margin: 20pt 0 8pt; }
  h2 { font-size: 13pt; border-bottom: 1pt solid #999; padding-bottom: 3pt; margin: 18pt 0 6pt; }
  h3 { font-size: 11.5pt; font-weight: bold; margin: 14pt 0 4pt; }
  p { margin: 0 0 7pt; }
  ul, ol { margin: 6pt 0; padding-left: 18pt; }
  li { margin: 3pt 0; }
  table { width: 100%; border-collapse: collapse; margin: 10pt 0; font-size: 9.5pt; }
  th { background: #e5e5e5; border: 1pt solid #aaa; padding: 4pt 7pt; font-weight: bold; text-align: left; }
  td { border: 1pt solid #ccc; padding: 4pt 7pt; }
  hr { border: none; border-top: 1pt solid #bbb; margin: 14pt 0; }
  code { font-family: "Courier New", monospace; font-size: 9pt; background: #f0f0f0; padding: 1pt 3pt; border-radius: 2pt; }
  strong { font-weight: bold; }
  em { font-style: italic; }
  a { color: #1a4e8a; }
  .footer { margin-top: 24pt; border-top: 1pt solid #ccc; padding-top: 8pt; text-align: center; font-size: 8.5pt; color: #555; font-family: Arial, Helvetica, sans-serif; }
  @media print { .no-print { display: none !important; } }
</style>
</head>
<body>
<div class="stamp">UNCLASSIFIED &nbsp;// &nbsp;FOR EMERGENCY PLANNING USE ONLY &nbsp;//&nbsp; EARTH GUARDIAN AI</div>
${bodyHtml}
<div class="footer">
  Report Generated: ${dateStr}<br>
  Earth Guardian AI Platform &nbsp;&bull;&nbsp; Raksh Intelligence System &nbsp;&bull;&nbsp; Version 3.1<br>
  <em>Always verify with official government and emergency management sources before action.</em>
</div>
<script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>`;
}

interface Props {
  content: string;
  generatedAt: string;
  onClose: () => void;
}

export function ReportExportPanel({ content, generatedAt, onClose }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      console.error("Clipboard write failed");
    }
  };

  const handleDownloadMd = () => {
    const date = new Date(generatedAt).toISOString().split("T")[0];
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earth-guardian-report-${date}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = () => {
    const html = buildPrintHtml(content, generatedAt);
    const win = window.open("", "_blank", "width=900,height=720");
    if (!win) {
      alert("Allow pop-ups for this page to export as PDF.");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] as const }}
        className="relative flex w-full max-w-3xl max-h-[88vh] flex-col rounded-2xl border border-white/10 overflow-hidden"
        style={{ background: "rgba(6,18,32,0.98)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex flex-shrink-0 items-center justify-between gap-3 border-b border-white/8 px-5 py-3.5"
          style={{ background: "rgba(255,255,255,0.025)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg,#1a73e8,#00bcd4)" }}
            >
              <FileBarChart className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Disaster Intelligence Report</p>
              <p className="text-[10px] text-slate-500">
                Generated {new Date(generatedAt).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 rounded-full border px-2.5 py-0.5"
              style={{ borderColor: "rgba(251,191,36,0.35)", background: "rgba(251,191,36,0.08)" }}
            >
              <Shield className="h-3 w-3 text-amber-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">Unclassified</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/8 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Export action bar */}
        <div
          className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-white/6 px-5 py-2.5"
          style={{ background: "rgba(255,255,255,0.012)" }}
        >
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: "rgba(52,211,153,0.12)",
              border: "1px solid rgba(52,211,153,0.28)",
              color: "#34d399",
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied!" : "Copy Markdown"}
          </button>
          <button
            type="button"
            onClick={handleDownloadMd}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: "rgba(26,115,232,0.12)",
              border: "1px solid rgba(26,115,232,0.28)",
              color: "#60a5fa",
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            Download .md
          </button>
          <button
            type="button"
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            style={{
              background: "rgba(139,92,246,0.12)",
              border: "1px solid rgba(139,92,246,0.28)",
              color: "#a78bfa",
            }}
          >
            <Printer className="h-3.5 w-3.5" />
            Export PDF / Print
          </button>
          <div className="ml-auto text-[10px] text-slate-600">
            Government report format · A4
          </div>
        </div>

        {/* Report content preview */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <pre
            className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-slate-300"
            style={{ tabSize: 2 }}
          >
            {content}
          </pre>
        </div>
      </motion.div>
    </motion.div>
  );
}
