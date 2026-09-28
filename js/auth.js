/**
 * 認證：隊伍（slug + 隊名 + 密碼）與老師（Google / Demo）
 */
window.Auth = (function () {
  const SESSION_KEY = "gpsgame2_session";

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
    if (!DataStore.isDemo() && window.firebase && firebase.auth) {
      try {
        await firebase.auth().signOut();
      } catch (e) {}
    }
  }

  return {
    getSession,
    clearSession,
    loginTeam,
    loginTeacherGoogle,
    loginTeacherDemo,
    logout
  };
})();
