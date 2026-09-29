/** completion-page.js — v20260929e (loads full via sync XHR) */
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
  var v = "?v=20260929e";
  (0, eval)(loadText("js/completion-page.full.txt" + v));
})();
