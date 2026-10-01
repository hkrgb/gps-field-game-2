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
  var v = "?v=20261001b";
  var code =
    loadText("js/teacher.p1.txt" + v) +
    loadText("js/teacher.p2a.txt" + v) +
    loadText("js/teacher.p2b.txt" + v) +
    loadText("js/teacher.p3a0.txt" + v) +
    loadText("js/teacher.p3a1.txt" + v) +
    loadText("js/teacher.p3b1.txt" + v) +
    loadText("js/teacher.p3b2.txt" + v) +
    loadText("js/teacher.p3c.txt" + v);
  (0, eval)(code);
})();
