/**
 * 學生／隊伍端：登入後 Hub、地區內容頁、GPS 解鎖、提交
 */
window.StudentUI = (function () {
  let project = null;
  let locations = [];
  let session = null;
  let teamSession = null;
  let currentCoords = null;
  let testMode = false;
  let currentLocId = null;
  let draftAnswers = {}; // locationId -> { qId: value }

  const DRAFT_PREFIX = "gpsgame2_draft_";

  function draftKey() {
    return DRAFT_PREFIX + (session ? session.projectId + "_" + session.teamId : "");
  }

  function loadDrafts() {
    try {
      draftAnswers = JSON.parse(localStorage.getItem(draftKey()) || "{}");
    } catch (e) {
      draftAnswers = {};
    }
  }

  function saveDrafts() {
    localStorage.setItem(draftKey(), JSON.stringify(draftAnswers));
  }

  function applyFontSize() {
    const size = (project && project.fontSize) || "base";
    document.documentElement.style.setProperty(
      "--app-font-scale",
      size === "lg" ? "1.125" : size === "sm" ? "0.9" : "1"
    );
    document.body.classList.toggle("text-lg-mode", size === "lg");
    document.body.classList.toggle("text-sm-mode", size === "sm");
  }

  function radius() {
    return (project && project.gpsRadiusMeters) || 50;
  }

  function completedSet() {
    return new Set((teamSession && teamSession.completedLocationIds) || []);
  }

  function isLocComplete(locId) {
    if (completedSet().has(locId)) return true;
    const loc = locations.find((l) => l.id === locId);
    if (!loc || !(loc.questions || []).length) return false;
    const answers = draftAnswers[locId] || {};
    return (loc.questions || []).every((q) => (answers[q.id] || "").toString().trim());
  }

  function renderProgressSquares() {
    const el = document.getElementById("progressSquares");
    if (!el) return;
    el.innerHTML = "";
    locations.forEach((loc, i) => {
      const done = isLocComplete(loc.id);
      const sq = document.createElement("div");
      sq.className =
        "progress-square " + (done ? "filled" : "empty");
      sq.title = loc.name + (done ? "（已完成）" : "（未完成）");
      sq.textContent = String(i + 1);
      el.appendChild(sq);
    });
  }

  function updateHeader() {
    const nameEl = document.getElementById("headerUserName");
    if (nameEl) nameEl.textContent = session ? session.teamName : "";
    renderProgressSquares();
    const testBtn = document.getElementById("testModeBtn");
    if (testBtn) {
      testBtn.classList.toggle("hidden", !(project && project.showTestMode));
    }
  }

  async function start(sess, proj) {
    session = sess;
    project = proj;
    locations = await DataStore.listLocations(project.id);
    teamSession = await DataStore.getTeamSession(project.id, session.teamId);
    loadDrafts();
    applyFontSize();
    updateHeader();
    showHub();
    refreshGPS();
  }

  function showView(id) {
    ["view-landing", "view-hub", "view-location", "view-teacher"].forEach((v) => {
      const el = document.getElementById(v);
      if (el) el.classList.toggle("hidden", v !== id);
    });
    const header = document.getElementById("appHeader");
    if (header) {
      header.classList.toggle("hidden", id === "view-landing");
    }
    const maxW = document.getElementById("mainContainer");
    if (maxW) {
      maxW.classList.toggle("teacher-wide", id === "view-teacher");
    }
    const headerInner = document.getElementById("headerInner");
    if (headerInner) {
      headerInner.classList.toggle("max-w-md", id !== "view-teacher");
      headerInner.classList.toggle("max-w-4xl", id === "view-teacher");
    }
  }

  function showHub() {
    currentLocId = null;
    showView("view-hub");
    document.getElementById("hubTitle").textContent = project.title || "考察任務";
    document.getElementById("hubSubtitle").textContent = project.subtitle || "";
    renderHubCards();
    updateHeader();
    window.location.hash = "#/hub";
  }

  function renderHubCards() {
    const container = document.getElementById("hubCards");
    container.innerHTML = "";
    const r = radius();
    locations.forEach((loc) => {
      let distance = null;
      let unlocked = testMode;
      if (currentCoords) {
        distance = GPS.calculateDistance(
          currentCoords.lat,
          currentCoords.lng,
          loc.lat,
          loc.lng
        );
        if (distance <= r) unlocked = true;
      }
      const done = isLocComplete(loc.id);
      const card = document.createElement("button");
      card.type = "button";
      card.className =
        "w-full text-left p-4 rounded-2xl border shadow-sm transition " +
        (done
          ? "bg-emerald-50 border-emerald-300"
          : unlocked
            ? "bg-white border-emerald-200 hover:border-emerald-400"
            : "bg-slate-50 border-slate-200");
      const distText =
        distance != null
          ? "距離約 " + Math.round(distance) + " 米"
          : "等待 GPS…";
      const statusBadge = done
        ? '<span class="badge-done">已完成</span>'
        : unlocked
          ? '<span class="badge-open">可進入</span>'
          : '<span class="badge-lock">未到達</span>';
      card.innerHTML =
        '<div class="flex justify-between items-start gap-2">' +
        '<div><h3 class="font-bold text-slate-800 text-base">' +
        escapeHtml(loc.name) +
        "</h3>" +
        '<p class="text-xs text-slate-500 mt-1 line-clamp-2">' +
        escapeHtml(loc.description || "") +
        "</p></div>" +
        statusBadge +
        "</div>" +
        '<div class="mt-3 flex justify-between items-center text-xs text-slate-500">' +
        "<span><i class=\"fa-solid fa-location-dot mr-1\"></i>" +
        distText +
        (unlocked && !done ? " · 範圍內" : "") +
        "</span>" +
        '<span class="font-medium text-emerald-700"><i class="fa-solid fa-arrow-right"></i> 進入</span>' +
        "</div>";
      card.onclick = () => openLocation(loc.id);
      container.appendChild(card);
    });
  }

  async function openLocation(locId) {
    const loc = locations.find((l) => l.id === locId);
    if (!loc) return;
    currentLocId = locId;
    showView("view-location");
    window.location.hash = "#/loc/" + locId;

    document.getElementById("locPageTitle").textContent = loc.name;
    document.getElementById("locPageDesc").textContent = loc.description || "";
    const imgWrap = document.getElementById("locPageImages");
    imgWrap.innerHTML = "";
    (loc.images || []).forEach((url) => {
      if (!url) return;
      const img = document.createElement("img");
      img.src = url;
      img.alt = loc.name;
      img.className = "rounded-xl w-full object-cover max-h-48 border border-slate-200";
      imgWrap.appendChild(img);
    });
    if (!(loc.images || []).length) {
      imgWrap.innerHTML =
        '<div class="bg-slate-100 rounded-xl p-6 text-center text-slate-500 text-sm">' +
        '<i class="fa-solid fa-map-location-dot text-2xl text-emerald-500 mb-2"></i>' +
        "<p>請前往此地區；到達 GPS 範圍後會顯示問題。</p></div>";
    }

    const r = radius();
    let unlocked = testMode;
    let distance = null;
    if (currentCoords) {
      distance = GPS.calculateDistance(
        currentCoords.lat,
        currentCoords.lng,
        loc.lat,
        loc.lng
      );
      if (distance <= r) unlocked = true;
    }

    const lockBanner = document.getElementById("locLockBanner");
    const qSection = document.getElementById("locQuestionsSection");
    if (unlocked) {
      lockBanner.classList.add("hidden");
      qSection.classList.remove("hidden");
      renderQuestions(loc);
    } else {
      lockBanner.classList.remove("hidden");
      qSection.classList.add("hidden");
      document.getElementById("locLockMsg").textContent =
        distance != null
          ? "尚未到達（約 " +
            Math.round(distance) +
            " 米，需在 " +
            r +
            " 米內）。請參考上方指引前往。"
          : "正在等待 GPS…到達 " + r + " 米範圍後才會顯示問題。";
    }
    updateHeader();
  }

  function renderQuestions(loc) {
    const container = document.getElementById("locQuestions");
    container.innerHTML = "";
    const answers = draftAnswers[loc.id] || {};
    (loc.questions || [])
      .slice()
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .forEach((q, idx) => {
        const box = document.createElement("div");
        box.className = "bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2";
        let html =
          '<label class="block text-sm font-semibold text-slate-800">' +
          (idx + 1) +
          ". " +
          escapeHtml(q.text) +
          "</label>";
        if (q.imageUrl) {
          html +=
            '<img src="' +
            escapeAttr(q.imageUrl) +
            '" class="rounded-lg max-h-40 w-full object-cover" alt="">';
        }
        const saved = answers[q.id] || "";
        if (q.type === "mcq" && q.options && q.options.length) {
          html += '<div class="space-y-1">';
          q.options.forEach((opt) => {
            const checked = saved === opt ? "checked" : "";
            html +=
              '<label class="flex items-start gap-2 py-1.5 px-2 rounded-lg hover:bg-white cursor-pointer text-sm">' +
              '<input type="radio" name="q_' +
              escapeAttr(q.id) +
              '" value="' +
              escapeAttr(opt) +
              '" class="mt-1" ' +
              checked +
              "> <span>" +
              escapeHtml(opt) +
              "</span></label>";
          });
          html += "</div>";
        } else {
          html +=
            '<textarea data-qid="' +
            escapeAttr(q.id) +
            '" rows="2" class="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="請輸入短句答案…">' +
            escapeHtml(saved) +
            "</textarea>";
        }
        box.innerHTML = html;
        container.appendChild(box);
        box.querySelectorAll('input[type="radio"]').forEach((radio) => {
          radio.onchange = () => {
            if (!draftAnswers[loc.id]) draftAnswers[loc.id] = {};
            draftAnswers[loc.id][q.id] = radio.value;
            saveDrafts();
            renderProgressSquares();
          };
        });
        const ta = box.querySelector("textarea");
        if (ta) {
          ta.oninput = () => {
            if (!draftAnswers[loc.id]) draftAnswers[loc.id] = {};
            draftAnswers[loc.id][q.id] = ta.value;
            saveDrafts();
            renderProgressSquares();
          };
        }
      });
  }

  function collectCurrentAnswers(loc) {
    const answers = Object.assign({}, draftAnswers[loc.id] || {});
    (loc.questions || []).forEach((q) => {
      if (q.type === "mcq") {
        const checked = document.querySelector(
          'input[name="q_' + q.id + '"]:checked'
        );
        if (checked) answers[q.id] = checked.value;
      } else {
        const ta = document.querySelector('textarea[data-qid="' + q.id + '"]');
        if (ta) answers[q.id] = ta.value;
      }
    });
    draftAnswers[loc.id] = answers;
    saveDrafts();
    return answers;
  }

  async function submitCurrentLocation() {
    const loc = locations.find((l) => l.id === currentLocId);
    if (!loc) return;
    const answers = collectCurrentAnswers(loc);
    const filled = (loc.questions || []).filter((q) =>
      (answers[q.id] || "").toString().trim()
    ).length;
    if (!filled) {
      alert("請至少回答一題再提交。");
      return;
    }
    if (
      !confirm(
        "確認提交「" + loc.name + "」的答案？（已填 " + filled + " / " + (loc.questions || []).length + " 題）"
      )
    ) {
      return;
    }
    showLoading(true);
    try {
      await DataStore.submitAnswers(project.id, {
        teamId: session.teamId,
        teamName: session.teamName,
        locationId: loc.id,
        answers,
        coords: currentCoords
      });
      teamSession = await DataStore.getTeamSession(project.id, session.teamId);
      alert("已提交！進度已更新。");
      showHub();
    } catch (err) {
      alert("提交失敗：" + (err.message || err));
    } finally {
      showLoading(false);
    }
  }

  async function refreshGPS() {
    const banner = document.getElementById("gpsBanner");
    const icon = document.getElementById("gpsIcon");
    const msg = document.getElementById("gpsMessage");
    if (!banner) return;
    msg.textContent = "正在擷取 GPS…";
    icon.className = "fa-solid fa-spinner fa-spin text-amber-600";
    try {
      currentCoords = await GPS.getCurrentPosition();
      msg.textContent =
        "GPS 已更新（精度約 " +
        Math.round(currentCoords.accuracy || 0) +
        " 米）";
      icon.className = "fa-solid fa-circle-check text-emerald-600";
    } catch (e) {
      msg.textContent = "無法取得 GPS（可開測試模式或檢查定位權限）";
      icon.className = "fa-solid fa-location-crosshairs text-rose-500";
    }
    if (currentLocId) openLocation(currentLocId);
    else renderHubCards();
  }

  function toggleTestMode() {
    if (!(project && project.showTestMode)) return;
    testMode = !testMode;
    const text = document.getElementById("testStatusText");
    const btn = document.getElementById("testModeBtn");
    if (text) text.textContent = testMode ? "測試: 開" : "測試: 關";
    if (btn) {
      btn.classList.toggle("bg-amber-600", testMode);
      btn.classList.toggle("bg-emerald-800", !testMode);
    }
    if (currentLocId) openLocation(currentLocId);
    else renderHubCards();
  }

  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&")
      .replace(/</g, "<")
      .replace(/>/g, ">")
      .replace(/"/g, """);
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, "&#39;");
  }

  function showLoading(on) {
    const el = document.getElementById("globalLoading");
    if (el) el.classList.toggle("hidden", !on);
  }

  function getState() {
    return { project, locations, session, currentCoords, testMode };
  }

  return {
    start,
    showHub,
    openLocation,
    submitCurrentLocation,
    refreshGPS,
    toggleTestMode,
    showView,
    updateHeader,
    getState,
    showLoading
  };
})();
