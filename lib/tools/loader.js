Module['loadSplitModule'] = Module['loadSplitModule'] || (function() {
  // Exported trampolines can revisit an already loaded module.
  var loaded = new Set();
  return function(file, imports) {
    if (loaded.has(file)) return;

    // Calculation is synchronous; text-mode XHR also works on the main thread.
    var request = new XMLHttpRequest();
    request.open('GET', file, false);
    request.overrideMimeType('text/plain; charset=x-user-defined');
    request.send();
    if (request.status !== 200) throw new Error('Calculator: HTTP ' + request.status);
    var bytes = Uint8Array.from(request.responseText, function(c) { return c.charCodeAt(0) & 255; });
    new WebAssembly.Instance(new WebAssembly.Module(bytes), imports);
    loaded.add(file);
  };
})();
