/**
 * 認證：隊伍（slug + 隊名 + 密碼）與老師（Google / Demo）
 */
window.Auth = (function () {
  const SESSION_KEY = "gpsgame2_session";
  let authReadyPromise = null;

  function loadSession() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
    } catch (e) {
      return null;
    }
  }

  function saveSession(session) {
    if (session) sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    else sessionStorage.removeItem(SESSION_KEY);
  }

  function getSession() {
    return loadSession();
  }

  function clearSession() {
    saveSession(null);
  }

  /**
   * Wait until Firebase Auth has finished restoring persistence (or timeout).
   * Resolves with currentUser (may be null). Demo / no Firebase → null immediately.
   */
  function waitForFirebaseAuth(timeoutMs) {
    timeoutMs = timeoutMs == null ? 8000 : timeoutMs;
    if (DataStore.isDemo() || !window.firebase || !firebase.auth) {
      return Promise.resolve(null);
    }
    if (authReadyPromise) return authReadyPromise;
    authReadyPromise = new Promise(function (resolve) {
      var settled = false;
      var timer = setTimeout(function () {
        if (settled) return;
        settled = true;
        try {
          resolve(firebase.auth().currentUser);
        } catch (e) {
          resolve(null);
        }
      }, timeoutMs);
      var unsub = firebase.auth().onAuthStateChanged(function (user) {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        try {
          unsub();
        } catch (e) {}
        resolve(user || null);
      });
    });
    return authReadyPromise;
  }

  /**
   * For a cached teacher session: ensure Firebase Auth matches session.uid.
   * If auth missing / uid mismatch (InPrivate, expired token, etc.), clear session
   * and return null so caller forces re-login. Demo teacher sessions pass through.
   */
  async function ensureTeacherAuth() {
    var session = loadSession();
    if (!session || session.role !== "teacher") return null;
    if (session.demo || DataStore.isDemo()) return session;

    var user = await waitForFirebaseAuth();
    if (!user || user.uid !== session.uid) {
      clearSession();
      try {
        if (firebase.auth().currentUser) await firebase.auth().signOut();
      } catch (e) {}
      return null;
    }
    // Keep session email/name in sync if Auth restored a fresher profile
    if (user.email && user.email !== session.email) {
      session.email = user.email;
      session.displayName = user.displayName || user.email;
      saveSession(session);
    }
    return session;
  }

  /** True when Firestore permission errors likely mean missing Auth token. */
  function isPermissionError(err) {
    if (!err) return false;
    var code = err.code || "";
    var msg = String(err.message || err);
    return (
      code === "permission-denied" ||
      /Missing or insufficient permissions/i.test(msg) ||
      /PERMISSION_DENIED/i.test(msg)
    );
  }

  async function loginTeam(slug, teamName, password) {
    const project = await DataStore.getProjectBySlug((slug || "").trim());
    if (!project) throw new Error("找不到專案（請檢查專案代碼／網址）");
    const team = await DataStore.findTeam(project.id, teamName, password);
    if (!team) throw new Error("隊伍名稱或密碼不正確");
    await DataStore.recordTeamLogin(project.id, team.id);
    const session = {
      role: "team",
      projectId: project.id,
      projectSlug: project.slug,
      teamId: team.id,
      teamName: team.name,
      loginAt: new Date().toISOString()
    };
    saveSession(session);
    return { session, project };
  }

  async function loginTeacherDemo() {
    const session = {
      role: "teacher",
      uid: "demo_teacher",
      email: "demo@school.edu.hk",
      displayName: "示範老師",
      loginAt: new Date().toISOString(),
      demo: true
    };
    saveSession(session);
    return session;
  }

  async function loginTeacherGoogle() {
    if (DataStore.isDemo() || !window.isFirebaseConfigured()) {
      return loginTeacherDemo();
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    const domain = window.ALLOWED_TEACHER_DOMAIN || "";
    if (domain) provider.setCustomParameters({ hd: domain });
    const result = await firebase.auth().signInWithPopup(provider);
    const user = result.user;
    const email = user.email || "";
    if (domain && !email.endsWith("@" + domain)) {
      await firebase.auth().signOut();
      throw new Error("只有 @" + domain + " 的帳號可以登入老師後台");
    }
    await firebase
      .firestore()
      .collection("teachers")
      .doc(user.uid)
      .set(
        {
          email,
          displayName: user.displayName || "",
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
    // Auth is now known; reset wait cache for future boots
    authReadyPromise = Promise.resolve(user);
    const session = {
      role: "teacher",
      uid: user.uid,
      email,
      displayName: user.displayName || email,
      loginAt: new Date().toISOString(),
      demo: false
    };
    saveSession(session);
    return session;
  }

  async function logout() {
    clearSession();
    authReadyPromise = null;
    if (!DataStore.isDemo() && window.firebase && firebase.auth) {
      try {
        await firebase.auth().signOut();
      } catch (e) {}
    }
  }

  return {
    getSession,
    clearSession,
    waitForFirebaseAuth,
    ensureTeacherAuth,
    isPermissionError,
    loginTeam,
    loginTeacherGoogle,
    loginTeacherDemo,
    logout
  };
})();
