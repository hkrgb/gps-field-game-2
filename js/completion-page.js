/**
 * completion-page.js — v20260929e
 * Injects teacher「完成頁」settings + enhances student completion view.
 * Works even if index.html / teacher.p1 / student.p1a are not yet updated.
 */
(function () {
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&" + "amp;")
      .replace(/</g, "&" + "lt;")
      .replace(/>/g, "&" + "gt;")
      .replace(/"/g, "&" + "quot;");
  }

  function ensureCompletionSettingsUI() {
    if (document.getElementById("edCompletionTitle")) return;
    const host = document.getElementById("edSettings") || document.getElementById("teacherSettings");
    if (!host) return;
    const box = document.createElement("div");
    box.id = "edCompletionBox";
    box.className = "bg-white border rounded-xl p-3 space-y-2 mt-3";
    box.innerHTML =
      '<div class="text-sm font-bold text-slate-800"><i class="fa-solid fa-trophy text-amber-500 mr-1"></i>完成頁設定</div>' +
      '<label class="block text-xs text-slate-600">標題</label>' +
      '<input id="edCompletionTitle" class="w-full px-2 py-1.5 border rounded-lg text-sm" placeholder="恭喜完成！">' +
      '<label class="block text-xs text-slate-600">祝賀訊息（可用 {teamName}）</label>' +
      '<textarea id="edCompletionMessage" rows="2" class="w-full px-2 py-1.5 border rounded-lg text-sm" placeholder="「{teamName}」已完成所有考察問題，辛苦了！"></textarea>' +
      '<label class="block text-xs text-slate-600">完成圖片 URL（每行一個）</label>' +
      '<textarea id="edCompletionImages" rows="2" class="w-full px-2 py-1.5 border rounded-lg text-sm" placeholder="https://…"></textarea>' +
      '<label class="flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" id="edCompletionShowStats" checked> 顯示統計</label>';
    host.appendChild(box);
  }

  function fillCompletionSettings(project) {
    ensureCompletionSettingsUI();
    const p = project || {};
    const t = document.getElementById("edCompletionTitle");
    const m = document.getElementById("edCompletionMessage");
    const im = document.getElementById("edCompletionImages");
    const st = document.getElementById("edCompletionShowStats");
    if (t) t.value = p.completionTitle || "";
    if (m) m.value = p.completionMessage || "";
    if (im) im.value = (p.completionImages || []).join("\n");
    if (st) st.checked = p.completionShowStats !== false;
  }

  function readCompletionSettings() {
    ensureCompletionSettingsUI();
    const images = (document.getElementById("edCompletionImages")?.value || "")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    return {
      completionTitle: (document.getElementById("edCompletionTitle")?.value || "").trim(),
      completionMessage: (document.getElementById("edCompletionMessage")?.value || "").trim(),
      completionImages: images,
      completionShowStats: !!(document.getElementById("edCompletionShowStats")?.checked)
    };
  }

  function enhanceStudentCompletion() {
    if (!window.StudentUI || !StudentUI.showCompletion) return;
    const orig = StudentUI.showCompletion.bind(StudentUI);
    StudentUI.showCompletion = function () {
      orig();
      try {
        const st = StudentUI.getState && StudentUI.getState();
        const p = (st && st.project) || {};
        const name = (st && st.session && st.session.teamName) || "隊伍";
        const titleEl = document.getElementById("completionTitle");
        if (titleEl && p.completionTitle) titleEl.textContent = String(p.completionTitle).trim();
        const congrats = document.getElementById("completionCongrats");
        if (congrats) {
          const raw =
            (p.completionMessage && String(p.completionMessage).trim()) ||
            congrats.textContent ||
            "「{teamName}」已完成所有考察問題，辛苦了！";
          congrats.textContent = raw.split("{teamName}").join(name);
        }
      } catch (e) {}
    };
  }

  window.CompletionPage = {
    ensureCompletionSettingsUI,
    fillCompletionSettings,
    readCompletionSettings,
    enhanceStudentCompletion
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceStudentCompletion);
  } else {
    enhanceStudentCompletion();
  }
})();
