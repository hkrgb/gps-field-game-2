/**
 * 老師後台：專案 CRUD、地區／問題／隊伍、監察、CSV
 */
window.TeacherUI = (function () {
  let session = null;
  let projects = [];
  let currentProject = null;
  let locations = [];
  let teams = [];
  let editingLocId = null;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&" + "amp;")
      .replace(/</g, "&" + "lt;")
      .replace(/>/g, "&" + "gt;")
      .replace(/"/g, "&" + "quot;");
  }

  async function start(sess) {
    session = sess;
    StudentUI.showView("view-teacher");
    document.getElementById("headerUserName").textContent =
      sess.displayName || sess.email || "老師";
    document.getElementById("progressSquares").innerHTML = "";
    document.getElementById("testModeBtn").classList.add("hidden");
    const maxW = document.getElementById("mainContainer");
    if (maxW) maxW.classList.add("teacher-wide");
    showTeacherSection("projects");
    await refreshProjects();
    window.location.hash = "#/teacher";
  }

  function showTeacherSection(name) {
    const map = {
      projects: "teacherProjects",
      editor: "teacherEditor",
      monitor: "teacherMonitor"
    };
    Object.keys(map).forEach((k) => {
      const el = document.getElementById(map[k]);
      if (el) el.classList.toggle("hidden", k !== name);
    });
  }

  async function refreshProjects() {
    StudentUI.showLoading(true);
    try {
      projects = await DataStore.listProjectsByOwner(session.uid);
      const list = document.getElementById("projectList");
      list.innerHTML = "";
      if (!projects.length) {
        list.innerHTML =
          '<p class="text-sm text-slate-500 py-6 text-center">尚未有專案。按「新增專案」開始。</p>';
        return;
      }
      projects.forEach((p) => {
        const card = document.createElement("div");
        card.className =
          "bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3";
        const urlHint =
          "?p=" + encodeURIComponent(p.slug) + (DataStore.isDemo() ? "&demo=1" : "");
        card.innerHTML =
          '<div class="min-w-0">' +
          '<div class="font-bold text-slate-800">' +
          esc(p.title) +
          "</div>" +
          '<div class="text-xs text-slate-500 mt-0.5">代碼：<code class="bg-slate-100 px-1 rounded">' +
          esc(p.slug) +
          "</code> · GPS " +
          (p.gpsRadiusMeters || 50) +
          "m</div>" +
          '<div class="text-[11px] text-slate-400 mt-1 truncate">公開連結參數：' +
          esc(urlHint) +
          "</div></div>" +
          '<div class="flex flex-wrap gap-1.5 shrink-0">' +
          '<button data-act="edit" class="px-2.5 py-1.5 text-xs bg-emerald-600 text-white rounded-lg">編輯</button>' +
          '<button data-act="monitor" class="px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-lg">監察</button>' +
          '<button data-act="copy" class="px-2.5 py-1.5 text-xs bg-slate-100 rounded-lg">複製</button>' +
          '<button data-act="del" class="px-2.5 py-1.5 text-xs bg-rose-50 text-rose-600 rounded-lg">刪除</button>' +
          "</div>";
        card.querySelector('[data-act="edit"]').onclick = () => openEditor(p.id);
        card.querySelector('[data-act="monitor"]').onclick = () => openMonitor(p.id);
        card.querySelector('[data-act="copy"]').onclick = () => copyProj(p.id);
        card.querySelector('[data-act="del"]').onclick = () => deleteProj(p.id);
        list.appendChild(card);
      });
    } finally {
      StudentUI.showLoading(false);
    }
  }

  async function createNewProject() {
    const title = prompt("專案標題", "我的實地考察");
    if (!title) return;
    let slug = prompt(
      "公開代碼（英數、連字號）",
      title
        .toLowerCase()
        .replace(/[^a-z0-9\u4e00-\u9fff]+/gi, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || "project-" + Date.now().toString(36)
    );
    if (!slug) return;
    slug = slug.trim().toLowerCase().replace(/\s+/g, "-");
    const existing = await DataStore.getProjectBySlug(slug);
    if (existing) {
      alert("此代碼已被使用，請換一個。");
      return;
    }
    StudentUI.showLoading(true);
    try {
      const p = await DataStore.createProject(session.uid, {
        title,
        slug,
        subtitle: "",
        gpsRadiusMeters: 50,
        fontSize: "base",
        showTestMode: true,
        teacherEmail: session.email
      });
      // seed one location
      await DataStore.upsertLocation(p.id, null, {
        name: "示範地區",
        lat: 22.28,
        lng: 114.16,
        description: "請修改為實際地點與 GPS。",
        order: 1,
        images: [],
        questions: [
          {
            id: DataStore.uid(),
            type: "text",
            text: "請觀察此處並寫下一句所見。",
            order: 1
          }
        ]
      });
      await DataStore.upsertTeam(p.id, null, { name: "第1組", password: "1234" });
      await refreshProjects();
      await openEditor(p.id);
    } catch (e) {
      alert("建立失敗：" + e.message);
    } finally {
      StudentUI.showLoading(false);
    }
  }

  async function copyProj(id) {
    if (!confirm("複製此專案（含地區與隊伍）？")) return;
    StudentUI.showLoading(true);
    try {
      await DataStore.copyProject(id, session.uid);
      await refreshProjects();
      alert("已複製。");
    } catch (e) {
      alert(e.message);
    } finally {
      StudentUI.showLoading(false);
    }
  }

  async function deleteProj(id) {
    if (!confirm("確定刪除此專案及其所有資料？此操作無法復原。")) return;
    StudentUI.showLoading(true);
    try {
      await DataStore.deleteProject(id);
      await refreshProjects();
    } catch (e) {
      alert(e.message);
    } finally {
      StudentUI.showLoading(false);
    }
  }

  async function openEditor(projectId) {
    StudentUI.showLoading(true);
    try {
      currentProject = await DataStore.getProject(projectId);
      if (!currentProject) throw new Error("專案不存在");
      locations = await DataStore.listLocations(projectId);
      teams = await DataStore.listTeams(projectId);
      showTeacherSection("editor");
      fillSettingsForm();
      renderLocList();
      renderTeamList();
      switchEditorTab("settings");
      window.location.hash = "#/teacher/edit/" + projectId;
    } catch (e) {
      alert(e.message);
    } finally {
      StudentUI.showLoading(false);
    }
  }

  function fillSettingsForm() {
    const p = currentProject;
    document.getElementById("edTitle").value = p.title || "";
    document.getElementById("edSubtitle").value = p.subtitle || "";
    document.getElementById("edSlug").value = p.slug || "";
    document.getElementById("edRadius").value = p.gpsRadiusMeters ?? 50;
    document.getElementById("edFont").value = p.fontSize || "base";
    document.getElementById("edTestMode").checked = p.showTestMode !== false;
  }

  async function saveSettings() {
    const slug = document.getElementById("edSlug").value.trim().toLowerCase();
    if (!slug) {
      alert("請填寫公開代碼");
      return;
    }
    const other = await DataStore.getProjectBySlug(slug);
    if (other && other.id !== currentProject.id) {
      alert("此代碼已被其他專案使用");
      return;
    }
    StudentUI.showLoading(true);
    try {
      currentProject = await DataStore.updateProject(currentProject.id, {
        title: document.getElementById("edTitle").value.trim(),
        subtitle: document.getElementById("edSubtitle").value.trim(),
        slug,
        gpsRadiusMeters: parseInt(document.getElementById("edRadius").value, 10) || 50,
        fontSize: document.getElementById("edFont").value,
        showTestMode: document.getElementById("edTestMode").checked
      });
      alert("設定已儲存");
    } catch (e) {
      alert(e.message);
    } finally {
      StudentUI.showLoading(false);
    }
  }

  function switchEditorTab(tab) {
    ["settings", "locations", "teams"].forEach((t) => {
      const panel = document.getElementById("edPanel_" + t);
      const btn = document.getElementById("edTab_" + t);
      if (panel) panel.classList.toggle("hidden", t !== tab);
      if (btn) {
        btn.className =
          "flex-1 py-2 text-xs font-semibold rounded-lg " +
          (t === tab
            ? "bg-emerald-600 text-white"
            : "bg-slate-100 text-slate-700");
      }
    });
  }

  function renderLocList() {
    const list = document.getElementById("edLocList");
    list.innerHTML = "";
    locations
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach((loc) => {
        const div = document.createElement("div");
        div.className = "bg-white border border-slate-200 rounded-xl p-3";
        div.innerHTML =
          '<div class="flex justify-between items-start gap-2">' +
          "<div><div class=\"font-bold text-sm\">" +
          esc(loc.name) +
          '</div><div class="text-[11px] text-slate-500">' +
          (loc.questions || []).length +
          " 題 · " +
          loc.lat +
          ", " +
          loc.lng +
          "</div></div>" +
          '<div class="flex gap-1"><button class="text-xs bg-slate-100 px-2 py-1 rounded" data-e>編輯</button>' +
          '<button class="text-xs bg-rose-50 text-rose-600 px-2 py-1 rounded" data-d>刪除</button></div></div>';
        div.querySelector("[data-e]").onclick = () => openLocModal(loc.id);
        div.querySelector("[data-d]").onclick = () => removeLoc(loc.id);
        list.appendChild(div);
      });
  }

  function openLocModal(locId) {
    editingLocId = locId || null;
    const loc = locId ? locations.find((l) => l.id === locId) : null;
    document.getElementById("locModalTitle").textContent = loc
      ? "編輯地區"
      : "新增地區";
    document.getElementById("lmName").value = loc ? loc.name : "";
    document.getElementById("lmDesc").value = loc ? loc.description || "" : "";
    document.getElementById("lmLat").value = loc ? loc.lat : "";
    document.getElementById("lmLng").value = loc ? loc.lng : "";
    document.getElementById("lmOrder").value = loc ? loc.order : locations.length + 1;
    document.getElementById("lmImages").value = loc
      ? (loc.images || []).join("\n")
      : "";
    const qList = document.getElementById("lmQuestions");
    qList.innerHTML = "";
    (loc && loc.questions ? loc.questions : []).forEach((q) =>
      addQuestionRow(q)
    );
    if (!loc) addQuestionRow();
    document.getElementById("locModal").classList.remove("hidden");
  }

  function addQuestionRow(q) {
    q = q || { type: "text", text: "", options: [], imageUrl: "" };
    const list = document.getElementById("lmQuestions");
    const row = document.createElement("div");
    row.className = "border border-slate-200 rounded-lg p-2 space-y-1.5 bg-slate-50";
    const type = q.type === "mcq" || q.type === "mc" ? "mcq" : "text";
    row.innerHTML =
      '<input type="hidden" class="q-id" value="' +
      esc(q.id || "") +
      '">' +
      '<div class="flex gap-2 items-center">' +
      '<select class="q-type text-xs border rounded px-2 py-1">' +
      '<option value="text"' +
      (type === "text" ? " selected" : "") +
      ">短句子</option>" +
      '<option value="mcq"' +
      (type === "mcq" ? " selected" : "") +
      ">多項選擇</option>" +
      "</select>" +
      '<button type="button" class="text-rose-500 text-xs ml-auto q-del">刪除</button></div>' +
      '<textarea class="q-text w-full px-2 py-1.5 border rounded-lg text-xs" rows="2" placeholder="問題文字…">' +
      esc(q.text || "") +
      "</textarea>" +
      '<div class="q-options-wrap' +
      (type === "mcq" ? "" : " hidden") +
      '">' +
      '<label class="text-[10px] text-slate-500">選項（每行一個）</label>' +
      '<textarea class="q-options w-full px-2 py-1.5 border rounded-lg text-xs" rows="3" placeholder="A. …\nB. …">' +
      esc((q.options || []).join("\n")) +
      "</textarea></div>" +
      '<input class="q-img w-full px-2 py-1 border rounded text-xs" placeholder="問題圖片 URL（可選）" value="' +
      esc(q.imageUrl || "") +
      '">';
    list.appendChild(row);
    row.querySelector(".q-del").onclick = () => row.remove();
    row.querySelector(".q-type").onchange = function () {
      row
        .querySelector(".q-options-wrap")
        .classList.toggle("hidden", this.value !== "mcq");
    };
  }

  function closeLocModal() {
    document.getElementById("locModal").classList.add("hidden");
  }

  async function saveLocModal() {
    const name = document.getElementById("lmName").value.trim();
    if (!name) {
      alert("請填寫地區名稱");
      return;
    }
    const questions = [];
    document.querySelectorAll("#lmQuestions > div").forEach((row, i) => {
      const text = row.querySelector(".q-text").value.trim();
      if (!text) return;
      let id = row.querySelector(".q-id").value;
      if (!id) id = DataStore.uid();
      const type = row.querySelector(".q-type").value;
      const q = {
        id,
        type,
        text,
        order: i + 1,
        imageUrl: row.querySelector(".q-img").value.trim()
      };
      if (type === "mcq") {
        q.options = row
          .querySelector(".q-options")
          .value.split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      questions.push(q);
    });
    const images = document
      .getElementById("lmImages")
      .value.split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    StudentUI.showLoading(true);
    try {
      await DataStore.upsertLocation(currentProject.id, editingLocId, {
        name,
        description: document.getElementById("lmDesc").value.trim(),
        lat: parseFloat(document.getElementById("lmLat").value) || 0,
        lng: parseFloat(document.getElementById("lmLng").value) || 0,
        order: parseInt(document.getElementById("lmOrder").value, 10) || 1,
        images,
        questions
      });
      locations = await DataStore.listLocations(currentProject.id);
      closeLocModal();
      renderLocList();
    } catch (e) {
      alert(e.message);
    } finally {
      StudentUI.showLoading(false);
    }
  }

  async function removeLoc(id) {
    if (!confirm("刪除此地區？")) return;
    await DataStore.deleteLocation(currentProject.id, id);
    locations = await DataStore.listLocations(currentProject.id);
    renderLocList();
  }

  function renderTeamList() {
    const list = document.getElementById("edTeamList");
    list.innerHTML = "";
    teams.forEach((t) => {
      const div = document.createElement("div");
      div.className =
        "bg-white border rounded-xl p-3 flex justify-between items-center gap-2";
      div.innerHTML =
        "<div><div class=\"font-semibold text-sm\">" +
        esc(t.name) +
        '</div><div class="text-[11px] text-slate-500">密碼：' +
        esc(t.password) +
        "</div></div>" +
        '<button class="text-xs text-rose-600">刪除</button>';
      div.querySelector("button").onclick = async () => {
        if (!confirm("刪除隊伍 " + t.name + "？")) return;
        await DataStore.deleteTeam(currentProject.id, t.id);
        teams = await DataStore.listTeams(currentProject.id);
        renderTeamList();
      };
      list.appendChild(div);
    });
  }

  async function addTeam() {
    const name = prompt("隊伍名稱", "第" + (teams.length + 1) + "組");
    if (!name) return;
    const password = prompt("密碼", "1234");
    if (password == null) return;
    await DataStore.upsertTeam(currentProject.id, null, { name, password });
    teams = await DataStore.listTeams(currentProject.id);
    renderTeamList();
  }

  async function openMonitor(projectId) {
    StudentUI.showLoading(true);
    try {
      currentProject = await DataStore.getProject(projectId);
      locations = await DataStore.listLocations(projectId);
      teams = await DataStore.listTeams(projectId);
      const sessions = await DataStore.listTeamSessions(projectId);
      const submissions = await DataStore.listSubmissions(projectId);
      showTeacherSection("monitor");
      document.getElementById("monTitle").textContent =
        "監察：" + (currentProject.title || "");
      const sessBox = document.getElementById("monSessions");
      sessBox.innerHTML = "";
      if (!sessions.length && !teams.length) {
        sessBox.innerHTML =
          '<p class="text-sm text-slate-500">尚無隊伍登入紀錄。</p>';
      }
      const sessMap = {};
      sessions.forEach((s) => {
        sessMap[s.teamId] = s;
      });
      teams.forEach((t) => {
        const s = sessMap[t.id] || {};
        const done = (s.completedLocationIds || []).length;
        const div = document.createElement("div");
        div.className = "bg-white border rounded-xl p-3 text-sm";
        div.innerHTML =
          '<div class="font-bold">' +
          esc(t.name) +
          '</div><div class="text-xs text-slate-500 mt-1">上次登入：' +
          (s.lastLoginAt
            ? new Date(s.lastLoginAt).toLocaleString("zh-HK")
            : "尚未登入") +
          " · 完成地區 " +
          done +
          " / " +
          locations.length +
          "</div>";
        sessBox.appendChild(div);
      });
      // also show sessions for unknown team ids
      sessions.forEach((s) => {
        if (teams.some((t) => t.id === s.teamId)) return;
        const div = document.createElement("div");
        div.className = "bg-white border rounded-xl p-3 text-sm";
        div.innerHTML =
          '<div class="font-bold">' +
          esc(s.teamId) +
          '</div><div class="text-xs text-slate-500">上次登入：' +
          (s.lastLoginAt
            ? new Date(s.lastLoginAt).toLocaleString("zh-HK")
            : "—") +
          "</div>";
        sessBox.appendChild(div);
      });

      const subBox = document.getElementById("monSubmissions");
      subBox.innerHTML = "";
      if (!submissions.length) {
        subBox.innerHTML =
          '<p class="text-sm text-slate-500">尚無提交。</p>';
      }
      submissions.forEach((s) => {
        const loc = locations.find((l) => l.id === s.locationId);
        const ansKeys = Object.keys(s.answers || {}).filter(
          (k) => (s.answers[k] || "").toString().trim()
        );
        const div = document.createElement("div");
        div.className = "bg-white border rounded-xl p-3 text-xs space-y-1";
        let detail = "";
        ansKeys.forEach((k) => {
          detail +=
            "<div class=\"pl-2 border-l-2 border-emerald-200 my-0.5\">" +
            esc(k) +
            ": " +
            esc(s.answers[k]) +
            "</div>";
        });
        div.innerHTML =
          '<div class="font-semibold text-sm text-slate-800">' +
          esc(s.teamName) +
          " · " +
          esc(loc ? loc.name : s.locationId) +
          "</div>" +
          '<div class="text-slate-500">' +
          (s.submittedAt
            ? new Date(s.submittedAt).toLocaleString("zh-HK")
            : "") +
          (s.coords
            ? " · 位置 " +
              Number(s.coords.lat).toFixed(5) +
              ", " +
              Number(s.coords.lng).toFixed(5)
            : "") +
          "</div>" +
          detail;
        subBox.appendChild(div);
      });

      window._monExport = { project: currentProject, locations, submissions };
      window.location.hash = "#/teacher/monitor/" + projectId;
    } catch (e) {
      alert(e.message);
    } finally {
      StudentUI.showLoading(false);
    }
  }

  function exportCSV() {
    const data = window._monExport;
    if (!data || !data.submissions.length) {
      alert("沒有可匯出的資料");
      return;
    }
    const csv = DataStore.exportSubmissionsCSV(
      data.project,
      data.locations,
      data.submissions
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download =
      (data.project.slug || "export") +
      "_" +
      new Date().toISOString().slice(0, 10) +
      ".csv";
    a.click();
  }

  function backToProjects() {
    showTeacherSection("projects");
    refreshProjects();
    window.location.hash = "#/teacher";
  }

  return {
    start,
    createNewProject,
    openEditor,
    openMonitor,
    saveSettings,
    switchEditorTab,
    openLocModal,
    closeLocModal,
    saveLocModal,
    addQuestionRow,
    addTeam,
    exportCSV,
    backToProjects,
    refreshProjects
  };
})();
