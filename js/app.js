/**
 * 應用入口：Demo 偵測、路由、Landing
 */
(function () {
  function qs(name) {
    return new URLSearchParams(window.location.search).get(name);
  }

  function detectDemo() {
    if (qs("demo") === "1" || qs("demo") === "true") return true;
    if (!window.isFirebaseConfigured || !window.isFirebaseConfigured()) return true;
    return false;
  }

  async function boot() {
    const demo = detectDemo();
    DataStore.init({ demo });

    const demoBadge = document.getElementById("demoBadge");
    if (demoBadge) {
      demoBadge.classList.toggle("hidden", !DataStore.isDemo());
    }

    // Prefill slug from ?p=
    const slug = qs("p");
    if (slug) {
      const input = document.getElementById("teamSlug");
      if (input) input.value = slug;
    }

    bindLanding();
    bindGlobal();

    document.getElementById("bootLoading").classList.add("hidden");

    // Restore Firebase Auth before trusting a cached teacher session.
    // projects are publicly readable, so sessionStorage alone can show the
    // project list while teacher writes/submissions fail without request.auth.
    if (!DataStore.isDemo()) {
      await Auth.waitForFirebaseAuth();
    }

    let session = Auth.getSession();
    if (session && session.role === "team") {
      const project = await DataStore.getProject(session.projectId);
      if (project) {
        await StudentUI.start(session, project);
        routeFromHash();
        return;
      }
      Auth.clearSession();
    }
    if (session && session.role === "teacher") {
      session = await Auth.ensureTeacherAuth();
      if (!session) {
        alert("登入狀態已過期，請重新以 Google 登入老師後台。");
        showLanding();
        return;
      }
      await TeacherUI.start(session);
      routeFromHash();
      return;
    }

    showLanding();
  }

  function showLanding() {
    StudentUI.showView("view-landing");
    document.getElementById("appHeader").classList.add("hidden");
    window.location.hash = "#/";
  }

  function bindLanding() {
    document.querySelectorAll("[data-login-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.getAttribute("data-login-tab");
        document.querySelectorAll("[data-login-tab]").forEach((b) => {
          const on = b.getAttribute("data-login-tab") === tab;
          b.className =
            "flex-1 py-2.5 text-sm font-semibold rounded-xl " +
            (on ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600");
        });
        document.getElementById("panelTeam").classList.toggle("hidden", tab !== "team");
        document.getElementById("panelAdmin").classList.toggle("hidden", tab !== "admin");
      });
    });

    document.getElementById("teamLoginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const slug = document.getElementById("teamSlug").value.trim();
      const name = document.getElementById("teamName").value.trim();
      const pw = document.getElementById("teamPassword").value;
      const errEl = document.getElementById("teamLoginError");
      errEl.classList.add("hidden");
      StudentUI.showLoading(true);
      try {
        const { session, project } = await Auth.loginTeam(slug, name, pw);
        await StudentUI.start(session, project);
      } catch (err) {
        errEl.textContent = err.message || "登入失敗";
        errEl.classList.remove("hidden");
      } finally {
        StudentUI.showLoading(false);
      }
    });

    document.getElementById("btnTeacherLogin").addEventListener("click", async () => {
      const errEl = document.getElementById("adminLoginError");
      errEl.classList.add("hidden");
      StudentUI.showLoading(true);
      try {
        const session = await Auth.loginTeacherGoogle();
        await TeacherUI.start(session);
      } catch (err) {
        errEl.textContent = err.message || "登入失敗";
        errEl.classList.remove("hidden");
      } finally {
        StudentUI.showLoading(false);
      }
    });

    const resetBtn = document.getElementById("btnResetDemo");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        if (!confirm("重設 Demo 資料？所有本地示範提交會清空。")) return;
        DataStore.resetDemo();
        alert("已重設。Demo 專案代碼：cheungchau-demo；隊伍：示範隊／密碼 demo");
      });
    }
  }

  function bindGlobal() {
    document.getElementById("btnHome").addEventListener("click", async () => {
      const session = Auth.getSession();
      if (session && session.role === "team") StudentUI.showHub();
      else if (session && session.role === "teacher") TeacherUI.backToProjects();
      else showLanding();
    });

    document.getElementById("btnLogout").addEventListener("click", async () => {
      if (!confirm("確定登出？")) return;
      await Auth.logout();
      showLanding();
    });

    document.getElementById("btnRefreshGps").addEventListener("click", () => {
      StudentUI.refreshGPS();
    });

    document.getElementById("testModeBtn").addEventListener("click", () => {
      StudentUI.toggleTestMode();
    });

    document.getElementById("btnBackHub").addEventListener("click", () => {
      StudentUI.showHub();
    });

    document.getElementById("btnSubmitLoc").addEventListener("click", () => {
      StudentUI.submitCurrentLocation();
    });

    // Teacher buttons
    document.getElementById("btnNewProject").addEventListener("click", () => {
      TeacherUI.createNewProject();
    });
    document.getElementById("btnSaveSettings").addEventListener("click", () => {
      TeacherUI.saveSettings();
    });
    document.getElementById("btnBackProjects").addEventListener("click", () => {
      TeacherUI.backToProjects();
    });
    document.getElementById("btnBackProjects2").addEventListener("click", () => {
      TeacherUI.backToProjects();
    });
    document.getElementById("edTab_settings").addEventListener("click", () => {
      TeacherUI.switchEditorTab("settings");
    });
    document.getElementById("edTab_locations").addEventListener("click", () => {
      TeacherUI.switchEditorTab("locations");
    });
    document.getElementById("edTab_teams").addEventListener("click", () => {
      TeacherUI.switchEditorTab("teams");
    });
    document.getElementById("btnAddLoc").addEventListener("click", () => {
      TeacherUI.openLocModal(null);
    });
    document.getElementById("btnAddTeam").addEventListener("click", () => {
      TeacherUI.addTeam();
    });
    document.getElementById("btnAddQuestion").addEventListener("click", () => {
      TeacherUI.addQuestionRow();
    });
    document.getElementById("btnCloseLocModal").addEventListener("click", () => {
      TeacherUI.closeLocModal();
    });
    document.getElementById("btnCancelLocModal").addEventListener("click", () => {
      TeacherUI.closeLocModal();
    });
    document.getElementById("btnSaveLocModal").addEventListener("click", () => {
      TeacherUI.saveLocModal();
    });
    document.getElementById("btnExportCsv").addEventListener("click", () => {
      TeacherUI.exportCSV();
    });
    const btnRefreshMon = document.getElementById("btnRefreshMonitor");
    if (btnRefreshMon) {
      btnRefreshMon.addEventListener("click", () => {
        TeacherUI.refreshMonitor();
      });
    }
    const btnClear = document.getElementById("btnClearProjectData");
    if (btnClear) {
      btnClear.addEventListener("click", () => {
        TeacherUI.clearProjectData();
      });
    }
    const btnClearEd = document.getElementById("btnClearProjectDataEditor");
    if (btnClearEd) {
      btnClearEd.addEventListener("click", () => {
        TeacherUI.clearProjectData();
      });
    }

    window.addEventListener("hashchange", routeFromHash);
  }

  function routeFromHash() {
    const session = Auth.getSession();
    if (!session) return;
    const hash = window.location.hash || "";
    if (session.role === "team") {
      const m = hash.match(/^#\/loc\/(.+)$/);
      if (m) StudentUI.openLocation(m[1]);
      else if (hash.indexOf("#/hub") === 0) StudentUI.showHub();
    }
  }

  document.addEventListener("DOMContentLoaded", boot);
})();
