/** auth.js — sync load parts (do not minify) */
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
  var v = "?v=20260930a";
  var code =
    loadText("js/auth.p1a.txt" + v) +
    loadText("js/auth.p1b.txt" + v) +
    loadText("js/auth.p2.txt" + v);
  (0, eval)(code);
})();
