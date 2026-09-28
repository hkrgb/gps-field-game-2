/**
 * 資料層：Demo（localStorage）或 Firebase Firestore / Storage
 * 密碼於 MVP 以明文儲存；正式環境應改為雜湊（見 README）。
 */
window.DataStore = (function () {
  const DEMO_KEY = "gpsgame2_demo_v1";
  let demo = false;
  let db = null;
  let storage = null;

  function uid() {
    return "id_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  function nowIso() {
    return new Date().toISOString();
  }

  /* ---------- Demo seed ---------- */
  function defaultDemoDb() {
    const projectId = "proj_demo_cheungchau";
    const loc1 = "loc_temple";
    const loc2 = "loc_pier";
    const loc3 = "loc_hospital";
    return {
      teachers: {
        demo_teacher: {
          email: "demo@school.edu.hk",
          displayName: "示範老師",
          createdAt: nowIso()
        }
      },
      projects: {
        [projectId]: {
          ownerUid: "demo_teacher",
          slug: "cheungchau-demo",
          title: "長洲社區保育考察",
          subtitle: "從社區保育看可持續發展（Demo）",
          gpsRadiusMeters: 50,
          fontSize: "base",
          showTestMode: true,
          createdAt: nowIso(),
          updatedAt: nowIso()
        }
      },
      locations: {
        [projectId]: {
          [loc1]: {
            name: "長洲玉虛宮（北帝廟）",
            lat: 22.212002,
            lng: 114.027749,
            description: "歷史悠久的廟宇，是長洲太平清醮的中心。到達附近後即可作答。",
            order: 1,
            images: [],
            questions: [
              {
                id: "q1_1",
                type: "mcq",
                text: "玉虛宮主要供奉哪一位神明？",
                options: ["北帝（玄天上帝）", "天后娘娘", "關帝", "觀音"],
                order: 1
              },
              {
                id: "q1_2",
                type: "text",
                text: "廟內銅鐘上刻了哪一句祝福語？（短句）",
                order: 2
              }
            ]
          },
          [loc2]: {
            name: "長洲碼頭一帶",
            lat: 22.2089,
            lng: 114.0285,
            description: "長洲對外交通樞紐。請觀察碼頭設施與社區環境。",
            order: 2,
            images: [],
            questions: [
              {
                id: "q2_1",
                type: "mcq",
                text: "長洲主要對外交通工具是？",
                options: ["渡輪", "地鐵", "電車", "纜車"],
                order: 1
              },
              {
                id: "q2_2",
                type: "text",
                text: "你觀察到碼頭附近有哪些社區設施？（短句）",
                order: 2
              }
            ]
          },
          [loc3]: {
            name: "長洲醫院",
            lat: 22.2078,
            lng: 114.031481,
            description: "為長洲居民提供醫療服務的重要設施。",
            order: 3,
            images: [],
            questions: [
              {
                id: "q3_1",
                type: "text",
                text: "醫院外牆展示了哪些捐款人名字？",
                order: 1
              },
              {
                id: "q3_2",
                type: "mcq",
                text: "急症室入口大門大致是甚麼形狀？",
                options: ["拱形／圓弧", "三角形", "星形", "沒有大門"],
                order: 2
              }
            ]
          }
        }
      },
      teams: {
        [projectId]: {
          team_a: { name: "第1組", password: "1234" },
          team_b: { name: "第2組", password: "1234" },
          team_demo: { name: "示範隊", password: "demo" }
        }
      },
      submissions: {
        [projectId]: {}
      },
      teamSessions: {
        [projectId]: {}
      }
    };
  }

  function loadDemo() {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const seed = defaultDemoDb();
    saveDemo(seed);
    return seed;
  }

  function saveDemo(data) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(data));
  }

  function resetDemo() {
    localStorage.removeItem(DEMO_KEY);
    return loadDemo();
  }

  /* ---------- Init ---------- */
  function init(options) {
    demo = !!(options && options.demo);
    if (!demo && window.firebase && window.isFirebaseConfigured()) {
      try {
        if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
        db = firebase.firestore();
        if (firebase.storage) storage = firebase.storage();
      } catch (e) {
        console.warn("Firebase init failed, falling back to demo", e);
        demo = true;
      }
    } else {
      demo = true;
    }
    if (demo) loadDemo();
    return { demo };
  }

  function isDemo() {
    return demo;
  }

  /* ---------- Projects ---------- */
  async function getProjectBySlug(slug) {
    if (!slug) return null;
    if (demo) {
      const data = loadDemo();
      const entry = Object.entries(data.projects).find(([, p]) => p.slug === slug);
      if (!entry) return null;
      return { id: entry[0], ...entry[1] };
    }
    const snap = await db.collection("projects").where("slug", "==", slug).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return { id: doc.id, ...doc.data() };
  }

  async function getProject(projectId) {
    if (demo) {
      const data = loadDemo();
      const p = data.projects[projectId];
      return p ? { id: projectId, ...p } : null;
    }
    const doc = await db.collection("projects").doc(projectId).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  }

  async function listProjectsByOwner(ownerUid) {
    if (demo) {
      const data = loadDemo();
      return Object.entries(data.projects)
        .filter(([, p]) => p.ownerUid === ownerUid)
        .map(([id, p]) => ({ id, ...p }))
        .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
    }
    const snap = await db
      .collection("projects")
      .where("ownerUid", "==", ownerUid)
      .get();
    return snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
  }

  async function createProject(ownerUid, payload) {
    const id = uid();
    const now = nowIso();
    const project = {
      ownerUid,
      slug: payload.slug,
      title: payload.title || "新專案",
      subtitle: payload.subtitle || "",
      gpsRadiusMeters: payload.gpsRadiusMeters ?? 50,
      fontSize: payload.fontSize || "base",
      showTestMode: payload.showTestMode !== false,
      createdAt: now,
      updatedAt: now
    };
    if (demo) {
      const data = loadDemo();
      data.projects[id] = project;
      data.locations[id] = {};
      data.teams[id] = {};
      data.submissions[id] = {};
      data.teamSessions[id] = {};
      saveDemo(data);
      return { id, ...project };
    }
    await db.collection("projects").doc(id).set(project);
    await db.collection("teachers").doc(ownerUid).set(
      { email: payload.teacherEmail || "", updatedAt: now },
      { merge: true }
    );
    return { id, ...project };
  }

  async function updateProject(projectId, patch) {
    patch = Object.assign({}, patch, { updatedAt: nowIso() });
    if (demo) {
      const data = loadDemo();
      if (!data.projects[projectId]) throw new Error("專案不存在");
      Object.assign(data.projects[projectId], patch);
      saveDemo(data);
      return { id: projectId, ...data.projects[projectId] };
    }
    await db.collection("projects").doc(projectId).update(patch);
    return getProject(projectId);
  }

  async function deleteProject(projectId) {
    if (demo) {
      const data = loadDemo();
      delete data.projects[projectId];
      delete data.locations[projectId];
      delete data.teams[projectId];
      delete data.submissions[projectId];
      delete data.teamSessions[projectId];
      saveDemo(data);
      return;
    }
    const locs = await db.collection("projects").doc(projectId).collection("locations").get();
    const batch = db.batch();
    locs.docs.forEach((d) => batch.delete(d.ref));
    const teams = await db.collection("projects").doc(projectId).collection("teams").get();
    teams.docs.forEach((d) => batch.delete(d.ref));
    batch.delete(db.collection("projects").doc(projectId));
    await batch.commit();
  }

  async function copyProject(projectId, ownerUid) {
    const src = await getProject(projectId);
    if (!src) throw new Error("專案不存在");
    const locations = await listLocations(projectId);
    const teams = await listTeams(projectId);
    const newSlug = src.slug + "-copy-" + Date.now().toString(36).slice(-4);
    const created = await createProject(ownerUid, {
      slug: newSlug,
      title: (src.title || "專案") + "（複製）",
      subtitle: src.subtitle,
      gpsRadiusMeters: src.gpsRadiusMeters,
      fontSize: src.fontSize,
      showTestMode: src.showTestMode
    });
    for (const loc of locations) {
      const { id, ...rest } = loc;
      await upsertLocation(created.id, null, rest);
    }
    for (const t of teams) {
      await upsertTeam(created.id, null, { name: t.name, password: t.password });
    }
    return created;
  }

  /* ---------- Locations ---------- */
  async function listLocations(projectId) {
    if (demo) {
      const data = loadDemo();
      const map = data.locations[projectId] || {};
      return Object.entries(map)
        .map(([id, l]) => ({ id, ...l }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    const snap = await db
      .collection("projects")
      .doc(projectId)
      .collection("locations")
      .orderBy("order")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function upsertLocation(projectId, locId, locData) {
    const id = locId || uid();
    const payload = {
      name: locData.name || "新地區",
      lat: Number(locData.lat) || 0,
      lng: Number(locData.lng) || 0,
      description: locData.description || "",
      order: locData.order ?? 1,
      images: locData.images || [],
      questions: (locData.questions || []).map((q, i) => ({
        id: q.id || uid(),
        type: q.type === "mcq" || q.type === "mc" ? "mcq" : "text",
        text: q.text || "",
        options: q.options || [],
        imageUrl: q.imageUrl || "",
        order: q.order ?? i + 1
      }))
    };
    if (demo) {
      const data = loadDemo();
      if (!data.locations[projectId]) data.locations[projectId] = {};
      data.locations[projectId][id] = payload;
      if (data.projects[projectId]) data.projects[projectId].updatedAt = nowIso();
      saveDemo(data);
      return { id, ...payload };
    }
    await db
      .collection("projects")
      .doc(projectId)
      .collection("locations")
      .doc(id)
      .set(payload, { merge: true });
    await db.collection("projects").doc(projectId).update({ updatedAt: nowIso() });
    return { id, ...payload };
  }

  async function deleteLocation(projectId, locId) {
    if (demo) {
      const data = loadDemo();
      if (data.locations[projectId]) delete data.locations[projectId][locId];
      saveDemo(data);
      return;
    }
    await db
      .collection("projects")
      .doc(projectId)
      .collection("locations")
      .doc(locId)
      .delete();
  }

  /* ---------- Teams ---------- */
  async function listTeams(projectId) {
    if (demo) {
      const data = loadDemo();
      const map = data.teams[projectId] || {};
      return Object.entries(map).map(([id, t]) => ({ id, ...t }));
    }
    const snap = await db
      .collection("projects")
      .doc(projectId)
      .collection("teams")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  async function findTeam(projectId, teamName, password) {
    const teams = await listTeams(projectId);
    const name = (teamName || "").trim();
    const pw = (password || "").trim();
    return teams.find((t) => t.name === name && String(t.password) === pw) || null;
  }

  async function upsertTeam(projectId, teamId, teamData) {
    const id = teamId || uid();
    const payload = {
      name: (teamData.name || "").trim(),
      password: String(teamData.password || "")
      // 生產環境應改為雜湊：passwordHash
    };
    if (demo) {
      const data = loadDemo();
      if (!data.teams[projectId]) data.teams[projectId] = {};
      data.teams[projectId][id] = payload;
      saveDemo(data);
      return { id, ...payload };
    }
    await db
      .collection("projects")
      .doc(projectId)
      .collection("teams")
      .doc(id)
      .set(payload, { merge: true });
    return { id, ...payload };
  }

  async function deleteTeam(projectId, teamId) {
    if (demo) {
      const data = loadDemo();
      if (data.teams[projectId]) delete data.teams[projectId][teamId];
      saveDemo(data);
      return;
    }
    await db
      .collection("projects")
      .doc(projectId)
      .collection("teams")
      .doc(teamId)
      .delete();
  }

  /* ---------- Sessions & submissions ---------- */
  async function recordTeamLogin(projectId, teamId) {
    const payload = { lastLoginAt: nowIso() };
    if (demo) {
      const data = loadDemo();
      if (!data.teamSessions[projectId]) data.teamSessions[projectId] = {};
      const prev = data.teamSessions[projectId][teamId] || { completedLocationIds: [] };
      data.teamSessions[projectId][teamId] = {
        lastLoginAt: payload.lastLoginAt,
        completedLocationIds: prev.completedLocationIds || []
      };
      saveDemo(data);
      return data.teamSessions[projectId][teamId];
    }
    const ref = db
      .collection("projects")
      .doc(projectId)
      .collection("teamSessions")
      .doc(teamId);
    const doc = await ref.get();
    if (doc.exists) {
      await ref.update({ lastLoginAt: payload.lastLoginAt });
      return { ...doc.data(), lastLoginAt: payload.lastLoginAt };
    }
    const full = { lastLoginAt: payload.lastLoginAt, completedLocationIds: [] };
    await ref.set(full);
    return full;
  }

  async function getTeamSession(projectId, teamId) {
    if (demo) {
      const data = loadDemo();
      return (
        (data.teamSessions[projectId] && data.teamSessions[projectId][teamId]) || {
          lastLoginAt: null,
          completedLocationIds: []
        }
      );
    }
    const doc = await db
      .collection("projects")
      .doc(projectId)
      .collection("teamSessions")
      .doc(teamId)
      .get();
    return doc.exists
      ? doc.data()
      : { lastLoginAt: null, completedLocationIds: [] };
  }

  async function listTeamSessions(projectId) {
    if (demo) {
      const data = loadDemo();
      const map = data.teamSessions[projectId] || {};
      return Object.entries(map).map(([teamId, s]) => ({ teamId, ...s }));
    }
    const snap = await db
      .collection("projects")
      .doc(projectId)
      .collection("teamSessions")
      .get();
    return snap.docs.map((d) => ({ teamId: d.id, ...d.data() }));
  }

  async function markLocationComplete(projectId, teamId, locationId) {
    if (demo) {
      const data = loadDemo();
      if (!data.teamSessions[projectId]) data.teamSessions[projectId] = {};
      const s = data.teamSessions[projectId][teamId] || {
        lastLoginAt: nowIso(),
        completedLocationIds: []
      };
      if (!s.completedLocationIds.includes(locationId)) {
        s.completedLocationIds.push(locationId);
      }
      data.teamSessions[projectId][teamId] = s;
      saveDemo(data);
      return s;
    }
    const ref = db
      .collection("projects")
      .doc(projectId)
      .collection("teamSessions")
      .doc(teamId);
    await ref.set(
      {
        completedLocationIds: firebase.firestore.FieldValue.arrayUnion(locationId),
        lastLoginAt: nowIso()
      },
      { merge: true }
    );
    return getTeamSession(projectId, teamId);
  }

  async function submitAnswers(projectId, submission) {
    const id = uid();
    const payload = {
      teamId: submission.teamId,
      teamName: submission.teamName,
      locationId: submission.locationId,
      answers: submission.answers || {},
      submittedAt: nowIso(),
      coords: submission.coords || null
    };
    if (demo) {
      const data = loadDemo();
      if (!data.submissions[projectId]) data.submissions[projectId] = {};
      data.submissions[projectId][id] = payload;
      saveDemo(data);
      await markLocationComplete(projectId, submission.teamId, submission.locationId);
      return { id, ...payload };
    }
    await db
      .collection("projects")
      .doc(projectId)
      .collection("submissions")
      .doc(id)
      .set(payload);
    await markLocationComplete(projectId, submission.teamId, submission.locationId);
    return { id, ...payload };
  }

  async function listSubmissions(projectId) {
    if (demo) {
      const data = loadDemo();
      const map = data.submissions[projectId] || {};
      return Object.entries(map)
        .map(([id, s]) => ({ id, ...s }))
        .sort((a, b) => (b.submittedAt || "").localeCompare(a.submittedAt || ""));
    }
    const snap = await db
      .collection("projects")
      .doc(projectId)
      .collection("submissions")
      .orderBy("submittedAt", "desc")
      .get();
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  /** 取得某隊某地點最新草稿／提交（demo 用 localStorage 草稿；Firebase 取最新 submission） */
  async function getLatestAnswersForLocation(projectId, teamId, locationId) {
    const all = await listSubmissions(projectId);
    const found = all.find(
      (s) => s.teamId === teamId && s.locationId === locationId
    );
    return found ? found.answers : {};
  }

  function exportSubmissionsCSV(project, locations, submissions) {
    const headers = ["提交時間", "隊伍", "地區", "緯度", "經度"];
    locations.forEach((l) => {
      (l.questions || []).forEach((q) => {
        headers.push(l.name + " - " + q.text);
      });
    });
    const rows = [headers.map((h) => '"' + String(h).replace(/"/g, '""') + '"').join(",")];
    submissions.forEach((s) => {
      const loc = locations.find((l) => l.id === s.locationId);
      const row = [
        s.submittedAt ? new Date(s.submittedAt).toLocaleString("zh-HK") : "",
        s.teamName || "",
        loc ? loc.name : s.locationId,
        s.coords ? s.coords.lat : "",
        s.coords ? s.coords.lng : ""
      ];
      locations.forEach((l) => {
        (l.questions || []).forEach((q) => {
          if (l.id === s.locationId) {
            row.push((s.answers && s.answers[q.id]) || "");
          } else {
            row.push("");
          }
        });
      });
      rows.push(row.map((c) => '"' + String(c).replace(/"/g, '""') + '"').join(","));
    });
    return "\uFEFF" + rows.join("\n");
  }

  async function uploadImage(projectId, file) {
    if (demo) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    }
    if (!storage) throw new Error("Storage 未啟用");
    const path =
      "projects/" + projectId + "/images/" + Date.now() + "_" + (file.name || "img");
    const ref = storage.ref().child(path);
    await ref.put(file);
    return await ref.getDownloadURL();
  }

  return {
    init,
    isDemo,
    resetDemo,
    uid,
    getProjectBySlug,
    getProject,
    listProjectsByOwner,
    createProject,
    updateProject,
    deleteProject,
    copyProject,
    listLocations,
    upsertLocation,
    deleteLocation,
    listTeams,
    findTeam,
    upsertTeam,
    deleteTeam,
    recordTeamLogin,
    getTeamSession,
    listTeamSessions,
    markLocationComplete,
    submitAnswers,
    listSubmissions,
    getLatestAnswersForLocation,
    exportSubmissionsCSV,
    uploadImage
  };
})();
