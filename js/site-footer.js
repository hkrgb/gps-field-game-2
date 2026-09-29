/**
 * site-footer.js — v20260929d
 * Injects site footer (school link + disclaimer) + teacher「頁尾／免責」settings.
 */
(function () {
  var DEFAULTS = {
    footerSchoolName: "明愛陳震夏郊野學園",
    footerSchoolUrl: "https://www.caritasfsc.edu.hk/",
    footerDisclaimerLabel: "免責條款",
    footerDisclaimerText:
      "本活動透過裝置收集的位置（GPS）資料，僅用於實地考察活動與教學用途（例如解鎖題目、監察進度與行跡）。資料不會出售予第三者，亦不會用於與本活動無關的商業推廣。如有疑問，請向負責老師查詢。"
  };
  var current = Object.assign({}, DEFAULTS);
  var lastSlugTried = "";
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function normalize(p) {
    p = p || {};
    var name = (p.footerSchoolName && String(p.footerSchoolName).trim()) || DEFAULTS.footerSchoolName;
    var url = (p.footerSchoolUrl && String(p.footerSchoolUrl).trim()) || DEFAULTS.footerSchoolUrl;
    var label = (p.footerDisclaimerLabel && String(p.footerDisclaimerLabel).trim()) || DEFAULTS.footerDisclaimerLabel;
    var text = (p.footerDisclaimerText && String(p.footerDisclaimerText).trim()) || DEFAULTS.footerDisclaimerText;
    return { footerSchoolName: name, footerSchoolUrl: url, footerDisclaimerLabel: label, footerDisclaimerText: text };
  }
  function bindFooterEvents() {
    var btn = document.getElementById("siteFooterDisclaimerBtn");
    if (btn && !btn.__bound) { btn.addEventListener("click", openDisclaimer); btn.__bound = true; }
    ["disclaimerModalClose", "disclaimerModalOk"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el && !el.__bound) { el.addEventListener("click", closeDisclaimer); el.__bound = true; }
    });
    var modalEl = document.getElementById("disclaimerModal");
    if (modalEl && !modalEl.__bound) {
      modalEl.addEventListener("click", function (e) { if (e.target === modalEl) closeDisclaimer(); });
      modalEl.__bound = true;
    }
  }
  function ensureFooterDom() {
    if (!document.getElementById("siteFooter")) {
      var footer = document.createElement("footer");
      footer.id = "siteFooter";
      footer.className = "site-footer";
      footer.innerHTML =
        '<div class="site-footer-inner">' +
        '<a id="siteFooterSchoolLink" class="site-footer-school" href="' + esc(DEFAULTS.footerSchoolUrl) +
        '" target="_blank" rel="noopener noreferrer">' + esc(DEFAULTS.footerSchoolName) + "</a>" +
        '<span class="site-footer-sep" aria-hidden="true">·</span>' +
        '<button type="button" id="siteFooterDisclaimerBtn" class="site-footer-disclaimer">' +
        esc(DEFAULTS.footerDisclaimerLabel) + "</button></div>";
      document.body.appendChild(footer);
    }
    if (!document.getElementById("disclaimerModal")) {
      var modal = document.createElement("div");
      modal.id = "disclaimerModal";
      modal.className = "hidden fixed inset-0 bg-slate-900/50 z-[70] flex items-center justify-center p-4";
      modal.setAttribute("role", "dialog");
      modal.setAttribute("aria-modal", "true");
      modal.setAttribute("aria-labelledby", "disclaimerModalTitle");
      modal.innerHTML =
        '<div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-5 space-y-3">' +
        '<div class="flex items-start justify-between gap-3">' +
        '<h3 id="disclaimerModalTitle" class="font-bold text-slate-800 text-base">免責條款</h3>' +
        '<button type="button" id="disclaimerModalClose" class="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center" aria-label="關閉">' +
        '<i class="fa-solid fa-xmark"></i></button></div>' +
        '<p id="disclaimerModalBody" class="text-xs text-slate-600 leading-relaxed whitespace-pre-line"></p>' +
        '<button type="button" id="disclaimerModalOk" class="w-full py-2.5 bg-emerald-600 text-white font-semibold rounded-xl text-sm">知道了</button></div>';
      document.body.appendChild(modal);
    }
    bindFooterEvents();
  }
  function ensureSettingsDom() {
    var panel = document.getElementById("edPanel_settings");
    if (!panel || document.getElementById("edFooterSchoolName")) return;
    var saveBtn = document.getElementById("btnSaveSettings");
    var box = document.createElement("div");
    box.className = "border-t border-slate-100 pt-3 space-y-2";
    box.innerHTML =
      '<h3 class="font-bold text-slate-800 text-sm flex items-center gap-1.5"><i class="fa-solid fa-shoe-prints text-slate-500"></i> 頁尾／免責</h3>' +
      '<p class="text-[10px] text-slate-500">顯示於各頁底部的學校名稱連結與免責條款（細字）。留空則使用預設。</p>' +
      '<div><label class="font-semibold text-slate-700">學校名稱</label>' +
      '<input id="edFooterSchoolName" class="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="' + esc(DEFAULTS.footerSchoolName) + '"></div>' +
      '<div><label class="font-semibold text-slate-700">學校網址</label>' +
      '<input id="edFooterSchoolUrl" class="w-full mt-1 px-3 py-2 border rounded-lg font-mono text-[11px]" placeholder="' + esc(DEFAULTS.footerSchoolUrl) + '"></div>' +
      '<div><label class="font-semibold text-slate-700">免責連結文字</label>' +
      '<input id="edFooterDisclaimerLabel" class="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="' + esc(DEFAULTS.footerDisclaimerLabel) + '"></div>' +
      '<div><label class="font-semibold text-slate-700">免責條款內容</label>' +
      '<textarea id="edFooterDisclaimerText" rows="4" class="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="免責說明…"></textarea></div>';
    if (saveBtn && saveBtn.parentNode === panel) panel.insertBefore(box, saveBtn);
    else panel.appendChild(box);
  }
  function fillFooterFields(p) {
    p = normalize(p);
    var edN = document.getElementById("edFooterSchoolName");
    var edU = document.getElementById("edFooterSchoolUrl");
    var edL = document.getElementById("edFooterDisclaimerLabel");
    var edT = document.getElementById("edFooterDisclaimerText");
    if (edN) edN.value = p.footerSchoolName || "";
    if (edU) edU.value = p.footerSchoolUrl || "";
    if (edL) edL.value = p.footerDisclaimerLabel || "";
    if (edT) edT.value = p.footerDisclaimerText || "";
  }
  function readFooterPatch() {
    var edN = document.getElementById("edFooterSchoolName");
    var edU = document.getElementById("edFooterSchoolUrl");
    var edL = document.getElementById("edFooterDisclaimerLabel");
    var edT = document.getElementById("edFooterDisclaimerText");
    return {
      footerSchoolName: edN ? edN.value.trim() : "",
      footerSchoolUrl: edU ? edU.value.trim() : "",
      footerDisclaimerLabel: edL ? edL.value.trim() : "",
      footerDisclaimerText: edT ? edT.value.trim() : ""
    };
  }
  function applyFooter(cfg) {
    current = normalize(cfg);
    ensureFooterDom();
    var link = document.getElementById("siteFooterSchoolLink");
    var btn = document.getElementById("siteFooterDisclaimerBtn");
    var title = document.getElementById("disclaimerModalTitle");
    var body = document.getElementById("disclaimerModalBody");
    if (link) { link.textContent = current.footerSchoolName; link.href = current.footerSchoolUrl || DEFAULTS.footerSchoolUrl; }
    if (btn) btn.textContent = current.footerDisclaimerLabel;
    if (title) title.textContent = current.footerDisclaimerLabel;
    if (body) body.textContent = current.footerDisclaimerText;
  }
  function openDisclaimer() {
    ensureFooterDom();
    var modal = document.getElementById("disclaimerModal");
    var title = document.getElementById("disclaimerModalTitle");
    var body = document.getElementById("disclaimerModalBody");
    if (title) title.textContent = current.footerDisclaimerLabel;
    if (body) body.textContent = current.footerDisclaimerText;
    if (modal) modal.classList.remove("hidden");
  }
  function closeDisclaimer() {
    var modal = document.getElementById("disclaimerModal");
    if (modal) modal.classList.add("hidden");
  }
  function refresh(project) { applyFooter(project || {}); }
  function refreshFromStudentState() {
    try {
      if (window.StudentUI && StudentUI.getState) {
        var st = StudentUI.getState();
        if (st && st.project) { applyFooter(st.project); return true; }
      }
    } catch (e) {}
    return false;
  }
  function tryLoadLandingProject() {
    try {
      var params = new URLSearchParams(window.location.search);
      var slug = (params.get("p") || "").trim().toLowerCase();
      if (!slug || slug === lastSlugTried) return;
      if (!window.DataStore || !DataStore.getProjectBySlug) return;
      lastSlugTried = slug;
      DataStore.getProjectBySlug(slug).then(function (p) { if (p) applyFooter(p); }).catch(function () {});
    } catch (e) {}
  }
  function patchTeacher() {
    if (!window.TeacherUI) return;
    ensureSettingsDom();
    if (!TeacherUI.__footerSavePatched && typeof TeacherUI.saveSettings === "function") {
      var origSave = TeacherUI.saveSettings;
      TeacherUI.saveSettings = async function () {
        ensureSettingsDom();
        var origUpdate = DataStore.updateProject;
        DataStore.updateProject = function (id, patch) {
          var extra = readFooterPatch();
          var merged = Object.assign({}, patch, extra);
          var result = origUpdate.call(DataStore, id, merged);
          Promise.resolve(result).then(function (proj) { applyFooter(proj || merged); }).catch(function () { applyFooter(merged); });
          return result;
        };
        try { return await origSave.apply(this, arguments); }
        finally { DataStore.updateProject = origUpdate; }
      };
      TeacherUI.__footerSavePatched = true;
    }
    if (!TeacherUI.__footerOpenPatched && typeof TeacherUI.openEditor === "function") {
      var origOpen = TeacherUI.openEditor;
      TeacherUI.openEditor = async function () {
        var result = await origOpen.apply(this, arguments);
        ensureSettingsDom();
        setTimeout(function () {
          ensureSettingsDom();
          var slugEl = document.getElementById("edSlug");
          if (!slugEl || !slugEl.value) return;
          DataStore.getProjectBySlug(slugEl.value.trim().toLowerCase()).then(function (p) {
            if (p) { fillFooterFields(p); applyFooter(p); }
          }).catch(function () {});
        }, 50);
        return result;
      };
      TeacherUI.__footerOpenPatched = true;
    }
  }
  function patchStudent() {
    if (!window.StudentUI) return;
    if (typeof StudentUI.start === "function" && !StudentUI.__footerStartPatched) {
      var origStart = StudentUI.start;
      StudentUI.start = async function (sess, proj) {
        var result = await origStart.apply(this, arguments);
        applyFooter(proj || {});
        return result;
      };
      StudentUI.__footerStartPatched = true;
    }
    if (typeof StudentUI.applyProjectTestMode === "function" && !StudentUI.__footerApplyPatched) {
      var origApply = StudentUI.applyProjectTestMode;
      StudentUI.applyProjectTestMode = function (proj) {
        var result = origApply.apply(this, arguments);
        if (proj) applyFooter(proj);
        return result;
      };
      StudentUI.__footerApplyPatched = true;
    }
    if (typeof StudentUI.showView === "function" && !StudentUI.__footerViewPatched) {
      var origView = StudentUI.showView;
      StudentUI.showView = function () {
        var result = origView.apply(this, arguments);
        refreshFromStudentState();
        return result;
      };
      StudentUI.__footerViewPatched = true;
    }
  }
  function boot() {
    ensureFooterDom();
    ensureSettingsDom();
    applyFooter(current);
    patchTeacher();
    patchStudent();
    if (!refreshFromStudentState()) tryLoadLandingProject();
  }
  window.SiteFooter = { refresh: refresh, openDisclaimer: openDisclaimer, closeDisclaimer: closeDisclaimer, defaults: DEFAULTS, normalize: normalize };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
  setTimeout(boot, 0);
  setTimeout(boot, 300);
  setTimeout(tryLoadLandingProject, 500);
  setTimeout(tryLoadLandingProject, 1500);
})();
