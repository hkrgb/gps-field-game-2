/** completion-page.js — v20260929e (2-part base64) */
(function () {
  function loadText(path) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", path, false);
    xhr.send(null);
    if (xhr.status !== 200 && xhr.status !== 0) throw new Error("Cannot load " + path);
    return xhr.responseText.trim();
  }
  var v = "?v=20260929e";
  var b64 = loadText("js/completion-page.a.b64" + v) + loadText("js/completion-page.b.b64" + v);
  var bin = atob(b64);
  var bytes = new Uint8Array(bin.length);
  for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  (0, eval)(new TextDecoder("utf-8").decode(bytes));
})();
