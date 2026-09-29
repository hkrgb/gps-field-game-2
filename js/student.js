/** student.js — sync load parts (do not minify) */
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
    loadText("js/student.p1a.txt" + v) +
    loadText("js/student.p1a2.txt" + v) +
    loadText("js/student.p1b.txt" + v) +
    loadText("js/student.p2.txt" + v);
  (0, eval)(code);
})();
