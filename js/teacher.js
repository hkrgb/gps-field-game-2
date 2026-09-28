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
  var code =
    loadText("js/teacher.p1.txt") +
    loadText("js/teacher.p2.txt") +
    loadText("js/teacher.p3.txt");
  (0, eval)(code);
})();
