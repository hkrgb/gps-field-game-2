/**
 * completion-page.js — v20260929c
 * Injects teacher「完成頁」settings + enhances student completion view.
 * Works even if index.html / teacher.p1 / student.p1a are not yet updated.
 */
(function () {
  function ensureCompletionDom() {
    var section = document.getElementById("view-completion");
    if (!section) return;
    var card = section.querySelector(".bg-white") || section.firstElementChild;
    if (!card) return;
    if (!document.getElementById("completionImages")) {
      var wrap = document.createElement("div");
      wrap.id = "completionImages";
      wrap.className = "space-y-2 text-left";
      card.insertBefore(wrap, card.firstChild);
    }
    var h2 = card.querySelector("h2");
    if (h2 && !h2.id) h2.id = "completionTitle";
    var trophy = card.querySelector(".fa-trophy");
    if (trophy && trophy.parentElement && !document.getElementById("completionTrophy")) {
      trophy.parentElement.id = "completionTrophy";
    }
    var congrats = document.getElementById("completionCongrats");
    if (congrats) congrats.classList.add("whitespace-pre-line");
  }

  function ensureSettingsDom() {
    var panel = document.getElementById("edPanel_settings");
    if (!panel || document.getElementById("edCompletionTitle")) return;
    var saveBtn = document.getElementById("btnSaveSettings");
    var box = document.createElement("div");
    box.className = "border-t border-slate-100 pt-3 space-y-2";
    box.innerHTML =
      '<h3 class="font-bold text-slate-800 text-sm flex items-center gap-1.5"><i class="fa-solid fa-trophy text-amber-500"></i> 完成頁</h3>' +
      '<p class="text-[10px] text-slate-500">學生完成所有問題後顯示的標題、文字與圖片。訊息可用 <code class="bg-slate-100 px-1 rounded">{teamName}</code> 代入隊伍名稱。</p>' +
      '<div><label class="font-semibold text-slate-700">標題</label>' +
      '<input id="edCompletionTitle" class="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="恭喜完成！"></div>' +
      '<div><label class="font-semibold text-slate-700">訊息（可多行）</label>' +
      '<textarea id="edCompletionMessage" rows="3" class="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="「{teamName}」已完成所有考察問題，辛苦了！"></textarea></div>' +
      '<div><label class="font-semibold text-slate-700">圖片 URL（每行一個）</label>' +
      '<textarea id="edCompletionImages" rows="2" class="w-full mt-1 px-3 py-2 border rounded-lg" placeholder="https://…"></textarea></div>' +
      '<label class="flex items-center justify-between py-1 gap-3">' +
      '<span class="font-semibold text-slate-700">顯示完成統計<span class="block font-normal text-[10px] text-slate-500 mt-0.5">地區／題數摘要（預設顯示）</span></span>' +
      '<input id="edCompletionShowStats" type="checkbox" class="w-4 h-4 accent-emerald-600 shrink-0" checked></label>';
    if (saveBtn && saveBtn.parentNode === panel) {
      panel.insertBefore(box, saveBtn);
    } else {
      panel.appendChild(box);
    }
  }

  function fillCompletionFields(p) {
    p = p || {};
    var edCT = document.getElementById("edCompletionTitle");
    var edCM = document.getElementById("edCompletionMessage");
    var edCI = document.getElementById("edCompletionImages");
    var edCS = document.getElementById("edCompletionShowStats");
    if (edCT) edCT.value = p.completionTitle || "";
    if (edCM) edCM.value = p.completionMessage || "";
    if (edCI) edCI.value = (p.completionImages || []).join("\n");
    if (edCS) edCS.checked = p.completionShowStats !== false;
  }

  function readCompletionPatch() {
    var edCI = document.getElementById("edCompletionImages");
    var edCT = document.getElementById("edCompletionTitle");
    var edCM = document.getElementById("edCompletionMessage");
    var edCS = document.getElementById("edCompletionShowStats");
    var completionImages = (edCI ? edCI.value : "")
      .split("\n")
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
    return {
      completionTitle: edCT ? edCT.value.trim() : "",
      completionMessage: edCM ? edCM.value.trim() : "",
      completionImages: completionImages,
      completionShowStats: edCS ? edCS.checked : true
    };
  }

  function enhanceShowCompletion(orig) {
    return function () {
      ensureCompletionDom();
      var st = (window.StudentUI && StudentUI.getState) ? StudentUI.getState() : {};
      var project = st.project || {};
      var session = st.session || {};
      var name = (session && session.teamName) || "隊伍";
      var images = (project.completionImages || []).filter(Boolean);
      var imgWrap = document.getElementById("completionImages");
      var trophy = document.getElementById("completionTrophy");
      if (imgWrap) {
        imgWrap.innerHTML = "";
        images.forEach(function (url) {
          var img = document.createElement("img");
          img.src = url;
          img.alt = project.completionTitle || "完成圖片";
          img.className =
            "rounded-xl w-full object-cover max-h-56 border border-slate-200 img-zoomable";
          img.loading = "lazy";
          img.onclick = function () {
            if (StudentUI.openLightbox) StudentUI.openLightbox(url, project.completionTitle || "完成圖片");
          };
          imgWrap.appendChild(img);
        });
      }
      if (trophy) trophy.classList.toggle("hidden", images.length > 0);
      var titleEl = document.getElementById("completionTitle");
      if (titleEl) {
        titleEl.textContent =
          (project.completionTitle && String(project.completionTitle).trim()) || "恭喜完成！";
      }
      var congrats = document.getElementById("completionCongrats");
      if (congrats) {
        var rawMsg =
          (project.completionMessage && String(project.completionMessage).trim()) ||
          "「{teamName}」已完成所有考察問題，辛苦了！";
        congrats.textContent = rawMsg.split("{teamName}").join(name);
      }
      var summary = document.getElementById("completionSummary");
      var showStats = project.completionShowStats !== false;
      if (summary && !showStats) {
        summary.classList.add("hidden");
        summary.innerHTML = "";
      } else if (summary) {
        summary.classList.remove("hidden");
      }
      if (typeof orig === "function") orig.apply(this, arguments);
      // Re-apply custom title/message after orig (orig may overwrite congrats)
      if (titleEl) {
        titleEl.textContent =
          (project.completionTitle && String(project.completionTitle).trim()) || "恭喜完成！";
      }
      if (congrats) {
        var raw2 =
          (project.completionMessage && String(project.completionMessage).trim()) ||
          "「{teamName}」已完成所有考察問題，辛苦了！";
        congrats.textContent = raw2.split("{teamName}").join(name);
      }
      if (summary && !showStats) {
        summary.classList.add("hidden");
        summary.innerHTML = "";
      }
      if (imgWrap && images.length) {
        // keep images after orig
      }
    };
  }

  function patchTeacher() {
    if (!window.TeacherUI) return;
    ensureSettingsDom();
    var origSave = TeacherUI.saveSettings;
    var origOpen = TeacherUI.openEditor;
    if (typeof origSave === "function" && !TeacherUI.__completionPatched) {
      TeacherUI.saveSettings = async function () {
        ensureSettingsDom();
        // Call original first would miss new fields — wrap DataStore.updateProject instead
        var origUpdate = DataStore.updateProject;
        DataStore.updateProject = function (id, patch) {
          var extra = readCompletionPatch();
          return origUpdate.call(DataStore, id, Object.assign({}, patch, extra));
        };
        try {
          return await origSave.apply(this, arguments);
        } finally {
          DataStore.updateProject = origUpdate;
        }
      };
      TeacherUI.__completionPatched = true;
    }
    if (typeof origOpen === "function" && !TeacherUI.__completionOpenPatched) {
      TeacherUI.openEditor = async function () {
        var result = await origOpen.apply(this, arguments);
        ensureSettingsDom();
        // current project is internal; re-read via slug field / form after fill
        setTimeout(function () {
          ensureSettingsDom();
          // fill from form title isn't enough — pull from DataStore via slug
          var slugEl = document.getElementById("edSlug");
          if (!slugEl || !slugEl.value) return;
          DataStore.getProjectBySlug(slugEl.value.trim().toLowerCase()).then(function (p) {
            if (p) fillCompletionFields(p);
          }).catch(function () {});
        }, 50);
        return result;
      };
      TeacherUI.__completionOpenPatched = true;
    }
  }

  function patchStudent() {
    if (!window.StudentUI || !StudentUI.showCompletion) return;
    if (StudentUI.__completionPatched) return;
    StudentUI.showCompletion = enhanceShowCompletion(StudentUI.showCompletion);
    StudentUI.__completionPatched = true;
  }

  function boot() {
    ensureCompletionDom();
    ensureSettingsDom();
    patchTeacher();
    patchStudent();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
  // Teacher/student scripts load sync before this file if included after them;
  // also retry shortly in case of order quirks.
  setTimeout(boot, 0);
  setTimeout(boot, 300);
})();
