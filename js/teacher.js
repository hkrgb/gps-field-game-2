/** teacher.js — sync load parts (do not minify) */
(function () {
  function loadText(path) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", path, false);
    xhr.send(null);
    if (xhr.status !== 200 && xhr.status !== 0) {
      throw new Error("Cannot load " + path + " (" + xhr.status + ")");
    }
    return xhr.responseText;
  }
  var v = "?v=20260929f";
  var code =
    loadText("js/teacher.p1.txt" + v) +
    loadText("js/teacher.p2a.txt" + v) +
    loadText("js/teacher.p2b.txt" + v) +
    loadText("js/teacher.p3.txt" + v);
  (0, eval)(code);
  try {
    (0, eval)(loadText("js/completion-page.js" + v));
  } catch (e) {
    console.warn("completion-page.js load failed", e);
  }
  try {
    (0, eval)(loadText("js/site-footer.js" + v));
  } catch (e) {
    console.warn("site-footer.js load failed", e);
  }
})();
