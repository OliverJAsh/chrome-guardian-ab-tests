System.config({
  baseURL: "/",
  defaultJSExtensions: true,
  transpiler: "babel",
  babelOptions: {
    "optional": [
      "runtime"
    ]
  },
  paths: {
    "github:*": "jspm_packages/github/*",
    "npm:*": "jspm_packages/npm/*"
  },

  map: {
    "@cycle/core": "npm:@cycle/core@6.0.0",
    "@cycle/dom": "npm:@cycle/dom@9.0.2",
    "babel": "npm:babel-core@5.8.35",
    "babel-runtime": "npm:babel-runtime@5.8.35",
    "core-js": "npm:core-js@1.2.6",
    "immutable": "npm:immutable@3.7.4",
    "moment": "github:moment/moment@2.10.3",
    "rx": "npm:rx@4.0.7",
    "rx-dom": "npm:rx-dom@7.0.3",
    "vdom-virtualize": "npm:vdom-virtualize@0.0.10",
    "virtual-dom": "npm:virtual-dom@2.1.1",
    "github:jspm/nodelibs-assert@0.1.0": {
      "assert": "npm:assert@1.3.0"
    },
    "github:jspm/nodelibs-path@0.1.0": {
      "path-browserify": "npm:path-browserify@0.0.0"
    },
    "github:jspm/nodelibs-process@0.1.2": {
      "process": "npm:process@0.11.2"
    },
    "github:jspm/nodelibs-util@0.1.0": {
      "util": "npm:util@0.10.3"
    },
    "npm:@cycle/core@6.0.0": {
      "rx": "npm:rx@4.0.7"
    },
    "npm:@cycle/dom@9.0.2": {
      "hyperscript-helpers": "npm:hyperscript-helpers@2.0.3",
      "matches-selector": "npm:matches-selector@1.0.0",
      "vdom-parser": "npm:vdom-parser@1.2.1",
      "vdom-to-html": "npm:vdom-to-html@2.2.0",
      "virtual-dom": "npm:virtual-dom@2.1.1",
      "x-is-array": "npm:x-is-array@0.1.0"
    },
    "npm:assert@1.3.0": {
      "util": "npm:util@0.10.3"
    },
    "npm:babel-runtime@5.8.35": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:core-js@1.2.6": {
      "fs": "github:jspm/nodelibs-fs@0.1.2",
      "path": "github:jspm/nodelibs-path@0.1.0",
      "process": "github:jspm/nodelibs-process@0.1.2",
      "systemjs-json": "github:systemjs/plugin-json@0.1.0"
    },
    "npm:error@4.4.0": {
      "assert": "github:jspm/nodelibs-assert@0.1.0",
      "camelize": "npm:camelize@1.0.0",
      "string-template": "npm:string-template@0.2.1",
      "xtend": "npm:xtend@4.0.1"
    },
    "npm:ev-store@7.0.0": {
      "individual": "npm:individual@3.0.0"
    },
    "npm:global@4.3.0": {
      "process": "npm:process@0.5.2"
    },
    "npm:inherits@2.0.1": {
      "util": "github:jspm/nodelibs-util@0.1.0"
    },
    "npm:next-tick@0.2.2": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:param-case@1.1.2": {
      "sentence-case": "npm:sentence-case@1.1.3"
    },
    "npm:path-browserify@0.0.0": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:process@0.11.2": {
      "assert": "github:jspm/nodelibs-assert@0.1.0"
    },
    "npm:rx-dom@7.0.3": {
      "process": "github:jspm/nodelibs-process@0.1.2",
      "rx": "npm:rx@4.0.7"
    },
    "npm:rx@4.0.7": {
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:sentence-case@1.1.3": {
      "lower-case": "npm:lower-case@1.1.3"
    },
    "npm:util@0.10.3": {
      "inherits": "npm:inherits@2.0.1",
      "process": "github:jspm/nodelibs-process@0.1.2"
    },
    "npm:vdom-parser@1.2.1": {
      "virtual-dom": "npm:virtual-dom@2.1.1"
    },
    "npm:vdom-to-html@2.2.0": {
      "escape-html": "npm:escape-html@1.0.3",
      "param-case": "npm:param-case@1.1.2",
      "virtual-dom": "npm:virtual-dom@2.1.1",
      "xtend": "npm:xtend@4.0.1"
    },
    "npm:vdom-virtualize@0.0.10": {
      "virtual-dom": "npm:virtual-dom@2.1.1"
    },
    "npm:virtual-dom@2.1.1": {
      "browser-split": "npm:browser-split@0.0.1",
      "error": "npm:error@4.4.0",
      "ev-store": "npm:ev-store@7.0.0",
      "global": "npm:global@4.3.0",
      "is-object": "npm:is-object@1.0.1",
      "next-tick": "npm:next-tick@0.2.2",
      "x-is-array": "npm:x-is-array@0.1.0",
      "x-is-string": "npm:x-is-string@0.1.0"
    }
  }
});
