/** data-requiregps-fix.js — v20260930a
 * Patches DataStore.upsertLocation to persist location.requireGps (default true).
 * Safe no-op if DataStore missing; safe if already patched.
 */
(function () {
  function install() {
    if (!window.DataStore || typeof DataStore.upsertLocation !== "function") return;
    if (DataStore.__requireGpsPatched) return;
    var orig = DataStore.upsertLocation.bind(DataStore);
    DataStore.upsertLocation = async function (projectId, locId, locData) {
      locData = Object.assign({}, locData || {});
      if (locData.requireGps === false || locData.requireGps === "false") {
        locData.requireGps = false;
      } else if (locData.requireGps == null) {
        locData.requireGps = true;
      } else {
        locData.requireGps = true;
      }
      var result = await orig(projectId, locId, locData);
      try {
        if (DataStore.isDemo && DataStore.isDemo()) {
          var key = "gpsgame2_demo_v1";
          var raw = localStorage.getItem(key);
          if (raw) {
            var data = JSON.parse(raw);
            var id = (result && result.id) || locId;
            if (data.locations && data.locations[projectId] && data.locations[projectId][id]) {
              data.locations[projectId][id].requireGps = locData.requireGps !== false;
              localStorage.setItem(key, JSON.stringify(data));
              if (result) result.requireGps = data.locations[projectId][id].requireGps;
            }
          }
        }
      } catch (e) {}
      if (result && result.requireGps === undefined && window.firebase && firebase.firestore) {
        try {
          var db = firebase.firestore();
          var id2 = result.id || locId;
          await db
            .collection("projects")
            .doc(projectId)
            .collection("locations")
            .doc(id2)
            .set({ requireGps: locData.requireGps !== false }, { merge: true });
          result.requireGps = locData.requireGps !== false;
        } catch (e2) {
          console.warn("requireGps merge failed", e2 && e2.message);
        }
      }
      return result;
    };
    DataStore.__requireGpsPatched = true;
  }
  install();
  if (!DataStore || !DataStore.__requireGpsPatched) {
    setTimeout(install, 0);
  }
})();
