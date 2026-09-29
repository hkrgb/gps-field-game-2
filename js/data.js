/** data.js — sync load parts (do not minify) */
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
  var v = "?v=20260929d";
  var code = loadText("js/data.p1.txt" + v) + loadText("js/data.p2.txt" + v);
  (0, eval)(code);
})();
