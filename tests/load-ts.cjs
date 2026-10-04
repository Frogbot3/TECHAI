const fs = require('fs');
const path = require('path');
const Module = require('module');
const ts = require('typescript');

// Isolated module graph: tests run real route/helper code with explicit database
// and gateway boundaries, without touching the configured store or sending mail.
module.exports = function loader(mocks = {}) {
  const cache = new Map();
  function load(file) {
    const filename = path.resolve(file);
    if (cache.has(filename)) return cache.get(filename).exports;
    const mod = new Module(filename, module);
    cache.set(filename, mod);
    mod.filename = filename;
    mod.paths = Module._nodeModulePaths(path.dirname(filename));
    mod.require = spec => {
      if (Object.hasOwn(mocks, spec)) return mocks[spec];
      if (spec.startsWith('@/') || spec.startsWith('.')) {
        const target = spec.startsWith('@/') ? path.resolve('src', spec.slice(2)) : path.resolve(path.dirname(filename), spec);
        for (const suffix of ['', '.ts', '.tsx']) if (fs.existsSync(target + suffix) && fs.statSync(target + suffix).isFile()) return load(target + suffix);
      }
      return require(spec);
    };
    mod._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX } }).outputText, filename);
    return mod.exports;
  }
  return load;
};
