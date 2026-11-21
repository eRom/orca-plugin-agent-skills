import { createRequire } from "node:module";
var __defProp = Object.defineProperty;
var __commonJS = (cb, mod) => () => (mod || cb((mod = { exports: {} }).exports, mod), mod.exports);
var __returnValue = (v) => v;
function __exportSetter(name, newValue) {
  this[name] = __returnValue.bind(null, newValue);
}
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, {
      get: all[name],
      enumerable: true,
      configurable: true,
      set: __exportSetter.bind(all, name)
    });
};
var __require = /* @__PURE__ */ createRequire(import.meta.url);

// node_modules/yaml/dist/nodes/identity.js
var require_identity = __commonJS(function(exports) {
  var ALIAS = Symbol.for("yaml.alias");
  var DOC = Symbol.for("yaml.document");
  var MAP = Symbol.for("yaml.map");
  var PAIR = Symbol.for("yaml.pair");
  var SCALAR = Symbol.for("yaml.scalar");
  var SEQ = Symbol.for("yaml.seq");
  var NODE_TYPE = Symbol.for("yaml.node.type");
  var isAlias = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === ALIAS;
  var isDocument = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === DOC;
  var isMap = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === MAP;
  var isPair = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === PAIR;
  var isScalar = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SCALAR;
  var isSeq = (node) => !!node && typeof node === "object" && node[NODE_TYPE] === SEQ;
  function isCollection(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case MAP:
        case SEQ:
          return true;
      }
    return false;
  }
  function isNode(node) {
    if (node && typeof node === "object")
      switch (node[NODE_TYPE]) {
        case ALIAS:
        case MAP:
        case SCALAR:
        case SEQ:
          return true;
      }
    return false;
  }
  var hasAnchor = (node) => (isScalar(node) || isCollection(node)) && !!node.anchor;
  exports.ALIAS = ALIAS;
  exports.DOC = DOC;
  exports.MAP = MAP;
  exports.NODE_TYPE = NODE_TYPE;
  exports.PAIR = PAIR;
  exports.SCALAR = SCALAR;
  exports.SEQ = SEQ;
  exports.hasAnchor = hasAnchor;
  exports.isAlias = isAlias;
  exports.isCollection = isCollection;
  exports.isDocument = isDocument;
  exports.isMap = isMap;
  exports.isNode = isNode;
  exports.isPair = isPair;
  exports.isScalar = isScalar;
  exports.isSeq = isSeq;
});

// node_modules/yaml/dist/visit.js
var require_visit = __commonJS(function(exports) {
  var identity = require_identity();
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove node");
  function visit(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = visit_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      visit_(null, node, visitor_, Object.freeze([]));
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  function visit_(key, node, visitor, path2) {
    const ctrl = callVisitor(key, node, visitor, path2);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path2, ctrl);
      return visit_(key, ctrl, visitor, path2);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path2 = Object.freeze(path2.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = visit_(i, node.items[i], visitor, path2);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path2 = Object.freeze(path2.concat(node));
        const ck = visit_("key", node.key, visitor, path2);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = visit_("value", node.value, visitor, path2);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  async function visitAsync(node, visitor) {
    const visitor_ = initVisitor(visitor);
    if (identity.isDocument(node)) {
      const cd = await visitAsync_(null, node.contents, visitor_, Object.freeze([node]));
      if (cd === REMOVE)
        node.contents = null;
    } else
      await visitAsync_(null, node, visitor_, Object.freeze([]));
  }
  visitAsync.BREAK = BREAK;
  visitAsync.SKIP = SKIP;
  visitAsync.REMOVE = REMOVE;
  async function visitAsync_(key, node, visitor, path2) {
    const ctrl = await callVisitor(key, node, visitor, path2);
    if (identity.isNode(ctrl) || identity.isPair(ctrl)) {
      replaceNode(key, path2, ctrl);
      return visitAsync_(key, ctrl, visitor, path2);
    }
    if (typeof ctrl !== "symbol") {
      if (identity.isCollection(node)) {
        path2 = Object.freeze(path2.concat(node));
        for (let i = 0;i < node.items.length; ++i) {
          const ci = await visitAsync_(i, node.items[i], visitor, path2);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            node.items.splice(i, 1);
            i -= 1;
          }
        }
      } else if (identity.isPair(node)) {
        path2 = Object.freeze(path2.concat(node));
        const ck = await visitAsync_("key", node.key, visitor, path2);
        if (ck === BREAK)
          return BREAK;
        else if (ck === REMOVE)
          node.key = null;
        const cv = await visitAsync_("value", node.value, visitor, path2);
        if (cv === BREAK)
          return BREAK;
        else if (cv === REMOVE)
          node.value = null;
      }
    }
    return ctrl;
  }
  function initVisitor(visitor) {
    if (typeof visitor === "object" && (visitor.Collection || visitor.Node || visitor.Value)) {
      return Object.assign({
        Alias: visitor.Node,
        Map: visitor.Node,
        Scalar: visitor.Node,
        Seq: visitor.Node
      }, visitor.Value && {
        Map: visitor.Value,
        Scalar: visitor.Value,
        Seq: visitor.Value
      }, visitor.Collection && {
        Map: visitor.Collection,
        Seq: visitor.Collection
      }, visitor);
    }
    return visitor;
  }
  function callVisitor(key, node, visitor, path2) {
    if (typeof visitor === "function")
      return visitor(key, node, path2);
    if (identity.isMap(node))
      return visitor.Map?.(key, node, path2);
    if (identity.isSeq(node))
      return visitor.Seq?.(key, node, path2);
    if (identity.isPair(node))
      return visitor.Pair?.(key, node, path2);
    if (identity.isScalar(node))
      return visitor.Scalar?.(key, node, path2);
    if (identity.isAlias(node))
      return visitor.Alias?.(key, node, path2);
    return;
  }
  function replaceNode(key, path2, node) {
    const parent = path2[path2.length - 1];
    if (identity.isCollection(parent)) {
      parent.items[key] = node;
    } else if (identity.isPair(parent)) {
      if (key === "key")
        parent.key = node;
      else
        parent.value = node;
    } else if (identity.isDocument(parent)) {
      parent.contents = node;
    } else {
      const pt2 = identity.isAlias(parent) ? "alias" : "scalar";
      throw new Error(`Cannot replace node with ${pt2} parent`);
    }
  }
  exports.visit = visit;
  exports.visitAsync = visitAsync;
});

// node_modules/yaml/dist/doc/directives.js
var require_directives = __commonJS(function(exports) {
  var identity = require_identity();
  var visit = require_visit();
  var escapeChars = {
    "!": "%21",
    ",": "%2C",
    "[": "%5B",
    "]": "%5D",
    "{": "%7B",
    "}": "%7D"
  };
  var escapeTagName = (tn2) => tn2.replace(/[!,[\]{}]/g, (ch) => escapeChars[ch]);

  class Directives {
    constructor(yaml, tags) {
      this.docStart = null;
      this.docEnd = false;
      this.yaml = Object.assign({}, Directives.defaultYaml, yaml);
      this.tags = Object.assign({}, Directives.defaultTags, tags);
    }
    clone() {
      const copy = new Directives(this.yaml, this.tags);
      copy.docStart = this.docStart;
      return copy;
    }
    atDocument() {
      const res = new Directives(this.yaml, this.tags);
      switch (this.yaml.version) {
        case "1.1":
          this.atNextDocument = true;
          break;
        case "1.2":
          this.atNextDocument = false;
          this.yaml = {
            explicit: Directives.defaultYaml.explicit,
            version: "1.2"
          };
          this.tags = Object.assign({}, Directives.defaultTags);
          break;
      }
      return res;
    }
    add(line, onError) {
      if (this.atNextDocument) {
        this.yaml = { explicit: Directives.defaultYaml.explicit, version: "1.1" };
        this.tags = Object.assign({}, Directives.defaultTags);
        this.atNextDocument = false;
      }
      const parts = line.trim().split(/[ \t]+/);
      const name = parts.shift();
      switch (name) {
        case "%TAG": {
          if (parts.length !== 2) {
            onError(0, "%TAG directive should contain exactly two parts");
            if (parts.length < 2)
              return false;
          }
          const [handle, prefix] = parts;
          this.tags[handle] = prefix;
          return true;
        }
        case "%YAML": {
          this.yaml.explicit = true;
          if (parts.length !== 1) {
            onError(0, "%YAML directive should contain exactly one part");
            return false;
          }
          const [version] = parts;
          if (version === "1.1" || version === "1.2") {
            this.yaml.version = version;
            return true;
          } else {
            const isValid = /^\d+\.\d+$/.test(version);
            onError(6, `Unsupported YAML version ${version}`, isValid);
            return false;
          }
        }
        default:
          onError(0, `Unknown directive ${name}`, true);
          return false;
      }
    }
    tagName(source, onError) {
      if (source === "!")
        return "!";
      if (source[0] !== "!") {
        onError(`Not a valid tag: ${source}`);
        return null;
      }
      if (source[1] === "<") {
        const verbatim = source.slice(2, -1);
        if (verbatim === "!" || verbatim === "!!") {
          onError(`Verbatim tags aren't resolved, so ${source} is invalid.`);
          return null;
        }
        if (source[source.length - 1] !== ">")
          onError("Verbatim tags must end with a >");
        return verbatim;
      }
      const [, handle, suffix] = source.match(/^(.*!)([^!]*)$/s);
      if (!suffix)
        onError(`The ${source} tag has no suffix`);
      const prefix = this.tags[handle];
      if (prefix) {
        try {
          return prefix + decodeURIComponent(suffix);
        } catch (error) {
          onError(String(error));
          return null;
        }
      }
      if (handle === "!")
        return source;
      onError(`Could not resolve tag: ${source}`);
      return null;
    }
    tagString(tag) {
      for (const [handle, prefix] of Object.entries(this.tags)) {
        if (tag.startsWith(prefix))
          return handle + escapeTagName(tag.substring(prefix.length));
      }
      return tag[0] === "!" ? tag : `!<${tag}>`;
    }
    toString(doc) {
      const lines = this.yaml.explicit ? [`%YAML ${this.yaml.version || "1.2"}`] : [];
      const tagEntries = Object.entries(this.tags);
      let tagNames;
      if (doc && tagEntries.length > 0 && identity.isNode(doc.contents)) {
        const tags = {};
        visit.visit(doc.contents, (_key, node) => {
          if (identity.isNode(node) && node.tag)
            tags[node.tag] = true;
        });
        tagNames = Object.keys(tags);
      } else
        tagNames = [];
      for (const [handle, prefix] of tagEntries) {
        if (handle === "!!" && prefix === "tag:yaml.org,2002:")
          continue;
        if (!doc || tagNames.some((tn2) => tn2.startsWith(prefix)))
          lines.push(`%TAG ${handle} ${prefix}`);
      }
      return lines.join(`
`);
    }
  }
  Directives.defaultYaml = { explicit: false, version: "1.2" };
  Directives.defaultTags = { "!!": "tag:yaml.org,2002:" };
  exports.Directives = Directives;
});

// node_modules/yaml/dist/doc/anchors.js
var require_anchors = __commonJS(function(exports) {
  var identity = require_identity();
  var visit = require_visit();
  function anchorIsValid(anchor) {
    if (/[\x00-\x19\s,[\]{}]/.test(anchor)) {
      const sa = JSON.stringify(anchor);
      const msg = `Anchor must not contain whitespace or control characters: ${sa}`;
      throw new Error(msg);
    }
    return true;
  }
  function anchorNames(root) {
    const anchors = new Set;
    visit.visit(root, {
      Value(_key, node) {
        if (node.anchor)
          anchors.add(node.anchor);
      }
    });
    return anchors;
  }
  function findNewAnchor(prefix, exclude) {
    for (let i = 1;; ++i) {
      const name = `${prefix}${i}`;
      if (!exclude.has(name))
        return name;
    }
  }
  function createNodeAnchors(doc, prefix) {
    const aliasObjects = [];
    const sourceObjects = new Map;
    let prevAnchors = null;
    return {
      onAnchor: (source) => {
        aliasObjects.push(source);
        prevAnchors ?? (prevAnchors = anchorNames(doc));
        const anchor = findNewAnchor(prefix, prevAnchors);
        prevAnchors.add(anchor);
        return anchor;
      },
      setAnchors: () => {
        for (const source of aliasObjects) {
          const ref = sourceObjects.get(source);
          if (typeof ref === "object" && ref.anchor && (identity.isScalar(ref.node) || identity.isCollection(ref.node))) {
            ref.node.anchor = ref.anchor;
          } else {
            const error = new Error("Failed to resolve repeated object (this should not happen)");
            error.source = source;
            throw error;
          }
        }
      },
      sourceObjects
    };
  }
  exports.anchorIsValid = anchorIsValid;
  exports.anchorNames = anchorNames;
  exports.createNodeAnchors = createNodeAnchors;
  exports.findNewAnchor = findNewAnchor;
});

// node_modules/yaml/dist/doc/applyReviver.js
var require_applyReviver = __commonJS(function(exports) {
  function applyReviver(reviver, obj, key, val) {
    if (val && typeof val === "object") {
      if (Array.isArray(val)) {
        for (let i = 0, len = val.length;i < len; ++i) {
          const v0 = val[i];
          const v1 = applyReviver(reviver, val, String(i), v0);
          if (v1 === undefined)
            delete val[i];
          else if (v1 !== v0)
            val[i] = v1;
        }
      } else if (val instanceof Map) {
        for (const k2 of Array.from(val.keys())) {
          const v0 = val.get(k2);
          const v1 = applyReviver(reviver, val, k2, v0);
          if (v1 === undefined)
            val.delete(k2);
          else if (v1 !== v0)
            val.set(k2, v1);
        }
      } else if (val instanceof Set) {
        for (const v0 of Array.from(val)) {
          const v1 = applyReviver(reviver, val, v0, v0);
          if (v1 === undefined)
            val.delete(v0);
          else if (v1 !== v0) {
            val.delete(v0);
            val.add(v1);
          }
        }
      } else {
        for (const [k2, v0] of Object.entries(val)) {
          const v1 = applyReviver(reviver, val, k2, v0);
          if (v1 === undefined)
            delete val[k2];
          else if (v1 !== v0)
            val[k2] = v1;
        }
      }
    }
    return reviver.call(obj, key, val);
  }
  exports.applyReviver = applyReviver;
});

// node_modules/yaml/dist/nodes/toJS.js
var require_toJS = __commonJS(function(exports) {
  var identity = require_identity();
  function toJS(value, arg, ctx) {
    if (Array.isArray(value))
      return value.map((v2, i) => toJS(v2, String(i), ctx));
    if (value && typeof value.toJSON === "function") {
      if (!ctx || !identity.hasAnchor(value))
        return value.toJSON(arg, ctx);
      const data = { aliasCount: 0, count: 1, res: undefined };
      ctx.anchors.set(value, data);
      ctx.onCreate = (res2) => {
        data.res = res2;
        delete ctx.onCreate;
      };
      const res = value.toJSON(arg, ctx);
      if (ctx.onCreate)
        ctx.onCreate(res);
      return res;
    }
    if (typeof value === "bigint" && !ctx?.keep)
      return Number(value);
    return value;
  }
  exports.toJS = toJS;
});

// node_modules/yaml/dist/nodes/Node.js
var require_Node = __commonJS(function(exports) {
  var applyReviver = require_applyReviver();
  var identity = require_identity();
  var toJS = require_toJS();

  class NodeBase {
    constructor(type) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: type });
    }
    clone() {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    toJS(doc, { mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      if (!identity.isDocument(doc))
        throw new TypeError("A document argument is required");
      const ctx = {
        anchors: new Map,
        doc,
        keep: true,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this, "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res: res2 } of ctx.anchors.values())
          onAnchor(res2, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
  }
  exports.NodeBase = NodeBase;
});

// node_modules/yaml/dist/nodes/Alias.js
var require_Alias = __commonJS(function(exports) {
  var anchors = require_anchors();
  var visit = require_visit();
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();

  class Alias extends Node.NodeBase {
    constructor(source) {
      super(identity.ALIAS);
      this.source = source;
      Object.defineProperty(this, "tag", {
        set() {
          throw new Error("Alias nodes cannot have tags");
        }
      });
    }
    resolve(doc, ctx) {
      if (ctx?.maxAliasCount === 0)
        throw new ReferenceError("Alias resolution is disabled");
      let nodes;
      if (ctx?.aliasResolveCache) {
        nodes = ctx.aliasResolveCache;
      } else {
        nodes = [];
        visit.visit(doc, {
          Node: (_key, node) => {
            if (identity.isAlias(node) || identity.hasAnchor(node))
              nodes.push(node);
          }
        });
        if (ctx)
          ctx.aliasResolveCache = nodes;
      }
      let found = undefined;
      for (const node of nodes) {
        if (node === this)
          break;
        if (node.anchor === this.source)
          found = node;
      }
      if (found && ctx) {
        const { anchors: anchors2, doc: doc2, maxAliasCount } = ctx;
        let data = anchors2.get(found);
        if (!data) {
          toJS.toJS(found, null, ctx);
          data = anchors2.get(found);
        }
        if (data?.res === undefined) {
          const msg = "This should not happen: Alias anchor was not resolved?";
          throw new ReferenceError(msg);
        }
        if (maxAliasCount >= 0) {
          data.count += 1;
          if (data.aliasCount === 0)
            data.aliasCount = getAliasCount(doc2, found, anchors2);
          if (data.count * data.aliasCount > maxAliasCount) {
            const msg = "Excessive alias count indicates a resource exhaustion attack";
            throw new ReferenceError(msg);
          }
        }
      }
      return found;
    }
    toJSON(_arg, ctx) {
      if (!ctx)
        return { source: this.source };
      const source = this.resolve(ctx.doc, ctx);
      if (!source) {
        const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
        throw new ReferenceError(msg);
      }
      return ctx.anchors.get(source).res;
    }
    toString(ctx, _onComment, _onChompKeep) {
      const src = `*${this.source}`;
      if (ctx) {
        anchors.anchorIsValid(this.source);
        if (ctx.options.verifyAliasOrder && !ctx.anchors.has(this.source)) {
          const msg = `Unresolved alias (the anchor must be set before the alias): ${this.source}`;
          throw new Error(msg);
        }
        if (ctx.implicitKey)
          return `${src} `;
      }
      return src;
    }
  }
  function getAliasCount(doc, node, anchors2) {
    if (identity.isAlias(node)) {
      const source = node.resolve(doc);
      const anchor = anchors2 && source && anchors2.get(source);
      return anchor ? anchor.count * anchor.aliasCount : 0;
    } else if (identity.isCollection(node)) {
      let count = 0;
      for (const item of node.items) {
        const c3 = getAliasCount(doc, item, anchors2);
        if (c3 > count)
          count = c3;
      }
      return count;
    } else if (identity.isPair(node)) {
      const kc = getAliasCount(doc, node.key, anchors2);
      const vc = getAliasCount(doc, node.value, anchors2);
      return Math.max(kc, vc);
    }
    return 1;
  }
  exports.Alias = Alias;
});

// node_modules/yaml/dist/nodes/Scalar.js
var require_Scalar = __commonJS(function(exports) {
  var identity = require_identity();
  var Node = require_Node();
  var toJS = require_toJS();
  var isScalarValue = (value) => !value || typeof value !== "function" && typeof value !== "object";

  class Scalar extends Node.NodeBase {
    constructor(value) {
      super(identity.SCALAR);
      this.value = value;
    }
    toJSON(arg, ctx) {
      return ctx?.keep ? this.value : toJS.toJS(this.value, arg, ctx);
    }
    toString() {
      return String(this.value);
    }
  }
  Scalar.BLOCK_FOLDED = "BLOCK_FOLDED";
  Scalar.BLOCK_LITERAL = "BLOCK_LITERAL";
  Scalar.PLAIN = "PLAIN";
  Scalar.QUOTE_DOUBLE = "QUOTE_DOUBLE";
  Scalar.QUOTE_SINGLE = "QUOTE_SINGLE";
  exports.Scalar = Scalar;
  exports.isScalarValue = isScalarValue;
});

// node_modules/yaml/dist/doc/createNode.js
var require_createNode = __commonJS(function(exports) {
  var Alias = require_Alias();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var defaultTagPrefix = "tag:yaml.org,2002:";
  function findTagObject(value, tagName, tags) {
    if (tagName) {
      const match = tags.filter((t2) => t2.tag === tagName);
      const tagObj = match.find((t2) => !t2.format) ?? match[0];
      if (!tagObj)
        throw new Error(`Tag ${tagName} not found`);
      return tagObj;
    }
    return tags.find((t2) => t2.identify?.(value) && !t2.format);
  }
  function createNode(value, tagName, ctx) {
    if (identity.isDocument(value))
      value = value.contents;
    if (identity.isNode(value))
      return value;
    if (identity.isPair(value)) {
      const map = ctx.schema[identity.MAP].createNode?.(ctx.schema, null, ctx);
      map.items.push(value);
      return map;
    }
    if (value instanceof String || value instanceof Number || value instanceof Boolean || typeof BigInt !== "undefined" && value instanceof BigInt) {
      value = value.valueOf();
    }
    const { aliasDuplicateObjects, onAnchor, onTagObj, schema, sourceObjects } = ctx;
    let ref = undefined;
    if (aliasDuplicateObjects && value && typeof value === "object") {
      ref = sourceObjects.get(value);
      if (ref) {
        ref.anchor ?? (ref.anchor = onAnchor(value));
        return new Alias.Alias(ref.anchor);
      } else {
        ref = { anchor: null, node: null };
        sourceObjects.set(value, ref);
      }
    }
    if (tagName?.startsWith("!!"))
      tagName = defaultTagPrefix + tagName.slice(2);
    let tagObj = findTagObject(value, tagName, schema.tags);
    if (!tagObj) {
      if (value && typeof value.toJSON === "function") {
        value = value.toJSON();
      }
      if (!value || typeof value !== "object") {
        const node2 = new Scalar.Scalar(value);
        if (ref)
          ref.node = node2;
        return node2;
      }
      tagObj = value instanceof Map ? schema[identity.MAP] : (Symbol.iterator in Object(value)) ? schema[identity.SEQ] : schema[identity.MAP];
    }
    if (onTagObj) {
      onTagObj(tagObj);
      delete ctx.onTagObj;
    }
    const node = tagObj?.createNode ? tagObj.createNode(ctx.schema, value, ctx) : typeof tagObj?.nodeClass?.from === "function" ? tagObj.nodeClass.from(ctx.schema, value, ctx) : new Scalar.Scalar(value);
    if (tagName)
      node.tag = tagName;
    else if (!tagObj.default)
      node.tag = tagObj.tag;
    if (ref)
      ref.node = node;
    return node;
  }
  exports.createNode = createNode;
});

// node_modules/yaml/dist/nodes/Collection.js
var require_Collection = __commonJS(function(exports) {
  var createNode = require_createNode();
  var identity = require_identity();
  var Node = require_Node();
  function collectionFromPath(schema, path2, value) {
    let v2 = value;
    for (let i = path2.length - 1;i >= 0; --i) {
      const k2 = path2[i];
      if (typeof k2 === "number" && Number.isInteger(k2) && k2 >= 0) {
        const a2 = [];
        a2[k2] = v2;
        v2 = a2;
      } else {
        v2 = new Map([[k2, v2]]);
      }
    }
    return createNode.createNode(v2, undefined, {
      aliasDuplicateObjects: false,
      keepUndefined: false,
      onAnchor: () => {
        throw new Error("This should not happen, please report a bug.");
      },
      schema,
      sourceObjects: new Map
    });
  }
  var isEmptyPath = (path2) => path2 == null || typeof path2 === "object" && !!path2[Symbol.iterator]().next().done;

  class Collection extends Node.NodeBase {
    constructor(type, schema) {
      super(type);
      Object.defineProperty(this, "schema", {
        value: schema,
        configurable: true,
        enumerable: false,
        writable: true
      });
    }
    clone(schema) {
      const copy = Object.create(Object.getPrototypeOf(this), Object.getOwnPropertyDescriptors(this));
      if (schema)
        copy.schema = schema;
      copy.items = copy.items.map((it) => identity.isNode(it) || identity.isPair(it) ? it.clone(schema) : it);
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    addIn(path2, value) {
      if (isEmptyPath(path2))
        this.add(value);
      else {
        const [key, ...rest] = path2;
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.addIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
    deleteIn(path2) {
      const [key, ...rest] = path2;
      if (rest.length === 0)
        return this.delete(key);
      const node = this.get(key, true);
      if (identity.isCollection(node))
        return node.deleteIn(rest);
      else
        throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
    }
    getIn(path2, keepScalar) {
      const [key, ...rest] = path2;
      const node = this.get(key, true);
      if (rest.length === 0)
        return !keepScalar && identity.isScalar(node) ? node.value : node;
      else
        return identity.isCollection(node) ? node.getIn(rest, keepScalar) : undefined;
    }
    hasAllNullValues(allowScalar) {
      return this.items.every((node) => {
        if (!identity.isPair(node))
          return false;
        const n = node.value;
        return n == null || allowScalar && identity.isScalar(n) && n.value == null && !n.commentBefore && !n.comment && !n.tag;
      });
    }
    hasIn(path2) {
      const [key, ...rest] = path2;
      if (rest.length === 0)
        return this.has(key);
      const node = this.get(key, true);
      return identity.isCollection(node) ? node.hasIn(rest) : false;
    }
    setIn(path2, value) {
      const [key, ...rest] = path2;
      if (rest.length === 0) {
        this.set(key, value);
      } else {
        const node = this.get(key, true);
        if (identity.isCollection(node))
          node.setIn(rest, value);
        else if (node === undefined && this.schema)
          this.set(key, collectionFromPath(this.schema, rest, value));
        else
          throw new Error(`Expected YAML collection at ${key}. Remaining path: ${rest}`);
      }
    }
  }
  exports.Collection = Collection;
  exports.collectionFromPath = collectionFromPath;
  exports.isEmptyPath = isEmptyPath;
});

// node_modules/yaml/dist/stringify/stringifyComment.js
var require_stringifyComment = __commonJS(function(exports) {
  var stringifyComment = (str) => str.replace(/^(?!$)(?: $)?/gm, "#");
  function indentComment(comment, indent) {
    if (/^\n+$/.test(comment))
      return comment.substring(1);
    return indent ? comment.replace(/^(?! *$)/gm, indent) : comment;
  }
  var lineComment = (str, indent, comment) => str.endsWith(`
`) ? indentComment(comment, indent) : comment.includes(`
`) ? `
` + indentComment(comment, indent) : (str.endsWith(" ") ? "" : " ") + comment;
  exports.indentComment = indentComment;
  exports.lineComment = lineComment;
  exports.stringifyComment = stringifyComment;
});

// node_modules/yaml/dist/stringify/foldFlowLines.js
var require_foldFlowLines = __commonJS(function(exports) {
  var FOLD_FLOW = "flow";
  var FOLD_BLOCK = "block";
  var FOLD_QUOTED = "quoted";
  function foldFlowLines(text, indent, mode = "flow", { indentAtStart, lineWidth = 80, minContentWidth = 20, onFold, onOverflow } = {}) {
    if (!lineWidth || lineWidth < 0)
      return text;
    if (lineWidth < minContentWidth)
      minContentWidth = 0;
    const endStep = Math.max(1 + minContentWidth, 1 + lineWidth - indent.length);
    if (text.length <= endStep)
      return text;
    const folds = [];
    const escapedFolds = {};
    let end = lineWidth - indent.length;
    if (typeof indentAtStart === "number") {
      if (indentAtStart > lineWidth - Math.max(2, minContentWidth))
        folds.push(0);
      else
        end = lineWidth - indentAtStart;
    }
    let split = undefined;
    let prev = undefined;
    let overflow = false;
    let i = -1;
    let escStart = -1;
    let escEnd = -1;
    if (mode === FOLD_BLOCK) {
      i = consumeMoreIndentedLines(text, i, indent.length);
      if (i !== -1)
        end = i + endStep;
    }
    for (let ch;ch = text[i += 1]; ) {
      if (mode === FOLD_QUOTED && ch === "\\") {
        escStart = i;
        switch (text[i + 1]) {
          case "x":
            i += 3;
            break;
          case "u":
            i += 5;
            break;
          case "U":
            i += 9;
            break;
          default:
            i += 1;
        }
        escEnd = i;
      }
      if (ch === `
`) {
        if (mode === FOLD_BLOCK)
          i = consumeMoreIndentedLines(text, i, indent.length);
        end = i + indent.length + endStep;
        split = undefined;
      } else {
        if (ch === " " && prev && prev !== " " && prev !== `
` && prev !== "\t") {
          const next = text[i + 1];
          if (next && next !== " " && next !== `
` && next !== "\t")
            split = i;
        }
        if (i >= end) {
          if (split) {
            folds.push(split);
            end = split + endStep;
            split = undefined;
          } else if (mode === FOLD_QUOTED) {
            while (prev === " " || prev === "\t") {
              prev = ch;
              ch = text[i += 1];
              overflow = true;
            }
            const j3 = i > escEnd + 1 ? i - 2 : escStart - 1;
            if (escapedFolds[j3])
              return text;
            folds.push(j3);
            escapedFolds[j3] = true;
            end = j3 + endStep;
            split = undefined;
          } else {
            overflow = true;
          }
        }
      }
      prev = ch;
    }
    if (overflow && onOverflow)
      onOverflow();
    if (folds.length === 0)
      return text;
    if (onFold)
      onFold();
    let res = text.slice(0, folds[0]);
    for (let i2 = 0;i2 < folds.length; ++i2) {
      const fold = folds[i2];
      const end2 = folds[i2 + 1] || text.length;
      if (fold === 0)
        res = `
${indent}${text.slice(0, end2)}`;
      else {
        if (mode === FOLD_QUOTED && escapedFolds[fold])
          res += `${text[fold]}\\`;
        res += `
${indent}${text.slice(fold + 1, end2)}`;
      }
    }
    return res;
  }
  function consumeMoreIndentedLines(text, i, indent) {
    let end = i;
    let start = i + 1;
    let ch = text[start];
    while (ch === " " || ch === "\t") {
      if (i < start + indent) {
        ch = text[++i];
      } else {
        do {
          ch = text[++i];
        } while (ch && ch !== `
`);
        end = i;
        start = i + 1;
        ch = text[start];
      }
    }
    return end;
  }
  exports.FOLD_BLOCK = FOLD_BLOCK;
  exports.FOLD_FLOW = FOLD_FLOW;
  exports.FOLD_QUOTED = FOLD_QUOTED;
  exports.foldFlowLines = foldFlowLines;
});

// node_modules/yaml/dist/stringify/stringifyString.js
var require_stringifyString = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var foldFlowLines = require_foldFlowLines();
  var getFoldOptions = (ctx, isBlock) => ({
    indentAtStart: isBlock ? ctx.indent.length : ctx.indentAtStart,
    lineWidth: ctx.options.lineWidth,
    minContentWidth: ctx.options.minContentWidth
  });
  var containsDocumentMarker = (str) => /^(%|---|\.\.\.)/m.test(str);
  function lineLengthOverLimit(str, lineWidth, indentLength) {
    if (!lineWidth || lineWidth < 0)
      return false;
    const limit = lineWidth - indentLength;
    const strLen = str.length;
    if (strLen <= limit)
      return false;
    for (let i = 0, start = 0;i < strLen; ++i) {
      if (str[i] === `
`) {
        if (i - start > limit)
          return true;
        start = i + 1;
        if (strLen - start <= limit)
          return false;
      }
    }
    return true;
  }
  function doubleQuotedString(value, ctx) {
    const json = JSON.stringify(value);
    if (ctx.options.doubleQuotedAsJSON)
      return json;
    const { implicitKey } = ctx;
    const minMultiLineLength = ctx.options.doubleQuotedMinMultiLineLength;
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    let str = "";
    let start = 0;
    for (let i = 0, ch = json[i];ch; ch = json[++i]) {
      if (ch === " " && json[i + 1] === "\\" && json[i + 2] === "n") {
        str += json.slice(start, i) + "\\ ";
        i += 1;
        start = i;
        ch = "\\";
      }
      if (ch === "\\")
        switch (json[i + 1]) {
          case "u":
            {
              str += json.slice(start, i);
              const code = json.substr(i + 2, 4);
              switch (code) {
                case "0000":
                  str += "\\0";
                  break;
                case "0007":
                  str += "\\a";
                  break;
                case "000b":
                  str += "\\v";
                  break;
                case "001b":
                  str += "\\e";
                  break;
                case "0085":
                  str += "\\N";
                  break;
                case "00a0":
                  str += "\\_";
                  break;
                case "2028":
                  str += "\\L";
                  break;
                case "2029":
                  str += "\\P";
                  break;
                default:
                  if (code.substr(0, 2) === "00")
                    str += "\\x" + code.substr(2);
                  else
                    str += json.substr(i, 6);
              }
              i += 5;
              start = i + 1;
            }
            break;
          case "n":
            if (implicitKey || json[i + 2] === '"' || json.length < minMultiLineLength) {
              i += 1;
            } else {
              str += json.slice(start, i) + `

`;
              while (json[i + 2] === "\\" && json[i + 3] === "n" && json[i + 4] !== '"') {
                str += `
`;
                i += 2;
              }
              str += indent;
              if (json[i + 2] === " ")
                str += "\\";
              i += 1;
              start = i + 1;
            }
            break;
          default:
            i += 1;
        }
    }
    str = start ? str + json.slice(start) : json;
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_QUOTED, getFoldOptions(ctx, false));
  }
  function singleQuotedString(value, ctx) {
    if (ctx.options.singleQuote === false || ctx.implicitKey && value.includes(`
`) || /[ \t]\n|\n[ \t]/.test(value))
      return doubleQuotedString(value, ctx);
    const indent = ctx.indent || (containsDocumentMarker(value) ? "  " : "");
    const res = "'" + value.replace(/'/g, "''").replace(/\n+/g, `$&
${indent}`) + "'";
    return ctx.implicitKey ? res : foldFlowLines.foldFlowLines(res, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function quotedString(value, ctx) {
    const { singleQuote } = ctx.options;
    let qs2;
    if (singleQuote === false)
      qs2 = doubleQuotedString;
    else {
      const hasDouble = value.includes('"');
      const hasSingle = value.includes("'");
      if (hasDouble && !hasSingle)
        qs2 = singleQuotedString;
      else if (hasSingle && !hasDouble)
        qs2 = doubleQuotedString;
      else
        qs2 = singleQuote ? singleQuotedString : doubleQuotedString;
    }
    return qs2(value, ctx);
  }
  var blockEndNewlines;
  try {
    blockEndNewlines = new RegExp(`(^|(?<!
))
+(?!
|$)`, "g");
  } catch {
    blockEndNewlines = /\n+(?!\n|$)/g;
  }
  function blockString({ comment, type, value }, ctx, onComment, onChompKeep) {
    const { blockQuote, commentString, lineWidth } = ctx.options;
    if (!blockQuote || /\n[\t ]+$/.test(value)) {
      return quotedString(value, ctx);
    }
    const indent = ctx.indent || (ctx.forceBlockIndent || containsDocumentMarker(value) ? "  " : "");
    const literal = blockQuote === "literal" ? true : blockQuote === "folded" || type === Scalar.Scalar.BLOCK_FOLDED ? false : type === Scalar.Scalar.BLOCK_LITERAL ? true : !lineLengthOverLimit(value, lineWidth, indent.length);
    if (!value)
      return literal ? `|
` : `>
`;
    let chomp;
    let endStart;
    for (endStart = value.length;endStart > 0; --endStart) {
      const ch = value[endStart - 1];
      if (ch !== `
` && ch !== "\t" && ch !== " ")
        break;
    }
    let end = value.substring(endStart);
    const endNlPos = end.indexOf(`
`);
    if (endNlPos === -1) {
      chomp = "-";
    } else if (value === end || endNlPos !== end.length - 1) {
      chomp = "+";
      if (onChompKeep)
        onChompKeep();
    } else {
      chomp = "";
    }
    if (end) {
      value = value.slice(0, -end.length);
      if (end[end.length - 1] === `
`)
        end = end.slice(0, -1);
      end = end.replace(blockEndNewlines, `$&${indent}`);
    }
    let startWithSpace = false;
    let startEnd;
    let startNlPos = -1;
    for (startEnd = 0;startEnd < value.length; ++startEnd) {
      const ch = value[startEnd];
      if (ch === " ")
        startWithSpace = true;
      else if (ch === `
`)
        startNlPos = startEnd;
      else
        break;
    }
    let start = value.substring(0, startNlPos < startEnd ? startNlPos + 1 : startEnd);
    if (start) {
      value = value.substring(start.length);
      start = start.replace(/\n+/g, `$&${indent}`);
    }
    const indentSize = indent ? "2" : "1";
    let header = (startWithSpace ? indentSize : "") + chomp;
    if (comment) {
      header += " " + commentString(comment.replace(/ ?[\r\n]+/g, " "));
      if (onComment)
        onComment();
    }
    if (!literal) {
      const foldedValue = value.replace(/\n+/g, `
$&`).replace(/(?:^|\n)([\t ].*)(?:([\n\t ]*)\n(?![\n\t ]))?/g, "$1$2").replace(/\n+/g, `$&${indent}`);
      let literalFallback = false;
      const foldOptions = getFoldOptions(ctx, true);
      if (blockQuote !== "folded" && type !== Scalar.Scalar.BLOCK_FOLDED) {
        foldOptions.onOverflow = () => {
          literalFallback = true;
        };
      }
      const body = foldFlowLines.foldFlowLines(`${start}${foldedValue}${end}`, indent, foldFlowLines.FOLD_BLOCK, foldOptions);
      if (!literalFallback)
        return `>${header}
${indent}${body}`;
    }
    value = value.replace(/\n+/g, `$&${indent}`);
    return `|${header}
${indent}${start}${value}${end}`;
  }
  function plainString(item, ctx, onComment, onChompKeep) {
    const { type, value } = item;
    const { actualString, implicitKey, indent, indentStep, inFlow } = ctx;
    if (implicitKey && value.includes(`
`) || inFlow && /[[\]{},]/.test(value)) {
      return quotedString(value, ctx);
    }
    if (/^[\n\t ,[\]{}#&*!|>'"%@`]|^[?-]$|^[?-][ \t]|[\n:][ \t]|[ \t]\n|[\n\t ]#|[\n\t :]$/.test(value)) {
      return implicitKey || inFlow || !value.includes(`
`) ? quotedString(value, ctx) : blockString(item, ctx, onComment, onChompKeep);
    }
    if (!implicitKey && !inFlow && type !== Scalar.Scalar.PLAIN && value.includes(`
`)) {
      return blockString(item, ctx, onComment, onChompKeep);
    }
    if (containsDocumentMarker(value)) {
      if (indent === "") {
        ctx.forceBlockIndent = true;
        return blockString(item, ctx, onComment, onChompKeep);
      } else if (implicitKey && indent === indentStep) {
        return quotedString(value, ctx);
      }
    }
    const str = value.replace(/\n+/g, `$&
${indent}`);
    if (actualString) {
      const test = (tag) => tag.default && tag.tag !== "tag:yaml.org,2002:str" && tag.test?.test(str);
      const { compat, tags } = ctx.doc.schema;
      if (tags.some(test) || compat?.some(test))
        return quotedString(value, ctx);
    }
    return implicitKey ? str : foldFlowLines.foldFlowLines(str, indent, foldFlowLines.FOLD_FLOW, getFoldOptions(ctx, false));
  }
  function stringifyString(item, ctx, onComment, onChompKeep) {
    const { implicitKey, inFlow } = ctx;
    const ss2 = typeof item.value === "string" ? item : Object.assign({}, item, { value: String(item.value) });
    let { type } = item;
    if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
      if (/[\x00-\x08\x0b-\x1f\x7f-\x9f\u{D800}-\u{DFFF}]/u.test(ss2.value))
        type = Scalar.Scalar.QUOTE_DOUBLE;
    }
    const _stringify = (_type) => {
      switch (_type) {
        case Scalar.Scalar.BLOCK_FOLDED:
        case Scalar.Scalar.BLOCK_LITERAL:
          return implicitKey || inFlow ? quotedString(ss2.value, ctx) : blockString(ss2, ctx, onComment, onChompKeep);
        case Scalar.Scalar.QUOTE_DOUBLE:
          return doubleQuotedString(ss2.value, ctx);
        case Scalar.Scalar.QUOTE_SINGLE:
          return singleQuotedString(ss2.value, ctx);
        case Scalar.Scalar.PLAIN:
          return plainString(ss2, ctx, onComment, onChompKeep);
        default:
          return null;
      }
    };
    let res = _stringify(type);
    if (res === null) {
      const { defaultKeyType, defaultStringType } = ctx.options;
      const t2 = implicitKey && defaultKeyType || defaultStringType;
      res = _stringify(t2);
      if (res === null)
        throw new Error(`Unsupported default string type ${t2}`);
    }
    return res;
  }
  exports.stringifyString = stringifyString;
});

// node_modules/yaml/dist/stringify/stringify.js
var require_stringify = __commonJS(function(exports) {
  var anchors = require_anchors();
  var identity = require_identity();
  var stringifyComment = require_stringifyComment();
  var stringifyString = require_stringifyString();
  function createStringifyContext(doc, options) {
    const opt = Object.assign({
      blockQuote: true,
      commentString: stringifyComment.stringifyComment,
      defaultKeyType: null,
      defaultStringType: "PLAIN",
      directives: null,
      doubleQuotedAsJSON: false,
      doubleQuotedMinMultiLineLength: 40,
      falseStr: "false",
      flowCollectionPadding: true,
      indentSeq: true,
      lineWidth: 80,
      minContentWidth: 20,
      nullStr: "null",
      simpleKeys: false,
      singleQuote: null,
      trailingComma: false,
      trueStr: "true",
      verifyAliasOrder: true
    }, doc.schema.toStringOptions, options);
    let inFlow;
    switch (opt.collectionStyle) {
      case "block":
        inFlow = false;
        break;
      case "flow":
        inFlow = true;
        break;
      default:
        inFlow = null;
    }
    return {
      anchors: new Set,
      doc,
      flowCollectionPadding: opt.flowCollectionPadding ? " " : "",
      indent: "",
      indentStep: typeof opt.indent === "number" ? " ".repeat(opt.indent) : "  ",
      inFlow,
      options: opt
    };
  }
  function getTagObject(tags, item) {
    if (item.tag) {
      const match = tags.filter((t2) => t2.tag === item.tag);
      if (match.length > 0)
        return match.find((t2) => t2.format === item.format) ?? match[0];
    }
    let tagObj = undefined;
    let obj;
    if (identity.isScalar(item)) {
      obj = item.value;
      let match = tags.filter((t2) => t2.identify?.(obj));
      if (match.length > 1) {
        const testMatch = match.filter((t2) => t2.test);
        if (testMatch.length > 0)
          match = testMatch;
      }
      tagObj = match.find((t2) => t2.format === item.format) ?? match.find((t2) => !t2.format);
    } else {
      obj = item;
      tagObj = tags.find((t2) => t2.nodeClass && obj instanceof t2.nodeClass);
    }
    if (!tagObj) {
      const name = obj?.constructor?.name ?? (obj === null ? "null" : typeof obj);
      throw new Error(`Tag not resolved for ${name} value`);
    }
    return tagObj;
  }
  function stringifyProps(node, tagObj, { anchors: anchors$1, doc }) {
    if (!doc.directives)
      return "";
    const props = [];
    const anchor = (identity.isScalar(node) || identity.isCollection(node)) && node.anchor;
    if (anchor && anchors.anchorIsValid(anchor)) {
      anchors$1.add(anchor);
      props.push(`&${anchor}`);
    }
    const tag = node.tag ?? (tagObj.default ? null : tagObj.tag);
    if (tag)
      props.push(doc.directives.tagString(tag));
    return props.join(" ");
  }
  function stringify(item, ctx, onComment, onChompKeep) {
    if (identity.isPair(item))
      return item.toString(ctx, onComment, onChompKeep);
    if (identity.isAlias(item)) {
      if (ctx.doc.directives)
        return item.toString(ctx);
      if (ctx.resolvedAliases?.has(item)) {
        throw new TypeError(`Cannot stringify circular structure without alias nodes`);
      } else {
        if (ctx.resolvedAliases)
          ctx.resolvedAliases.add(item);
        else
          ctx.resolvedAliases = new Set([item]);
        item = item.resolve(ctx.doc);
      }
    }
    let tagObj = undefined;
    const node = identity.isNode(item) ? item : ctx.doc.createNode(item, { onTagObj: (o2) => tagObj = o2 });
    tagObj ?? (tagObj = getTagObject(ctx.doc.schema.tags, node));
    const props = stringifyProps(node, tagObj, ctx);
    if (props.length > 0)
      ctx.indentAtStart = (ctx.indentAtStart ?? 0) + props.length + 1;
    const str = typeof tagObj.stringify === "function" ? tagObj.stringify(node, ctx, onComment, onChompKeep) : identity.isScalar(node) ? stringifyString.stringifyString(node, ctx, onComment, onChompKeep) : node.toString(ctx, onComment, onChompKeep);
    if (!props)
      return str;
    return identity.isScalar(node) || str[0] === "{" || str[0] === "[" ? `${props} ${str}` : `${props}
${ctx.indent}${str}`;
  }
  exports.createStringifyContext = createStringifyContext;
  exports.stringify = stringify;
});

// node_modules/yaml/dist/stringify/stringifyPair.js
var require_stringifyPair = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyPair({ key, value }, ctx, onComment, onChompKeep) {
    const { allNullValues, doc, indent, indentStep, options: { commentString, indentSeq, simpleKeys } } = ctx;
    let keyComment = identity.isNode(key) && key.comment || null;
    if (simpleKeys) {
      if (keyComment) {
        throw new Error("With simple keys, key nodes cannot have comments");
      }
      if (identity.isCollection(key) || !identity.isNode(key) && typeof key === "object") {
        const msg = "With simple keys, collection cannot be used as a key value";
        throw new Error(msg);
      }
    }
    let explicitKey = !simpleKeys && (!key || keyComment && value == null && !ctx.inFlow || identity.isCollection(key) || (identity.isScalar(key) ? key.type === Scalar.Scalar.BLOCK_FOLDED || key.type === Scalar.Scalar.BLOCK_LITERAL : typeof key === "object"));
    ctx = Object.assign({}, ctx, {
      allNullValues: false,
      implicitKey: !explicitKey && (simpleKeys || !allNullValues),
      indent: indent + indentStep
    });
    let keyCommentDone = false;
    let chompKeep = false;
    let str = stringify.stringify(key, ctx, () => keyCommentDone = true, () => chompKeep = true);
    if (!explicitKey && !ctx.inFlow && str.length > 1024) {
      if (simpleKeys)
        throw new Error("With simple keys, single line scalar must not span more than 1024 characters");
      explicitKey = true;
    }
    if (ctx.inFlow) {
      if (allNullValues || value == null) {
        if (keyCommentDone && onComment)
          onComment();
        return str === "" ? "?" : explicitKey ? `? ${str}` : str;
      }
    } else if (allNullValues && !simpleKeys || value == null && explicitKey) {
      str = `? ${str}`;
      if (keyComment && !keyCommentDone) {
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      } else if (chompKeep && onChompKeep)
        onChompKeep();
      return str;
    }
    if (keyCommentDone)
      keyComment = null;
    if (explicitKey) {
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
      str = `? ${str}
${indent}:`;
    } else {
      str = `${str}:`;
      if (keyComment)
        str += stringifyComment.lineComment(str, ctx.indent, commentString(keyComment));
    }
    let vsb, vcb, valueComment;
    if (identity.isNode(value)) {
      vsb = !!value.spaceBefore;
      vcb = value.commentBefore;
      valueComment = value.comment;
    } else {
      vsb = false;
      vcb = null;
      valueComment = null;
      if (value && typeof value === "object")
        value = doc.createNode(value);
    }
    ctx.implicitKey = false;
    if (!explicitKey && !keyComment && identity.isScalar(value))
      ctx.indentAtStart = str.length + 1;
    chompKeep = false;
    if (!indentSeq && indentStep.length >= 2 && !ctx.inFlow && !explicitKey && identity.isSeq(value) && !value.flow && !value.tag && !value.anchor) {
      ctx.indent = ctx.indent.substring(2);
    }
    let valueCommentDone = false;
    const valueStr = stringify.stringify(value, ctx, () => valueCommentDone = true, () => chompKeep = true);
    let ws2 = " ";
    if (keyComment || vsb || vcb) {
      ws2 = vsb ? `
` : "";
      if (vcb) {
        const cs2 = commentString(vcb);
        ws2 += `
${stringifyComment.indentComment(cs2, ctx.indent)}`;
      }
      if (valueStr === "" && !ctx.inFlow) {
        if (ws2 === `
` && valueComment)
          ws2 = `

`;
      } else {
        ws2 += `
${ctx.indent}`;
      }
    } else if (!explicitKey && identity.isCollection(value)) {
      const vs0 = valueStr[0];
      const nl0 = valueStr.indexOf(`
`);
      const hasNewline = nl0 !== -1;
      const flow = ctx.inFlow ?? value.flow ?? value.items.length === 0;
      if (hasNewline || !flow) {
        let hasPropsLine = false;
        if (hasNewline && (vs0 === "&" || vs0 === "!")) {
          let sp0 = valueStr.indexOf(" ");
          if (vs0 === "&" && sp0 !== -1 && sp0 < nl0 && valueStr[sp0 + 1] === "!") {
            sp0 = valueStr.indexOf(" ", sp0 + 1);
          }
          if (sp0 === -1 || nl0 < sp0)
            hasPropsLine = true;
        }
        if (!hasPropsLine)
          ws2 = `
${ctx.indent}`;
      }
    } else if (valueStr === "" || valueStr[0] === `
`) {
      ws2 = "";
    }
    str += ws2 + valueStr;
    if (ctx.inFlow) {
      if (valueCommentDone && onComment)
        onComment();
    } else if (valueComment && !valueCommentDone) {
      str += stringifyComment.lineComment(str, ctx.indent, commentString(valueComment));
    } else if (chompKeep && onChompKeep) {
      onChompKeep();
    }
    return str;
  }
  exports.stringifyPair = stringifyPair;
});

// node_modules/yaml/dist/log.js
var require_log = __commonJS(function(exports) {
  var node_process = __require("process");
  function debug(logLevel, ...messages) {
    if (logLevel === "debug")
      console.log(...messages);
  }
  function warn(logLevel, warning) {
    if (logLevel === "debug" || logLevel === "warn") {
      if (typeof node_process.emitWarning === "function")
        node_process.emitWarning(warning);
      else
        console.warn(warning);
    }
  }
  exports.debug = debug;
  exports.warn = warn;
});

// node_modules/yaml/dist/schema/yaml-1.1/merge.js
var require_merge = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var MERGE_KEY = "<<";
  var merge = {
    identify: (value) => value === MERGE_KEY || typeof value === "symbol" && value.description === MERGE_KEY,
    default: "key",
    tag: "tag:yaml.org,2002:merge",
    test: /^<<$/,
    resolve: () => Object.assign(new Scalar.Scalar(Symbol(MERGE_KEY)), {
      addToJSMap: addMergeToJSMap
    }),
    stringify: () => MERGE_KEY
  };
  var isMergeKey = (ctx, key) => (merge.identify(key) || identity.isScalar(key) && (!key.type || key.type === Scalar.Scalar.PLAIN) && merge.identify(key.value)) && ctx?.doc.schema.tags.some((tag) => tag.tag === merge.tag && tag.default);
  function addMergeToJSMap(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (identity.isSeq(source))
      for (const it of source.items)
        mergeValue(ctx, map, it);
    else if (Array.isArray(source))
      for (const it of source)
        mergeValue(ctx, map, it);
    else
      mergeValue(ctx, map, source);
  }
  function mergeValue(ctx, map, value) {
    const source = resolveAliasValue(ctx, value);
    if (!identity.isMap(source))
      throw new Error("Merge sources must be maps or map aliases");
    const srcMap = source.toJSON(null, ctx, Map);
    for (const [key, value2] of srcMap) {
      if (map instanceof Map) {
        if (!map.has(key))
          map.set(key, value2);
      } else if (map instanceof Set) {
        map.add(key);
      } else if (!Object.prototype.hasOwnProperty.call(map, key)) {
        Object.defineProperty(map, key, {
          value: value2,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }
    }
    return map;
  }
  function resolveAliasValue(ctx, value) {
    return ctx && identity.isAlias(value) ? value.resolve(ctx.doc, ctx) : value;
  }
  exports.addMergeToJSMap = addMergeToJSMap;
  exports.isMergeKey = isMergeKey;
  exports.merge = merge;
});

// node_modules/yaml/dist/nodes/addPairToJSMap.js
var require_addPairToJSMap = __commonJS(function(exports) {
  var log = require_log();
  var merge = require_merge();
  var stringify = require_stringify();
  var identity = require_identity();
  var toJS = require_toJS();
  function addPairToJSMap(ctx, map, { key, value }) {
    if (identity.isNode(key) && key.addToJSMap)
      key.addToJSMap(ctx, map, value);
    else if (merge.isMergeKey(ctx, key))
      merge.addMergeToJSMap(ctx, map, value);
    else {
      const jsKey = toJS.toJS(key, "", ctx);
      if (map instanceof Map) {
        map.set(jsKey, toJS.toJS(value, jsKey, ctx));
      } else if (map instanceof Set) {
        map.add(jsKey);
      } else {
        const stringKey = stringifyKey(key, jsKey, ctx);
        const jsValue = toJS.toJS(value, stringKey, ctx);
        if (stringKey in map)
          Object.defineProperty(map, stringKey, {
            value: jsValue,
            writable: true,
            enumerable: true,
            configurable: true
          });
        else
          map[stringKey] = jsValue;
      }
    }
    return map;
  }
  function stringifyKey(key, jsKey, ctx) {
    if (jsKey === null)
      return "";
    if (typeof jsKey !== "object")
      return String(jsKey);
    if (identity.isNode(key) && ctx?.doc) {
      const strCtx = stringify.createStringifyContext(ctx.doc, {});
      strCtx.anchors = new Set;
      for (const node of ctx.anchors.keys())
        strCtx.anchors.add(node.anchor);
      strCtx.inFlow = true;
      strCtx.inStringifyKey = true;
      const strKey = key.toString(strCtx);
      if (!ctx.mapKeyWarned) {
        let jsonStr = JSON.stringify(strKey);
        if (jsonStr.length > 40)
          jsonStr = jsonStr.substring(0, 36) + '..."';
        log.warn(ctx.doc.options.logLevel, `Keys with collection values will be stringified due to JS Object restrictions: ${jsonStr}. Set mapAsMap: true to use object keys.`);
        ctx.mapKeyWarned = true;
      }
      return strKey;
    }
    return JSON.stringify(jsKey);
  }
  exports.addPairToJSMap = addPairToJSMap;
});

// node_modules/yaml/dist/nodes/Pair.js
var require_Pair = __commonJS(function(exports) {
  var createNode = require_createNode();
  var stringifyPair = require_stringifyPair();
  var addPairToJSMap = require_addPairToJSMap();
  var identity = require_identity();
  function createPair(key, value, ctx) {
    const k2 = createNode.createNode(key, undefined, ctx);
    const v2 = createNode.createNode(value, undefined, ctx);
    return new Pair(k2, v2);
  }

  class Pair {
    constructor(key, value = null) {
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.PAIR });
      this.key = key;
      this.value = value;
    }
    clone(schema) {
      let { key, value } = this;
      if (identity.isNode(key))
        key = key.clone(schema);
      if (identity.isNode(value))
        value = value.clone(schema);
      return new Pair(key, value);
    }
    toJSON(_3, ctx) {
      const pair = ctx?.mapAsMap ? new Map : {};
      return addPairToJSMap.addPairToJSMap(ctx, pair, this);
    }
    toString(ctx, onComment, onChompKeep) {
      return ctx?.doc ? stringifyPair.stringifyPair(this, ctx, onComment, onChompKeep) : JSON.stringify(this);
    }
  }
  exports.Pair = Pair;
  exports.createPair = createPair;
});

// node_modules/yaml/dist/stringify/stringifyCollection.js
var require_stringifyCollection = __commonJS(function(exports) {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyCollection(collection, ctx, options) {
    const flow = ctx.inFlow ?? collection.flow;
    const stringify2 = flow ? stringifyFlowCollection : stringifyBlockCollection;
    return stringify2(collection, ctx, options);
  }
  function stringifyBlockCollection({ comment, items }, ctx, { blockItemPrefix, flowChars, itemIndent, onChompKeep, onComment }) {
    const { indent, options: { commentString } } = ctx;
    const itemCtx = Object.assign({}, ctx, { indent: itemIndent, type: null });
    let chompKeep = false;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment2 = null;
      if (identity.isNode(item)) {
        if (!chompKeep && item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, chompKeep);
        if (item.comment)
          comment2 = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (!chompKeep && ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, chompKeep);
        }
      }
      chompKeep = false;
      let str2 = stringify.stringify(item, itemCtx, () => comment2 = null, () => chompKeep = true);
      if (comment2)
        str2 += stringifyComment.lineComment(str2, itemIndent, commentString(comment2));
      if (chompKeep && comment2)
        chompKeep = false;
      lines.push(blockItemPrefix + str2);
    }
    let str;
    if (lines.length === 0) {
      str = flowChars.start + flowChars.end;
    } else {
      str = lines[0];
      for (let i = 1;i < lines.length; ++i) {
        const line = lines[i];
        str += line ? `
${indent}${line}` : `
`;
      }
    }
    if (comment) {
      str += `
` + stringifyComment.indentComment(commentString(comment), indent);
      if (onComment)
        onComment();
    } else if (chompKeep && onChompKeep)
      onChompKeep();
    return str;
  }
  function stringifyFlowCollection({ items }, ctx, { flowChars, itemIndent }) {
    const { indent, indentStep, flowCollectionPadding: fcPadding, options: { commentString } } = ctx;
    itemIndent += indentStep;
    const itemCtx = Object.assign({}, ctx, {
      indent: itemIndent,
      inFlow: true,
      type: null
    });
    let reqNewline = false;
    let linesAtValue = 0;
    const lines = [];
    for (let i = 0;i < items.length; ++i) {
      const item = items[i];
      let comment = null;
      if (identity.isNode(item)) {
        if (item.spaceBefore)
          lines.push("");
        addCommentBefore(ctx, lines, item.commentBefore, false);
        if (item.comment)
          comment = item.comment;
      } else if (identity.isPair(item)) {
        const ik = identity.isNode(item.key) ? item.key : null;
        if (ik) {
          if (ik.spaceBefore)
            lines.push("");
          addCommentBefore(ctx, lines, ik.commentBefore, false);
          if (ik.comment)
            reqNewline = true;
        }
        const iv = identity.isNode(item.value) ? item.value : null;
        if (iv) {
          if (iv.comment)
            comment = iv.comment;
          if (iv.commentBefore)
            reqNewline = true;
        } else if (item.value == null && ik?.comment) {
          comment = ik.comment;
        }
      }
      if (comment)
        reqNewline = true;
      let str = stringify.stringify(item, itemCtx, () => comment = null);
      reqNewline || (reqNewline = lines.length > linesAtValue || str.includes(`
`));
      if (i < items.length - 1) {
        str += ",";
      } else if (ctx.options.trailingComma) {
        if (ctx.options.lineWidth > 0) {
          reqNewline || (reqNewline = lines.reduce((sum, line) => sum + line.length + 2, 2) + (str.length + 2) > ctx.options.lineWidth);
        }
        if (reqNewline) {
          str += ",";
        }
      }
      if (comment)
        str += stringifyComment.lineComment(str, itemIndent, commentString(comment));
      lines.push(str);
      linesAtValue = lines.length;
    }
    const { start, end } = flowChars;
    if (lines.length === 0) {
      return start + end;
    } else {
      if (!reqNewline) {
        const len = lines.reduce((sum, line) => sum + line.length + 2, 2);
        reqNewline = ctx.options.lineWidth > 0 && len > ctx.options.lineWidth;
      }
      if (reqNewline) {
        let str = start;
        for (const line of lines)
          str += line ? `
${indentStep}${indent}${line}` : `
`;
        return `${str}
${indent}${end}`;
      } else {
        return `${start}${fcPadding}${lines.join(" ")}${fcPadding}${end}`;
      }
    }
  }
  function addCommentBefore({ indent, options: { commentString } }, lines, comment, chompKeep) {
    if (comment && chompKeep)
      comment = comment.replace(/^\n+/, "");
    if (comment) {
      const ic = stringifyComment.indentComment(commentString(comment), indent);
      lines.push(ic.trimStart());
    }
  }
  exports.stringifyCollection = stringifyCollection;
});

// node_modules/yaml/dist/nodes/YAMLMap.js
var require_YAMLMap = __commonJS(function(exports) {
  var stringifyCollection = require_stringifyCollection();
  var addPairToJSMap = require_addPairToJSMap();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  function findPair(items, key) {
    const k2 = identity.isScalar(key) ? key.value : key;
    for (const it of items) {
      if (identity.isPair(it)) {
        if (it.key === key || it.key === k2)
          return it;
        if (identity.isScalar(it.key) && it.key.value === k2)
          return it;
      }
    }
    return;
  }

  class YAMLMap extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:map";
    }
    constructor(schema) {
      super(identity.MAP, schema);
      this.items = [];
    }
    static from(schema, obj, ctx) {
      const { keepUndefined, replacer } = ctx;
      const map = new this(schema);
      const add = (key, value) => {
        if (typeof replacer === "function")
          value = replacer.call(obj, key, value);
        else if (Array.isArray(replacer) && !replacer.includes(key))
          return;
        if (value !== undefined || keepUndefined)
          map.items.push(Pair.createPair(key, value, ctx));
      };
      if (obj instanceof Map) {
        for (const [key, value] of obj)
          add(key, value);
      } else if (obj && typeof obj === "object") {
        for (const key of Object.keys(obj))
          add(key, obj[key]);
      }
      if (typeof schema.sortMapEntries === "function") {
        map.items.sort(schema.sortMapEntries);
      }
      return map;
    }
    add(pair, overwrite) {
      let _pair;
      if (identity.isPair(pair))
        _pair = pair;
      else if (!pair || typeof pair !== "object" || !("key" in pair)) {
        _pair = new Pair.Pair(pair, pair?.value);
      } else
        _pair = new Pair.Pair(pair.key, pair.value);
      const prev = findPair(this.items, _pair.key);
      const sortEntries = this.schema?.sortMapEntries;
      if (prev) {
        if (!overwrite)
          throw new Error(`Key ${_pair.key} already set`);
        if (identity.isScalar(prev.value) && Scalar.isScalarValue(_pair.value))
          prev.value.value = _pair.value;
        else
          prev.value = _pair.value;
      } else if (sortEntries) {
        const i = this.items.findIndex((item) => sortEntries(_pair, item) < 0);
        if (i === -1)
          this.items.push(_pair);
        else
          this.items.splice(i, 0, _pair);
      } else {
        this.items.push(_pair);
      }
    }
    delete(key) {
      const it = findPair(this.items, key);
      if (!it)
        return false;
      const del = this.items.splice(this.items.indexOf(it), 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const it = findPair(this.items, key);
      const node = it?.value;
      return (!keepScalar && identity.isScalar(node) ? node.value : node) ?? undefined;
    }
    has(key) {
      return !!findPair(this.items, key);
    }
    set(key, value) {
      this.add(new Pair.Pair(key, value), true);
    }
    toJSON(_3, ctx, Type) {
      const map = Type ? new Type : ctx?.mapAsMap ? new Map : {};
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const item of this.items)
        addPairToJSMap.addPairToJSMap(ctx, map, item);
      return map;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      for (const item of this.items) {
        if (!identity.isPair(item))
          throw new Error(`Map items must all be pairs; found ${JSON.stringify(item)} instead`);
      }
      if (!ctx.allNullValues && this.hasAllNullValues(false))
        ctx = Object.assign({}, ctx, { allNullValues: true });
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "",
        flowChars: { start: "{", end: "}" },
        itemIndent: ctx.indent || "",
        onChompKeep,
        onComment
      });
    }
  }
  exports.YAMLMap = YAMLMap;
  exports.findPair = findPair;
});

// node_modules/yaml/dist/schema/common/map.js
var require_map = __commonJS(function(exports) {
  var identity = require_identity();
  var YAMLMap = require_YAMLMap();
  var map = {
    collection: "map",
    default: true,
    nodeClass: YAMLMap.YAMLMap,
    tag: "tag:yaml.org,2002:map",
    resolve(map2, onError) {
      if (!identity.isMap(map2))
        onError("Expected a mapping for this tag");
      return map2;
    },
    createNode: (schema, obj, ctx) => YAMLMap.YAMLMap.from(schema, obj, ctx)
  };
  exports.map = map;
});

// node_modules/yaml/dist/nodes/YAMLSeq.js
var require_YAMLSeq = __commonJS(function(exports) {
  var createNode = require_createNode();
  var stringifyCollection = require_stringifyCollection();
  var Collection = require_Collection();
  var identity = require_identity();
  var Scalar = require_Scalar();
  var toJS = require_toJS();

  class YAMLSeq extends Collection.Collection {
    static get tagName() {
      return "tag:yaml.org,2002:seq";
    }
    constructor(schema) {
      super(identity.SEQ, schema);
      this.items = [];
    }
    add(value) {
      this.items.push(value);
    }
    delete(key) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return false;
      const del = this.items.splice(idx, 1);
      return del.length > 0;
    }
    get(key, keepScalar) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        return;
      const it = this.items[idx];
      return !keepScalar && identity.isScalar(it) ? it.value : it;
    }
    has(key) {
      const idx = asItemIndex(key);
      return typeof idx === "number" && idx < this.items.length;
    }
    set(key, value) {
      const idx = asItemIndex(key);
      if (typeof idx !== "number")
        throw new Error(`Expected a valid index, not ${key}.`);
      const prev = this.items[idx];
      if (identity.isScalar(prev) && Scalar.isScalarValue(value))
        prev.value = value;
      else
        this.items[idx] = value;
    }
    toJSON(_3, ctx) {
      const seq = [];
      if (ctx?.onCreate)
        ctx.onCreate(seq);
      let i = 0;
      for (const item of this.items)
        seq.push(toJS.toJS(item, String(i++), ctx));
      return seq;
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      return stringifyCollection.stringifyCollection(this, ctx, {
        blockItemPrefix: "- ",
        flowChars: { start: "[", end: "]" },
        itemIndent: (ctx.indent || "") + "  ",
        onChompKeep,
        onComment
      });
    }
    static from(schema, obj, ctx) {
      const { replacer } = ctx;
      const seq = new this(schema);
      if (obj && Symbol.iterator in Object(obj)) {
        let i = 0;
        for (let it of obj) {
          if (typeof replacer === "function") {
            const key = obj instanceof Set ? it : String(i++);
            it = replacer.call(obj, key, it);
          }
          seq.items.push(createNode.createNode(it, undefined, ctx));
        }
      }
      return seq;
    }
  }
  function asItemIndex(key) {
    let idx = identity.isScalar(key) ? key.value : key;
    if (idx && typeof idx === "string")
      idx = Number(idx);
    return typeof idx === "number" && Number.isInteger(idx) && idx >= 0 ? idx : null;
  }
  exports.YAMLSeq = YAMLSeq;
});

// node_modules/yaml/dist/schema/common/seq.js
var require_seq = __commonJS(function(exports) {
  var identity = require_identity();
  var YAMLSeq = require_YAMLSeq();
  var seq = {
    collection: "seq",
    default: true,
    nodeClass: YAMLSeq.YAMLSeq,
    tag: "tag:yaml.org,2002:seq",
    resolve(seq2, onError) {
      if (!identity.isSeq(seq2))
        onError("Expected a sequence for this tag");
      return seq2;
    },
    createNode: (schema, obj, ctx) => YAMLSeq.YAMLSeq.from(schema, obj, ctx)
  };
  exports.seq = seq;
});

// node_modules/yaml/dist/schema/common/string.js
var require_string = __commonJS(function(exports) {
  var stringifyString = require_stringifyString();
  var string = {
    identify: (value) => typeof value === "string",
    default: true,
    tag: "tag:yaml.org,2002:str",
    resolve: (str) => str,
    stringify(item, ctx, onComment, onChompKeep) {
      ctx = Object.assign({ actualString: true }, ctx);
      return stringifyString.stringifyString(item, ctx, onComment, onChompKeep);
    }
  };
  exports.string = string;
});

// node_modules/yaml/dist/schema/common/null.js
var require_null = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var nullTag = {
    identify: (value) => value == null,
    createNode: () => new Scalar.Scalar(null),
    default: true,
    tag: "tag:yaml.org,2002:null",
    test: /^(?:~|[Nn]ull|NULL)?$/,
    resolve: () => new Scalar.Scalar(null),
    stringify: ({ source }, ctx) => typeof source === "string" && nullTag.test.test(source) ? source : ctx.options.nullStr
  };
  exports.nullTag = nullTag;
});

// node_modules/yaml/dist/schema/core/bool.js
var require_bool = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var boolTag = {
    identify: (value) => typeof value === "boolean",
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:[Tt]rue|TRUE|[Ff]alse|FALSE)$/,
    resolve: (str) => new Scalar.Scalar(str[0] === "t" || str[0] === "T"),
    stringify({ source, value }, ctx) {
      if (source && boolTag.test.test(source)) {
        const sv = source[0] === "t" || source[0] === "T";
        if (value === sv)
          return source;
      }
      return value ? ctx.options.trueStr : ctx.options.falseStr;
    }
  };
  exports.boolTag = boolTag;
});

// node_modules/yaml/dist/stringify/stringifyNumber.js
var require_stringifyNumber = __commonJS(function(exports) {
  function stringifyNumber({ format, minFractionDigits, tag, value }) {
    if (typeof value === "bigint")
      return String(value);
    const num = typeof value === "number" ? value : Number(value);
    if (!isFinite(num))
      return isNaN(num) ? ".nan" : num < 0 ? "-.inf" : ".inf";
    let n = Object.is(value, -0) ? "-0" : JSON.stringify(value);
    if (!format && minFractionDigits && (!tag || tag === "tag:yaml.org,2002:float") && /^-?\d/.test(n) && !n.includes("e")) {
      let i = n.indexOf(".");
      if (i < 0) {
        i = n.length;
        n += ".";
      }
      let d2 = minFractionDigits - (n.length - i - 1);
      while (d2-- > 0)
        n += "0";
    }
    return n;
  }
  exports.stringifyNumber = stringifyNumber;
});

// node_modules/yaml/dist/schema/core/float.js
var require_float = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+(?:\.[0-9]*)?)[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:\.[0-9]+|[0-9]+\.[0-9]*)$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str));
      const dot = str.indexOf(".");
      if (dot !== -1 && str[str.length - 1] === "0")
        node.minFractionDigits = str.length - dot - 1;
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/core/int.js
var require_int = __commonJS(function(exports) {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  var intResolve = (str, offset, radix, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str.substring(offset), radix);
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value) && value >= 0)
      return prefix + value.toString(radix);
    return stringifyNumber.stringifyNumber(node);
  }
  var intOct = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^0o[0-7]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 8, opt),
    stringify: (node) => intStringify(node, 8, "0o")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: (value) => intIdentify(value) && value >= 0,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^0x[0-9a-fA-F]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/yaml/dist/schema/core/schema.js
var require_schema = __commonJS(function(exports) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.boolTag,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float
  ];
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/json/schema.js
var require_schema2 = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var map = require_map();
  var seq = require_seq();
  function intIdentify(value) {
    return typeof value === "bigint" || Number.isInteger(value);
  }
  var stringifyJSON = ({ value }) => JSON.stringify(value);
  var jsonScalars = [
    {
      identify: (value) => typeof value === "string",
      default: true,
      tag: "tag:yaml.org,2002:str",
      resolve: (str) => str,
      stringify: stringifyJSON
    },
    {
      identify: (value) => value == null,
      createNode: () => new Scalar.Scalar(null),
      default: true,
      tag: "tag:yaml.org,2002:null",
      test: /^null$/,
      resolve: () => null,
      stringify: stringifyJSON
    },
    {
      identify: (value) => typeof value === "boolean",
      default: true,
      tag: "tag:yaml.org,2002:bool",
      test: /^true$|^false$/,
      resolve: (str) => str === "true",
      stringify: stringifyJSON
    },
    {
      identify: intIdentify,
      default: true,
      tag: "tag:yaml.org,2002:int",
      test: /^-?(?:0|[1-9][0-9]*)$/,
      resolve: (str, _onError, { intAsBigInt }) => intAsBigInt ? BigInt(str) : parseInt(str, 10),
      stringify: ({ value }) => intIdentify(value) ? value.toString() : JSON.stringify(value)
    },
    {
      identify: (value) => typeof value === "number",
      default: true,
      tag: "tag:yaml.org,2002:float",
      test: /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]*)?(?:[eE][-+]?[0-9]+)?$/,
      resolve: (str) => parseFloat(str),
      stringify: stringifyJSON
    }
  ];
  var jsonError = {
    default: true,
    tag: "",
    test: /^/,
    resolve(str, onError) {
      onError(`Unresolved plain scalar ${JSON.stringify(str)}`);
      return str;
    }
  };
  var schema = [map.map, seq.seq].concat(jsonScalars, jsonError);
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/yaml-1.1/binary.js
var require_binary = __commonJS(function(exports) {
  var node_buffer = __require("buffer");
  var Scalar = require_Scalar();
  var stringifyString = require_stringifyString();
  var binary = {
    identify: (value) => value instanceof Uint8Array,
    default: false,
    tag: "tag:yaml.org,2002:binary",
    resolve(src, onError) {
      if (typeof node_buffer.Buffer === "function") {
        return node_buffer.Buffer.from(src, "base64");
      } else if (typeof atob === "function") {
        const str = atob(src.replace(/[\n\r]/g, ""));
        const buffer = new Uint8Array(str.length);
        for (let i = 0;i < str.length; ++i)
          buffer[i] = str.charCodeAt(i);
        return buffer;
      } else {
        onError("This environment does not support reading binary tags; either Buffer or atob is required");
        return src;
      }
    },
    stringify({ comment, type, value }, ctx, onComment, onChompKeep) {
      if (!value)
        return "";
      const buf = value;
      let str;
      if (typeof node_buffer.Buffer === "function") {
        str = buf instanceof node_buffer.Buffer ? buf.toString("base64") : node_buffer.Buffer.from(buf.buffer).toString("base64");
      } else if (typeof btoa === "function") {
        let s = "";
        for (let i = 0;i < buf.length; ++i)
          s += String.fromCharCode(buf[i]);
        str = btoa(s);
      } else {
        throw new Error("This environment does not support writing binary tags; either Buffer or btoa is required");
      }
      type ?? (type = Scalar.Scalar.BLOCK_LITERAL);
      if (type !== Scalar.Scalar.QUOTE_DOUBLE) {
        const lineWidth = Math.max(ctx.options.lineWidth - ctx.indent.length, ctx.options.minContentWidth);
        const n = Math.ceil(str.length / lineWidth);
        const lines = new Array(n);
        for (let i = 0, o2 = 0;i < n; ++i, o2 += lineWidth) {
          lines[i] = str.substr(o2, lineWidth);
        }
        str = lines.join(type === Scalar.Scalar.BLOCK_LITERAL ? `
` : " ");
      }
      return stringifyString.stringifyString({ comment, type, value: str }, ctx, onComment, onChompKeep);
    }
  };
  exports.binary = binary;
});

// node_modules/yaml/dist/schema/yaml-1.1/pairs.js
var require_pairs = __commonJS(function(exports) {
  var identity = require_identity();
  var Pair = require_Pair();
  var Scalar = require_Scalar();
  var YAMLSeq = require_YAMLSeq();
  function resolvePairs(seq, onError) {
    if (identity.isSeq(seq)) {
      for (let i = 0;i < seq.items.length; ++i) {
        let item = seq.items[i];
        if (identity.isPair(item))
          continue;
        else if (identity.isMap(item)) {
          if (item.items.length > 1)
            onError("Each pair must have its own sequence indicator");
          const pair = item.items[0] || new Pair.Pair(new Scalar.Scalar(null));
          if (item.commentBefore)
            pair.key.commentBefore = pair.key.commentBefore ? `${item.commentBefore}
${pair.key.commentBefore}` : item.commentBefore;
          if (item.comment) {
            const cn2 = pair.value ?? pair.key;
            cn2.comment = cn2.comment ? `${item.comment}
${cn2.comment}` : item.comment;
          }
          item = pair;
        }
        seq.items[i] = identity.isPair(item) ? item : new Pair.Pair(item);
      }
    } else
      onError("Expected a sequence for this tag");
    return seq;
  }
  function createPairs(schema, iterable, ctx) {
    const { replacer } = ctx;
    const pairs2 = new YAMLSeq.YAMLSeq(schema);
    pairs2.tag = "tag:yaml.org,2002:pairs";
    let i = 0;
    if (iterable && Symbol.iterator in Object(iterable))
      for (let it of iterable) {
        if (typeof replacer === "function")
          it = replacer.call(iterable, String(i++), it);
        let key, value;
        if (Array.isArray(it)) {
          if (it.length === 2) {
            key = it[0];
            value = it[1];
          } else
            throw new TypeError(`Expected [key, value] tuple: ${it}`);
        } else if (it && it instanceof Object) {
          const keys = Object.keys(it);
          if (keys.length === 1) {
            key = keys[0];
            value = it[key];
          } else {
            throw new TypeError(`Expected tuple with one key, not ${keys.length} keys`);
          }
        } else {
          key = it;
        }
        pairs2.items.push(Pair.createPair(key, value, ctx));
      }
    return pairs2;
  }
  var pairs = {
    collection: "seq",
    default: false,
    tag: "tag:yaml.org,2002:pairs",
    resolve: resolvePairs,
    createNode: createPairs
  };
  exports.createPairs = createPairs;
  exports.pairs = pairs;
  exports.resolvePairs = resolvePairs;
});

// node_modules/yaml/dist/schema/yaml-1.1/omap.js
var require_omap = __commonJS(function(exports) {
  var identity = require_identity();
  var toJS = require_toJS();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var pairs = require_pairs();

  class YAMLOMap extends YAMLSeq.YAMLSeq {
    constructor() {
      super();
      this.add = YAMLMap.YAMLMap.prototype.add.bind(this);
      this.delete = YAMLMap.YAMLMap.prototype.delete.bind(this);
      this.get = YAMLMap.YAMLMap.prototype.get.bind(this);
      this.has = YAMLMap.YAMLMap.prototype.has.bind(this);
      this.set = YAMLMap.YAMLMap.prototype.set.bind(this);
      this.tag = YAMLOMap.tag;
    }
    toJSON(_3, ctx) {
      if (!ctx)
        return super.toJSON(_3);
      const map = new Map;
      if (ctx?.onCreate)
        ctx.onCreate(map);
      for (const pair of this.items) {
        let key, value;
        if (identity.isPair(pair)) {
          key = toJS.toJS(pair.key, "", ctx);
          value = toJS.toJS(pair.value, key, ctx);
        } else {
          key = toJS.toJS(pair, "", ctx);
        }
        if (map.has(key))
          throw new Error("Ordered maps must not include duplicate keys");
        map.set(key, value);
      }
      return map;
    }
    static from(schema, iterable, ctx) {
      const pairs$1 = pairs.createPairs(schema, iterable, ctx);
      const omap2 = new this;
      omap2.items = pairs$1.items;
      return omap2;
    }
  }
  YAMLOMap.tag = "tag:yaml.org,2002:omap";
  var omap = {
    collection: "seq",
    identify: (value) => value instanceof Map,
    nodeClass: YAMLOMap,
    default: false,
    tag: "tag:yaml.org,2002:omap",
    resolve(seq, onError) {
      const pairs$1 = pairs.resolvePairs(seq, onError);
      const seenKeys = [];
      for (const { key } of pairs$1.items) {
        if (identity.isScalar(key)) {
          if (seenKeys.includes(key.value)) {
            onError(`Ordered maps must not include duplicate keys: ${key.value}`);
          } else {
            seenKeys.push(key.value);
          }
        }
      }
      return Object.assign(new YAMLOMap, pairs$1);
    },
    createNode: (schema, iterable, ctx) => YAMLOMap.from(schema, iterable, ctx)
  };
  exports.YAMLOMap = YAMLOMap;
  exports.omap = omap;
});

// node_modules/yaml/dist/schema/yaml-1.1/bool.js
var require_bool2 = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  function boolStringify({ value, source }, ctx) {
    const boolObj = value ? trueTag : falseTag;
    if (source && boolObj.test.test(source))
      return source;
    return value ? ctx.options.trueStr : ctx.options.falseStr;
  }
  var trueTag = {
    identify: (value) => value === true,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:Y|y|[Yy]es|YES|[Tt]rue|TRUE|[Oo]n|ON)$/,
    resolve: () => new Scalar.Scalar(true),
    stringify: boolStringify
  };
  var falseTag = {
    identify: (value) => value === false,
    default: true,
    tag: "tag:yaml.org,2002:bool",
    test: /^(?:N|n|[Nn]o|NO|[Ff]alse|FALSE|[Oo]ff|OFF)$/,
    resolve: () => new Scalar.Scalar(false),
    stringify: boolStringify
  };
  exports.falseTag = falseTag;
  exports.trueTag = trueTag;
});

// node_modules/yaml/dist/schema/yaml-1.1/float.js
var require_float2 = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var stringifyNumber = require_stringifyNumber();
  var floatNaN = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^(?:[-+]?\.(?:inf|Inf|INF)|\.nan|\.NaN|\.NAN)$/,
    resolve: (str) => str.slice(-3).toLowerCase() === "nan" ? NaN : str[0] === "-" ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY,
    stringify: stringifyNumber.stringifyNumber
  };
  var floatExp = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "EXP",
    test: /^[-+]?(?:[0-9][0-9_]*)?(?:\.[0-9_]*)?[eE][-+]?[0-9]+$/,
    resolve: (str) => parseFloat(str.replace(/_/g, "")),
    stringify(node) {
      const num = Number(node.value);
      return isFinite(num) ? num.toExponential() : stringifyNumber.stringifyNumber(node);
    }
  };
  var float = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    test: /^[-+]?(?:[0-9][0-9_]*)?\.[0-9_]*$/,
    resolve(str) {
      const node = new Scalar.Scalar(parseFloat(str.replace(/_/g, "")));
      const dot = str.indexOf(".");
      if (dot !== -1) {
        const f3 = str.substring(dot + 1).replace(/_/g, "");
        if (f3[f3.length - 1] === "0")
          node.minFractionDigits = f3.length;
      }
      return node;
    },
    stringify: stringifyNumber.stringifyNumber
  };
  exports.float = float;
  exports.floatExp = floatExp;
  exports.floatNaN = floatNaN;
});

// node_modules/yaml/dist/schema/yaml-1.1/int.js
var require_int2 = __commonJS(function(exports) {
  var stringifyNumber = require_stringifyNumber();
  var intIdentify = (value) => typeof value === "bigint" || Number.isInteger(value);
  function intResolve(str, offset, radix, { intAsBigInt }) {
    const sign = str[0];
    if (sign === "-" || sign === "+")
      offset += 1;
    str = str.substring(offset).replace(/_/g, "");
    if (intAsBigInt) {
      switch (radix) {
        case 2:
          str = `0b${str}`;
          break;
        case 8:
          str = `0o${str}`;
          break;
        case 16:
          str = `0x${str}`;
          break;
      }
      const n2 = BigInt(str);
      return sign === "-" ? BigInt(-1) * n2 : n2;
    }
    const n = parseInt(str, radix);
    return sign === "-" ? -1 * n : n;
  }
  function intStringify(node, radix, prefix) {
    const { value } = node;
    if (intIdentify(value)) {
      const str = value.toString(radix);
      return value < 0 ? "-" + prefix + str.substr(1) : prefix + str;
    }
    return stringifyNumber.stringifyNumber(node);
  }
  var intBin = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "BIN",
    test: /^[-+]?0b[0-1_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 2, opt),
    stringify: (node) => intStringify(node, 2, "0b")
  };
  var intOct = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "OCT",
    test: /^[-+]?0[0-7_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 1, 8, opt),
    stringify: (node) => intStringify(node, 8, "0")
  };
  var int = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    test: /^[-+]?[0-9][0-9_]*$/,
    resolve: (str, _onError, opt) => intResolve(str, 0, 10, opt),
    stringify: stringifyNumber.stringifyNumber
  };
  var intHex = {
    identify: intIdentify,
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "HEX",
    test: /^[-+]?0x[0-9a-fA-F_]+$/,
    resolve: (str, _onError, opt) => intResolve(str, 2, 16, opt),
    stringify: (node) => intStringify(node, 16, "0x")
  };
  exports.int = int;
  exports.intBin = intBin;
  exports.intHex = intHex;
  exports.intOct = intOct;
});

// node_modules/yaml/dist/schema/yaml-1.1/set.js
var require_set = __commonJS(function(exports) {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();

  class YAMLSet extends YAMLMap.YAMLMap {
    constructor(schema) {
      super(schema);
      this.tag = YAMLSet.tag;
    }
    add(key) {
      let pair;
      if (identity.isPair(key))
        pair = key;
      else if (key && typeof key === "object" && "key" in key && "value" in key && key.value === null)
        pair = new Pair.Pair(key.key, null);
      else
        pair = new Pair.Pair(key, null);
      const prev = YAMLMap.findPair(this.items, pair.key);
      if (!prev)
        this.items.push(pair);
    }
    get(key, keepPair) {
      const pair = YAMLMap.findPair(this.items, key);
      return !keepPair && identity.isPair(pair) ? identity.isScalar(pair.key) ? pair.key.value : pair.key : pair;
    }
    set(key, value) {
      if (typeof value !== "boolean")
        throw new Error(`Expected boolean value for set(key, value) in a YAML set, not ${typeof value}`);
      const prev = YAMLMap.findPair(this.items, key);
      if (prev && !value) {
        this.items.splice(this.items.indexOf(prev), 1);
      } else if (!prev && value) {
        this.items.push(new Pair.Pair(key));
      }
    }
    toJSON(_3, ctx) {
      return super.toJSON(_3, ctx, Set);
    }
    toString(ctx, onComment, onChompKeep) {
      if (!ctx)
        return JSON.stringify(this);
      if (this.hasAllNullValues(true))
        return super.toString(Object.assign({}, ctx, { allNullValues: true }), onComment, onChompKeep);
      else
        throw new Error("Set items must all have null values");
    }
    static from(schema, iterable, ctx) {
      const { replacer } = ctx;
      const set2 = new this(schema);
      if (iterable && Symbol.iterator in Object(iterable))
        for (let value of iterable) {
          if (typeof replacer === "function")
            value = replacer.call(iterable, value, value);
          set2.items.push(Pair.createPair(value, null, ctx));
        }
      return set2;
    }
  }
  YAMLSet.tag = "tag:yaml.org,2002:set";
  var set = {
    collection: "map",
    identify: (value) => value instanceof Set,
    nodeClass: YAMLSet,
    default: false,
    tag: "tag:yaml.org,2002:set",
    createNode: (schema, iterable, ctx) => YAMLSet.from(schema, iterable, ctx),
    resolve(map, onError) {
      if (identity.isMap(map)) {
        if (map.hasAllNullValues(true))
          return Object.assign(new YAMLSet, map);
        else
          onError("Set items must all have null values");
      } else
        onError("Expected a mapping for this tag");
      return map;
    }
  };
  exports.YAMLSet = YAMLSet;
  exports.set = set;
});

// node_modules/yaml/dist/schema/yaml-1.1/timestamp.js
var require_timestamp = __commonJS(function(exports) {
  var stringifyNumber = require_stringifyNumber();
  function parseSexagesimal(str, asBigInt) {
    const sign = str[0];
    const parts = sign === "-" || sign === "+" ? str.substring(1) : str;
    const num = (n) => asBigInt ? BigInt(n) : Number(n);
    const res = parts.replace(/_/g, "").split(":").reduce((res2, p2) => res2 * num(60) + num(p2), num(0));
    return sign === "-" ? num(-1) * res : res;
  }
  function stringifySexagesimal(node) {
    let { value } = node;
    let num = (n) => n;
    if (typeof value === "bigint")
      num = (n) => BigInt(n);
    else if (isNaN(value) || !isFinite(value))
      return stringifyNumber.stringifyNumber(node);
    let sign = "";
    if (value < 0) {
      sign = "-";
      value *= num(-1);
    }
    const _60 = num(60);
    const parts = [value % _60];
    if (value < 60) {
      parts.unshift(0);
    } else {
      value = (value - parts[0]) / _60;
      parts.unshift(value % _60);
      if (value >= 60) {
        value = (value - parts[0]) / _60;
        parts.unshift(value);
      }
    }
    return sign + parts.map((n) => String(n).padStart(2, "0")).join(":").replace(/000000\d*$/, "");
  }
  var intTime = {
    identify: (value) => typeof value === "bigint" || Number.isInteger(value),
    default: true,
    tag: "tag:yaml.org,2002:int",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+$/,
    resolve: (str, _onError, { intAsBigInt }) => parseSexagesimal(str, intAsBigInt),
    stringify: stringifySexagesimal
  };
  var floatTime = {
    identify: (value) => typeof value === "number",
    default: true,
    tag: "tag:yaml.org,2002:float",
    format: "TIME",
    test: /^[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\.[0-9_]*$/,
    resolve: (str) => parseSexagesimal(str, false),
    stringify: stringifySexagesimal
  };
  var timestamp = {
    identify: (value) => value instanceof Date,
    default: true,
    tag: "tag:yaml.org,2002:timestamp",
    test: RegExp("^([0-9]{4})-([0-9]{1,2})-([0-9]{1,2})" + "(?:" + "(?:t|T|[ \\t]+)" + "([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2}(\\.[0-9]+)?)" + "(?:[ \\t]*(Z|[-+][012]?[0-9](?::[0-9]{2})?))?" + ")?$"),
    resolve(str) {
      const match = str.match(timestamp.test);
      if (!match)
        throw new Error("!!timestamp expects a date, starting with yyyy-mm-dd");
      const [, year, month, day, hour, minute, second] = match.map(Number);
      const millisec = match[7] ? Number((match[7] + "00").substr(1, 3)) : 0;
      let date = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0, millisec);
      const tz = match[8];
      if (tz && tz !== "Z") {
        let d2 = parseSexagesimal(tz, false);
        if (Math.abs(d2) < 30)
          d2 *= 60;
        date -= 60000 * d2;
      }
      return new Date(date);
    },
    stringify: ({ value }) => value?.toISOString().replace(/(T00:00:00)?\.000Z$/, "") ?? ""
  };
  exports.floatTime = floatTime;
  exports.intTime = intTime;
  exports.timestamp = timestamp;
});

// node_modules/yaml/dist/schema/yaml-1.1/schema.js
var require_schema3 = __commonJS(function(exports) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var binary = require_binary();
  var bool = require_bool2();
  var float = require_float2();
  var int = require_int2();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var set = require_set();
  var timestamp = require_timestamp();
  var schema = [
    map.map,
    seq.seq,
    string.string,
    _null.nullTag,
    bool.trueTag,
    bool.falseTag,
    int.intBin,
    int.intOct,
    int.int,
    int.intHex,
    float.floatNaN,
    float.floatExp,
    float.float,
    binary.binary,
    merge.merge,
    omap.omap,
    pairs.pairs,
    set.set,
    timestamp.intTime,
    timestamp.floatTime,
    timestamp.timestamp
  ];
  exports.schema = schema;
});

// node_modules/yaml/dist/schema/tags.js
var require_tags = __commonJS(function(exports) {
  var map = require_map();
  var _null = require_null();
  var seq = require_seq();
  var string = require_string();
  var bool = require_bool();
  var float = require_float();
  var int = require_int();
  var schema = require_schema();
  var schema$1 = require_schema2();
  var binary = require_binary();
  var merge = require_merge();
  var omap = require_omap();
  var pairs = require_pairs();
  var schema$2 = require_schema3();
  var set = require_set();
  var timestamp = require_timestamp();
  var schemas = new Map([
    ["core", schema.schema],
    ["failsafe", [map.map, seq.seq, string.string]],
    ["json", schema$1.schema],
    ["yaml11", schema$2.schema],
    ["yaml-1.1", schema$2.schema]
  ]);
  var tagsByName = {
    binary: binary.binary,
    bool: bool.boolTag,
    float: float.float,
    floatExp: float.floatExp,
    floatNaN: float.floatNaN,
    floatTime: timestamp.floatTime,
    int: int.int,
    intHex: int.intHex,
    intOct: int.intOct,
    intTime: timestamp.intTime,
    map: map.map,
    merge: merge.merge,
    null: _null.nullTag,
    omap: omap.omap,
    pairs: pairs.pairs,
    seq: seq.seq,
    set: set.set,
    timestamp: timestamp.timestamp
  };
  var coreKnownTags = {
    "tag:yaml.org,2002:binary": binary.binary,
    "tag:yaml.org,2002:merge": merge.merge,
    "tag:yaml.org,2002:omap": omap.omap,
    "tag:yaml.org,2002:pairs": pairs.pairs,
    "tag:yaml.org,2002:set": set.set,
    "tag:yaml.org,2002:timestamp": timestamp.timestamp
  };
  function getTags(customTags, schemaName, addMergeTag) {
    const schemaTags = schemas.get(schemaName);
    if (schemaTags && !customTags) {
      return addMergeTag && !schemaTags.includes(merge.merge) ? schemaTags.concat(merge.merge) : schemaTags.slice();
    }
    let tags = schemaTags;
    if (!tags) {
      if (Array.isArray(customTags))
        tags = [];
      else {
        const keys = Array.from(schemas.keys()).filter((key) => key !== "yaml11").map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown schema "${schemaName}"; use one of ${keys} or define customTags array`);
      }
    }
    if (Array.isArray(customTags)) {
      for (const tag of customTags)
        tags = tags.concat(tag);
    } else if (typeof customTags === "function") {
      tags = customTags(tags.slice());
    }
    if (addMergeTag)
      tags = tags.concat(merge.merge);
    return tags.reduce((tags2, tag) => {
      const tagObj = typeof tag === "string" ? tagsByName[tag] : tag;
      if (!tagObj) {
        const tagName = JSON.stringify(tag);
        const keys = Object.keys(tagsByName).map((key) => JSON.stringify(key)).join(", ");
        throw new Error(`Unknown custom tag ${tagName}; use one of ${keys}`);
      }
      if (!tags2.includes(tagObj))
        tags2.push(tagObj);
      return tags2;
    }, []);
  }
  exports.coreKnownTags = coreKnownTags;
  exports.getTags = getTags;
});

// node_modules/yaml/dist/schema/Schema.js
var require_Schema = __commonJS(function(exports) {
  var identity = require_identity();
  var map = require_map();
  var seq = require_seq();
  var string = require_string();
  var tags = require_tags();
  var sortMapEntriesByKey = (a2, b3) => a2.key < b3.key ? -1 : a2.key > b3.key ? 1 : 0;

  class Schema {
    constructor({ compat, customTags, merge, resolveKnownTags, schema, sortMapEntries, toStringDefaults }) {
      this.compat = Array.isArray(compat) ? tags.getTags(compat, "compat") : compat ? tags.getTags(null, compat) : null;
      this.name = typeof schema === "string" && schema || "core";
      this.knownTags = resolveKnownTags ? tags.coreKnownTags : {};
      this.tags = tags.getTags(customTags, this.name, merge);
      this.toStringOptions = toStringDefaults ?? null;
      Object.defineProperty(this, identity.MAP, { value: map.map });
      Object.defineProperty(this, identity.SCALAR, { value: string.string });
      Object.defineProperty(this, identity.SEQ, { value: seq.seq });
      this.sortMapEntries = typeof sortMapEntries === "function" ? sortMapEntries : sortMapEntries === true ? sortMapEntriesByKey : null;
    }
    clone() {
      const copy = Object.create(Schema.prototype, Object.getOwnPropertyDescriptors(this));
      copy.tags = this.tags.slice();
      return copy;
    }
  }
  exports.Schema = Schema;
});

// node_modules/yaml/dist/stringify/stringifyDocument.js
var require_stringifyDocument = __commonJS(function(exports) {
  var identity = require_identity();
  var stringify = require_stringify();
  var stringifyComment = require_stringifyComment();
  function stringifyDocument(doc, options) {
    const lines = [];
    let hasDirectives = options.directives === true;
    if (options.directives !== false && doc.directives) {
      const dir = doc.directives.toString(doc);
      if (dir) {
        lines.push(dir);
        hasDirectives = true;
      } else if (doc.directives.docStart)
        hasDirectives = true;
    }
    if (hasDirectives)
      lines.push("---");
    const ctx = stringify.createStringifyContext(doc, options);
    const { commentString } = ctx.options;
    if (doc.commentBefore) {
      if (lines.length !== 1)
        lines.unshift("");
      const cs2 = commentString(doc.commentBefore);
      lines.unshift(stringifyComment.indentComment(cs2, ""));
    }
    let chompKeep = false;
    let contentComment = null;
    if (doc.contents) {
      if (identity.isNode(doc.contents)) {
        if (doc.contents.spaceBefore && hasDirectives)
          lines.push("");
        if (doc.contents.commentBefore) {
          const cs2 = commentString(doc.contents.commentBefore);
          lines.push(stringifyComment.indentComment(cs2, ""));
        }
        ctx.forceBlockIndent = !!doc.comment;
        contentComment = doc.contents.comment;
      }
      const onChompKeep = contentComment ? undefined : () => chompKeep = true;
      let body = stringify.stringify(doc.contents, ctx, () => contentComment = null, onChompKeep);
      if (contentComment)
        body += stringifyComment.lineComment(body, "", commentString(contentComment));
      if ((body[0] === "|" || body[0] === ">") && lines[lines.length - 1] === "---") {
        lines[lines.length - 1] = `--- ${body}`;
      } else
        lines.push(body);
    } else {
      lines.push(stringify.stringify(doc.contents, ctx));
    }
    if (doc.directives?.docEnd) {
      if (doc.comment) {
        const cs2 = commentString(doc.comment);
        if (cs2.includes(`
`)) {
          lines.push("...");
          lines.push(stringifyComment.indentComment(cs2, ""));
        } else {
          lines.push(`... ${cs2}`);
        }
      } else {
        lines.push("...");
      }
    } else {
      let dc = doc.comment;
      if (dc && chompKeep)
        dc = dc.replace(/^\n+/, "");
      if (dc) {
        if ((!chompKeep || contentComment) && lines[lines.length - 1] !== "")
          lines.push("");
        lines.push(stringifyComment.indentComment(commentString(dc), ""));
      }
    }
    return lines.join(`
`) + `
`;
  }
  exports.stringifyDocument = stringifyDocument;
});

// node_modules/yaml/dist/doc/Document.js
var require_Document = __commonJS(function(exports) {
  var Alias = require_Alias();
  var Collection = require_Collection();
  var identity = require_identity();
  var Pair = require_Pair();
  var toJS = require_toJS();
  var Schema = require_Schema();
  var stringifyDocument = require_stringifyDocument();
  var anchors = require_anchors();
  var applyReviver = require_applyReviver();
  var createNode = require_createNode();
  var directives = require_directives();

  class Document {
    constructor(value, replacer, options) {
      this.commentBefore = null;
      this.comment = null;
      this.errors = [];
      this.warnings = [];
      Object.defineProperty(this, identity.NODE_TYPE, { value: identity.DOC });
      let _replacer = null;
      if (typeof replacer === "function" || Array.isArray(replacer)) {
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const opt = Object.assign({
        intAsBigInt: false,
        keepSourceTokens: false,
        logLevel: "warn",
        prettyErrors: true,
        strict: true,
        stringKeys: false,
        uniqueKeys: true,
        version: "1.2"
      }, options);
      this.options = opt;
      let { version } = opt;
      if (options?._directives) {
        this.directives = options._directives.atDocument();
        if (this.directives.yaml.explicit)
          version = this.directives.yaml.version;
      } else
        this.directives = new directives.Directives({ version });
      this.setSchema(version, options);
      this.contents = value === undefined ? null : this.createNode(value, _replacer, options);
    }
    clone() {
      const copy = Object.create(Document.prototype, {
        [identity.NODE_TYPE]: { value: identity.DOC }
      });
      copy.commentBefore = this.commentBefore;
      copy.comment = this.comment;
      copy.errors = this.errors.slice();
      copy.warnings = this.warnings.slice();
      copy.options = Object.assign({}, this.options);
      if (this.directives)
        copy.directives = this.directives.clone();
      copy.schema = this.schema.clone();
      copy.contents = identity.isNode(this.contents) ? this.contents.clone(copy.schema) : this.contents;
      if (this.range)
        copy.range = this.range.slice();
      return copy;
    }
    add(value) {
      if (assertCollection(this.contents))
        this.contents.add(value);
    }
    addIn(path2, value) {
      if (assertCollection(this.contents))
        this.contents.addIn(path2, value);
    }
    createAlias(node, name) {
      if (!node.anchor) {
        const prev = anchors.anchorNames(this);
        node.anchor = !name || prev.has(name) ? anchors.findNewAnchor(name || "a", prev) : name;
      }
      return new Alias.Alias(node.anchor);
    }
    createNode(value, replacer, options) {
      let _replacer = undefined;
      if (typeof replacer === "function") {
        value = replacer.call({ "": value }, "", value);
        _replacer = replacer;
      } else if (Array.isArray(replacer)) {
        const keyToStr = (v2) => typeof v2 === "number" || v2 instanceof String || v2 instanceof Number;
        const asStr = replacer.filter(keyToStr).map(String);
        if (asStr.length > 0)
          replacer = replacer.concat(asStr);
        _replacer = replacer;
      } else if (options === undefined && replacer) {
        options = replacer;
        replacer = undefined;
      }
      const { aliasDuplicateObjects, anchorPrefix, flow, keepUndefined, onTagObj, tag } = options ?? {};
      const { onAnchor, setAnchors, sourceObjects } = anchors.createNodeAnchors(this, anchorPrefix || "a");
      const ctx = {
        aliasDuplicateObjects: aliasDuplicateObjects ?? true,
        keepUndefined: keepUndefined ?? false,
        onAnchor,
        onTagObj,
        replacer: _replacer,
        schema: this.schema,
        sourceObjects
      };
      const node = createNode.createNode(value, tag, ctx);
      if (flow && identity.isCollection(node))
        node.flow = true;
      setAnchors();
      return node;
    }
    createPair(key, value, options = {}) {
      const k2 = this.createNode(key, null, options);
      const v2 = this.createNode(value, null, options);
      return new Pair.Pair(k2, v2);
    }
    delete(key) {
      return assertCollection(this.contents) ? this.contents.delete(key) : false;
    }
    deleteIn(path2) {
      if (Collection.isEmptyPath(path2)) {
        if (this.contents == null)
          return false;
        this.contents = null;
        return true;
      }
      return assertCollection(this.contents) ? this.contents.deleteIn(path2) : false;
    }
    get(key, keepScalar) {
      return identity.isCollection(this.contents) ? this.contents.get(key, keepScalar) : undefined;
    }
    getIn(path2, keepScalar) {
      if (Collection.isEmptyPath(path2))
        return !keepScalar && identity.isScalar(this.contents) ? this.contents.value : this.contents;
      return identity.isCollection(this.contents) ? this.contents.getIn(path2, keepScalar) : undefined;
    }
    has(key) {
      return identity.isCollection(this.contents) ? this.contents.has(key) : false;
    }
    hasIn(path2) {
      if (Collection.isEmptyPath(path2))
        return this.contents !== undefined;
      return identity.isCollection(this.contents) ? this.contents.hasIn(path2) : false;
    }
    set(key, value) {
      if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, [key], value);
      } else if (assertCollection(this.contents)) {
        this.contents.set(key, value);
      }
    }
    setIn(path2, value) {
      if (Collection.isEmptyPath(path2)) {
        this.contents = value;
      } else if (this.contents == null) {
        this.contents = Collection.collectionFromPath(this.schema, Array.from(path2), value);
      } else if (assertCollection(this.contents)) {
        this.contents.setIn(path2, value);
      }
    }
    setSchema(version, options = {}) {
      if (typeof version === "number")
        version = String(version);
      let opt;
      switch (version) {
        case "1.1":
          if (this.directives)
            this.directives.yaml.version = "1.1";
          else
            this.directives = new directives.Directives({ version: "1.1" });
          opt = { resolveKnownTags: false, schema: "yaml-1.1" };
          break;
        case "1.2":
        case "next":
          if (this.directives)
            this.directives.yaml.version = version;
          else
            this.directives = new directives.Directives({ version });
          opt = { resolveKnownTags: true, schema: "core" };
          break;
        case null:
          if (this.directives)
            delete this.directives;
          opt = null;
          break;
        default: {
          const sv = JSON.stringify(version);
          throw new Error(`Expected '1.1', '1.2' or null as first argument, but found: ${sv}`);
        }
      }
      if (options.schema instanceof Object)
        this.schema = options.schema;
      else if (opt)
        this.schema = new Schema.Schema(Object.assign(opt, options));
      else
        throw new Error(`With a null YAML version, the { schema: Schema } option is required`);
    }
    toJS({ json, jsonArg, mapAsMap, maxAliasCount, onAnchor, reviver } = {}) {
      const ctx = {
        anchors: new Map,
        doc: this,
        keep: !json,
        mapAsMap: mapAsMap === true,
        mapKeyWarned: false,
        maxAliasCount: typeof maxAliasCount === "number" ? maxAliasCount : 100
      };
      const res = toJS.toJS(this.contents, jsonArg ?? "", ctx);
      if (typeof onAnchor === "function")
        for (const { count, res: res2 } of ctx.anchors.values())
          onAnchor(res2, count);
      return typeof reviver === "function" ? applyReviver.applyReviver(reviver, { "": res }, "", res) : res;
    }
    toJSON(jsonArg, onAnchor) {
      return this.toJS({ json: true, jsonArg, mapAsMap: false, onAnchor });
    }
    toString(options = {}) {
      if (this.errors.length > 0)
        throw new Error("Document with errors cannot be stringified");
      if ("indent" in options && (!Number.isInteger(options.indent) || Number(options.indent) <= 0)) {
        const s = JSON.stringify(options.indent);
        throw new Error(`"indent" option must be a positive integer, not ${s}`);
      }
      return stringifyDocument.stringifyDocument(this, options);
    }
  }
  function assertCollection(contents) {
    if (identity.isCollection(contents))
      return true;
    throw new Error("Expected a YAML collection as document contents");
  }
  exports.Document = Document;
});

// node_modules/yaml/dist/errors.js
var require_errors = __commonJS(function(exports) {
  class YAMLError extends Error {
    constructor(name, pos, code, message) {
      super();
      this.name = name;
      this.code = code;
      this.message = message;
      this.pos = pos;
    }
  }

  class YAMLParseError extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLParseError", pos, code, message);
    }
  }

  class YAMLWarning extends YAMLError {
    constructor(pos, code, message) {
      super("YAMLWarning", pos, code, message);
    }
  }
  var prettifyError = (src, lc) => (error) => {
    if (error.pos[0] === -1)
      return;
    error.linePos = error.pos.map((pos) => lc.linePos(pos));
    const { line, col } = error.linePos[0];
    error.message += ` at line ${line}, column ${col}`;
    let ci = col - 1;
    let lineStr = src.substring(lc.lineStarts[line - 1], lc.lineStarts[line]).replace(/[\n\r]+$/, "");
    if (ci >= 60 && lineStr.length > 80) {
      const trimStart = Math.min(ci - 39, lineStr.length - 79);
      lineStr = "…" + lineStr.substring(trimStart);
      ci -= trimStart - 1;
    }
    if (lineStr.length > 80)
      lineStr = lineStr.substring(0, 79) + "…";
    if (line > 1 && /^ *$/.test(lineStr.substring(0, ci))) {
      let prev = src.substring(lc.lineStarts[line - 2], lc.lineStarts[line - 1]);
      if (prev.length > 80)
        prev = prev.substring(0, 79) + `…
`;
      lineStr = prev + lineStr;
    }
    if (/[^ ]/.test(lineStr)) {
      let count = 1;
      const end = error.linePos[1];
      if (end?.line === line && end.col > col) {
        count = Math.max(1, Math.min(end.col - col, 80 - ci));
      }
      const pointer = " ".repeat(ci) + "^".repeat(count);
      error.message += `:

${lineStr}
${pointer}
`;
    }
  };
  exports.YAMLError = YAMLError;
  exports.YAMLParseError = YAMLParseError;
  exports.YAMLWarning = YAMLWarning;
  exports.prettifyError = prettifyError;
});

// node_modules/yaml/dist/compose/resolve-props.js
var require_resolve_props = __commonJS(function(exports) {
  function resolveProps(tokens, { flow, indicator, next, offset, onError, parentIndent, startOnNewline }) {
    let spaceBefore = false;
    let atNewline = startOnNewline;
    let hasSpace = startOnNewline;
    let comment = "";
    let commentSep = "";
    let hasNewline = false;
    let reqSpace = false;
    let tab = null;
    let anchor = null;
    let tag = null;
    let newlineAfterProp = null;
    let comma = null;
    let found = null;
    let start = null;
    for (const token of tokens) {
      if (reqSpace) {
        if (token.type !== "space" && token.type !== "newline" && token.type !== "comma")
          onError(token.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
        reqSpace = false;
      }
      if (tab) {
        if (atNewline && token.type !== "comment" && token.type !== "newline") {
          onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
        }
        tab = null;
      }
      switch (token.type) {
        case "space":
          if (!flow && (indicator !== "doc-start" || next?.type !== "flow-collection") && token.source.includes("\t")) {
            tab = token;
          }
          hasSpace = true;
          break;
        case "comment": {
          if (!hasSpace)
            onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
          const cb = token.source.substring(1) || " ";
          if (!comment)
            comment = cb;
          else
            comment += commentSep + cb;
          commentSep = "";
          atNewline = false;
          break;
        }
        case "newline":
          if (atNewline) {
            if (comment)
              comment += token.source;
            else if (!found || indicator !== "seq-item-ind")
              spaceBefore = true;
          } else
            commentSep += token.source;
          atNewline = true;
          hasNewline = true;
          if (anchor || tag)
            newlineAfterProp = token;
          hasSpace = true;
          break;
        case "anchor":
          if (anchor)
            onError(token, "MULTIPLE_ANCHORS", "A node can have at most one anchor");
          if (token.source.endsWith(":"))
            onError(token.offset + token.source.length - 1, "BAD_ALIAS", "Anchor ending in : is ambiguous", true);
          anchor = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        case "tag": {
          if (tag)
            onError(token, "MULTIPLE_TAGS", "A node can have at most one tag");
          tag = token;
          start ?? (start = token.offset);
          atNewline = false;
          hasSpace = false;
          reqSpace = true;
          break;
        }
        case indicator:
          if (anchor || tag)
            onError(token, "BAD_PROP_ORDER", `Anchors and tags must be after the ${token.source} indicator`);
          if (found)
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.source} in ${flow ?? "collection"}`);
          found = token;
          atNewline = indicator === "seq-item-ind" || indicator === "explicit-key-ind";
          hasSpace = false;
          break;
        case "comma":
          if (flow) {
            if (comma)
              onError(token, "UNEXPECTED_TOKEN", `Unexpected , in ${flow}`);
            comma = token;
            atNewline = false;
            hasSpace = false;
            break;
          }
        default:
          onError(token, "UNEXPECTED_TOKEN", `Unexpected ${token.type} token`);
          atNewline = false;
          hasSpace = false;
      }
    }
    const last = tokens[tokens.length - 1];
    const end = last ? last.offset + last.source.length : offset;
    if (reqSpace && next && next.type !== "space" && next.type !== "newline" && next.type !== "comma" && (next.type !== "scalar" || next.source !== "")) {
      onError(next.offset, "MISSING_CHAR", "Tags and anchors must be separated from the next token by white space");
    }
    if (tab && (atNewline && tab.indent <= parentIndent || next?.type === "block-map" || next?.type === "block-seq"))
      onError(tab, "TAB_AS_INDENT", "Tabs are not allowed as indentation");
    return {
      comma,
      found,
      spaceBefore,
      comment,
      hasNewline,
      anchor,
      tag,
      newlineAfterProp,
      end,
      start: start ?? end
    };
  }
  exports.resolveProps = resolveProps;
});

// node_modules/yaml/dist/compose/util-contains-newline.js
var require_util_contains_newline = __commonJS(function(exports) {
  function containsNewline(key) {
    if (!key)
      return null;
    switch (key.type) {
      case "alias":
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        if (key.source.includes(`
`))
          return true;
        if (key.end) {
          for (const st2 of key.end)
            if (st2.type === "newline")
              return true;
        }
        return false;
      case "flow-collection":
        for (const it of key.items) {
          for (const st2 of it.start)
            if (st2.type === "newline")
              return true;
          if (it.sep) {
            for (const st2 of it.sep)
              if (st2.type === "newline")
                return true;
          }
          if (containsNewline(it.key) || containsNewline(it.value))
            return true;
        }
        return false;
      default:
        return true;
    }
  }
  exports.containsNewline = containsNewline;
});

// node_modules/yaml/dist/compose/util-flow-indent-check.js
var require_util_flow_indent_check = __commonJS(function(exports) {
  var utilContainsNewline = require_util_contains_newline();
  function flowIndentCheck(indent, fc, onError) {
    if (fc?.type === "flow-collection") {
      const end = fc.end[0];
      if (end.indent === indent && (end.source === "]" || end.source === "}") && utilContainsNewline.containsNewline(fc)) {
        const msg = "Flow end indicator should be more indented than parent";
        onError(end, "BAD_INDENT", msg, true);
      }
    }
  }
  exports.flowIndentCheck = flowIndentCheck;
});

// node_modules/yaml/dist/compose/util-map-includes.js
var require_util_map_includes = __commonJS(function(exports) {
  var identity = require_identity();
  function mapIncludes(ctx, items, search) {
    const { uniqueKeys } = ctx.options;
    if (uniqueKeys === false)
      return false;
    const isEqual = typeof uniqueKeys === "function" ? uniqueKeys : (a2, b3) => a2 === b3 || identity.isScalar(a2) && identity.isScalar(b3) && a2.value === b3.value;
    return items.some((pair) => isEqual(pair.key, search));
  }
  exports.mapIncludes = mapIncludes;
});

// node_modules/yaml/dist/compose/resolve-block-map.js
var require_resolve_block_map = __commonJS(function(exports) {
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  var utilMapIncludes = require_util_map_includes();
  var startColMsg = "All mapping items must start at the same column";
  function resolveBlockMap({ composeNode, composeEmptyNode }, ctx, bm, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLMap.YAMLMap;
    const map = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    let offset = bm.offset;
    let commentEnd = null;
    for (const collItem of bm.items) {
      const { start, key, sep, value } = collItem;
      const keyProps = resolveProps.resolveProps(start, {
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: bm.indent,
        startOnNewline: true
      });
      const implicitKey = !keyProps.found;
      if (implicitKey) {
        if (key) {
          if (key.type === "block-seq")
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "A block sequence may not be used as an implicit map key");
          else if ("indent" in key && key.indent !== bm.indent)
            onError(offset, "BAD_INDENT", startColMsg);
        }
        if (!keyProps.anchor && !keyProps.tag && !sep) {
          commentEnd = keyProps.end;
          if (keyProps.comment) {
            if (map.comment)
              map.comment += `
` + keyProps.comment;
            else
              map.comment = keyProps.comment;
          }
          continue;
        }
        if (keyProps.newlineAfterProp || utilContainsNewline.containsNewline(key)) {
          onError(key ?? start[start.length - 1], "MULTILINE_IMPLICIT_KEY", "Implicit keys need to be on a single line");
        }
      } else if (keyProps.found?.indent !== bm.indent) {
        onError(offset, "BAD_INDENT", startColMsg);
      }
      ctx.atKey = true;
      const keyStart = keyProps.end;
      const keyNode = key ? composeNode(ctx, key, keyProps, onError) : composeEmptyNode(ctx, keyStart, start, null, keyProps, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bm.indent, key, onError);
      ctx.atKey = false;
      if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
        onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
      const valueProps = resolveProps.resolveProps(sep ?? [], {
        indicator: "map-value-ind",
        next: value,
        offset: keyNode.range[2],
        onError,
        parentIndent: bm.indent,
        startOnNewline: !key || key.type === "block-scalar"
      });
      offset = valueProps.end;
      if (valueProps.found) {
        if (implicitKey) {
          if (value?.type === "block-map" && !valueProps.hasNewline)
            onError(offset, "BLOCK_AS_IMPLICIT_KEY", "Nested mappings are not allowed in compact mappings");
          if (ctx.options.strict && keyProps.start < valueProps.found.offset - 1024)
            onError(keyNode.range, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit block mapping key");
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : composeEmptyNode(ctx, offset, sep, null, valueProps, onError);
        if (ctx.schema.compat)
          utilFlowIndentCheck.flowIndentCheck(bm.indent, value, onError);
        offset = valueNode.range[2];
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      } else {
        if (implicitKey)
          onError(keyNode.range, "MISSING_CHAR", "Implicit map keys need to be followed by map values");
        if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        map.items.push(pair);
      }
    }
    if (commentEnd && commentEnd < offset)
      onError(commentEnd, "IMPOSSIBLE", "Map comment with trailing content");
    map.range = [bm.offset, offset, commentEnd ?? offset];
    return map;
  }
  exports.resolveBlockMap = resolveBlockMap;
});

// node_modules/yaml/dist/compose/resolve-block-seq.js
var require_resolve_block_seq = __commonJS(function(exports) {
  var YAMLSeq = require_YAMLSeq();
  var resolveProps = require_resolve_props();
  var utilFlowIndentCheck = require_util_flow_indent_check();
  function resolveBlockSeq({ composeNode, composeEmptyNode }, ctx, bs2, onError, tag) {
    const NodeClass = tag?.nodeClass ?? YAMLSeq.YAMLSeq;
    const seq = new NodeClass(ctx.schema);
    if (ctx.atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = bs2.offset;
    let commentEnd = null;
    for (const { start, value } of bs2.items) {
      const props = resolveProps.resolveProps(start, {
        indicator: "seq-item-ind",
        next: value,
        offset,
        onError,
        parentIndent: bs2.indent,
        startOnNewline: true
      });
      if (!props.found) {
        if (props.anchor || props.tag || value) {
          if (value?.type === "block-seq")
            onError(props.end, "BAD_INDENT", "All sequence items must start at the same column");
          else
            onError(offset, "MISSING_CHAR", "Sequence item without - indicator");
        } else {
          commentEnd = props.end;
          if (props.comment)
            seq.comment = props.comment;
          continue;
        }
      }
      const node = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, start, null, props, onError);
      if (ctx.schema.compat)
        utilFlowIndentCheck.flowIndentCheck(bs2.indent, value, onError);
      offset = node.range[2];
      seq.items.push(node);
    }
    seq.range = [bs2.offset, offset, commentEnd ?? offset];
    return seq;
  }
  exports.resolveBlockSeq = resolveBlockSeq;
});

// node_modules/yaml/dist/compose/resolve-end.js
var require_resolve_end = __commonJS(function(exports) {
  function resolveEnd(end, offset, reqSpace, onError) {
    let comment = "";
    if (end) {
      let hasSpace = false;
      let sep = "";
      for (const token of end) {
        const { source, type } = token;
        switch (type) {
          case "space":
            hasSpace = true;
            break;
          case "comment": {
            if (reqSpace && !hasSpace)
              onError(token, "MISSING_CHAR", "Comments must be separated from other tokens by white space characters");
            const cb = source.substring(1) || " ";
            if (!comment)
              comment = cb;
            else
              comment += sep + cb;
            sep = "";
            break;
          }
          case "newline":
            if (comment)
              sep += source;
            hasSpace = true;
            break;
          default:
            onError(token, "UNEXPECTED_TOKEN", `Unexpected ${type} at node end`);
        }
        offset += source.length;
      }
    }
    return { comment, offset };
  }
  exports.resolveEnd = resolveEnd;
});

// node_modules/yaml/dist/compose/resolve-flow-collection.js
var require_resolve_flow_collection = __commonJS(function(exports) {
  var identity = require_identity();
  var Pair = require_Pair();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  var utilContainsNewline = require_util_contains_newline();
  var utilMapIncludes = require_util_map_includes();
  var blockMsg = "Block collections are not allowed within flow collections";
  var isBlock = (token) => token && (token.type === "block-map" || token.type === "block-seq");
  function resolveFlowCollection({ composeNode, composeEmptyNode }, ctx, fc, onError, tag) {
    const isMap = fc.start.source === "{";
    const fcName = isMap ? "flow map" : "flow sequence";
    const NodeClass = tag?.nodeClass ?? (isMap ? YAMLMap.YAMLMap : YAMLSeq.YAMLSeq);
    const coll = new NodeClass(ctx.schema);
    coll.flow = true;
    const atRoot = ctx.atRoot;
    if (atRoot)
      ctx.atRoot = false;
    if (ctx.atKey)
      ctx.atKey = false;
    let offset = fc.offset + fc.start.source.length;
    for (let i = 0;i < fc.items.length; ++i) {
      const collItem = fc.items[i];
      const { start, key, sep, value } = collItem;
      const props = resolveProps.resolveProps(start, {
        flow: fcName,
        indicator: "explicit-key-ind",
        next: key ?? sep?.[0],
        offset,
        onError,
        parentIndent: fc.indent,
        startOnNewline: false
      });
      if (!props.found) {
        if (!props.anchor && !props.tag && !sep && !value) {
          if (i === 0 && props.comma)
            onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
          else if (i < fc.items.length - 1)
            onError(props.start, "UNEXPECTED_TOKEN", `Unexpected empty item in ${fcName}`);
          if (props.comment) {
            if (coll.comment)
              coll.comment += `
` + props.comment;
            else
              coll.comment = props.comment;
          }
          offset = props.end;
          continue;
        }
        if (!isMap && ctx.options.strict && utilContainsNewline.containsNewline(key))
          onError(key, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
      }
      if (i === 0) {
        if (props.comma)
          onError(props.comma, "UNEXPECTED_TOKEN", `Unexpected , in ${fcName}`);
      } else {
        if (!props.comma)
          onError(props.start, "MISSING_CHAR", `Missing , between ${fcName} items`);
        if (props.comment) {
          let prevItemComment = "";
          loop:
            for (const st2 of start) {
              switch (st2.type) {
                case "comma":
                case "space":
                  break;
                case "comment":
                  prevItemComment = st2.source.substring(1);
                  break loop;
                default:
                  break loop;
              }
            }
          if (prevItemComment) {
            let prev = coll.items[coll.items.length - 1];
            if (identity.isPair(prev))
              prev = prev.value ?? prev.key;
            if (prev.comment)
              prev.comment += `
` + prevItemComment;
            else
              prev.comment = prevItemComment;
            props.comment = props.comment.substring(prevItemComment.length + 1);
          }
        }
      }
      if (!isMap && !sep && !props.found) {
        const valueNode = value ? composeNode(ctx, value, props, onError) : composeEmptyNode(ctx, props.end, sep, null, props, onError);
        coll.items.push(valueNode);
        offset = valueNode.range[2];
        if (isBlock(value))
          onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
      } else {
        ctx.atKey = true;
        const keyStart = props.end;
        const keyNode = key ? composeNode(ctx, key, props, onError) : composeEmptyNode(ctx, keyStart, start, null, props, onError);
        if (isBlock(key))
          onError(keyNode.range, "BLOCK_IN_FLOW", blockMsg);
        ctx.atKey = false;
        const valueProps = resolveProps.resolveProps(sep ?? [], {
          flow: fcName,
          indicator: "map-value-ind",
          next: value,
          offset: keyNode.range[2],
          onError,
          parentIndent: fc.indent,
          startOnNewline: false
        });
        if (valueProps.found) {
          if (!isMap && !props.found && ctx.options.strict) {
            if (sep)
              for (const st2 of sep) {
                if (st2 === valueProps.found)
                  break;
                if (st2.type === "newline") {
                  onError(st2, "MULTILINE_IMPLICIT_KEY", "Implicit keys of flow sequence pairs need to be on a single line");
                  break;
                }
              }
            if (props.start < valueProps.found.offset - 1024)
              onError(valueProps.found, "KEY_OVER_1024_CHARS", "The : indicator must be at most 1024 chars after the start of an implicit flow sequence key");
          }
        } else if (value) {
          if ("source" in value && value.source?.[0] === ":")
            onError(value, "MISSING_CHAR", `Missing space after : in ${fcName}`);
          else
            onError(valueProps.start, "MISSING_CHAR", `Missing , or : between ${fcName} items`);
        }
        const valueNode = value ? composeNode(ctx, value, valueProps, onError) : valueProps.found ? composeEmptyNode(ctx, valueProps.end, sep, null, valueProps, onError) : null;
        if (valueNode) {
          if (isBlock(value))
            onError(valueNode.range, "BLOCK_IN_FLOW", blockMsg);
        } else if (valueProps.comment) {
          if (keyNode.comment)
            keyNode.comment += `
` + valueProps.comment;
          else
            keyNode.comment = valueProps.comment;
        }
        const pair = new Pair.Pair(keyNode, valueNode);
        if (ctx.options.keepSourceTokens)
          pair.srcToken = collItem;
        if (isMap) {
          const map = coll;
          if (utilMapIncludes.mapIncludes(ctx, map.items, keyNode))
            onError(keyStart, "DUPLICATE_KEY", "Map keys must be unique");
          map.items.push(pair);
        } else {
          const map = new YAMLMap.YAMLMap(ctx.schema);
          map.flow = true;
          map.items.push(pair);
          const endRange = (valueNode ?? keyNode).range;
          map.range = [keyNode.range[0], endRange[1], endRange[2]];
          coll.items.push(map);
        }
        offset = valueNode ? valueNode.range[2] : valueProps.end;
      }
    }
    const expectedEnd = isMap ? "}" : "]";
    const [ce2, ...ee3] = fc.end;
    let cePos = offset;
    if (ce2?.source === expectedEnd)
      cePos = ce2.offset + ce2.source.length;
    else {
      const name = fcName[0].toUpperCase() + fcName.substring(1);
      const msg = atRoot ? `${name} must end with a ${expectedEnd}` : `${name} in block collection must be sufficiently indented and end with a ${expectedEnd}`;
      onError(offset, atRoot ? "MISSING_CHAR" : "BAD_INDENT", msg);
      if (ce2 && ce2.source.length !== 1)
        ee3.unshift(ce2);
    }
    if (ee3.length > 0) {
      const end = resolveEnd.resolveEnd(ee3, cePos, ctx.options.strict, onError);
      if (end.comment) {
        if (coll.comment)
          coll.comment += `
` + end.comment;
        else
          coll.comment = end.comment;
      }
      coll.range = [fc.offset, cePos, end.offset];
    } else {
      coll.range = [fc.offset, cePos, cePos];
    }
    return coll;
  }
  exports.resolveFlowCollection = resolveFlowCollection;
});

// node_modules/yaml/dist/compose/compose-collection.js
var require_compose_collection = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var YAMLMap = require_YAMLMap();
  var YAMLSeq = require_YAMLSeq();
  var resolveBlockMap = require_resolve_block_map();
  var resolveBlockSeq = require_resolve_block_seq();
  var resolveFlowCollection = require_resolve_flow_collection();
  function resolveCollection(CN, ctx, token, onError, tagName, tag) {
    const coll = token.type === "block-map" ? resolveBlockMap.resolveBlockMap(CN, ctx, token, onError, tag) : token.type === "block-seq" ? resolveBlockSeq.resolveBlockSeq(CN, ctx, token, onError, tag) : resolveFlowCollection.resolveFlowCollection(CN, ctx, token, onError, tag);
    const Coll = coll.constructor;
    if (tagName === "!" || tagName === Coll.tagName) {
      coll.tag = Coll.tagName;
      return coll;
    }
    if (tagName)
      coll.tag = tagName;
    return coll;
  }
  function composeCollection(CN, ctx, token, props, onError) {
    const tagToken = props.tag;
    const tagName = !tagToken ? null : ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg));
    if (token.type === "block-seq") {
      const { anchor, newlineAfterProp: nl } = props;
      const lastProp = anchor && tagToken ? anchor.offset > tagToken.offset ? anchor : tagToken : anchor ?? tagToken;
      if (lastProp && (!nl || nl.offset < lastProp.offset)) {
        const message = "Missing newline after block sequence props";
        onError(lastProp, "MISSING_CHAR", message);
      }
    }
    const expType = token.type === "block-map" ? "map" : token.type === "block-seq" ? "seq" : token.start.source === "{" ? "map" : "seq";
    if (!tagToken || !tagName || tagName === "!" || tagName === YAMLMap.YAMLMap.tagName && expType === "map" || tagName === YAMLSeq.YAMLSeq.tagName && expType === "seq") {
      return resolveCollection(CN, ctx, token, onError, tagName);
    }
    let tag = ctx.schema.tags.find((t2) => t2.tag === tagName && t2.collection === expType);
    if (!tag) {
      const kt2 = ctx.schema.knownTags[tagName];
      if (kt2?.collection === expType) {
        ctx.schema.tags.push(Object.assign({}, kt2, { default: false }));
        tag = kt2;
      } else {
        if (kt2) {
          onError(tagToken, "BAD_COLLECTION_TYPE", `${kt2.tag} used for ${expType} collection, but expects ${kt2.collection ?? "scalar"}`, true);
        } else {
          onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, true);
        }
        return resolveCollection(CN, ctx, token, onError, tagName);
      }
    }
    const coll = resolveCollection(CN, ctx, token, onError, tagName, tag);
    const res = tag.resolve?.(coll, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg), ctx.options) ?? coll;
    const node = identity.isNode(res) ? res : new Scalar.Scalar(res);
    node.range = coll.range;
    node.tag = tagName;
    if (tag?.format)
      node.format = tag.format;
    return node;
  }
  exports.composeCollection = composeCollection;
});

// node_modules/yaml/dist/compose/resolve-block-scalar.js
var require_resolve_block_scalar = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  function resolveBlockScalar(ctx, scalar, onError) {
    const start = scalar.offset;
    const header = parseBlockScalarHeader(scalar, ctx.options.strict, onError);
    if (!header)
      return { value: "", type: null, comment: "", range: [start, start, start] };
    const type = header.mode === ">" ? Scalar.Scalar.BLOCK_FOLDED : Scalar.Scalar.BLOCK_LITERAL;
    const lines = scalar.source ? splitLines(scalar.source) : [];
    let chompStart = lines.length;
    for (let i = lines.length - 1;i >= 0; --i) {
      const content = lines[i][1];
      if (content === "" || content === "\r")
        chompStart = i;
      else
        break;
    }
    if (chompStart === 0) {
      const value2 = header.chomp === "+" && lines.length > 0 ? `
`.repeat(Math.max(1, lines.length - 1)) : "";
      let end2 = start + header.length;
      if (scalar.source)
        end2 += scalar.source.length;
      return { value: value2, type, comment: header.comment, range: [start, end2, end2] };
    }
    let trimIndent = scalar.indent + header.indent;
    let offset = scalar.offset + header.length;
    let contentStart = 0;
    for (let i = 0;i < chompStart; ++i) {
      const [indent, content] = lines[i];
      if (content === "" || content === "\r") {
        if (header.indent === 0 && indent.length > trimIndent)
          trimIndent = indent.length;
      } else {
        if (indent.length < trimIndent) {
          const message = "Block scalars with more-indented leading empty lines must use an explicit indentation indicator";
          onError(offset + indent.length, "MISSING_CHAR", message);
        }
        if (header.indent === 0)
          trimIndent = indent.length;
        contentStart = i;
        if (trimIndent === 0 && !ctx.atRoot) {
          const message = "Block scalar values in collections must be indented";
          onError(offset, "BAD_INDENT", message);
        }
        break;
      }
      offset += indent.length + content.length + 1;
    }
    for (let i = lines.length - 1;i >= chompStart; --i) {
      if (lines[i][0].length > trimIndent)
        chompStart = i + 1;
    }
    let value = "";
    let sep = "";
    let prevMoreIndented = false;
    for (let i = 0;i < contentStart; ++i)
      value += lines[i][0].slice(trimIndent) + `
`;
    for (let i = contentStart;i < chompStart; ++i) {
      let [indent, content] = lines[i];
      offset += indent.length + content.length + 1;
      const crlf = content[content.length - 1] === "\r";
      if (crlf)
        content = content.slice(0, -1);
      if (content && indent.length < trimIndent) {
        const src = header.indent ? "explicit indentation indicator" : "first line";
        const message = `Block scalar lines must not be less indented than their ${src}`;
        onError(offset - content.length - (crlf ? 2 : 1), "BAD_INDENT", message);
        indent = "";
      }
      if (type === Scalar.Scalar.BLOCK_LITERAL) {
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
      } else if (indent.length > trimIndent || content[0] === "\t") {
        if (sep === " ")
          sep = `
`;
        else if (!prevMoreIndented && sep === `
`)
          sep = `

`;
        value += sep + indent.slice(trimIndent) + content;
        sep = `
`;
        prevMoreIndented = true;
      } else if (content === "") {
        if (sep === `
`)
          value += `
`;
        else
          sep = `
`;
      } else {
        value += sep + content;
        sep = " ";
        prevMoreIndented = false;
      }
    }
    switch (header.chomp) {
      case "-":
        break;
      case "+":
        for (let i = chompStart;i < lines.length; ++i)
          value += `
` + lines[i][0].slice(trimIndent);
        if (value[value.length - 1] !== `
`)
          value += `
`;
        break;
      default:
        value += `
`;
    }
    const end = start + header.length + scalar.source.length;
    return { value, type, comment: header.comment, range: [start, end, end] };
  }
  function parseBlockScalarHeader({ offset, props }, strict, onError) {
    if (props[0].type !== "block-scalar-header") {
      onError(props[0], "IMPOSSIBLE", "Block scalar header not found");
      return null;
    }
    const { source } = props[0];
    const mode = source[0];
    let indent = 0;
    let chomp = "";
    let error = -1;
    for (let i = 1;i < source.length; ++i) {
      const ch = source[i];
      if (!chomp && (ch === "-" || ch === "+"))
        chomp = ch;
      else {
        const n = Number(ch);
        if (!indent && n)
          indent = n;
        else if (error === -1)
          error = offset + i;
      }
    }
    if (error !== -1)
      onError(error, "UNEXPECTED_TOKEN", `Block scalar header includes extra characters: ${source}`);
    let hasSpace = false;
    let comment = "";
    let length = source.length;
    for (let i = 1;i < props.length; ++i) {
      const token = props[i];
      switch (token.type) {
        case "space":
          hasSpace = true;
        case "newline":
          length += token.source.length;
          break;
        case "comment":
          if (strict && !hasSpace) {
            const message = "Comments must be separated from other tokens by white space characters";
            onError(token, "MISSING_CHAR", message);
          }
          length += token.source.length;
          comment = token.source.substring(1);
          break;
        case "error":
          onError(token, "UNEXPECTED_TOKEN", token.message);
          length += token.source.length;
          break;
        default: {
          const message = `Unexpected token in block scalar header: ${token.type}`;
          onError(token, "UNEXPECTED_TOKEN", message);
          const ts2 = token.source;
          if (ts2 && typeof ts2 === "string")
            length += ts2.length;
        }
      }
    }
    return { mode, indent, chomp, comment, length };
  }
  function splitLines(source) {
    const split = source.split(/\n( *)/);
    const first = split[0];
    const m2 = first.match(/^( *)/);
    const line0 = m2?.[1] ? [m2[1], first.slice(m2[1].length)] : ["", first];
    const lines = [line0];
    for (let i = 1;i < split.length; i += 2)
      lines.push([split[i], split[i + 1]]);
    return lines;
  }
  exports.resolveBlockScalar = resolveBlockScalar;
});

// node_modules/yaml/dist/compose/resolve-flow-scalar.js
var require_resolve_flow_scalar = __commonJS(function(exports) {
  var Scalar = require_Scalar();
  var resolveEnd = require_resolve_end();
  function resolveFlowScalar(scalar, strict, onError) {
    const { offset, type, source, end } = scalar;
    let _type;
    let value;
    const _onError = (rel, code, msg) => onError(offset + rel, code, msg);
    switch (type) {
      case "scalar":
        _type = Scalar.Scalar.PLAIN;
        value = plainValue(source, _onError);
        break;
      case "single-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_SINGLE;
        value = singleQuotedValue(source, _onError);
        break;
      case "double-quoted-scalar":
        _type = Scalar.Scalar.QUOTE_DOUBLE;
        value = doubleQuotedValue(source, _onError);
        break;
      default:
        onError(scalar, "UNEXPECTED_TOKEN", `Expected a flow scalar value, but found: ${type}`);
        return {
          value: "",
          type: null,
          comment: "",
          range: [offset, offset + source.length, offset + source.length]
        };
    }
    const valueEnd = offset + source.length;
    const re2 = resolveEnd.resolveEnd(end, valueEnd, strict, onError);
    return {
      value,
      type: _type,
      comment: re2.comment,
      range: [offset, valueEnd, re2.offset]
    };
  }
  function plainValue(source, onError) {
    let badChar = "";
    switch (source[0]) {
      case "\t":
        badChar = "a tab character";
        break;
      case ",":
        badChar = "flow indicator character ,";
        break;
      case "%":
        badChar = "directive indicator character %";
        break;
      case "|":
      case ">": {
        badChar = `block scalar indicator ${source[0]}`;
        break;
      }
      case "@":
      case "`": {
        badChar = `reserved character ${source[0]}`;
        break;
      }
    }
    if (badChar)
      onError(0, "BAD_SCALAR_START", `Plain value cannot start with ${badChar}`);
    return unfoldLines(source);
  }
  function singleQuotedValue(source, onError) {
    if (source[source.length - 1] !== "'" || source.length === 1)
      onError(source.length, "MISSING_CHAR", "Missing closing 'quote");
    return unfoldLines(source.slice(1, -1)).replace(/''/g, "'");
  }
  function unfoldLines(source) {
    const line = /(.*?)\r?\n/sy;
    let match = line.exec(source);
    if (!match)
      return source;
    let trimEnd, trimBoth;
    try {
      trimEnd = new RegExp("(?<![ \t])[ \t]+$");
      trimBoth = new RegExp("^[ \t]+|(?<![ \t])[ \t]+$", "g");
    } catch {
      trimEnd = /[ \t]+$/;
      trimBoth = /^[ \t]+|[ \t]+$/g;
    }
    let res = match[1].replace(trimEnd, "");
    let sep = " ";
    let pos = line.lastIndex;
    while (match = line.exec(source)) {
      const lm = match[1].replace(trimBoth, "");
      if (lm === "") {
        if (sep === `
`)
          res += sep;
        else
          sep = `
`;
      } else {
        res += sep + lm;
        sep = " ";
      }
      pos = line.lastIndex;
    }
    const last = /[ \t]*(.*)/sy;
    last.lastIndex = pos;
    match = last.exec(source);
    return res + sep + (match?.[1] ?? "");
  }
  function doubleQuotedValue(source, onError) {
    let res = "";
    for (let i = 1;i < source.length - 1; ++i) {
      const ch = source[i];
      if (ch === "\r" && source[i + 1] === `
`)
        continue;
      if (ch === `
`) {
        const { fold, offset } = foldNewline(source, i);
        res += fold;
        i = offset;
      } else if (ch === "\\") {
        let next = source[++i];
        const cc = escapeCodes[next];
        if (cc)
          res += cc;
        else if (next === `
`) {
          next = source[i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "\r" && source[i + 1] === `
`) {
          next = source[++i + 1];
          while (next === " " || next === "\t")
            next = source[++i + 1];
        } else if (next === "x" || next === "u" || next === "U") {
          const length = next === "x" ? 2 : next === "u" ? 4 : 8;
          res += parseCharCode(source, i + 1, length, onError);
          i += length;
        } else {
          const raw = source.substr(i - 1, 2);
          onError(i - 1, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
          res += raw;
        }
      } else if (ch === " " || ch === "\t") {
        const wsStart = i;
        let next = source[i + 1];
        while (next === " " || next === "\t")
          next = source[++i + 1];
        if (next !== `
` && !(next === "\r" && source[i + 2] === `
`))
          res += i > wsStart ? source.slice(wsStart, i + 1) : ch;
      } else {
        res += ch;
      }
    }
    if (source[source.length - 1] !== '"' || source.length === 1)
      onError(source.length, "MISSING_CHAR", 'Missing closing "quote');
    return res;
  }
  function foldNewline(source, offset) {
    let fold = "";
    let ch = source[offset + 1];
    while (ch === " " || ch === "\t" || ch === `
` || ch === "\r") {
      if (ch === "\r" && source[offset + 2] !== `
`)
        break;
      if (ch === `
`)
        fold += `
`;
      offset += 1;
      ch = source[offset + 1];
    }
    if (!fold)
      fold = " ";
    return { fold, offset };
  }
  var escapeCodes = {
    "0": "\x00",
    a: "\x07",
    b: "\b",
    e: "\x1B",
    f: "\f",
    n: `
`,
    r: "\r",
    t: "\t",
    v: "\v",
    N: "",
    _: " ",
    L: "\u2028",
    P: "\u2029",
    " ": " ",
    '"': '"',
    "/": "/",
    "\\": "\\",
    "\t": "\t"
  };
  function parseCharCode(source, offset, length, onError) {
    const cc = source.substr(offset, length);
    const ok = cc.length === length && /^[0-9a-fA-F]+$/.test(cc);
    const code = ok ? parseInt(cc, 16) : NaN;
    try {
      return String.fromCodePoint(code);
    } catch {
      const raw = source.substr(offset - 2, length + 2);
      onError(offset - 2, "BAD_DQ_ESCAPE", `Invalid escape sequence ${raw}`);
      return raw;
    }
  }
  exports.resolveFlowScalar = resolveFlowScalar;
});

// node_modules/yaml/dist/compose/compose-scalar.js
var require_compose_scalar = __commonJS(function(exports) {
  var identity = require_identity();
  var Scalar = require_Scalar();
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  function composeScalar(ctx, token, tagToken, onError) {
    const { value, type, comment, range } = token.type === "block-scalar" ? resolveBlockScalar.resolveBlockScalar(ctx, token, onError) : resolveFlowScalar.resolveFlowScalar(token, ctx.options.strict, onError);
    const tagName = tagToken ? ctx.directives.tagName(tagToken.source, (msg) => onError(tagToken, "TAG_RESOLVE_FAILED", msg)) : null;
    let tag;
    if (ctx.options.stringKeys && ctx.atKey) {
      tag = ctx.schema[identity.SCALAR];
    } else if (tagName)
      tag = findScalarTagByName(ctx.schema, value, tagName, tagToken, onError);
    else if (token.type === "scalar")
      tag = findScalarTagByTest(ctx, value, token, onError);
    else
      tag = ctx.schema[identity.SCALAR];
    let scalar;
    try {
      const res = tag.resolve(value, (msg) => onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg), ctx.options);
      scalar = identity.isScalar(res) ? res : new Scalar.Scalar(res);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      onError(tagToken ?? token, "TAG_RESOLVE_FAILED", msg);
      scalar = new Scalar.Scalar(value);
    }
    scalar.range = range;
    scalar.source = value;
    if (type)
      scalar.type = type;
    if (tagName)
      scalar.tag = tagName;
    if (tag.format)
      scalar.format = tag.format;
    if (comment)
      scalar.comment = comment;
    return scalar;
  }
  function findScalarTagByName(schema, value, tagName, tagToken, onError) {
    if (tagName === "!")
      return schema[identity.SCALAR];
    const matchWithTest = [];
    for (const tag of schema.tags) {
      if (!tag.collection && tag.tag === tagName) {
        if (tag.default && tag.test)
          matchWithTest.push(tag);
        else
          return tag;
      }
    }
    for (const tag of matchWithTest)
      if (tag.test?.test(value))
        return tag;
    const kt2 = schema.knownTags[tagName];
    if (kt2 && !kt2.collection) {
      schema.tags.push(Object.assign({}, kt2, { default: false, test: undefined }));
      return kt2;
    }
    onError(tagToken, "TAG_RESOLVE_FAILED", `Unresolved tag: ${tagName}`, tagName !== "tag:yaml.org,2002:str");
    return schema[identity.SCALAR];
  }
  function findScalarTagByTest({ atKey, directives, schema }, value, token, onError) {
    const tag = schema.tags.find((tag2) => (tag2.default === true || atKey && tag2.default === "key") && tag2.test?.test(value)) || schema[identity.SCALAR];
    if (schema.compat) {
      const compat = schema.compat.find((tag2) => tag2.default && tag2.test?.test(value)) ?? schema[identity.SCALAR];
      if (tag.tag !== compat.tag) {
        const ts2 = directives.tagString(tag.tag);
        const cs2 = directives.tagString(compat.tag);
        const msg = `Value may be parsed as either ${ts2} or ${cs2}`;
        onError(token, "TAG_RESOLVE_FAILED", msg, true);
      }
    }
    return tag;
  }
  exports.composeScalar = composeScalar;
});

// node_modules/yaml/dist/compose/util-empty-scalar-position.js
var require_util_empty_scalar_position = __commonJS(function(exports) {
  function emptyScalarPosition(offset, before, pos) {
    if (before) {
      pos ?? (pos = before.length);
      for (let i = pos - 1;i >= 0; --i) {
        let st2 = before[i];
        switch (st2.type) {
          case "space":
          case "comment":
          case "newline":
            offset -= st2.source.length;
            continue;
        }
        st2 = before[++i];
        while (st2?.type === "space") {
          offset += st2.source.length;
          st2 = before[++i];
        }
        break;
      }
    }
    return offset;
  }
  exports.emptyScalarPosition = emptyScalarPosition;
});

// node_modules/yaml/dist/compose/compose-node.js
var require_compose_node = __commonJS(function(exports) {
  var Alias = require_Alias();
  var identity = require_identity();
  var composeCollection = require_compose_collection();
  var composeScalar = require_compose_scalar();
  var resolveEnd = require_resolve_end();
  var utilEmptyScalarPosition = require_util_empty_scalar_position();
  var CN = { composeNode, composeEmptyNode };
  function composeNode(ctx, token, props, onError) {
    const atKey = ctx.atKey;
    const { spaceBefore, comment, anchor, tag } = props;
    let node;
    let isSrcToken = true;
    switch (token.type) {
      case "alias":
        node = composeAlias(ctx, token, onError);
        if (anchor || tag)
          onError(token, "ALIAS_PROPS", "An alias node must not specify any properties");
        break;
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "block-scalar":
        node = composeScalar.composeScalar(ctx, token, tag, onError);
        if (anchor)
          node.anchor = anchor.source.substring(1);
        break;
      case "block-map":
      case "block-seq":
      case "flow-collection":
        try {
          node = composeCollection.composeCollection(CN, ctx, token, props, onError);
          if (anchor)
            node.anchor = anchor.source.substring(1);
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          onError(token, "RESOURCE_EXHAUSTION", message);
        }
        break;
      default: {
        const message = token.type === "error" ? token.message : `Unsupported token (type: ${token.type})`;
        onError(token, "UNEXPECTED_TOKEN", message);
        isSrcToken = false;
      }
    }
    node ?? (node = composeEmptyNode(ctx, token.offset, undefined, null, props, onError));
    if (anchor && node.anchor === "")
      onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    if (atKey && ctx.options.stringKeys && (!identity.isScalar(node) || typeof node.value !== "string" || node.tag && node.tag !== "tag:yaml.org,2002:str")) {
      const msg = "With stringKeys, all keys must be strings";
      onError(tag ?? token, "NON_STRING_KEY", msg);
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      if (token.type === "scalar" && token.source === "")
        node.comment = comment;
      else
        node.commentBefore = comment;
    }
    if (ctx.options.keepSourceTokens && isSrcToken)
      node.srcToken = token;
    return node;
  }
  function composeEmptyNode(ctx, offset, before, pos, { spaceBefore, comment, anchor, tag, end }, onError) {
    const token = {
      type: "scalar",
      offset: utilEmptyScalarPosition.emptyScalarPosition(offset, before, pos),
      indent: -1,
      source: ""
    };
    const node = composeScalar.composeScalar(ctx, token, tag, onError);
    if (anchor) {
      node.anchor = anchor.source.substring(1);
      if (node.anchor === "")
        onError(anchor, "BAD_ALIAS", "Anchor cannot be an empty string");
    }
    if (spaceBefore)
      node.spaceBefore = true;
    if (comment) {
      node.comment = comment;
      node.range[2] = end;
    }
    return node;
  }
  function composeAlias({ options }, { offset, source, end }, onError) {
    const alias = new Alias.Alias(source.substring(1));
    if (alias.source === "")
      onError(offset, "BAD_ALIAS", "Alias cannot be an empty string");
    if (alias.source.endsWith(":"))
      onError(offset + source.length - 1, "BAD_ALIAS", "Alias ending in : is ambiguous", true);
    const valueEnd = offset + source.length;
    const re2 = resolveEnd.resolveEnd(end, valueEnd, options.strict, onError);
    alias.range = [offset, valueEnd, re2.offset];
    if (re2.comment)
      alias.comment = re2.comment;
    return alias;
  }
  exports.composeEmptyNode = composeEmptyNode;
  exports.composeNode = composeNode;
});

// node_modules/yaml/dist/compose/compose-doc.js
var require_compose_doc = __commonJS(function(exports) {
  var Document = require_Document();
  var composeNode = require_compose_node();
  var resolveEnd = require_resolve_end();
  var resolveProps = require_resolve_props();
  function composeDoc(options, directives, { offset, start, value, end }, onError) {
    const opts = Object.assign({ _directives: directives }, options);
    const doc = new Document.Document(undefined, opts);
    const ctx = {
      atKey: false,
      atRoot: true,
      directives: doc.directives,
      options: doc.options,
      schema: doc.schema
    };
    const props = resolveProps.resolveProps(start, {
      indicator: "doc-start",
      next: value ?? end?.[0],
      offset,
      onError,
      parentIndent: 0,
      startOnNewline: true
    });
    if (props.found) {
      doc.directives.docStart = true;
      if (value && (value.type === "block-map" || value.type === "block-seq") && !props.hasNewline)
        onError(props.end, "MISSING_CHAR", "Block collection cannot start on same line with directives-end marker");
    }
    doc.contents = value ? composeNode.composeNode(ctx, value, props, onError) : composeNode.composeEmptyNode(ctx, props.end, start, null, props, onError);
    const contentEnd = doc.contents.range[2];
    const re2 = resolveEnd.resolveEnd(end, contentEnd, false, onError);
    if (re2.comment)
      doc.comment = re2.comment;
    doc.range = [offset, contentEnd, re2.offset];
    return doc;
  }
  exports.composeDoc = composeDoc;
});

// node_modules/yaml/dist/compose/composer.js
var require_composer = __commonJS(function(exports) {
  var node_process = __require("process");
  var directives = require_directives();
  var Document = require_Document();
  var errors = require_errors();
  var identity = require_identity();
  var composeDoc = require_compose_doc();
  var resolveEnd = require_resolve_end();
  function getErrorPos(src) {
    if (typeof src === "number")
      return [src, src + 1];
    if (Array.isArray(src))
      return src.length === 2 ? src : [src[0], src[1]];
    const { offset, source } = src;
    return [offset, offset + (typeof source === "string" ? source.length : 1)];
  }
  function parsePrelude(prelude) {
    let comment = "";
    let atComment = false;
    let afterEmptyLine = false;
    for (let i = 0;i < prelude.length; ++i) {
      const source = prelude[i];
      switch (source[0]) {
        case "#":
          comment += (comment === "" ? "" : afterEmptyLine ? `

` : `
`) + (source.substring(1) || " ");
          atComment = true;
          afterEmptyLine = false;
          break;
        case "%":
          if (prelude[i + 1]?.[0] !== "#")
            i += 1;
          atComment = false;
          break;
        default:
          if (!atComment)
            afterEmptyLine = true;
          atComment = false;
      }
    }
    return { comment, afterEmptyLine };
  }

  class Composer {
    constructor(options = {}) {
      this.doc = null;
      this.atDirectives = false;
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
      this.onError = (source, code, message, warning) => {
        const pos = getErrorPos(source);
        if (warning)
          this.warnings.push(new errors.YAMLWarning(pos, code, message));
        else
          this.errors.push(new errors.YAMLParseError(pos, code, message));
      };
      this.directives = new directives.Directives({ version: options.version || "1.2" });
      this.options = options;
    }
    decorate(doc, afterDoc) {
      const { comment, afterEmptyLine } = parsePrelude(this.prelude);
      if (comment) {
        const dc = doc.contents;
        if (afterDoc) {
          doc.comment = doc.comment ? `${doc.comment}
${comment}` : comment;
        } else if (afterEmptyLine || doc.directives.docStart || !dc) {
          doc.commentBefore = comment;
        } else if (identity.isCollection(dc) && !dc.flow && dc.items.length > 0) {
          let it = dc.items[0];
          if (identity.isPair(it))
            it = it.key;
          const cb = it.commentBefore;
          it.commentBefore = cb ? `${comment}
${cb}` : comment;
        } else {
          const cb = dc.commentBefore;
          dc.commentBefore = cb ? `${comment}
${cb}` : comment;
        }
      }
      if (afterDoc) {
        for (let i = 0;i < this.errors.length; ++i)
          doc.errors.push(this.errors[i]);
        for (let i = 0;i < this.warnings.length; ++i)
          doc.warnings.push(this.warnings[i]);
      } else {
        doc.errors = this.errors;
        doc.warnings = this.warnings;
      }
      this.prelude = [];
      this.errors = [];
      this.warnings = [];
    }
    streamInfo() {
      return {
        comment: parsePrelude(this.prelude).comment,
        directives: this.directives,
        errors: this.errors,
        warnings: this.warnings
      };
    }
    *compose(tokens, forceDoc = false, endOffset = -1) {
      for (const token of tokens)
        yield* this.next(token);
      yield* this.end(forceDoc, endOffset);
    }
    *next(token) {
      if (node_process.env.LOG_STREAM)
        console.dir(token, { depth: null });
      switch (token.type) {
        case "directive":
          this.directives.add(token.source, (offset, message, warning) => {
            const pos = getErrorPos(token);
            pos[0] += offset;
            this.onError(pos, "BAD_DIRECTIVE", message, warning);
          });
          this.prelude.push(token.source);
          this.atDirectives = true;
          break;
        case "document": {
          const doc = composeDoc.composeDoc(this.options, this.directives, token, this.onError);
          if (this.atDirectives && !doc.directives.docStart)
            this.onError(token, "MISSING_CHAR", "Missing directives-end/doc-start indicator line");
          this.decorate(doc, false);
          if (this.doc)
            yield this.doc;
          this.doc = doc;
          this.atDirectives = false;
          break;
        }
        case "byte-order-mark":
        case "space":
          break;
        case "comment":
        case "newline":
          this.prelude.push(token.source);
          break;
        case "error": {
          const msg = token.source ? `${token.message}: ${JSON.stringify(token.source)}` : token.message;
          const error = new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg);
          if (this.atDirectives || !this.doc)
            this.errors.push(error);
          else
            this.doc.errors.push(error);
          break;
        }
        case "doc-end": {
          if (!this.doc) {
            const msg = "Unexpected doc-end without preceding document";
            this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", msg));
            break;
          }
          this.doc.directives.docEnd = true;
          const end = resolveEnd.resolveEnd(token.end, token.offset + token.source.length, this.doc.options.strict, this.onError);
          this.decorate(this.doc, true);
          if (end.comment) {
            const dc = this.doc.comment;
            this.doc.comment = dc ? `${dc}
${end.comment}` : end.comment;
          }
          this.doc.range[2] = end.offset;
          break;
        }
        default:
          this.errors.push(new errors.YAMLParseError(getErrorPos(token), "UNEXPECTED_TOKEN", `Unsupported token ${token.type}`));
      }
    }
    *end(forceDoc = false, endOffset = -1) {
      if (this.doc) {
        this.decorate(this.doc, true);
        yield this.doc;
        this.doc = null;
      } else if (forceDoc) {
        const opts = Object.assign({ _directives: this.directives }, this.options);
        const doc = new Document.Document(undefined, opts);
        if (this.atDirectives)
          this.onError(endOffset, "MISSING_CHAR", "Missing directives-end indicator line");
        doc.range = [0, endOffset, endOffset];
        this.decorate(doc, false);
        yield doc;
      }
    }
  }
  exports.Composer = Composer;
});

// node_modules/yaml/dist/parse/cst-scalar.js
var require_cst_scalar = __commonJS(function(exports) {
  var resolveBlockScalar = require_resolve_block_scalar();
  var resolveFlowScalar = require_resolve_flow_scalar();
  var errors = require_errors();
  var stringifyString = require_stringifyString();
  function resolveAsScalar(token, strict = true, onError) {
    if (token) {
      const _onError = (pos, code, message) => {
        const offset = typeof pos === "number" ? pos : Array.isArray(pos) ? pos[0] : pos.offset;
        if (onError)
          onError(offset, code, message);
        else
          throw new errors.YAMLParseError([offset, offset + 1], code, message);
      };
      switch (token.type) {
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return resolveFlowScalar.resolveFlowScalar(token, strict, _onError);
        case "block-scalar":
          return resolveBlockScalar.resolveBlockScalar({ options: { strict } }, token, _onError);
      }
    }
    return null;
  }
  function createScalarToken(value, context) {
    const { implicitKey = false, indent, inFlow = false, offset = -1, type = "PLAIN" } = context;
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey,
      indent: indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    const end = context.end ?? [
      { type: "newline", offset: -1, indent, source: `
` }
    ];
    switch (source[0]) {
      case "|":
      case ">": {
        const he2 = source.indexOf(`
`);
        const head = source.substring(0, he2);
        const body = source.substring(he2 + 1) + `
`;
        const props = [
          { type: "block-scalar-header", offset, indent, source: head }
        ];
        if (!addEndtoBlockProps(props, end))
          props.push({ type: "newline", offset: -1, indent, source: `
` });
        return { type: "block-scalar", offset, indent, props, source: body };
      }
      case '"':
        return { type: "double-quoted-scalar", offset, indent, source, end };
      case "'":
        return { type: "single-quoted-scalar", offset, indent, source, end };
      default:
        return { type: "scalar", offset, indent, source, end };
    }
  }
  function setScalarValue(token, value, context = {}) {
    let { afterKey = false, implicitKey = false, inFlow = false, type } = context;
    let indent = "indent" in token ? token.indent : null;
    if (afterKey && typeof indent === "number")
      indent += 2;
    if (!type)
      switch (token.type) {
        case "single-quoted-scalar":
          type = "QUOTE_SINGLE";
          break;
        case "double-quoted-scalar":
          type = "QUOTE_DOUBLE";
          break;
        case "block-scalar": {
          const header = token.props[0];
          if (header.type !== "block-scalar-header")
            throw new Error("Invalid block scalar header");
          type = header.source[0] === ">" ? "BLOCK_FOLDED" : "BLOCK_LITERAL";
          break;
        }
        default:
          type = "PLAIN";
      }
    const source = stringifyString.stringifyString({ type, value }, {
      implicitKey: implicitKey || indent === null,
      indent: indent !== null && indent > 0 ? " ".repeat(indent) : "",
      inFlow,
      options: { blockQuote: true, lineWidth: -1 }
    });
    switch (source[0]) {
      case "|":
      case ">":
        setBlockScalarValue(token, source);
        break;
      case '"':
        setFlowScalarValue(token, source, "double-quoted-scalar");
        break;
      case "'":
        setFlowScalarValue(token, source, "single-quoted-scalar");
        break;
      default:
        setFlowScalarValue(token, source, "scalar");
    }
  }
  function setBlockScalarValue(token, source) {
    const he2 = source.indexOf(`
`);
    const head = source.substring(0, he2);
    const body = source.substring(he2 + 1) + `
`;
    if (token.type === "block-scalar") {
      const header = token.props[0];
      if (header.type !== "block-scalar-header")
        throw new Error("Invalid block scalar header");
      header.source = head;
      token.source = body;
    } else {
      const { offset } = token;
      const indent = "indent" in token ? token.indent : -1;
      const props = [
        { type: "block-scalar-header", offset, indent, source: head }
      ];
      if (!addEndtoBlockProps(props, "end" in token ? token.end : undefined))
        props.push({ type: "newline", offset: -1, indent, source: `
` });
      for (const key of Object.keys(token))
        if (key !== "type" && key !== "offset")
          delete token[key];
      Object.assign(token, { type: "block-scalar", indent, props, source: body });
    }
  }
  function addEndtoBlockProps(props, end) {
    if (end)
      for (const st2 of end)
        switch (st2.type) {
          case "space":
          case "comment":
            props.push(st2);
            break;
          case "newline":
            props.push(st2);
            return true;
        }
    return false;
  }
  function setFlowScalarValue(token, source, type) {
    switch (token.type) {
      case "scalar":
      case "double-quoted-scalar":
      case "single-quoted-scalar":
        token.type = type;
        token.source = source;
        break;
      case "block-scalar": {
        const end = token.props.slice(1);
        let oa = source.length;
        if (token.props[0].type === "block-scalar-header")
          oa -= token.props[0].source.length;
        for (const tok of end)
          tok.offset += oa;
        delete token.props;
        Object.assign(token, { type, source, end });
        break;
      }
      case "block-map":
      case "block-seq": {
        const offset = token.offset + source.length;
        const nl = { type: "newline", offset, indent: token.indent, source: `
` };
        delete token.items;
        Object.assign(token, { type, source, end: [nl] });
        break;
      }
      default: {
        const indent = "indent" in token ? token.indent : -1;
        const end = "end" in token && Array.isArray(token.end) ? token.end.filter((st2) => st2.type === "space" || st2.type === "comment" || st2.type === "newline") : [];
        for (const key of Object.keys(token))
          if (key !== "type" && key !== "offset")
            delete token[key];
        Object.assign(token, { type, indent, source, end });
      }
    }
  }
  exports.createScalarToken = createScalarToken;
  exports.resolveAsScalar = resolveAsScalar;
  exports.setScalarValue = setScalarValue;
});

// node_modules/yaml/dist/parse/cst-stringify.js
var require_cst_stringify = __commonJS(function(exports) {
  var stringify = (cst) => ("type" in cst) ? stringifyToken(cst) : stringifyItem(cst);
  function stringifyToken(token) {
    switch (token.type) {
      case "block-scalar": {
        let res = "";
        for (const tok of token.props)
          res += stringifyToken(tok);
        return res + token.source;
      }
      case "block-map":
      case "block-seq": {
        let res = "";
        for (const item of token.items)
          res += stringifyItem(item);
        return res;
      }
      case "flow-collection": {
        let res = token.start.source;
        for (const item of token.items)
          res += stringifyItem(item);
        for (const st2 of token.end)
          res += st2.source;
        return res;
      }
      case "document": {
        let res = stringifyItem(token);
        if (token.end)
          for (const st2 of token.end)
            res += st2.source;
        return res;
      }
      default: {
        let res = token.source;
        if ("end" in token && token.end)
          for (const st2 of token.end)
            res += st2.source;
        return res;
      }
    }
  }
  function stringifyItem({ start, key, sep, value }) {
    let res = "";
    for (const st2 of start)
      res += st2.source;
    if (key)
      res += stringifyToken(key);
    if (sep)
      for (const st2 of sep)
        res += st2.source;
    if (value)
      res += stringifyToken(value);
    return res;
  }
  exports.stringify = stringify;
});

// node_modules/yaml/dist/parse/cst-visit.js
var require_cst_visit = __commonJS(function(exports) {
  var BREAK = Symbol("break visit");
  var SKIP = Symbol("skip children");
  var REMOVE = Symbol("remove item");
  function visit(cst, visitor) {
    if ("type" in cst && cst.type === "document")
      cst = { start: cst.start, value: cst.value };
    _visit(Object.freeze([]), cst, visitor);
  }
  visit.BREAK = BREAK;
  visit.SKIP = SKIP;
  visit.REMOVE = REMOVE;
  visit.itemAtPath = (cst, path2) => {
    let item = cst;
    for (const [field, index] of path2) {
      const tok = item?.[field];
      if (tok && "items" in tok) {
        item = tok.items[index];
      } else
        return;
    }
    return item;
  };
  visit.parentCollection = (cst, path2) => {
    const parent = visit.itemAtPath(cst, path2.slice(0, -1));
    const field = path2[path2.length - 1][0];
    const coll = parent?.[field];
    if (coll && "items" in coll)
      return coll;
    throw new Error("Parent collection not found");
  };
  function _visit(path2, item, visitor) {
    let ctrl = visitor(item, path2);
    if (typeof ctrl === "symbol")
      return ctrl;
    for (const field of ["key", "value"]) {
      const token = item[field];
      if (token && "items" in token) {
        for (let i = 0;i < token.items.length; ++i) {
          const ci = _visit(Object.freeze(path2.concat([[field, i]])), token.items[i], visitor);
          if (typeof ci === "number")
            i = ci - 1;
          else if (ci === BREAK)
            return BREAK;
          else if (ci === REMOVE) {
            token.items.splice(i, 1);
            i -= 1;
          }
        }
        if (typeof ctrl === "function" && field === "key")
          ctrl = ctrl(item, path2);
      }
    }
    return typeof ctrl === "function" ? ctrl(item, path2) : ctrl;
  }
  exports.visit = visit;
});

// node_modules/yaml/dist/parse/cst.js
var require_cst = __commonJS(function(exports) {
  var cstScalar = require_cst_scalar();
  var cstStringify = require_cst_stringify();
  var cstVisit = require_cst_visit();
  var BOM = "\uFEFF";
  var DOCUMENT = "\x02";
  var FLOW_END = "\x18";
  var SCALAR = "\x1F";
  var isCollection = (token) => !!token && ("items" in token);
  var isScalar = (token) => !!token && (token.type === "scalar" || token.type === "single-quoted-scalar" || token.type === "double-quoted-scalar" || token.type === "block-scalar");
  function prettyToken(token) {
    switch (token) {
      case BOM:
        return "<BOM>";
      case DOCUMENT:
        return "<DOC>";
      case FLOW_END:
        return "<FLOW_END>";
      case SCALAR:
        return "<SCALAR>";
      default:
        return JSON.stringify(token);
    }
  }
  function tokenType(source) {
    switch (source) {
      case BOM:
        return "byte-order-mark";
      case DOCUMENT:
        return "doc-mode";
      case FLOW_END:
        return "flow-error-end";
      case SCALAR:
        return "scalar";
      case "---":
        return "doc-start";
      case "...":
        return "doc-end";
      case "":
      case `
`:
      case `\r
`:
        return "newline";
      case "-":
        return "seq-item-ind";
      case "?":
        return "explicit-key-ind";
      case ":":
        return "map-value-ind";
      case "{":
        return "flow-map-start";
      case "}":
        return "flow-map-end";
      case "[":
        return "flow-seq-start";
      case "]":
        return "flow-seq-end";
      case ",":
        return "comma";
    }
    switch (source[0]) {
      case " ":
      case "\t":
        return "space";
      case "#":
        return "comment";
      case "%":
        return "directive-line";
      case "*":
        return "alias";
      case "&":
        return "anchor";
      case "!":
        return "tag";
      case "'":
        return "single-quoted-scalar";
      case '"':
        return "double-quoted-scalar";
      case "|":
      case ">":
        return "block-scalar-header";
    }
    return null;
  }
  exports.createScalarToken = cstScalar.createScalarToken;
  exports.resolveAsScalar = cstScalar.resolveAsScalar;
  exports.setScalarValue = cstScalar.setScalarValue;
  exports.stringify = cstStringify.stringify;
  exports.visit = cstVisit.visit;
  exports.BOM = BOM;
  exports.DOCUMENT = DOCUMENT;
  exports.FLOW_END = FLOW_END;
  exports.SCALAR = SCALAR;
  exports.isCollection = isCollection;
  exports.isScalar = isScalar;
  exports.prettyToken = prettyToken;
  exports.tokenType = tokenType;
});

// node_modules/yaml/dist/parse/lexer.js
var require_lexer = __commonJS(function(exports) {
  var cst = require_cst();
  function isEmpty(ch) {
    switch (ch) {
      case undefined:
      case " ":
      case `
`:
      case "\r":
      case "\t":
        return true;
      default:
        return false;
    }
  }
  var hexDigits = new Set("0123456789ABCDEFabcdef");
  var tagChars = new Set("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-#;/?:@&=+$_.!~*'()");
  var flowIndicatorChars = new Set(",[]{}");
  var invalidAnchorChars = new Set(` ,[]{}
\r	`);
  var isNotAnchorChar = (ch) => !ch || invalidAnchorChars.has(ch);

  class Lexer {
    constructor() {
      this.atEnd = false;
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      this.buffer = "";
      this.flowKey = false;
      this.flowLevel = 0;
      this.indentNext = 0;
      this.indentValue = 0;
      this.lineEndPos = null;
      this.next = null;
      this.pos = 0;
    }
    *lex(source, incomplete = false) {
      if (source) {
        if (typeof source !== "string")
          throw TypeError("source is not a string");
        this.buffer = this.buffer ? this.buffer + source : source;
        this.lineEndPos = null;
      }
      this.atEnd = !incomplete;
      let next = this.next ?? "stream";
      while (next && (incomplete || this.hasChars(1)))
        next = yield* this.parseNext(next);
    }
    atLineEnd() {
      let i = this.pos;
      let ch = this.buffer[i];
      while (ch === " " || ch === "\t")
        ch = this.buffer[++i];
      if (!ch || ch === "#" || ch === `
`)
        return true;
      if (ch === "\r")
        return this.buffer[i + 1] === `
`;
      return false;
    }
    charAt(n) {
      return this.buffer[this.pos + n];
    }
    continueScalar(offset) {
      let ch = this.buffer[offset];
      if (this.indentNext > 0) {
        let indent = 0;
        while (ch === " ")
          ch = this.buffer[++indent + offset];
        if (ch === "\r") {
          const next = this.buffer[indent + offset + 1];
          if (next === `
` || !next && !this.atEnd)
            return offset + indent + 1;
        }
        return ch === `
` || indent >= this.indentNext || !ch && !this.atEnd ? offset + indent : -1;
      }
      if (ch === "-" || ch === ".") {
        const dt2 = this.buffer.substr(offset, 3);
        if ((dt2 === "---" || dt2 === "...") && isEmpty(this.buffer[offset + 3]))
          return -1;
      }
      return offset;
    }
    getLine() {
      let end = this.lineEndPos;
      if (typeof end !== "number" || end !== -1 && end < this.pos) {
        end = this.buffer.indexOf(`
`, this.pos);
        this.lineEndPos = end;
      }
      if (end === -1)
        return this.atEnd ? this.buffer.substring(this.pos) : null;
      if (this.buffer[end - 1] === "\r")
        end -= 1;
      return this.buffer.substring(this.pos, end);
    }
    hasChars(n) {
      return this.pos + n <= this.buffer.length;
    }
    setNext(state) {
      this.buffer = this.buffer.substring(this.pos);
      this.pos = 0;
      this.lineEndPos = null;
      this.next = state;
      return null;
    }
    peek(n) {
      return this.buffer.substr(this.pos, n);
    }
    *parseNext(next) {
      switch (next) {
        case "stream":
          return yield* this.parseStream();
        case "line-start":
          return yield* this.parseLineStart();
        case "block-start":
          return yield* this.parseBlockStart();
        case "doc":
          return yield* this.parseDocument();
        case "flow":
          return yield* this.parseFlowCollection();
        case "quoted-scalar":
          return yield* this.parseQuotedScalar();
        case "block-scalar":
          return yield* this.parseBlockScalar();
        case "plain-scalar":
          return yield* this.parsePlainScalar();
      }
    }
    *parseStream() {
      let line = this.getLine();
      if (line === null)
        return this.setNext("stream");
      if (line[0] === cst.BOM) {
        yield* this.pushCount(1);
        line = line.substring(1);
      }
      if (line[0] === "%") {
        let dirEnd = line.length;
        let cs2 = line.indexOf("#");
        while (cs2 !== -1) {
          const ch = line[cs2 - 1];
          if (ch === " " || ch === "\t") {
            dirEnd = cs2 - 1;
            break;
          } else {
            cs2 = line.indexOf("#", cs2 + 1);
          }
        }
        while (true) {
          const ch = line[dirEnd - 1];
          if (ch === " " || ch === "\t")
            dirEnd -= 1;
          else
            break;
        }
        const n = (yield* this.pushCount(dirEnd)) + (yield* this.pushSpaces(true));
        yield* this.pushCount(line.length - n);
        this.pushNewline();
        return "stream";
      }
      if (this.atLineEnd()) {
        const sp = yield* this.pushSpaces(true);
        yield* this.pushCount(line.length - sp);
        yield* this.pushNewline();
        return "stream";
      }
      yield cst.DOCUMENT;
      return yield* this.parseLineStart();
    }
    *parseLineStart() {
      const ch = this.charAt(0);
      if (!ch && !this.atEnd)
        return this.setNext("line-start");
      if (ch === "-" || ch === ".") {
        if (!this.atEnd && !this.hasChars(4))
          return this.setNext("line-start");
        const s = this.peek(3);
        if ((s === "---" || s === "...") && isEmpty(this.charAt(3))) {
          yield* this.pushCount(3);
          this.indentValue = 0;
          this.indentNext = 0;
          return s === "---" ? "doc" : "stream";
        }
      }
      this.indentValue = yield* this.pushSpaces(false);
      if (this.indentNext > this.indentValue && !isEmpty(this.charAt(1)))
        this.indentNext = this.indentValue;
      return yield* this.parseBlockStart();
    }
    *parseBlockStart() {
      const [ch0, ch1] = this.peek(2);
      if (!ch1 && !this.atEnd)
        return this.setNext("block-start");
      if ((ch0 === "-" || ch0 === "?" || ch0 === ":") && isEmpty(ch1)) {
        const n = (yield* this.pushCount(1)) + (yield* this.pushSpaces(true));
        this.indentNext = this.indentValue + 1;
        this.indentValue += n;
        return "block-start";
      }
      return "doc";
    }
    *parseDocument() {
      yield* this.pushSpaces(true);
      const line = this.getLine();
      if (line === null)
        return this.setNext("doc");
      let n = yield* this.pushIndicators();
      switch (line[n]) {
        case "#":
          yield* this.pushCount(line.length - n);
        case undefined:
          yield* this.pushNewline();
          return yield* this.parseLineStart();
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel = 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          return "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "doc";
        case '"':
        case "'":
          return yield* this.parseQuotedScalar();
        case "|":
        case ">":
          n += yield* this.parseBlockScalarHeader();
          n += yield* this.pushSpaces(true);
          yield* this.pushCount(line.length - n);
          yield* this.pushNewline();
          return yield* this.parseBlockScalar();
        default:
          return yield* this.parsePlainScalar();
      }
    }
    *parseFlowCollection() {
      let nl, sp;
      let indent = -1;
      do {
        nl = yield* this.pushNewline();
        if (nl > 0) {
          sp = yield* this.pushSpaces(false);
          this.indentValue = indent = sp;
        } else {
          sp = 0;
        }
        sp += yield* this.pushSpaces(true);
      } while (nl + sp > 0);
      const line = this.getLine();
      if (line === null)
        return this.setNext("flow");
      if (indent !== -1 && indent < this.indentNext && line[0] !== "#" || indent === 0 && (line.startsWith("---") || line.startsWith("...")) && isEmpty(line[3])) {
        const atFlowEndMarker = indent === this.indentNext - 1 && this.flowLevel === 1 && (line[0] === "]" || line[0] === "}");
        if (!atFlowEndMarker) {
          this.flowLevel = 0;
          yield cst.FLOW_END;
          return yield* this.parseLineStart();
        }
      }
      let n = 0;
      while (line[n] === ",") {
        n += yield* this.pushCount(1);
        n += yield* this.pushSpaces(true);
        this.flowKey = false;
      }
      n += yield* this.pushIndicators();
      switch (line[n]) {
        case undefined:
          return "flow";
        case "#":
          yield* this.pushCount(line.length - n);
          return "flow";
        case "{":
        case "[":
          yield* this.pushCount(1);
          this.flowKey = false;
          this.flowLevel += 1;
          return "flow";
        case "}":
        case "]":
          yield* this.pushCount(1);
          this.flowKey = true;
          this.flowLevel -= 1;
          return this.flowLevel ? "flow" : "doc";
        case "*":
          yield* this.pushUntil(isNotAnchorChar);
          return "flow";
        case '"':
        case "'":
          this.flowKey = true;
          return yield* this.parseQuotedScalar();
        case ":": {
          const next = this.charAt(1);
          if (this.flowKey || isEmpty(next) || next === ",") {
            this.flowKey = false;
            yield* this.pushCount(1);
            yield* this.pushSpaces(true);
            return "flow";
          }
        }
        default:
          this.flowKey = false;
          return yield* this.parsePlainScalar();
      }
    }
    *parseQuotedScalar() {
      const quote = this.charAt(0);
      let end = this.buffer.indexOf(quote, this.pos + 1);
      if (quote === "'") {
        while (end !== -1 && this.buffer[end + 1] === "'")
          end = this.buffer.indexOf("'", end + 2);
      } else {
        while (end !== -1) {
          let n = 0;
          while (this.buffer[end - 1 - n] === "\\")
            n += 1;
          if (n % 2 === 0)
            break;
          end = this.buffer.indexOf('"', end + 1);
        }
      }
      const qb = this.buffer.substring(0, end);
      let nl = qb.indexOf(`
`, this.pos);
      if (nl !== -1) {
        while (nl !== -1) {
          const cs2 = this.continueScalar(nl + 1);
          if (cs2 === -1)
            break;
          nl = qb.indexOf(`
`, cs2);
        }
        if (nl !== -1) {
          end = nl - (qb[nl - 1] === "\r" ? 2 : 1);
        }
      }
      if (end === -1) {
        if (!this.atEnd)
          return this.setNext("quoted-scalar");
        end = this.buffer.length;
      }
      yield* this.pushToIndex(end + 1, false);
      return this.flowLevel ? "flow" : "doc";
    }
    *parseBlockScalarHeader() {
      this.blockScalarIndent = -1;
      this.blockScalarKeep = false;
      let i = this.pos;
      while (true) {
        const ch = this.buffer[++i];
        if (ch === "+")
          this.blockScalarKeep = true;
        else if (ch > "0" && ch <= "9")
          this.blockScalarIndent = Number(ch) - 1;
        else if (ch !== "-")
          break;
      }
      return yield* this.pushUntil((ch) => isEmpty(ch) || ch === "#");
    }
    *parseBlockScalar() {
      let nl = this.pos - 1;
      let indent = 0;
      let ch;
      loop:
        for (let i2 = this.pos;ch = this.buffer[i2]; ++i2) {
          switch (ch) {
            case " ":
              indent += 1;
              break;
            case `
`:
              nl = i2;
              indent = 0;
              break;
            case "\r": {
              const next = this.buffer[i2 + 1];
              if (!next && !this.atEnd)
                return this.setNext("block-scalar");
              if (next === `
`)
                break;
            }
            default:
              break loop;
          }
        }
      if (!ch && !this.atEnd)
        return this.setNext("block-scalar");
      if (indent >= this.indentNext) {
        if (this.blockScalarIndent === -1)
          this.indentNext = indent;
        else {
          this.indentNext = this.blockScalarIndent + (this.indentNext === 0 ? 1 : this.indentNext);
        }
        do {
          const cs2 = this.continueScalar(nl + 1);
          if (cs2 === -1)
            break;
          nl = this.buffer.indexOf(`
`, cs2);
        } while (nl !== -1);
        if (nl === -1) {
          if (!this.atEnd)
            return this.setNext("block-scalar");
          nl = this.buffer.length;
        }
      }
      let i = nl + 1;
      ch = this.buffer[i];
      while (ch === " ")
        ch = this.buffer[++i];
      if (ch === "\t") {
        while (ch === "\t" || ch === " " || ch === "\r" || ch === `
`)
          ch = this.buffer[++i];
        nl = i - 1;
      } else if (!this.blockScalarKeep) {
        do {
          let i2 = nl - 1;
          let ch2 = this.buffer[i2];
          if (ch2 === "\r")
            ch2 = this.buffer[--i2];
          const lastChar = i2;
          while (ch2 === " ")
            ch2 = this.buffer[--i2];
          if (ch2 === `
` && i2 >= this.pos && i2 + 1 + indent > lastChar)
            nl = i2;
          else
            break;
        } while (true);
      }
      yield cst.SCALAR;
      yield* this.pushToIndex(nl + 1, true);
      return yield* this.parseLineStart();
    }
    *parsePlainScalar() {
      const inFlow = this.flowLevel > 0;
      let end = this.pos - 1;
      let i = this.pos - 1;
      let ch;
      while (ch = this.buffer[++i]) {
        if (ch === ":") {
          const next = this.buffer[i + 1];
          if (isEmpty(next) || inFlow && flowIndicatorChars.has(next))
            break;
          end = i;
        } else if (isEmpty(ch)) {
          let next = this.buffer[i + 1];
          if (ch === "\r") {
            if (next === `
`) {
              i += 1;
              ch = `
`;
              next = this.buffer[i + 1];
            } else
              end = i;
          }
          if (next === "#" || inFlow && flowIndicatorChars.has(next))
            break;
          if (ch === `
`) {
            const cs2 = this.continueScalar(i + 1);
            if (cs2 === -1)
              break;
            i = Math.max(i, cs2 - 2);
          }
        } else {
          if (inFlow && flowIndicatorChars.has(ch))
            break;
          end = i;
        }
      }
      if (!ch && !this.atEnd)
        return this.setNext("plain-scalar");
      yield cst.SCALAR;
      yield* this.pushToIndex(end + 1, true);
      return inFlow ? "flow" : "doc";
    }
    *pushCount(n) {
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos += n;
        return n;
      }
      return 0;
    }
    *pushToIndex(i, allowEmpty) {
      const s = this.buffer.slice(this.pos, i);
      if (s) {
        yield s;
        this.pos += s.length;
        return s.length;
      } else if (allowEmpty)
        yield "";
      return 0;
    }
    *pushIndicators() {
      let n = 0;
      loop:
        while (true) {
          switch (this.charAt(0)) {
            case "!":
              n += yield* this.pushTag();
              n += yield* this.pushSpaces(true);
              continue loop;
            case "&":
              n += yield* this.pushUntil(isNotAnchorChar);
              n += yield* this.pushSpaces(true);
              continue loop;
            case "-":
            case "?":
            case ":": {
              const inFlow = this.flowLevel > 0;
              const ch1 = this.charAt(1);
              if (isEmpty(ch1) || inFlow && flowIndicatorChars.has(ch1)) {
                if (!inFlow)
                  this.indentNext = this.indentValue + 1;
                else if (this.flowKey)
                  this.flowKey = false;
                n += yield* this.pushCount(1);
                n += yield* this.pushSpaces(true);
                continue loop;
              }
            }
          }
          break loop;
        }
      return n;
    }
    *pushTag() {
      if (this.charAt(1) === "<") {
        let i = this.pos + 2;
        let ch = this.buffer[i];
        while (!isEmpty(ch) && ch !== ">")
          ch = this.buffer[++i];
        return yield* this.pushToIndex(ch === ">" ? i + 1 : i, false);
      } else {
        let i = this.pos + 1;
        let ch = this.buffer[i];
        while (ch) {
          if (tagChars.has(ch))
            ch = this.buffer[++i];
          else if (ch === "%" && hexDigits.has(this.buffer[i + 1]) && hexDigits.has(this.buffer[i + 2])) {
            ch = this.buffer[i += 3];
          } else
            break;
        }
        return yield* this.pushToIndex(i, false);
      }
    }
    *pushNewline() {
      const ch = this.buffer[this.pos];
      if (ch === `
`)
        return yield* this.pushCount(1);
      else if (ch === "\r" && this.charAt(1) === `
`)
        return yield* this.pushCount(2);
      else
        return 0;
    }
    *pushSpaces(allowTabs) {
      let i = this.pos - 1;
      let ch;
      do {
        ch = this.buffer[++i];
      } while (ch === " " || allowTabs && ch === "\t");
      const n = i - this.pos;
      if (n > 0) {
        yield this.buffer.substr(this.pos, n);
        this.pos = i;
      }
      return n;
    }
    *pushUntil(test) {
      let i = this.pos;
      let ch = this.buffer[i];
      while (!test(ch))
        ch = this.buffer[++i];
      return yield* this.pushToIndex(i, false);
    }
  }
  exports.Lexer = Lexer;
});

// node_modules/yaml/dist/parse/line-counter.js
var require_line_counter = __commonJS(function(exports) {
  class LineCounter {
    constructor() {
      this.lineStarts = [];
      this.addNewLine = (offset) => this.lineStarts.push(offset);
      this.linePos = (offset) => {
        let low = 0;
        let high = this.lineStarts.length;
        while (low < high) {
          const mid = low + high >> 1;
          if (this.lineStarts[mid] < offset)
            low = mid + 1;
          else
            high = mid;
        }
        if (this.lineStarts[low] === offset)
          return { line: low + 1, col: 1 };
        if (low === 0)
          return { line: 0, col: offset };
        const start = this.lineStarts[low - 1];
        return { line: low, col: offset - start + 1 };
      };
    }
  }
  exports.LineCounter = LineCounter;
});

// node_modules/yaml/dist/parse/parser.js
var require_parser = __commonJS(function(exports) {
  var node_process = __require("process");
  var cst = require_cst();
  var lexer = require_lexer();
  function includesToken(list, type) {
    for (let i = 0;i < list.length; ++i)
      if (list[i].type === type)
        return true;
    return false;
  }
  function findNonEmptyIndex(list) {
    for (let i = 0;i < list.length; ++i) {
      switch (list[i].type) {
        case "space":
        case "comment":
        case "newline":
          break;
        default:
          return i;
      }
    }
    return -1;
  }
  function isFlowToken(token) {
    switch (token?.type) {
      case "alias":
      case "scalar":
      case "single-quoted-scalar":
      case "double-quoted-scalar":
      case "flow-collection":
        return true;
      default:
        return false;
    }
  }
  function getPrevProps(parent) {
    switch (parent.type) {
      case "document":
        return parent.start;
      case "block-map": {
        const it = parent.items[parent.items.length - 1];
        return it.sep ?? it.start;
      }
      case "block-seq":
        return parent.items[parent.items.length - 1].start;
      default:
        return [];
    }
  }
  function getFirstKeyStartProps(prev) {
    if (prev.length === 0)
      return [];
    let i = prev.length;
    loop:
      while (--i >= 0) {
        switch (prev[i].type) {
          case "doc-start":
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
          case "newline":
            break loop;
        }
      }
    while (prev[++i]?.type === "space") {}
    return prev.splice(i, prev.length);
  }
  function arrayPushArray(target, source) {
    if (source.length < 1e5)
      Array.prototype.push.apply(target, source);
    else
      for (let i = 0;i < source.length; ++i)
        target.push(source[i]);
  }
  function fixFlowSeqItems(fc) {
    if (fc.start.type === "flow-seq-start") {
      for (const it of fc.items) {
        if (it.sep && !it.value && !includesToken(it.start, "explicit-key-ind") && !includesToken(it.sep, "map-value-ind")) {
          if (it.key)
            it.value = it.key;
          delete it.key;
          if (isFlowToken(it.value)) {
            if (it.value.end)
              arrayPushArray(it.value.end, it.sep);
            else
              it.value.end = it.sep;
          } else
            arrayPushArray(it.start, it.sep);
          delete it.sep;
        }
      }
    }
  }

  class Parser {
    constructor(onNewLine) {
      this.atNewLine = true;
      this.atScalar = false;
      this.indent = 0;
      this.offset = 0;
      this.onKeyLine = false;
      this.stack = [];
      this.source = "";
      this.type = "";
      this.lexer = new lexer.Lexer;
      this.onNewLine = onNewLine;
    }
    *parse(source, incomplete = false) {
      if (this.onNewLine && this.offset === 0)
        this.onNewLine(0);
      for (const lexeme of this.lexer.lex(source, incomplete))
        yield* this.next(lexeme);
      if (!incomplete)
        yield* this.end();
    }
    *next(source) {
      this.source = source;
      if (node_process.env.LOG_TOKENS)
        console.log("|", cst.prettyToken(source));
      if (this.atScalar) {
        this.atScalar = false;
        yield* this.step();
        this.offset += source.length;
        return;
      }
      const type = cst.tokenType(source);
      if (!type) {
        const message = `Not a YAML token: ${source}`;
        yield* this.pop({ type: "error", offset: this.offset, message, source });
        this.offset += source.length;
      } else if (type === "scalar") {
        this.atNewLine = false;
        this.atScalar = true;
        this.type = "scalar";
      } else {
        this.type = type;
        yield* this.step();
        switch (type) {
          case "newline":
            this.atNewLine = true;
            this.indent = 0;
            if (this.onNewLine)
              this.onNewLine(this.offset + source.length);
            break;
          case "space":
            if (this.atNewLine && source[0] === " ")
              this.indent += source.length;
            break;
          case "explicit-key-ind":
          case "map-value-ind":
          case "seq-item-ind":
            if (this.atNewLine)
              this.indent += source.length;
            break;
          case "doc-mode":
          case "flow-error-end":
            return;
          default:
            this.atNewLine = false;
        }
        this.offset += source.length;
      }
    }
    *end() {
      while (this.stack.length > 0)
        yield* this.pop();
    }
    get sourceToken() {
      const st2 = {
        type: this.type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
      return st2;
    }
    *step() {
      const top = this.peek(1);
      if (this.type === "doc-end" && top?.type !== "doc-end") {
        while (this.stack.length > 0)
          yield* this.pop();
        this.stack.push({
          type: "doc-end",
          offset: this.offset,
          source: this.source
        });
        return;
      }
      if (!top)
        return yield* this.stream();
      switch (top.type) {
        case "document":
          return yield* this.document(top);
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return yield* this.scalar(top);
        case "block-scalar":
          return yield* this.blockScalar(top);
        case "block-map":
          return yield* this.blockMap(top);
        case "block-seq":
          return yield* this.blockSequence(top);
        case "flow-collection":
          return yield* this.flowCollection(top);
        case "doc-end":
          return yield* this.documentEnd(top);
      }
      yield* this.pop();
    }
    peek(n) {
      return this.stack[this.stack.length - n];
    }
    *pop(error) {
      const token = error ?? this.stack.pop();
      if (!token) {
        const message = "Tried to pop an empty stack";
        yield { type: "error", offset: this.offset, source: "", message };
      } else if (this.stack.length === 0) {
        yield token;
      } else {
        const top = this.peek(1);
        if (token.type === "block-scalar") {
          token.indent = "indent" in top ? top.indent : 0;
        } else if (token.type === "flow-collection" && top.type === "document") {
          token.indent = 0;
        }
        if (token.type === "flow-collection")
          fixFlowSeqItems(token);
        switch (top.type) {
          case "document":
            top.value = token;
            break;
          case "block-scalar":
            top.props.push(token);
            break;
          case "block-map": {
            const it = top.items[top.items.length - 1];
            if (it.value) {
              top.items.push({ start: [], key: token, sep: [] });
              this.onKeyLine = true;
              return;
            } else if (it.sep) {
              it.value = token;
            } else {
              Object.assign(it, { key: token, sep: [] });
              this.onKeyLine = !it.explicitKey;
              return;
            }
            break;
          }
          case "block-seq": {
            const it = top.items[top.items.length - 1];
            if (it.value)
              top.items.push({ start: [], value: token });
            else
              it.value = token;
            break;
          }
          case "flow-collection": {
            const it = top.items[top.items.length - 1];
            if (!it || it.value)
              top.items.push({ start: [], key: token, sep: [] });
            else if (it.sep)
              it.value = token;
            else
              Object.assign(it, { key: token, sep: [] });
            return;
          }
          default:
            yield* this.pop();
            yield* this.pop(token);
        }
        if ((top.type === "document" || top.type === "block-map" || top.type === "block-seq") && (token.type === "block-map" || token.type === "block-seq")) {
          const last = token.items[token.items.length - 1];
          if (last && !last.sep && !last.value && last.start.length > 0 && findNonEmptyIndex(last.start) === -1 && (token.indent === 0 || last.start.every((st2) => st2.type !== "comment" || st2.indent < token.indent))) {
            if (top.type === "document")
              top.end = last.start;
            else
              top.items.push({ start: last.start });
            token.items.splice(-1, 1);
          }
        }
      }
    }
    *stream() {
      switch (this.type) {
        case "directive-line":
          yield { type: "directive", offset: this.offset, source: this.source };
          return;
        case "byte-order-mark":
        case "space":
        case "comment":
        case "newline":
          yield this.sourceToken;
          return;
        case "doc-mode":
        case "doc-start": {
          const doc = {
            type: "document",
            offset: this.offset,
            start: []
          };
          if (this.type === "doc-start")
            doc.start.push(this.sourceToken);
          this.stack.push(doc);
          return;
        }
      }
      yield {
        type: "error",
        offset: this.offset,
        message: `Unexpected ${this.type} token in YAML stream`,
        source: this.source
      };
    }
    *document(doc) {
      if (doc.value)
        return yield* this.lineEnd(doc);
      switch (this.type) {
        case "doc-start": {
          if (findNonEmptyIndex(doc.start) !== -1) {
            yield* this.pop();
            yield* this.step();
          } else
            doc.start.push(this.sourceToken);
          return;
        }
        case "anchor":
        case "tag":
        case "space":
        case "comment":
        case "newline":
          doc.start.push(this.sourceToken);
          return;
      }
      const bv = this.startBlockValue(doc);
      if (bv)
        this.stack.push(bv);
      else {
        yield {
          type: "error",
          offset: this.offset,
          message: `Unexpected ${this.type} token in YAML document`,
          source: this.source
        };
      }
    }
    *scalar(scalar) {
      if (this.type === "map-value-ind") {
        const prev = getPrevProps(this.peek(2));
        const start = getFirstKeyStartProps(prev);
        let sep;
        if (scalar.end) {
          sep = scalar.end;
          sep.push(this.sourceToken);
          delete scalar.end;
        } else
          sep = [this.sourceToken];
        const map = {
          type: "block-map",
          offset: scalar.offset,
          indent: scalar.indent,
          items: [{ start, key: scalar, sep }]
        };
        this.onKeyLine = true;
        this.stack[this.stack.length - 1] = map;
      } else
        yield* this.lineEnd(scalar);
    }
    *blockScalar(scalar) {
      switch (this.type) {
        case "space":
        case "comment":
        case "newline":
          scalar.props.push(this.sourceToken);
          return;
        case "scalar":
          scalar.source = this.source;
          this.atNewLine = true;
          this.indent = 0;
          if (this.onNewLine) {
            let nl = this.source.indexOf(`
`) + 1;
            while (nl !== 0) {
              this.onNewLine(this.offset + nl);
              nl = this.source.indexOf(`
`, nl) + 1;
            }
          }
          yield* this.pop();
          break;
        default:
          yield* this.pop();
          yield* this.step();
      }
    }
    *blockMap(map) {
      const it = map.items[map.items.length - 1];
      switch (this.type) {
        case "newline":
          this.onKeyLine = false;
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            it.start.push(this.sourceToken);
          }
          return;
        case "space":
        case "comment":
          if (it.value) {
            map.items.push({ start: [this.sourceToken] });
          } else if (it.sep) {
            it.sep.push(this.sourceToken);
          } else {
            if (this.atIndentedComment(it.start, map.indent)) {
              const prev = map.items[map.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                map.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
      }
      if (this.indent >= map.indent) {
        const atMapIndent = !this.onKeyLine && this.indent === map.indent;
        const atNextItem = atMapIndent && (it.sep || it.explicitKey) && this.type !== "seq-item-ind";
        let start = [];
        if (atNextItem && it.sep && !it.value) {
          const nl = [];
          for (let i = 0;i < it.sep.length; ++i) {
            const st2 = it.sep[i];
            switch (st2.type) {
              case "newline":
                nl.push(i);
                break;
              case "space":
                break;
              case "comment":
                if (st2.indent > map.indent)
                  nl.length = 0;
                break;
              default:
                nl.length = 0;
            }
          }
          if (nl.length >= 2)
            start = it.sep.splice(nl[1]);
        }
        switch (this.type) {
          case "anchor":
          case "tag":
            if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start });
              this.onKeyLine = true;
            } else if (it.sep) {
              it.sep.push(this.sourceToken);
            } else {
              it.start.push(this.sourceToken);
            }
            return;
          case "explicit-key-ind":
            if (!it.sep && !it.explicitKey) {
              it.start.push(this.sourceToken);
              it.explicitKey = true;
            } else if (atNextItem || it.value) {
              start.push(this.sourceToken);
              map.items.push({ start, explicitKey: true });
            } else {
              this.stack.push({
                type: "block-map",
                offset: this.offset,
                indent: this.indent,
                items: [{ start: [this.sourceToken], explicitKey: true }]
              });
            }
            this.onKeyLine = true;
            return;
          case "map-value-ind":
            if (it.explicitKey) {
              if (!it.sep) {
                if (includesToken(it.start, "newline")) {
                  Object.assign(it, { key: null, sep: [this.sourceToken] });
                } else {
                  const start2 = getFirstKeyStartProps(it.start);
                  this.stack.push({
                    type: "block-map",
                    offset: this.offset,
                    indent: this.indent,
                    items: [{ start: start2, key: null, sep: [this.sourceToken] }]
                  });
                }
              } else if (it.value) {
                map.items.push({ start: [], key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start, key: null, sep: [this.sourceToken] }]
                });
              } else if (isFlowToken(it.key) && !includesToken(it.sep, "newline")) {
                const start2 = getFirstKeyStartProps(it.start);
                const key = it.key;
                const sep = it.sep;
                sep.push(this.sourceToken);
                delete it.key;
                delete it.sep;
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: start2, key, sep }]
                });
              } else if (start.length > 0) {
                it.sep = it.sep.concat(start, this.sourceToken);
              } else {
                it.sep.push(this.sourceToken);
              }
            } else {
              if (!it.sep) {
                Object.assign(it, { key: null, sep: [this.sourceToken] });
              } else if (it.value || atNextItem) {
                map.items.push({ start, key: null, sep: [this.sourceToken] });
              } else if (includesToken(it.sep, "map-value-ind")) {
                this.stack.push({
                  type: "block-map",
                  offset: this.offset,
                  indent: this.indent,
                  items: [{ start: [], key: null, sep: [this.sourceToken] }]
                });
              } else {
                it.sep.push(this.sourceToken);
              }
            }
            this.onKeyLine = true;
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs2 = this.flowScalar(this.type);
            if (atNextItem || it.value) {
              map.items.push({ start, key: fs2, sep: [] });
              this.onKeyLine = true;
            } else if (it.sep) {
              this.stack.push(fs2);
            } else {
              Object.assign(it, { key: fs2, sep: [] });
              this.onKeyLine = true;
            }
            return;
          }
          default: {
            const bv = this.startBlockValue(map);
            if (bv) {
              if (bv.type === "block-seq") {
                if (!it.explicitKey && it.sep && !includesToken(it.sep, "newline")) {
                  yield* this.pop({
                    type: "error",
                    offset: this.offset,
                    message: "Unexpected block-seq-ind on same line with key",
                    source: this.source
                  });
                  return;
                }
              } else if (atMapIndent) {
                map.items.push({ start });
              }
              this.stack.push(bv);
              return;
            }
          }
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *blockSequence(seq) {
      const it = seq.items[seq.items.length - 1];
      switch (this.type) {
        case "newline":
          if (it.value) {
            const end = "end" in it.value ? it.value.end : undefined;
            const last = Array.isArray(end) ? end[end.length - 1] : undefined;
            if (last?.type === "comment")
              end?.push(this.sourceToken);
            else
              seq.items.push({ start: [this.sourceToken] });
          } else
            it.start.push(this.sourceToken);
          return;
        case "space":
        case "comment":
          if (it.value)
            seq.items.push({ start: [this.sourceToken] });
          else {
            if (this.atIndentedComment(it.start, seq.indent)) {
              const prev = seq.items[seq.items.length - 2];
              const end = prev?.value?.end;
              if (Array.isArray(end)) {
                arrayPushArray(end, it.start);
                end.push(this.sourceToken);
                seq.items.pop();
                return;
              }
            }
            it.start.push(this.sourceToken);
          }
          return;
        case "anchor":
        case "tag":
          if (it.value || this.indent <= seq.indent)
            break;
          it.start.push(this.sourceToken);
          return;
        case "seq-item-ind":
          if (this.indent !== seq.indent)
            break;
          if (it.value || includesToken(it.start, "seq-item-ind"))
            seq.items.push({ start: [this.sourceToken] });
          else
            it.start.push(this.sourceToken);
          return;
      }
      if (this.indent > seq.indent) {
        const bv = this.startBlockValue(seq);
        if (bv) {
          this.stack.push(bv);
          return;
        }
      }
      yield* this.pop();
      yield* this.step();
    }
    *flowCollection(fc) {
      const it = fc.items[fc.items.length - 1];
      if (this.type === "flow-error-end") {
        let top;
        do {
          yield* this.pop();
          top = this.peek(1);
        } while (top?.type === "flow-collection");
      } else if (fc.end.length === 0) {
        switch (this.type) {
          case "comma":
          case "explicit-key-ind":
            if (!it || it.sep)
              fc.items.push({ start: [this.sourceToken] });
            else
              it.start.push(this.sourceToken);
            return;
          case "map-value-ind":
            if (!it || it.value)
              fc.items.push({ start: [], key: null, sep: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              Object.assign(it, { key: null, sep: [this.sourceToken] });
            return;
          case "space":
          case "comment":
          case "newline":
          case "anchor":
          case "tag":
            if (!it || it.value)
              fc.items.push({ start: [this.sourceToken] });
            else if (it.sep)
              it.sep.push(this.sourceToken);
            else
              it.start.push(this.sourceToken);
            return;
          case "alias":
          case "scalar":
          case "single-quoted-scalar":
          case "double-quoted-scalar": {
            const fs2 = this.flowScalar(this.type);
            if (!it || it.value)
              fc.items.push({ start: [], key: fs2, sep: [] });
            else if (it.sep)
              this.stack.push(fs2);
            else
              Object.assign(it, { key: fs2, sep: [] });
            return;
          }
          case "flow-map-end":
          case "flow-seq-end":
            fc.end.push(this.sourceToken);
            return;
        }
        const bv = this.startBlockValue(fc);
        if (bv)
          this.stack.push(bv);
        else {
          yield* this.pop();
          yield* this.step();
        }
      } else {
        const parent = this.peek(2);
        if (parent.type === "block-map" && (this.type === "map-value-ind" && parent.indent === fc.indent || this.type === "newline" && !parent.items[parent.items.length - 1].sep)) {
          yield* this.pop();
          yield* this.step();
        } else if (this.type === "map-value-ind" && parent.type !== "flow-collection") {
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          fixFlowSeqItems(fc);
          const sep = fc.end.splice(1, fc.end.length);
          sep.push(this.sourceToken);
          const map = {
            type: "block-map",
            offset: fc.offset,
            indent: fc.indent,
            items: [{ start, key: fc, sep }]
          };
          this.onKeyLine = true;
          this.stack[this.stack.length - 1] = map;
        } else {
          yield* this.lineEnd(fc);
        }
      }
    }
    flowScalar(type) {
      if (this.onNewLine) {
        let nl = this.source.indexOf(`
`) + 1;
        while (nl !== 0) {
          this.onNewLine(this.offset + nl);
          nl = this.source.indexOf(`
`, nl) + 1;
        }
      }
      return {
        type,
        offset: this.offset,
        indent: this.indent,
        source: this.source
      };
    }
    startBlockValue(parent) {
      switch (this.type) {
        case "alias":
        case "scalar":
        case "single-quoted-scalar":
        case "double-quoted-scalar":
          return this.flowScalar(this.type);
        case "block-scalar-header":
          return {
            type: "block-scalar",
            offset: this.offset,
            indent: this.indent,
            props: [this.sourceToken],
            source: ""
          };
        case "flow-map-start":
        case "flow-seq-start":
          return {
            type: "flow-collection",
            offset: this.offset,
            indent: this.indent,
            start: this.sourceToken,
            items: [],
            end: []
          };
        case "seq-item-ind":
          return {
            type: "block-seq",
            offset: this.offset,
            indent: this.indent,
            items: [{ start: [this.sourceToken] }]
          };
        case "explicit-key-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          start.push(this.sourceToken);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, explicitKey: true }]
          };
        }
        case "map-value-ind": {
          this.onKeyLine = true;
          const prev = getPrevProps(parent);
          const start = getFirstKeyStartProps(prev);
          return {
            type: "block-map",
            offset: this.offset,
            indent: this.indent,
            items: [{ start, key: null, sep: [this.sourceToken] }]
          };
        }
      }
      return null;
    }
    atIndentedComment(start, indent) {
      if (this.type !== "comment")
        return false;
      if (this.indent <= indent)
        return false;
      return start.every((st2) => st2.type === "newline" || st2.type === "space");
    }
    *documentEnd(docEnd) {
      if (this.type !== "doc-mode") {
        if (docEnd.end)
          docEnd.end.push(this.sourceToken);
        else
          docEnd.end = [this.sourceToken];
        if (this.type === "newline")
          yield* this.pop();
      }
    }
    *lineEnd(token) {
      switch (this.type) {
        case "comma":
        case "doc-start":
        case "doc-end":
        case "flow-seq-end":
        case "flow-map-end":
        case "map-value-ind":
          yield* this.pop();
          yield* this.step();
          break;
        case "newline":
          this.onKeyLine = false;
        case "space":
        case "comment":
        default:
          if (token.end)
            token.end.push(this.sourceToken);
          else
            token.end = [this.sourceToken];
          if (this.type === "newline")
            yield* this.pop();
      }
    }
  }
  exports.Parser = Parser;
});

// node_modules/yaml/dist/public-api.js
var require_public_api = __commonJS(function(exports) {
  var composer = require_composer();
  var Document = require_Document();
  var errors = require_errors();
  var log = require_log();
  var identity = require_identity();
  var lineCounter = require_line_counter();
  var parser = require_parser();
  function parseOptions(options) {
    const prettyErrors = options.prettyErrors !== false;
    const lineCounter$1 = options.lineCounter || prettyErrors && new lineCounter.LineCounter || null;
    return { lineCounter: lineCounter$1, prettyErrors };
  }
  function parseAllDocuments(source, options = {}) {
    const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
    const composer$1 = new composer.Composer(options);
    const docs = Array.from(composer$1.compose(parser$1.parse(source)));
    if (prettyErrors && lineCounter2)
      for (const doc of docs) {
        doc.errors.forEach(errors.prettifyError(source, lineCounter2));
        doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
      }
    if (docs.length > 0)
      return docs;
    return Object.assign([], { empty: true }, composer$1.streamInfo());
  }
  function parseDocument(source, options = {}) {
    const { lineCounter: lineCounter2, prettyErrors } = parseOptions(options);
    const parser$1 = new parser.Parser(lineCounter2?.addNewLine);
    const composer$1 = new composer.Composer(options);
    let doc = null;
    for (const _doc of composer$1.compose(parser$1.parse(source), true, source.length)) {
      if (!doc)
        doc = _doc;
      else if (doc.options.logLevel !== "silent") {
        doc.errors.push(new errors.YAMLParseError(_doc.range.slice(0, 2), "MULTIPLE_DOCS", "Source contains multiple documents; please use YAML.parseAllDocuments()"));
        break;
      }
    }
    if (prettyErrors && lineCounter2) {
      doc.errors.forEach(errors.prettifyError(source, lineCounter2));
      doc.warnings.forEach(errors.prettifyError(source, lineCounter2));
    }
    return doc;
  }
  function parse(src, reviver, options) {
    let _reviver = undefined;
    if (typeof reviver === "function") {
      _reviver = reviver;
    } else if (options === undefined && reviver && typeof reviver === "object") {
      options = reviver;
    }
    const doc = parseDocument(src, options);
    if (!doc)
      return null;
    doc.warnings.forEach((warning) => log.warn(doc.options.logLevel, warning));
    if (doc.errors.length > 0) {
      if (doc.options.logLevel !== "silent")
        throw doc.errors[0];
      else
        doc.errors = [];
    }
    return doc.toJS(Object.assign({ reviver: _reviver }, options));
  }
  function stringify(value, replacer, options) {
    let _replacer = null;
    if (typeof replacer === "function" || Array.isArray(replacer)) {
      _replacer = replacer;
    } else if (options === undefined && replacer) {
      options = replacer;
    }
    if (typeof options === "string")
      options = options.length;
    if (typeof options === "number") {
      const indent = Math.round(options);
      options = indent < 1 ? undefined : indent > 8 ? { indent: 8 } : { indent };
    }
    if (value === undefined) {
      const { keepUndefined } = options ?? replacer ?? {};
      if (!keepUndefined)
        return;
    }
    if (identity.isDocument(value) && !_replacer)
      return value.toString(options);
    return new Document.Document(value, _replacer, options).toString(options);
  }
  exports.parse = parse;
  exports.parseAllDocuments = parseAllDocuments;
  exports.parseDocument = parseDocument;
  exports.stringify = stringify;
});

// src/worker.ts
import { existsSync as existsSync3 } from "node:fs";
import { homedir as homedir2, tmpdir as tmpdir2 } from "node:os";

// src/folder-picker.ts
var OSASCRIPT_BIN = "/usr/bin/osascript";
var CHOOSE_FOLDER = "POSIX path of (choose folder)";
var USER_CANCELLED = "(-128)";
function folderPicker(platform, run) {
  if (platform !== "darwin")
    return null;
  return async () => {
    const { code, stdout, stderr } = await run(OSASCRIPT_BIN, ["-e", CHOOSE_FOLDER]);
    if (code === 0)
      return stdout.replace(/\r?\n$/, "");
    if (stderr.includes(USER_CANCELLED))
      return null;
    throw new Error(stderr.trim() || `osascript exited with code ${code}`);
  };
}

// src/search.ts
var SKILLS_SH = "https://skills.sh";
var SEARCH_LIMIT = 20;

class SearchError extends Error {
  code;
  constructor(code, message) {
    super(message);
    this.name = "SearchError";
    this.code = code;
  }
}
function asHit(raw) {
  if (typeof raw !== "object" || raw === null)
    return null;
  const { name, source, skillId, installs } = raw;
  if (typeof name !== "string" || typeof source !== "string" || typeof skillId !== "string")
    return null;
  return { name, source, skillId, installs: typeof installs === "number" && Number.isFinite(installs) ? installs : 0 };
}
async function searchSkills(query, opts) {
  const url = `${opts.base}/api/search?${new URLSearchParams({ q: query, limit: String(SEARCH_LIMIT) })}`;
  let response;
  try {
    response = await opts.fetch(url, { signal: opts.signal });
  } catch (error) {
    throw new SearchError("unreachable", error instanceof Error ? error.message : String(error));
  }
  if (!response.ok)
    throw new SearchError("http", `HTTP ${response.status}`);
  let body;
  try {
    body = await response.json();
  } catch {
    throw new SearchError("unreadable", "response is not JSON");
  }
  const skills = body?.skills;
  if (skills === undefined)
    return [];
  if (!Array.isArray(skills))
    throw new SearchError("unreadable", "skills is not an array");
  const hits = [];
  for (const raw of skills) {
    const hit = asHit(raw);
    if (hit)
      hits.push(hit);
  }
  return hits.sort((a, b) => b.installs - a.installs);
}

// node_modules/skills/dist/index.mjs
var exports_dist = {};
__export(exports_dist, {
  detectAgents: () => detectAgents,
  diagnostics: () => diagnostics,
  getSupportedAgents: () => getSupportedAgents,
  installSkills: () => installSkills,
  isDiagnostic: () => isDiagnostic,
  listSkills: () => listSkills,
  removeSkills: () => removeSkills,
  resolveSource: () => resolveSource,
  version: () => version
});

// node_modules/skills/dist/_chunks/libs/@clack/core.mjs
var getCodePointsLength = (() => {
  const SURROGATE_PAIR_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g;
  return (input) => {
    let surrogatePairsNr = 0;
    SURROGATE_PAIR_RE.lastIndex = 0;
    while (SURROGATE_PAIR_RE.test(input))
      surrogatePairsNr += 1;
    return input.length - surrogatePairsNr;
  };
})();
var ANSI_ESCAPE_BELL = "\x07";
var ANSI_CSI = "[";
var ANSI_OSC = "]";
var ANSI_ESCAPE_LINK = `${ANSI_OSC}8;;`;
var GROUP_REGEX = new RegExp(`(?:\\${ANSI_CSI}(?<code>\\d+)m|\\${ANSI_ESCAPE_LINK}(?<uri>.*)${ANSI_ESCAPE_BELL})`, "y");
var ESC = "\x1B";
var CSI = `${ESC}[`;
var cursor = {
  to(x, y) {
    if (!y)
      return `${CSI}${x + 1}G`;
    return `${CSI}${y + 1};${x + 1}H`;
  },
  move(x, y) {
    let ret = "";
    if (x < 0)
      ret += `${CSI}${-x}D`;
    else if (x > 0)
      ret += `${CSI}${x}C`;
    if (y < 0)
      ret += `${CSI}${-y}A`;
    else if (y > 0)
      ret += `${CSI}${y}B`;
    return ret;
  },
  up: (count = 1) => `${CSI}${count}A`,
  down: (count = 1) => `${CSI}${count}B`,
  forward: (count = 1) => `${CSI}${count}C`,
  backward: (count = 1) => `${CSI}${count}D`,
  nextLine: (count = 1) => `${CSI}E`.repeat(count),
  prevLine: (count = 1) => `${CSI}F`.repeat(count),
  left: `${CSI}G`,
  hide: `${CSI}?25l`,
  show: `${CSI}?25h`,
  save: `${ESC}7`,
  restore: `${ESC}8`
};
var erase = {
  screen: `${CSI}2J`,
  up: (count = 1) => `${CSI}1J`.repeat(count),
  down: (count = 1) => `${CSI}J`.repeat(count),
  line: `${CSI}2K`,
  lineEnd: `${CSI}K`,
  lineStart: `${CSI}1K`,
  lines(count) {
    let clear = "";
    for (let i = 0;i < count; i++)
      clear += this.line + (i < count - 1 ? cursor.up() : "");
    if (count)
      clear += cursor.left;
    return clear;
  }
};
var settings = {
  actions: /* @__PURE__ */ new Set([
    "up",
    "down",
    "left",
    "right",
    "space",
    "enter",
    "cancel"
  ]),
  aliases: /* @__PURE__ */ new Map([
    ["k", "up"],
    ["j", "down"],
    ["h", "left"],
    ["l", "right"],
    ["\x03", "cancel"],
    ["escape", "cancel"]
  ]),
  messages: {
    cancel: "Canceled",
    error: "Something went wrong"
  },
  withGuide: true,
  accessible: undefined,
  date: {
    monthNames: [...[
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ]],
    messages: {
      required: "Please enter a valid date",
      invalidMonth: "There are only 12 months in a year",
      invalidDay: (n, e) => `There are only ${n} days in ${e}`,
      afterMin: (n) => `Date must be on or after ${n.toISOString().slice(0, 10)}`,
      beforeMax: (n) => `Date must be on or before ${n.toISOString().slice(0, 10)}`
    }
  }
};
var R = globalThis.process.platform.startsWith("win");
var CANCEL_SYMBOL = Symbol("clack:cancel");

// node_modules/skills/dist/_chunks/libs/@clack/prompts.mjs
import { styleText } from "node:util";
import process$1 from "node:process";
function isUnicodeSupported() {
  if (process$1.platform !== "win32")
    return process$1.env.TERM !== "linux";
  return Boolean(process$1.env.CI) || Boolean(process$1.env.WT_SESSION) || Boolean(process$1.env.TERMINUS_SUBLIME) || process$1.env.ConEmuTask === "{cmd::Cmder}" || process$1.env.TERM_PROGRAM === "Terminus-Sublime" || process$1.env.TERM_PROGRAM === "vscode" || process$1.env.TERM === "xterm-256color" || process$1.env.TERM === "alacritty" || process$1.env.TERMINAL_EMULATOR === "JetBrains-JediTerm";
}
var unicode = isUnicodeSupported();
var unicodeOr = (e, o) => unicode ? e : o;
var S_STEP_ACTIVE = unicodeOr("◆", "*");
var S_STEP_CANCEL = unicodeOr("■", "x");
var S_STEP_ERROR = unicodeOr("▲", "x");
var S_STEP_SUBMIT = unicodeOr("◇", "o");
var S_BAR_START = unicodeOr("┌", "T");
var S_BAR = unicodeOr("│", "|");
var S_BAR_END = unicodeOr("└", "—");
var S_RADIO_ACTIVE = unicodeOr("●", ">");
var S_RADIO_INACTIVE = unicodeOr("○", " ");
var S_CHECKBOX_ACTIVE = unicodeOr("◻", "[•]");
var S_CHECKBOX_SELECTED = unicodeOr("◼", "[+]");
var S_CHECKBOX_INACTIVE = unicodeOr("◻", "[ ]");
var S_BAR_H = unicodeOr("─", "-");
var S_CORNER_TOP_RIGHT = unicodeOr("╮", "+");
var S_CONNECT_LEFT = unicodeOr("├", "+");
var S_CORNER_BOTTOM_RIGHT = unicodeOr("╯", "+");
var S_CORNER_BOTTOM_LEFT = unicodeOr("╰", "+");
var S_INFO = unicodeOr("●", "•");
var S_SUCCESS = unicodeOr("◆", "*");
var S_WARN = unicodeOr("▲", "!");
var S_ERROR = unicodeOr("■", "x");
var MULTISELECT_INSTRUCTIONS = [
  `${styleText("dim", "↑/↓")} to navigate`,
  `${styleText("dim", "Space:")} select`,
  `${styleText("dim", "Enter:")} confirm`
];
var SELECT_INSTRUCTIONS = [`${styleText("dim", "↑/↓")} to navigate`, `${styleText("dim", "Enter:")} confirm`];
`${styleText("gray", S_BAR)}`;

// node_modules/skills/dist/_chunks/rolldown-runtime.mjs
import { createRequire as createRequire2 } from "node:module";
var __create = Object.create;
var __defProp2 = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod, mod.exports), cb = null), mod.exports);
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function")
    for (var keys = __getOwnPropNames(from), i = 0, n = keys.length, key;i < n; i++) {
      key = keys[i];
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp2(to, key, {
          get: ((k) => from[k]).bind(null, key),
          enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable
        });
    }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(isNodeMode || !mod || !mod.__esModule || !__hasOwnProp.call(mod, "default") ? __defProp2(target, "default", {
  value: mod,
  enumerable: true
}) : target, mod));
var __require2 = /* @__PURE__ */ (() => createRequire2(import.meta.url))();

// node_modules/skills/dist/_chunks/libs/picocolors.mjs
var require_picocolors = /* @__PURE__ */ __commonJSMin((exports, module) => {
  let p = process || {};
  let argv = p.argv || [];
  let env = p.env || {};
  let isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
  let formatter = (open, close, replace = open) => (input) => {
    let string = "" + input, index = string.indexOf(close, open.length);
    return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
  };
  let replaceClose = (string, close, replace, index) => {
    let result = "", cursor2 = 0;
    do {
      result += string.substring(cursor2, index) + replace;
      cursor2 = index + close.length;
      index = string.indexOf(close, cursor2);
    } while (~index);
    return result + string.substring(cursor2);
  };
  let createColors = (enabled = isColorSupported) => {
    let f = enabled ? formatter : () => String;
    return {
      isColorSupported: enabled,
      reset: f("\x1B[0m", "\x1B[0m"),
      bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
      dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
      italic: f("\x1B[3m", "\x1B[23m"),
      underline: f("\x1B[4m", "\x1B[24m"),
      inverse: f("\x1B[7m", "\x1B[27m"),
      hidden: f("\x1B[8m", "\x1B[28m"),
      strikethrough: f("\x1B[9m", "\x1B[29m"),
      black: f("\x1B[30m", "\x1B[39m"),
      red: f("\x1B[31m", "\x1B[39m"),
      green: f("\x1B[32m", "\x1B[39m"),
      yellow: f("\x1B[33m", "\x1B[39m"),
      blue: f("\x1B[34m", "\x1B[39m"),
      magenta: f("\x1B[35m", "\x1B[39m"),
      cyan: f("\x1B[36m", "\x1B[39m"),
      white: f("\x1B[37m", "\x1B[39m"),
      gray: f("\x1B[90m", "\x1B[39m"),
      bgBlack: f("\x1B[40m", "\x1B[49m"),
      bgRed: f("\x1B[41m", "\x1B[49m"),
      bgGreen: f("\x1B[42m", "\x1B[49m"),
      bgYellow: f("\x1B[43m", "\x1B[49m"),
      bgBlue: f("\x1B[44m", "\x1B[49m"),
      bgMagenta: f("\x1B[45m", "\x1B[49m"),
      bgCyan: f("\x1B[46m", "\x1B[49m"),
      bgWhite: f("\x1B[47m", "\x1B[49m"),
      blackBright: f("\x1B[90m", "\x1B[39m"),
      redBright: f("\x1B[91m", "\x1B[39m"),
      greenBright: f("\x1B[92m", "\x1B[39m"),
      yellowBright: f("\x1B[93m", "\x1B[39m"),
      blueBright: f("\x1B[94m", "\x1B[39m"),
      magentaBright: f("\x1B[95m", "\x1B[39m"),
      cyanBright: f("\x1B[96m", "\x1B[39m"),
      whiteBright: f("\x1B[97m", "\x1B[39m"),
      bgBlackBright: f("\x1B[100m", "\x1B[49m"),
      bgRedBright: f("\x1B[101m", "\x1B[49m"),
      bgGreenBright: f("\x1B[102m", "\x1B[49m"),
      bgYellowBright: f("\x1B[103m", "\x1B[49m"),
      bgBlueBright: f("\x1B[104m", "\x1B[49m"),
      bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
      bgCyanBright: f("\x1B[106m", "\x1B[49m"),
      bgWhiteBright: f("\x1B[107m", "\x1B[49m")
    };
  };
  module.exports = createColors();
  module.exports.createColors = createColors;
});

// node_modules/skills/dist/_chunks/libs/@simple-git/args-pathspec.mjs
var t = /* @__PURE__ */ new WeakMap;
function c(...n) {
  const e = new String(n);
  return t.set(e, n), e;
}
function r2(n) {
  return n instanceof String && t.has(n);
}
function o(n) {
  return t.get(n) ?? [];
}

// node_modules/skills/dist/_chunks/libs/@kwsites/file-exists.mjs
var require_ms = /* @__PURE__ */ __commonJSMin((exports, module) => {
  var s = 1000;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  module.exports = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0)
      return parse(val);
    else if (type === "number" && isFinite(val))
      return options.long ? fmtLong(val) : fmtShort(val);
    throw new Error("val is not a non-empty string or a valid number. val=" + JSON.stringify(val));
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100)
      return;
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(str);
    if (!match)
      return;
    var n = parseFloat(match[1]);
    switch ((match[2] || "ms").toLowerCase()) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return;
    }
  }
  function fmtShort(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d)
      return Math.round(ms / d) + "d";
    if (msAbs >= h)
      return Math.round(ms / h) + "h";
    if (msAbs >= m)
      return Math.round(ms / m) + "m";
    if (msAbs >= s)
      return Math.round(ms / s) + "s";
    return ms + "ms";
  }
  function fmtLong(ms) {
    var msAbs = Math.abs(ms);
    if (msAbs >= d)
      return plural(ms, msAbs, d, "day");
    if (msAbs >= h)
      return plural(ms, msAbs, h, "hour");
    if (msAbs >= m)
      return plural(ms, msAbs, m, "minute");
    if (msAbs >= s)
      return plural(ms, msAbs, s, "second");
    return ms + " ms";
  }
  function plural(ms, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms / n) + " " + name + (isPlural ? "s" : "");
  }
});
var require_common = /* @__PURE__ */ __commonJSMin((exports, module) => {
  function setup(env) {
    createDebug.debug = createDebug;
    createDebug.default = createDebug;
    createDebug.coerce = coerce;
    createDebug.disable = disable;
    createDebug.enable = enable;
    createDebug.enabled = enabled;
    createDebug.humanize = require_ms();
    createDebug.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug[key] = env[key];
    });
    createDebug.names = [];
    createDebug.skips = [];
    createDebug.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0;i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug.colors[Math.abs(hash) % createDebug.colors.length];
    }
    createDebug.selectColor = selectColor;
    function createDebug(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug(...args) {
        if (!debug.enabled)
          return;
        const self = debug;
        const curr = Number(/* @__PURE__ */ new Date);
        self.diff = curr - (prevTime || curr);
        self.prev = prevTime;
        self.curr = curr;
        prevTime = curr;
        args[0] = createDebug.coerce(args[0]);
        if (typeof args[0] !== "string")
          args.unshift("%O");
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if (match === "%%")
            return "%";
          index++;
          const formatter = createDebug.formatters[format];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug.formatArgs.call(self, args);
        (self.log || createDebug.log).apply(self, args);
      }
      debug.namespace = namespace;
      debug.useColors = createDebug.useColors();
      debug.color = createDebug.selectColor(namespace);
      debug.extend = extend;
      debug.destroy = createDebug.destroy;
      Object.defineProperty(debug, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null)
            return enableOverride;
          if (namespacesCache !== createDebug.namespaces) {
            namespacesCache = createDebug.namespaces;
            enabledCache = createDebug.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug.init === "function")
        createDebug.init(debug);
      return debug;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug.save(namespaces);
      createDebug.namespaces = namespaces;
      createDebug.names = [];
      createDebug.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split)
        if (ns[0] === "-")
          createDebug.skips.push(ns.slice(1));
        else
          createDebug.names.push(ns);
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length)
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else
          return false;
      while (templateIndex < template.length && template[templateIndex] === "*")
        templateIndex++;
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [...createDebug.names, ...createDebug.skips.map((namespace) => "-" + namespace)].join(",");
      createDebug.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug.skips)
        if (matchesTemplate(name, skip))
          return false;
      for (const ns of createDebug.names)
        if (matchesTemplate(name, ns))
          return true;
      return false;
    }
    function coerce(val) {
      if (val instanceof Error)
        return val.stack || val.message;
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug.enable(createDebug.load());
    return createDebug;
  }
  module.exports = setup;
});
var require_browser = /* @__PURE__ */ __commonJSMin((exports, module) => {
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.storage = localstorage();
  exports.destroy = (() => {
    let warned = false;
    return () => {
      if (!warned) {
        warned = true;
        console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
      }
    };
  })();
  exports.colors = [
    "#0000CC",
    "#0000FF",
    "#0033CC",
    "#0033FF",
    "#0066CC",
    "#0066FF",
    "#0099CC",
    "#0099FF",
    "#00CC00",
    "#00CC33",
    "#00CC66",
    "#00CC99",
    "#00CCCC",
    "#00CCFF",
    "#3300CC",
    "#3300FF",
    "#3333CC",
    "#3333FF",
    "#3366CC",
    "#3366FF",
    "#3399CC",
    "#3399FF",
    "#33CC00",
    "#33CC33",
    "#33CC66",
    "#33CC99",
    "#33CCCC",
    "#33CCFF",
    "#6600CC",
    "#6600FF",
    "#6633CC",
    "#6633FF",
    "#66CC00",
    "#66CC33",
    "#9900CC",
    "#9900FF",
    "#9933CC",
    "#9933FF",
    "#99CC00",
    "#99CC33",
    "#CC0000",
    "#CC0033",
    "#CC0066",
    "#CC0099",
    "#CC00CC",
    "#CC00FF",
    "#CC3300",
    "#CC3333",
    "#CC3366",
    "#CC3399",
    "#CC33CC",
    "#CC33FF",
    "#CC6600",
    "#CC6633",
    "#CC9900",
    "#CC9933",
    "#CCCC00",
    "#CCCC33",
    "#FF0000",
    "#FF0033",
    "#FF0066",
    "#FF0099",
    "#FF00CC",
    "#FF00FF",
    "#FF3300",
    "#FF3333",
    "#FF3366",
    "#FF3399",
    "#FF33CC",
    "#FF33FF",
    "#FF6600",
    "#FF6633",
    "#FF9900",
    "#FF9933",
    "#FFCC00",
    "#FFCC33"
  ];
  function useColors() {
    if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs))
      return true;
    if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/))
      return false;
    let m;
    return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
  }
  function formatArgs(args) {
    args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
    if (!this.useColors)
      return;
    const c2 = "color: " + this.color;
    args.splice(1, 0, c2, "color: inherit");
    let index = 0;
    let lastC = 0;
    args[0].replace(/%[a-zA-Z%]/g, (match) => {
      if (match === "%%")
        return;
      index++;
      if (match === "%c")
        lastC = index;
    });
    args.splice(lastC, 0, c2);
  }
  exports.log = console.debug || console.log || (() => {});
  function save(namespaces) {
    try {
      if (namespaces)
        exports.storage.setItem("debug", namespaces);
      else
        exports.storage.removeItem("debug");
    } catch (error) {}
  }
  function load() {
    let r3;
    try {
      r3 = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
    } catch (error) {}
    if (!r3 && typeof process !== "undefined" && "env" in process)
      r3 = process.env.DEBUG;
    return r3;
  }
  function localstorage() {
    try {
      return localStorage;
    } catch (error) {}
  }
  module.exports = require_common()(exports);
  const { formatters } = module.exports;
  formatters.j = function(v) {
    try {
      return JSON.stringify(v);
    } catch (error) {
      return "[UnexpectedJSONParseError]: " + error.message;
    }
  };
});
var require_has_flag = /* @__PURE__ */ __commonJSMin((exports, module) => {
  module.exports = (flag, argv) => {
    argv = argv || process.argv;
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const pos = argv.indexOf(prefix + flag);
    const terminatorPos = argv.indexOf("--");
    return pos !== -1 && (terminatorPos === -1 ? true : pos < terminatorPos);
  };
});
var require_supports_color = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const os = __require2("os");
  const hasFlag = require_has_flag();
  const env = process.env;
  let forceColor;
  if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false"))
    forceColor = false;
  else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always"))
    forceColor = true;
  if ("FORCE_COLOR" in env)
    forceColor = env.FORCE_COLOR.length === 0 || parseInt(env.FORCE_COLOR, 10) !== 0;
  function translateLevel(level) {
    if (level === 0)
      return false;
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function supportsColor(stream) {
    if (forceColor === false)
      return 0;
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor"))
      return 3;
    if (hasFlag("color=256"))
      return 2;
    if (stream && !stream.isTTY && forceColor !== true)
      return 0;
    const min = forceColor ? 1 : 0;
    if (process.platform === "win32") {
      const osRelease = os.release().split(".");
      if (Number(process.versions.node.split(".")[0]) >= 8 && Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586)
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      return 1;
    }
    if ("CI" in env) {
      if ([
        "TRAVIS",
        "CIRCLECI",
        "APPVEYOR",
        "GITLAB_CI"
      ].some((sign) => (sign in env)) || env.CI_NAME === "codeship")
        return 1;
      return min;
    }
    if ("TEAMCITY_VERSION" in env)
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    if (env.COLORTERM === "truecolor")
      return 3;
    if ("TERM_PROGRAM" in env) {
      const version = parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env.TERM_PROGRAM) {
        case "iTerm.app":
          return version >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    if (/-256(color)?$/i.test(env.TERM))
      return 2;
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM))
      return 1;
    if ("COLORTERM" in env)
      return 1;
    if (env.TERM === "dumb")
      return min;
    return min;
  }
  function getSupportLevel(stream) {
    return translateLevel(supportsColor(stream));
  }
  module.exports = {
    supportsColor: getSupportLevel,
    stdout: getSupportLevel(process.stdout),
    stderr: getSupportLevel(process.stderr)
  };
});
var require_node = /* @__PURE__ */ __commonJSMin((exports, module) => {
  const tty = __require2("tty");
  const util = __require2("util");
  exports.init = init;
  exports.log = log;
  exports.formatArgs = formatArgs;
  exports.save = save;
  exports.load = load;
  exports.useColors = useColors;
  exports.destroy = util.deprecate(() => {}, "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
  exports.colors = [
    6,
    2,
    3,
    4,
    5,
    1
  ];
  try {
    const supportsColor = require_supports_color();
    if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2)
      exports.colors = [
        20,
        21,
        26,
        27,
        32,
        33,
        38,
        39,
        40,
        41,
        42,
        43,
        44,
        45,
        56,
        57,
        62,
        63,
        68,
        69,
        74,
        75,
        76,
        77,
        78,
        79,
        80,
        81,
        92,
        93,
        98,
        99,
        112,
        113,
        128,
        129,
        134,
        135,
        148,
        149,
        160,
        161,
        162,
        163,
        164,
        165,
        166,
        167,
        168,
        169,
        170,
        171,
        172,
        173,
        178,
        179,
        184,
        185,
        196,
        197,
        198,
        199,
        200,
        201,
        202,
        203,
        204,
        205,
        206,
        207,
        208,
        209,
        214,
        215,
        220,
        221
      ];
  } catch (error) {}
  exports.inspectOpts = Object.keys(process.env).filter((key) => {
    return /^debug_/i.test(key);
  }).reduce((obj, key) => {
    const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
      return k.toUpperCase();
    });
    let val = process.env[key];
    if (/^(yes|on|true|enabled)$/i.test(val))
      val = true;
    else if (/^(no|off|false|disabled)$/i.test(val))
      val = false;
    else if (val === "null")
      val = null;
    else
      val = Number(val);
    obj[prop] = val;
    return obj;
  }, {});
  function useColors() {
    return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
  }
  function formatArgs(args) {
    const { namespace: name, useColors: useColors2 } = this;
    if (useColors2) {
      const c2 = this.color;
      const colorCode = "\x1B[3" + (c2 < 8 ? c2 : "8;5;" + c2);
      const prefix = `  ${colorCode};1m${name} \x1B[0m`;
      args[0] = prefix + args[0].split(`
`).join(`
` + prefix);
      args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
    } else
      args[0] = getDate() + name + " " + args[0];
  }
  function getDate() {
    if (exports.inspectOpts.hideDate)
      return "";
    return (/* @__PURE__ */ new Date()).toISOString() + " ";
  }
  function log(...args) {
    return process.stderr.write(util.formatWithOptions(exports.inspectOpts, ...args) + `
`);
  }
  function save(namespaces) {
    if (namespaces)
      process.env.DEBUG = namespaces;
    else
      delete process.env.DEBUG;
  }
  function load() {
    return process.env.DEBUG;
  }
  function init(debug) {
    debug.inspectOpts = {};
    const keys = Object.keys(exports.inspectOpts);
    for (let i = 0;i < keys.length; i++)
      debug.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
  }
  module.exports = require_common()(exports);
  const { formatters } = module.exports;
  formatters.o = function(v) {
    this.inspectOpts.colors = this.useColors;
    return util.inspect(v, this.inspectOpts).split(`
`).map((str) => str.trim()).join(" ");
  };
  formatters.O = function(v) {
    this.inspectOpts.colors = this.useColors;
    return util.inspect(v, this.inspectOpts);
  };
});
var require_src$1 = /* @__PURE__ */ __commonJSMin((exports, module) => {
  if (typeof process === "undefined" || process.type === "renderer" || false || process.__nwjs)
    module.exports = require_browser();
  else
    module.exports = require_node();
});
var require_src = /* @__PURE__ */ __commonJSMin((exports, module, this$1) => {
  var __importDefault = this$1 && this$1.__importDefault || function(mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
  Object.defineProperty(exports, "__esModule", { value: true });
  const fs_1 = __require2("fs");
  const log = __importDefault(require_src$1()).default("@kwsites/file-exists");
  function check(path, isFile, isDirectory) {
    log(`checking %s`, path);
    try {
      const stat = fs_1.statSync(path);
      if (stat.isFile() && isFile) {
        log(`[OK] path represents a file`);
        return true;
      }
      if (stat.isDirectory() && isDirectory) {
        log(`[OK] path represents a directory`);
        return true;
      }
      log(`[FAIL] path represents something other than a file or directory`);
      return false;
    } catch (e) {
      if (e.code === "ENOENT") {
        log(`[FAIL] path is not accessible: %o`, e);
        return false;
      }
      log(`[FATAL] %o`, e);
      throw e;
    }
  }
  function exists(path, type = exports.READABLE) {
    return check(path, (type & exports.FILE) > 0, (type & exports.FOLDER) > 0);
  }
  exports.exists = exists;
  exports.FILE = 1;
  exports.FOLDER = 2;
  exports.READABLE = exports.FILE + exports.FOLDER;
});
var require_dist = /* @__PURE__ */ __commonJSMin((exports) => {
  function __export2(m) {
    for (var p in m)
      if (!exports.hasOwnProperty(p))
        exports[p] = m[p];
  }
  Object.defineProperty(exports, "__esModule", { value: true });
  __export2(require_src());
});

// node_modules/skills/dist/_chunks/libs/@kwsites/promise-deferred.mjs
var require_dist2 = /* @__PURE__ */ __commonJSMin((exports) => {
  Object.defineProperty(exports, "__esModule", { value: true });
  exports.createDeferred = exports.deferred = undefined;
  function deferred() {
    let done;
    let fail;
    let status = "pending";
    return {
      promise: new Promise((_done, _fail) => {
        done = _done;
        fail = _fail;
      }),
      done(result) {
        if (status === "pending") {
          status = "resolved";
          done(result);
        }
      },
      fail(error) {
        if (status === "pending") {
          status = "rejected";
          fail(error);
        }
      },
      get fulfilled() {
        return status !== "pending";
      },
      get status() {
        return status;
      }
    };
  }
  exports.deferred = deferred;
  exports.createDeferred = deferred;
});

// node_modules/skills/dist/_chunks/libs/@simple-git/argv-parser.mjs
function* x(e, n) {
  const t2 = n === "global";
  for (const o2 of e)
    o2.isGlobal === t2 && (yield o2);
}
var P = /* @__PURE__ */ new Set([
  "--add",
  "--edit",
  "--remove-section",
  "--rename-section",
  "--replace-all",
  "--unset",
  "--unset-all",
  "-e"
]);
var S = /* @__PURE__ */ new Set([
  "--get",
  "--get-all",
  "--get-color",
  "--get-colorbool",
  "--get-regexp",
  "--get-urlmatch",
  "--list",
  "-l"
]);
var E = /* @__PURE__ */ new Set([
  "edit",
  "remove-section",
  "rename-section",
  "set",
  "unset"
]);
var F = /* @__PURE__ */ new Set([
  "get",
  "get-color",
  "get-colorbool",
  "list"
]);
function A(e, n) {
  for (const { name: o2 } of x(e, "task")) {
    if (P.has(o2))
      return w(true, n);
    if (S.has(o2))
      return w(false, n);
  }
  const t2 = n.at(0)?.toLowerCase();
  return t2 === undefined ? null : E.has(t2) ? w(true, n.slice(1)) : F.has(t2) ? w(false, n.slice(1)) : n.length === 1 ? w(false, n) : w(true, n);
}
function w(e = false, n = []) {
  const t2 = n.at(0)?.toLowerCase();
  return t2 === undefined ? null : {
    isWrite: e,
    isRead: !e,
    key: t2,
    value: n.at(1)
  };
}
function O(e, n) {
  return n.isWrite && n.value !== undefined ? {
    key: n.key,
    value: n.value,
    scope: e
  } : {
    key: n.key,
    scope: e
  };
}
function G(e) {
  const n = e?.indexOf("=") || -1;
  return !e || n < 0 ? null : {
    key: e.slice(0, n).trim().toLowerCase(),
    value: e.slice(n + 1)
  };
}
function M(e) {
  for (const { name: n } of x(e, "task"))
    switch (n) {
      case "--global":
        return "global";
      case "--system":
        return "system";
      case "--worktree":
        return "worktree";
      case "--local":
        return "local";
      case "--file":
      case "-f":
        return "file";
    }
  return "local";
}
function N({ name: e }) {
  if (e === "-c" || e === "--config")
    return "inline";
  if (e === "--config-env")
    return "env";
}
function* $(e) {
  for (const n of e) {
    const t2 = N(n), o2 = t2 && G(n.value);
    o2 && (yield {
      ...o2,
      scope: t2
    });
  }
}
function D(e, n, t2) {
  const o2 = {
    read: [],
    write: [...$(n)]
  };
  return e === "config" && L(o2, M(n), A(n, t2)), o2;
}
function L(e, n, t2) {
  if (t2 === null)
    return;
  const o2 = O(n, t2);
  t2.isWrite ? e.write.push(o2) : e.read.push(o2);
}
var C = { short: /* @__PURE__ */ new Map([["c", true]]) };
var I = {
  short: new Map([
    ["C", true],
    ["P", false],
    ["h", false],
    ["p", false],
    ["v", false],
    ...C.short.entries()
  ]),
  long: /* @__PURE__ */ new Set([
    "attr-source",
    "config-env",
    "exec-path",
    "git-dir",
    "list-cmds",
    "namespace",
    "super-prefix",
    "work-tree"
  ])
};
var R2 = {
  clone: {
    short: /* @__PURE__ */ new Map([
      ["b", true],
      ["j", true],
      ["l", false],
      ["n", false],
      ["o", true],
      ["q", false],
      ["s", false],
      ["u", true]
    ]),
    long: /* @__PURE__ */ new Set([
      "branch",
      "config",
      "jobs",
      "origin",
      "upload-pack",
      "u",
      "template"
    ])
  },
  commit: {
    short: /* @__PURE__ */ new Map([
      ["C", true],
      ["F", true],
      ["c", true],
      ["m", true],
      ["t", true]
    ]),
    long: /* @__PURE__ */ new Set([
      "file",
      "message",
      "reedit-message",
      "reuse-message",
      "template"
    ])
  },
  config: {
    short: /* @__PURE__ */ new Map([
      ["e", false],
      ["f", true],
      ["l", false]
    ]),
    long: /* @__PURE__ */ new Set([
      "blob",
      "comment",
      "default",
      "file",
      "type",
      "value"
    ])
  },
  fetch: {
    short: /* @__PURE__ */ new Map,
    long: /* @__PURE__ */ new Set(["upload-pack"])
  },
  init: {
    short: /* @__PURE__ */ new Map,
    long: /* @__PURE__ */ new Set(["template"])
  },
  pull: {
    short: /* @__PURE__ */ new Map,
    long: /* @__PURE__ */ new Set(["upload-pack"])
  },
  push: {
    short: /* @__PURE__ */ new Map,
    long: /* @__PURE__ */ new Set(["exec", "receive-pack"])
  },
  rebase: {
    short: /* @__PURE__ */ new Map([
      ["X", true],
      ["f", false],
      ["i", false],
      ["k", false],
      ["m", false],
      ["n", false],
      ["q", false],
      ["r", false],
      ["s", true],
      ["v", false],
      ["x", true]
    ]),
    long: /* @__PURE__ */ new Set([
      "exec",
      "onto",
      "strategy",
      "strategy-option"
    ])
  }
};
var T = {
  short: /* @__PURE__ */ new Map,
  long: /* @__PURE__ */ new Set
};
function B(e) {
  const n = R2[e ?? ""] ?? T;
  return {
    short: new Map([...C.short.entries(), ...n.short.entries()]),
    long: n.long
  };
}
function b(e, n = I) {
  if (e.startsWith("--")) {
    const t2 = e.indexOf("=");
    if (t2 > 2)
      return [{
        name: e.slice(0, t2),
        value: e.slice(t2 + 1),
        needsNext: false
      }];
    const o2 = e.slice(2);
    return [{
      name: e,
      needsNext: n.long.has(o2)
    }];
  }
  if (e.length === 2) {
    const t2 = e.charAt(1);
    return [{
      name: e,
      needsNext: n.short.get(t2) === true
    }];
  }
  return j(e, n.short);
}
function j(e, n) {
  const t2 = e.slice(1).split(""), o2 = [];
  for (let a2 = 0;a2 < t2.length; a2++) {
    const s = t2[a2], r3 = n.get(s);
    if (r3 === undefined)
      return [{
        name: e,
        needsNext: false
      }];
    if (r3) {
      const i = t2.slice(a2 + 1).join("");
      if (i && ![...i].every((m) => n.has(m)))
        return o2.push({
          name: `-${s}`,
          value: i,
          needsNext: false
        }), o2;
    }
    o2.push({
      name: `-${s}`,
      needsNext: r3
    });
  }
  return o2;
}
function W(e, n = []) {
  let t2 = 0;
  for (;t2 < e.length; ) {
    const o2 = String(e[t2]);
    if (!o2.startsWith("-") || o2.length < 2)
      break;
    const a2 = b(o2);
    let s = t2 + 1;
    for (const r3 of a2) {
      const i = {
        name: r3.name,
        value: r3.value,
        absorbedNext: false,
        isGlobal: true
      };
      r3.needsNext && i.value === undefined && s < e.length && (i.value = String(e[s]), i.absorbedNext = true, s++), n.push(i);
    }
    t2 = s;
  }
  return {
    flags: n,
    taskIndex: t2
  };
}
function V(e, n, t2 = []) {
  const o$1 = B(n), a2 = [], s = [];
  let r$1 = 0;
  for (;r$1 < e.length; ) {
    const i = e[r$1];
    if (r2(i)) {
      s.push(...o(i)), r$1++;
      continue;
    }
    const p = String(i);
    if (p === "--") {
      for (let d = r$1 + 1;d < e.length; d++) {
        const g = e[d];
        r2(g) ? s.push(...o(g)) : s.push(String(g));
      }
      break;
    }
    if (!p.startsWith("-") || p.length < 2) {
      a2.push(p), r$1++;
      continue;
    }
    const m = b(p, o$1);
    let u = r$1 + 1;
    for (const d of m) {
      const g = {
        name: d.name,
        value: d.value,
        absorbedNext: false,
        isGlobal: false
      };
      d.needsNext && g.value === undefined && u < e.length && !r2(e[u]) && (g.value = String(e[u]), g.absorbedNext = true, u++), t2.push(g);
    }
    r$1 = u;
  }
  return {
    flags: t2,
    positionals: a2,
    pathspecs: s
  };
}
function* q({ write: e }) {
  for (const n of e)
    for (const t2 of K) {
      const o2 = t2(n.key);
      o2 && (yield o2);
    }
}
function f(e, n, t2 = String(e)) {
  const o2 = typeof e == "string" ? new RegExp(`\\s*${e.toLowerCase()}`) : e;
  return function(s) {
    if (o2.test(s))
      return {
        category: n,
        message: `Configuring ${t2} is not permitted without enabling ${n}`
      };
  };
}
function l(e, n) {
  return f(new RegExp(`\\s*${e.toLowerCase().replace(/\./g, "(..+)?.")}`), n, e);
}
var K = [
  f("alias", "allowUnsafeAlias"),
  f("core.askPass", "allowUnsafeAskPass"),
  f("core.editor", "allowUnsafeEditor"),
  f("core.fsmonitor", "allowUnsafeFsMonitor"),
  f("core.gitProxy", "allowUnsafeGitProxy"),
  f("core.hooksPath", "allowUnsafeHooksPath"),
  f("core.pager", "allowUnsafePager"),
  f("core.sshCommand", "allowUnsafeSshCommand"),
  l("credential.helper", "allowUnsafeCredentialHelper"),
  l("diff.command", "allowUnsafeDiffExternal"),
  f("diff.external", "allowUnsafeDiffExternal"),
  l("difftool.cmd", "allowUnsafeDiffExternal"),
  l("diff.textconv", "allowUnsafeDiffTextConv"),
  l("filter.clean", "allowUnsafeFilter"),
  l("filter.process", "allowUnsafeFilter"),
  l("filter.smudge", "allowUnsafeFilter"),
  l("gpg.program", "allowUnsafeGpgProgram"),
  f("include.path", "allowUnsafeInclude"),
  l("includeIf", "allowUnsafeInclude"),
  f("init.templateDir", "allowUnsafeTemplateDir"),
  l("pager.", "allowUnsafePager"),
  l("merge.driver", "allowUnsafeMergeDriver"),
  l("mergetool.path", "allowUnsafeMergeDriver"),
  l("mergetool.cmd", "allowUnsafeMergeDriver"),
  l("protocol.allow", "allowUnsafeProtocolOverride"),
  l("remote.receivepack", "allowUnsafePack"),
  l("remote.uploadpack", "allowUnsafePack"),
  f("uploadpack.packObjectsHook", "allowUnsafePack"),
  f("sequence.editor", "allowUnsafeEditor"),
  l("submodule.update", "allowUnsafeSubmodule"),
  l("tar.command", "allowUnsafeCommandBinaries"),
  l("trailer.cmd", "allowUnsafeCommandBinaries"),
  l("trailer.command", "allowUnsafeCommandBinaries"),
  l("url.insteadOf", "allowUnsafeUrlRewrite")
];
function* H(e, n) {
  for (const t2 of n)
    for (const o2 of X) {
      const a2 = o2(e, t2);
      a2 && (yield a2);
    }
}
function c2(e, n, t2, { name: o2 = String(n), globalOnly: a2 = false, withValue: s = false } = {}) {
  const r3 = typeof n == "string" ? new RegExp(`\\s*${n.toLowerCase()}`) : n, i = `Use of ${e ? `${e} with option ` : ""}${o2} is not permitted without enabling ${t2}`;
  return function(m, u) {
    if (!(e && m !== e) && !(a2 && !u.isGlobal) && !(s && u.value === undefined) && r3.test(u.name))
      return {
        category: t2,
        message: i
      };
  };
}
var h = {
  globalOnly: true,
  withValue: true
};
var X = [
  c2(null, /--(upload|receive)-pack/, "allowUnsafePack", { name: "--upload-pack or --receive-pack" }),
  c2("clone", /^-\w*u/, "allowUnsafePack"),
  c2("clone", "--u", "allowUnsafePack"),
  c2("push", /^--exec$/, "allowUnsafePack", { name: "--exec" }),
  c2("rebase", /^(-x|--ex(ec?)?)$/, "allowUnsafeExec", { name: "-x or --exec" }),
  c2(null, "--template", "allowUnsafeTemplateDir"),
  c2(null, "--exec-path", "allowUnsafeExec", h),
  c2(null, "--git-dir", "allowUnsafeConfigPaths", h),
  c2(null, "--work-tree", "allowUnsafeConfigPaths", h),
  c2(null, /^-C$/, "allowUnsafeConfigPaths", {
    ...h,
    name: "-C"
  })
];
function k(e, n, t2) {
  return [...H(e, n), ...q(t2)];
}
function Y(...e) {
  const { flags: n, taskIndex: t2 } = W(e), o2 = t2 < e.length ? String(e[t2]).toLowerCase() : null, { positionals: s, pathspecs: r3 } = V(o2 !== null ? e.slice(t2 + 1) : [], o2, n), i = D(o2, n, s);
  return {
    task: o2,
    flags: n.map(J),
    paths: r3,
    config: i,
    vulnerabilities: z(k(o2, n, i))
  };
}
function z(e) {
  return Object.defineProperty(e, "vulnerabilities", { value: e });
}
function J({ value: e, name: n }) {
  return e !== undefined ? {
    name: n,
    value: e
  } : { name: n };
}
var y = {
  editor: "allowUnsafeEditor",
  git_askpass: "allowUnsafeAskPass",
  git_config_global: "allowUnsafeConfigPaths",
  git_config_system: "allowUnsafeConfigPaths",
  git_config_count: "allowUnsafeConfigEnvCount",
  git_config_parameters: "allowUnsafeConfigEnvCount",
  git_config: "allowUnsafeConfigPaths",
  git_editor: "allowUnsafeEditor",
  git_exec_path: "allowUnsafeExec",
  git_external_diff: "allowUnsafeDiffExternal",
  git_pager: "allowUnsafePager",
  git_proxy_command: "allowUnsafeGitProxy",
  git_template_dir: "allowUnsafeTemplateDir",
  git_sequence_editor: "allowUnsafeEditor",
  git_ssh: "allowUnsafeSshCommand",
  git_ssh_command: "allowUnsafeSshCommand",
  pager: "allowUnsafePager",
  prefix: "allowUnsafeConfigPaths",
  ssh_askpass: "allowUnsafeAskPass",
  visual: "allowUnsafeEditor"
};
function* Q(e) {
  const n = parseInt(e.git_config_count ?? "0", 10);
  for (let t2 = 0;t2 < n; t2++) {
    const o2 = e[`git_config_key_${t2}`], a2 = e[`git_config_value_${t2}`];
    o2 !== undefined && (yield {
      key: o2.toLowerCase().trim(),
      value: a2,
      scope: "env"
    });
  }
}
function* Z(e) {
  for (const n of Object.keys(e))
    if (_(n)) {
      const t2 = y[n];
      yield {
        category: t2,
        message: `Use of "${n.toUpperCase()}" is not permitted without enabling ${t2}`
      };
    }
}
function _(e) {
  return Object.hasOwn(y, e);
}
function ee(e) {
  const n = {};
  for (const [t2, o2] of Object.entries(e)) {
    const a2 = t2.toLowerCase().trim();
    (_(a2) || a2.startsWith("git")) && (n[a2] = String(o2));
  }
  return n;
}
function ne(e) {
  const n = ee(e), t2 = {
    read: [],
    write: [...Q(n)]
  };
  return {
    config: t2,
    vulnerabilities: [...Z(n), ...k(null, [], t2)]
  };
}
function oe(e, n) {
  return [...Y(...e).vulnerabilities, ...ne(n).vulnerabilities];
}

// node_modules/skills/dist/_chunks/libs/simple-git.mjs
import { normalize } from "node:path";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
var import_dist = require_dist();
var import_src = /* @__PURE__ */ __toESM(require_src$1(), 1);
var import_dist$1 = require_dist2();
var O2 = class extends Error {
  constructor(e, n) {
    super(n), this.task = e, Object.setPrototypeOf(this, new.target.prototype);
  }
};
var Ae = class extends O2 {
  constructor(e, n) {
    super(undefined, n), this.config = e;
  }
};
var A2 = class extends O2 {
  constructor(e, n, r3) {
    super(e, r3), this.task = e, this.plugin = n, Object.setPrototypeOf(this, new.target.prototype);
  }
};
var at = class extends O2 {
  constructor(e, n) {
    super(undefined, n || String(e)), this.git = e;
  }
};
var xe = class extends O2 {
  constructor(e) {
    super(undefined, e);
  }
};
var I2 = "\x00";
var W2 = () => {};
function Ne(t2) {
  return typeof t2 != "function" ? W2 : t2;
}
function $e(t2) {
  return typeof t2 == "function" && t2 !== W2;
}
function Pe(t2, e) {
  const n = t2.indexOf(e);
  return n <= 0 ? [t2, ""] : [t2.substr(0, n), t2.substr(n + 1)];
}
function Me(t2, e = 0) {
  return Dt(t2) && t2.length > e ? t2[e] : undefined;
}
function N2(t2, e = 0) {
  if (Dt(t2) && t2.length > e)
    return t2[t2.length - 1 - e];
}
function Dt(t2) {
  return Bt(t2);
}
function H2(t2 = "", e = true, n = `
`) {
  return t2.split(n).reduce((r3, s) => {
    const o2 = e ? s.trim() : s;
    return o2 && r3.push(o2), r3;
  }, []);
}
function ut(t2, e) {
  return H2(t2, true).map((n) => e(n));
}
function Lt(t2) {
  return (0, import_dist.exists)(t2, import_dist.FOLDER);
}
function S2(t2, e) {
  return Array.isArray(t2) ? t2.includes(e) || t2.push(e) : t2.add(e), e;
}
function De(t2, e) {
  return Array.isArray(t2) && !t2.includes(e) && t2.push(e), t2;
}
function ct(t2, e) {
  if (Array.isArray(t2)) {
    const n = t2.indexOf(e);
    n >= 0 && t2.splice(n, 1);
  } else
    t2.delete(e);
  return e;
}
var ft = Object.prototype.toString.call.bind(Object.prototype.toString);
function v(t2) {
  return Array.isArray(t2) ? t2 : [t2];
}
function jt(t2) {
  return t2.replace(/[\s-]+(.)/g, (e, n) => n.toUpperCase());
}
function L2(t2) {
  return v(t2).map((e) => e instanceof String ? e : String(e));
}
function p(t2, e = 0) {
  if (t2 == null)
    return e;
  const n = parseInt(t2, 10);
  return Number.isNaN(n) ? e : n;
}
function U(t2, e) {
  const n = [];
  for (let r3 = 0, s = t2.length;r3 < s; r3++)
    n.push(e, t2[r3]);
  return n;
}
function F2(t2) {
  return (Array.isArray(t2) ? Buffer.concat(t2) : t2).toString("utf-8");
}
function Le(t2) {
  return t2 ? Buffer.isBuffer(t2) ? t2.length : Buffer.byteLength(t2) : 0;
}
function je(t2, e) {
  const n = {};
  return e.forEach((r3) => {
    t2[r3] !== undefined && (n[r3] = t2[r3]);
  }), n;
}
function wt(t2 = 0) {
  return new Promise((e) => setTimeout(e, t2));
}
function bt(t2) {
  if (t2 !== false)
    return t2;
}
function d(t2, e, n) {
  return e(t2) ? t2 : arguments.length > 2 ? n : undefined;
}
var K2 = (t2) => Array.isArray(t2);
function st(t2, e) {
  const n = r2(t2) ? "string" : typeof t2;
  return /number|string|boolean/.test(n) && (!e || !e.includes(n));
}
var m = (t2) => typeof t2 == "string" || r2(t2);
var Be = (t2) => m(t2) || Buffer.isBuffer(t2);
var G2 = (t2) => m(t2) || Array.isArray(t2) && t2.every(m);
function lt(t2) {
  return !!t2 && ft(t2) === "[object Object]";
}
function Ie(t2) {
  return typeof t2 == "function";
}
var Bt = (t2) => t2 == null || "number|boolean|function".includes(typeof t2) ? false : typeof t2.length == "number";
var V2 = /* @__PURE__ */ ((t2) => (t2[t2.SUCCESS = 0] = "SUCCESS", t2[t2.ERROR = 1] = "ERROR", t2[t2.NOT_FOUND = -2] = "NOT_FOUND", t2[t2.UNCLEAN = 128] = "UNCLEAN", t2))(V2 || {});
var z2 = class z3 {
  constructor(e, n) {
    this.stdOut = e, this.stdErr = n;
  }
  asStrings() {
    return new z3(this.stdOut.toString("utf8"), this.stdErr.toString("utf8"));
  }
};
function Ue() {
  throw new Error("LineParser:useMatches not implemented");
}
var l2 = class {
  constructor(e, n) {
    this.matches = [], this.useMatches = Ue, this.parse = (r3, s) => (this.resetMatches(), this._regExp.every((o2, i) => this.addMatch(o2, i, r3(i))) ? this.useMatches(s, this.prepareMatches()) !== false : false), this._regExp = Array.isArray(e) ? e : [e], n && (this.useMatches = n);
  }
  resetMatches() {
    this.matches.length = 0;
  }
  prepareMatches() {
    return this.matches;
  }
  addMatch(e, n, r3) {
    const s = r3 && e.exec(r3);
    return s && this.pushMatch(n, s), !!s;
  }
  pushMatch(e, n) {
    this.matches.push(...n.slice(1));
  }
};
var x2 = class extends l2 {
  addMatch(e, n, r3) {
    return /^remote:\s/.test(String(r3)) && super.addMatch(e, n, r3);
  }
  pushMatch(e, n) {
    (e > 0 || n.length > 1) && super.pushMatch(e, n);
  }
};
var Fe = {
  binary: "git",
  maxConcurrentProcesses: 5,
  config: [],
  trimmed: false
};
function Ge(...t2) {
  const e = process.cwd(), n = Object.assign({
    baseDir: e,
    ...Fe
  }, ...t2.filter((r3) => typeof r3 == "object" && r3));
  return n.baseDir = n.baseDir || e, n.trimmed = n.trimmed === true, n;
}
function It(t2, e = []) {
  return lt(t2) ? Object.keys(t2).reduce((n, r$1) => {
    const s = t2[r$1];
    if (r2(s))
      n.push(s);
    else if (st(s, ["boolean"]))
      n.push(r$1 + "=" + s);
    else if (Array.isArray(s))
      for (const o2 of s)
        st(o2, ["string", "number"]) || n.push(r$1 + "=" + o2);
    else
      n.push(r$1);
    return n;
  }, e) : e;
}
function h2(t2, e = 0, n = false) {
  const r3 = [];
  for (let s = 0, o2 = e < 0 ? t2.length : e;s < o2; s++)
    "string|number".includes(typeof t2[s]) && r3.push(String(t2[s]));
  return It(ht(t2), r3), n || r3.push(...ze(t2)), r3;
}
function ze(t2) {
  return L2(d(N2(t2, typeof N2(t2) == "function" ? 1 : 0), K2, []));
}
function ht(t2) {
  return d(N2(t2, Ie(N2(t2)) ? 1 : 0), lt);
}
function u(t2, e = true) {
  const n = Ne(N2(t2));
  return e || $e(n) ? n : undefined;
}
function Tt(t2, e) {
  return t2(e.stdOut, e.stdErr);
}
function E2(t2, e, n, r3 = true) {
  return v(n).forEach((s) => {
    for (let o2 = H2(s, r3), i = 0, a2 = o2.length;i < a2; i++) {
      const c3 = (y2 = 0) => {
        if (!(i + y2 >= a2))
          return o2[i + y2];
      };
      e.some(({ parse: y2 }) => y2(c3, t2));
    }
  }), t2;
}
var mt = ({ exitCode: t2 }, e, n, r3) => {
  if (t2 === V2.UNCLEAN && Ve(e))
    return n(Buffer.from("false"));
  r3(e);
};
var Ut = (t2) => t2.trim() === "true";
function We(t2) {
  switch (t2) {
    case "bare":
      return Ke();
    case "root":
      return He();
  }
  return {
    commands: ["rev-parse", "--is-inside-work-tree"],
    format: "utf-8",
    onError: mt,
    parser: Ut
  };
}
function He() {
  return {
    commands: ["rev-parse", "--git-dir"],
    format: "utf-8",
    onError: mt,
    parser(e) {
      return /^\.(git)?$/.test(e.trim());
    }
  };
}
function Ke() {
  return {
    commands: ["rev-parse", "--is-bare-repository"],
    format: "utf-8",
    onError: mt,
    parser: Ut
  };
}
function Ve(t2) {
  return /(Not a git repository|Kein Git-Repository)/i.test(String(t2));
}
var Xe = class {
  constructor(e) {
    this.paths = [], this.files = [], this.folders = [], this.dryRun = e;
  }
};
var Ye = /^[a-z]+\s*/i;
var Qe = /^[a-z]+\s+[a-z]+\s*/i;
var Je = /\/$/;
function Ze(t2, e) {
  const n = new Xe(t2), r3 = t2 ? Qe : Ye;
  return H2(e).forEach((s) => {
    const o2 = s.replace(r3, "");
    n.paths.push(o2), (Je.test(o2) ? n.folders : n.files).push(o2);
  }), n;
}
var Ft = [];
function tn(t2) {
  return {
    commands: Ft,
    format: "empty",
    parser: t2
  };
}
function b2(t2) {
  return {
    commands: Ft,
    format: "empty",
    parser() {
      throw typeof t2 == "string" ? new xe(t2) : t2;
    }
  };
}
function g(t2, e = false) {
  return {
    commands: t2,
    format: "utf-8",
    parser(n) {
      return e ? String(n).trim() : n;
    }
  };
}
function Gt(t2) {
  return {
    commands: t2,
    format: "buffer",
    parser(e) {
      return e;
    }
  };
}
function en(t2) {
  return t2.format === "buffer";
}
function kt(t2) {
  return t2.format === "empty" || !t2.commands.length;
}
var nn = "Git clean interactive mode is not supported";
var rn = 'Git clean mode parameter ("n" or "f") is required';
var sn = "Git clean unknown option found in: ";
var zt = /* @__PURE__ */ ((t2) => (t2.DRY_RUN = "n", t2.FORCE = "f", t2.IGNORED_INCLUDED = "x", t2.IGNORED_ONLY = "X", t2.EXCLUDING = "e", t2.QUIET = "q", t2.RECURSIVE = "d", t2))(zt || {});
var qt = /* @__PURE__ */ new Set(["i", ...L2(Object.values(zt))]);
function on(t2, e) {
  const { cleanMode: n, options: r3, valid: s } = cn(t2);
  return n ? s.options ? (r3.push(...e), r3.some(hn) ? b2(nn) : an(n, r3)) : b2(sn + JSON.stringify(t2)) : b2(rn);
}
function an(t2, e) {
  return {
    commands: [
      "clean",
      `-${t2}`,
      ...e
    ],
    format: "utf-8",
    parser(r3) {
      return Ze(t2 === "n", r3);
    }
  };
}
function un(t2) {
  return Array.isArray(t2) && t2.every((e) => qt.has(e));
}
function cn(t2) {
  let e, n = [], r3 = {
    cleanMode: false,
    options: true
  };
  return t2.replace(/[^a-z]i/g, "").split("").forEach((s) => {
    fn(s) ? (e = s, r3.cleanMode = true) : r3.options = r3.options && ln(n[n.length] = `-${s}`);
  }), {
    cleanMode: e,
    options: n,
    valid: r3
  };
}
function fn(t2) {
  return t2 === "f" || t2 === "n";
}
function ln(t2) {
  return /^-[a-z]$/i.test(t2) && qt.has(t2.charAt(1));
}
function hn(t2) {
  return /^-[^\-]/.test(t2) ? t2.indexOf("i") > 0 : t2 === "--interactive";
}
var mn = class {
  constructor() {
    this.files = [], this.values = /* @__PURE__ */ Object.create(null);
  }
  get all() {
    return this._all || (this._all = this.files.reduce((e, n) => Object.assign(e, this.values[n]), {})), this._all;
  }
  addFile(e) {
    if (!(e in this.values)) {
      const n = N2(this.files);
      this.values[e] = n ? Object.create(this.values[n]) : {}, this.files.push(e);
    }
    return this.values[e];
  }
  addValue(e, n, r3) {
    const s = this.addFile(e);
    Object.hasOwn(s, n) ? Array.isArray(s[n]) ? s[n].push(r3) : s[n] = [s[n], r3] : s[n] = r3, this._all = undefined;
  }
};
function pn(t2) {
  const e = new mn;
  for (const n of Wt(t2))
    e.addValue(n.file, String(n.key), n.value);
  return e;
}
function dn(t2, e) {
  let n = null;
  const r3 = [], s = /* @__PURE__ */ new Map;
  for (const o2 of Wt(t2, e))
    o2.key === e && (r3.push(n = o2.value), s.has(o2.file) || s.set(o2.file, []), s.get(o2.file).push(n));
  return {
    key: e,
    paths: Array.from(s.keys()),
    scopes: s,
    value: n,
    values: r3
  };
}
function gn(t2) {
  return t2.replace(/^(file):/, "");
}
function* Wt(t2, e = null) {
  const n = t2.split("\x00");
  for (let r3 = 0, s = n.length - 1;r3 < s; ) {
    const o2 = gn(n[r3++]);
    let i = n[r3++], a2 = e;
    if (i.includes(`
`)) {
      const c3 = Pe(i, `
`);
      a2 = c3[0], i = c3[1];
    }
    yield {
      file: o2,
      key: a2,
      value: i
    };
  }
}
var Ht = /* @__PURE__ */ ((t2) => (t2.system = "system", t2.global = "global", t2.local = "local", t2.worktree = "worktree", t2))(Ht || {});
function Y2(t2, e) {
  return typeof t2 == "string" && Object.hasOwn(Ht, t2) ? t2 : e;
}
function yn(t2, e, n, r3) {
  const s = ["config", `--${r3}`];
  return n && s.push("--add"), s.push(t2, e), {
    commands: s,
    format: "utf-8",
    parser(o2) {
      return o2;
    }
  };
}
function wn(t2, e) {
  const n = [
    "config",
    "--null",
    "--show-origin",
    "--get-all",
    t2
  ];
  return e && n.splice(1, 0, `--${e}`), {
    commands: n,
    format: "utf-8",
    parser(r3) {
      return dn(r3, t2);
    }
  };
}
function bn(t2) {
  const e = [
    "config",
    "--list",
    "--show-origin",
    "--null"
  ];
  return t2 && e.push(`--${t2}`), {
    commands: e,
    format: "utf-8",
    parser(n) {
      return pn(n);
    }
  };
}
function Tn() {
  return {
    addConfig(t2, e, ...n) {
      return this._runTask(yn(t2, e, n[0] === true, Y2(n[1], "local")), u(arguments));
    },
    getConfig(t2, e) {
      return this._runTask(wn(t2, Y2(e, undefined)), u(arguments));
    },
    listConfig(...t2) {
      return this._runTask(bn(Y2(t2[0], undefined)), u(arguments));
    }
  };
}
var Kt = /* @__PURE__ */ ((t2) => (t2.ADDED = "A", t2.COPIED = "C", t2.DELETED = "D", t2.MODIFIED = "M", t2.RENAMED = "R", t2.CHANGED = "T", t2.UNMERGED = "U", t2.UNKNOWN = "X", t2.BROKEN = "B", t2))(Kt || {});
var kn = new Set(Object.values(Kt));
function _n(t2) {
  return kn.has(t2);
}
var _t;
var vn = ["-h"];
var j2 = /* @__PURE__ */ Symbol("grepQuery");
var En = class {
  constructor() {
    this[_t] = [];
  }
  *[(_t = j2, Symbol.iterator)]() {
    for (const e of this[j2])
      yield e;
  }
  and(...e) {
    return e.length && this[j2].push("--and", "(", ...U(e, "-e"), ")"), this;
  }
  param(...e) {
    return this[j2].push(...U(e, "-e")), this;
  }
};
function Sn(...t2) {
  return new En().param(...t2);
}
function Rn(t2) {
  const e = /* @__PURE__ */ new Set, n = {};
  return ut(t2, (r3) => {
    const [s, o2, i] = r3.split(I2);
    e.add(s), (n[s] = n[s] || []).push({
      line: p(o2),
      path: s,
      preview: i
    });
  }), {
    paths: e,
    results: n
  };
}
function On() {
  return { grep(t2) {
    const e = u(arguments), n = h2(arguments);
    for (const s of vn)
      if (n.includes(s))
        return this._runTask(b2(`git.grep: use of "${s}" is not supported.`), e);
    typeof t2 == "string" && (t2 = Sn().param(t2));
    const r3 = [
      "grep",
      "--null",
      "-n",
      "--full-name",
      ...n,
      ...t2
    ];
    return this._runTask({
      commands: r3,
      format: "utf-8",
      parser(s) {
        return Rn(s);
      }
    }, e);
  } };
}
var Vt = /* @__PURE__ */ ((t2) => (t2.MIXED = "mixed", t2.SOFT = "soft", t2.HARD = "hard", t2.MERGE = "merge", t2.KEEP = "keep", t2))(Vt || {});
var Cn = L2(Object.values(Vt));
function An(t2, e) {
  const n = ["reset"];
  return Xt(t2) && n.push(`--${t2}`), n.push(...e), g(n);
}
function xn(t2) {
  if (Xt(t2))
    return t2;
  switch (typeof t2) {
    case "string":
    case "undefined":
      return "soft";
  }
}
function Xt(t2) {
  return typeof t2 == "string" && Cn.includes(t2);
}
import_src.default.formatters.L = (t2) => String(Bt(t2) ? t2.length : "-");
import_src.default.formatters.B = (t2) => Buffer.isBuffer(t2) ? t2.toString("utf8") : ft(t2);
function Nn() {
  return (0, import_src.default)("simple-git");
}
function vt(t2, e, n) {
  return !e || !String(e).replace(/\s*/, "") ? n ? (r3, ...s) => {
    t2(r3, ...s), n(r3, ...s);
  } : t2 : (r3, ...s) => {
    t2(`%s ${r3}`, e, ...s), n && n(r3, ...s);
  };
}
function $n(t2, e, { namespace: n }) {
  if (typeof t2 == "string")
    return t2;
  const r3 = e && e.namespace || "";
  return r3.startsWith(n) ? r3.substr(n.length + 1) : r3 || n;
}
function $2(t2, e, n, r3 = Nn()) {
  const s = t2 && `[${t2}]` || "", o2 = [], i = typeof e == "string" ? r3.extend(e) : e, a2 = $n(d(e, m), i, r3);
  return y2(n);
  function c3(w2, T2) {
    return S2(o2, $2(t2, a2.replace(/^[^:]+/, w2), T2, r3));
  }
  function y2(w2) {
    const T2 = w2 && `[${w2}]` || "", k2 = i && vt(i, T2) || W2, C2 = vt(r3, `${s} ${T2}`, k2);
    return Object.assign(i ? k2 : C2, {
      label: t2,
      sibling: c3,
      info: C2,
      step: y2
    });
  }
}
var M2 = class M3 {
  constructor(e = "GitExecutor") {
    this.logLabel = e, this._queue = /* @__PURE__ */ new Map;
  }
  withProgress(e) {
    return this._queue.get(e);
  }
  createProgress(e) {
    const n = M3.getName(e.commands[0]);
    return {
      task: e,
      logger: $2(this.logLabel, n),
      name: n
    };
  }
  push(e) {
    const n = this.createProgress(e);
    return n.logger("Adding task to the queue, commands = %o", e.commands), this._queue.set(e, n), n;
  }
  fatal(e) {
    for (const [n, { logger: r3 }] of Array.from(this._queue.entries()))
      n === e.task ? (r3.info("Failed %o", e), r3("Fatal exception, any as-yet un-started tasks run through this executor will not be attempted")) : r3.info("A fatal exception occurred in a previous task, the queue has been purged: %o", e.message), this.complete(n);
    if (this._queue.size !== 0)
      throw new Error(`Queue size should be zero after fatal: ${this._queue.size}`);
  }
  complete(e) {
    this.withProgress(e) && this._queue.delete(e);
  }
  attempt(e) {
    const n = this.withProgress(e);
    if (!n)
      throw new O2(undefined, "TasksPendingQueue: attempt called for an unknown task");
    return n.logger("Starting task"), n;
  }
  static getName(e = "empty") {
    return `task:${e}:${++M3.counter}`;
  }
};
M2.counter = 0;
var ot = M2;
var Pn = class {
  constructor(e, n, r3) {
    this._executor = e, this._scheduler = n, this._plugins = r3, this._chain = Promise.resolve(), this._queue = new ot;
  }
  get cwd() {
    return this._cwd || this._executor.cwd;
  }
  set cwd(e) {
    this._cwd = e;
  }
  get env() {
    return this._executor.env;
  }
  get outputHandler() {
    return this._executor.outputHandler;
  }
  chain() {
    return this;
  }
  push(e) {
    return this._queue.push(e), this._chain = this._chain.then(() => this.attemptTask(e));
  }
  async attemptTask(e) {
    const n = await this._scheduler.next(), r3 = () => this._queue.complete(e);
    try {
      const { logger: s } = this._queue.attempt(e);
      return await (kt(e) ? this.attemptEmptyTask(e, s) : this.attemptRemoteTask(e, s));
    } catch (s) {
      throw this.onFatalException(e, s);
    } finally {
      r3(), n();
    }
  }
  onFatalException(e, n) {
    const r3 = n instanceof O2 ? Object.assign(n, { task: e }) : new O2(e, n && String(n));
    return this._chain = Promise.resolve(), this._queue.fatal(r3), r3;
  }
  async attemptRemoteTask(e, n) {
    const r3 = this._plugins.exec("spawn.binary", "", this.taskContext(e, e.commands)), s = this._plugins.exec("spawn.args", [...e.commands], this.taskContext(e, e.commands)), o2 = await this.gitResponse(e, r3, s, this.outputHandler, n.step("SPAWN")), i = await this.handleTaskData(e, s, o2, n.step("HANDLE"));
    return n("passing response to task's parser as a %s", e.format), en(e) ? Tt(e.parser, i) : Tt(e.parser, i.asStrings());
  }
  async attemptEmptyTask(e, n) {
    return n("empty task bypassing child process to call to task's parser"), e.parser(this);
  }
  handleTaskData(e, n, r3, s) {
    const { exitCode: o2, rejection: i, stdOut: a2, stdErr: c3 } = r3;
    return new Promise((y2, w2) => {
      s("Preparing to handle process response exitCode=%d stdOut=", o2);
      const { error: T2 } = this._plugins.exec("task.error", { error: i }, {
        ...this.taskContext(e, n),
        ...r3
      });
      if (T2 && e.onError)
        return s.info("exitCode=%s handling with custom error handler"), e.onError(r3, T2, (k2) => {
          s.info("custom error handler treated as success"), s("custom error returned a %s", ft(k2)), y2(new z2(Array.isArray(k2) ? Buffer.concat(k2) : k2, Buffer.concat(c3)));
        }, w2);
      if (T2)
        return s.info("handling as error: exitCode=%s stdErr=%s rejection=%o", o2, c3.length, i), w2(T2);
      s.info("retrieving task output complete"), y2(new z2(Buffer.concat(a2), Buffer.concat(c3)));
    });
  }
  async gitResponse(e, n, r3, s, o2) {
    const i = o2.sibling("output"), a2 = this._plugins.exec("spawn.options", {
      cwd: this.cwd,
      env: this.env,
      windowsHide: true
    }, this.taskContext(e, e.commands));
    return new Promise((c3) => {
      const y2 = [], w2 = [];
      o2.info("%s %o", n, r3), o2("%O", a2);
      let T2 = this._beforeSpawn(e, r3);
      if (T2)
        return c3({
          stdOut: y2,
          stdErr: w2,
          exitCode: 9901,
          rejection: T2
        });
      this._plugins.exec("spawn.before", undefined, {
        ...this.taskContext(e, r3),
        kill(C2) {
          T2 = C2 || T2;
        }
      });
      const k2 = spawn(n, r3, a2);
      k2.stdout.on("data", Et(y2, "stdOut", o2, i.step("stdOut"))), k2.stderr.on("data", Et(w2, "stdErr", o2, i.step("stdErr"))), k2.on("error", Mn(w2, o2)), s && (o2("Passing child process stdOut/stdErr to custom outputHandler"), s(n, k2.stdout, k2.stderr, [...r3])), this._plugins.exec("spawn.after", undefined, {
        ...this.taskContext(e, r3),
        spawned: k2,
        close(C2, Te) {
          c3({
            stdOut: y2,
            stdErr: w2,
            exitCode: C2,
            rejection: T2 || Te
          });
        },
        kill(C2) {
          k2.killed || (T2 = C2, k2.kill("SIGINT"));
        }
      });
    });
  }
  _beforeSpawn(e, n) {
    let r3;
    return this._plugins.exec("spawn.before", undefined, {
      ...this.taskContext(e, n),
      kill(s) {
        r3 = s || r3;
      }
    }), r3;
  }
  taskContext(e, n) {
    return {
      method: String(Me(e.commands) || ""),
      commands: n,
      env: { ...this.env },
      input: kt(e) ? undefined : e.input
    };
  }
};
function Mn(t2, e) {
  return (n) => {
    e("[ERROR] child process exception %o", n), t2.push(Buffer.from(String(n.stack), "ascii"));
  };
}
function Et(t2, e, n, r3) {
  return (s) => {
    n("%s received %L bytes", e, s), r3("%B", s), t2.push(s);
  };
}
var Dn = class {
  constructor(e, n, r3) {
    this.cwd = e, this._scheduler = n, this._plugins = r3, this._chain = this.chain();
  }
  chain() {
    return new Pn(this, this._scheduler, this._plugins);
  }
  push(e) {
    return this._chain.push(e);
  }
};
function Ln(t2, e, n = W2) {
  const r3 = (o2) => {
    n(null, o2);
  }, s = (o2) => {
    o2?.task === t2 && n(o2, undefined);
  };
  e.then(r3, s);
}
function St(t2, e) {
  return tn((n) => {
    if (!Lt(t2))
      throw new Error(`Git.cwd: cannot change to non-directory "${t2}"`);
    return (e || n).cwd = t2;
  });
}
function Q2(t2) {
  const e = ["checkout", ...t2];
  return e[1] === "-b" && e.includes("-B") && (e[1] = ct(e, "-B")), g(e);
}
function jn() {
  return {
    checkout() {
      return this._runTask(Q2(h2(arguments, 1)), u(arguments));
    },
    checkoutBranch(t2, e) {
      return this._runTask(Q2([
        "-b",
        t2,
        e,
        ...h2(arguments)
      ]), u(arguments));
    },
    checkoutLocalBranch(t2) {
      return this._runTask(Q2([
        "-b",
        t2,
        ...h2(arguments)
      ]), u(arguments));
    }
  };
}
var Yt = (t2, e, n) => {
  const r3 = ["clone", ...n];
  return m(t2) && r3.push(c(t2)), m(e) && r3.push(c(e)), g(r3);
};
var Bn = (t2, e, n) => (S2(n, "--mirror"), Yt(t2, e, n));
function Rt(t2, e, n, ...r3) {
  return m(n) ? e(n, d(r3[0], m), h2(arguments)) : b2(`git.${t2}() requires a string 'repoPath'`);
}
function In() {
  return {
    clone(t2, ...e) {
      return this._runTask(Rt("clone", Yt, d(t2, m), ...e), u(arguments));
    },
    mirror(t2, ...e) {
      return this._runTask(Rt("mirror", Bn, d(t2, m), ...e), u(arguments));
    }
  };
}
var Un = [
  new l2(/^\[([^\s]+)( \([^)]+\))? ([^\]]+)/, (t2, [e, n, r3]) => {
    t2.branch = e, t2.commit = r3, t2.root = !!n;
  }),
  new l2(/\s*Author:\s(.+)/i, (t2, [e]) => {
    const n = e.split("<"), r3 = n.pop();
    !r3 || !r3.includes("@") || (t2.author = {
      email: r3.substr(0, r3.length - 1),
      name: n.join("<").trim()
    });
  }),
  new l2(/(\d+)[^,]*(?:,\s*(\d+)[^,]*)(?:,\s*(\d+))/g, (t2, [e, n, r3]) => {
    t2.summary.changes = parseInt(e, 10) || 0, t2.summary.insertions = parseInt(n, 10) || 0, t2.summary.deletions = parseInt(r3, 10) || 0;
  }),
  new l2(/^(\d+)[^,]*(?:,\s*(\d+)[^(]+\(([+-]))?/, (t2, [e, n, r3]) => {
    t2.summary.changes = parseInt(e, 10) || 0;
    const s = parseInt(n, 10) || 0;
    r3 === "-" ? t2.summary.deletions = s : r3 === "+" && (t2.summary.insertions = s);
  })
];
function Fn(t2) {
  return E2({
    author: null,
    branch: "",
    commit: "",
    root: false,
    summary: {
      changes: 0,
      insertions: 0,
      deletions: 0
    }
  }, Un, t2);
}
function Gn(t2, e, n) {
  return {
    commands: [
      "-c",
      "core.abbrev=40",
      "commit",
      ...U(t2, "-m"),
      ...e,
      ...n
    ],
    format: "utf-8",
    parser: Fn
  };
}
function zn() {
  return { commit(e, ...n) {
    const r3 = u(arguments), s = t2(e) || Gn(v(e), v(d(n[0], G2, [])), [...L2(d(n[1], K2, [])), ...h2(arguments, 0, true)]);
    return this._runTask(s, r3);
  } };
  function t2(e) {
    return !G2(e) && b2("git.commit: requires the commit message to be supplied as a string/string[]");
  }
}
function qn() {
  return {
    count: 0,
    garbage: 0,
    inPack: 0,
    packs: 0,
    prunePackable: 0,
    size: 0,
    sizeGarbage: 0,
    sizePack: 0
  };
}
var Wn = new l2(/([a-z-]+): (\d+)$/, (t2, [e, n]) => {
  const r3 = jt(e);
  Object.hasOwn(t2, r3) && (t2[r3] = p(n));
});
function Hn() {
  return { countObjects() {
    return this._runTask({
      commands: ["count-objects", "--verbose"],
      format: "utf-8",
      parser(t2) {
        return E2(qn(), [Wn], t2);
      }
    });
  } };
}
function Kn() {
  return { firstCommit() {
    return this._runTask(g([
      "rev-list",
      "--max-parents=0",
      "HEAD"
    ], true), u(arguments));
  } };
}
function Vn(t2, e) {
  const n = ["hash-object", t2];
  return e && n.push("-w"), g(n, true);
}
var J2 = class {
  constructor(e, n, r3, s) {
    this.bare = e, this.path = n, this.existing = r3, this.gitDir = s;
  }
};
var Xn = /^Init.+ repository in (.+)$/;
var Yn = /^Rein.+ in (.+)$/;
function Qn(t2, e, n) {
  const r3 = String(n).trim();
  let s;
  if (s = Xn.exec(r3))
    return new J2(t2, e, false, s[1]);
  if (s = Yn.exec(r3))
    return new J2(t2, e, true, s[1]);
  let o2 = "";
  const i = r3.split(" ");
  for (;i.length; )
    if (i.shift() === "in") {
      o2 = i.join(" ");
      break;
    }
  return new J2(t2, e, /^re/i.test(r3), o2);
}
var Qt = "--bare";
function Jn(t2) {
  return t2.includes(Qt);
}
function Zn(t2 = false, e, n) {
  const r3 = ["init", ...n];
  return t2 && !Jn(r3) && r3.splice(1, 0, Qt), {
    commands: r3,
    format: "utf-8",
    parser(s) {
      return Qn(r3.includes("--bare"), e, s);
    }
  };
}
function tr(t2) {
  return t2 === undefined ? b2("interpretTrailers called without input content") : {
    format: "utf-8",
    parser(e) {
      return Object.fromEntries(ut(e, (n) => {
        const r3 = n.indexOf(":");
        return [jt(n.substring(0, r3).toLowerCase()), n.substring(r3 + 2).trim()];
      }));
    },
    commands: ["interpret-trailers", "--parse"],
    input: t2
  };
}
function er() {
  return { interpretTrailers(t2) {
    return this._runTask(tr(d(t2, Be)), u(arguments));
  } };
}
var R3 = /* @__PURE__ */ ((t2) => (t2.NONE = "", t2.STAT = "--stat", t2.NUM_STAT = "--numstat", t2.NAME_ONLY = "--name-only", t2.NAME_STATUS = "--name-status", t2))(R3 || {});
var Jt = /^--(stat|numstat|name-only|name-status)(=|$)/;
function pt(t2) {
  for (let e = 0;e < t2.length; e++) {
    const n = Jt.exec(t2[e]);
    if (n)
      return `--${n[1]}`;
  }
  return "";
}
function nr(t2) {
  return Jt.test(t2);
}
var rr = class {
  constructor() {
    this.changed = 0, this.deletions = 0, this.insertions = 0, this.files = [];
  }
};
var Ot = [
  new l2(/^(.+)\s+\|\s+(\d+)(\s+[+\-]+)?$/, (t2, [e, n, r3 = ""]) => {
    t2.files.push({
      file: e.trim(),
      changes: p(n),
      insertions: r3.replace(/[^+]/g, "").length,
      deletions: r3.replace(/[^-]/g, "").length,
      binary: false
    });
  }),
  new l2(/^(.+) \|\s+Bin ([0-9.]+) -> ([0-9.]+) ([a-z]+)/, (t2, [e, n, r3]) => {
    t2.files.push({
      file: e.trim(),
      before: p(n),
      after: p(r3),
      binary: true
    });
  }),
  new l2(/^(.+)\s+\|\s+Bin\s*$/, (t2, [e]) => {
    t2.files.push({
      file: e.trim(),
      before: 0,
      after: 0,
      binary: true
    });
  }),
  new l2(/(\d+) files? changed\s*((?:, \d+ [^,]+){0,2})/, (t2, [e, n]) => {
    const r3 = /(\d+) i/.exec(n), s = /(\d+) d/.exec(n);
    t2.changed = p(e), t2.insertions = p(r3?.[1]), t2.deletions = p(s?.[1]);
  })
];
var sr = [new l2(/(\d+)\t(\d+)\t(.+)$/, (t2, [e, n, r3]) => {
  const s = p(e), o2 = p(n);
  t2.changed++, t2.insertions += s, t2.deletions += o2, t2.files.push({
    file: r3,
    changes: s + o2,
    insertions: s,
    deletions: o2,
    binary: false
  });
}), new l2(/-\t-\t(.+)$/, (t2, [e]) => {
  t2.changed++, t2.files.push({
    file: e,
    after: 0,
    before: 0,
    binary: true
  });
})];
var or = [new l2(/(.+)$/, (t2, [e]) => {
  t2.changed++, t2.files.push({
    file: e,
    changes: 0,
    insertions: 0,
    deletions: 0,
    binary: false
  });
})];
var ir = [new l2(/([ACDMRTUXB])([0-9]{0,3})\t(.[^\t]*)(\t(.[^\t]*))?$/, (t2, [e, n, r3, s, o2]) => {
  t2.changed++, t2.files.push({
    file: o2 ?? r3,
    changes: 0,
    insertions: 0,
    deletions: 0,
    binary: false,
    status: bt(_n(e) && e),
    from: bt(!!o2 && r3 !== o2 && r3),
    similarity: p(n)
  });
})];
var ar = {
  [R3.NONE]: Ot,
  [R3.STAT]: Ot,
  [R3.NUM_STAT]: sr,
  [R3.NAME_STATUS]: ir,
  [R3.NAME_ONLY]: or
};
function Zt(t2 = R3.NONE) {
  const e = ar[t2];
  return (n) => E2(new rr, e, n, false);
}
var te = "òòòòòò ";
var ee2 = " òò";
var ne2 = " ò ";
var ur = [
  "hash",
  "date",
  "message",
  "refs",
  "author_name",
  "author_email"
];
function cr(t2, e) {
  return e.reduce((n, r3, s) => (n[r3] = t2[s] || "", n), /* @__PURE__ */ Object.create({ diff: null }));
}
function re(t2 = ne2, e = ur, n = R3.NONE) {
  const r3 = Zt(n);
  return function(s) {
    const o2 = H2(s.trim(), false, te).map(function(i) {
      const a2 = i.split(ee2), c3 = cr(a2[0].split(t2), e);
      return a2.length > 1 && a2[1].trim() && (c3.diff = r3(a2[1])), c3;
    });
    return {
      all: o2,
      latest: o2.length && o2[0] || null,
      total: o2.length
    };
  };
}
function fr(t2) {
  let e = pt(t2);
  const n = ["diff"];
  return e === R3.NONE && (e = R3.STAT, n.push("--stat=4096")), n.push(...t2), dt(n) || {
    commands: n,
    format: "utf-8",
    parser: Zt(e)
  };
}
function dt(t2) {
  const e = t2.filter(nr);
  if (e.length > 1)
    return b2(`Summary flags are mutually exclusive - pick one of ${e.join(",")}`);
  if (e.length && t2.includes("-z"))
    return b2(`Summary flag ${e} parsing is not compatible with null termination option '-z'`);
}
var se = /* @__PURE__ */ ((t2) => (t2[t2["--pretty"] = 0] = "--pretty", t2[t2["max-count"] = 1] = "max-count", t2[t2.maxCount = 2] = "maxCount", t2[t2.n = 3] = "n", t2[t2.file = 4] = "file", t2[t2.format = 5] = "format", t2[t2.from = 6] = "from", t2[t2.to = 7] = "to", t2[t2.splitter = 8] = "splitter", t2[t2.symmetric = 9] = "symmetric", t2[t2.mailMap = 10] = "mailMap", t2[t2.multiLine = 11] = "multiLine", t2[t2.strictDate = 12] = "strictDate", t2))(se || {});
function lr(t2, e) {
  const n = [], r3 = [];
  return Object.keys(t2).forEach((s) => {
    n.push(s), r3.push(String(t2[s]));
  }), [n, r3.join(e)];
}
function hr(t2) {
  return Object.keys(t2).reduce((e, n) => ((n in se) || (e[n] = t2[n]), e), {});
}
function oe2(t2 = {}, e = []) {
  const n = d(t2.splitter, m, ne2), [s, o2] = lr(lt(t2.format) ? t2.format : {
    hash: "%H",
    date: t2.strictDate === false ? "%ai" : "%aI",
    message: "%s",
    refs: "%D",
    body: t2.multiLine ? "%B" : "%b",
    author_name: t2.mailMap !== false ? "%aN" : "%an",
    author_email: t2.mailMap !== false ? "%aE" : "%ae"
  }, n), i = [], a2 = [`--pretty=format:${te}${o2}${ee2}`, ...e], c$1 = t2.n || t2["max-count"] || t2.maxCount;
  if (c$1 && a2.push(`--max-count=${c$1}`), t2.from || t2.to) {
    const y2 = t2.symmetric !== false ? "..." : "..";
    i.push(`${t2.from || ""}${y2}${t2.to || ""}`);
  }
  return m(t2.file) && a2.push("--follow", c(t2.file)), It(hr(t2), a2), {
    fields: s,
    splitter: n,
    commands: [...a2, ...i]
  };
}
function mr(t2, e, n) {
  const r3 = re(t2, e, pt(n));
  return {
    commands: ["log", ...n],
    format: "utf-8",
    parser: r3
  };
}
function pr() {
  return { log(...n) {
    const r3 = u(arguments), s = oe2(ht(arguments), L2(d(arguments[0], K2, []))), o2 = e(...n) || dt(s.commands) || t2(s);
    return this._runTask(o2, r3);
  } };
  function t2(n) {
    return mr(n.splitter, n.fields, n.commands);
  }
  function e(n, r3) {
    return m(n) && m(r3) && b2("git.log(string, string) should be replaced with git.log({ from: string, to: string })");
  }
}
var Z2 = class {
  constructor(e, n = null, r3) {
    this.reason = e, this.file = n, this.meta = r3;
  }
  toString() {
    return `${this.file}:${this.reason}`;
  }
};
var dr = class {
  constructor() {
    this.conflicts = [], this.merges = [], this.result = "success";
  }
  get failed() {
    return this.conflicts.length > 0;
  }
  get reason() {
    return this.result;
  }
  toString() {
    return this.conflicts.length ? `CONFLICTS: ${this.conflicts.join(", ")}` : "OK";
  }
};
var ie = class {
  constructor() {
    this.remoteMessages = { all: [] }, this.created = [], this.deleted = [], this.files = [], this.deletions = {}, this.insertions = {}, this.summary = {
      changes: 0,
      deletions: 0,
      insertions: 0
    };
  }
};
var gr = class {
  constructor() {
    this.remote = "", this.hash = {
      local: "",
      remote: ""
    }, this.branch = {
      local: "",
      remote: ""
    }, this.message = "";
  }
  toString() {
    return this.message;
  }
};
function tt(t2) {
  return t2.objects = t2.objects || {
    compressing: 0,
    counting: 0,
    enumerating: 0,
    packReused: 0,
    reused: {
      count: 0,
      delta: 0
    },
    total: {
      count: 0,
      delta: 0
    }
  };
}
function Ct(t2) {
  const e = /^\s*(\d+)/.exec(t2), n = /delta (\d+)/i.exec(t2);
  return {
    count: p(e && e[1] || "0"),
    delta: p(n && n[1] || "0")
  };
}
var yr = [
  new x2(/^remote:\s*(enumerating|counting|compressing) objects: (\d+),/i, (t2, [e, n]) => {
    const r3 = e.toLowerCase(), s = tt(t2.remoteMessages);
    Object.assign(s, { [r3]: p(n) });
  }),
  new x2(/^remote:\s*(enumerating|counting|compressing) objects: \d+% \(\d+\/(\d+)\),/i, (t2, [e, n]) => {
    const r3 = e.toLowerCase(), s = tt(t2.remoteMessages);
    Object.assign(s, { [r3]: p(n) });
  }),
  new x2(/total ([^,]+), reused ([^,]+), pack-reused (\d+)/i, (t2, [e, n, r3]) => {
    const s = tt(t2.remoteMessages);
    s.total = Ct(e), s.reused = Ct(n), s.packReused = p(r3);
  })
];
var wr = [
  new x2(/^remote:\s*(.+)$/, (t2, [e]) => (t2.remoteMessages.all.push(e.trim()), false)),
  ...yr,
  new x2([/create a (?:pull|merge) request/i, /\s(https?:\/\/\S+)$/], (t2, [e]) => {
    t2.remoteMessages.pullRequestUrl = e;
  }),
  new x2([/found (\d+) vulnerabilities.+\(([^)]+)\)/i, /\s(https?:\/\/\S+)$/], (t2, [e, n, r3]) => {
    t2.remoteMessages.vulnerabilities = {
      count: p(e),
      summary: n,
      url: r3
    };
  })
];
function ae(t2, e) {
  return E2({ remoteMessages: new br }, wr, e);
}
var br = class {
  constructor() {
    this.all = [];
  }
};
var vr = [
  new l2(/^\s*(.+?)\s+\|\s+\d+\s*(\+*)(-*)/, (t2, [e, n, r3]) => {
    t2.files.push(e), n && (t2.insertions[e] = n.length), r3 && (t2.deletions[e] = r3.length);
  }),
  new l2(/(\d+)\D+((\d+)\D+\(\+\))?(\D+(\d+)\D+\(-\))?/, (t2, [e, , n, , r3]) => n !== undefined || r3 !== undefined ? (t2.summary.changes = +e || 0, t2.summary.insertions = +n || 0, t2.summary.deletions = +r3 || 0, true) : false),
  new l2(/^(create|delete) mode \d+ (.+)/, (t2, [e, n]) => {
    S2(t2.files, n), S2(e === "create" ? t2.created : t2.deleted, n);
  })
];
var Er = [
  new l2(/^from\s(.+)$/i, (t2, [e]) => {
    t2.remote = e;
  }),
  new l2(/^fatal:\s(.+)$/, (t2, [e]) => {
    t2.message = e;
  }),
  new l2(/([a-z0-9]+)\.\.([a-z0-9]+)\s+(\S+)\s+->\s+(\S+)$/, (t2, [e, n, r3, s]) => {
    t2.branch.local = r3, t2.hash.local = e, t2.branch.remote = s, t2.hash.remote = n;
  })
];
var Sr = (t2, e) => E2(new ie, vr, [t2, e]);
var ue = (t2, e) => Object.assign(new ie, Sr(t2, e), ae(t2, e));
function Rr(t2, e) {
  const n = E2(new gr, Er, [t2, e]);
  return n.message && n;
}
var Or = [
  new l2(/^Auto-merging\s+(.+)$/, (t2, [e]) => {
    t2.merges.push(e);
  }),
  new l2(/^CONFLICT\s+\((.+)\): Merge conflict in (.+)$/, (t2, [e, n]) => {
    t2.conflicts.push(new Z2(e, n));
  }),
  new l2(/^CONFLICT\s+\((.+\/delete)\): (.+) deleted in (.+) and/, (t2, [e, n, r3]) => {
    t2.conflicts.push(new Z2(e, n, { deleteRef: r3 }));
  }),
  new l2(/^CONFLICT\s+\((.+)\):/, (t2, [e]) => {
    t2.conflicts.push(new Z2(e, null));
  }),
  new l2(/^Automatic merge failed;\s+(.+)$/, (t2, [e]) => {
    t2.result = e;
  })
];
var Cr = (t2, e) => Object.assign(Ar(t2), ue(t2, e));
var Ar = (t2) => E2(new dr, Or, t2);
function At(t2) {
  return t2.length ? {
    commands: ["merge", ...t2],
    format: "utf-8",
    parser(e, n) {
      const r3 = Cr(e, n);
      if (r3.failed)
        throw new at(r3);
      return r3;
    }
  } : b2("Git.merge requires at least one option");
}
function xr(t2, e, n) {
  const r3 = n.includes("deleted"), s = n.includes("tag") || /^refs\/tags/.test(t2), o2 = !n.includes("new");
  return {
    deleted: r3,
    tag: s,
    branch: !s,
    new: !o2,
    alreadyUpdated: o2,
    local: t2,
    remote: e
  };
}
var Nr = [
  new l2(/^Pushing to (.+)$/, (t2, [e]) => {
    t2.repo = e;
  }),
  new l2(/^updating local tracking ref '(.+)'/, (t2, [e]) => {
    t2.ref = {
      ...t2.ref || {},
      local: e
    };
  }),
  new l2(/^[=*-]\s+([^:]+):(\S+)\s+\[(.+)]$/, (t2, [e, n, r3]) => {
    t2.pushed.push(xr(e, n, r3));
  }),
  new l2(/^Branch '([^']+)' set up to track remote branch '([^']+)' from '([^']+)'/, (t2, [e, n, r3]) => {
    t2.branch = {
      ...t2.branch || {},
      local: e,
      remote: n,
      remoteName: r3
    };
  }),
  new l2(/^([^:]+):(\S+)\s+([a-z0-9]+)\.\.([a-z0-9]+)$/, (t2, [e, n, r3, s]) => {
    t2.update = {
      head: {
        local: e,
        remote: n
      },
      hash: {
        from: r3,
        to: s
      }
    };
  })
];
var $r = (t2, e) => {
  const n = Pr(t2, e), r3 = ae(t2, e);
  return {
    ...n,
    ...r3
  };
};
var Pr = (t2, e) => E2({ pushed: [] }, Nr, [t2, e]);
function Mr(t2 = {}, e) {
  return S2(e, "--tags"), ce(t2, e);
}
function ce(t2 = {}, e) {
  const n = ["push", ...e];
  return t2.branch && n.splice(1, 0, t2.branch), t2.remote && n.splice(1, 0, t2.remote), ct(n, "-v"), S2(n, "--verbose"), S2(n, "--porcelain"), {
    commands: n,
    format: "utf-8",
    parser: $r
  };
}
function Dr() {
  return {
    showBuffer() {
      const t2 = ["show", ...h2(arguments, 1)];
      return t2.includes("--binary") || t2.splice(1, 0, "--binary"), this._runTask(Gt(t2), u(arguments));
    },
    show() {
      const t2 = ["show", ...h2(arguments, 1)];
      return this._runTask(g(t2), u(arguments));
    }
  };
}
var Lr = /^(.+)\0(.+)$/;
var jr = class {
  constructor(e, n, r3) {
    if (this.path = e, this.index = n, this.working_dir = r3, n === "R" || r3 === "R") {
      const s = Lr.exec(e) || [
        null,
        e,
        e
      ];
      this.from = s[2] || "", this.path = s[1] || "";
    }
  }
};
var Br = class {
  constructor() {
    this.not_added = [], this.conflicted = [], this.created = [], this.deleted = [], this.ignored = undefined, this.modified = [], this.renamed = [], this.files = [], this.staged = [], this.ahead = 0, this.behind = 0, this.current = null, this.tracking = null, this.detached = false, this.isClean = () => !this.files.length;
  }
};
function xt(t2) {
  const [e, n] = t2.split(I2);
  return {
    from: n || e,
    to: e
  };
}
function _2(t2, e, n) {
  return [`${t2}${e}`, n];
}
function et(t2, ...e) {
  return e.map((n) => _2(t2, n, (r3, s) => r3.conflicted.push(s)));
}
var Ir = new Map([
  _2(" ", "A", (t2, e) => t2.created.push(e)),
  _2(" ", "D", (t2, e) => t2.deleted.push(e)),
  _2(" ", "M", (t2, e) => t2.modified.push(e)),
  _2("A", " ", (t2, e) => {
    t2.created.push(e), t2.staged.push(e);
  }),
  _2("A", "M", (t2, e) => {
    t2.created.push(e), t2.staged.push(e), t2.modified.push(e);
  }),
  _2("D", " ", (t2, e) => {
    t2.deleted.push(e), t2.staged.push(e);
  }),
  _2("M", " ", (t2, e) => {
    t2.modified.push(e), t2.staged.push(e);
  }),
  _2("M", "M", (t2, e) => {
    t2.modified.push(e), t2.staged.push(e);
  }),
  _2("R", " ", (t2, e) => {
    t2.renamed.push(xt(e));
  }),
  _2("R", "M", (t2, e) => {
    const n = xt(e);
    t2.renamed.push(n), t2.modified.push(n.to);
  }),
  _2("!", "!", (t2, e) => {
    (t2.ignored = t2.ignored || []).push(e);
  }),
  _2("?", "?", (t2, e) => t2.not_added.push(e)),
  ...et("A", "A", "U"),
  ...et("D", "D", "U"),
  ...et("U", "A", "D", "U"),
  ["##", (t2, e) => {
    const n = /ahead (\d+)/, r3 = /behind (\d+)/, s = /^(.+?(?=(?:\.{3}|\s|$)))/, o2 = /\.{3}(\S*)/, i = /\son\s(\S+?)(?=\.{3}|$)/;
    let a2 = n.exec(e);
    t2.ahead = a2 && +a2[1] || 0, a2 = r3.exec(e), t2.behind = a2 && +a2[1] || 0, a2 = s.exec(e), t2.current = d(a2?.[1], m, null), a2 = o2.exec(e), t2.tracking = d(a2?.[1], m, null), a2 = i.exec(e), a2 && (t2.current = d(a2?.[1], m, t2.current)), t2.detached = /\(no branch\)/.test(e);
  }]
]);
var Ur = function(t2) {
  const e = t2.split(I2), n = new Br;
  for (let r3 = 0, s = e.length;r3 < s; ) {
    let o2 = e[r3++].trim();
    o2 && (o2.charAt(0) === "R" && (o2 += I2 + (e[r3++] || "")), Fr(n, o2));
  }
  return n;
};
function Fr(t2, e) {
  const n = e.trim();
  switch (" ") {
    case n.charAt(2):
      return r3(n.charAt(0), n.charAt(1), n.slice(3));
    case n.charAt(1):
      return r3(" ", n.charAt(0), n.slice(2));
    default:
      return;
  }
  function r3(s, o2, i) {
    const a2 = `${s}${o2}`, c3 = Ir.get(a2);
    c3 && c3(t2, i), a2 !== "##" && a2 !== "!!" && t2.files.push(new jr(i, s, o2));
  }
}
var Gr = ["--null", "-z"];
function zr(t2) {
  return {
    format: "utf-8",
    commands: [
      "status",
      "--porcelain",
      "-b",
      "-u",
      "--null",
      ...t2.filter((n) => !Gr.includes(n))
    ],
    parser(n) {
      return Ur(n);
    }
  };
}
var fe = "installed=false";
function q2(t2 = 0, e = 0, n = 0, r3 = "", s = true) {
  return Object.defineProperty({
    major: t2,
    minor: e,
    patch: n,
    agent: r3,
    installed: s
  }, "toString", {
    value() {
      return `${this.major}.${this.minor}.${this.patch}`;
    },
    configurable: false,
    enumerable: false
  });
}
function qr() {
  return q2(0, 0, 0, "", false);
}
function Wr() {
  return { version() {
    return this._runTask({
      commands: ["--version"],
      format: "utf-8",
      parser: Kr,
      onError(t2, e, n, r3) {
        if (t2.exitCode === V2.NOT_FOUND)
          return n(Buffer.from(fe));
        r3(e);
      }
    });
  } };
}
var Hr = [new l2(/version (\d+)\.(\d+)\.(\d+)(?:\s*\((.+)\))?/, (t2, [e, n, r3, s = ""]) => {
  Object.assign(t2, q2(p(e), p(n), p(r3), s));
}), new l2(/version (\d+)\.(\d+)\.(\D+)(.+)?$/, (t2, [e, n, r3, s = ""]) => {
  Object.assign(t2, q2(p(e), p(n), r3, s));
})];
function Kr(t2) {
  return t2 === fe ? qr() : E2(q2(0, 0, 0, t2), Hr, t2);
}
var le = class {
  constructor(e) {
    this._executor = e;
  }
  _runTask(e, n) {
    const r3 = this._executor.chain(), s = r3.push(e);
    return n && Ln(e, s, n), Object.create(this, {
      then: { value: s.then.bind(s) },
      catch: { value: s.catch.bind(s) },
      _executor: { value: r3 }
    });
  }
  add(e) {
    return this._runTask(g(["add", ...v(e)]), u(arguments));
  }
  cwd(e) {
    const n = u(arguments);
    return typeof e == "string" ? this._runTask(St(e, this._executor), n) : typeof e?.path == "string" ? this._runTask(St(e.path, e.root && this._executor || undefined), n) : this._runTask(b2("Git.cwd: workingDirectory must be supplied as a string"), n);
  }
  hashObject(e, n) {
    return this._runTask(Vn(e, n === true), u(arguments));
  }
  init(e) {
    return this._runTask(Zn(e === true, this._executor.cwd, h2(arguments)), u(arguments));
  }
  merge() {
    return this._runTask(At(h2(arguments)), u(arguments));
  }
  mergeFromTo(e, n) {
    return m(e) && m(n) ? this._runTask(At([
      e,
      n,
      ...h2(arguments)
    ]), u(arguments, false)) : this._runTask(b2("Git.mergeFromTo requires that the 'remote' and 'branch' arguments are supplied as strings"));
  }
  outputHandler(e) {
    return this._executor.outputHandler = e, this;
  }
  push() {
    const e = ce({
      remote: d(arguments[0], m),
      branch: d(arguments[1], m)
    }, h2(arguments));
    return this._runTask(e, u(arguments));
  }
  stash() {
    return this._runTask(g(["stash", ...h2(arguments)]), u(arguments));
  }
  status() {
    return this._runTask(zr(h2(arguments)), u(arguments));
  }
};
Object.assign(le.prototype, jn(), In(), zn(), Tn(), Hn(), Kn(), On(), er(), pr(), Dr(), Wr());
var Vr = /* @__PURE__ */ (() => {
  let t2 = 0;
  return () => {
    t2++;
    const { promise: e, done: n } = (0, import_dist$1.createDeferred)();
    return {
      promise: e,
      done: n,
      id: t2
    };
  };
})();
var Xr = class {
  constructor(e = 2) {
    this.concurrency = e, this.logger = $2("", "scheduler"), this.pending = [], this.running = [], this.logger("Constructed, concurrency=%s", e);
  }
  schedule() {
    if (!this.pending.length || this.running.length >= this.concurrency) {
      this.logger("Schedule attempt ignored, pending=%s running=%s concurrency=%s", this.pending.length, this.running.length, this.concurrency);
      return;
    }
    const e = S2(this.running, this.pending.shift());
    this.logger("Attempting id=%s", e.id), e.done(() => {
      this.logger("Completing id=", e.id), ct(this.running, e), this.schedule();
    });
  }
  next() {
    const { promise: e, id: n } = S2(this.pending, Vr());
    return this.logger("Scheduling id=%s", n), this.schedule(), e;
  }
};
function Yr(t2, e) {
  return g([
    "apply",
    ...e,
    ...t2
  ]);
}
var he = /* @__PURE__ */ ((t2) => (t2.CURRENT = "*", t2.LINKED = "+", t2))(he || {});
var Qr = class {
  constructor() {
    this.all = [], this.branches = {}, this.current = "", this.detached = false;
  }
  push(e, n, r3, s, o2) {
    e === "*" && (this.detached = n, this.current = r3), this.all.push(r3), this.branches[r3] = {
      current: e === "*",
      linkedWorkTree: e === "+",
      name: r3,
      commit: s,
      label: o2
    };
  }
};
var Jr = [new l2(/^([*+]\s)?\((?:HEAD )?detached (?:from|at) (\S+)\)\s+([a-z0-9]+)\s(.*)$/, (t2, [e, n, r3, s]) => {
  t2.push(Nt(e), true, n, r3, s);
}), new l2(/^([*+]\s)?(\S+)\s+([a-z0-9]+)\s?(.*)$/s, (t2, [e, n, r3, s]) => {
  t2.push(Nt(e), false, n, r3, s);
})];
var Zr = new l2(/^(\S+)$/s, (t2, [e]) => {
  t2.push(he.CURRENT, false, e, "", "");
});
function Nt(t2) {
  return t2 ? t2.charAt(0) : "";
}
function me(t2, e = false) {
  return E2(new Qr, e ? [Zr] : Jr, t2);
}
var ts = class {
  constructor() {
    this.all = [], this.branches = {}, this.errors = [];
  }
  get success() {
    return !this.errors.length;
  }
};
function es(t2, e) {
  return {
    branch: t2,
    hash: e,
    success: true
  };
}
function ns(t2) {
  return {
    branch: t2,
    hash: null,
    success: false
  };
}
var rs = /(\S+)\s+\(\S+\s([^)]+)\)/;
var pe = /^error[^']+'([^']+)'/m;
var ss = [new l2(rs, (t2, [e, n]) => {
  const r3 = es(e, n);
  t2.all.push(r3), t2.branches[e] = r3;
}), new l2(pe, (t2, [e]) => {
  const n = ns(e);
  t2.errors.push(n), t2.all.push(n), t2.branches[e] = n;
})];
var gt = (t2, e) => E2(new ts, ss, [t2, e]);
function de(t2, e) {
  return e === V2.ERROR && pe.test(t2);
}
function os(t2) {
  const e = [
    "-d",
    "-D",
    "--delete"
  ];
  return t2.some((n) => e.includes(n));
}
function is(t2) {
  const e = os(t2), n = t2.includes("--show-current"), r3 = ["branch", ...t2];
  return r3.length === 1 && r3.push("-a"), r3.includes("-v") || r3.splice(1, 0, "-v"), {
    format: "utf-8",
    commands: r3,
    parser(s, o2) {
      return e ? gt(s, o2).all[0] : me(s, n);
    }
  };
}
function as() {
  return {
    format: "utf-8",
    commands: ["branch", "-v"],
    parser(t2) {
      return me(t2);
    }
  };
}
function us(t2, e = false) {
  return {
    format: "utf-8",
    commands: [
      "branch",
      "-v",
      e ? "-D" : "-d",
      ...t2
    ],
    parser(n, r3) {
      return gt(n, r3);
    },
    onError({ exitCode: n, stdOut: r3 }, s, o2, i) {
      if (!de(String(s), n))
        return i(s);
      o2(r3);
    }
  };
}
function cs(t2, e = false) {
  const n = {
    format: "utf-8",
    commands: [
      "branch",
      "-v",
      e ? "-D" : "-d",
      t2
    ],
    parser(r3, s) {
      return gt(r3, s).branches[t2];
    },
    onError({ exitCode: r3, stdErr: s, stdOut: o2 }, i, a2, c3) {
      if (!de(String(i), r3))
        return c3(i);
      throw new at(n.parser(F2(o2), F2(s)), String(i));
    }
  };
  return n;
}
function fs(t2) {
  return {
    commands: ["check-ignore", ...t2],
    format: "utf-8",
    parser: ls
  };
}
function ls(t2) {
  return t2.split(/\n/g).map(hs).filter(Boolean);
}
function hs(t2) {
  const e = t2.trim().replace(/^["']|["']$/g, "");
  return e && normalize(e);
}
var ms = [
  new l2(/From (.+)$/, (t2, [e]) => {
    t2.remote = e;
  }),
  new l2(/\* \[new branch]\s+(\S+)\s*-> (.+)$/, (t2, [e, n]) => {
    t2.branches.push({
      name: e,
      tracking: n
    });
  }),
  new l2(/\* \[new tag]\s+(\S+)\s*-> (.+)$/, (t2, [e, n]) => {
    t2.tags.push({
      name: e,
      tracking: n
    });
  }),
  new l2(/- \[deleted]\s+\S+\s*-> (.+)$/, (t2, [e]) => {
    t2.deleted.push({ tracking: e });
  }),
  new l2(/\s*([^.]+)\.\.(\S+)\s+(\S+)\s*-> (.+)$/, (t2, [e, n, r3, s]) => {
    t2.updated.push({
      name: r3,
      tracking: s,
      to: n,
      from: e
    });
  })
];
function ps(t2, e) {
  return E2({
    raw: t2,
    remote: null,
    branches: [],
    tags: [],
    updated: [],
    deleted: []
  }, ms, [t2, e]);
}
function ds(t2) {
  return /^--upload-pack(=|$)/.test(t2);
}
function gs(t2, e, n) {
  const r3 = ["fetch", ...n];
  return t2 && e && r3.push(t2, e), r3.find(ds) ? b2("git.fetch: potential exploit argument blocked.") : {
    commands: r3,
    format: "utf-8",
    parser: ps
  };
}
var ys = [new l2(/^Renaming (.+) to (.+)$/, (t2, [e, n]) => {
  t2.moves.push({
    from: e,
    to: n
  });
})];
function ws(t2) {
  return E2({ moves: [] }, ys, t2);
}
function bs(t2, e) {
  return {
    commands: [
      "mv",
      "-v",
      ...v(t2),
      e
    ],
    format: "utf-8",
    parser: ws
  };
}
function Ts(t2, e, n) {
  const r3 = ["pull", ...n];
  return t2 && e && r3.splice(1, 0, t2, e), {
    commands: r3,
    format: "utf-8",
    parser(s, o2) {
      return ue(s, o2);
    },
    onError(s, o2, i, a2) {
      const c3 = Rr(F2(s.stdOut), F2(s.stdErr));
      if (c3)
        return a2(new at(c3));
      a2(o2);
    }
  };
}
function ks(t2) {
  const e = {};
  return ge(t2, ([n]) => e[n] = { name: n }), Object.values(e);
}
function _s(t2) {
  const e = {};
  return ge(t2, ([n, r3, s]) => {
    Object.hasOwn(e, n) || (e[n] = {
      name: n,
      refs: {
        fetch: "",
        push: ""
      }
    }), s && r3 && (e[n].refs[s.replace(/[^a-z]/g, "")] = r3);
  }), Object.values(e);
}
function ge(t2, e) {
  ut(t2, (n) => e(n.split(/\s+/)));
}
function vs(t2, e, n) {
  return g([
    "remote",
    "add",
    ...n,
    t2,
    e
  ]);
}
function Es(t2) {
  const e = ["remote"];
  return t2 && e.push("-v"), {
    commands: e,
    format: "utf-8",
    parser: t2 ? _s : ks
  };
}
function Ss(t2) {
  const e = [...t2];
  return e[0] !== "ls-remote" && e.unshift("ls-remote"), g(e);
}
function Rs(t2) {
  const e = [...t2];
  return e[0] !== "remote" && e.unshift("remote"), g(e);
}
function Os(t2) {
  return g([
    "remote",
    "remove",
    t2
  ]);
}
function Cs(t2 = {}, e) {
  const n = oe2(t2), r3 = [
    "stash",
    "list",
    ...n.commands,
    ...e
  ], s = re(n.splitter, n.fields, pt(r3));
  return dt(r3) || {
    commands: r3,
    format: "utf-8",
    parser: s
  };
}
function As(t2, e) {
  return X2([
    "add",
    t2,
    e
  ]);
}
function xs(t2) {
  return X2(["init", ...t2]);
}
function X2(t2) {
  const e = [...t2];
  return e[0] !== "submodule" && e.unshift("submodule"), g(e);
}
function Ns(t2) {
  return X2(["update", ...t2]);
}
var $s = class {
  constructor(e, n) {
    this.all = e, this.latest = n;
  }
};
var Ps = function(t2, e = false) {
  const n = t2.split(`
`).map(Ds).filter(Boolean);
  e || n.sort(function(s, o2) {
    const i = s.split("."), a2 = o2.split(".");
    if (i.length === 1 || a2.length === 1)
      return Ms(B2(i[0]), B2(a2[0]));
    for (let c3 = 0, y2 = Math.max(i.length, a2.length);c3 < y2; c3++) {
      const w2 = ye(B2(i[c3]), B2(a2[c3]));
      if (w2)
        return w2;
    }
    return 0;
  });
  return new $s(n, e ? n[0] : [...n].reverse().find((s) => s.indexOf(".") >= 0));
};
function Ms(t2, e) {
  const n = Number.isNaN(t2);
  return n !== Number.isNaN(e) ? n ? 1 : -1 : n ? ye(t2, e) : 0;
}
function ye(t2, e) {
  return t2 === e ? 0 : t2 > e ? 1 : -1;
}
function Ds(t2) {
  return t2.trim();
}
function B2(t2) {
  return typeof t2 == "string" && parseInt(t2.replace(/^\D+/g, ""), 10) || 0;
}
function Ls(t2 = []) {
  const e = t2.some((n) => /^--sort=/.test(n));
  return {
    format: "utf-8",
    commands: [
      "tag",
      "-l",
      ...t2
    ],
    parser(n) {
      return Ps(n, e);
    }
  };
}
function js(t2) {
  return {
    format: "utf-8",
    commands: ["tag", t2],
    parser() {
      return { name: t2 };
    }
  };
}
function Bs(t2, e) {
  return {
    format: "utf-8",
    commands: [
      "tag",
      "-a",
      "-m",
      e,
      t2
    ],
    parser() {
      return { name: t2 };
    }
  };
}
function f2(t2, e) {
  this._plugins = e, this._executor = new Dn(t2.baseDir, new Xr(t2.maxConcurrentProcesses), e), this._trimmed = t2.trimmed;
}
(f2.prototype = Object.create(le.prototype)).constructor = f2;
f2.prototype.customBinary = function(t2) {
  return this._plugins.reconfigure("binary", t2), this;
};
f2.prototype.env = function(t2, e) {
  return arguments.length === 1 && typeof t2 == "object" ? this._executor.env = t2 : (this._executor.env = this._executor.env || {})[t2] = e, this;
};
f2.prototype.stashList = function(t2) {
  return this._runTask(Cs(ht(arguments) || {}, K2(t2) && t2 || []), u(arguments));
};
f2.prototype.mv = function(t2, e) {
  return this._runTask(bs(t2, e), u(arguments));
};
f2.prototype.checkoutLatestTag = function(t2) {
  var e = this;
  return this.pull(function() {
    e.tags(function(n, r3) {
      e.checkout(r3.latest, t2);
    });
  });
};
f2.prototype.pull = function(t2, e, n, r3) {
  return this._runTask(Ts(d(t2, m), d(e, m), h2(arguments)), u(arguments));
};
f2.prototype.fetch = function(t2, e) {
  return this._runTask(gs(d(t2, m), d(e, m), h2(arguments)), u(arguments));
};
f2.prototype.tags = function(t2, e) {
  return this._runTask(Ls(h2(arguments)), u(arguments));
};
f2.prototype.rebase = function() {
  return this._runTask(g(["rebase", ...h2(arguments)]), u(arguments));
};
f2.prototype.reset = function(t2) {
  return this._runTask(An(xn(t2), h2(arguments)), u(arguments));
};
f2.prototype.revert = function(t2) {
  const e = u(arguments);
  return typeof t2 != "string" ? this._runTask(b2("Commit must be a string"), e) : this._runTask(g([
    "revert",
    ...h2(arguments, 0, true),
    t2
  ]), e);
};
f2.prototype.addTag = function(t2) {
  const e = typeof t2 == "string" ? js(t2) : b2("Git.addTag requires a tag name");
  return this._runTask(e, u(arguments));
};
f2.prototype.addAnnotatedTag = function(t2, e) {
  return this._runTask(Bs(t2, e), u(arguments));
};
f2.prototype.deleteLocalBranch = function(t2, e, n) {
  return this._runTask(cs(t2, typeof e == "boolean" ? e : false), u(arguments));
};
f2.prototype.deleteLocalBranches = function(t2, e, n) {
  return this._runTask(us(t2, typeof e == "boolean" ? e : false), u(arguments));
};
f2.prototype.branch = function(t2, e) {
  return this._runTask(is(h2(arguments)), u(arguments));
};
f2.prototype.branchLocal = function(t2) {
  return this._runTask(as(), u(arguments));
};
f2.prototype.raw = function(t2) {
  const e = !Array.isArray(t2), n = [].slice.call(e ? arguments : t2, 0);
  for (let s = 0;s < n.length && e; s++)
    if (!st(n[s])) {
      n.splice(s, n.length - s);
      break;
    }
  n.push(...h2(arguments, 0, true));
  var r3 = u(arguments);
  return n.length ? this._runTask(g(n, this._trimmed), r3) : this._runTask(b2("Raw: must supply one or more command to execute"), r3);
};
f2.prototype.submoduleAdd = function(t2, e, n) {
  return this._runTask(As(t2, e), u(arguments));
};
f2.prototype.submoduleUpdate = function(t2, e) {
  return this._runTask(Ns(h2(arguments, true)), u(arguments));
};
f2.prototype.submoduleInit = function(t2, e) {
  return this._runTask(xs(h2(arguments, true)), u(arguments));
};
f2.prototype.subModule = function(t2, e) {
  return this._runTask(X2(h2(arguments)), u(arguments));
};
f2.prototype.listRemote = function() {
  return this._runTask(Ss(h2(arguments)), u(arguments));
};
f2.prototype.addRemote = function(t2, e, n) {
  return this._runTask(vs(t2, e, h2(arguments)), u(arguments));
};
f2.prototype.removeRemote = function(t2, e) {
  return this._runTask(Os(t2), u(arguments));
};
f2.prototype.getRemotes = function(t2, e) {
  return this._runTask(Es(t2 === true), u(arguments));
};
f2.prototype.remote = function(t2, e) {
  return this._runTask(Rs(h2(arguments)), u(arguments));
};
f2.prototype.tag = function(t2, e) {
  const n = h2(arguments);
  return n[0] !== "tag" && n.unshift("tag"), this._runTask(g(n), u(arguments));
};
f2.prototype.updateServerInfo = function(t2) {
  return this._runTask(g(["update-server-info"]), u(arguments));
};
f2.prototype.pushTags = function(t2, e) {
  const n = Mr({ remote: d(t2, m) }, h2(arguments));
  return this._runTask(n, u(arguments));
};
f2.prototype.rm = function(t2) {
  return this._runTask(g([
    "rm",
    "-f",
    ...v(t2)
  ]), u(arguments));
};
f2.prototype.rmKeepLocal = function(t2) {
  return this._runTask(g([
    "rm",
    "--cached",
    ...v(t2)
  ]), u(arguments));
};
f2.prototype.catFile = function(t2, e) {
  return this._catFile("utf-8", arguments);
};
f2.prototype.binaryCatFile = function() {
  return this._catFile("buffer", arguments);
};
f2.prototype._catFile = function(t2, e) {
  var n = u(e), r3 = ["cat-file"], s = e[0];
  if (typeof s == "string")
    return this._runTask(b2("Git.catFile: options must be supplied as an array of strings"), n);
  Array.isArray(s) && r3.push.apply(r3, s);
  const o2 = t2 === "buffer" ? Gt(r3) : g(r3);
  return this._runTask(o2, n);
};
f2.prototype.diff = function(t2, e) {
  const n = m(t2) ? b2("git.diff: supplying options as a single string is no longer supported, switch to an array of strings") : g(["diff", ...h2(arguments)]);
  return this._runTask(n, u(arguments));
};
f2.prototype.diffSummary = function() {
  return this._runTask(fr(h2(arguments, 1)), u(arguments));
};
f2.prototype.applyPatch = function(t2) {
  const e = G2(t2) ? Yr(v(t2), h2([].slice.call(arguments, 1))) : b2("git.applyPatch requires one or more string patches as the first argument");
  return this._runTask(e, u(arguments));
};
f2.prototype.revparse = function() {
  const t2 = ["rev-parse", ...h2(arguments, true)];
  return this._runTask(g(t2, true), u(arguments));
};
f2.prototype.clean = function(t2, e, n) {
  const r3 = un(t2), s = r3 && t2.join("") || d(t2, m) || "", o2 = h2([].slice.call(arguments, r3 ? 1 : 0));
  return this._runTask(on(s, o2), u(arguments));
};
f2.prototype.exec = function(t2) {
  return this._runTask({
    commands: [],
    format: "utf-8",
    parser() {
      typeof t2 == "function" && t2();
    }
  });
};
f2.prototype.checkIgnore = function(t2, e) {
  return this._runTask(fs(v(d(t2, G2, []))), u(arguments));
};
f2.prototype.checkIsRepo = function(t2, e) {
  return this._runTask(We(d(t2, m)), u(arguments));
};
function Is(t2) {
  return t2 ? [{
    type: "spawn.before",
    action(r3, s) {
      t2.aborted && s.kill(new A2(undefined, "abort", "Abort already signaled"));
    }
  }, {
    type: "spawn.after",
    action(r3, s) {
      function o2() {
        s.kill(new A2(undefined, "abort", "Abort signal received"));
      }
      t2.addEventListener("abort", o2), s.spawned.on("close", () => t2.removeEventListener("abort", o2));
    }
  }] : undefined;
}
var Us = $2("", "plugin:allowEnvironment");
function Fs(t2, e = false) {
  const n = new Set(t2.map((r3) => r3.toLowerCase().trim()));
  return {
    type: "spawn.options",
    action(r3, s) {
      const o2 = { ...r3.env ?? process.env }, i = new Set(Object.keys(s.env).map((a2) => a2.toLowerCase().trim()));
      for (const a2 of Object.keys(o2)) {
        const c3 = a2.toLowerCase().trim();
        if (!(!Gs(c3) || n.has(c3))) {
          if (i.has(c3))
            throw new A2(undefined, "allowEnvironment", `Use of "${a2}" is blocked by the environment guard - add it to the allowEnvironment option to permit it`);
          Us("removing ambient guarded environment variable %s", a2), delete o2[a2];
        }
      }
      return {
        ...r3,
        env: {
          ...o2,
          GIT_TEST_DISALLOW_ABBREVIATED_OPTIONS: String(!e)
        }
      };
    }
  };
}
function Gs(t2) {
  const e = t2.toLowerCase().trim();
  return e.startsWith("git_") || _(e);
}
function zs(t2 = {}) {
  return {
    type: "spawn.args",
    action(e, { env: n }) {
      for (const r3 of oe(e, n))
        if (t2[r3.category] !== true)
          throw new A2(undefined, "unsafe", r3.message);
      return e;
    }
  };
}
function qs(t2) {
  const e = U(t2, "-c");
  return {
    type: "spawn.args",
    action(n) {
      return [...e, ...n];
    }
  };
}
var $t = (0, import_dist$1.deferred)().promise;
function Ws({ onClose: t2 = true, onExit: e = 50 } = {}) {
  function n() {
    let s = -1;
    const o2 = {
      close: (0, import_dist$1.deferred)(),
      closeTimeout: (0, import_dist$1.deferred)(),
      exit: (0, import_dist$1.deferred)(),
      exitTimeout: (0, import_dist$1.deferred)()
    }, i = Promise.race([t2 === false ? $t : o2.closeTimeout.promise, e === false ? $t : o2.exitTimeout.promise]);
    return r3(t2, o2.close, o2.closeTimeout), r3(e, o2.exit, o2.exitTimeout), {
      close(a2) {
        s = a2, o2.close.done();
      },
      exit(a2) {
        s = a2, o2.exit.done();
      },
      get exitCode() {
        return s;
      },
      result: i
    };
  }
  function r3(s, o2, i) {
    s !== false && (s === true ? o2.promise : o2.promise.then(() => wt(s))).then(i.done);
  }
  return {
    type: "spawn.after",
    async action(s, { spawned: o2, close: i }) {
      const a2 = n();
      let c3 = true, y2 = () => {
        c3 = false;
      };
      o2.stdout?.on("data", y2), o2.stderr?.on("data", y2), o2.on("error", y2), o2.on("close", (w2) => a2.close(w2)), o2.on("exit", (w2) => a2.exit(w2));
      try {
        await a2.result, c3 && await wt(50), i(a2.exitCode);
      } catch (w2) {
        i(a2.exitCode, w2);
      }
    }
  };
}
var we = $2("", "plugin:binary");
var Hs = "Invalid value supplied for custom binary, requires a single string or an array containing either one or two strings";
var Ks = "Invalid value supplied for custom binary, restricted characters must be removed or supply the unsafe.allowUnsafeCustomBinary option";
function Vs(t2) {
  return !t2 || !/^([a-z]:)?([a-z0-9/.\\_~-]+)$/i.test(t2);
}
function Pt(t2, e) {
  if (t2.length < 1 || t2.length > 2)
    throw new A2(undefined, "binary", Hs);
  if (t2.some(Vs))
    if (e)
      we("permitted unsafe binary %o", t2);
    else
      throw new A2(undefined, "binary", Ks);
  const [r3, s] = t2;
  return {
    binary: r3,
    prefix: s
  };
}
function Xs(t2, e = ["git"], n = false) {
  let r3 = Pt(v(e), n);
  t2.on("binary", (s) => {
    r3 = Pt(v(s), n), we.info("reconfiguring %o", r3);
  }), t2.append("spawn.binary", () => r3.binary), t2.append("spawn.args", (s) => r3.prefix ? [r3.prefix, ...s] : s);
}
var be = {
  DISALLOWED_ABBREVIATED: {
    text: "disallowed abbreviated or ambiguous option",
    solution: "Unambiguous abbreviated options blocked with unsafe.allowAbbreviatedOptions setting: {message}"
  },
  UNKNOWN: {
    text: "~ unknown ~",
    solution: undefined
  }
};
function Ys(t2) {
  if (!t2)
    return "UNKNOWN";
  for (const [e, { text: n }] of Object.entries(be))
    if (t2.startsWith(`fatal: ${n}`))
      return e;
  return "UNKNOWN";
}
var Qs = class extends O2 {
  constructor(e = "") {
    const n = Ys(e);
    super(undefined, be[n].solution?.replace("{message}", e) ?? e), this.reason = n;
  }
};
function Js(t2) {
  return !!(t2.exitCode && t2.stdErr.length);
}
function Zs(t2) {
  return Buffer.concat([...t2.stdOut, ...t2.stdErr]);
}
function to(t2 = false, e = Js, n = Zs) {
  return (r3, s) => !t2 && r3 || !e(s) ? r3 : n(s);
}
function eo(t2, e) {
  return t2 === 128 && e.startsWith("fatal:") ? new Qs(e) : new O2(undefined, e);
}
function Mt(t2) {
  return {
    type: "task.error",
    action(e, n) {
      const r3 = t2(e.error, {
        stdErr: n.stdErr,
        stdOut: n.stdOut,
        exitCode: n.exitCode
      });
      return Buffer.isBuffer(r3) ? { error: eo(n.exitCode, r3.toString("utf-8")) } : { error: r3 };
    }
  };
}
var nt = $2("", "plugin:input");
function no(t2) {
  return {
    type: "spawn.after",
    action(e, { commands: n, input: r3, spawned: { stdin: s } }) {
      if (!s)
        return;
      const o2 = t2?.([...n]) ?? r3;
      if (!o2)
        return nt("generated zero length content, not writing to stdin");
      nt("writing %s bytes to stdin", Le(o2)), s.on("error", (i) => {
        i.code !== "EPIPE" && nt("[ERROR] stdin error %o", i);
      }), s.end(o2);
    }
  };
}
var ro = class {
  constructor() {
    this.plugins = /* @__PURE__ */ new Set, this.events = new EventEmitter;
  }
  on(e, n) {
    this.events.on(e, n);
  }
  reconfigure(e, n) {
    this.events.emit(e, n);
  }
  append(e, n) {
    const r3 = S2(this.plugins, {
      type: e,
      action: n
    });
    return () => this.plugins.delete(r3);
  }
  add(e) {
    const n = [];
    return v(e).forEach((r3) => {
      r3 && this.plugins.add(S2(n, r3));
    }), () => {
      n.forEach((r3) => {
        this.plugins.delete(r3);
      });
    };
  }
  exec(e, n, r3) {
    let s = n;
    const o2 = Object.freeze(Object.create(r3));
    for (const i of this.plugins)
      i.type === e && (s = i.action(s, o2));
    return s;
  }
};
function so(t2) {
  const e = "--progress", n = [
    "checkout",
    "clone",
    "fetch",
    "pull",
    "push"
  ];
  return [{
    type: "spawn.args",
    action(o2, i) {
      return n.includes(i.method) ? De(o2, e) : o2;
    }
  }, {
    type: "spawn.after",
    action(o2, i) {
      i.commands.includes(e) && i.spawned.stderr?.on("data", (a2) => {
        const c3 = /^([\s\S]+?):\s*(\d+)% \((\d+)\/(\d+)\)/.exec(a2.toString("utf8"));
        c3 && t2({
          method: i.method,
          stage: oo(c3[1]),
          progress: p(c3[2]),
          processed: p(c3[3]),
          total: p(c3[4])
        });
      });
    }
  }];
}
function oo(t2) {
  return String(t2.toLowerCase().split(" ", 1)) || "unknown";
}
function io(t2) {
  const e = je(t2, ["uid", "gid"]);
  return {
    type: "spawn.options",
    action(n) {
      return {
        ...e,
        ...n
      };
    }
  };
}
function ao() {
  return {
    type: "spawn.args",
    action(t2) {
      const e = [];
      let n;
      function r$2(s) {
        (n = n || []).push(...s);
      }
      for (let s = 0;s < t2.length; s++) {
        const o$1 = t2[s];
        if (r2(o$1)) {
          r$2(o(o$1));
          continue;
        }
        if (o$1 === "--") {
          r$2(t2.slice(s + 1).flatMap((i) => r2(i) && o(i) || i));
          break;
        }
        e.push(o$1);
      }
      return n ? [
        ...e,
        "--",
        ...n.map(String)
      ] : e;
    }
  };
}
function uo({ block: t2, stdErr: e = true, stdOut: n = true }) {
  if (t2 > 0)
    return {
      type: "spawn.after",
      action(r3, s) {
        let o2;
        function i() {
          o2 && clearTimeout(o2), o2 = setTimeout(c3, t2);
        }
        function a2() {
          s.spawned.stdout?.off("data", i), s.spawned.stderr?.off("data", i), s.spawned.off("exit", a2), s.spawned.off("close", a2), o2 && clearTimeout(o2);
        }
        function c3() {
          a2(), s.kill(new A2(undefined, "timeout", "block timeout reached"));
        }
        n && s.spawned.stdout?.on("data", i), e && s.spawned.stderr?.on("data", i), s.spawned.on("exit", a2), s.spawned.on("close", a2), i();
      }
    };
}
var wo = (t2, e) => {
  const n = new ro, r3 = Ge(t2 && (typeof t2 == "string" ? { baseDir: t2 } : t2) || {}, e);
  if (!Lt(r3.baseDir))
    throw new Ae(r3, "Cannot use simple-git on a directory that does not exist");
  return Array.isArray(r3.config) && n.add(qs(r3.config)), n.add(zs(r3.unsafe)), n.add(Ws(r3.completion)), r3.abort && n.add(Is(r3.abort)), r3.progress && n.add(so(r3.progress)), r3.timeout && n.add(uo(r3.timeout)), r3.spawnOptions && n.add(io(r3.spawnOptions)), n.add(ao()), n.add(no(r3.input)), n.add(Mt(to(true))), r3.errors && n.add(Mt(r3.errors)), Xs(n, r3.binary, r3.unsafe?.allowUnsafeCustomBinary), n.add(Fs(r3.allowEnvironment ?? [], r3.unsafe?.allowAbbreviatedOptions)), new f2(r3, n);
};

// node_modules/skills/dist/_chunks/libs/xdg-basedir.mjs
import path from "path";
import os2 from "os";
var homeDirectory = os2.homedir();
var { env } = process;
var xdgData = env.XDG_DATA_HOME || (homeDirectory ? path.join(homeDirectory, ".local", "share") : undefined);
var xdgConfig = env.XDG_CONFIG_HOME || (homeDirectory ? path.join(homeDirectory, ".config") : undefined);
env.XDG_STATE_HOME || homeDirectory && path.join(homeDirectory, ".local", "state");
env.XDG_CACHE_HOME || homeDirectory && path.join(homeDirectory, ".cache");
env.XDG_RUNTIME_DIR;
var xdgDataDirectories = (env.XDG_DATA_DIRS || "/usr/local/share/:/usr/share/").split(":");
if (xdgData)
  xdgDataDirectories.unshift(xdgData);
var xdgConfigDirectories = (env.XDG_CONFIG_DIRS || "/etc/xdg").split(":");
if (xdgConfig)
  xdgConfigDirectories.unshift(xdgConfig);

// node_modules/skills/dist/_chunks/libs/@vercel/detect-agent.mjs
var require_dist3 = /* @__PURE__ */ __commonJSMin((exports, module) => {
  var __defProp3 = Object.defineProperty;
  var __getOwnPropDesc2 = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames2 = Object.getOwnPropertyNames;
  var __hasOwnProp2 = Object.prototype.hasOwnProperty;
  var __export2 = (target, all) => {
    for (var name in all)
      __defProp3(target, name, {
        get: all[name],
        enumerable: true
      });
  };
  var __copyProps2 = (to2, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames2(from))
        if (!__hasOwnProp2.call(to2, key) && key !== except)
          __defProp3(to2, key, {
            get: () => from[key],
            enumerable: !(desc = __getOwnPropDesc2(from, key)) || desc.enumerable
          });
    }
    return to2;
  };
  var __toCommonJS = (mod) => __copyProps2(__defProp3({}, "__esModule", { value: true }), mod);
  var src_exports = {};
  __export2(src_exports, {
    KNOWN_AGENTS: () => KNOWN_AGENTS,
    determineAgent: () => determineAgent
  });
  module.exports = __toCommonJS(src_exports);
  var import_promises = __require2("node:fs/promises");
  var import_node_fs = __require2("node:fs");
  const DEVIN_LOCAL_PATH = "/opt/.devin";
  const CURSOR = "cursor";
  const CURSOR_CLI = "cursor-cli";
  const CLAUDE = "claude";
  const COWORK = "cowork";
  const DEVIN = "devin";
  const REPLIT = "replit";
  const GEMINI = "gemini";
  const CODEX = "codex";
  const ANTIGRAVITY = "antigravity";
  const AUGMENT_CLI = "augment-cli";
  const OPENCODE = "opencode";
  const GITHUB_COPILOT = "github-copilot";
  const GITHUB_COPILOT_CLI = "github-copilot-cli";
  const V0 = "v0";
  const KNOWN_AGENTS = {
    CURSOR,
    CURSOR_CLI,
    CLAUDE,
    COWORK,
    DEVIN,
    REPLIT,
    GEMINI,
    CODEX,
    ANTIGRAVITY,
    AUGMENT_CLI,
    OPENCODE,
    GITHUB_COPILOT,
    V0,
    FX: "fx",
    EVE: "eve"
  };
  async function determineAgent() {
    if (process.env.AI_AGENT) {
      const name = process.env.AI_AGENT.trim();
      if (name) {
        if (name === GITHUB_COPILOT || name === GITHUB_COPILOT_CLI)
          return {
            isAgent: true,
            agent: { name: GITHUB_COPILOT }
          };
        if (name === V0)
          return {
            isAgent: true,
            agent: { name: V0 }
          };
        return {
          isAgent: true,
          agent: { name }
        };
      }
    }
    if (process.env.CURSOR_TRACE_ID)
      return {
        isAgent: true,
        agent: { name: CURSOR }
      };
    if (process.env.CURSOR_AGENT || process.env.CURSOR_EXTENSION_HOST_ROLE === "agent-exec")
      return {
        isAgent: true,
        agent: { name: CURSOR_CLI }
      };
    if (process.env.GEMINI_CLI)
      return {
        isAgent: true,
        agent: { name: GEMINI }
      };
    if (process.env.CODEX_SANDBOX || process.env.CODEX_CI || process.env.CODEX_THREAD_ID)
      return {
        isAgent: true,
        agent: { name: CODEX }
      };
    if (process.env.ANTIGRAVITY_AGENT)
      return {
        isAgent: true,
        agent: { name: ANTIGRAVITY }
      };
    if (process.env.AUGMENT_AGENT)
      return {
        isAgent: true,
        agent: { name: AUGMENT_CLI }
      };
    if (process.env.OPENCODE === "1" || process.env.OPENCODE_CLIENT)
      return {
        isAgent: true,
        agent: { name: OPENCODE }
      };
    if (process.env.CLAUDECODE || process.env.CLAUDE_CODE) {
      if (process.env.CLAUDE_CODE_IS_COWORK)
        return {
          isAgent: true,
          agent: { name: COWORK }
        };
      return {
        isAgent: true,
        agent: { name: CLAUDE }
      };
    }
    if (process.env.REPL_ID)
      return {
        isAgent: true,
        agent: { name: REPLIT }
      };
    if (process.env.COPILOT_MODEL || process.env.COPILOT_ALLOW_ALL || process.env.COPILOT_GITHUB_TOKEN)
      return {
        isAgent: true,
        agent: { name: GITHUB_COPILOT }
      };
    try {
      await (0, import_promises.access)(DEVIN_LOCAL_PATH, import_node_fs.constants.F_OK);
      return {
        isAgent: true,
        agent: { name: DEVIN }
      };
    } catch (_error) {}
    return {
      isAgent: false,
      agent: undefined
    };
  }
});

// node_modules/skills/dist/_chunks/remove.mjs
import { existsSync, readFileSync, readdirSync, realpathSync } from "fs";
import { basename, dirname, extname as extname$1, isAbsolute, join, normalize as normalize2, posix, relative, resolve, sep } from "path";

// node_modules/yaml/dist/index.js
var composer = require_composer();
var Document = require_Document();
var Schema = require_Schema();
var errors = require_errors();
var Alias = require_Alias();
var identity = require_identity();
var Pair = require_Pair();
var Scalar = require_Scalar();
var YAMLMap = require_YAMLMap();
var YAMLSeq = require_YAMLSeq();
var cst = require_cst();
var lexer = require_lexer();
var lineCounter = require_line_counter();
var parser = require_parser();
var publicApi = require_public_api();
var visit = require_visit();
var $Composer = composer.Composer;
var $Document = Document.Document;
var $Schema = Schema.Schema;
var $YAMLError = errors.YAMLError;
var $YAMLParseError = errors.YAMLParseError;
var $YAMLWarning = errors.YAMLWarning;
var $Alias = Alias.Alias;
var $isAlias = identity.isAlias;
var $isCollection = identity.isCollection;
var $isDocument = identity.isDocument;
var $isMap = identity.isMap;
var $isNode = identity.isNode;
var $isPair = identity.isPair;
var $isScalar = identity.isScalar;
var $isSeq = identity.isSeq;
var $Pair = Pair.Pair;
var $Scalar = Scalar.Scalar;
var $YAMLMap = YAMLMap.YAMLMap;
var $YAMLSeq = YAMLSeq.YAMLSeq;
var $Lexer = lexer.Lexer;
var $LineCounter = lineCounter.LineCounter;
var $Parser = parser.Parser;
var $parse = publicApi.parse;
var $parseAllDocuments = publicApi.parseAllDocuments;
var $parseDocument = publicApi.parseDocument;
var $stringify = publicApi.stringify;
var $visit = visit.visit;
var $visitAsync = visit.visitAsync;

// node_modules/skills/dist/_chunks/remove.mjs
import { createWriteStream } from "node:fs";
import { dirname as dirname$1, join as join$1, normalize as normalize$1, relative as relative$1, resolve as resolve$1, sep as sep$1 } from "node:path";
import { homedir, platform, tmpdir } from "os";

// node_modules/nostics/dist/index.mjs
function toValueWithArgs(valFn, ...args) {
  return typeof valFn === "function" ? valFn(...args) : valFn;
}
var captureStackTrace = Error.captureStackTrace;
var Diagnostic = class Diagnostic2 extends Error {
  name;
  code;
  docs;
  fix;
  sources;
  data;
  get why() {
    return this.message;
  }
  constructor(init, captureFrom = Diagnostic2) {
    super(init.why, { cause: init.cause });
    this.code = this.name = init.code;
    this.fix = init.fix;
    this.docs = init.docs;
    this.sources = init.sources;
    this.data = init.data;
    captureStackTrace?.(this, captureFrom);
  }
  toJSON() {
    return {
      name: this.name,
      why: this.why,
      fix: this.fix,
      docs: this.docs,
      sources: this.sources,
      cause: this.cause,
      data: this.data,
      stack: this.stack
    };
  }
};
function deriveDocs(docsBase, code) {
  return typeof docsBase === "string" ? `${docsBase}/${code.toLowerCase()}` : docsBase?.(code);
}
function defineDiagnostics(options) {
  const reporters = options.reporters ?? [];
  const result = {};
  const { docsBase } = options;
  for (const code of Object.keys(options.codes)) {
    const def = options.codes[code];
    const docs = def.docs === false ? undefined : def.docs || deriveDocs(docsBase, code);
    const handle = (params = {}, reporterOptions = {}) => {
      const diagnostic = new Diagnostic({
        code,
        why: toValueWithArgs(def.why, params),
        fix: toValueWithArgs(def.fix, params),
        docs,
        cause: params.cause,
        sources: params.sources,
        data: toValueWithArgs(def.data, params)
      }, handle);
      for (const reporter of reporters)
        reporter(diagnostic, reporterOptions);
      return diagnostic;
    };
    result[code] = handle;
  }
  return result;
}

// node_modules/nostics/dist/formatters/ansi.mjs
function ansiFormatter(colors) {
  return (d2) => {
    const header = `${colors.bold(colors.red(`[${d2.name}]`))} ${d2.message}`;
    const details = [];
    if (d2.fix)
      details.push(`${colors.dim("fix:")} ${d2.fix}`);
    if (d2.sources?.length)
      details.push(`${colors.dim("sources:")} ${d2.sources.join(", ")}`);
    if (d2.docs)
      details.push(`${colors.dim("see:")} ${colors.cyan(d2.docs)}`);
    if (details.length === 0)
      return header;
    return [header, ...details.map((detail, i) => {
      return `${colors.dim(i < details.length - 1 ? "├▶" : "╰▶")} ${detail}`;
    })].join(`
`);
  };
}

// node_modules/skills/dist/_chunks/remove.mjs
import { promisify } from "util";
import { execFile, spawn as spawn2 } from "node:child_process";
import { access, chmod, cp, lstat, mkdir, mkdtemp, readFile, readdir, readlink, realpath, rm, stat, symlink, writeFile } from "fs/promises";
import { execFile as execFile$1 } from "child_process";
import { Writable } from "stream";
import { createHash } from "crypto";
import { AsyncLocalStorage } from "node:async_hooks";
import { cp as cp$1, mkdir as mkdir$1, mkdtemp as mkdtemp$1, readFile as readFile$1, rm as rm$1, stat as stat$1, writeFile as writeFile$1 } from "node:fs/promises";
import { createHash as createHash$1 } from "node:crypto";
import { crc32, gunzipSync, inflateRawSync } from "node:zlib";
import { tmpdir as tmpdir$1 } from "node:os";
import { pipeline } from "node:stream/promises";

// node_modules/tar/dist/esm/index.min.js
import Qr2 from "events";
import I3 from "fs";
import { EventEmitter as Di } from "node:events";
import Cs2 from "node:stream";
import { StringDecoder as Hr2 } from "node:string_decoder";
import cr2 from "node:path";
import Kt2 from "node:fs";
import { dirname as Fn2, parse as kn2 } from "path";
import { EventEmitter as Dn2 } from "events";
import zi from "assert";
import { Buffer as Ot2 } from "buffer";
import * as Ps2 from "zlib";
import en2 from "zlib";
import { posix as Zt2 } from "node:path";
import { basename as _n2 } from "node:path";
import mi from "fs";
import X3 from "fs";
import js2 from "path";
import { win32 as Pn2 } from "node:path";
import ar2 from "path";
import Br2 from "node:fs";
import co from "node:assert";
import { randomBytes as Mr2 } from "node:crypto";
import u2 from "node:fs";
import R4 from "node:path";
import pr2 from "fs";
import wi from "node:fs";
import we2 from "node:path";
import k2 from "node:fs";
import ro2 from "node:fs/promises";
import Si from "node:path";
import { join as xr2 } from "node:path";
import v2 from "node:fs";
import Pr2 from "node:path";
var zr2 = Object.defineProperty;
var Ur2 = (s, t2) => {
  for (var e in t2)
    zr2(s, e, { get: t2[e], enumerable: true });
};
var Ds2 = typeof process == "object" && process ? process : { stdout: null, stderr: null };
var Wr2 = (s) => !!s && typeof s == "object" && (s instanceof A3 || s instanceof Cs2 || Gr2(s) || Zr2(s));
var Gr2 = (s) => !!s && typeof s == "object" && s instanceof Di && typeof s.pipe == "function" && s.pipe !== Cs2.Writable.prototype.pipe;
var Zr2 = (s) => !!s && typeof s == "object" && s instanceof Di && typeof s.write == "function" && typeof s.end == "function";
var Q3 = Symbol("EOF");
var J3 = Symbol("maybeEmitEnd");
var nt2 = Symbol("emittedEnd");
var De2 = Symbol("emittingEnd");
var qt2 = Symbol("emittedError");
var Ne2 = Symbol("closed");
var Ns2 = Symbol("read");
var Ae2 = Symbol("flush");
var As2 = Symbol("flushChunk");
var z4 = Symbol("encoding");
var Mt2 = Symbol("decoder");
var g2 = Symbol("flowing");
var Qt2 = Symbol("paused");
var Bt2 = Symbol("resume");
var b3 = Symbol("buffer");
var N3 = Symbol("pipes");
var _3 = Symbol("bufferLength");
var bi = Symbol("bufferPush");
var Ie2 = Symbol("bufferShift");
var L3 = Symbol("objectMode");
var S3 = Symbol("destroyed");
var _i = Symbol("error");
var Oi = Symbol("emitData");
var Is2 = Symbol("emitEnd");
var Ti = Symbol("emitEnd2");
var Z3 = Symbol("async");
var xi = Symbol("abort");
var Ce = Symbol("aborted");
var Jt2 = Symbol("signal");
var Rt2 = Symbol("dataListeners");
var C2 = Symbol("discarded");
var jt2 = (s) => Promise.resolve().then(s);
var Yr2 = (s) => s();
var Kr2 = (s) => s === "end" || s === "finish" || s === "prefinish";
var Vr2 = (s) => s instanceof ArrayBuffer || !!s && typeof s == "object" && s.constructor && s.constructor.name === "ArrayBuffer" && s.byteLength >= 0;
var $r2 = (s) => !Buffer.isBuffer(s) && ArrayBuffer.isView(s);
var Fe2 = class {
  src;
  dest;
  opts;
  ondrain;
  constructor(t2, e, i) {
    this.src = t2, this.dest = e, this.opts = i, this.ondrain = () => t2[Bt2](), this.dest.on("drain", this.ondrain);
  }
  unpipe() {
    this.dest.removeListener("drain", this.ondrain);
  }
  proxyErrors(t2) {}
  end() {
    this.unpipe(), this.opts.end && this.dest.end();
  }
};
var Li = class extends Fe2 {
  unpipe() {
    this.src.removeListener("error", this.proxyErrors), super.unpipe();
  }
  constructor(t2, e, i) {
    super(t2, e, i), this.proxyErrors = (r3) => this.dest.emit("error", r3), t2.on("error", this.proxyErrors);
  }
};
var Xr2 = (s) => !!s.objectMode;
var qr2 = (s) => !s.objectMode && !!s.encoding && s.encoding !== "buffer";
var A3 = class extends Di {
  [g2] = false;
  [Qt2] = false;
  [N3] = [];
  [b3] = [];
  [L3];
  [z4];
  [Z3];
  [Mt2];
  [Q3] = false;
  [nt2] = false;
  [De2] = false;
  [Ne2] = false;
  [qt2] = null;
  [_3] = 0;
  [S3] = false;
  [Jt2];
  [Ce] = false;
  [Rt2] = 0;
  [C2] = false;
  writable = true;
  readable = true;
  constructor(...t2) {
    let e = t2[0] || {};
    if (super(), e.objectMode && typeof e.encoding == "string")
      throw new TypeError("Encoding and objectMode may not be used together");
    Xr2(e) ? (this[L3] = true, this[z4] = null) : qr2(e) ? (this[z4] = e.encoding, this[L3] = false) : (this[L3] = false, this[z4] = null), this[Z3] = !!e.async, this[Mt2] = this[z4] ? new Hr2(this[z4]) : null, e && e.debugExposeBuffer === true && Object.defineProperty(this, "buffer", { get: () => this[b3] }), e && e.debugExposePipes === true && Object.defineProperty(this, "pipes", { get: () => this[N3] });
    let { signal: i } = e;
    i && (this[Jt2] = i, i.aborted ? this[xi]() : i.addEventListener("abort", () => this[xi]()));
  }
  get bufferLength() {
    return this[_3];
  }
  get encoding() {
    return this[z4];
  }
  set encoding(t2) {
    throw new Error("Encoding must be set at instantiation time");
  }
  setEncoding(t2) {
    throw new Error("Encoding must be set at instantiation time");
  }
  get objectMode() {
    return this[L3];
  }
  set objectMode(t2) {
    throw new Error("objectMode must be set at instantiation time");
  }
  get async() {
    return this[Z3];
  }
  set async(t2) {
    this[Z3] = this[Z3] || !!t2;
  }
  [xi]() {
    this[Ce] = true, this.emit("abort", this[Jt2]?.reason), this.destroy(this[Jt2]?.reason);
  }
  get aborted() {
    return this[Ce];
  }
  set aborted(t2) {}
  write(t2, e, i) {
    if (this[Ce])
      return false;
    if (this[Q3])
      throw new Error("write after end");
    if (this[S3])
      return this.emit("error", Object.assign(new Error("Cannot call write after a stream was destroyed"), { code: "ERR_STREAM_DESTROYED" })), true;
    typeof e == "function" && (i = e, e = "utf8"), e || (e = "utf8");
    let r3 = this[Z3] ? jt2 : Yr2;
    if (!this[L3] && !Buffer.isBuffer(t2)) {
      if ($r2(t2))
        t2 = Buffer.from(t2.buffer, t2.byteOffset, t2.byteLength);
      else if (Vr2(t2))
        t2 = Buffer.from(t2);
      else if (typeof t2 != "string")
        throw new Error("Non-contiguous data written to non-objectMode stream");
    }
    return this[L3] ? (this[g2] && this[_3] !== 0 && this[Ae2](true), this[g2] ? this.emit("data", t2) : this[bi](t2), this[_3] !== 0 && this.emit("readable"), i && r3(i), this[g2]) : t2.length ? (typeof t2 == "string" && !(e === this[z4] && !this[Mt2]?.lastNeed) && (t2 = Buffer.from(t2, e)), Buffer.isBuffer(t2) && this[z4] && (t2 = this[Mt2].write(t2)), this[g2] && this[_3] !== 0 && this[Ae2](true), this[g2] ? this.emit("data", t2) : this[bi](t2), this[_3] !== 0 && this.emit("readable"), i && r3(i), this[g2]) : (this[_3] !== 0 && this.emit("readable"), i && r3(i), this[g2]);
  }
  read(t2) {
    if (this[S3])
      return null;
    if (this[C2] = false, this[_3] === 0 || t2 === 0 || t2 && t2 > this[_3])
      return this[J3](), null;
    this[L3] && (t2 = null), this[b3].length > 1 && !this[L3] && (this[b3] = [this[z4] ? this[b3].join("") : Buffer.concat(this[b3], this[_3])]);
    let e = this[Ns2](t2 || null, this[b3][0]);
    return this[J3](), e;
  }
  [Ns2](t2, e) {
    if (this[L3])
      this[Ie2]();
    else {
      let i = e;
      t2 === i.length || t2 === null ? this[Ie2]() : typeof i == "string" ? (this[b3][0] = i.slice(t2), e = i.slice(0, t2), this[_3] -= t2) : (this[b3][0] = i.subarray(t2), e = i.subarray(0, t2), this[_3] -= t2);
    }
    return this.emit("data", e), !this[b3].length && !this[Q3] && this.emit("drain"), e;
  }
  end(t2, e, i) {
    return typeof t2 == "function" && (i = t2, t2 = undefined), typeof e == "function" && (i = e, e = "utf8"), t2 !== undefined && this.write(t2, e), i && this.once("end", i), this[Q3] = true, this.writable = false, (this[g2] || !this[Qt2]) && this[J3](), this;
  }
  [Bt2]() {
    this[S3] || (!this[Rt2] && !this[N3].length && (this[C2] = true), this[Qt2] = false, this[g2] = true, this.emit("resume"), this[b3].length ? this[Ae2]() : this[Q3] ? this[J3]() : this.emit("drain"));
  }
  resume() {
    return this[Bt2]();
  }
  pause() {
    this[g2] = false, this[Qt2] = true, this[C2] = false;
  }
  get destroyed() {
    return this[S3];
  }
  get flowing() {
    return this[g2];
  }
  get paused() {
    return this[Qt2];
  }
  [bi](t2) {
    this[L3] ? this[_3] += 1 : this[_3] += t2.length, this[b3].push(t2);
  }
  [Ie2]() {
    return this[L3] ? this[_3] -= 1 : this[_3] -= this[b3][0].length, this[b3].shift();
  }
  [Ae2](t2 = false) {
    do
      ;
    while (this[As2](this[Ie2]()) && this[b3].length);
    !t2 && !this[b3].length && !this[Q3] && this.emit("drain");
  }
  [As2](t2) {
    return this.emit("data", t2), this[g2];
  }
  pipe(t2, e) {
    if (this[S3])
      return t2;
    this[C2] = false;
    let i = this[nt2];
    return e = e || {}, t2 === Ds2.stdout || t2 === Ds2.stderr ? e.end = false : e.end = e.end !== false, e.proxyErrors = !!e.proxyErrors, i ? e.end && t2.end() : (this[N3].push(e.proxyErrors ? new Li(this, t2, e) : new Fe2(this, t2, e)), this[Z3] ? jt2(() => this[Bt2]()) : this[Bt2]()), t2;
  }
  unpipe(t2) {
    let e = this[N3].find((i) => i.dest === t2);
    e && (this[N3].length === 1 ? (this[g2] && this[Rt2] === 0 && (this[g2] = false), this[N3] = []) : this[N3].splice(this[N3].indexOf(e), 1), e.unpipe());
  }
  addListener(t2, e) {
    return this.on(t2, e);
  }
  on(t2, e) {
    let i = super.on(t2, e);
    if (t2 === "data")
      this[C2] = false, this[Rt2]++, !this[N3].length && !this[g2] && this[Bt2]();
    else if (t2 === "readable" && this[_3] !== 0)
      super.emit("readable");
    else if (Kr2(t2) && this[nt2])
      super.emit(t2), this.removeAllListeners(t2);
    else if (t2 === "error" && this[qt2]) {
      let r3 = e;
      this[Z3] ? jt2(() => r3.call(this, this[qt2])) : r3.call(this, this[qt2]);
    }
    return i;
  }
  removeListener(t2, e) {
    return this.off(t2, e);
  }
  off(t2, e) {
    let i = super.off(t2, e);
    return t2 === "data" && (this[Rt2] = this.listeners("data").length, this[Rt2] === 0 && !this[C2] && !this[N3].length && (this[g2] = false)), i;
  }
  removeAllListeners(t2) {
    let e = super.removeAllListeners(t2);
    return (t2 === "data" || t2 === undefined) && (this[Rt2] = 0, !this[C2] && !this[N3].length && (this[g2] = false)), e;
  }
  get emittedEnd() {
    return this[nt2];
  }
  [J3]() {
    !this[De2] && !this[nt2] && !this[S3] && this[b3].length === 0 && this[Q3] && (this[De2] = true, this.emit("end"), this.emit("prefinish"), this.emit("finish"), this[Ne2] && this.emit("close"), this[De2] = false);
  }
  emit(t2, ...e) {
    let i = e[0];
    if (t2 !== "error" && t2 !== "close" && t2 !== S3 && this[S3])
      return false;
    if (t2 === "data")
      return !this[L3] && !i ? false : this[Z3] ? (jt2(() => this[Oi](i)), true) : this[Oi](i);
    if (t2 === "end")
      return this[Is2]();
    if (t2 === "close") {
      if (this[Ne2] = true, !this[nt2] && !this[S3])
        return false;
      let n = super.emit("close");
      return this.removeAllListeners("close"), n;
    } else if (t2 === "error") {
      this[qt2] = i, super.emit(_i, i);
      let n = !this[Jt2] || this.listeners("error").length ? super.emit("error", i) : false;
      return this[J3](), n;
    } else if (t2 === "resume") {
      let n = super.emit("resume");
      return this[J3](), n;
    } else if (t2 === "finish" || t2 === "prefinish") {
      let n = super.emit(t2);
      return this.removeAllListeners(t2), n;
    }
    let r3 = super.emit(t2, ...e);
    return this[J3](), r3;
  }
  [Oi](t2) {
    for (let i of this[N3])
      i.dest.write(t2) === false && this.pause();
    let e = this[C2] ? false : super.emit("data", t2);
    return this[J3](), e;
  }
  [Is2]() {
    return this[nt2] ? false : (this[nt2] = true, this.readable = false, this[Z3] ? (jt2(() => this[Ti]()), true) : this[Ti]());
  }
  [Ti]() {
    if (this[Mt2]) {
      let e = this[Mt2].end();
      if (e) {
        for (let i of this[N3])
          i.dest.write(e);
        this[C2] || super.emit("data", e);
      }
    }
    for (let e of this[N3])
      e.end();
    let t2 = super.emit("end");
    return this.removeAllListeners("end"), t2;
  }
  async collect() {
    let t2 = Object.assign([], { dataLength: 0 });
    this[L3] || (t2.dataLength = 0);
    let e = this.promise();
    return this.on("data", (i) => {
      t2.push(i), this[L3] || (t2.dataLength += i.length);
    }), await e, t2;
  }
  async concat() {
    if (this[L3])
      throw new Error("cannot concat in objectMode");
    let t2 = await this.collect();
    return this[z4] ? t2.join("") : Buffer.concat(t2, t2.dataLength);
  }
  async promise() {
    return new Promise((t2, e) => {
      this.on(S3, () => e(new Error("stream destroyed"))), this.on("error", (i) => e(i)), this.on("end", () => t2());
    });
  }
  [Symbol.asyncIterator]() {
    this[C2] = false;
    let t2 = false, e = async () => (this.pause(), t2 = true, { value: undefined, done: true });
    return { next: () => {
      if (t2)
        return e();
      let r3 = this.read();
      if (r3 !== null)
        return Promise.resolve({ done: false, value: r3 });
      if (this[Q3])
        return e();
      let n, o2, h3 = (d2) => {
        this.off("data", a2), this.off("end", l3), this.off(S3, c3), e(), o2(d2);
      }, a2 = (d2) => {
        this.off("error", h3), this.off("end", l3), this.off(S3, c3), this.pause(), n({ value: d2, done: !!this[Q3] });
      }, l3 = () => {
        this.off("error", h3), this.off("data", a2), this.off(S3, c3), e(), n({ done: true, value: undefined });
      }, c3 = () => h3(new Error("stream destroyed"));
      return new Promise((d2, y2) => {
        o2 = y2, n = d2, this.once(S3, c3), this.once("error", h3), this.once("end", l3), this.once("data", a2);
      });
    }, throw: e, return: e, [Symbol.asyncIterator]() {
      return this;
    }, [Symbol.asyncDispose]: async () => {} };
  }
  [Symbol.iterator]() {
    this[C2] = false;
    let t2 = false, e = () => (this.pause(), this.off(_i, e), this.off(S3, e), this.off("end", e), t2 = true, { done: true, value: undefined }), i = () => {
      if (t2)
        return e();
      let r3 = this.read();
      return r3 === null ? e() : { done: false, value: r3 };
    };
    return this.once("end", e), this.once(_i, e), this.once(S3, e), { next: i, throw: e, return: e, [Symbol.iterator]() {
      return this;
    }, [Symbol.dispose]: () => {} };
  }
  destroy(t2) {
    if (this[S3])
      return t2 ? this.emit("error", t2) : this.emit(S3), this;
    this[S3] = true, this[C2] = true, this[b3].length = 0, this[_3] = 0;
    let e = this;
    return typeof e.close == "function" && !this[Ne2] && e.close(), t2 ? this.emit("error", t2) : this.emit(S3), this;
  }
  static get isStream() {
    return Wr2;
  }
};
var Jr2 = I3.writev;
var ht2 = Symbol("_autoClose");
var H3 = Symbol("_close");
var te2 = Symbol("_ended");
var m2 = Symbol("_fd");
var Ni = Symbol("_finished");
var tt2 = Symbol("_flags");
var Ai = Symbol("_flush");
var ki = Symbol("_handleChunk");
var vi = Symbol("_makeBuf");
var ie2 = Symbol("_mode");
var ke = Symbol("_needDrain");
var Ut2 = Symbol("_onerror");
var Ht2 = Symbol("_onopen");
var Ii = Symbol("_onread");
var Pt2 = Symbol("_onwrite");
var at2 = Symbol("_open");
var U2 = Symbol("_path");
var ot2 = Symbol("_pos");
var Y3 = Symbol("_queue");
var zt2 = Symbol("_read");
var Ci = Symbol("_readSize");
var j3 = Symbol("_reading");
var ee3 = Symbol("_remain");
var Fi = Symbol("_size");
var ve = Symbol("_write");
var gt2 = Symbol("_writing");
var Me2 = Symbol("_defaultFlag");
var bt2 = Symbol("_errored");
var _t2 = class extends A3 {
  [bt2] = false;
  [m2];
  [U2];
  [Ci];
  [j3] = false;
  [Fi];
  [ee3];
  [ht2];
  constructor(t2, e) {
    if (e = e || {}, super(e), this.readable = true, this.writable = false, typeof t2 != "string")
      throw new TypeError("path must be a string");
    this[bt2] = false, this[m2] = typeof e.fd == "number" ? e.fd : undefined, this[U2] = t2, this[Ci] = e.readSize || 16 * 1024 * 1024, this[j3] = false, this[Fi] = typeof e.size == "number" ? e.size : 1 / 0, this[ee3] = this[Fi], this[ht2] = typeof e.autoClose == "boolean" ? e.autoClose : true, typeof this[m2] == "number" ? this[zt2]() : this[at2]();
  }
  get fd() {
    return this[m2];
  }
  get path() {
    return this[U2];
  }
  write() {
    throw new TypeError("this is a readable stream");
  }
  end() {
    throw new TypeError("this is a readable stream");
  }
  [at2]() {
    I3.open(this[U2], "r", (t2, e) => this[Ht2](t2, e));
  }
  [Ht2](t2, e) {
    t2 ? this[Ut2](t2) : (this[m2] = e, this.emit("open", e), this[zt2]());
  }
  [vi]() {
    return Buffer.allocUnsafe(Math.min(this[Ci], this[ee3]));
  }
  [zt2]() {
    if (!this[j3]) {
      this[j3] = true;
      let t2 = this[vi]();
      if (t2.length === 0)
        return process.nextTick(() => this[Ii](null, 0, t2));
      I3.read(this[m2], t2, 0, t2.length, null, (e, i, r3) => this[Ii](e, i, r3));
    }
  }
  [Ii](t2, e, i) {
    this[j3] = false, t2 ? this[Ut2](t2) : this[ki](e, i) && this[zt2]();
  }
  [H3]() {
    if (this[ht2] && typeof this[m2] == "number") {
      let t2 = this[m2];
      this[m2] = undefined, I3.close(t2, (e) => e ? this.emit("error", e) : this.emit("close"));
    }
  }
  [Ut2](t2) {
    this[j3] = true, this[H3](), this.emit("error", t2);
  }
  [ki](t2, e) {
    let i = false;
    return this[ee3] -= t2, t2 > 0 && (i = super.write(t2 < e.length ? e.subarray(0, t2) : e)), (t2 === 0 || this[ee3] <= 0) && (i = false, this[H3](), super.end()), i;
  }
  emit(t2, ...e) {
    switch (t2) {
      case "prefinish":
      case "finish":
        return false;
      case "drain":
        return typeof this[m2] == "number" && this[zt2](), false;
      case "error":
        return this[bt2] ? false : (this[bt2] = true, super.emit(t2, ...e));
      default:
        return super.emit(t2, ...e);
    }
  }
};
var Be2 = class extends _t2 {
  [at2]() {
    let t2 = true;
    try {
      this[Ht2](null, I3.openSync(this[U2], "r")), t2 = false;
    } finally {
      t2 && this[H3]();
    }
  }
  [zt2]() {
    let t2 = true;
    try {
      if (!this[j3]) {
        this[j3] = true;
        do {
          let e = this[vi](), i = e.length === 0 ? 0 : I3.readSync(this[m2], e, 0, e.length, null);
          if (!this[ki](i, e))
            break;
        } while (true);
        this[j3] = false;
      }
      t2 = false;
    } finally {
      t2 && this[H3]();
    }
  }
  [H3]() {
    if (this[ht2] && typeof this[m2] == "number") {
      let t2 = this[m2];
      this[m2] = undefined, I3.closeSync(t2), this.emit("close");
    }
  }
};
var et2 = class extends Qr2 {
  readable = false;
  writable = true;
  [bt2] = false;
  [gt2] = false;
  [te2] = false;
  [Y3] = [];
  [ke] = false;
  [U2];
  [ie2];
  [ht2];
  [m2];
  [Me2];
  [tt2];
  [Ni] = false;
  [ot2];
  constructor(t2, e) {
    e = e || {}, super(e), this[U2] = t2, this[m2] = typeof e.fd == "number" ? e.fd : undefined, this[ie2] = e.mode === undefined ? 438 : e.mode, this[ot2] = typeof e.start == "number" ? e.start : undefined, this[ht2] = typeof e.autoClose == "boolean" ? e.autoClose : true;
    let i = this[ot2] !== undefined ? "r+" : "w";
    this[Me2] = e.flags === undefined, this[tt2] = e.flags === undefined ? i : e.flags, this[m2] === undefined && this[at2]();
  }
  emit(t2, ...e) {
    if (t2 === "error") {
      if (this[bt2])
        return false;
      this[bt2] = true;
    }
    return super.emit(t2, ...e);
  }
  get fd() {
    return this[m2];
  }
  get path() {
    return this[U2];
  }
  [Ut2](t2) {
    this[H3](), this[gt2] = true, this.emit("error", t2);
  }
  [at2]() {
    I3.open(this[U2], this[tt2], this[ie2], (t2, e) => this[Ht2](t2, e));
  }
  [Ht2](t2, e) {
    this[Me2] && this[tt2] === "r+" && t2 && t2.code === "ENOENT" ? (this[tt2] = "w", this[at2]()) : t2 ? this[Ut2](t2) : (this[m2] = e, this.emit("open", e), this[gt2] || this[Ai]());
  }
  end(t2, e) {
    return t2 && this.write(t2, e), this[te2] = true, !this[gt2] && !this[Y3].length && typeof this[m2] == "number" && this[Pt2](null, 0), this;
  }
  write(t2, e) {
    return typeof t2 == "string" && (t2 = Buffer.from(t2, e)), this[te2] ? (this.emit("error", new Error("write() after end()")), false) : this[m2] === undefined || this[gt2] || this[Y3].length ? (this[Y3].push(t2), this[ke] = true, false) : (this[gt2] = true, this[ve](t2), true);
  }
  [ve](t2) {
    I3.write(this[m2], t2, 0, t2.length, this[ot2], (e, i) => this[Pt2](e, i));
  }
  [Pt2](t2, e) {
    t2 ? this[Ut2](t2) : (this[ot2] !== undefined && typeof e == "number" && (this[ot2] += e), this[Y3].length ? this[Ai]() : (this[gt2] = false, this[te2] && !this[Ni] ? (this[Ni] = true, this[H3](), this.emit("finish")) : this[ke] && (this[ke] = false, this.emit("drain"))));
  }
  [Ai]() {
    if (this[Y3].length === 0)
      this[te2] && this[Pt2](null, 0);
    else if (this[Y3].length === 1)
      this[ve](this[Y3].pop());
    else {
      let t2 = this[Y3];
      this[Y3] = [], Jr2(this[m2], t2, this[ot2], (e, i) => this[Pt2](e, i));
    }
  }
  [H3]() {
    if (this[ht2] && typeof this[m2] == "number") {
      let t2 = this[m2];
      this[m2] = undefined, I3.close(t2, (e) => e ? this.emit("error", e) : this.emit("close"));
    }
  }
};
var Wt2 = class extends et2 {
  [at2]() {
    let t2;
    if (this[Me2] && this[tt2] === "r+")
      try {
        t2 = I3.openSync(this[U2], this[tt2], this[ie2]);
      } catch (e) {
        if (e?.code === "ENOENT")
          return this[tt2] = "w", this[at2]();
        throw e;
      }
    else
      t2 = I3.openSync(this[U2], this[tt2], this[ie2]);
    this[Ht2](null, t2);
  }
  [H3]() {
    if (this[ht2] && typeof this[m2] == "number") {
      let t2 = this[m2];
      this[m2] = undefined, I3.closeSync(t2), this.emit("close");
    }
  }
  [ve](t2) {
    let e = true;
    try {
      this[Pt2](null, I3.writeSync(this[m2], t2, 0, t2.length, this[ot2])), e = false;
    } finally {
      if (e)
        try {
          this[H3]();
        } catch {}
    }
  }
};
var jr2 = new Map([["C", "cwd"], ["f", "file"], ["z", "gzip"], ["P", "preservePaths"], ["U", "unlink"], ["strip-components", "strip"], ["stripComponents", "strip"], ["keep-newer", "newer"], ["keepNewer", "newer"], ["keep-newer-files", "newer"], ["keepNewerFiles", "newer"], ["k", "keep"], ["keep-existing", "keep"], ["keepExisting", "keep"], ["m", "noMtime"], ["no-mtime", "noMtime"], ["p", "preserveOwner"], ["L", "follow"], ["h", "follow"], ["onentry", "onReadEntry"]]);
var Fs2 = (s) => !!s.sync && !!s.file;
var ks2 = (s) => !s.sync && !!s.file;
var vs2 = (s) => !!s.sync && !s.file;
var Ms2 = (s) => !s.sync && !s.file;
var Bs2 = (s) => !!s.file;
var tn2 = (s) => {
  let t2 = jr2.get(s);
  return t2 || s;
};
var se2 = (s = {}) => {
  if (!s)
    return {};
  let t2 = {};
  for (let [e, i] of Object.entries(s)) {
    let r3 = tn2(e);
    t2[r3] = i;
  }
  return t2.chmod === undefined && t2.noChmod === false && (t2.chmod = true), delete t2.noChmod, t2;
};
var K3 = (s, t2, e, i, r3) => Object.assign((n = [], o2, h3) => {
  Array.isArray(n) && (o2 = n, n = {}), typeof o2 == "function" && (h3 = o2, o2 = undefined), o2 = o2 ? Array.from(o2) : [];
  let a2 = se2(n);
  if (r3?.(a2, o2), Fs2(a2)) {
    if (typeof h3 == "function")
      throw new TypeError("callback not supported for sync tar functions");
    return s(a2, o2);
  } else if (ks2(a2)) {
    let l3 = t2(a2, o2);
    return h3 ? l3.then(() => h3(), h3) : l3;
  } else if (vs2(a2)) {
    if (typeof h3 == "function")
      throw new TypeError("callback not supported for sync tar functions");
    return e(a2, o2);
  } else if (Ms2(a2)) {
    if (typeof h3 == "function")
      throw new TypeError("callback only supported with file option");
    return i(a2, o2);
  }
  throw new Error("impossible options??");
}, { syncFile: s, asyncFile: t2, syncNoFile: e, asyncNoFile: i, validate: r3 });
var sn2 = en2.constants || { ZLIB_VERNUM: 4736 };
var M4 = Object.freeze(Object.assign(Object.create(null), { Z_NO_FLUSH: 0, Z_PARTIAL_FLUSH: 1, Z_SYNC_FLUSH: 2, Z_FULL_FLUSH: 3, Z_FINISH: 4, Z_BLOCK: 5, Z_OK: 0, Z_STREAM_END: 1, Z_NEED_DICT: 2, Z_ERRNO: -1, Z_STREAM_ERROR: -2, Z_DATA_ERROR: -3, Z_MEM_ERROR: -4, Z_BUF_ERROR: -5, Z_VERSION_ERROR: -6, Z_NO_COMPRESSION: 0, Z_BEST_SPEED: 1, Z_BEST_COMPRESSION: 9, Z_DEFAULT_COMPRESSION: -1, Z_FILTERED: 1, Z_HUFFMAN_ONLY: 2, Z_RLE: 3, Z_FIXED: 4, Z_DEFAULT_STRATEGY: 0, DEFLATE: 1, INFLATE: 2, GZIP: 3, GUNZIP: 4, DEFLATERAW: 5, INFLATERAW: 6, UNZIP: 7, BROTLI_DECODE: 8, BROTLI_ENCODE: 9, Z_MIN_WINDOWBITS: 8, Z_MAX_WINDOWBITS: 15, Z_DEFAULT_WINDOWBITS: 15, Z_MIN_CHUNK: 64, Z_MAX_CHUNK: 1 / 0, Z_DEFAULT_CHUNK: 16384, Z_MIN_MEMLEVEL: 1, Z_MAX_MEMLEVEL: 9, Z_DEFAULT_MEMLEVEL: 8, Z_MIN_LEVEL: -1, Z_MAX_LEVEL: 9, Z_DEFAULT_LEVEL: -1, BROTLI_OPERATION_PROCESS: 0, BROTLI_OPERATION_FLUSH: 1, BROTLI_OPERATION_FINISH: 2, BROTLI_OPERATION_EMIT_METADATA: 3, BROTLI_MODE_GENERIC: 0, BROTLI_MODE_TEXT: 1, BROTLI_MODE_FONT: 2, BROTLI_DEFAULT_MODE: 0, BROTLI_MIN_QUALITY: 0, BROTLI_MAX_QUALITY: 11, BROTLI_DEFAULT_QUALITY: 11, BROTLI_MIN_WINDOW_BITS: 10, BROTLI_MAX_WINDOW_BITS: 24, BROTLI_LARGE_MAX_WINDOW_BITS: 30, BROTLI_DEFAULT_WINDOW: 22, BROTLI_MIN_INPUT_BLOCK_BITS: 16, BROTLI_MAX_INPUT_BLOCK_BITS: 24, BROTLI_PARAM_MODE: 0, BROTLI_PARAM_QUALITY: 1, BROTLI_PARAM_LGWIN: 2, BROTLI_PARAM_LGBLOCK: 3, BROTLI_PARAM_DISABLE_LITERAL_CONTEXT_MODELING: 4, BROTLI_PARAM_SIZE_HINT: 5, BROTLI_PARAM_LARGE_WINDOW: 6, BROTLI_PARAM_NPOSTFIX: 7, BROTLI_PARAM_NDIRECT: 8, BROTLI_DECODER_RESULT_ERROR: 0, BROTLI_DECODER_RESULT_SUCCESS: 1, BROTLI_DECODER_RESULT_NEEDS_MORE_INPUT: 2, BROTLI_DECODER_RESULT_NEEDS_MORE_OUTPUT: 3, BROTLI_DECODER_PARAM_DISABLE_RING_BUFFER_REALLOCATION: 0, BROTLI_DECODER_PARAM_LARGE_WINDOW: 1, BROTLI_DECODER_NO_ERROR: 0, BROTLI_DECODER_SUCCESS: 1, BROTLI_DECODER_NEEDS_MORE_INPUT: 2, BROTLI_DECODER_NEEDS_MORE_OUTPUT: 3, BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_NIBBLE: -1, BROTLI_DECODER_ERROR_FORMAT_RESERVED: -2, BROTLI_DECODER_ERROR_FORMAT_EXUBERANT_META_NIBBLE: -3, BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_ALPHABET: -4, BROTLI_DECODER_ERROR_FORMAT_SIMPLE_HUFFMAN_SAME: -5, BROTLI_DECODER_ERROR_FORMAT_CL_SPACE: -6, BROTLI_DECODER_ERROR_FORMAT_HUFFMAN_SPACE: -7, BROTLI_DECODER_ERROR_FORMAT_CONTEXT_MAP_REPEAT: -8, BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_1: -9, BROTLI_DECODER_ERROR_FORMAT_BLOCK_LENGTH_2: -10, BROTLI_DECODER_ERROR_FORMAT_TRANSFORM: -11, BROTLI_DECODER_ERROR_FORMAT_DICTIONARY: -12, BROTLI_DECODER_ERROR_FORMAT_WINDOW_BITS: -13, BROTLI_DECODER_ERROR_FORMAT_PADDING_1: -14, BROTLI_DECODER_ERROR_FORMAT_PADDING_2: -15, BROTLI_DECODER_ERROR_FORMAT_DISTANCE: -16, BROTLI_DECODER_ERROR_DICTIONARY_NOT_SET: -19, BROTLI_DECODER_ERROR_INVALID_ARGUMENTS: -20, BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MODES: -21, BROTLI_DECODER_ERROR_ALLOC_TREE_GROUPS: -22, BROTLI_DECODER_ERROR_ALLOC_CONTEXT_MAP: -25, BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_1: -26, BROTLI_DECODER_ERROR_ALLOC_RING_BUFFER_2: -27, BROTLI_DECODER_ERROR_ALLOC_BLOCK_TYPE_TREES: -30, BROTLI_DECODER_ERROR_UNREACHABLE: -31 }, sn2));
var rn2 = Ot2.concat;
var zs2 = Object.getOwnPropertyDescriptor(Ot2, "concat");
var nn2 = (s) => s;
var Bi = zs2?.writable === true || zs2?.set !== undefined ? (s) => {
  Ot2.concat = s ? nn2 : rn2;
} : (s) => {};
var Tt2 = Symbol("_superWrite");
var Gt2 = class extends Error {
  code;
  errno;
  constructor(t2, e) {
    super("zlib: " + t2.message, { cause: t2 }), this.code = t2.code, this.errno = t2.errno, this.code || (this.code = "ZLIB_ERROR"), this.message = "zlib: " + t2.message, Error.captureStackTrace(this, e ?? this.constructor);
  }
  get name() {
    return "ZlibError";
  }
};
var Pi = Symbol("flushFlag");
var re2 = class extends A3 {
  #t = false;
  #i = false;
  #s;
  #n;
  #r;
  #e;
  #o;
  get sawError() {
    return this.#t;
  }
  get handle() {
    return this.#e;
  }
  get flushFlag() {
    return this.#s;
  }
  constructor(t2, e) {
    if (!t2 || typeof t2 != "object")
      throw new TypeError("invalid options for ZlibBase constructor");
    if (super(t2), this.#s = t2.flush ?? 0, this.#n = t2.finishFlush ?? 0, this.#r = t2.fullFlushFlag ?? 0, typeof Ps2[e] != "function")
      throw new TypeError("Compression method not supported: " + e);
    try {
      this.#e = new Ps2[e](t2);
    } catch (i) {
      throw new Gt2(i, this.constructor);
    }
    this.#o = (i) => {
      this.#t || (this.#t = true, this.close(), this.emit("error", i));
    }, this.#e?.on("error", (i) => this.#o(new Gt2(i))), this.once("end", () => this.close);
  }
  close() {
    this.#e && (this.#e.close(), this.#e = undefined, this.emit("close"));
  }
  reset() {
    if (!this.#t)
      return zi(this.#e, "zlib binding closed"), this.#e.reset?.();
  }
  flush(t2) {
    this.ended || (typeof t2 != "number" && (t2 = this.#r), this.write(Object.assign(Ot2.alloc(0), { [Pi]: t2 })));
  }
  end(t2, e, i) {
    return typeof t2 == "function" && (i = t2, e = undefined, t2 = undefined), typeof e == "function" && (i = e, e = undefined), t2 && (e ? this.write(t2, e) : this.write(t2)), this.flush(this.#n), this.#i = true, super.end(i);
  }
  get ended() {
    return this.#i;
  }
  [Tt2](t2) {
    return super.write(t2);
  }
  write(t2, e, i) {
    if (typeof e == "function" && (i = e, e = "utf8"), typeof t2 == "string" && (t2 = Ot2.from(t2, e)), this.#t)
      return;
    zi(this.#e, "zlib binding closed");
    let r3 = this.#e._handle, n = r3.close;
    r3.close = () => {};
    let o2 = this.#e.close;
    this.#e.close = () => {}, Bi(true);
    let h3;
    try {
      let l3 = typeof t2[Pi] == "number" ? t2[Pi] : this.#s;
      h3 = this.#e._processChunk(t2, l3), Bi(false);
    } catch (l3) {
      Bi(false), this.#o(new Gt2(l3, this.write));
    } finally {
      this.#e && (this.#e._handle = r3, r3.close = n, this.#e.close = o2, this.#e.removeAllListeners("error"));
    }
    this.#e && this.#e.on("error", (l3) => this.#o(new Gt2(l3, this.write)));
    let a2;
    if (h3)
      if (Array.isArray(h3) && h3.length > 0) {
        let l3 = h3[0];
        a2 = this[Tt2](Ot2.from(l3));
        for (let c3 = 1;c3 < h3.length; c3++)
          a2 = this[Tt2](h3[c3]);
      } else
        a2 = this[Tt2](Ot2.from(h3));
    return i && i(), a2;
  }
};
var Pe2 = class extends re2 {
  #t;
  #i;
  constructor(t2, e) {
    t2 = t2 || {}, t2.flush = t2.flush || M4.Z_NO_FLUSH, t2.finishFlush = t2.finishFlush || M4.Z_FINISH, t2.fullFlushFlag = M4.Z_FULL_FLUSH, super(t2, e), this.#t = t2.level, this.#i = t2.strategy;
  }
  params(t2, e) {
    if (!this.sawError) {
      if (!this.handle)
        throw new Error("cannot switch params when binding is closed");
      if (!this.handle.params)
        throw new Error("not supported in this implementation");
      if (this.#t !== t2 || this.#i !== e) {
        this.flush(M4.Z_SYNC_FLUSH), zi(this.handle, "zlib binding closed");
        let i = this.handle.flush;
        this.handle.flush = (r3, n) => {
          typeof r3 == "function" && (n = r3, r3 = this.flushFlag), this.flush(r3), n?.();
        };
        try {
          this.handle.params(t2, e);
        } finally {
          this.handle.flush = i;
        }
        this.handle && (this.#t = t2, this.#i = e);
      }
    }
  }
};
var ze2 = class extends Pe2 {
  #t;
  constructor(t2) {
    super(t2, "Gzip"), this.#t = t2 && !!t2.portable;
  }
  [Tt2](t2) {
    return this.#t ? (this.#t = false, t2[9] = 255, super[Tt2](t2)) : super[Tt2](t2);
  }
};
var Ue2 = class extends Pe2 {
  constructor(t2) {
    super(t2, "Unzip");
  }
};
var He2 = class extends re2 {
  constructor(t2, e) {
    t2 = t2 || {}, t2.flush = t2.flush || M4.BROTLI_OPERATION_PROCESS, t2.finishFlush = t2.finishFlush || M4.BROTLI_OPERATION_FINISH, t2.fullFlushFlag = M4.BROTLI_OPERATION_FLUSH, super(t2, e);
  }
};
var We2 = class extends He2 {
  constructor(t2) {
    super(t2, "BrotliCompress");
  }
};
var Ge2 = class extends He2 {
  constructor(t2) {
    super(t2, "BrotliDecompress");
  }
};
var Ze2 = class extends re2 {
  constructor(t2, e) {
    t2 = t2 || {}, t2.flush = t2.flush || M4.ZSTD_e_continue, t2.finishFlush = t2.finishFlush || M4.ZSTD_e_end, t2.fullFlushFlag = M4.ZSTD_e_flush, super(t2, e);
  }
};
var Ye2 = class extends Ze2 {
  constructor(t2) {
    super(t2, "ZstdCompress");
  }
};
var Ke2 = class extends Ze2 {
  constructor(t2) {
    super(t2, "ZstdDecompress");
  }
};
var Us2 = (s, t2) => {
  if (Number.isSafeInteger(s))
    s < 0 ? an2(s, t2) : hn2(s, t2);
  else
    throw Error("cannot encode number outside of javascript safe integer range");
  return t2;
};
var hn2 = (s, t2) => {
  t2[0] = 128;
  for (var e = t2.length;e > 1; e--)
    t2[e - 1] = s & 255, s = Math.floor(s / 256);
};
var an2 = (s, t2) => {
  t2[0] = 255;
  var e = false;
  s = s * -1;
  for (var i = t2.length;i > 1; i--) {
    var r3 = s & 255;
    s = Math.floor(s / 256), e ? t2[i - 1] = Ws2(r3) : r3 === 0 ? t2[i - 1] = 0 : (e = true, t2[i - 1] = Gs2(r3));
  }
};
var Hs2 = (s) => {
  let t2 = s[0], e = t2 === 128 ? cn2(s.subarray(1, s.length)) : t2 === 255 ? ln2(s) : null;
  if (e === null)
    throw Error("invalid base256 encoding");
  if (!Number.isSafeInteger(e))
    throw Error("parsed number outside of javascript safe integer range");
  return e;
};
var ln2 = (s) => {
  for (var t2 = s.length, e = 0, i = false, r3 = t2 - 1;r3 > -1; r3--) {
    var n = Number(s[r3]), o2;
    i ? o2 = Ws2(n) : n === 0 ? o2 = n : (i = true, o2 = Gs2(n)), o2 !== 0 && (e -= o2 * Math.pow(256, t2 - r3 - 1));
  }
  return e;
};
var cn2 = (s) => {
  for (var t2 = s.length, e = 0, i = t2 - 1;i > -1; i--) {
    var r3 = Number(s[i]);
    r3 !== 0 && (e += r3 * Math.pow(256, t2 - i - 1));
  }
  return e;
};
var Ws2 = (s) => (255 ^ s) & 255;
var Gs2 = (s) => (255 ^ s) + 1 & 255;
var Hi = {};
Ur2(Hi, { code: () => Ve2, isCode: () => ne3, isName: () => dn2, name: () => oe3, normalFsTypes: () => Ui });
var ne3 = (s) => oe3.has(s);
var dn2 = (s) => Ve2.has(s);
var Ui = new Set(["0", "", "1", "2", "3", "4", "5", "6", "7", "D"]);
var oe3 = new Map([["0", "File"], ["", "OldFile"], ["1", "Link"], ["2", "SymbolicLink"], ["3", "CharacterDevice"], ["4", "BlockDevice"], ["5", "Directory"], ["6", "FIFO"], ["7", "ContiguousFile"], ["g", "GlobalExtendedHeader"], ["x", "ExtendedHeader"], ["A", "SolarisACL"], ["D", "GNUDumpDir"], ["I", "Inode"], ["K", "NextFileHasLongLinkpath"], ["L", "NextFileHasLongPath"], ["M", "ContinuationFile"], ["N", "OldGnuLongPath"], ["S", "SparseFile"], ["V", "TapeVolumeHeader"], ["X", "OldExtendedHeader"]]);
var Ve2 = new Map(Array.from(oe3).map((s) => [s[1], s[0]]));
var un2 = (s) => s === undefined || s < 0 ? undefined : s;
var F3 = class {
  cksumValid = false;
  needPax = false;
  nullBlock = false;
  block;
  path;
  mode;
  uid;
  gid;
  size;
  cksum;
  #t = "Unsupported";
  linkpath;
  uname;
  gname;
  devmaj = 0;
  devmin = 0;
  atime;
  ctime;
  mtime;
  charset;
  comment;
  constructor(t2, e = 0, i, r3) {
    Buffer.isBuffer(t2) ? this.decode(t2, e || 0, i, r3) : t2 && this.#i(t2);
  }
  decode(t2, e, i, r3) {
    if (e || (e = 0), !t2 || !(t2.length >= e + 512))
      throw new Error("need 512 bytes for header");
    let n = xt2(t2, e + 156, 1), o2 = Ui.has(n), h3 = o2 ? i : undefined, a2 = o2 ? r3 : undefined;
    if (this.path = h3?.path ?? xt2(t2, e, 100), this.mode = h3?.mode ?? a2?.mode ?? lt2(t2, e + 100, 8), this.uid = h3?.uid ?? a2?.uid ?? lt2(t2, e + 108, 8), this.gid = h3?.gid ?? a2?.gid ?? lt2(t2, e + 116, 8), this.size = un2(h3?.size ?? a2?.size ?? lt2(t2, e + 124, 12)), this.mtime = h3?.mtime ?? a2?.mtime ?? Wi(t2, e + 136, 12), this.cksum = lt2(t2, e + 148, 12), a2 && this.#i(a2, true), h3 && this.#i(h3), ne3(n) && (this.#t = n || "0"), this.#t === "0" && this.path.slice(-1) === "/" && (this.#t = "5"), this.#t === "5" && (this.size = 0), this.linkpath = xt2(t2, e + 157, 100), t2.subarray(e + 257, e + 265).toString() === "ustar\x0000")
      if (this.uname = h3?.uname ?? a2?.uname ?? xt2(t2, e + 265, 32), this.gname = h3?.gname ?? a2?.gname ?? xt2(t2, e + 297, 32), this.devmaj = h3?.devmaj ?? a2?.devmaj ?? lt2(t2, e + 329, 8) ?? 0, this.devmin = h3?.devmin ?? a2?.devmin ?? lt2(t2, e + 337, 8) ?? 0, t2[e + 475] !== 0) {
        let c3 = xt2(t2, e + 345, 155);
        this.path = c3 + "/" + this.path;
      } else {
        let c3 = xt2(t2, e + 345, 130);
        c3 && (this.path = c3 + "/" + this.path), this.atime = i?.atime ?? r3?.atime ?? Wi(t2, e + 476, 12), this.ctime = i?.ctime ?? r3?.ctime ?? Wi(t2, e + 488, 12);
      }
    let l3 = 256;
    for (let c3 = e;c3 < e + 148; c3++)
      l3 += t2[c3];
    for (let c3 = e + 156;c3 < e + 512; c3++)
      l3 += t2[c3];
    this.cksumValid = l3 === this.cksum, this.cksum === undefined && l3 === 256 && (this.nullBlock = true);
  }
  #i(t2, e = false) {
    Object.assign(this, Object.fromEntries(Object.entries(t2).filter(([i, r3]) => !(r3 == null || i === "size" && Number(r3) < 0 || i === "path" && e || i === "linkpath" && e || i === "global"))));
  }
  encode(t2, e = 0) {
    if (t2 || (t2 = this.block = Buffer.alloc(512)), this.#t === "Unsupported" && (this.#t = "0"), !(t2.length >= e + 512))
      throw new Error("need 512 bytes for header");
    let i = this.ctime || this.atime ? 130 : 155, r3 = mn2(this.path || "", i), n = r3[0], o2 = r3[1];
    this.needPax = !!r3[2], this.needPax = Lt2(t2, e, 100, n) || this.needPax, this.needPax = ct2(t2, e + 100, 8, this.mode) || this.needPax, this.needPax = ct2(t2, e + 108, 8, this.uid) || this.needPax, this.needPax = ct2(t2, e + 116, 8, this.gid) || this.needPax, this.needPax = ct2(t2, e + 124, 12, this.size) || this.needPax, this.needPax = Gi(t2, e + 136, 12, this.mtime) || this.needPax, t2[e + 156] = Number(this.#t.codePointAt(0)), this.needPax = Lt2(t2, e + 157, 100, this.linkpath) || this.needPax, t2.write("ustar\x0000", e + 257, 8), this.needPax = Lt2(t2, e + 265, 32, this.uname) || this.needPax, this.needPax = Lt2(t2, e + 297, 32, this.gname) || this.needPax, this.needPax = ct2(t2, e + 329, 8, this.devmaj) || this.needPax, this.needPax = ct2(t2, e + 337, 8, this.devmin) || this.needPax, this.needPax = Lt2(t2, e + 345, i, o2) || this.needPax, t2[e + 475] !== 0 ? this.needPax = Lt2(t2, e + 345, 155, o2) || this.needPax : (this.needPax = Lt2(t2, e + 345, 130, o2) || this.needPax, this.needPax = Gi(t2, e + 476, 12, this.atime) || this.needPax, this.needPax = Gi(t2, e + 488, 12, this.ctime) || this.needPax);
    let h3 = 256;
    for (let a2 = e;a2 < e + 148; a2++)
      h3 += t2[a2];
    for (let a2 = e + 156;a2 < e + 512; a2++)
      h3 += t2[a2];
    return this.cksum = h3, ct2(t2, e + 148, 8, this.cksum), this.cksumValid = true, this.needPax;
  }
  get type() {
    return this.#t === "Unsupported" ? this.#t : oe3.get(this.#t);
  }
  get typeKey() {
    return this.#t;
  }
  set type(t2) {
    let e = String(Ve2.get(t2));
    if (ne3(e) || e === "Unsupported")
      this.#t = e;
    else if (ne3(t2))
      this.#t = t2;
    else
      throw new TypeError("invalid entry type: " + t2);
  }
};
var mn2 = (s, t2) => {
  let i = s, r3 = "", n, o2 = Zt2.parse(s).root || ".";
  if (Buffer.byteLength(i) < 100)
    n = [i, r3, false];
  else {
    r3 = Zt2.dirname(i), i = Zt2.basename(i);
    do
      Buffer.byteLength(i) <= 100 && Buffer.byteLength(r3) <= t2 ? n = [i, r3, false] : Buffer.byteLength(i) > 100 && Buffer.byteLength(r3) <= t2 ? n = [i.slice(0, 99), r3, true] : (i = Zt2.join(Zt2.basename(r3), i), r3 = Zt2.dirname(r3));
    while (r3 !== o2 && n === undefined);
    n || (n = [s.slice(0, 99), "", true]);
  }
  return n;
};
var xt2 = (s, t2, e) => s.subarray(t2, t2 + e).toString("utf8").replace(/\0.*/, "");
var Wi = (s, t2, e) => pn2(lt2(s, t2, e));
var pn2 = (s) => s === undefined ? undefined : new Date(s * 1000);
var lt2 = (s, t2, e) => Number(s[t2]) & 128 ? Hs2(s.subarray(t2, t2 + e)) : wn2(s, t2, e);
var En2 = (s) => isNaN(s) ? undefined : s;
var wn2 = (s, t2, e) => En2(parseInt(s.subarray(t2, t2 + e).toString("utf8").replace(/\0.*$/, "").trim(), 8));
var Sn2 = { 12: 8589934591, 8: 2097151 };
var ct2 = (s, t2, e, i) => i === undefined ? false : i > Sn2[e] || i < 0 ? (Us2(i, s.subarray(t2, t2 + e)), true) : (yn2(s, t2, e, i), false);
var yn2 = (s, t2, e, i) => s.write(Rn2(i, e), t2, e, "ascii");
var Rn2 = (s, t2) => gn2(Math.floor(s).toString(8), t2);
var gn2 = (s, t2) => (s.length === t2 - 1 ? s : new Array(t2 - s.length - 1).join("0") + s + " ") + "\x00";
var Gi = (s, t2, e, i) => i === undefined ? false : ct2(s, t2, e, i.getTime() / 1000);
var bn2 = new Array(156).join("\x00");
var Lt2 = (s, t2, e, i) => i === undefined ? false : (s.write(i + bn2, t2, e, "utf8"), i.length !== Buffer.byteLength(i) || i.length > e);
var ft2 = class s {
  atime;
  mtime;
  ctime;
  charset;
  comment;
  gid;
  uid;
  gname;
  uname;
  linkpath;
  dev;
  ino;
  nlink;
  path;
  size;
  mode;
  global;
  constructor(t2, e = false) {
    this.atime = t2.atime, this.charset = t2.charset, this.comment = t2.comment, this.ctime = t2.ctime, this.dev = t2.dev, this.gid = t2.gid, this.global = e, this.gname = t2.gname, this.ino = t2.ino, this.linkpath = t2.linkpath, this.mtime = t2.mtime, this.nlink = t2.nlink, this.path = t2.path, this.size = t2.size, this.uid = t2.uid, this.uname = t2.uname;
  }
  encode() {
    let t2 = this.encodeBody();
    if (t2 === "")
      return Buffer.allocUnsafe(0);
    let e = Buffer.byteLength(t2), i = 512 * Math.ceil(1 + e / 512), r3 = Buffer.allocUnsafe(i);
    for (let n = 0;n < 512; n++)
      r3[n] = 0;
    new F3({ path: ("PaxHeader/" + _n2(this.path ?? "")).slice(0, 99), mode: this.mode || 420, uid: this.uid, gid: this.gid, size: e, mtime: this.mtime, type: this.global ? "GlobalExtendedHeader" : "ExtendedHeader", linkpath: "", uname: this.uname || "", gname: this.gname || "", devmaj: 0, devmin: 0, atime: this.atime, ctime: this.ctime }).encode(r3), r3.write(t2, 512, e, "utf8");
    for (let n = e + 512;n < r3.length; n++)
      r3[n] = 0;
    return r3;
  }
  encodeBody() {
    return this.encodeField("path") + this.encodeField("ctime") + this.encodeField("atime") + this.encodeField("dev") + this.encodeField("ino") + this.encodeField("nlink") + this.encodeField("charset") + this.encodeField("comment") + this.encodeField("gid") + this.encodeField("gname") + this.encodeField("linkpath") + this.encodeField("mtime") + this.encodeField("size") + this.encodeField("uid") + this.encodeField("uname");
  }
  encodeField(t2) {
    if (this[t2] === undefined)
      return "";
    let e = this[t2], i = e instanceof Date ? e.getTime() / 1000 : e, r3 = " " + (t2 === "dev" || t2 === "ino" || t2 === "nlink" ? "SCHILY." : "") + t2 + "=" + i + `
`, n = Buffer.byteLength(r3), o2 = Math.floor(Math.log(n) / Math.log(10)) + 1;
    return n + o2 >= Math.pow(10, o2) && (o2 += 1), o2 + n + r3;
  }
  static parse(t2, e, i = false) {
    return new s(On2(Tn2(t2), e), i);
  }
};
var On2 = (s2, t2) => t2 ? Object.assign({}, t2, s2) : s2;
var Tn2 = (s2) => s2.replace(/\n$/, "").split(`
`).reduce(xn2, Object.create(null));
var xn2 = (s2, t2) => {
  let e = parseInt(t2, 10);
  if (e !== Buffer.byteLength(t2) + 1)
    return s2;
  t2 = t2.slice((e + " ").length);
  let i = t2.split("="), r3 = i.shift();
  if (!r3)
    return s2;
  let n = r3.replace(/^SCHILY\.(dev|ino|nlink)/, "$1"), o2 = i.join("=").replace(/\0.*/, "");
  switch (n) {
    case "path":
    case "linkpath":
    case "type":
    case "charset":
    case "comment":
    case "gname":
    case "uname":
      s2[n] = o2;
      break;
    case "ctime":
    case "atime":
    case "mtime":
      s2[n] = new Date(Number(o2) * 1000);
      break;
    case "size":
      let h3 = +o2;
      h3 >= 0 && (s2[n] = h3);
      break;
    case "gid":
    case "uid":
    case "dev":
    case "ino":
    case "nlink":
    case "mode":
      s2[n] = +o2;
      break;
  }
  return s2;
};
var Ln2 = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform;
var f3 = Ln2 !== "win32" ? (s2) => String(s2) : (s2) => String(s2).replaceAll(/\\/g, "/");
var $e2 = class extends A3 {
  extended;
  globalExtended;
  header;
  startBlockSize;
  blockRemain;
  remain;
  type;
  meta = false;
  ignore = false;
  path;
  mode;
  uid;
  gid;
  uname;
  gname;
  size = 0;
  mtime;
  atime;
  ctime;
  linkpath;
  dev;
  ino;
  nlink;
  invalid = false;
  absolute;
  unsupported = false;
  constructor(t2, e, i) {
    switch (super({}), this.pause(), this.extended = e, this.globalExtended = i, this.header = t2, this.remain = t2.size ?? 0, this.startBlockSize = 512 * Math.ceil(this.remain / 512), this.blockRemain = this.startBlockSize, this.type = t2.type, this.type) {
      case "File":
      case "OldFile":
      case "Link":
      case "SymbolicLink":
      case "CharacterDevice":
      case "BlockDevice":
      case "Directory":
      case "FIFO":
      case "ContiguousFile":
      case "GNUDumpDir":
        break;
      case "NextFileHasLongLinkpath":
      case "NextFileHasLongPath":
      case "OldGnuLongPath":
      case "GlobalExtendedHeader":
      case "ExtendedHeader":
      case "OldExtendedHeader":
        this.meta = true;
        break;
      default:
        this.ignore = true;
    }
    if (!t2.path)
      throw new Error("no path provided for tar.ReadEntry");
    this.path = f3(t2.path), this.mode = t2.mode, this.mode && (this.mode = this.mode & 4095), this.uid = t2.uid, this.gid = t2.gid, this.uname = t2.uname, this.gname = t2.gname, this.size = this.remain, this.mtime = t2.mtime, this.atime = t2.atime, this.ctime = t2.ctime, this.linkpath = t2.linkpath ? f3(t2.linkpath) : undefined, this.uname = t2.uname, this.gname = t2.gname, e && this.#t(e), i && this.#t(i, true);
  }
  write(t2) {
    let e = t2.length;
    if (e > this.blockRemain)
      throw new Error("writing more to entry than is appropriate");
    let i = this.remain, r3 = this.blockRemain;
    return this.remain = Math.max(0, i - e), this.blockRemain = Math.max(0, r3 - e), this.ignore ? true : i >= e ? super.write(t2) : super.write(t2.subarray(0, i));
  }
  #t(t2, e = false) {
    t2.path && (t2.path = f3(t2.path)), t2.linkpath && (t2.linkpath = f3(t2.linkpath)), Object.assign(this, Object.fromEntries(Object.entries(t2).filter(([i, r3]) => !(r3 == null || i === "path" && e))));
  }
};
var Dt2 = (s2, t2, e, i = {}) => {
  s2.file && (i.file = s2.file), s2.cwd && (i.cwd = s2.cwd), i.code = e instanceof Error && e.code || t2, i.tarCode = t2, !s2.strict && i.recoverable !== false ? (e instanceof Error && (i = Object.assign(e, i), e = e.message), s2.emit("warn", t2, e, i)) : e instanceof Error ? s2.emit("error", Object.assign(e, i)) : s2.emit("error", Object.assign(new Error(`${t2}: ${e}`), i));
};
var Nn2 = 1024 * 1024;
var Xi = Buffer.from([31, 139]);
var qi = Buffer.from([40, 181, 47, 253]);
var An2 = Math.max(Xi.length, qi.length);
var B3 = Symbol("state");
var Nt2 = Symbol("writeEntry");
var it = Symbol("readEntry");
var Zi = Symbol("nextEntry");
var Zs2 = Symbol("processEntry");
var V3 = Symbol("extendedHeader");
var he2 = Symbol("globalExtendedHeader");
var dt2 = Symbol("meta");
var Ys2 = Symbol("emitMeta");
var p2 = Symbol("buffer");
var st2 = Symbol("queue");
var ut2 = Symbol("ended");
var Yi = Symbol("emittedEnd");
var At2 = Symbol("emit");
var w2 = Symbol("unzip");
var Xe2 = Symbol("consumeChunk");
var qe = Symbol("consumeChunkSub");
var Ki = Symbol("consumeBody");
var Ks2 = Symbol("consumeMeta");
var Vs2 = Symbol("consumeHeader");
var ae2 = Symbol("consuming");
var Vi = Symbol("bufferConcat");
var Qe2 = Symbol("maybeEnd");
var Yt2 = Symbol("writing");
var $3 = Symbol("aborted");
var Je2 = Symbol("onDone");
var It2 = Symbol("sawValidEntry");
var je2 = Symbol("sawNullBlock");
var ti = Symbol("sawEOF");
var $s2 = Symbol("closeStream");
var In2 = 1000;
var le2 = Symbol("compressedBytesRead");
var $i = Symbol("decompressedBytesRead");
var Xs2 = Symbol("checkDecompressionRatio");
var Cn2 = () => true;
var rt = class extends Dn2 {
  file;
  strict;
  maxMetaEntrySize;
  filter;
  brotli;
  zstd;
  maxDecompressionRatio;
  writable = true;
  readable = false;
  [st2] = [];
  [p2];
  [it];
  [Nt2];
  [B3] = "begin";
  [dt2] = "";
  [V3];
  [he2];
  [ut2] = false;
  [w2];
  [$3] = false;
  [It2];
  [je2] = false;
  [ti] = false;
  [Yt2] = false;
  [ae2] = false;
  [Yi] = false;
  [le2] = 0;
  [$i] = 0;
  constructor(t2 = {}) {
    super(), this.file = t2.file || "", this.on(Je2, () => {
      (this[B3] === "begin" || this[It2] === false) && this.warn("TAR_BAD_ARCHIVE", "Unrecognized archive format");
    }), t2.ondone ? this.on(Je2, t2.ondone) : this.on(Je2, () => {
      this.emit("prefinish"), this.emit("finish"), this.emit("end");
    }), this.strict = !!t2.strict, this.maxDecompressionRatio = typeof t2.maxDecompressionRatio == "number" ? t2.maxDecompressionRatio : In2, this.maxMetaEntrySize = t2.maxMetaEntrySize || Nn2, this.filter = typeof t2.filter == "function" ? t2.filter : Cn2;
    let e = t2.file && (t2.file.endsWith(".tar.br") || t2.file.endsWith(".tbr"));
    this.brotli = !(t2.gzip || t2.zstd) && t2.brotli !== undefined ? t2.brotli : e ? undefined : false;
    let i = t2.file && (t2.file.endsWith(".tar.zst") || t2.file.endsWith(".tzst"));
    this.zstd = !(t2.gzip || t2.brotli) && t2.zstd !== undefined ? t2.zstd : i ? true : undefined, this.on("end", () => this[$s2]()), typeof t2.onwarn == "function" && this.on("warn", t2.onwarn), typeof t2.onReadEntry == "function" && this.on("entry", t2.onReadEntry);
  }
  warn(t2, e, i = {}) {
    Dt2(this, t2, e, i);
  }
  [Vs2](t2, e) {
    this[It2] === undefined && (this[It2] = false);
    let i;
    try {
      i = new F3(t2, e, this[V3], this[he2]);
    } catch (r3) {
      return this.warn("TAR_ENTRY_INVALID", r3);
    }
    if (i.nullBlock)
      this[je2] ? (this[ti] = true, this[B3] === "begin" && (this[B3] = "header"), this[At2]("eof")) : (this[je2] = true, this[At2]("nullBlock"));
    else if (this[je2] = false, !i.cksumValid)
      this.warn("TAR_ENTRY_INVALID", "checksum failure", { header: i });
    else if (!i.path)
      this.warn("TAR_ENTRY_INVALID", "path is required", { header: i });
    else {
      let r3 = i.type;
      if (/^(Symbolic)?Link$/.test(r3) && !i.linkpath)
        this.warn("TAR_ENTRY_INVALID", "linkpath required", { header: i });
      else if (!/^(Symbolic)?Link$/.test(r3) && !/^(Global)?ExtendedHeader$/.test(r3) && i.linkpath)
        this.warn("TAR_ENTRY_INVALID", "linkpath forbidden", { header: i });
      else {
        let n = this[Nt2] = new $e2(i, this[V3], this[he2]);
        if (!this[It2])
          if (n.remain) {
            let o2 = () => {
              n.invalid || (this[It2] = true);
            };
            n.on("end", o2);
          } else
            this[It2] = true;
        n.meta ? n.size > this.maxMetaEntrySize ? (n.ignore = true, this[At2]("ignoredEntry", n), this[B3] = "ignore", n.resume()) : n.size > 0 && (this[dt2] = "", n.on("data", (o2) => this[dt2] += o2), this[B3] = "meta") : (this[V3] = undefined, n.ignore = n.ignore || !this.filter(n.path, n), n.ignore ? (this[At2]("ignoredEntry", n), this[B3] = n.remain ? "ignore" : "header", n.resume()) : (n.remain ? this[B3] = "body" : (this[B3] = "header", n.end()), this[it] ? this[st2].push(n) : (this[st2].push(n), this[Zi]())));
      }
    }
  }
  [$s2]() {
    queueMicrotask(() => this.emit("close"));
  }
  [Zs2](t2) {
    let e = true;
    if (!t2)
      this[it] = undefined, e = false;
    else if (Array.isArray(t2)) {
      let [i, ...r3] = t2;
      this.emit(i, ...r3);
    } else
      this[it] = t2, this.emit("entry", t2), t2.emittedEnd || (t2.on("end", () => this[Zi]()), e = false);
    return e;
  }
  [Zi]() {
    do
      ;
    while (this[Zs2](this[st2].shift()));
    if (this[st2].length === 0) {
      let t2 = this[it];
      !t2 || t2.flowing || t2.size === t2.remain ? this[Yt2] || this.emit("drain") : t2.once("drain", () => this.emit("drain"));
    }
  }
  [Ki](t2, e) {
    let i = this[Nt2];
    if (!i)
      throw new Error("attempt to consume body without entry??");
    let r3 = i.blockRemain ?? 0, n = r3 >= t2.length && e === 0 ? t2 : t2.subarray(e, e + r3);
    return i.write(n), i.blockRemain || (this[B3] = "header", this[Nt2] = undefined, i.end()), n.length;
  }
  [Ks2](t2, e) {
    let i = this[Nt2], r3 = this[Ki](t2, e);
    return !this[Nt2] && i && this[Ys2](i), r3;
  }
  [At2](t2, e, i) {
    this[st2].length === 0 && !this[it] ? this.emit(t2, e, i) : this[st2].push([t2, e, i]);
  }
  [Ys2](t2) {
    switch (this[At2]("meta", this[dt2]), t2.type) {
      case "ExtendedHeader":
      case "OldExtendedHeader":
        this[V3] = ft2.parse(this[dt2], this[V3], false);
        break;
      case "GlobalExtendedHeader":
        this[he2] = ft2.parse(this[dt2], this[he2], true);
        break;
      case "NextFileHasLongPath":
      case "OldGnuLongPath": {
        let e = this[V3] ?? Object.create(null);
        this[V3] = e, e.path = this[dt2].replace(/\0.*/, "");
        break;
      }
      case "NextFileHasLongLinkpath": {
        let e = this[V3] || Object.create(null);
        this[V3] = e, e.linkpath = this[dt2].replace(/\0.*/, "");
        break;
      }
      default:
        throw new Error("unknown meta: " + t2.type);
    }
  }
  abort(t2) {
    if (!this[$3]) {
      if (this[w2]) {
        let e = this[w2];
        e.write = () => true, e.end = () => e, e.emit = () => false, e.destroy?.();
      }
      this[$3] = true, this.emit("abort", t2), this.warn("TAR_ABORT", t2, { recoverable: false });
    }
  }
  [Xs2](t2) {
    this[$i] += t2.length;
    let e = this[$i] / this[le2];
    return e > this.maxDecompressionRatio ? (this.abort(new Error(`max decompression ratio exceeded: ${e.toFixed(2)} > ${this.maxDecompressionRatio}`)), false) : true;
  }
  write(t2, e, i) {
    if (typeof e == "function" && (i = e, e = undefined), typeof t2 == "string" && (t2 = Buffer.from(t2, typeof e == "string" ? e : "utf8")), this[$3])
      return i?.(), false;
    if ((this[w2] === undefined || this.brotli === undefined && this[w2] === false) && t2) {
      if (this[p2] && (t2 = Buffer.concat([this[p2], t2]), this[p2] = undefined), t2.length < An2)
        return this[p2] = t2, i?.(), true;
      for (let a2 = 0;this[w2] === undefined && a2 < Xi.length; a2++)
        t2[a2] !== Xi[a2] && (this[w2] = false);
      let o2 = false;
      if (this[w2] === false && this.zstd !== false) {
        o2 = true;
        for (let a2 = 0;a2 < qi.length; a2++)
          if (t2[a2] !== qi[a2]) {
            o2 = false;
            break;
          }
      }
      let h3 = this.brotli === undefined && !o2;
      if (this[w2] === false && h3)
        if (t2.length < 512)
          if (this[ut2])
            this.brotli = true;
          else
            return this[p2] = t2, i?.(), true;
        else
          try {
            new F3(t2.subarray(0, 512)), this.brotli = false;
          } catch {
            this.brotli = true;
          }
      if (this[w2] === undefined || this[w2] === false && (this.brotli || o2)) {
        let a2 = this[ut2];
        this[ut2] = false, this[w2] = this[w2] === undefined ? new Ue2({}) : o2 ? new Ke2({}) : new Ge2({}), this[w2].on("data", (c3) => {
          this[Xs2](c3) && this[Xe2](c3);
        }), this[w2].on("error", (c3) => {
          this[$3] || this.abort(c3);
        }), this[w2].on("end", () => {
          this[ut2] = true, this[Xe2]();
        }), this[Yt2] = true, this[le2] += t2.length;
        let l3 = !!this[w2][a2 ? "end" : "write"](t2);
        return this[Yt2] = false, i?.(), l3;
      }
    }
    this[Yt2] = true, this[w2] ? (this[le2] += t2.length, this[w2].write(t2)) : this[Xe2](t2), this[Yt2] = false;
    let n = this[st2].length > 0 ? false : this[it] ? this[it].flowing : true;
    return !n && this[st2].length === 0 && this[it]?.once("drain", () => this.emit("drain")), i?.(), n;
  }
  [Vi](t2) {
    t2 && !this[$3] && (this[p2] = this[p2] ? Buffer.concat([this[p2], t2]) : t2);
  }
  [Qe2]() {
    if (this[ut2] && !this[Yi] && !this[$3] && !this[ae2]) {
      this[Yi] = true;
      let t2 = this[Nt2];
      if (t2?.blockRemain) {
        let e = this[p2] ? this[p2].length : 0;
        this.warn("TAR_BAD_ARCHIVE", `Truncated input (needed ${t2.blockRemain} more bytes, only ${e} available)`, { entry: t2 }), this[p2] && t2.write(this[p2]), t2.end();
      }
      this[At2](Je2);
    }
  }
  [Xe2](t2) {
    if (this[ae2] && t2)
      this[Vi](t2);
    else if (!t2 && !this[p2])
      this[Qe2]();
    else if (t2) {
      if (this[ae2] = true, this[p2]) {
        this[Vi](t2);
        let e = this[p2];
        this[p2] = undefined, this[qe](e);
      } else
        this[qe](t2);
      for (;this[p2] && this[p2]?.length >= 512 && !this[$3] && !this[ti]; ) {
        let e = this[p2];
        this[p2] = undefined, this[qe](e);
      }
      this[ae2] = false;
    }
    (!this[p2] || this[ut2]) && this[Qe2]();
  }
  [qe](t2) {
    let e = 0, i = t2.length;
    for (;e + 512 <= i && !this[$3] && !this[ti]; )
      switch (this[B3]) {
        case "begin":
        case "header":
          this[Vs2](t2, e), e += 512;
          break;
        case "ignore":
        case "body":
          e += this[Ki](t2, e);
          break;
        case "meta":
          e += this[Ks2](t2, e);
          break;
        default:
          throw new Error("invalid state: " + this[B3]);
      }
    e < i && (this[p2] = this[p2] ? Buffer.concat([t2.subarray(e), this[p2]]) : t2.subarray(e));
  }
  end(t2, e, i) {
    return typeof t2 == "function" && (i = t2, e = undefined, t2 = undefined), typeof e == "function" && (i = e, e = undefined), typeof t2 == "string" && (t2 = Buffer.from(t2, e)), i && this.once("finish", i), this[$3] || (this[w2] ? (t2 && (this[le2] += t2.length, this[w2].write(t2)), this[w2].end()) : (this[ut2] = true, (this.brotli === undefined || this.zstd === undefined) && (t2 = t2 || Buffer.alloc(0)), t2 && this.write(t2), this[Qe2]())), this;
  }
};
var mt2 = (s2) => {
  let t2 = s2.length - 1, e = -1;
  for (;t2 > -1 && s2.charAt(t2) === "/"; )
    e = t2, t2--;
  return e === -1 ? s2 : s2.slice(0, e);
};
var vn2 = (s2) => {
  let t2 = s2.onReadEntry;
  s2.onReadEntry = t2 ? (e) => {
    t2(e), e.resume();
  } : (e) => e.resume();
};
var Qi = (s2, t2) => {
  let e = new Map(t2.map((o2) => [mt2(o2), true])), i = s2.filter, r3 = 100, n = (o2, h3 = "", a2 = 0) => {
    if (a2 >= r3)
      return e.set(o2, false), false;
    let l3 = h3 || kn2(o2).root || ".", c3;
    if (o2 === l3)
      c3 = false;
    else {
      let d2 = e.get(o2);
      c3 = d2 !== undefined ? d2 : n(Fn2(o2), l3, a2 + 1);
    }
    return e.set(o2, c3), c3;
  };
  s2.filter = i ? (o2, h3) => i(o2, h3) && n(mt2(o2)) : (o2) => n(mt2(o2));
};
var Mn2 = (s2) => {
  let t2 = new rt(s2), e = s2.file, i;
  try {
    i = Kt2.openSync(e, "r");
    let r3 = Kt2.fstatSync(i), n = s2.maxReadSize || 16 * 1024 * 1024;
    if (r3.size < n) {
      let o2 = Buffer.allocUnsafe(r3.size), h3 = Kt2.readSync(i, o2, 0, r3.size, 0);
      t2.end(h3 === o2.byteLength ? o2 : o2.subarray(0, h3));
    } else {
      let o2 = 0, h3 = Buffer.allocUnsafe(n);
      for (;o2 < r3.size; ) {
        let a2 = Kt2.readSync(i, h3, 0, n, o2);
        if (a2 === 0)
          break;
        o2 += a2, t2.write(h3.subarray(0, a2));
      }
      t2.end();
    }
  } finally {
    if (typeof i == "number")
      try {
        Kt2.closeSync(i);
      } catch {}
  }
};
var Bn2 = (s2, t2) => {
  let e = new rt(s2), i = s2.maxReadSize || 16 * 1024 * 1024, r3 = s2.file;
  return new Promise((o2, h3) => {
    e.on("error", h3), e.on("end", o2), Kt2.stat(r3, (a2, l3) => {
      if (a2)
        h3(a2);
      else {
        let c3 = new _t2(r3, { readSize: i, size: l3.size });
        c3.on("error", h3), c3.pipe(e);
      }
    });
  });
};
var Ct2 = K3(Mn2, Bn2, (s2) => new rt(s2), (s2) => new rt(s2), (s2, t2) => {
  t2?.length && Qi(s2, t2), s2.noResume || vn2(s2);
});
var Ji = (s2, t2, e) => (s2 &= 4095, e && (s2 = (s2 | 384) & -19), t2 && (s2 & 256 && (s2 |= 64), s2 & 32 && (s2 |= 8), s2 & 4 && (s2 |= 1)), s2);
var { isAbsolute: zn2, parse: qs2 } = Pn2;
var ce2 = (s2) => {
  let t2 = "", e = qs2(s2);
  for (;zn2(s2) || e.root; ) {
    let i = s2.charAt(0) === "/" && s2.slice(0, 4) !== "//?/" ? "/" : e.root;
    s2 = s2.slice(i.length), t2 += i, e = qs2(s2);
  }
  return [t2, s2];
};
var ei = ["|", "<", ">", "?", ":"];
var ji = ei.map((s2) => String.fromCodePoint(61440 + Number(s2.codePointAt(0))));
var Un2 = new Map(ei.map((s2, t2) => [s2, ji[t2]]));
var Hn2 = new Map(ji.map((s2, t2) => [s2, ei[t2]]));
var ts2 = (s2) => ei.reduce((t2, e) => t2.split(e).join(Un2.get(e)), s2);
var Qs2 = (s2) => ji.reduce((t2, e) => t2.split(e).join(Hn2.get(e)), s2);
var rr2 = (s2, t2) => t2 ? (s2 = f3(s2).replace(/^\.(\/|$)/, ""), mt2(t2) + "/" + s2) : f3(s2);
var Wn2 = 16 * 1024 * 1024;
var tr2 = Symbol("process");
var er2 = Symbol("file");
var ir2 = Symbol("directory");
var is2 = Symbol("symlink");
var sr2 = Symbol("hardlink");
var fe2 = Symbol("header");
var ii = Symbol("read");
var ss2 = Symbol("lstat");
var si = Symbol("onlstat");
var rs2 = Symbol("onread");
var ns2 = Symbol("onreadlink");
var os3 = Symbol("openfile");
var hs2 = Symbol("onopenfile");
var pt2 = Symbol("close");
var ri = Symbol("mode");
var as2 = Symbol("awaitDrain");
var es2 = Symbol("ondrain");
var q3 = Symbol("prefix");
var de2 = class extends A3 {
  path;
  portable;
  myuid = process.getuid && process.getuid() || 0;
  myuser = process.env.USER || "";
  maxReadSize;
  linkCache;
  statCache;
  preservePaths;
  cwd;
  strict;
  mtime;
  noPax;
  noMtime;
  prefix;
  fd;
  blockLen = 0;
  blockRemain = 0;
  buf;
  pos = 0;
  remain = 0;
  length = 0;
  offset = 0;
  win32;
  absolute;
  header;
  type;
  linkpath;
  stat;
  onWriteEntry;
  #t = false;
  constructor(t2, e = {}) {
    let i = se2(e);
    super(), this.path = f3(t2), this.portable = !!i.portable, this.maxReadSize = i.maxReadSize || Wn2, this.linkCache = i.linkCache || new Map, this.statCache = i.statCache || new Map, this.preservePaths = !!i.preservePaths, this.cwd = f3(i.cwd || process.cwd()), this.strict = !!i.strict, this.noPax = !!i.noPax, this.noMtime = !!i.noMtime, this.mtime = i.mtime, this.prefix = i.prefix ? f3(i.prefix) : undefined, this.onWriteEntry = i.onWriteEntry, typeof i.onwarn == "function" && this.on("warn", i.onwarn);
    let r3 = false;
    if (!this.preservePaths) {
      let [o2, h3] = ce2(this.path);
      o2 && typeof h3 == "string" && (this.path = h3, r3 = o2);
    }
    this.win32 = !!i.win32 || process.platform === "win32", this.win32 && (this.path = Qs2(this.path.replaceAll(/\\/g, "/")), t2 = t2.replaceAll(/\\/g, "/")), this.absolute = f3(i.absolute || js2.resolve(this.cwd, t2)), this.path === "" && (this.path = "./"), r3 && this.warn("TAR_ENTRY_INFO", `stripping ${r3} from absolute path`, { entry: this, path: r3 + this.path });
    let n = this.statCache.get(this.absolute);
    n ? this[si](n) : this[ss2]();
  }
  warn(t2, e, i = {}) {
    return Dt2(this, t2, e, i);
  }
  emit(t2, ...e) {
    return t2 === "error" && (this.#t = true), super.emit(t2, ...e);
  }
  [ss2]() {
    X3.lstat(this.absolute, (t2, e) => {
      if (t2)
        return this.emit("error", t2);
      this[si](e);
    });
  }
  [si](t2) {
    this.statCache.set(this.absolute, t2), this.stat = t2, t2.isFile() || (t2.size = 0), this.type = Gn2(t2), this.emit("stat", t2), this[tr2]();
  }
  [tr2]() {
    switch (this.type) {
      case "File":
        return this[er2]();
      case "Directory":
        return this[ir2]();
      case "SymbolicLink":
        return this[is2]();
      default:
        return this.end();
    }
  }
  [ri](t2) {
    return Ji(t2, this.type === "Directory", this.portable);
  }
  [q3](t2) {
    return rr2(t2, this.prefix);
  }
  [fe2]() {
    if (!this.stat)
      throw new Error("cannot write header before stat");
    this.type === "Directory" && this.portable && (this.noMtime = true), this.onWriteEntry?.(this), this.header = new F3({ path: this[q3](this.path), linkpath: this.type === "Link" && this.linkpath !== undefined ? this[q3](this.linkpath) : this.linkpath, mode: this[ri](this.stat.mode), uid: this.portable ? undefined : this.stat.uid, gid: this.portable ? undefined : this.stat.gid, size: this.stat.size, mtime: this.noMtime ? undefined : this.mtime || this.stat.mtime, type: this.type === "Unsupported" ? undefined : this.type, uname: this.portable ? undefined : this.stat.uid === this.myuid ? this.myuser : "", atime: this.portable ? undefined : this.stat.atime, ctime: this.portable ? undefined : this.stat.ctime }), this.header.encode() && !this.noPax && super.write(new ft2({ atime: this.portable ? undefined : this.header.atime, ctime: this.portable ? undefined : this.header.ctime, gid: this.portable ? undefined : this.header.gid, mtime: this.noMtime ? undefined : this.mtime || this.header.mtime, path: this[q3](this.path), linkpath: this.type === "Link" && this.linkpath !== undefined ? this[q3](this.linkpath) : this.linkpath, size: this.header.size, uid: this.portable ? undefined : this.header.uid, uname: this.portable ? undefined : this.header.uname, dev: this.portable ? undefined : this.stat.dev, ino: this.portable ? undefined : this.stat.ino, nlink: this.portable ? undefined : this.stat.nlink }).encode());
    let t2 = this.header?.block;
    if (!t2)
      throw new Error("failed to encode header");
    super.write(t2);
  }
  [ir2]() {
    if (!this.stat)
      throw new Error("cannot create directory entry without stat");
    this.path.slice(-1) !== "/" && (this.path += "/"), this.stat.size = 0, this[fe2](), this.end();
  }
  [is2]() {
    X3.readlink(this.absolute, (t2, e) => {
      if (t2)
        return this.emit("error", t2);
      this[ns2](e);
    });
  }
  [ns2](t2) {
    this.linkpath = f3(t2), this[fe2](), this.end();
  }
  [sr2](t2) {
    if (!this.stat)
      throw new Error("cannot create link entry without stat");
    this.type = "Link", this.linkpath = f3(js2.relative(this.cwd, t2)), this.stat.size = 0, this[fe2](), this.end();
  }
  [er2]() {
    if (!this.stat)
      throw new Error("cannot create file entry without stat");
    if (this.stat.nlink > 1) {
      let t2 = `${this.stat.dev}:${this.stat.ino}`, e = this.linkCache.get(t2);
      if (e?.indexOf(this.cwd) === 0)
        return this[sr2](e);
      this.linkCache.set(t2, this.absolute);
    }
    if (this[fe2](), this.stat.size === 0)
      return this.end();
    this[os3]();
  }
  [os3]() {
    X3.open(this.absolute, "r", (t2, e) => {
      if (t2)
        return this.emit("error", t2);
      this[hs2](e);
    });
  }
  [hs2](t2) {
    if (this.fd = t2, this.#t)
      return this[pt2]();
    if (!this.stat)
      throw new Error("should stat before calling onopenfile");
    this.blockLen = 512 * Math.ceil(this.stat.size / 512), this.blockRemain = this.blockLen;
    let e = Math.min(this.blockLen, this.maxReadSize);
    this.buf = Buffer.allocUnsafe(e), this.offset = 0, this.pos = 0, this.remain = this.stat.size, this.length = this.buf.length, this[ii]();
  }
  [ii]() {
    let { fd: t2, buf: e, offset: i, length: r3, pos: n } = this;
    if (t2 === undefined || e === undefined)
      throw new Error("cannot read file without first opening");
    X3.read(t2, e, i, r3, n, (o2, h3) => {
      if (o2)
        return this[pt2](() => this.emit("error", o2));
      this[rs2](h3);
    });
  }
  [pt2](t2 = () => {}) {
    this.fd !== undefined && X3.close(this.fd, t2);
  }
  [rs2](t2) {
    if (t2 <= 0 && this.remain > 0) {
      let r3 = Object.assign(new Error("encountered unexpected EOF"), { path: this.absolute, syscall: "read", code: "EOF" });
      return this[pt2](() => this.emit("error", r3));
    }
    if (t2 > this.remain) {
      let r3 = Object.assign(new Error("did not encounter expected EOF"), { path: this.absolute, syscall: "read", code: "EOF" });
      return this[pt2](() => this.emit("error", r3));
    }
    if (!this.buf)
      throw new Error("should have created buffer prior to reading");
    if (t2 === this.remain)
      for (let r3 = t2;r3 < this.length && t2 < this.blockRemain; r3++)
        this.buf[r3 + this.offset] = 0, t2++, this.remain++;
    let e = this.offset === 0 && t2 === this.buf.length ? this.buf : this.buf.subarray(this.offset, this.offset + t2);
    this.write(e) ? this[es2]() : this[as2](() => this[es2]());
  }
  [as2](t2) {
    this.once("drain", t2);
  }
  write(t2, e, i) {
    if (typeof e == "function" && (i = e, e = undefined), typeof t2 == "string" && (t2 = Buffer.from(t2, typeof e == "string" ? e : "utf8")), this.blockRemain < t2.length) {
      let r3 = Object.assign(new Error("writing more data than expected"), { path: this.absolute });
      return this.emit("error", r3);
    }
    return this.remain -= t2.length, this.blockRemain -= t2.length, this.pos += t2.length, this.offset += t2.length, super.write(t2, null, i);
  }
  [es2]() {
    if (!this.remain)
      return this.blockRemain && super.write(Buffer.alloc(this.blockRemain)), this[pt2]((t2) => t2 ? this.emit("error", t2) : this.end());
    if (!this.buf)
      throw new Error("buffer lost somehow in ONDRAIN");
    this.offset >= this.length && (this.buf = Buffer.allocUnsafe(Math.min(this.blockRemain, this.buf.length)), this.offset = 0), this.length = this.buf.length - this.offset, this[ii]();
  }
};
var ni = class extends de2 {
  sync = true;
  [ss2]() {
    this[si](X3.lstatSync(this.absolute));
  }
  [is2]() {
    this[ns2](X3.readlinkSync(this.absolute));
  }
  [os3]() {
    this[hs2](X3.openSync(this.absolute, "r"));
  }
  [ii]() {
    let t2 = true;
    try {
      let { fd: e, buf: i, offset: r3, length: n, pos: o2 } = this;
      if (e === undefined || i === undefined)
        throw new Error("fd and buf must be set in READ method");
      let h3 = X3.readSync(e, i, r3, n, o2);
      this[rs2](h3), t2 = false;
    } finally {
      if (t2)
        try {
          this[pt2](() => {});
        } catch {}
    }
  }
  [as2](t2) {
    t2();
  }
  [pt2](t2 = () => {}) {
    this.fd !== undefined && X3.closeSync(this.fd), t2();
  }
};
var oi = class extends A3 {
  blockLen = 0;
  blockRemain = 0;
  buf = 0;
  pos = 0;
  remain = 0;
  length = 0;
  preservePaths;
  portable;
  strict;
  noPax;
  noMtime;
  readEntry;
  type;
  prefix;
  path;
  mode;
  uid;
  gid;
  uname;
  gname;
  header;
  mtime;
  atime;
  ctime;
  linkpath;
  size;
  onWriteEntry;
  warn(t2, e, i = {}) {
    return Dt2(this, t2, e, i);
  }
  constructor(t2, e = {}) {
    let i = se2(e);
    super(), this.preservePaths = !!i.preservePaths, this.portable = !!i.portable, this.strict = !!i.strict, this.noPax = !!i.noPax, this.noMtime = !!i.noMtime, this.onWriteEntry = i.onWriteEntry, this.readEntry = t2;
    let { type: r3 } = t2;
    if (r3 === "Unsupported")
      throw new Error("writing entry that should be ignored");
    this.type = r3, this.type === "Directory" && this.portable && (this.noMtime = true), this.prefix = i.prefix, this.path = f3(t2.path), this.mode = t2.mode !== undefined ? this[ri](t2.mode) : undefined, this.uid = this.portable ? undefined : t2.uid, this.gid = this.portable ? undefined : t2.gid, this.uname = this.portable ? undefined : t2.uname, this.gname = this.portable ? undefined : t2.gname, this.size = t2.size, this.mtime = this.noMtime ? undefined : i.mtime || t2.mtime, this.atime = this.portable ? undefined : t2.atime, this.ctime = this.portable ? undefined : t2.ctime, this.linkpath = t2.linkpath !== undefined ? f3(t2.linkpath) : undefined, typeof i.onwarn == "function" && this.on("warn", i.onwarn);
    let n = false;
    if (!this.preservePaths) {
      let [h3, a2] = ce2(this.path);
      h3 && typeof a2 == "string" && (this.path = a2, n = h3);
    }
    this.remain = t2.size, this.blockRemain = t2.startBlockSize, this.onWriteEntry?.(this), this.header = new F3({ path: this[q3](this.path), linkpath: this.type === "Link" && this.linkpath !== undefined ? this[q3](this.linkpath) : this.linkpath, mode: this.mode, uid: this.portable ? undefined : this.uid, gid: this.portable ? undefined : this.gid, size: this.size, mtime: this.noMtime ? undefined : this.mtime, type: this.type, uname: this.portable ? undefined : this.uname, atime: this.portable ? undefined : this.atime, ctime: this.portable ? undefined : this.ctime }), n && this.warn("TAR_ENTRY_INFO", `stripping ${n} from absolute path`, { entry: this, path: n + this.path }), this.header.encode() && !this.noPax && super.write(new ft2({ atime: this.portable ? undefined : this.atime, ctime: this.portable ? undefined : this.ctime, gid: this.portable ? undefined : this.gid, mtime: this.noMtime ? undefined : this.mtime, path: this[q3](this.path), linkpath: this.type === "Link" && this.linkpath !== undefined ? this[q3](this.linkpath) : this.linkpath, size: this.size, uid: this.portable ? undefined : this.uid, uname: this.portable ? undefined : this.uname, dev: this.portable ? undefined : this.readEntry.dev, ino: this.portable ? undefined : this.readEntry.ino, nlink: this.portable ? undefined : this.readEntry.nlink }).encode());
    let o2 = this.header?.block;
    if (!o2)
      throw new Error("failed to encode header");
    super.write(o2), t2.pipe(this);
  }
  [q3](t2) {
    return rr2(t2, this.prefix);
  }
  [ri](t2) {
    return Ji(t2, this.type === "Directory", this.portable);
  }
  write(t2, e, i) {
    typeof e == "function" && (i = e, e = undefined), typeof t2 == "string" && (t2 = Buffer.from(t2, typeof e == "string" ? e : "utf8"));
    let r3 = t2.length;
    if (r3 > this.blockRemain)
      throw new Error("writing more to entry than is appropriate");
    return this.blockRemain -= r3, super.write(t2, i);
  }
  end(t2, e, i) {
    return this.blockRemain && super.write(Buffer.alloc(this.blockRemain)), typeof t2 == "function" && (i = t2, e = undefined, t2 = undefined), typeof e == "function" && (i = e, e = undefined), typeof t2 == "string" && (t2 = Buffer.from(t2, e ?? "utf8")), i && this.once("finish", i), t2 ? super.end(t2, i) : super.end(i), this;
  }
};
var Gn2 = (s2) => s2.isFile() ? "File" : s2.isDirectory() ? "Directory" : s2.isSymbolicLink() ? "SymbolicLink" : "Unsupported";
var hi = class s2 {
  tail;
  head;
  length = 0;
  static create(t2 = []) {
    return new s2(t2);
  }
  constructor(t2 = []) {
    for (let e of t2)
      this.push(e);
  }
  *[Symbol.iterator]() {
    for (let t2 = this.head;t2; t2 = t2.next)
      yield t2.value;
  }
  removeNode(t2) {
    if (t2.list !== this)
      throw new Error("removing node which does not belong to this list");
    let { next: e, prev: i } = t2;
    return e && (e.prev = i), i && (i.next = e), t2 === this.head && (this.head = e), t2 === this.tail && (this.tail = i), this.length--, t2.next = undefined, t2.prev = undefined, t2.list = undefined, e;
  }
  unshiftNode(t2) {
    if (t2 === this.head)
      return;
    t2.list && t2.list.removeNode(t2);
    let e = this.head;
    t2.list = this, t2.next = e, e && (e.prev = t2), this.head = t2, this.tail || (this.tail = t2), this.length++;
  }
  pushNode(t2) {
    if (t2 === this.tail)
      return;
    t2.list && t2.list.removeNode(t2);
    let e = this.tail;
    t2.list = this, t2.prev = e, e && (e.next = t2), this.tail = t2, this.head || (this.head = t2), this.length++;
  }
  push(...t2) {
    for (let e = 0, i = t2.length;e < i; e++)
      Yn2(this, t2[e]);
    return this.length;
  }
  unshift(...t2) {
    for (var e = 0, i = t2.length;e < i; e++)
      Kn2(this, t2[e]);
    return this.length;
  }
  pop() {
    if (!this.tail)
      return;
    let t2 = this.tail.value, e = this.tail;
    return this.tail = this.tail.prev, this.tail ? this.tail.next = undefined : this.head = undefined, e.list = undefined, this.length--, t2;
  }
  shift() {
    if (!this.head)
      return;
    let t2 = this.head.value, e = this.head;
    return this.head = this.head.next, this.head ? this.head.prev = undefined : this.tail = undefined, e.list = undefined, this.length--, t2;
  }
  forEach(t2, e) {
    e = e || this;
    for (let i = this.head, r3 = 0;i; r3++)
      t2.call(e, i.value, r3, this), i = i.next;
  }
  forEachReverse(t2, e) {
    e = e || this;
    for (let i = this.tail, r3 = this.length - 1;i; r3--)
      t2.call(e, i.value, r3, this), i = i.prev;
  }
  get(t2) {
    let e = 0, i = this.head;
    for (;i && e < t2; e++)
      i = i.next;
    if (e === t2 && i)
      return i.value;
  }
  getReverse(t2) {
    let e = 0, i = this.tail;
    for (;i && e < t2; e++)
      i = i.prev;
    if (e === t2 && i)
      return i.value;
  }
  map(t2, e) {
    e = e || this;
    let i = new s2;
    for (let r3 = this.head;r3; )
      i.push(t2.call(e, r3.value, this)), r3 = r3.next;
    return i;
  }
  mapReverse(t2, e) {
    e = e || this;
    var i = new s2;
    for (let r3 = this.tail;r3; )
      i.push(t2.call(e, r3.value, this)), r3 = r3.prev;
    return i;
  }
  reduce(t2, e) {
    let i, r3 = this.head;
    if (arguments.length > 1)
      i = e;
    else if (this.head)
      r3 = this.head.next, i = this.head.value;
    else
      throw new TypeError("Reduce of empty list with no initial value");
    for (var n = 0;r3; n++)
      i = t2(i, r3.value, n), r3 = r3.next;
    return i;
  }
  reduceReverse(t2, e) {
    let i, r3 = this.tail;
    if (arguments.length > 1)
      i = e;
    else if (this.tail)
      r3 = this.tail.prev, i = this.tail.value;
    else
      throw new TypeError("Reduce of empty list with no initial value");
    for (let n = this.length - 1;r3; n--)
      i = t2(i, r3.value, n), r3 = r3.prev;
    return i;
  }
  toArray() {
    let t2 = new Array(this.length);
    for (let e = 0, i = this.head;i; e++)
      t2[e] = i.value, i = i.next;
    return t2;
  }
  toArrayReverse() {
    let t2 = new Array(this.length);
    for (let e = 0, i = this.tail;i; e++)
      t2[e] = i.value, i = i.prev;
    return t2;
  }
  slice(t2 = 0, e = this.length) {
    e < 0 && (e += this.length), t2 < 0 && (t2 += this.length);
    let i = new s2;
    if (e < t2 || e < 0)
      return i;
    t2 < 0 && (t2 = 0), e > this.length && (e = this.length);
    let r3 = this.head, n = 0;
    for (n = 0;r3 && n < t2; n++)
      r3 = r3.next;
    for (;r3 && n < e; n++, r3 = r3.next)
      i.push(r3.value);
    return i;
  }
  sliceReverse(t2 = 0, e = this.length) {
    e < 0 && (e += this.length), t2 < 0 && (t2 += this.length);
    let i = new s2;
    if (e < t2 || e < 0)
      return i;
    t2 < 0 && (t2 = 0), e > this.length && (e = this.length);
    let r3 = this.length, n = this.tail;
    for (;n && r3 > e; r3--)
      n = n.prev;
    for (;n && r3 > t2; r3--, n = n.prev)
      i.push(n.value);
    return i;
  }
  splice(t2, e = 0, ...i) {
    t2 > this.length && (t2 = this.length - 1), t2 < 0 && (t2 = this.length + t2);
    let r3 = this.head;
    for (let o2 = 0;r3 && o2 < t2; o2++)
      r3 = r3.next;
    let n = [];
    for (let o2 = 0;r3 && o2 < e; o2++)
      n.push(r3.value), r3 = this.removeNode(r3);
    r3 ? r3 !== this.tail && (r3 = r3.prev) : r3 = this.tail;
    for (let o2 of i)
      r3 = Zn2(this, r3, o2);
    return n;
  }
  reverse() {
    let t2 = this.head, e = this.tail;
    for (let i = t2;i; i = i.prev) {
      let r3 = i.prev;
      i.prev = i.next, i.next = r3;
    }
    return this.head = e, this.tail = t2, this;
  }
};
function Zn2(s3, t2, e) {
  let i = t2, r3 = t2 ? t2.next : s3.head, n = new ue2(e, i, r3, s3);
  return n.next === undefined && (s3.tail = n), n.prev === undefined && (s3.head = n), s3.length++, n;
}
function Yn2(s3, t2) {
  s3.tail = new ue2(t2, s3.tail, undefined, s3), s3.head || (s3.head = s3.tail), s3.length++;
}
function Kn2(s3, t2) {
  s3.head = new ue2(t2, undefined, s3.head, s3), s3.tail || (s3.tail = s3.head), s3.length++;
}
var ue2 = class {
  list;
  next;
  prev;
  value;
  constructor(t2, e, i, r3) {
    this.list = r3, this.value = t2, e ? (e.next = this, this.prev = e) : this.prev = undefined, i ? (i.prev = this, this.next = i) : this.next = undefined;
  }
};
var pi = class {
  path;
  absolute;
  entry;
  stat;
  readdir;
  pending = false;
  pendingLink = false;
  ignore = false;
  piped = false;
  constructor(t2, e) {
    this.path = t2 || "./", this.absolute = e;
  }
};
var nr2 = Buffer.alloc(1024);
var li = Symbol("onStat");
var me2 = Symbol("ended");
var W3 = Symbol("queue");
var pe2 = Symbol("pendingLinks");
var Et2 = Symbol("current");
var Ft2 = Symbol("process");
var Ee = Symbol("processing");
var ai = Symbol("processJob");
var G3 = Symbol("jobs");
var ls2 = Symbol("jobDone");
var ci = Symbol("addFSEntry");
var or2 = Symbol("addTarEntry");
var ds2 = Symbol("stat");
var us2 = Symbol("readdir");
var fi = Symbol("onreaddir");
var di = Symbol("pipe");
var hr2 = Symbol("entry");
var cs2 = Symbol("entryOpt");
var ui = Symbol("writeEntryClass");
var lr2 = Symbol("write");
var fs2 = Symbol("ondrain");
var wt2 = class extends A3 {
  sync = false;
  opt;
  cwd;
  maxReadSize;
  preservePaths;
  strict;
  noPax;
  prefix;
  linkCache;
  statCache;
  file;
  portable;
  zip;
  readdirCache;
  noDirRecurse;
  follow;
  noMtime;
  mtime;
  filter;
  jobs;
  [ui];
  onWriteEntry;
  [W3];
  [pe2] = new Map;
  [G3] = 0;
  [Ee] = false;
  [me2] = false;
  constructor(t2 = {}) {
    if (super(), this.opt = t2, this.file = t2.file || "", this.cwd = t2.cwd || process.cwd(), this.maxReadSize = t2.maxReadSize, this.preservePaths = !!t2.preservePaths, this.strict = !!t2.strict, this.noPax = !!t2.noPax, this.prefix = f3(t2.prefix || ""), this.linkCache = t2.linkCache || new Map, this.statCache = t2.statCache || new Map, this.readdirCache = t2.readdirCache || new Map, this.onWriteEntry = t2.onWriteEntry, this[ui] = de2, typeof t2.onwarn == "function" && this.on("warn", t2.onwarn), this.portable = !!t2.portable, t2.gzip || t2.brotli || t2.zstd) {
      if ((t2.gzip ? 1 : 0) + (t2.brotli ? 1 : 0) + (t2.zstd ? 1 : 0) > 1)
        throw new TypeError("gzip, brotli, zstd are mutually exclusive");
      if (t2.gzip && (typeof t2.gzip != "object" && (t2.gzip = {}), this.portable && (t2.gzip.portable = true), this.zip = new ze2(t2.gzip)), t2.brotli && (typeof t2.brotli != "object" && (t2.brotli = {}), this.zip = new We2(t2.brotli)), t2.zstd && (typeof t2.zstd != "object" && (t2.zstd = {}), this.zip = new Ye2(t2.zstd)), !this.zip)
        throw new Error("impossible");
      let e = this.zip;
      e.on("data", (i) => super.write(i)), e.on("end", () => super.end()), e.on("drain", () => this[fs2]()), this.on("resume", () => e.resume());
    } else
      this.on("drain", this[fs2]);
    this.noDirRecurse = !!t2.noDirRecurse, this.follow = !!t2.follow, this.noMtime = !!t2.noMtime, t2.mtime && (this.mtime = t2.mtime), this.filter = typeof t2.filter == "function" ? t2.filter : () => true, this[W3] = new hi, this[G3] = 0, this.jobs = Number(t2.jobs) || 4, this[Ee] = false, this[me2] = false;
  }
  [lr2](t2) {
    return super.write(t2);
  }
  add(t2) {
    return this.write(t2), this;
  }
  end(t2, e, i) {
    return typeof t2 == "function" && (i = t2, t2 = undefined), typeof e == "function" && (i = e, e = undefined), t2 && this.add(t2), this[me2] = true, this[Ft2](), i && i(), this;
  }
  write(t2) {
    if (this[me2])
      throw new Error("write after end");
    return typeof t2 == "string" ? this[ci](t2) : this[or2](t2), this.flowing;
  }
  [or2](t2) {
    let e = f3(ar2.resolve(this.cwd, t2.path));
    if (!this.filter(t2.path, t2))
      t2.resume();
    else {
      let i = new pi(t2.path, e);
      i.entry = new oi(t2, this[cs2](i)), i.entry.on("end", () => this[ls2](i)), this[G3] += 1, this[W3].push(i);
    }
    this[Ft2]();
  }
  [ci](t2) {
    let e = f3(ar2.resolve(this.cwd, t2));
    this[W3].push(new pi(t2, e)), this[Ft2]();
  }
  [ds2](t2) {
    t2.pending = true, this[G3] += 1;
    let e = this.follow ? "stat" : "lstat";
    mi[e](t2.absolute, (i, r3) => {
      t2.pending = false, this[G3] -= 1, i ? this.emit("error", i) : this[li](t2, r3);
    });
  }
  [li](t2, e) {
    if (this.statCache.set(t2.absolute, e), t2.stat = e, !this.filter(t2.path, e))
      t2.ignore = true;
    else if (e.isFile() && e.nlink > 1 && !this.linkCache.get(`${e.dev}:${e.ino}`) && !this.sync)
      if (t2 === this[Et2])
        this[ai](t2);
      else {
        let i = `${e.dev}:${e.ino}`, r3 = this[pe2].get(i);
        r3 ? r3.push(t2) : this[pe2].set(i, [t2]), t2.pendingLink = true, t2.pending = true;
      }
    this[Ft2]();
  }
  [us2](t2) {
    t2.pending = true, this[G3] += 1, mi.readdir(t2.absolute, (e, i) => {
      if (t2.pending = false, this[G3] -= 1, e)
        return this.emit("error", e);
      this[fi](t2, i);
    });
  }
  [fi](t2, e) {
    this.readdirCache.set(t2.absolute, e), t2.readdir = e, this[Ft2]();
  }
  [Ft2]() {
    if (!this[Ee]) {
      this[Ee] = true;
      for (let t2 = this[W3].head;t2 && this[G3] < this.jobs; t2 = t2.next)
        if (this[ai](t2.value), t2.value.ignore) {
          let e = t2.next;
          this[W3].removeNode(t2), t2.next = e;
        }
      this[Ee] = false, this[me2] && this[W3].length === 0 && this[G3] === 0 && (this.zip ? this.zip.end(nr2) : (super.write(nr2), super.end()));
    }
  }
  get [Et2]() {
    return this[W3] && this[W3].head && this[W3].head.value;
  }
  [ls2](t2) {
    this[W3].shift(), this[G3] -= 1;
    let { stat: e } = t2;
    if (e && e.isFile() && e.nlink > 1) {
      let i = `${e.dev}:${e.ino}`, r3 = this[pe2].get(i);
      if (r3) {
        this[pe2].delete(i);
        for (let n of r3)
          n.pending = false, this[ai](n);
      }
    }
    this[Ft2]();
  }
  [ai](t2) {
    if (t2.pending && t2.pendingLink && t2 === this[Et2] && (t2.pending = false, t2.pendingLink = false), !t2.pending) {
      if (t2.entry) {
        t2 === this[Et2] && !t2.piped && this[di](t2);
        return;
      }
      if (!t2.stat) {
        let e = this.statCache.get(t2.absolute);
        e ? this[li](t2, e) : this[ds2](t2);
      }
      if (t2.stat && !t2.ignore) {
        if (!this.noDirRecurse && t2.stat.isDirectory() && !t2.readdir) {
          let e = this.readdirCache.get(t2.absolute);
          if (e ? this[fi](t2, e) : this[us2](t2), !t2.readdir)
            return;
        }
        if (t2.entry = this[hr2](t2), !t2.entry) {
          t2.ignore = true;
          return;
        }
        t2 === this[Et2] && !t2.piped && this[di](t2);
      }
    }
  }
  [cs2](t2) {
    return { onwarn: (e, i, r3) => this.warn(e, i, r3), noPax: this.noPax, cwd: this.cwd, absolute: t2.absolute, preservePaths: this.preservePaths, maxReadSize: this.maxReadSize, strict: this.strict, portable: this.portable, linkCache: this.linkCache, statCache: this.statCache, noMtime: this.noMtime, mtime: this.mtime, prefix: this.prefix, onWriteEntry: this.onWriteEntry };
  }
  [hr2](t2) {
    this[G3] += 1;
    try {
      return new this[ui](t2.path, this[cs2](t2)).on("end", () => this[ls2](t2)).on("error", (i) => this.emit("error", i));
    } catch (e) {
      this.emit("error", e);
    }
  }
  [fs2]() {
    this[Et2] && this[Et2].entry && this[Et2].entry.resume();
  }
  [di](t2) {
    t2.piped = true, t2.readdir && t2.readdir.forEach((r3) => {
      let n = t2.path, o2 = n === "./" ? "" : n.replace(/\/*$/, "/");
      this[ci](o2 + r3);
    });
    let e = t2.entry, i = this.zip;
    if (!e)
      throw new Error("cannot pipe without source");
    i ? e.on("data", (r3) => {
      i.write(r3) || e.pause();
    }) : e.on("data", (r3) => {
      super.write(r3) || e.pause();
    });
  }
  pause() {
    return this.zip && this.zip.pause(), super.pause();
  }
  warn(t2, e, i = {}) {
    Dt2(this, t2, e, i);
  }
};
var kt2 = class extends wt2 {
  sync = true;
  constructor(t2) {
    super(t2), this[ui] = ni;
  }
  pause() {}
  resume() {}
  [ds2](t2) {
    let e = this.follow ? "statSync" : "lstatSync";
    this[li](t2, mi[e](t2.absolute));
  }
  [us2](t2) {
    this[fi](t2, mi.readdirSync(t2.absolute));
  }
  [di](t2) {
    let e = t2.entry, i = this.zip;
    if (t2.readdir && t2.readdir.forEach((r3) => {
      let n = t2.path, o2 = n === "./" ? "" : n.replace(/\/*$/, "/");
      this[ci](o2 + r3);
    }), !e)
      throw new Error("Cannot pipe without source");
    i ? e.on("data", (r3) => {
      i.write(r3);
    }) : e.on("data", (r3) => {
      super[lr2](r3);
    });
  }
};
var Vn2 = (s3, t2) => {
  let e = new kt2(s3), i = new Wt2(s3.file, { mode: s3.mode || 438 });
  e.pipe(i), fr2(e, t2);
};
var $n2 = (s3, t2) => {
  let e = new wt2(s3), i = new et2(s3.file, { mode: s3.mode || 438 });
  e.pipe(i);
  let r3 = new Promise((n, o2) => {
    i.on("error", o2), i.on("close", n), e.on("error", o2);
  });
  return dr2(e, t2).catch((n) => e.emit("error", n)), r3;
};
var fr2 = (s3, t2) => {
  t2.forEach((e) => {
    e.charAt(0) === "@" ? Ct2({ file: cr2.resolve(s3.cwd, e.slice(1)), sync: true, noResume: true, onReadEntry: (i) => s3.add(i) }) : s3.add(e);
  }), s3.end();
};
var dr2 = async (s3, t2) => {
  for (let e of t2)
    e.charAt(0) === "@" ? await Ct2({ file: cr2.resolve(String(s3.cwd), e.slice(1)), noResume: true, onReadEntry: (i) => {
      s3.add(i);
    } }) : s3.add(e);
  s3.end();
};
var Xn2 = (s3, t2) => {
  let e = new kt2(s3);
  return fr2(e, t2), e;
};
var qn2 = (s3, t2) => {
  let e = new wt2(s3);
  return dr2(e, t2).catch((i) => e.emit("error", i)), e;
};
var Qn2 = K3(Vn2, $n2, Xn2, qn2, (s3, t2) => {
  if (!t2?.length)
    throw new TypeError("no paths specified to add to archive");
});
var Jn2 = process.env.__FAKE_PLATFORM__ || process.platform;
var Er2 = Jn2 === "win32";
var { O_CREAT: wr2, O_NOFOLLOW: ur2, O_TRUNC: Sr2, O_WRONLY: yr2 } = pr2.constants;
var Rr2 = Number(process.env.__FAKE_FS_O_FILENAME__) || pr2.constants.UV_FS_O_FILEMAP || 0;
var jn2 = Er2 && !!Rr2;
var to2 = 512 * 1024;
var eo2 = Rr2 | Sr2 | wr2 | yr2;
var mr2 = !Er2 && typeof ur2 == "number" ? ur2 | Sr2 | wr2 | yr2 : null;
var ms2 = mr2 !== null ? () => mr2 : jn2 ? (s3) => s3 < to2 ? eo2 : "w" : () => "w";
var ps2 = (s3, t2, e) => {
  try {
    return wi.lchownSync(s3, t2, e);
  } catch (i) {
    if (i?.code !== "ENOENT")
      throw i;
  }
};
var Ei = (s3, t2, e, i) => {
  wi.lchown(s3, t2, e, (r3) => {
    i(r3 && r3?.code !== "ENOENT" ? r3 : null);
  });
};
var io2 = (s3, t2, e, i, r3) => {
  if (t2.isDirectory())
    Es2(we2.resolve(s3, t2.name), e, i, (n) => {
      if (n)
        return r3(n);
      let o2 = we2.resolve(s3, t2.name);
      Ei(o2, e, i, r3);
    });
  else {
    let n = we2.resolve(s3, t2.name);
    Ei(n, e, i, r3);
  }
};
var Es2 = (s3, t2, e, i) => {
  wi.readdir(s3, { withFileTypes: true }, (r3, n) => {
    if (r3) {
      if (r3.code === "ENOENT")
        return i();
      if (r3.code !== "ENOTDIR" && r3.code !== "ENOTSUP")
        return i(r3);
    }
    if (r3 || !n.length)
      return Ei(s3, t2, e, i);
    let o2 = n.length, h3 = null, a2 = (l3) => {
      if (!h3) {
        if (l3)
          return i(h3 = l3);
        if (--o2 === 0)
          return Ei(s3, t2, e, i);
      }
    };
    for (let l3 of n)
      io2(s3, l3, t2, e, a2);
  });
};
var so2 = (s3, t2, e, i) => {
  t2.isDirectory() && ws2(we2.resolve(s3, t2.name), e, i), ps2(we2.resolve(s3, t2.name), e, i);
};
var ws2 = (s3, t2, e) => {
  let i;
  try {
    i = wi.readdirSync(s3, { withFileTypes: true });
  } catch (r3) {
    let n = r3;
    if (n?.code === "ENOENT")
      return;
    if (n?.code === "ENOTDIR" || n?.code === "ENOTSUP")
      return ps2(s3, t2, e);
    throw n;
  }
  for (let r3 of i)
    so2(s3, r3, t2, e);
  return ps2(s3, t2, e);
};
var Se = class extends Error {
  path;
  code;
  syscall = "chdir";
  constructor(t2, e) {
    super(`${e}: Cannot cd into '${t2}'`), this.path = t2, this.code = e;
  }
  get name() {
    return "CwdError";
  }
};
var St2 = class extends Error {
  path;
  symlink;
  syscall = "symlink";
  code = "TAR_SYMLINK_ERROR";
  constructor(t2, e) {
    super("TAR_SYMLINK_ERROR: Cannot extract through symbolic link"), this.symlink = t2, this.path = e;
  }
  get name() {
    return "SymlinkError";
  }
};
var no2 = (s3, t2) => {
  k2.stat(s3, (e, i) => {
    (e || !i.isDirectory()) && (e = new Se(s3, e?.code || "ENOTDIR")), t2(e);
  });
};
var gr2 = (s3, t2, e) => {
  s3 = f3(s3);
  let i = t2.umask ?? 18, r3 = t2.mode | 448, n = (r3 & i) !== 0, o2 = t2.uid, h3 = t2.gid, a2 = typeof o2 == "number" && typeof h3 == "number" && (o2 !== t2.processUid || h3 !== t2.processGid), l3 = t2.preserve, c3 = t2.unlink, d2 = f3(t2.cwd), y2 = (E3, x3) => {
    E3 ? e(E3) : x3 && a2 ? Es2(x3, o2, h3, (Le2) => y2(Le2)) : n ? k2.chmod(s3, r3, e) : e();
  };
  if (s3 === d2)
    return no2(s3, y2);
  if (l3)
    return ro2.mkdir(s3, { mode: r3, recursive: true }).then((E3) => y2(null, E3 ?? undefined), y2);
  let D2 = f3(Si.relative(d2, s3)).split("/");
  Ss2(d2, D2, r3, c3, d2, undefined, y2);
};
var Ss2 = (s3, t2, e, i, r3, n, o2) => {
  if (t2.length === 0)
    return o2(null, n);
  let h3 = t2.shift(), a2 = f3(Si.resolve(s3 + "/" + h3));
  k2.mkdir(a2, e, br2(a2, t2, e, i, r3, n, o2));
};
var br2 = (s3, t2, e, i, r3, n, o2) => (h3) => {
  h3 ? k2.lstat(s3, (a2, l3) => {
    if (a2)
      a2.path = a2.path && f3(a2.path), o2(a2);
    else if (l3.isDirectory())
      Ss2(s3, t2, e, i, r3, n, o2);
    else if (i)
      k2.unlink(s3, (c3) => {
        if (c3)
          return o2(c3);
        k2.mkdir(s3, e, br2(s3, t2, e, i, r3, n, o2));
      });
    else {
      if (l3.isSymbolicLink())
        return o2(new St2(s3, s3 + "/" + t2.join("/")));
      o2(h3);
    }
  }) : (n = n || s3, Ss2(s3, t2, e, i, r3, n, o2));
};
var oo2 = (s3) => {
  let t2 = false, e;
  try {
    t2 = k2.statSync(s3).isDirectory();
  } catch (i) {
    e = i?.code;
  } finally {
    if (!t2)
      throw new Se(s3, e ?? "ENOTDIR");
  }
};
var _r = (s3, t2) => {
  s3 = f3(s3);
  let e = t2.umask ?? 18, i = t2.mode | 448, r3 = (i & e) !== 0, n = t2.uid, o2 = t2.gid, h3 = typeof n == "number" && typeof o2 == "number" && (n !== t2.processUid || o2 !== t2.processGid), a2 = t2.preserve, l3 = t2.unlink, c3 = f3(t2.cwd), d2 = (E3) => {
    E3 && h3 && ws2(E3, n, o2), r3 && k2.chmodSync(s3, i);
  };
  if (s3 === c3)
    return oo2(c3), d2();
  if (a2)
    return d2(k2.mkdirSync(s3, { mode: i, recursive: true }) ?? undefined);
  let T2 = f3(Si.relative(c3, s3)).split("/"), D2;
  for (let E3 = T2.shift(), x3 = c3;E3 && (x3 += "/" + E3); E3 = T2.shift()) {
    x3 = f3(Si.resolve(x3));
    try {
      k2.mkdirSync(x3, i), D2 = D2 || x3;
    } catch {
      let Le2 = k2.lstatSync(x3);
      if (Le2.isDirectory())
        continue;
      if (l3) {
        k2.unlinkSync(x3), k2.mkdirSync(x3, i), D2 = D2 || x3;
        continue;
      } else if (Le2.isSymbolicLink())
        return new St2(x3, x3 + "/" + T2.join("/"));
    }
  }
  return d2(D2);
};
var ys2 = Object.create(null);
var Or2 = 1e4;
var Vt2 = new Set;
var Tr = (s3) => {
  Vt2.has(s3) ? Vt2.delete(s3) : ys2[s3] = s3.normalize("NFD").toLocaleLowerCase("en").toLocaleUpperCase("en"), Vt2.add(s3);
  let t2 = ys2[s3], e = Vt2.size - Or2;
  if (e > Or2 / 10) {
    for (let i of Vt2)
      if (Vt2.delete(i), delete ys2[i], --e <= 0)
        break;
  }
  return t2;
};
var ho = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform;
var ao2 = ho === "win32";
var lo = (s3) => s3.split("/").slice(0, -1).reduce((e, i) => {
  let r3 = e.at(-1);
  return r3 !== undefined && (i = xr2(r3, i)), e.push(i || "/"), e;
}, []);
var yi = class {
  #t = new Map;
  #i = new Map;
  #s = new Set;
  reserve(t2, e) {
    t2 = ao2 ? ["win32 parallelization disabled"] : t2.map((r3) => mt2(xr2(Tr(r3))));
    let i = new Set(t2.map((r3) => lo(r3)).reduce((r3, n) => r3.concat(n)));
    this.#i.set(e, { dirs: i, paths: t2 });
    for (let r3 of t2) {
      let n = this.#t.get(r3);
      n ? n.push(e) : this.#t.set(r3, [e]);
    }
    for (let r3 of i) {
      let n = this.#t.get(r3);
      if (!n)
        this.#t.set(r3, [new Set([e])]);
      else {
        let o2 = n.at(-1);
        o2 instanceof Set ? o2.add(e) : n.push(new Set([e]));
      }
    }
    return this.#r(e);
  }
  #n(t2) {
    let e = this.#i.get(t2);
    if (!e)
      throw new Error("function does not have any path reservations");
    return { paths: e.paths.map((i) => this.#t.get(i)), dirs: [...e.dirs].map((i) => this.#t.get(i)) };
  }
  check(t2) {
    let { paths: e, dirs: i } = this.#n(t2);
    return e.every((r3) => r3 && r3[0] === t2) && i.every((r3) => r3 && r3[0] instanceof Set && r3[0].has(t2));
  }
  #r(t2) {
    return this.#s.has(t2) || !this.check(t2) ? false : (this.#s.add(t2), t2(() => this.#e(t2)), true);
  }
  #e(t2) {
    if (!this.#s.has(t2))
      return false;
    let e = this.#i.get(t2);
    if (!e)
      throw new Error("invalid reservation");
    let { paths: i, dirs: r3 } = e, n = new Set;
    for (let o2 of i) {
      let h3 = this.#t.get(o2);
      if (!h3 || h3?.[0] !== t2)
        continue;
      let a2 = h3[1];
      if (!a2) {
        this.#t.delete(o2);
        continue;
      }
      if (h3.shift(), typeof a2 == "function")
        n.add(a2);
      else
        for (let l3 of a2)
          n.add(l3);
    }
    for (let o2 of r3) {
      let h3 = this.#t.get(o2), a2 = h3?.[0];
      if (!(!h3 || !(a2 instanceof Set)))
        if (a2.size === 1 && h3.length === 1) {
          this.#t.delete(o2);
          continue;
        } else if (a2.size === 1) {
          h3.shift();
          let l3 = h3[0];
          typeof l3 == "function" && n.add(l3);
        } else
          a2.delete(t2);
    }
    return this.#s.delete(t2), n.forEach((o2) => this.#r(o2)), true;
  }
};
var Lr2 = () => process.umask();
var Dr2 = Symbol("onEntry");
var _s2 = Symbol("checkFs");
var Nr2 = Symbol("checkFs2");
var Os2 = Symbol("isReusable");
var P2 = Symbol("makeFs");
var Ts2 = Symbol("file");
var xs2 = Symbol("directory");
var gi = Symbol("link");
var Ar2 = Symbol("symlink");
var Ir2 = Symbol("hardlink");
var Re = Symbol("ensureNoSymlink");
var Cr2 = Symbol("unsupported");
var Fr2 = Symbol("checkPath");
var Rs2 = Symbol("stripAbsolutePath");
var yt = Symbol("mkdir");
var O3 = Symbol("onError");
var Ri = Symbol("pending");
var kr = Symbol("pend");
var $t2 = Symbol("unpend");
var gs2 = Symbol("ended");
var bs2 = Symbol("maybeClose");
var Ls2 = Symbol("skip");
var ge2 = Symbol("doChown");
var be2 = Symbol("uid");
var _e = Symbol("gid");
var Oe = Symbol("checkedCwd");
var fo = process.env.TESTING_TAR_FAKE_PLATFORM || process.platform;
var Te = fo === "win32";
var uo2 = 1024;
var mo = (s3, t2) => {
  if (!Te)
    return u2.unlink(s3, t2);
  let e = s3 + ".DELETE." + Mr2(16).toString("hex");
  u2.rename(s3, e, (i) => {
    if (i)
      return t2(i);
    u2.unlink(e, t2);
  });
};
var po = (s3) => {
  if (!Te)
    return u2.unlinkSync(s3);
  let t2 = s3 + ".DELETE." + Mr2(16).toString("hex");
  u2.renameSync(s3, t2), u2.unlinkSync(t2);
};
var vr2 = (s3, t2, e) => s3 !== undefined && s3 === s3 >>> 0 ? s3 : t2 !== undefined && t2 === t2 >>> 0 ? t2 : e;
var Xt2 = class extends rt {
  [gs2] = false;
  [Oe] = false;
  [Ri] = 0;
  reservations = new yi;
  transform;
  writable = true;
  readable = false;
  uid;
  gid;
  setOwner;
  preserveOwner;
  processGid;
  processUid;
  maxDepth;
  forceChown;
  win32;
  newer;
  keep;
  noMtime;
  preservePaths;
  unlink;
  cwd;
  strip;
  processUmask;
  umask;
  dmode;
  fmode;
  chmod;
  constructor(t2 = {}) {
    if (t2.ondone = () => {
      this[gs2] = true, this[bs2]();
    }, super(t2), this.transform = t2.transform, this.chmod = !!t2.chmod, typeof t2.uid == "number" || typeof t2.gid == "number") {
      if (typeof t2.uid != "number" || typeof t2.gid != "number")
        throw new TypeError("cannot set owner without number uid and gid");
      if (t2.preserveOwner)
        throw new TypeError("cannot preserve owner in archive and also set owner explicitly");
      this.uid = t2.uid, this.gid = t2.gid, this.setOwner = true;
    } else
      this.uid = undefined, this.gid = undefined, this.setOwner = false;
    this.preserveOwner = t2.preserveOwner === undefined && typeof t2.uid != "number" ? process.getuid?.() === 0 : !!t2.preserveOwner, this.processUid = (this.preserveOwner || this.setOwner) && process.getuid ? process.getuid() : undefined, this.processGid = (this.preserveOwner || this.setOwner) && process.getgid ? process.getgid() : undefined, this.maxDepth = typeof t2.maxDepth == "number" ? t2.maxDepth : uo2, this.forceChown = t2.forceChown === true, this.win32 = !!t2.win32 || Te, this.newer = !!t2.newer, this.keep = !!t2.keep, this.noMtime = !!t2.noMtime, this.preservePaths = !!t2.preservePaths, this.unlink = !!t2.unlink, this.cwd = f3(R4.resolve(t2.cwd || process.cwd())), this.strip = Number(t2.strip) || 0, this.processUmask = this.chmod ? typeof t2.processUmask == "number" ? t2.processUmask : Lr2() : 0, this.umask = typeof t2.umask == "number" ? t2.umask : this.processUmask, this.dmode = t2.dmode || 511 & ~this.umask, this.fmode = t2.fmode || 438 & ~this.umask, this.on("entry", (e) => this[Dr2](e));
  }
  warn(t2, e, i = {}) {
    return (t2 === "TAR_BAD_ARCHIVE" || t2 === "TAR_ABORT") && (i.recoverable = false), super.warn(t2, e, i);
  }
  [bs2]() {
    this[gs2] && this[Ri] === 0 && (this.emit("prefinish"), this.emit("finish"), this.emit("end"));
  }
  [Rs2](t2, e) {
    let i = t2[e], { type: r3 } = t2;
    if (!i || this.preservePaths)
      return true;
    let [n, o2] = ce2(i), h3 = o2.replaceAll(/\\/g, "/").split("/");
    if (h3.includes("..") || Te && /^[a-z]:\.\.$/i.test(h3[0] ?? "")) {
      if (e === "path" || r3 === "Link")
        return this.warn("TAR_ENTRY_ERROR", `${e} contains '..'`, { entry: t2, [e]: i }), false;
      let a2 = R4.posix.dirname(t2.path), l3 = R4.posix.normalize(R4.posix.join(a2, h3.join("/")));
      if (l3.startsWith("../") || l3 === "..")
        return this.warn("TAR_ENTRY_ERROR", `${e} escapes extraction directory`, { entry: t2, [e]: i }), false;
    }
    return n && (t2[e] = String(o2), this.warn("TAR_ENTRY_INFO", `stripping ${n} from absolute ${e}`, { entry: t2, [e]: i })), true;
  }
  [Fr2](t2) {
    let e = f3(t2.path), i = e.split("/");
    if (this.strip) {
      if (i.length < this.strip)
        return false;
      if (t2.type === "Link") {
        let r3 = f3(String(t2.linkpath)).split("/");
        if (r3.length >= this.strip)
          t2.linkpath = r3.slice(this.strip).join("/");
        else
          return false;
      }
      i.splice(0, this.strip), t2.path = i.join("/");
    }
    if (isFinite(this.maxDepth) && i.length > this.maxDepth)
      return this.warn("TAR_ENTRY_ERROR", "path excessively deep", { entry: t2, path: e, depth: i.length, maxDepth: this.maxDepth }), false;
    if (!this[Rs2](t2, "path") || !this[Rs2](t2, "linkpath"))
      return false;
    if (t2.absolute = R4.isAbsolute(t2.path) ? f3(R4.resolve(t2.path)) : f3(R4.resolve(this.cwd, t2.path)), !this.preservePaths && typeof t2.absolute == "string" && t2.absolute.indexOf(this.cwd + "/") !== 0 && t2.absolute !== this.cwd)
      return this.warn("TAR_ENTRY_ERROR", "path escaped extraction target", { entry: t2, path: f3(t2.path), resolvedPath: t2.absolute, cwd: this.cwd }), false;
    if (t2.absolute === this.cwd && t2.type !== "Directory" && t2.type !== "GNUDumpDir")
      return false;
    if (this.win32) {
      let { root: r3 } = R4.win32.parse(String(t2.absolute));
      t2.absolute = r3 + ts2(String(t2.absolute).slice(r3.length));
      let { root: n } = R4.win32.parse(t2.path);
      t2.path = n + ts2(t2.path.slice(n.length));
    }
    return true;
  }
  [Dr2](t2) {
    if (!this[Fr2](t2))
      return t2.resume();
    switch (co.equal(typeof t2.absolute, "string"), t2.type) {
      case "Directory":
      case "GNUDumpDir":
        t2.mode && (t2.mode = t2.mode | 448);
      case "File":
      case "OldFile":
      case "ContiguousFile":
      case "Link":
      case "SymbolicLink":
        return this[_s2](t2);
      default:
        return this[Cr2](t2);
    }
  }
  [O3](t2, e) {
    t2.name === "CwdError" ? this.emit("error", t2) : (this.warn("TAR_ENTRY_ERROR", t2, { entry: e }), this[$t2](), e.resume());
  }
  [yt](t2, e, i) {
    gr2(f3(t2), { uid: this.uid, gid: this.gid, processUid: this.processUid, processGid: this.processGid, umask: this.processUmask, preserve: this.preservePaths, unlink: this.unlink, cwd: this.cwd, mode: e }, i);
  }
  [ge2](t2) {
    return this.forceChown || this.preserveOwner && (typeof t2.uid == "number" && t2.uid !== this.processUid || typeof t2.gid == "number" && t2.gid !== this.processGid) || typeof this.uid == "number" && this.uid !== this.processUid || typeof this.gid == "number" && this.gid !== this.processGid;
  }
  [be2](t2) {
    return vr2(this.uid, t2.uid, this.processUid);
  }
  [_e](t2) {
    return vr2(this.gid, t2.gid, this.processGid);
  }
  [Ts2](t2, e) {
    let i = typeof t2.mode == "number" ? t2.mode & 4095 : this.fmode, r3 = new et2(String(t2.absolute), { flags: ms2(t2.size), mode: i, autoClose: false });
    r3.on("error", (a2) => {
      r3.fd && u2.close(r3.fd, () => {}), r3.write = () => true, this[O3](a2, t2), e();
    });
    let n = 1, o2 = (a2) => {
      if (a2) {
        r3.fd && u2.close(r3.fd, () => {}), this[O3](a2, t2), e();
        return;
      }
      --n === 0 && r3.fd !== undefined && u2.close(r3.fd, (l3) => {
        l3 ? this[O3](l3, t2) : this[$t2](), e();
      });
    };
    r3.on("finish", () => {
      let a2 = String(t2.absolute), l3 = r3.fd;
      if (typeof l3 == "number" && t2.mtime && !this.noMtime) {
        n++;
        let c3 = t2.atime || new Date, d2 = t2.mtime;
        u2.futimes(l3, c3, d2, (y2) => y2 ? u2.utimes(a2, c3, d2, (T2) => o2(T2 && y2)) : o2());
      }
      if (typeof l3 == "number" && this[ge2](t2)) {
        n++;
        let c3 = this[be2](t2), d2 = this[_e](t2);
        typeof c3 == "number" && typeof d2 == "number" && u2.fchown(l3, c3, d2, (y2) => y2 ? u2.chown(a2, c3, d2, (T2) => o2(T2 && y2)) : o2());
      }
      o2();
    });
    let h3 = this.transform && this.transform(t2) || t2;
    h3 !== t2 && (h3.on("error", (a2) => {
      this[O3](a2, t2), e();
    }), t2.pipe(h3)), h3.pipe(r3);
  }
  [xs2](t2, e) {
    let i = typeof t2.mode == "number" ? t2.mode & 4095 : this.dmode;
    this[yt](String(t2.absolute), i, (r3) => {
      if (r3) {
        this[O3](r3, t2), e();
        return;
      }
      let n = 1, o2 = () => {
        --n === 0 && (e(), this[$t2](), t2.resume());
      };
      t2.mtime && !this.noMtime && (n++, u2.utimes(String(t2.absolute), t2.atime || new Date, t2.mtime, o2)), this[ge2](t2) && (n++, u2.chown(String(t2.absolute), Number(this[be2](t2)), Number(this[_e](t2)), o2)), o2();
    });
  }
  [Cr2](t2) {
    t2.unsupported = true, this.warn("TAR_ENTRY_UNSUPPORTED", `unsupported entry type: ${t2.type}`, { entry: t2 }), t2.resume();
  }
  [Ar2](t2, e) {
    let i = f3(R4.relative(this.cwd, R4.resolve(R4.dirname(String(t2.absolute)), String(t2.linkpath)))).split("/");
    this[Re](t2, this.cwd, i, () => this[gi](t2, String(t2.linkpath), "symlink", e), (r3) => {
      this[O3](r3, t2), e();
    });
  }
  [Ir2](t2, e) {
    let i = f3(R4.resolve(this.cwd, String(t2.linkpath))), r3 = f3(String(t2.linkpath)).split("/");
    this[Re](t2, this.cwd, r3, () => this[gi](t2, i, "link", e), (n) => {
      this[O3](n, t2), e();
    });
  }
  [Re](t2, e, i, r3, n) {
    let o2 = i.shift();
    if (this.preservePaths || o2 === undefined)
      return r3();
    let h3 = R4.resolve(e, o2);
    u2.lstat(h3, (a2, l3) => {
      if (a2)
        return r3();
      if (l3?.isSymbolicLink())
        return n(new St2(h3, R4.resolve(h3, i.join("/"))));
      this[Re](t2, h3, i, r3, n);
    });
  }
  [kr]() {
    this[Ri]++;
  }
  [$t2]() {
    this[Ri]--, this[bs2]();
  }
  [Ls2](t2) {
    this[$t2](), t2.resume();
  }
  [Os2](t2, e) {
    return t2.type === "File" && !this.unlink && e.isFile() && e.nlink <= 1 && !Te;
  }
  [_s2](t2) {
    this[kr]();
    let e = [t2.path];
    t2.linkpath && e.push(t2.linkpath), this.reservations.reserve(e, (i) => this[Nr2](t2, i));
  }
  [Nr2](t2, e) {
    let i = (h3) => {
      e(h3);
    }, r3 = () => {
      this[yt](this.cwd, this.dmode, (h3) => {
        if (h3) {
          this[O3](h3, t2), i();
          return;
        }
        this[Oe] = true, n();
      });
    }, n = () => {
      if (t2.absolute !== this.cwd) {
        let h3 = f3(R4.dirname(String(t2.absolute)));
        if (h3 !== this.cwd)
          return this[yt](h3, this.dmode, (a2) => {
            if (a2) {
              this[O3](a2, t2), i();
              return;
            }
            o2();
          });
      }
      o2();
    }, o2 = () => {
      u2.lstat(String(t2.absolute), (h3, a2) => {
        if (a2 && (this.keep || this.newer && a2.mtime > (t2.mtime ?? a2.mtime))) {
          this[Ls2](t2), i();
          return;
        }
        if (h3 || this[Os2](t2, a2))
          return this[P2](null, t2, i);
        if (a2.isDirectory()) {
          if (t2.type === "Directory") {
            let l3 = this.chmod && t2.mode && (a2.mode & 4095) !== t2.mode, c3 = (d2) => this[P2](d2 ?? null, t2, i);
            return l3 ? u2.chmod(String(t2.absolute), Number(t2.mode), c3) : c3();
          }
          if (t2.absolute !== this.cwd)
            return u2.rmdir(String(t2.absolute), (l3) => this[P2](l3 ?? null, t2, i));
        }
        if (t2.absolute === this.cwd)
          return this[P2](null, t2, i);
        mo(String(t2.absolute), (l3) => this[P2](l3 ?? null, t2, i));
      });
    };
    this[Oe] ? n() : r3();
  }
  [P2](t2, e, i) {
    if (t2) {
      this[O3](t2, e), i();
      return;
    }
    switch (e.type) {
      case "File":
      case "OldFile":
      case "ContiguousFile":
        return this[Ts2](e, i);
      case "Link":
        return this[Ir2](e, i);
      case "SymbolicLink":
        return this[Ar2](e, i);
      case "Directory":
      case "GNUDumpDir":
        return this[xs2](e, i);
    }
  }
  [gi](t2, e, i, r3) {
    u2[i](e, String(t2.absolute), (n) => {
      n ? this[O3](n, t2) : (this[$t2](), t2.resume()), r3();
    });
  }
};
var ye2 = (s3) => {
  try {
    return [null, s3()];
  } catch (t2) {
    return [t2, null];
  }
};
var xe2 = class extends Xt2 {
  sync = true;
  [P2](t2, e) {
    return super[P2](t2, e, () => {});
  }
  [_s2](t2) {
    if (!this[Oe]) {
      let n = this[yt](this.cwd, this.dmode);
      if (n)
        return this[O3](n, t2);
      this[Oe] = true;
    }
    if (t2.absolute !== this.cwd) {
      let n = f3(R4.dirname(String(t2.absolute)));
      if (n !== this.cwd) {
        let o2 = this[yt](n, this.dmode);
        if (o2)
          return this[O3](o2, t2);
      }
    }
    let [e, i] = ye2(() => u2.lstatSync(String(t2.absolute)));
    if (i && (this.keep || this.newer && i.mtime > (t2.mtime ?? i.mtime)))
      return this[Ls2](t2);
    if (e || this[Os2](t2, i))
      return this[P2](null, t2);
    if (i.isDirectory()) {
      if (t2.type === "Directory") {
        let o2 = this.chmod && t2.mode && (i.mode & 4095) !== t2.mode, [h3] = o2 ? ye2(() => {
          u2.chmodSync(String(t2.absolute), Number(t2.mode));
        }) : [];
        return this[P2](h3, t2);
      }
      let [n] = ye2(() => u2.rmdirSync(String(t2.absolute)));
      this[P2](n, t2);
    }
    let [r3] = t2.absolute === this.cwd ? [] : ye2(() => po(String(t2.absolute)));
    this[P2](r3, t2);
  }
  [Ts2](t2, e) {
    let i = typeof t2.mode == "number" ? t2.mode & 4095 : this.fmode, r3 = (h3) => {
      let a2;
      try {
        u2.closeSync(n);
      } catch (l3) {
        a2 = l3;
      }
      (h3 || a2) && this[O3](h3 || a2, t2), e();
    }, n;
    try {
      n = u2.openSync(String(t2.absolute), ms2(t2.size), i);
    } catch (h3) {
      return r3(h3);
    }
    let o2 = this.transform && this.transform(t2) || t2;
    o2 !== t2 && (o2.on("error", (h3) => this[O3](h3, t2)), t2.pipe(o2)), o2.on("data", (h3) => {
      try {
        u2.writeSync(n, h3, 0, h3.length);
      } catch (a2) {
        r3(a2);
      }
    }), o2.on("end", () => {
      let h3 = null;
      if (t2.mtime && !this.noMtime) {
        let a2 = t2.atime || new Date, l3 = t2.mtime;
        try {
          u2.futimesSync(n, a2, l3);
        } catch (c3) {
          try {
            u2.utimesSync(String(t2.absolute), a2, l3);
          } catch {
            h3 = c3;
          }
        }
      }
      if (this[ge2](t2)) {
        let a2 = this[be2](t2), l3 = this[_e](t2);
        try {
          u2.fchownSync(n, Number(a2), Number(l3));
        } catch (c3) {
          try {
            u2.chownSync(String(t2.absolute), Number(a2), Number(l3));
          } catch {
            h3 = h3 || c3;
          }
        }
      }
      r3(h3);
    });
  }
  [xs2](t2, e) {
    let i = typeof t2.mode == "number" ? t2.mode & 4095 : this.dmode, r3 = this[yt](String(t2.absolute), i);
    if (r3) {
      this[O3](r3, t2), e();
      return;
    }
    if (t2.mtime && !this.noMtime)
      try {
        u2.utimesSync(String(t2.absolute), t2.atime || new Date, t2.mtime);
      } catch {}
    if (this[ge2](t2))
      try {
        u2.chownSync(String(t2.absolute), Number(this[be2](t2)), Number(this[_e](t2)));
      } catch {}
    e(), t2.resume();
  }
  [yt](t2, e) {
    try {
      return _r(f3(t2), { uid: this.uid, gid: this.gid, processUid: this.processUid, processGid: this.processGid, umask: this.processUmask, preserve: this.preservePaths, unlink: this.unlink, cwd: this.cwd, mode: e });
    } catch (i) {
      return i;
    }
  }
  [Re](t2, e, i, r3, n) {
    if (this.preservePaths || i.length === 0)
      return r3();
    let o2 = e;
    for (let h3 of i) {
      o2 = R4.resolve(o2, h3);
      let [a2, l3] = ye2(() => u2.lstatSync(o2));
      if (a2)
        return r3();
      if (l3.isSymbolicLink())
        return n(new St2(o2, R4.resolve(e, i.join("/"))));
    }
    r3();
  }
  [gi](t2, e, i, r3) {
    let n = `${i}Sync`;
    try {
      u2[n](e, String(t2.absolute)), r3(), t2.resume();
    } catch (o2) {
      return this[O3](o2, t2);
    }
  }
};
var Eo = (s3) => {
  let t2 = new xe2(s3), e = s3.file, i = Br2.statSync(e), r3 = s3.maxReadSize || 16 * 1024 * 1024;
  new Be2(e, { readSize: r3, size: i.size }).pipe(t2);
};
var wo2 = (s3, t2) => {
  let e = new Xt2(s3), i = s3.maxReadSize || 16 * 1024 * 1024, r3 = s3.file;
  return new Promise((o2, h3) => {
    e.on("error", h3), e.on("close", o2), Br2.stat(r3, (a2, l3) => {
      if (a2)
        h3(a2);
      else {
        let c3 = new _t2(r3, { readSize: i, size: l3.size });
        c3.on("error", h3), c3.pipe(e);
      }
    });
  });
};
var So = K3(Eo, wo2, (s3) => new xe2(s3), (s3) => new Xt2(s3), (s3, t2) => {
  t2?.length && Qi(s3, t2);
});
var yo = (s3, t2) => {
  let e = new kt2(s3), i = true, r3, n;
  try {
    try {
      r3 = v2.openSync(s3.file, "r+");
    } catch (a2) {
      if (a2?.code === "ENOENT")
        r3 = v2.openSync(s3.file, "w+");
      else
        throw a2;
    }
    let o2 = v2.fstatSync(r3), h3 = Buffer.alloc(512);
    t:
      for (n = 0;n < o2.size; n += 512) {
        for (let c3 = 0, d2 = 0;c3 < 512; c3 += d2) {
          if (d2 = v2.readSync(r3, h3, c3, h3.length - c3, n + c3), n === 0 && h3[0] === 31 && h3[1] === 139)
            throw new Error("cannot append to compressed archives");
          if (!d2)
            break t;
        }
        let a2 = new F3(h3);
        if (!a2.cksumValid)
          break;
        let l3 = 512 * Math.ceil((a2.size || 0) / 512);
        if (n + l3 + 512 > o2.size)
          break;
        n += l3, s3.mtimeCache && a2.mtime && s3.mtimeCache.set(String(a2.path), a2.mtime);
      }
    i = false, Ro(s3, e, n, r3, t2);
  } finally {
    if (i)
      try {
        v2.closeSync(r3);
      } catch {}
  }
};
var Ro = (s3, t2, e, i, r3) => {
  let n = new Wt2(s3.file, { fd: i, start: e });
  t2.pipe(n), bo(t2, r3);
};
var go = (s3, t2) => {
  t2 = Array.from(t2);
  let e = new wt2(s3), i = (n, o2, h3) => {
    let a2 = (T2, D2) => {
      T2 ? v2.close(n, (E3) => h3(T2)) : h3(null, D2);
    }, l3 = 0;
    if (o2 === 0)
      return a2(null, 0);
    let c3 = 0, d2 = Buffer.alloc(512), y2 = (T2, D2) => {
      if (T2 || D2 === undefined)
        return a2(T2);
      if (c3 += D2, c3 < 512 && D2)
        return v2.read(n, d2, c3, d2.length - c3, l3 + c3, y2);
      if (l3 === 0 && d2[0] === 31 && d2[1] === 139)
        return a2(new Error("cannot append to compressed archives"));
      if (c3 < 512)
        return a2(null, l3);
      let E3 = new F3(d2);
      if (!E3.cksumValid)
        return a2(null, l3);
      let x3 = 512 * Math.ceil((E3.size ?? 0) / 512);
      if (l3 + x3 + 512 > o2 || (l3 += x3 + 512, l3 >= o2))
        return a2(null, l3);
      s3.mtimeCache && E3.mtime && s3.mtimeCache.set(String(E3.path), E3.mtime), c3 = 0, v2.read(n, d2, 0, 512, l3, y2);
    };
    v2.read(n, d2, 0, 512, l3, y2);
  };
  return new Promise((n, o2) => {
    e.on("error", o2);
    let h3 = "r+", a2 = (l3, c3) => {
      if (l3 && l3.code === "ENOENT" && h3 === "r+")
        return h3 = "w+", v2.open(s3.file, h3, a2);
      if (l3 || !c3)
        return o2(l3);
      v2.fstat(c3, (d2, y2) => {
        if (d2)
          return v2.close(c3, () => o2(d2));
        i(c3, y2.size, (T2, D2) => {
          if (T2)
            return o2(T2);
          let E3 = new et2(s3.file, { fd: c3, start: D2 });
          e.pipe(E3), E3.on("error", o2), E3.on("close", n), _o(e, t2);
        });
      });
    };
    v2.open(s3.file, h3, a2);
  });
};
var bo = (s3, t2) => {
  t2.forEach((e) => {
    e.charAt(0) === "@" ? Ct2({ file: Pr2.resolve(s3.cwd, e.slice(1)), sync: true, noResume: true, onReadEntry: (i) => s3.add(i) }) : s3.add(e);
  }), s3.end();
};
var _o = async (s3, t2) => {
  for (let e of t2)
    e.charAt(0) === "@" ? await Ct2({ file: Pr2.resolve(String(s3.cwd), e.slice(1)), noResume: true, onReadEntry: (i) => s3.add(i) }) : s3.add(e);
  s3.end();
};
var vt2 = K3(yo, go, () => {
  throw new TypeError("file is required");
}, () => {
  throw new TypeError("file is required");
}, (s3, t2) => {
  if (!Bs2(s3))
    throw new TypeError("file is required");
  if (s3.gzip || s3.brotli || s3.zstd || s3.file.endsWith(".br") || s3.file.endsWith(".tbr"))
    throw new TypeError("cannot append to compressed archives");
  if (!t2?.length)
    throw new TypeError("no paths specified to add/replace");
});
var Oo = K3(vt2.syncFile, vt2.asyncFile, vt2.syncNoFile, vt2.asyncNoFile, (s3, t2 = []) => {
  vt2.validate?.(s3, t2), To(s3);
});
var To = (s3) => {
  let t2 = s3.filter;
  s3.mtimeCache || (s3.mtimeCache = new Map), s3.filter = t2 ? (e, i) => t2(e, i) && !((s3.mtimeCache?.get(e) ?? i.mtime ?? 0) > (i.mtime ?? 0)) : (e, i) => !((s3.mtimeCache?.get(e) ?? i.mtime ?? 0) > (i.mtime ?? 0));
};

// node_modules/skills/dist/_chunks/remove.mjs
var import_picocolors2 = require_picocolors();
var env2 = process.env;
var argv = process.argv;
var isTTY = process.stdout.isTTY === true;
var colorEnabled = !(env2.NO_COLOR || argv.includes("--no-color")) && !!(env2.FORCE_COLOR || argv.includes("--color") || env2.CI || isTTY && env2.TERM !== "dumb");
var pc = (0, import_picocolors2.createColors)(colorEnabled);
var sgr = (code) => colorEnabled ? `\x1B[${code}m` : "";
var RESET = sgr("0");
var BOLD = sgr("1");
var DIM = sgr("38;5;102");
var TEXT = sgr("38;5;145");
var CYAN = sgr("36");
var YELLOW = sgr("33");
var GRAYS = [
  250,
  248,
  245,
  243,
  240,
  238
].map((n) => sgr(`38;5;${n}`));
var availableSkills = (names) => names.length > 0 ? ["Available skills:", ...names.map((name) => `  - ${name}`)].join(`
`) : "";
var diagnostics = defineDiagnostics({ codes: {
  SKILLS_INVALID_AGENTS: {
    why: (p3) => `Invalid agents: ${p3.invalid.join(", ")}`,
    fix: (p3) => `Valid agents: ${p3.valid.join(", ")}`
  },
  SKILLS_OPTION_REQUIRES_VALUE: { why: (p3) => `${p3.option} requires ${p3.value}` },
  SKILLS_OPTION_TAKES_NO_VALUE: { why: (p3) => `${p3.option} does not take a value` },
  SKILLS_UNKNOWN_OPTION: { why: (p3) => `Unknown option: ${p3.option}` },
  SKILLS_INVALID_OPTION_VALUE: { why: (p3) => `${p3.option} must be ${p3.expected}` },
  SKILLS_DUPLICATE_OPTION: { why: (p3) => `Only one ${p3.option} value can be provided` },
  SKILLS_REMOVE_ALL_WITH_NAMES: {
    why: "Cannot combine --all with specific skill names.",
    fix: (p3) => `Use \`skills remove --all\` to remove every skill, or omit --all to remove only the named skills.
   Example: skills remove ${p3.example} -y`
  },
  SKILLS_PROMPT_REQUIRES_TTY: { why: "Interactive prompt required but stdin is not a TTY. Nothing was installed. Use --agent <name> (or --agent '*') and -y to run non-interactively." },
  SKILLS_MISSING_ARGUMENT: { why: (p3) => `Missing required argument: ${p3.name}` },
  SKILLS_MULTIPLE_SOURCES: { why: (p3) => `Expected one source, received ${p3.received.length}: ${p3.received.join(", ")}` },
  SKILLS_UNKNOWN_COMMAND: {
    why: (p3) => `Unknown command: ${p3.command}`,
    fix: "Run skills --help for usage."
  },
  SKILLS_REMOVE_GLOBALLY_TRACKED: {
    why: (p3) => `Tracked in the global lock: ${p3.skills.join(", ")}`,
    fix: (p3) => `Remove globally with: skills remove ${p3.skills.join(" ")} -g`
  },
  SKILLS_REMOVE_UNTRACKED_SKIPPED: {
    why: (p3) => `Skipped ${p3.skills.length} untracked skill(s) not recorded in the lock file: ${p3.skills.join(", ")}`,
    fix: "Remove them by name, e.g. skills remove <name>"
  },
  SKILLS_REMOVE_UNMANAGED_DIR_KEPT: {
    why: (p3) => `Kept ${p3.path}: it is not an unmodified copy installed by skills`,
    fix: "Delete it by hand if you no longer need it"
  },
  SKILLS_UNSAFE_SUBPATH: { why: (p3) => `Unsafe subpath: "${p3.subpath}" contains path traversal segments. Subpaths must not contain ".." components.` },
  SKILLS_SUBPATH_OUTSIDE_REPO: { why: (p3) => `Invalid subpath: "${p3.subpath}" resolves outside the repository directory. Subpath must not contain ".." segments that escape the base path.` },
  SKILLS_NO_MATCHING_SKILLS: {
    why: (p3) => `No matching skills found for: ${p3.requested.join(", ")}`,
    fix: (p3) => availableSkills(p3.available)
  },
  SKILLS_NO_VALID_SKILLS: { why: "No valid skills found. Skills require a SKILL.md with name and description." },
  SKILLS_MULTIPLE_SKILLS_IN_SOURCE: {
    why: (p3) => ["This source contains multiple skills. Specify exactly one skill:", ...p3.names.map((name) => `  - ${name}`)].join(`
`),
    fix: (p3) => {
      const example = p3.names[0] ?? "<skill>";
      return `Examples:
  skills use ${p3.source}@${example}
  skills use ${p3.source} --skill ${example}`;
    }
  },
  SKILLS_AMBIGUOUS_SKILL_SELECTOR: { why: (p3) => `Skill selector "${p3.selector}" matched multiple skills.` },
  SKILLS_CONFLICTING_SKILL_SELECTORS: { why: (p3) => `Conflicting skill selectors: source selects "${p3.fromSource}" but --skill selects "${p3.fromOption}". Provide one selector.` },
  SKILLS_LOCAL_PATH_NOT_FOUND: { why: (p3) => `Local path does not exist: ${p3.path}` },
  SKILLS_WELLKNOWN_SCOPE_NOT_FOUND: { why: (p3) => `No skills found for the scoped path '${p3.scopePath}' on ${p3.rootUrl}. Not falling back to the root skills index because that would install every skill the host publishes. Check the URL, or run 'skills add ${p3.rootUrl}' to install from the root index.` },
  SKILLS_WELLKNOWN_DIGEST_MISMATCH: { why: (p3) => `Digest mismatch for skill '${p3.skill}': expected ${p3.expected}, received ${p3.actual}.` },
  SKILLS_WELLKNOWN_FILE_FETCH_FAILED: { why: (p3) => `Failed to download "${p3.path}" for skill "${p3.skill}"` + (p3.status === undefined ? "." : ` (HTTP ${p3.status}).`) + " The skill cannot be installed without all listed files." },
  SKILLS_WELLKNOWN_INDEX_NOT_FOUND: { why: "No skills found at this URL. Make sure the server has a /.well-known/agent-skills/index.json or /.well-known/skills/index.json file." },
  SKILLS_SKILL_SKIPPED: {
    why: (p3) => `⚠ Skipped ${p3.path} — ${p3.reason}`,
    data: (p3) => ({ path: p3.path })
  },
  SKILLS_UNSUPPORTED_GIT_TRANSPORT: { why: (p3) => `Unsupported Git transport: ${p3.transport}` },
  SKILLS_GIT_CLONE_TIMEOUT: { why: (p3) => `Clone timed out after ${p3.seconds}s. Common causes:
  - Large repository: raise the timeout with SKILLS_CLONE_TIMEOUT_MS=600000 (10m)
  - Slow network: retry, or clone manually and pass the local path to 'skills add'
  - Private repo without credentials: ensure auth is configured
      - For SSH: ssh-add -l (to check loaded keys)
      - For HTTPS: gh auth status (if using GitHub CLI)` },
  SKILLS_GIT_AUTH_FAILED: { why: (p3) => p3.sshUrl ? `Authentication failed for ${p3.url}.
  - For private repos, ensure you have access
  - Retry with SSH: npx skills add ${p3.sshUrl}
  - Check access with: gh auth status -h ${p3.host} or ssh -T git@${p3.host}` : `Authentication failed for ${p3.url}.
  - For private repos, ensure you have access
  - For SSH: Check your keys with 'ssh -T git@github.com'
  - For HTTPS: Run 'gh auth login' or configure git credentials` },
  SKILLS_GIT_SAML_SSO_BLOCKED: { why: (p3) => `GitHub blocked HTTPS access to ${p3.url} because the organization enforces SAML SSO.
  skills tried your existing git credentials and available fallbacks, but none succeeded.
  - Re-authorize your GitHub credentials/app for that org's SSO policy
  - Or rerun with SSH: npx skills add ${p3.sshUrl}
  - Verify access with: gh auth status -h ${p3.host} or ssh -T git@${p3.host}` },
  SKILLS_GIT_CLONE_FAILED: { why: (p3) => `Failed to clone ${p3.url}: ${p3.detail}` },
  SKILLS_DOWNLOAD_HTTP_ERROR: { why: (p3) => `Download failed with HTTP ${p3.status}` },
  SKILLS_DOWNLOAD_TOO_LARGE: { why: (p3) => `Download is larger than ${p3.maxBytes} bytes. Set SKILLS_DOWNLOAD_MAX_BYTES to override.` },
  SKILLS_DOWNLOAD_NO_BODY: { why: "Download response has no body" },
  SKILLS_DOWNLOAD_EMPTY: { why: "Downloaded URL is empty" },
  SKILLS_DOWNLOAD_NOT_A_SKILL: { why: "Downloaded URL is not a valid SKILL.md file or supported archive" },
  SKILLS_DOWNLOAD_NOT_LOCKED: {
    why: (p3) => `Not recording ${p3.skills.join(", ")} in the lock file: ${p3.url} has a query string or credentials, which may be secret`,
    fix: "To let `skills update` fetch it again, serve it from a URL without them."
  },
  SKILLS_ARCHIVE_INVALID: { why: (p3) => p3.reason },
  SKILLS_ARCHIVE_MULTI_DISK_ZIP: { why: "Multi-disk zip archives are not supported" },
  SKILLS_ARCHIVE_UNSAFE_PATH: { why: (p3) => `Archive contains unsafe path: ${p3.path}` },
  SKILLS_ARCHIVE_ENCRYPTED_ENTRY: { why: "Encrypted zip entries are not supported" },
  SKILLS_ARCHIVE_LINK_ENTRY: { why: "Archive links are not supported" },
  SKILLS_ARCHIVE_TOO_MANY_FILES: { why: (p3) => `Archive contains too many files (${p3.count}). Maximum is ${p3.max}.` + (p3.overrideEnv ? ` Set ${p3.overrideEnv} to override.` : "") },
  SKILLS_ARCHIVE_TOO_LARGE: { why: (p3) => `Archive extracts to more than ${p3.maxBytes} bytes.` + (p3.overrideEnv ? ` Set ${p3.overrideEnv} to override.` : "") },
  SKILLS_ARCHIVE_UNSUPPORTED_COMPRESSION: { why: (p3) => `Unsupported zip compression method: ${p3.method}` },
  SKILLS_ARCHIVE_UNSUPPORTED_FORMAT: { why: "Unsupported archive format" },
  SKILLS_ARCHIVE_MISSING_SKILL_MD: { why: "Archive missing root SKILL.md" },
  SKILLS_WELLKNOWN_ARCHIVE_UNSAFE_PATH: { why: (p3) => `Unsafe archive path: ${p3.path}` },
  SKILLS_WELLKNOWN_ARCHIVE_TOO_LARGE: { why: "Archive exceeds maximum unpacked size" },
  SKILLS_WELLKNOWN_ARCHIVE_TOO_MANY_FILES: { why: "Archive contains too many files" },
  SKILLS_UNSAFE_SKILL_NAME: { why: "Invalid skill name: potential path traversal detected" },
  SKILLS_CATEGORY_DIR_CONFLICT: {
    why: (p3) => `Refusing to replace ${p3.path}: it is a category directory with nested skills (${p3.skills.slice(0, 8).join(", ")}${p3.skills.length > 8 ? ", ..." : ""}). Installing would delete them.`,
    fix: "Move or rename the category directory, then install again.",
    data: (p3) => ({
      path: p3.path,
      skills: p3.skills
    })
  },
  SKILLS_CLEANUP_OUTSIDE_TEMP_DIR: { why: "Attempted to clean up directory outside of temp directory" },
  SKILLS_BROKEN_SYMLINK: {
    why: (p3) => `Skipping broken symlink: ${p3.path}`,
    data: (p3) => ({ path: p3.path })
  },
  SKILLS_LOCK_MISSING_SOURCE_URL: { why: (p3) => `Cannot restore ${p3.skill}: skills-lock.json is missing sourceUrl for this generic Git source` },
  SKILLS_INVALID_LOCAL_LOCK: { why: (p3) => `Invalid ${p3.path}: ${p3.reason}. Fix or delete the file, then retry.` },
  SKILLS_SYMLINK_OUTSIDE_SKILL: {
    why: (p3) => `Skipping symlink that points outside the skill directory: ${p3.path}`,
    data: (p3) => ({ path: p3.path })
  },
  SKILLS_SYMLINK_CYCLE: {
    why: (p3) => `Skipping symlink that creates a directory cycle: ${p3.path}`,
    data: (p3) => ({ path: p3.path })
  },
  SKILLS_PACKAGE_SKILLS_NOT_ARRAY: { why: 'package.json: "skills" must be an array' },
  SKILLS_PACKAGE_SKILLS_INVALID_ENTRY: { why: (p3) => `${p3.declarer}: invalid "skills" entry ${p3.entry}` },
  SKILLS_PACKAGE_SKILLS_NOT_GIT_SOURCE: { why: (p3) => `${p3.declarer}: "${p3.source}" is not a git source` },
  SKILLS_PACKAGE_SKILLS_DUPLICATE_REF: { why: (p3) => `${p3.declarer}: "${p3.source}" already has a ref; remove "ref"` },
  SKILLS_PACKAGE_SKILLS_REF_NOT_ALLOWED: { why: (p3) => `${p3.declarer}: "ref" cannot be used with "${p3.source}"` },
  SKILLS_PACKAGE_SKILLS_UNRESOLVED_NPM: { why: (p3) => `${p3.declarer}: cannot resolve "npm:${p3.pkg}"; is it a dependency?` },
  SKILLS_NOTION_CLI_MISSING: { why: "Notion CLI (ntn) is required. Install it from:\nhttps://developers.notion.com/cli/get-started/overview\nThen run `ntn login`." },
  SKILLS_NOTION_API_FAILED: { why: (p3) => `ntn api failed${p3.stderr ? `: ${p3.stderr}` : ` with exit code ${p3.exitCode ?? "unknown"}`}` },
  SKILLS_NOTION_API_TIMEOUT: { why: (p3) => `ntn api timed out after ${p3.seconds} seconds` },
  SKILLS_NOTION_API_OUTPUT_TOO_LARGE: { why: "ntn api output exceeded 10 MiB" },
  SKILLS_NOTION_CLI_START_FAILED: { why: (p3) => `Unable to start ntn: ${p3.detail}` },
  SKILLS_NOTION_RESPONSE_MISSING_FIELD: { why: (p3) => `Notion Agent Plugins ${p3.response} is missing ${p3.field}` },
  SKILLS_NOTION_RESPONSE_INVALID_FIELD: { why: (p3) => `Notion Agent Plugins ${p3.response} has an invalid ${p3.field}` },
  SKILLS_NOTION_INVALID_PACK: { why: "Notion Agent Plugins response contains an invalid pack" },
  SKILLS_NOTION_INVALID_LIST_RESPONSE: { why: "Notion Agent Plugins list response is invalid" },
  SKILLS_NOTION_INVALID_DIRECTORY_RESPONSE: { why: (p3) => `Notion ${p3.label} directory response is invalid` },
  SKILLS_NOTION_INVALID_JSON: { why: (p3) => `ntn returned invalid JSON for ${p3.label}` },
  SKILLS_NOTION_INVALID_CURSOR: { why: "Notion Agent Plugins pagination returned an invalid cursor" },
  SKILLS_NOTION_NO_PACKS: { why: "Notion returned no packs for the authenticated workspace" },
  SKILLS_NOTION_NO_MATCHING_PACKS: { why: (p3) => `No matching Notion packs found for: ${p3.requested.join(", ")}` },
  SKILLS_NOTION_PACK_CHANGED: { why: (p3) => `Notion pack ${JSON.stringify(p3.pack)} changed while preparing installation` },
  SKILLS_NOTION_PACK_PREPARE_FAILED: { why: (p3) => `Failed to prepare Notion pack ${JSON.stringify(p3.pack)}: ${p3.detail}` },
  SKILLS_NOTION_PACK_NO_SKILLS: { why: "pack contains no valid skills" },
  SKILLS_USE_AGENT_UNSUPPORTED: {
    why: (p3) => `Running ${p3.agent} is not supported yet.`,
    fix: (p3) => `Supported agents for skills use --agent: ${p3.supported.join(", ")}`
  },
  SKILLS_USE_AGENT_COMMAND_NOT_FOUND: { why: (p3) => `Could not launch ${p3.agent}: command not found: ${p3.command}` },
  SKILLS_USE_AGENT_WILDCARD: { why: "skills use --agent does not support '*'; specify exactly one agent." },
  SKILLS_USE_MULTIPLE_AGENTS: { why: "skills use --agent accepts exactly one agent." },
  SKILLS_USE_NO_MATCHING_SKILL: {
    why: (p3) => `No matching skill found for: ${p3.selector}`,
    fix: (p3) => availableSkills(p3.available)
  },
  SKILLS_SOURCE_FETCH_FAILED: { why: (p3) => `Could not fetch ${p3.source}: ${p3.detail}` },
  SKILLS_SOURCE_DISPOSED: { why: "This source was already disposed. Resolve it again with resolveSource()." },
  SKILLS_DUPLICATE_SKILL_NAME: {
    why: (p3) => ["Several folders declare the same skill name:", ...p3.skills.map((s3) => `  - ${s3}`)].join(`
`),
    fix: "Select another skill, or install with duplicates: 'first'."
  },
  SKILLS_SKILL_CONTAINS_SYMLINKS: {
    why: (p3) => ["Skills contain symlinks:", ...p3.links.map((link) => `  - ${link}`)].join(`
`),
    fix: "Remove the symlinks from the source, or install with symlinks: 'follow'."
  },
  SKILLS_AGENT_NOT_ALLOWED: { why: (p3) => `Not allowed by config.agents: ${p3.agents.join(", ")}` },
  SKILLS_NO_TARGET_AGENTS: {
    why: "No allowed agents to target.",
    fix: "Name agents that config.agents allows, or widen config.agents.include."
  },
  SKILLS_GLOBAL_INSTALL_UNSUPPORTED: { why: (p3) => `${p3.agent} does not support global skill installation` },
  SKILLS_INSTALL_FAILED: { why: (p3) => `Failed to install ${p3.skill} for ${p3.agent}: ${p3.detail}` },
  SKILLS_REMOVE_FAILED: { why: (p3) => `Failed to remove ${p3.skill}: ${p3.detail}` },
  SKILLS_LOCK_WRITE_FAILED: { why: (p3) => `Skills were installed but the lock file could not be updated: ${p3.detail}` },
  SKILLS_PROVIDER_ALREADY_REGISTERED: { why: (p3) => `Provider with id "${p3.id}" already registered` }
} });
var formatDiagnostic = ansiFormatter(pc);
function formatError(error) {
  if (error instanceof Diagnostic)
    return formatDiagnostic(error);
  return error instanceof Error ? error.message : String(error);
}
function isDiagnostic(error, ...codes) {
  return error instanceof Diagnostic && codes.some((code) => code === error.code);
}
var DEFAULT_GITHUB_HOST = "github.com";
function getGitHubHost() {
  const configuredHost = process.env.GH_HOST?.trim();
  if (!configuredHost)
    return DEFAULT_GITHUB_HOST;
  try {
    const parsed = new URL(`https://${configuredHost}`);
    if (parsed.username || parsed.password || parsed.port || parsed.pathname !== "/" || parsed.search || parsed.hash)
      return DEFAULT_GITHUB_HOST;
    return parsed.hostname;
  } catch {
    return DEFAULT_GITHUB_HOST;
  }
}
function isGitHubHost(host) {
  const normalizedHost = host.toLowerCase();
  return normalizedHost === DEFAULT_GITHUB_HOST || normalizedHost === getGitHubHost().toLowerCase();
}
var DEFAULT_CLONE_TIMEOUT_MS = 300000;
var ALLOWED_GIT_PROTOCOLS = "https:http:ssh:git:file";
var CLONE_TIMEOUT_MS = (() => {
  const raw = process.env.SKILLS_CLONE_TIMEOUT_MS;
  if (!raw)
    return DEFAULT_CLONE_TIMEOUT_MS;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CLONE_TIMEOUT_MS;
})();
var execFileAsync = promisify(execFile$1);
function isCommitSha(ref) {
  return /^[0-9a-f]{40}$/i.test(ref);
}
function isMissingRefError(message) {
  return /Remote branch .* not found in upstream origin/i.test(message) || /couldn't find remote ref/i.test(message) || /upload-pack: not our ref/i.test(message);
}
async function cloneAtSha(url, sha, tempDir, extraEnv) {
  const git = createGitClient(extraEnv);
  await git.cwd(tempDir);
  await git.init();
  await git.addRemote("origin", url);
  await git.fetch([
    "--depth",
    "1",
    "origin",
    sha
  ]);
  await git.checkout("FETCH_HEAD");
}
function parseGitHubRepoUrl(url) {
  const sshMatch = url.match(/^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?$/i);
  if (sshMatch && isGitHubHost(sshMatch[1])) {
    const host = sshMatch[1];
    const owner = sshMatch[2];
    const repo = sshMatch[3];
    return {
      owner,
      repo,
      slug: `${owner}/${repo}`,
      sshUrl: `git@${host}:${owner}/${repo}.git`
    };
  }
  try {
    const parsed = new URL(url);
    if (!isGitHubHost(parsed.host))
      return null;
    const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+?)(?:\.git)?\/?$/);
    if (!match)
      return null;
    const owner = match[1];
    const repo = match[2];
    return {
      owner,
      repo,
      slug: `${owner}/${repo}`,
      sshUrl: `git@${parsed.host}:${owner}/${repo}.git`
    };
  } catch {
    return null;
  }
}
function isGitHubHttpsCloneUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && isGitHubHost(parsed.host);
  } catch {
    return false;
  }
}
function isGitHubSsoAuthError(message) {
  const lower = message.toLowerCase();
  return lower.includes("saml sso") || lower.includes("enforced sso") || lower.includes("enabled or enforced saml") || lower.includes("re-authorize the oauth application");
}
function isAuthFailure(message) {
  return message.includes("Authentication failed") || message.includes("could not read Username") || message.includes("Permission denied") || message.includes("Repository not found") || message.includes("requested URL returned error: 403") || isGitHubSsoAuthError(message);
}
function createGitClient(extraEnv) {
  const env3 = {
    ...process.env,
    GIT_TERMINAL_PROMPT: "0",
    GIT_ALLOW_PROTOCOL: ALLOWED_GIT_PROTOCOLS,
    GIT_LFS_SKIP_SMUDGE: "1",
    LC_ALL: "C",
    ...extraEnv
  };
  const git = wo({
    timeout: { block: CLONE_TIMEOUT_MS },
    config: [
      "filter.lfs.required=false",
      "filter.lfs.smudge=",
      "filter.lfs.clean=",
      "filter.lfs.process=",
      "core.longpaths=true"
    ],
    allowEnvironment: Object.keys(env3),
    unsafe: {
      allowUnsafeAlias: true,
      allowUnsafeAskPass: true,
      allowUnsafeCommandBinaries: true,
      allowUnsafeConfigEnvCount: true,
      allowUnsafeConfigPaths: true,
      allowUnsafeCredentialHelper: true,
      allowUnsafeDiffExternal: true,
      allowUnsafeDiffTextConv: true,
      allowUnsafeEditor: true,
      allowUnsafeExec: true,
      allowUnsafeFilter: true,
      allowUnsafeFsMonitor: true,
      allowUnsafeGpgProgram: true,
      allowUnsafeGitProxy: true,
      allowUnsafeHooksPath: true,
      allowUnsafeInclude: true,
      allowUnsafeMergeDriver: true,
      allowUnsafePack: true,
      allowUnsafePager: true,
      allowUnsafeProtocolOverride: true,
      allowUnsafeSshCommand: true,
      allowUnsafeSubmodule: true,
      allowUnsafeTemplateDir: true,
      allowUnsafeUrlRewrite: true
    }
  });
  git.env(env3);
  return git;
}
async function resetTempDir(dir) {
  await rm(dir, {
    recursive: true,
    force: true
  }).catch(() => {});
  await mkdir(dir, { recursive: true });
}
async function initializeSubmodules(repoDir, extraEnv) {
  try {
    const git = createGitClient(extraEnv);
    await git.cwd(repoDir);
    await git.submoduleUpdate([
      "--init",
      "--recursive",
      "--depth",
      "1"
    ]);
  } catch {
    console.warn("Warning: failed to initialize Git submodules; installed skills may be incomplete.");
  }
}
async function tryGhClone(repo, tempDir, ref) {
  let cloneTarget = repo.slug;
  const host = repo.sshUrl.match(/^git@([^:]+):/)?.[1] || "github.com";
  try {
    const { stdout, stderr } = await execFileAsync("gh", [
      "auth",
      "status",
      "-h",
      host
    ], {
      timeout: 5000,
      env: {
        ...process.env,
        GIT_TERMINAL_PROMPT: "0"
      }
    });
    const statusOutput = `${stdout}${stderr}`;
    if (/Git operations protocol:\s+ssh/i.test(statusOutput))
      cloneTarget = repo.sshUrl;
  } catch {
    return false;
  }
  await execFileAsync("gh", [
    "repo",
    "clone",
    cloneTarget,
    tempDir,
    "--",
    ...ref ? [
      "--depth=1",
      "--branch",
      ref
    ] : ["--depth=1"]
  ], {
    timeout: CLONE_TIMEOUT_MS,
    env: {
      ...process.env,
      GIT_TERMINAL_PROMPT: "0",
      GIT_ALLOW_PROTOCOL: ALLOWED_GIT_PROTOCOLS
    }
  });
  return true;
}
function authError(url, repo, message, cause) {
  const host = repo?.sshUrl.match(/^git@([^:]+):/)?.[1] || "github.com";
  if (repo && isGitHubSsoAuthError(message))
    return diagnostics.SKILLS_GIT_SAML_SSO_BLOCKED({
      url,
      sshUrl: repo.sshUrl,
      host,
      cause
    });
  return diagnostics.SKILLS_GIT_AUTH_FAILED({
    url,
    sshUrl: repo?.sshUrl,
    host,
    cause
  });
}
async function cloneRepo(url, ref) {
  if (/^ext::/i.test(url))
    throw diagnostics.SKILLS_UNSUPPORTED_GIT_TRANSPORT({ transport: "ext" });
  const tempDir = await mkdtemp(join(tmpdir(), "skills-"));
  const cloneOptions = ref ? [
    "--depth",
    "1",
    "--branch",
    ref
  ] : ["--depth", "1"];
  const refCanBeSha = !!ref && isCommitSha(ref);
  const repo = parseGitHubRepoUrl(url);
  try {
    await createGitClient().clone(url, tempDir, cloneOptions);
    await initializeSubmodules(tempDir);
    return tempDir;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (refCanBeSha && isMissingRefError(errorMessage))
      try {
        await resetTempDir(tempDir);
        await cloneAtSha(url, ref, tempDir);
        await initializeSubmodules(tempDir);
        return tempDir;
      } catch {}
    const isTimeout = errorMessage.includes("block timeout") || errorMessage.includes("timed out");
    const isAuthError = isAuthFailure(errorMessage);
    if (isTimeout) {
      await rm(tempDir, {
        recursive: true,
        force: true
      }).catch(() => {});
      throw diagnostics.SKILLS_GIT_CLONE_TIMEOUT({
        seconds: Math.round(CLONE_TIMEOUT_MS / 1000),
        cause: error
      });
    }
    if (isAuthError && repo && isGitHubHttpsCloneUrl(url)) {
      try {
        await resetTempDir(tempDir);
        if (await tryGhClone(repo, tempDir, ref)) {
          await initializeSubmodules(tempDir);
          return tempDir;
        }
      } catch {}
      try {
        await resetTempDir(tempDir);
        const sshEnv = { GIT_SSH_COMMAND: process.env.GIT_SSH_COMMAND ?? "ssh -o BatchMode=yes" };
        try {
          await createGitClient(sshEnv).clone(repo.sshUrl, tempDir, cloneOptions);
          await initializeSubmodules(tempDir, sshEnv);
        } catch (sshError) {
          const sshMessage = sshError instanceof Error ? sshError.message : String(sshError);
          if (refCanBeSha && isMissingRefError(sshMessage)) {
            await resetTempDir(tempDir);
            await cloneAtSha(repo.sshUrl, ref, tempDir, sshEnv);
            await initializeSubmodules(tempDir, sshEnv);
          } else
            throw sshError;
        }
        return tempDir;
      } catch {}
    }
    await rm(tempDir, {
      recursive: true,
      force: true
    }).catch(() => {});
    if (isAuthError)
      throw authError(url, repo, errorMessage, error);
    throw diagnostics.SKILLS_GIT_CLONE_FAILED({
      url,
      detail: errorMessage,
      cause: error
    });
  }
}
function getHeadCommit(repoDir) {
  return revParse(repoDir, "HEAD^{commit}");
}
async function revParse(repoDir, revision) {
  try {
    const hash = (await new Promise((resolve2, reject) => {
      execFile$1("git", [
        "-C",
        repoDir,
        "rev-parse",
        "--verify",
        "--end-of-options",
        revision
      ], {
        encoding: "utf8",
        timeout: CLONE_TIMEOUT_MS,
        env: {
          ...process.env,
          GIT_OPTIONAL_LOCKS: "0",
          GIT_TERMINAL_PROMPT: "0"
        }
      }, (error, output) => {
        if (error)
          reject(error);
        else
          resolve2(output);
      });
    })).trim();
    return /^[0-9a-f]{40}$/i.test(hash) ? hash.toLowerCase() : null;
  } catch {
    return null;
  }
}
async function cleanupTempDir(dir) {
  const normalizedDir = normalize2(resolve(dir));
  const normalizedTmpDir = normalize2(resolve(tmpdir()));
  if (!normalizedDir.startsWith(normalizedTmpDir + sep) && normalizedDir !== normalizedTmpDir)
    throw diagnostics.SKILLS_CLEANUP_OUTSIDE_TEMP_DIR();
  await rm(dir, {
    recursive: true,
    force: true
  });
}
function getOwnerRepo(parsed) {
  if (parsed.type === "local" || parsed.type === "download")
    return null;
  const sshMatch = parsed.url.match(/^git@[^:]+:(.+)$/);
  if (sshMatch) {
    let path2 = sshMatch[1];
    path2 = path2.replace(/\.git$/, "");
    if (path2.includes("/"))
      return path2;
    return null;
  }
  if (parsed.url.startsWith("ssh://"))
    try {
      let path2 = new URL(parsed.url).pathname.slice(1);
      path2 = path2.replace(/\.git$/, "");
      if (path2.includes("/"))
        return path2;
      return null;
    } catch {
      return null;
    }
  if (!parsed.url.startsWith("http://") && !parsed.url.startsWith("https://"))
    return null;
  try {
    let path2 = new URL(parsed.url).pathname.slice(1);
    path2 = path2.replace(/\.git$/, "");
    if (path2.includes("/"))
      return path2;
  } catch {}
  return null;
}
function parseOwnerRepo(ownerRepo) {
  const match = ownerRepo.match(/^([^/]+)\/([^/]+)$/);
  if (match)
    return {
      owner: match[1],
      repo: match[2]
    };
  return null;
}
var GITHUB_FULL_NAME = /^[A-Za-z0-9-]+\/(?!\.\.?$)[A-Za-z0-9._-]+$/;
async function fetchGitHubRepoInfo(owner, repo) {
  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!res.ok)
      return null;
    const data = await res.json();
    return {
      private: data.private === true,
      fullName: typeof data.full_name === "string" && GITHUB_FULL_NAME.test(data.full_name) ? data.full_name : null
    };
  } catch {
    return null;
  }
}
async function isRepoPrivate(owner, repo) {
  const info = await fetchGitHubRepoInfo(owner, repo);
  return info ? info.private : null;
}
function withCanonicalGitHubRepo(parsed, fullName) {
  if (parsed.type !== "github" || !fullName || getOwnerRepo(parsed) === fullName)
    return parsed;
  return {
    ...parsed,
    url: `https://github.com/${fullName}.git`
  };
}
function lookupGitHubRepo(parsed) {
  if (parsed.type !== "github")
    return Promise.resolve(null);
  const ownerRepo = parseOwnerRepo(getOwnerRepo(parsed) ?? "");
  if (!ownerRepo)
    return Promise.resolve(null);
  return fetchGitHubRepoInfo(ownerRepo.owner, ownerRepo.repo);
}
function sanitizeSubpath(subpath) {
  const segments = subpath.replace(/\\/g, "/").split("/");
  for (const segment of segments)
    if (segment === "..")
      throw diagnostics.SKILLS_UNSAFE_SUBPATH({ subpath });
  return subpath;
}
function azureReposVersionToRef(version) {
  if (!version)
    return;
  return /^(?:GB|GT)(.+)$/i.exec(version)?.[1] || undefined;
}
function parseAzureReposSource(input, fragmentRef, fragmentSkillFilter) {
  if (!input.startsWith("http://") && !input.startsWith("https://"))
    return null;
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }
  const segments = parsed.pathname.split("/").filter(Boolean);
  const gitIndex = segments.indexOf("_git");
  if (gitIndex < 0 || gitIndex === segments.length - 1)
    return null;
  const repo = segments[gitIndex + 1].replace(/\.git$/, "");
  if (!repo)
    return null;
  const clonePath = "/" + [
    ...segments.slice(0, gitIndex),
    "_git",
    repo
  ].map((segment) => {
    try {
      return encodeURIComponent(decodeURIComponent(segment));
    } catch {
      return encodeURIComponent(segment);
    }
  }).join("/");
  const cloneUrl = `${parsed.protocol}//${parsed.host}${clonePath}`;
  const ref = azureReposVersionToRef(parsed.searchParams.get("version")) || fragmentRef;
  const pathParam = parsed.searchParams.get("path");
  const subpath = pathParam ? sanitizeSubpath(pathParam.replace(/^\/+/, "")) : undefined;
  return {
    type: "git",
    url: cloneUrl,
    ...ref ? { ref } : {},
    ...subpath ? { subpath } : {},
    ...fragmentSkillFilter ? { skillFilter: fragmentSkillFilter } : {}
  };
}
function pathOnHost(input, host) {
  const match = input.match(/^(?:https?:\/\/)?([^/?#]*)([^?#]*)/i);
  const hostname = match[1].replace(/^[^@]*@/, "").replace(/:\d*$/, "").toLowerCase();
  return hostname === host || hostname === `www.${host}` ? match[2] : null;
}
function matchMirroredRepoPath(pathname) {
  const hostMatch = pathname.match(/^(\/(?:.*?\/)?(?:https?:\/\/?)?(?:www\.)?(github|gitlab)\.com)(\/.*)$/i);
  if (!hostMatch)
    return null;
  const [, prefix, kind, rest] = hostMatch;
  const repoMatch = kind.toLowerCase() === "github" ? rest.match(/^(\/[^/]+\/[^/]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.+?))?)?\/?$/) : rest.match(/^(\/[^/]+(?:\/[^/]+)*?\/[^/]+?)(?:\.git)?(?:\/-\/tree\/([^/]+)(?:\/(.+?))?)?\/?$/);
  if (!repoMatch)
    return null;
  const [, repoPath, ref, subpath] = repoMatch;
  return {
    base: `${prefix}${repoPath}`,
    ref,
    subpath
  };
}
function decodePathPart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function parseMirroredRepoSource(input, fragmentRef, fragmentSkillFilter) {
  if (!/^https?:\/\//i.test(input))
    return null;
  let parsed;
  try {
    parsed = new URL(input);
  } catch {
    return null;
  }
  const mirrored = matchMirroredRepoPath(parsed.pathname);
  if (!mirrored)
    return null;
  parsed.pathname = `${mirrored.base}.git`;
  parsed.search = "";
  parsed.hash = "";
  const ref = mirrored.ref ? decodePathPart(mirrored.ref) : fragmentRef;
  const subpath = mirrored.subpath ? sanitizeSubpath(decodePathPart(mirrored.subpath)) : undefined;
  return {
    type: "git",
    url: parsed.toString(),
    ...ref ? { ref } : {},
    ...subpath ? { subpath } : {},
    ...fragmentSkillFilter ? { skillFilter: fragmentSkillFilter } : {}
  };
}
function isLocalPath(input) {
  return isAbsolute(input) || input.startsWith("./") || input.startsWith("../") || input === "." || input === ".." || /^[a-zA-Z]:[/\\]/.test(input);
}
var SOURCE_ALIASES = {
  "coinbase/agentWallet": "coinbase/agentic-wallet-skills",
  "vercel-labs/vercel-skills": "vercel-labs/agent-skills"
};
function decodeFragmentValue(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}
function looksLikeGitSource(input) {
  if (input.startsWith("github:") || input.startsWith("gitlab:") || input.startsWith("git@"))
    return true;
  if (/^ssh:\/\/.+\.git(?:$|[/?])/i.test(input))
    return true;
  if (input.startsWith("http://") || input.startsWith("https://"))
    try {
      const parsed = new URL(input);
      const pathname = parsed.pathname;
      if (isGitHubHost(parsed.host))
        return /^\/[^/]+\/[^/]+(?:\.git)?(?:\/tree\/[^/]+(?:\/.*)?)?\/?$/.test(pathname);
      if (parsed.hostname === "gitlab.com")
        return /^\/.+?\/[^/]+(?:\.git)?(?:\/-\/tree\/[^/]+(?:\/.*)?)?\/?$/.test(pathname);
      if (matchMirroredRepoPath(pathname))
        return true;
      const azureSegments = pathname.split("/").filter(Boolean);
      const azureGitIndex = azureSegments.indexOf("_git");
      if (azureGitIndex >= 0 && azureGitIndex < azureSegments.length - 1)
        return true;
    } catch {}
  if (/^https?:\/\/.+\.git(?:$|[/?])/i.test(input))
    return true;
  return !input.includes(":") && !input.startsWith(".") && !input.startsWith("/") && /^([^/]+)\/([^/]+)(?:\/(.+)|@(.+))?$/.test(input);
}
function parseFragmentRef(input) {
  const hashIndex = input.indexOf("#");
  if (hashIndex < 0)
    return { inputWithoutFragment: input };
  const inputWithoutFragment = input.slice(0, hashIndex);
  const fragment = input.slice(hashIndex + 1);
  if (!fragment || !looksLikeGitSource(inputWithoutFragment))
    return { inputWithoutFragment: input };
  const atIndex = fragment.indexOf("@");
  if (atIndex === -1)
    return {
      inputWithoutFragment,
      ref: decodeFragmentValue(fragment)
    };
  const ref = fragment.slice(0, atIndex);
  const skillFilter = fragment.slice(atIndex + 1);
  return {
    inputWithoutFragment,
    ref: ref ? decodeFragmentValue(ref) : undefined,
    skillFilter: skillFilter ? decodeFragmentValue(skillFilter) : undefined
  };
}
function isVersionPin(value) {
  return /^v?\d+(?:\.\d+)+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(value) || isCommitSha(value);
}
function appendFragmentRef(input, ref, skillFilter) {
  if (!ref && !skillFilter)
    return input;
  return `${input}#${ref ? encodeURIComponent(ref) : ""}${skillFilter ? `@${encodeURIComponent(skillFilter)}` : ""}`;
}
function isHostedArtifactUrl(input) {
  try {
    const parsed = new URL(input);
    const host = parsed.hostname.toLowerCase();
    if (host === "raw.githubusercontent.com" || host === "codeload.github.com" || host === "objects.githubusercontent.com")
      return true;
    if (host === "github.com")
      return /^\/[^/]+\/[^/]+\/(?:archive\/|raw\/|releases\/(?:download\/|latest\/download\/))/.test(parsed.pathname);
    if (host === "gitlab.com")
      return /\/-\/(?:archive|raw)\//.test(parsed.pathname);
    return false;
  } catch {
    return false;
  }
}
function parseSource(input, options = {}) {
  if (isLocalPath(input)) {
    const resolvedPath = resolve(options.cwd ?? process.cwd(), input);
    return {
      type: "local",
      url: resolvedPath,
      localPath: resolvedPath
    };
  }
  const { inputWithoutFragment, ref: fragmentRef, skillFilter: fragmentSkillFilter } = parseFragmentRef(input);
  input = inputWithoutFragment;
  const alias = SOURCE_ALIASES[input];
  if (alias)
    input = alias;
  const githubPrefixMatch = input.match(/^github:(.+)$/);
  if (githubPrefixMatch)
    return parseSource(appendFragmentRef(githubPrefixMatch[1], fragmentRef, fragmentSkillFilter));
  const gitlabPrefixMatch = input.match(/^gitlab:(.+)$/);
  if (gitlabPrefixMatch)
    return parseSource(appendFragmentRef(`https://gitlab.com/${gitlabPrefixMatch[1]}`, fragmentRef, fragmentSkillFilter));
  if (isHostedArtifactUrl(input))
    return {
      type: "download",
      url: input
    };
  if (getGitHubHost() !== "github.com" && /^https?:\/\//.test(input))
    try {
      const parsedUrl = new URL(input);
      if (isGitHubHost(parsedUrl.host) && parsedUrl.host !== "github.com") {
        const [owner, rawRepo, marker, ref, ...subpathSegments] = parsedUrl.pathname.split("/").filter(Boolean);
        if (owner && rawRepo) {
          const repo = rawRepo.replace(/\.git$/, "");
          const isTreeUrl = marker === "tree" && ref;
          return {
            type: "git",
            url: `${parsedUrl.protocol}//${parsedUrl.host}/${owner}/${repo}.git`,
            ...isTreeUrl ? { ref } : fragmentRef ? { ref: fragmentRef } : {},
            ...isTreeUrl && subpathSegments.length > 0 ? { subpath: sanitizeSubpath(subpathSegments.join("/")) } : {}
          };
        }
      }
    } catch {}
  const githubSshTreeMatch = input.match(/^git@([^:]+):([^/]+)\/([^/]+?)(?:\.git)?\/tree\/([^/]+)(?:\/(.+))?$/);
  if (githubSshTreeMatch && isGitHubHost(githubSshTreeMatch[1])) {
    const [, host, owner, repo, ref, subpath] = githubSshTreeMatch;
    return {
      type: "git",
      url: `git@${host}:${owner}/${repo}.git`,
      ref,
      ...subpath ? { subpath: sanitizeSubpath(subpath) } : {}
    };
  }
  const githubPath = pathOnHost(input, "github.com");
  if (githubPath !== null) {
    const treeMatch = githubPath.match(/^\/([^/]+)\/([^/]+)\/tree\/([^/]+)(?:\/(.+?))?\/?$/);
    if (treeMatch) {
      const [, owner, repo, ref, subpath] = treeMatch;
      return {
        type: "github",
        url: `https://github.com/${owner}/${repo}.git`,
        ref: ref || fragmentRef,
        ...subpath ? { subpath: sanitizeSubpath(subpath) } : {}
      };
    }
    const repoMatch = githubPath.match(/^\/([^/]+)\/([^/]+)/);
    if (repoMatch) {
      const [, owner, repo] = repoMatch;
      return {
        type: "github",
        url: `https://github.com/${owner}/${repo.replace(/\.git$/, "")}.git`,
        ...fragmentRef ? { ref: fragmentRef } : {}
      };
    }
  }
  const gitlabTreeWithPathMatch = input.match(/^(https?):\/\/([^/]+)\/(.+?)\/-\/tree\/([^/]+)\/(.+)/);
  if (gitlabTreeWithPathMatch) {
    const [, protocol, hostname, repoPath, ref, subpath] = gitlabTreeWithPathMatch;
    if (hostname !== "github.com" && repoPath)
      return {
        type: "gitlab",
        url: `${protocol}://${hostname}/${repoPath.replace(/\.git$/, "")}.git`,
        ref: ref || fragmentRef,
        subpath: subpath ? sanitizeSubpath(subpath) : subpath
      };
  }
  const gitlabTreeMatch = input.match(/^(https?):\/\/([^/]+)\/(.+?)\/-\/tree\/([^/]+)$/);
  if (gitlabTreeMatch) {
    const [, protocol, hostname, repoPath, ref] = gitlabTreeMatch;
    if (hostname !== "github.com" && repoPath)
      return {
        type: "gitlab",
        url: `${protocol}://${hostname}/${repoPath.replace(/\.git$/, "")}.git`,
        ref: ref || fragmentRef
      };
  }
  const gitlabRepoMatch = pathOnHost(input, "gitlab.com")?.match(/^\/(.+?)(?:\.git)?\/?$/);
  if (gitlabRepoMatch) {
    const repoPath = gitlabRepoMatch[1];
    if (repoPath.includes("/"))
      return {
        type: "gitlab",
        url: `https://gitlab.com/${repoPath}.git`,
        ...fragmentRef ? { ref: fragmentRef } : {}
      };
  }
  const mirrored = parseMirroredRepoSource(input, fragmentRef, fragmentSkillFilter);
  if (mirrored)
    return mirrored;
  const azureRepos = parseAzureReposSource(input, fragmentRef, fragmentSkillFilter);
  if (azureRepos)
    return azureRepos;
  const githubHost = options.githubHost ?? getGitHubHost();
  const shorthandSourceType = githubHost === "github.com" ? "github" : "git";
  const atSkillMatch = input.match(/^([^/]+)\/([^/@]+)@(.+)$/);
  if (atSkillMatch && !input.includes(":") && !input.startsWith(".") && !input.startsWith("/")) {
    const [, owner, repo, skillFilter] = atSkillMatch;
    if (!fragmentRef && !fragmentSkillFilter && isVersionPin(skillFilter))
      return {
        type: shorthandSourceType,
        url: `https://${githubHost}/${owner}/${repo}.git`,
        ref: skillFilter
      };
    return {
      type: shorthandSourceType,
      url: `https://${githubHost}/${owner}/${repo}.git`,
      ...fragmentRef ? { ref: fragmentRef } : {},
      skillFilter: fragmentSkillFilter || skillFilter
    };
  }
  const shorthandMatch = input.match(/^([^/]+)\/([^/]+)(?:\/(.+?))?\/?$/);
  if (shorthandMatch && !input.includes(":") && !input.startsWith(".") && !input.startsWith("/")) {
    const [, owner, repo, subpath] = shorthandMatch;
    return {
      type: shorthandSourceType,
      url: `https://${githubHost}/${owner}/${repo}.git`,
      ...fragmentRef ? { ref: fragmentRef } : {},
      subpath: subpath ? sanitizeSubpath(subpath) : subpath,
      ...fragmentSkillFilter ? { skillFilter: fragmentSkillFilter } : {}
    };
  }
  if (isWellKnownUrl(input))
    return {
      type: "well-known",
      url: input
    };
  return {
    type: "git",
    url: input,
    ...fragmentRef ? { ref: fragmentRef } : {}
  };
}
function isWellKnownUrl(input) {
  if (!input.startsWith("http://") && !input.startsWith("https://"))
    return false;
  try {
    const parsed = new URL(input);
    if ([
      "github.com",
      "gitlab.com",
      "raw.githubusercontent.com"
    ].includes(parsed.hostname))
      return false;
    if (input.endsWith(".git"))
      return false;
    return true;
  } catch {
    return false;
  }
}
var CSI_RE = /\x1b\[[\x30-\x3f]*[\x20-\x2f]*[\x40-\x7e]/g;
var OSC_RE = /\x1b\][\s\S]*?(?:\x07|\x1b\\)/g;
var DCS_PM_APC_RE = /\x1b[P^_][\s\S]*?(?:\x1b\\)/g;
var SIMPLE_ESC_RE = /\x1b[\x20-\x7e]/g;
var C1_RE = /[\x80-\x9f]/g;
var CONTROL_RE = /[\x00-\x06\x07\x08\x0b\x0c\x0d-\x1a\x1c-\x1f\x7f]/g;
function stripTerminalEscapes(str) {
  return str.replace(OSC_RE, "").replace(DCS_PM_APC_RE, "").replace(CSI_RE, "").replace(SIMPLE_ESC_RE, "").replace(C1_RE, "").replace(CONTROL_RE, "");
}
function sanitizeMetadata(str) {
  return stripTerminalEscapes(str).replace(/[\r\n]+/g, " ").trim();
}
function sanitizeName(name) {
  return name.toLowerCase().replace(/[^a-z0-9._]+/g, "-").replace(/^[.\-]+|[.\-]+$/g, "").substring(0, 255) || "unnamed-skill";
}
var silentOutput = new Writable({ write(_chunk, _encoding, callback) {
  callback();
} });
var S_STEP_ACTIVE2 = pc.green("◆");
var S_STEP_CANCEL2 = pc.red("■");
var S_STEP_SUBMIT2 = pc.green("◇");
var S_RADIO_ACTIVE2 = pc.green("●");
var S_RADIO_INACTIVE2 = pc.dim("○");
pc.green("✓");
var S_BULLET = pc.green("•");
var S_BAR2 = pc.dim("│");
var S_BAR_H2 = pc.dim("─");
var cancelSymbol = Symbol("cancel");
var home = homedir();
var configHome = xdgConfig ?? join(home, ".config");
var codexHome = process.env.CODEX_HOME?.trim() || join(home, ".codex");
var claudeHome = process.env.CLAUDE_CONFIG_DIR?.trim() || join(home, ".claude");
var vibeHome = process.env.VIBE_HOME?.trim() || join(home, ".vibe");
var hermesHome = process.env.HERMES_HOME?.trim() || join(home, ".hermes");
var autohandHome = process.env.AUTOHAND_HOME?.trim() || join(home, ".autohand");
var grokHome = process.env.GROK_HOME?.trim() || join(home, ".grok");
var sarvamHome = process.env.SARVAM_HOME?.trim() || join(home, ".sarvam");
var reasonixHome = process.env.REASONIX_HOME?.trim() || (platform() === "win32" ? join(process.env.APPDATA?.trim() || join(home, "AppData", "Roaming"), "reasonix") : join(home, ".reasonix"));
var zedAppDataHome = process.env.APPDATA?.trim();
var zedFlatpakConfigHome = process.env.FLATPAK_XDG_CONFIG_HOME?.trim();
function packageJsonHasDependency(packageJsonPath, dependencyName) {
  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    return !!(packageJson.dependencies?.[dependencyName] || packageJson.devDependencies?.[dependencyName]);
  } catch {
    return false;
  }
}
function getOpenClawGlobalSkillsDir(homeDir = home, pathExists = existsSync) {
  if (pathExists(join(homeDir, ".openclaw")))
    return join(homeDir, ".openclaw/skills");
  if (pathExists(join(homeDir, ".clawdbot")))
    return join(homeDir, ".clawdbot/skills");
  if (pathExists(join(homeDir, ".moltbot")))
    return join(homeDir, ".moltbot/skills");
  return join(homeDir, ".openclaw/skills");
}
function isZCodeInstalled(homeDir = home, pathExists = existsSync) {
  return pathExists(join(homeDir, ".zcode")) || pathExists("/Applications/ZCode.app");
}
function isKimchiInstalled(homeDir = home, pathExists = existsSync) {
  return pathExists(join(homeDir, ".config", "kimchi"));
}
function isMiniMaxCodeInstalled(homeDir = home, pathExists = existsSync) {
  return pathExists(join(homeDir, ".minimax")) || pathExists("/Applications/MiniMax Code.app");
}
function isPositAssistantInstalled(homeDir = home, pathExists = existsSync) {
  return pathExists(join(homeDir, ".posit/assistant")) || pathExists(join(homeDir, ".positai"));
}
var agents = {
  "aider-desk": {
    name: "aider-desk",
    displayName: "AiderDesk",
    skillsDir: ".aider-desk/skills",
    globalSkillsDir: join(home, ".aider-desk/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".aider-desk"));
    }
  },
  amp: {
    name: "amp",
    displayName: "Amp",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(configHome, "agents/skills"),
    detectInstalled: async () => {
      return existsSync(join(configHome, "amp"));
    }
  },
  antigravity: {
    name: "antigravity",
    displayName: "Antigravity",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".gemini/config/skills"),
    globalReadsCanonical: false,
    showInUniversalPrompt: false,
    detectInstalled: async () => {
      return existsSync(join(home, ".gemini/antigravity"));
    }
  },
  "antigravity-cli": {
    name: "antigravity-cli",
    displayName: "Antigravity CLI",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".gemini/config/skills"),
    globalReadsCanonical: false,
    showInUniversalPrompt: false,
    detectInstalled: async () => {
      return existsSync(join(home, ".gemini/antigravity-cli"));
    }
  },
  astrbot: {
    name: "astrbot",
    displayName: "AstrBot",
    skillsDir: "data/skills",
    globalSkillsDir: join(home, ".astrbot/data/skills"),
    detectInstalled: async (cwd = process.cwd()) => {
      return existsSync(join(cwd, "data/skills")) || existsSync(join(home, ".astrbot"));
    }
  },
  "autohand-code": {
    name: "autohand-code",
    displayName: "Autohand Code CLI",
    skillsDir: ".autohand/skills",
    globalSkillsDir: join(autohandHome, "skills"),
    detectInstalled: async () => {
      return existsSync(autohandHome);
    }
  },
  augment: {
    name: "augment",
    displayName: "Augment",
    skillsDir: ".augment/skills",
    globalSkillsDir: join(home, ".augment/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".augment"));
    }
  },
  bob: {
    name: "bob",
    displayName: "IBM Bob",
    skillsDir: ".bob/skills",
    globalSkillsDir: join(home, ".bob/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".bob"));
    }
  },
  "claude-code": {
    name: "claude-code",
    displayName: "Claude Code",
    skillsDir: ".claude/skills",
    globalSkillsDir: join(claudeHome, "skills"),
    createProjectSkillsDirByDefault: true,
    detectInstalled: async () => {
      return existsSync(claudeHome);
    }
  },
  openclaw: {
    name: "openclaw",
    displayName: "OpenClaw",
    skillsDir: "skills",
    globalSkillsDir: getOpenClawGlobalSkillsDir(),
    detectInstalled: async () => {
      return existsSync(join(home, ".openclaw")) || existsSync(join(home, ".clawdbot")) || existsSync(join(home, ".moltbot"));
    }
  },
  cline: {
    name: "cline",
    displayName: "Cline",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents", "skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".cline"));
    }
  },
  "codearts-agent": {
    name: "codearts-agent",
    displayName: "CodeArts Agent",
    skillsDir: ".codeartsdoer/skills",
    globalSkillsDir: join(home, ".codeartsdoer/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".codeartsdoer"));
    }
  },
  codebuddy: {
    name: "codebuddy",
    displayName: "CodeBuddy",
    skillsDir: ".codebuddy/skills",
    globalSkillsDir: join(home, ".codebuddy/skills"),
    detectInstalled: async (cwd = process.cwd()) => {
      return existsSync(join(cwd, ".codebuddy")) || existsSync(join(home, ".codebuddy"));
    }
  },
  codemaker: {
    name: "codemaker",
    displayName: "Codemaker",
    skillsDir: ".codemaker/skills",
    globalSkillsDir: join(home, ".codemaker/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".codemaker"));
    }
  },
  codestudio: {
    name: "codestudio",
    displayName: "Code Studio",
    skillsDir: ".codestudio/skills",
    globalSkillsDir: join(home, ".codestudio/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".codestudio"));
    }
  },
  codex: {
    name: "codex",
    displayName: "Codex",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents", "skills"),
    detectInstalled: async () => {
      return existsSync(codexHome) || existsSync("/etc/codex");
    }
  },
  "command-code": {
    name: "command-code",
    displayName: "Command Code",
    skillsDir: ".commandcode/skills",
    globalSkillsDir: join(home, ".commandcode/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".commandcode"));
    }
  },
  continue: {
    name: "continue",
    displayName: "Continue",
    skillsDir: ".continue/skills",
    globalSkillsDir: join(home, ".continue/skills"),
    detectInstalled: async (cwd = process.cwd()) => {
      return existsSync(join(cwd, ".continue")) || existsSync(join(home, ".continue"));
    }
  },
  cortex: {
    name: "cortex",
    displayName: "Cortex Code",
    skillsDir: ".cortex/skills",
    globalSkillsDir: join(home, ".snowflake/cortex/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".snowflake/cortex"));
    }
  },
  crush: {
    name: "crush",
    displayName: "Crush",
    skillsDir: ".crush/skills",
    globalSkillsDir: join(home, ".config/crush/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".config/crush"));
    }
  },
  cursor: {
    name: "cursor",
    displayName: "Cursor",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".cursor/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".cursor"));
    }
  },
  deepagents: {
    name: "deepagents",
    displayName: "Deep Agents",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".deepagents/agent/skills"),
    showInUniversalPrompt: false,
    detectInstalled: async () => {
      return existsSync(join(home, ".deepagents"));
    }
  },
  devin: {
    name: "devin",
    displayName: "Devin for Terminal",
    skillsDir: ".devin/skills",
    globalSkillsDir: join(configHome, "devin/skills"),
    detectInstalled: async () => {
      return existsSync(join(configHome, "devin"));
    }
  },
  dexto: {
    name: "dexto",
    displayName: "Dexto",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents/skills"),
    showInUniversalPrompt: false,
    detectInstalled: async () => {
      return existsSync(join(home, ".dexto"));
    }
  },
  droid: {
    name: "droid",
    displayName: "Droid",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".factory/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".factory"));
    }
  },
  eve: {
    name: "eve",
    displayName: "Eve",
    skillsDir: "agent/skills",
    globalSkillsDir: undefined,
    detectInstalled: async (cwd = process.cwd()) => {
      return existsSync(join(cwd, "agent")) && packageJsonHasDependency(join(cwd, "package.json"), "eve");
    }
  },
  firebender: {
    name: "firebender",
    displayName: "Firebender",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".firebender/skills"),
    showInUniversalPrompt: false,
    detectInstalled: async () => {
      return existsSync(join(home, ".firebender"));
    }
  },
  forgecode: {
    name: "forgecode",
    displayName: "ForgeCode",
    skillsDir: ".forge/skills",
    globalSkillsDir: join(home, ".forge/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".forge"));
    }
  },
  fx: {
    name: "fx",
    displayName: "fx",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".fx"));
    }
  },
  "gemini-cli": {
    name: "gemini-cli",
    displayName: "Gemini CLI",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".gemini/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".gemini"));
    }
  },
  "github-copilot": {
    name: "github-copilot",
    displayName: "GitHub Copilot",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".copilot/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".copilot"));
    }
  },
  goose: {
    name: "goose",
    displayName: "Goose",
    skillsDir: ".goose/skills",
    globalSkillsDir: join(configHome, "goose/skills"),
    detectInstalled: async () => {
      return existsSync(join(configHome, "goose"));
    }
  },
  grok: {
    name: "grok",
    displayName: "Grok Build",
    skillsDir: ".grok/skills",
    globalSkillsDir: join(grokHome, "skills"),
    detectInstalled: async () => {
      return existsSync(grokHome);
    }
  },
  "hermes-agent": {
    name: "hermes-agent",
    displayName: "Hermes Agent",
    skillsDir: ".hermes/skills",
    globalSkillsDir: join(hermesHome, "skills"),
    detectInstalled: async () => {
      return existsSync(hermesHome);
    }
  },
  "inference-sh": {
    name: "inference-sh",
    displayName: "inference.sh",
    skillsDir: ".inferencesh/skills",
    globalSkillsDir: join(home, ".inferencesh/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".inferencesh"));
    }
  },
  jazz: {
    name: "jazz",
    displayName: "Jazz",
    skillsDir: ".jazz/skills",
    globalSkillsDir: join(home, ".jazz/skills"),
    detectInstalled: async (cwd = process.cwd()) => {
      return existsSync(join(home, ".jazz")) || existsSync(join(cwd, ".jazz"));
    }
  },
  junie: {
    name: "junie",
    displayName: "Junie",
    skillsDir: ".junie/skills",
    globalSkillsDir: join(home, ".junie/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".junie"));
    }
  },
  "iflow-cli": {
    name: "iflow-cli",
    displayName: "iFlow CLI",
    skillsDir: ".iflow/skills",
    globalSkillsDir: join(home, ".iflow/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".iflow"));
    }
  },
  kilo: {
    name: "kilo",
    displayName: "Kilo Code",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".kilo/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".kilo")) || existsSync(join(home, ".kilocode"));
    }
  },
  kimchi: {
    name: "kimchi",
    displayName: "Kimchi",
    skillsDir: ".kimchi/skills",
    globalSkillsDir: join(home, ".config", "kimchi", "harness", "skills"),
    detectInstalled: async () => {
      return isKimchiInstalled();
    }
  },
  "kimi-code-cli": {
    name: "kimi-code-cli",
    displayName: "Kimi Code CLI",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".kimi-code")) || existsSync(join(home, ".kimi"));
    }
  },
  "kiro-cli": {
    name: "kiro-cli",
    displayName: "Kiro CLI",
    skillsDir: ".kiro/skills",
    globalSkillsDir: join(home, ".kiro/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".kiro"));
    }
  },
  kode: {
    name: "kode",
    displayName: "Kode",
    skillsDir: ".kode/skills",
    globalSkillsDir: join(home, ".kode/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".kode"));
    }
  },
  lingma: {
    name: "lingma",
    displayName: "Lingma",
    skillsDir: ".lingma/skills",
    globalSkillsDir: join(home, ".lingma/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".lingma"));
    }
  },
  loaf: {
    name: "loaf",
    displayName: "Loaf",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents/skills"),
    showInUniversalPrompt: false,
    detectInstalled: async () => {
      return existsSync(join(home, ".loaf"));
    }
  },
  mcpjam: {
    name: "mcpjam",
    displayName: "MCPJam",
    skillsDir: ".mcpjam/skills",
    globalSkillsDir: join(home, ".mcpjam/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".mcpjam"));
    }
  },
  "minimax-code": {
    name: "minimax-code",
    displayName: "MiniMax Code",
    skillsDir: ".minimax/skills",
    globalSkillsDir: join(home, ".minimax/skills"),
    detectInstalled: async () => {
      return isMiniMaxCodeInstalled();
    }
  },
  "mistral-vibe": {
    name: "mistral-vibe",
    displayName: "Mistral Vibe",
    skillsDir: ".vibe/skills",
    globalSkillsDir: join(vibeHome, "skills"),
    detectInstalled: async () => {
      return existsSync(vibeHome);
    }
  },
  moxby: {
    name: "moxby",
    displayName: "Moxby",
    skillsDir: ".moxby/skills",
    globalSkillsDir: join(home, ".moxby/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".moxby"));
    }
  },
  mux: {
    name: "mux",
    displayName: "Mux",
    skillsDir: ".mux/skills",
    globalSkillsDir: join(home, ".mux/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".mux"));
    }
  },
  opencode: {
    name: "opencode",
    displayName: "OpenCode",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(configHome, "opencode/skills"),
    detectInstalled: async () => {
      return existsSync(join(configHome, "opencode"));
    }
  },
  openhands: {
    name: "openhands",
    displayName: "OpenHands",
    skillsDir: ".openhands/skills",
    globalSkillsDir: join(home, ".openhands/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".openhands"));
    }
  },
  ona: {
    name: "ona",
    displayName: "Ona",
    skillsDir: ".ona/skills",
    globalSkillsDir: join(home, ".ona/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".ona"));
    }
  },
  pi: {
    name: "pi",
    displayName: "Pi",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".pi/agent"));
    }
  },
  "posit-assistant": {
    name: "posit-assistant",
    displayName: "Posit Assistant",
    skillsDir: ".posit/assistant/skills",
    globalSkillsDir: join(home, ".posit/assistant/skills"),
    detectInstalled: async () => {
      return isPositAssistantInstalled();
    }
  },
  qoder: {
    name: "qoder",
    displayName: "Qoder",
    skillsDir: ".qoder/skills",
    globalSkillsDir: join(home, ".qoder/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".qoder"));
    }
  },
  "qoder-cn": {
    name: "qoder-cn",
    displayName: "Qoder CN",
    skillsDir: ".qoder/skills",
    globalSkillsDir: join(home, ".qoder-cn/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".qoder-cn"));
    }
  },
  "qwen-code": {
    name: "qwen-code",
    displayName: "Qwen Code",
    skillsDir: ".qwen/skills",
    globalSkillsDir: join(home, ".qwen/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".qwen"));
    }
  },
  replit: {
    name: "replit",
    displayName: "Replit",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(configHome, "agents/skills"),
    showInUniversalList: false,
    detectInstalled: async (cwd = process.cwd()) => {
      return existsSync(join(cwd, ".replit"));
    }
  },
  reasonix: {
    name: "reasonix",
    displayName: "Reasonix",
    skillsDir: ".reasonix/skills",
    globalSkillsDir: join(reasonixHome, "skills"),
    detectInstalled: async () => {
      return existsSync(reasonixHome);
    }
  },
  rovodev: {
    name: "rovodev",
    displayName: "Rovo Dev",
    skillsDir: ".rovodev/skills",
    globalSkillsDir: join(home, ".rovodev/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".rovodev"));
    }
  },
  roo: {
    name: "roo",
    displayName: "Roo Code",
    skillsDir: ".roo/skills",
    globalSkillsDir: join(home, ".roo/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".roo"));
    }
  },
  "sarvam-code": {
    name: "sarvam-code",
    displayName: "Sarvam Code",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents/skills"),
    showInUniversalPrompt: false,
    detectInstalled: async () => {
      return existsSync(sarvamHome);
    }
  },
  "tabnine-cli": {
    name: "tabnine-cli",
    displayName: "Tabnine CLI",
    skillsDir: ".tabnine/agent/skills",
    globalSkillsDir: join(home, ".tabnine/agent/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".tabnine"));
    }
  },
  terramind: {
    name: "terramind",
    displayName: "Terramind",
    skillsDir: ".terramind/skills",
    globalSkillsDir: join(home, ".terramind/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".terramind"));
    }
  },
  tinycloud: {
    name: "tinycloud",
    displayName: "Tinycloud",
    skillsDir: ".tinycloud/skills",
    globalSkillsDir: join(home, ".tinycloud/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".tinycloud"));
    }
  },
  trae: {
    name: "trae",
    displayName: "Trae",
    skillsDir: ".trae/skills",
    globalSkillsDir: join(home, ".trae/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".trae"));
    }
  },
  "trae-cn": {
    name: "trae-cn",
    displayName: "Trae CN",
    skillsDir: ".trae/skills",
    globalSkillsDir: join(home, ".trae-cn/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".trae-cn"));
    }
  },
  warp: {
    name: "warp",
    displayName: "Warp",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".warp"));
    }
  },
  windsurf: {
    name: "windsurf",
    displayName: "Windsurf",
    skillsDir: ".windsurf/skills",
    globalSkillsDir: join(home, ".codeium/windsurf/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".codeium/windsurf"));
    }
  },
  zed: {
    name: "zed",
    displayName: "Zed",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(home, ".agents/skills"),
    detectInstalled: async () => {
      return existsSync(join(configHome, "zed")) || !!zedAppDataHome && existsSync(join(zedAppDataHome, "Zed")) || !!zedFlatpakConfigHome && existsSync(join(zedFlatpakConfigHome, "zed"));
    }
  },
  zcode: {
    name: "zcode",
    displayName: "ZCode",
    skillsDir: ".zcode/skills",
    globalSkillsDir: join(home, ".zcode/skills"),
    detectInstalled: async () => {
      return isZCodeInstalled();
    }
  },
  zencoder: {
    name: "zencoder",
    displayName: "Zencoder",
    skillsDir: ".zencoder/skills",
    globalSkillsDir: join(home, ".zencoder/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".zencoder"));
    }
  },
  zenflow: {
    name: "zenflow",
    displayName: "Zenflow",
    skillsDir: ".zencoder/skills",
    globalSkillsDir: join(home, ".zencoder/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".zencoder"));
    }
  },
  neovate: {
    name: "neovate",
    displayName: "Neovate",
    skillsDir: ".neovate/skills",
    globalSkillsDir: join(home, ".neovate/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".neovate"));
    }
  },
  pochi: {
    name: "pochi",
    displayName: "Pochi",
    skillsDir: ".pochi/skills",
    globalSkillsDir: join(home, ".pochi/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".pochi"));
    }
  },
  promptscript: {
    name: "promptscript",
    displayName: "PromptScript",
    skillsDir: ".agents/skills",
    globalSkillsDir: undefined,
    showInUniversalPrompt: false,
    detectInstalled: async (cwd = process.cwd()) => {
      return existsSync(join(cwd, ".promptscript")) || existsSync(join(cwd, "promptscript.yaml"));
    }
  },
  adal: {
    name: "adal",
    displayName: "AdaL",
    skillsDir: ".adal/skills",
    globalSkillsDir: join(home, ".adal/skills"),
    detectInstalled: async () => {
      return existsSync(join(home, ".adal"));
    }
  },
  universal: {
    name: "universal",
    displayName: "Universal",
    skillsDir: ".agents/skills",
    globalSkillsDir: join(configHome, "agents/skills"),
    showInUniversalList: false,
    detectInstalled: async () => false
  }
};
var LEGACY_AGENT_PROJECT_SKILL_DIRS = [
  ".cline/skills",
  ".codex/skills",
  ".factory/skills",
  ".github/skills",
  ".kilo/skills",
  ".kilocode/skills",
  ".opencode/skills",
  ".pi/skills"
];
var AGENT_PROJECT_SKILL_DIRS = [.../* @__PURE__ */ new Set([...Object.values(agents).map((agent) => agent.skillsDir), ...LEGACY_AGENT_PROJECT_SKILL_DIRS])].filter((dir) => dir !== "skills").sort();
async function detectInstalledAgents(cwd = process.cwd()) {
  return (await Promise.all(Object.entries(agents).map(async ([type, config]) => ({
    type,
    installed: await config.detectInstalled(cwd)
  })))).filter((r3) => r3.installed).map((r3) => r3.type);
}
var EVE_SUBAGENTS_DIR = join("agent", "subagents");
function getEveSubagents(cwd = process.cwd()) {
  const dir = join(cwd, EVE_SUBAGENTS_DIR);
  if (!existsSync(dir))
    return [];
  try {
    return readdirSync(dir, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
  } catch {
    return [];
  }
}
function getUniversalAgents() {
  return Object.entries(agents).filter(([_4, config]) => config.skillsDir === ".agents/skills" && config.showInUniversalList !== false).map(([type]) => type);
}
function isUniversalAgent(type) {
  return agents[type].skillsDir === ".agents/skills";
}
function readsCanonicalGlobally(type) {
  return isUniversalAgent(type) && agents[type].globalReadsCanonical !== false;
}
function parseFrontmatter(raw) {
  const match = raw.match(/^\uFEFF?---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match)
    return {
      data: {},
      content: raw
    };
  return {
    data: $parse(match[1]) ?? {},
    content: match[2] ?? ""
  };
}
function isContainedIn(targetPath, basePath) {
  const normalizedBase = normalize2(resolve(basePath));
  const normalizedTarget = normalize2(resolve(targetPath));
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase;
}
function isValidRelativePath(path2) {
  return path2.startsWith("./");
}
async function getPluginSkillPaths(basePath) {
  const searchDirs = [];
  const addPluginSkillPaths = (pluginBase, skills) => {
    if (!isContainedIn(pluginBase, basePath))
      return;
    if (skills && skills.length > 0)
      for (const skillPath of skills) {
        if (!isValidRelativePath(skillPath))
          continue;
        const skillDir = dirname(join(pluginBase, skillPath));
        if (isContainedIn(skillDir, basePath))
          searchDirs.push(skillDir);
      }
    searchDirs.push(join(pluginBase, "skills"));
  };
  try {
    const content = await readFile(join(basePath, ".claude-plugin/marketplace.json"), "utf-8");
    const manifest = JSON.parse(content);
    const pluginRoot = manifest.metadata?.pluginRoot;
    if (pluginRoot === undefined || isValidRelativePath(pluginRoot))
      for (const plugin of manifest.plugins ?? []) {
        if (typeof plugin.source !== "string" && plugin.source !== undefined)
          continue;
        if (plugin.source !== undefined && !isValidRelativePath(plugin.source))
          continue;
        addPluginSkillPaths(join(basePath, pluginRoot ?? "", plugin.source ?? ""), plugin.skills);
      }
  } catch {}
  try {
    const content = await readFile(join(basePath, ".claude-plugin/plugin.json"), "utf-8");
    addPluginSkillPaths(basePath, JSON.parse(content).skills);
  } catch {}
  return searchDirs;
}
async function getPluginGroupings(basePath) {
  const groupings = /* @__PURE__ */ new Map;
  try {
    const content = await readFile(join(basePath, ".claude-plugin/marketplace.json"), "utf-8");
    const manifest = JSON.parse(content);
    const pluginRoot = manifest.metadata?.pluginRoot;
    if (pluginRoot === undefined || isValidRelativePath(pluginRoot))
      for (const plugin of manifest.plugins ?? []) {
        if (!plugin.name)
          continue;
        if (typeof plugin.source !== "string" && plugin.source !== undefined)
          continue;
        if (plugin.source !== undefined && !isValidRelativePath(plugin.source))
          continue;
        const pluginBase = join(basePath, pluginRoot ?? "", plugin.source ?? "");
        if (!isContainedIn(pluginBase, basePath))
          continue;
        if (plugin.skills && plugin.skills.length > 0)
          for (const skillPath of plugin.skills) {
            if (!isValidRelativePath(skillPath))
              continue;
            const skillDir = join(pluginBase, skillPath);
            if (isContainedIn(skillDir, basePath))
              groupings.set(resolve(skillDir), plugin.name);
          }
      }
  } catch {}
  try {
    const content = await readFile(join(basePath, ".claude-plugin/plugin.json"), "utf-8");
    const manifest = JSON.parse(content);
    if (manifest.name && manifest.skills && manifest.skills.length > 0)
      for (const skillPath of manifest.skills) {
        if (!isValidRelativePath(skillPath))
          continue;
        const skillDir = join(basePath, skillPath);
        if (isContainedIn(skillDir, basePath))
          groupings.set(resolve(skillDir), manifest.name);
      }
  } catch {}
  return groupings;
}
var SKILLS_SH_CONFIG_FILE = "skills.sh.json";
function parseSkillsShPaths(content) {
  let config;
  try {
    config = JSON.parse(content);
  } catch {
    return [];
  }
  if (typeof config !== "object" || config === null || Array.isArray(config))
    return [];
  const paths = config.paths;
  if (!Array.isArray(paths))
    return [];
  const result = [];
  for (const entry of paths) {
    if (typeof entry !== "string" || !entry.startsWith("./"))
      continue;
    if (entry.includes("\\"))
      continue;
    const normalized = posix.normalize(entry).replace(/\/+$/, "");
    if (normalized === "." || normalized === "" || normalized === "..")
      continue;
    if (normalized.startsWith("../") || posix.isAbsolute(normalized))
      continue;
    if (!result.includes(normalized))
      result.push(normalized);
  }
  return result;
}
async function getSkillsShSearchDirs(basePath) {
  let content;
  try {
    content = await readFile(join(basePath, SKILLS_SH_CONFIG_FILE), "utf-8");
  } catch {
    return [];
  }
  return parseSkillsShPaths(content).map((path2) => join(basePath, path2));
}
var EXCLUDE_FILES = /* @__PURE__ */ new Set(["metadata.json"]);
var EXCLUDE_DIRS = /* @__PURE__ */ new Set([
  ".git",
  "__pycache__",
  "__pypackages__"
]);
function isExcluded(name, isDirectory = false) {
  if (EXCLUDE_FILES.has(name))
    return true;
  if (isDirectory && EXCLUDE_DIRS.has(name))
    return true;
  return false;
}
function isExcludedPath(relativePath) {
  const parts = relativePath.split(/[\\/]/).filter(Boolean);
  return parts.some((part, index) => isExcluded(part, index < parts.length - 1));
}
function hashSkillFiles(files) {
  const entries = files.map((file) => ({
    path: Buffer.from(file.path.split("\\").join("/"), "utf-8"),
    content: normalizeLineEndings(typeof file.content === "string" ? Buffer.from(file.content, "utf-8") : file.content)
  }));
  entries.sort((a2, b4) => Buffer.compare(a2.path, b4.path));
  const hash = createHash("sha256");
  for (const { path: path2, content } of entries) {
    hash.update(path2);
    hash.update("\x00");
    hash.update(String(content.length));
    hash.update("\x00");
    hash.update(content);
  }
  return hash.digest("hex");
}
function normalizeLineEndings(content) {
  if (content.includes(0) || !content.includes(`\r
`))
    return content;
  return Buffer.from(content.toString("latin1").replaceAll(`\r
`, `
`), "latin1");
}
async function computeSkillFolderHash(skillDir) {
  const root = await realpath(skillDir);
  const files = [];
  await collectFiles(skillDir, "", root, /* @__PURE__ */ new Set, files);
  return hashSkillFiles(files);
}
async function collectFiles(dir, prefix, root, ancestors, results) {
  const realDir = await realpath(dir);
  if (ancestors.has(realDir))
    return;
  const branch = new Set(ancestors).add(realDir);
  const entries = await readdir(dir, { withFileTypes: true });
  await Promise.all(entries.map(async (entry) => {
    if (isExcluded(entry.name, entry.isDirectory()))
      return;
    const fullPath = join(dir, entry.name);
    const path2 = prefix + entry.name;
    let isDirectory = entry.isDirectory();
    if (entry.isSymbolicLink()) {
      const target = await realpath(fullPath).catch(() => null);
      if (!target || target !== root && !target.startsWith(root + sep))
        return;
      isDirectory = (await stat(target)).isDirectory();
      if (isDirectory && isExcluded(entry.name, true))
        return;
    } else if (!isDirectory && !entry.isFile())
      return;
    if (isDirectory)
      await collectFiles(fullPath, `${path2}/`, root, branch, results);
    else
      results.push({
        path: path2,
        content: await readFile(fullPath)
      });
  }));
}
var AGENTS_DIR$1 = ".agents";
var SKILLS_SUBDIR = "skills";
var LOCAL_LOCK_FILE = "skills-lock.json";
var CURRENT_VERSION$1 = 2;
function getLocalLockPath(cwd) {
  return join(cwd || process.cwd(), LOCAL_LOCK_FILE);
}
function getInstalledSkillDir(skillName, cwd) {
  return join(cwd || process.cwd(), AGENTS_DIR$1, SKILLS_SUBDIR, sanitizeName(skillName));
}
async function readLocalLock(cwd, { persistMigration = false } = {}) {
  const lockDir = cwd || process.cwd();
  const lockPath = getLocalLockPath(lockDir);
  let content;
  try {
    content = await readFile(lockPath, "utf-8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return createEmptyLocalLock();
    throw error;
  }
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    const reason = error instanceof Error ? error.message : "not valid JSON";
    throw diagnostics.SKILLS_INVALID_LOCAL_LOCK({
      path: lockPath,
      reason,
      cause: error
    });
  }
  if (!isLocalLockShape(parsed))
    throw diagnostics.SKILLS_INVALID_LOCAL_LOCK({
      path: lockPath,
      reason: 'expected an object with "version" and "skills"'
    });
  if (parsed.version !== CURRENT_VERSION$1 && parsed.version !== 1)
    throw diagnostics.SKILLS_INVALID_LOCAL_LOCK({
      path: lockPath,
      reason: `unsupported lock version ${parsed.version} (expected ${CURRENT_VERSION$1})`
    });
  for (const entry of Object.values(parsed.skills))
    if (entry.sourceType === "local" && !isAbsolute(entry.source))
      entry.source = resolve(lockDir, entry.source);
  if (parsed.version === 1) {
    await Promise.all(Object.entries(parsed.skills).map(async ([name, entry]) => {
      entry.computedHash = await migrateComputedHash(getInstalledSkillDir(name, lockDir), entry.computedHash);
    }));
    parsed.version = CURRENT_VERSION$1;
    if (persistMigration)
      await writeLocalLock(parsed, lockDir);
  }
  return parsed;
}
async function migrateComputedHash(dir, v1Hash) {
  if (!v1Hash || !existsSync(join(dir, "SKILL.md")))
    return "";
  try {
    if (await computeLegacySkillFolderHash(dir) !== v1Hash)
      return "";
    return await computeSkillFolderHash(dir);
  } catch {
    return "";
  }
}
async function computeLegacySkillFolderHash(skillDir) {
  const files = [];
  const collect = async (currentDir) => {
    const entries = await readdir(currentDir, { withFileTypes: true });
    await Promise.all(entries.map(async (entry) => {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".git" || entry.name === "node_modules")
          return;
        await collect(fullPath);
      } else if (entry.isFile()) {
        const relativePath = relative(skillDir, fullPath).split("\\").join("/");
        files.push({
          relativePath,
          content: await readFile(fullPath)
        });
      }
    }));
  };
  await collect(skillDir);
  files.sort((a2, b4) => a2.relativePath.localeCompare(b4.relativePath));
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(file.relativePath);
    hash.update(file.content);
  }
  return hash.digest("hex");
}
function isLocalLockShape(value) {
  return typeof value === "object" && value !== null && "version" in value && typeof value.version === "number" && "skills" in value && typeof value.skills === "object" && value.skills !== null;
}
async function writeLocalLock(lock, cwd) {
  const lockDir = cwd || process.cwd();
  const lockPath = getLocalLockPath(lockDir);
  const sortedSkills = Object.fromEntries(Object.keys(lock.skills).sort().map((key) => {
    const entry = lock.skills[key];
    return [key, entry.sourceType === "local" ? {
      ...entry,
      source: getPortableLocalSource(entry.source, lockDir)
    } : entry];
  }));
  const sorted = {
    version: lock.version,
    skills: sortedSkills
  };
  const content = JSON.stringify(sorted, null, 2) + `
`;
  await writeFile(lockPath, content, "utf-8");
}
function getPortableLocalSource(source, lockDir) {
  const absoluteSource = isAbsolute(source) ? source : resolve(lockDir, source);
  const relativeSource = relative(lockDir, absoluteSource);
  if (isAbsolute(relativeSource))
    return absoluteSource.split(sep).join("/");
  const portableSource = relativeSource.split(sep).join("/");
  if (!portableSource)
    return ".";
  if (portableSource === ".." || portableSource.startsWith("../"))
    return portableSource;
  return `./${portableSource}`;
}
async function addSkillToLocalLock(skillName, entry, cwd) {
  const lock = await readLocalLock(cwd);
  lock.skills = {
    ...lock.skills,
    [skillName]: entry
  };
  await writeLocalLock(lock, cwd);
}
async function removeSkillFromLocalLock(skillName, cwd) {
  const lock = await readLocalLock(cwd);
  if (!Object.hasOwn(lock.skills, skillName))
    return false;
  delete lock.skills[skillName];
  await writeLocalLock(lock, cwd);
  return true;
}
function createEmptyLocalLock() {
  return {
    version: CURRENT_VERSION$1,
    skills: {}
  };
}
var handlers = new AsyncLocalStorage;
function warn(warning) {
  const handler = handlers.getStore();
  if (handler)
    handler(warning);
  else
    console.warn(formatError(warning));
}
function withWarnings(handler, fn2) {
  return handlers.run(handler ?? (() => {}), fn2);
}
var SKIP_DIRS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  "__pycache__"
];
function normalizeSkillName(name) {
  return name.toLowerCase().replace(/[\s_]+/g, "-");
}
function normalizeRelativePath(path2) {
  return path2.split(sep).join("/").replace(/\/+/g, "/");
}
function isRecord$1(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function shouldInstallInternalSkills() {
  const envValue = process.env.INSTALL_INTERNAL_SKILLS;
  return envValue === "1" || envValue === "true";
}
function isInternalSkill(metadata) {
  if (!isRecord$1(metadata))
    return false;
  const internal = metadata.internal;
  return internal === true || internal === "true" || internal === "1";
}
async function hasSkillMd(dir) {
  try {
    const skillPath = join(dir, "SKILL.md");
    return (await stat(skillPath)).isFile();
  } catch {
    return false;
  }
}
function warnSkippedSkill(skillMdPath, reason) {
  warn(diagnostics.SKILLS_SKILL_SKIPPED({
    path: sanitizeMetadata(skillMdPath),
    reason: stripTerminalEscapes(reason)
  }));
}
async function parseSkillMd(skillMdPath, options) {
  let content;
  try {
    content = await readFile(skillMdPath, "utf-8");
  } catch (err) {
    warnSkippedSkill(skillMdPath, `failed to read file: ${err.message}`);
    return null;
  }
  let data;
  try {
    ({ data } = parseFrontmatter(content));
  } catch (err) {
    warnSkippedSkill(skillMdPath, `YAML parse error: ${err.message}`);
    return null;
  }
  if (!data.name || !data.description) {
    const missing = [];
    if (!data.name)
      missing.push("name");
    if (!data.description)
      missing.push("description");
    warnSkippedSkill(skillMdPath, `missing required frontmatter field(s): ${missing.join(", ")}`);
    return null;
  }
  if (typeof data.name !== "string" || typeof data.description !== "string") {
    warnSkippedSkill(skillMdPath, `frontmatter "name" and "description" must be strings (got ${typeof data.name} and ${typeof data.description})`);
    return null;
  }
  const name = sanitizeMetadata(data.name);
  const description = sanitizeMetadata(data.description);
  if (!name || !description) {
    const empty = [];
    if (!name)
      empty.push("name");
    if (!description)
      empty.push("description");
    warnSkippedSkill(skillMdPath, `empty required frontmatter field(s): ${empty.join(", ")}`);
    return null;
  }
  const metadata = isRecord$1(data.metadata) ? data.metadata : undefined;
  if (isInternalSkill(metadata) && !shouldInstallInternalSkills() && !options?.includeInternal)
    return null;
  return {
    name,
    description,
    path: dirname(skillMdPath),
    rawContent: content,
    metadata
  };
}
async function findSkillDirs(dir, depth = 0, maxDepth = 5) {
  if (depth > maxDepth)
    return [];
  try {
    const [hasSkill, entries] = await Promise.all([hasSkillMd(dir), readdir(dir, { withFileTypes: true }).catch(() => [])]);
    const currentDir = hasSkill ? [dir] : [];
    const subDirResults = await Promise.all(entries.filter((entry) => entry.isDirectory() && !SKIP_DIRS.includes(entry.name)).map((entry) => findSkillDirs(join(dir, entry.name), depth + 1, maxDepth)));
    return [...currentDir, ...subDirResults.flat()];
  } catch {
    return [];
  }
}
function isSubpathSafe(basePath, subpath) {
  const normalizedBase = normalize2(resolve(basePath));
  const normalizedTarget = normalize2(resolve(join(basePath, subpath)));
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase;
}
async function sourceLockedSkillNames(basePath) {
  try {
    return Object.keys((await readLocalLock(basePath)).skills);
  } catch (error) {
    if (isDiagnostic(error, "SKILLS_INVALID_LOCAL_LOCK"))
      return [];
    throw error;
  }
}
async function discoverSkills(basePath, subpath, options) {
  const skills = [];
  const seenNames = /* @__PURE__ */ new Set;
  const parsedSkillPaths = /* @__PURE__ */ new Set;
  const lockedSkillNames = new Set((await sourceLockedSkillNames(basePath)).map(normalizeSkillName));
  if (subpath && !isSubpathSafe(basePath, subpath))
    throw diagnostics.SKILLS_SUBPATH_OUTSIDE_REPO({ subpath });
  const searchPath = subpath ? join(basePath, subpath) : basePath;
  const pluginGroupings = await getPluginGroupings(searchPath);
  const enhanceSkill = (skill) => {
    const resolvedPath = resolve(skill.path);
    if (pluginGroupings.has(resolvedPath))
      skill.pluginName = pluginGroupings.get(resolvedPath);
    return skill;
  };
  const isInstalledProjectSkill = (skill) => {
    if (lockedSkillNames.size === 0)
      return false;
    const relativeDir = normalizeRelativePath(relative(basePath, skill.path));
    if (!AGENT_PROJECT_SKILL_DIRS.some((dir) => relativeDir === dir || relativeDir.startsWith(`${dir}/`)))
      return false;
    const skillName = normalizeSkillName(skill.name);
    const directoryName = normalizeSkillName(basename(skill.path));
    return lockedSkillNames.has(skillName) || lockedSkillNames.has(directoryName);
  };
  const parseSkillAt = async (skillDir) => {
    const skillMdPath = resolve(skillDir, "SKILL.md");
    if (parsedSkillPaths.has(skillMdPath))
      return null;
    parsedSkillPaths.add(skillMdPath);
    return parseSkillMd(skillMdPath, options);
  };
  if (await hasSkillMd(searchPath)) {
    let skill = await parseSkillAt(searchPath);
    if (skill) {
      if (!isInstalledProjectSkill(skill)) {
        skill = enhanceSkill(skill);
        skills.push(skill);
        seenNames.add(skill.name);
        if (!options?.fullDepth)
          return skills;
      }
    }
  }
  const prioritySearchDirs = [
    searchPath,
    join(searchPath, "skills"),
    join(searchPath, "skills/.curated"),
    join(searchPath, "skills/.experimental"),
    join(searchPath, "skills/.system"),
    ...AGENT_PROJECT_SKILL_DIRS.map((dir) => join(searchPath, dir))
  ];
  prioritySearchDirs.push(...await getSkillsShSearchDirs(searchPath));
  const deepContainerDirs = new Set(prioritySearchDirs.slice(1));
  prioritySearchDirs.push(...await getPluginSkillPaths(searchPath));
  const tryAddSkillAt = async (skillDir) => {
    if (!await hasSkillMd(skillDir))
      return false;
    let skill = await parseSkillAt(skillDir);
    if (!skill || !options?.includeDuplicateNames && seenNames.has(skill.name))
      return true;
    if (isInstalledProjectSkill(skill))
      return true;
    skill = enhanceSkill(skill);
    skills.push(skill);
    seenNames.add(skill.name);
    return true;
  };
  const walkSkillDirs = async (dir, maxDepth, depth = 1) => {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (!entry.isDirectory())
          continue;
        const childDir = join(dir, entry.name);
        if (await tryAddSkillAt(childDir) || depth >= maxDepth || SKIP_DIRS.includes(entry.name))
          continue;
        await walkSkillDirs(childDir, maxDepth, depth + 1);
      }
    } catch {}
  };
  for (const dir of prioritySearchDirs)
    await walkSkillDirs(dir, deepContainerDirs.has(dir) ? 3 : 1);
  if (skills.length === 0 || options?.fullDepth) {
    const allSkillDirs = await findSkillDirs(searchPath);
    for (const skillDir of allSkillDirs) {
      let skill = await parseSkillAt(skillDir);
      if (skill && (options?.includeDuplicateNames || !seenNames.has(skill.name)) && !isInstalledProjectSkill(skill)) {
        skill = enhanceSkill(skill);
        skills.push(skill);
        seenNames.add(skill.name);
      }
    }
  }
  return skills;
}
function getSkillDisplayName(skill) {
  return skill.name || basename(skill.path);
}
function filterSkills(skills, inputNames) {
  const selected = /* @__PURE__ */ new Set;
  for (const input of inputNames) {
    const exact = skills.filter((skill) => getSkillDisplayName(skill).toLowerCase() === input.toLowerCase());
    const matches = exact.length ? exact : skills.filter((skill) => normalizeSkillName(getSkillDisplayName(skill)) === normalizeSkillName(input));
    for (const skill of matches)
      selected.add(skill);
  }
  return skills.filter((skill) => selected.has(skill));
}
function isPathSafe$1(basePath, targetPath) {
  const normalizedBase = normalize2(resolve(basePath));
  const normalizedTarget = normalize2(resolve(targetPath));
  return normalizedTarget.startsWith(normalizedBase + sep) || normalizedTarget === normalizedBase;
}
function pathsOverlap(pathA, pathB) {
  return isPathSafe$1(pathA, pathB) || isPathSafe$1(pathB, pathA);
}
function shouldSkipProjectAgentSymlink(agentType, isGlobal, cwd, createMissingAgentRoot) {
  if (isGlobal || isUniversalAgent(agentType) || createMissingAgentRoot || agents[agentType].createProjectSkillsDirByDefault)
    return false;
  const agentRoot = agents[agentType].skillsDir.split("/")[0];
  return !existsSync(join(cwd, agentRoot));
}
async function isDirEntryOrSymlinkToDir(entry, entryPath) {
  if (entry.isDirectory())
    return true;
  if (!entry.isSymbolicLink())
    return false;
  try {
    return (await stat(entryPath)).isDirectory();
  } catch {
    return false;
  }
}
function getCanonicalSkillsDir(global, cwd) {
  const baseDir = global ? homedir() : cwd || process.cwd();
  return join(baseDir, AGENTS_DIR$1, SKILLS_SUBDIR);
}
function getEveSubagentSkillsDir(subagent, cwd) {
  const baseDir = cwd || process.cwd();
  return join(baseDir, EVE_SUBAGENTS_DIR, sanitizeName(subagent), "skills");
}
function getAgentBaseDir(agentType, global, cwd, eveSubagent) {
  if (global ? readsCanonicalGlobally(agentType) : isUniversalAgent(agentType))
    return getCanonicalSkillsDir(global, cwd);
  if (agentType === "eve" && eveSubagent)
    return getEveSubagentSkillsDir(eveSubagent, cwd);
  const agent = agents[agentType];
  const baseDir = global ? homedir() : cwd || process.cwd();
  if (global) {
    if (agent.globalSkillsDir === undefined)
      return join(baseDir, agent.skillsDir);
    return agent.globalSkillsDir;
  }
  return join(baseDir, agent.skillsDir);
}
function resolveSymlinkTarget(linkPath, linkTarget) {
  return resolve(dirname(linkPath), linkTarget);
}
async function findCategoryDirSkills(path2) {
  if (!(await lstat(path2).catch(() => {
    return;
  }))?.isDirectory() || existsSync(join(path2, "SKILL.md")))
    return [];
  return (await readdir(path2).catch(() => [])).filter((name) => existsSync(join(path2, name, "SKILL.md")));
}
async function assertNotCategoryDir(path2) {
  const skills = await findCategoryDirSkills(path2);
  if (skills.length > 0)
    throw diagnostics.SKILLS_CATEGORY_DIR_CONFLICT({
      path: path2,
      skills
    });
}
async function cleanAndCreateDirectory(path2) {
  await assertNotCategoryDir(path2);
  try {
    await rm(path2, {
      recursive: true,
      force: true
    });
  } catch {}
  await mkdir(path2, { recursive: true });
}
async function resolveParentSymlinks(path2) {
  const resolved = resolve(path2);
  const dir = dirname(resolved);
  const base = basename(resolved);
  try {
    const realDir = await realpath(dir);
    return join(realDir, base);
  } catch {
    return resolved;
  }
}
async function createSymlink(target, linkPath) {
  try {
    const resolvedTarget = resolve(target);
    const resolvedLinkPath = resolve(linkPath);
    const [realTarget, realLinkPath] = await Promise.all([realpath(resolvedTarget).catch(() => resolvedTarget), realpath(resolvedLinkPath).catch(() => resolvedLinkPath)]);
    if (realTarget === realLinkPath)
      return true;
    if (await resolveParentSymlinks(target) === await resolveParentSymlinks(linkPath))
      return true;
    await assertNotCategoryDir(linkPath);
    try {
      if ((await lstat(linkPath)).isSymbolicLink()) {
        if (resolveSymlinkTarget(linkPath, await readlink(linkPath)) === resolvedTarget)
          return true;
        await rm(linkPath);
      } else
        await rm(linkPath, { recursive: true });
    } catch (err) {
      if (err && typeof err === "object" && "code" in err && err.code === "ELOOP")
        try {
          await rm(linkPath, { force: true });
        } catch {}
    }
    const linkDir = dirname(linkPath);
    await mkdir(linkDir, { recursive: true });
    const realLinkDir = await resolveParentSymlinks(linkDir);
    const relativePath = relative(realLinkDir, target);
    const symlinkType = platform() === "win32" ? "junction" : undefined;
    await symlink(symlinkType === "junction" ? resolvedTarget : relativePath, linkPath, symlinkType);
    return true;
  } catch (error) {
    if (isDiagnostic(error, "SKILLS_CATEGORY_DIR_CONFLICT"))
      throw error;
    return false;
  }
}
async function installSkillForAgent(skill, agentType, options = {}) {
  const agent = agents[agentType];
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();
  const eveSubagent = options.eveSubagent;
  if (isGlobal && agent.globalSkillsDir === undefined)
    return {
      success: false,
      path: "",
      mode: options.mode ?? "symlink",
      error: `${agent.displayName} does not support global skill installation`
    };
  const skillName = sanitizeName(skill.name || basename(skill.path));
  const installMode = options.mode ?? "symlink";
  const canonicalBase = agentType === "eve" && installMode === "symlink" ? getAgentBaseDir(agentType, isGlobal, cwd, eveSubagent) : getCanonicalSkillsDir(isGlobal, cwd);
  const canonicalDir = join(canonicalBase, skillName);
  const agentBase = getAgentBaseDir(agentType, isGlobal, cwd, eveSubagent);
  const agentDir = join(agentBase, skillName);
  if (!isPathSafe$1(canonicalBase, canonicalDir))
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: "Invalid skill name: potential path traversal detected"
    };
  if (!isPathSafe$1(agentBase, agentDir))
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: "Invalid skill name: potential path traversal detected"
    };
  try {
    if (pathsOverlap(skill.path, agentDir))
      return {
        success: true,
        path: agentDir,
        mode: installMode,
        skipped: true
      };
    if (installMode === "copy") {
      await cleanAndCreateDirectory(agentDir);
      await copyDirectory(skill.path, agentDir, agentType);
      return {
        success: true,
        path: agentDir,
        mode: "copy"
      };
    }
    const sourceIsCanonical = resolve(skill.path) === resolve(canonicalDir);
    if (!sourceIsCanonical && pathsOverlap(skill.path, canonicalDir))
      return {
        success: true,
        path: canonicalDir,
        canonicalPath: canonicalDir,
        mode: installMode,
        skipped: true
      };
    const linksAgentDir = !(isGlobal && readsCanonicalGlobally(agentType)) && !shouldSkipProjectAgentSymlink(agentType, isGlobal, cwd, options.createMissingAgentRoot ?? false);
    if (!sourceIsCanonical)
      await assertNotCategoryDir(canonicalDir);
    if (linksAgentDir)
      await assertNotCategoryDir(agentDir);
    if (!sourceIsCanonical) {
      if (installMode === "link") {
        if (!await createSymlink(skill.path, canonicalDir)) {
          await cleanAndCreateDirectory(canonicalDir);
          await copyDirectory(skill.path, canonicalDir, agentType);
        }
      } else {
        await cleanAndCreateDirectory(canonicalDir);
        await copyDirectory(skill.path, canonicalDir, agentType);
      }
    }
    if (isGlobal && readsCanonicalGlobally(agentType))
      return {
        success: true,
        path: canonicalDir,
        canonicalPath: canonicalDir,
        mode: installMode
      };
    if (shouldSkipProjectAgentSymlink(agentType, isGlobal, cwd, options.createMissingAgentRoot ?? false))
      return {
        success: true,
        path: canonicalDir,
        canonicalPath: canonicalDir,
        mode: installMode,
        skipped: true,
        skipReason: "missing-agent-project-directory"
      };
    if (!await createSymlink(canonicalDir, agentDir)) {
      await cleanAndCreateDirectory(agentDir);
      await copyDirectory(skill.path, agentDir, agentType);
      return {
        success: true,
        path: agentDir,
        canonicalPath: canonicalDir,
        mode: installMode,
        symlinkFailed: true
      };
    }
    return {
      success: true,
      path: agentDir,
      canonicalPath: canonicalDir,
      mode: installMode
    };
  } catch (error) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
function stripIgnoredEveFrontmatter(raw) {
  const { data, content } = parseFrontmatter(raw);
  const eveData = {};
  if (typeof data.name === "string")
    eveData.name = data.name;
  if (typeof data.description === "string")
    eveData.description = data.description;
  if (typeof data.license === "string")
    eveData.license = data.license;
  if (data.compatibility !== undefined)
    eveData.compatibility = data.compatibility;
  if (typeof data.version === "string" || typeof data.version === "number")
    eveData.version = data.version;
  if (data.metadata && typeof data.metadata === "object" && !Array.isArray(data.metadata))
    eveData.metadata = data.metadata;
  if (Object.keys(eveData).length === 0)
    return content.replace(/^\r?\n/u, "");
  return `---
${$stringify(eveData).trimEnd()}
---
${content.replace(/^\r?\n/u, "")}`;
}
function isWithinRoot(root, target) {
  return target === root || target.startsWith(root + sep);
}
async function copyDirectory(src, dest, agentType, ctx) {
  const realSrc = await realpath(src);
  const root = ctx?.root ?? realSrc;
  if (ctx?.ancestors.has(realSrc)) {
    warn(diagnostics.SKILLS_SYMLINK_CYCLE({ path: src }));
    return;
  }
  const ancestors = new Set(ctx?.ancestors);
  ancestors.add(realSrc);
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  await Promise.all(entries.filter((entry) => !isExcluded(entry.name, entry.isDirectory())).map(async (entry) => {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    let isDirectory = entry.isDirectory();
    if (entry.isSymbolicLink()) {
      let realTarget;
      try {
        realTarget = await realpath(srcPath);
      } catch {
        warn(diagnostics.SKILLS_BROKEN_SYMLINK({ path: srcPath }));
        return;
      }
      if (!isWithinRoot(root, realTarget)) {
        warn(diagnostics.SKILLS_SYMLINK_OUTSIDE_SKILL({ path: srcPath }));
        return;
      }
      isDirectory = (await stat(realTarget)).isDirectory();
      if (isDirectory && isExcluded(entry.name, true))
        return;
    }
    if (isDirectory) {
      await copyDirectory(srcPath, destPath, agentType, {
        root,
        ancestors
      });
      return;
    }
    if (agentType === "eve" && entry.name.toLowerCase() === "skill.md") {
      await writeFile(destPath, stripIgnoredEveFrontmatter(await readFile(srcPath, "utf-8")));
      return;
    }
    await cp(srcPath, destPath, { dereference: true });
    const sourceStats = await stat(srcPath);
    await chmod(destPath, sourceStats.mode & 511);
  }));
}
function isEvePackagedSkill(files) {
  return files.some((file) => basename(file.path).toLowerCase() === "skill.md");
}
function toEveFlatSkillFileName(installName) {
  return `${sanitizeName(installName)}.md`;
}
function getEveFlatSkillMarkdown(files) {
  const skillFile = files.find((file) => basename(file.path).toLowerCase() === "skill.md");
  if (skillFile)
    return stripIgnoredEveFrontmatter(skillFile.contents);
  const markdownFile = files.find((file) => extname$1(file.path).toLowerCase() === ".md");
  return markdownFile ? stripIgnoredEveFrontmatter(markdownFile.contents) : "";
}
function getInstallPath(skillName, agentType, options = {}) {
  agents[agentType];
  options.cwd || process.cwd();
  const sanitized = sanitizeName(skillName);
  const targetBase = getAgentBaseDir(agentType, options.global ?? false, options.cwd, options.eveSubagent);
  const installPath = join(targetBase, sanitized);
  if (!isPathSafe$1(targetBase, installPath))
    throw diagnostics.SKILLS_UNSAFE_SKILL_NAME();
  return installPath;
}
function getCanonicalPath(skillName, options = {}) {
  const sanitized = sanitizeName(skillName);
  const canonicalBase = options.agent === "eve" ? getAgentBaseDir("eve", options.global ?? false, options.cwd, options.eveSubagent) : getCanonicalSkillsDir(options.global ?? false, options.cwd);
  const canonicalPath = join(canonicalBase, sanitized);
  if (!isPathSafe$1(canonicalBase, canonicalPath))
    throw diagnostics.SKILLS_UNSAFE_SKILL_NAME();
  return canonicalPath;
}
async function installWellKnownSkillForAgent(skill, agentType, options = {}) {
  const agent = agents[agentType];
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();
  const installMode = options.mode ?? "symlink";
  const eveSubagent = options.eveSubagent;
  if (isGlobal && agent.globalSkillsDir === undefined)
    return {
      success: false,
      path: "",
      mode: installMode,
      error: `${agent.displayName} does not support global skill installation`
    };
  const skillName = sanitizeName(skill.installName);
  const canonicalBase = agentType === "eve" && installMode === "symlink" ? getAgentBaseDir(agentType, isGlobal, cwd, eveSubagent) : getCanonicalSkillsDir(isGlobal, cwd);
  const canonicalDir = join(canonicalBase, skillName);
  const agentBase = getAgentBaseDir(agentType, isGlobal, cwd, eveSubagent);
  const agentDir = join(agentBase, skillName);
  if (!isPathSafe$1(canonicalBase, canonicalDir))
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: "Invalid skill name: potential path traversal detected"
    };
  if (!isPathSafe$1(agentBase, agentDir))
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: "Invalid skill name: potential path traversal detected"
    };
  async function writeSkillFiles(targetDir) {
    for (const [filePath, content] of skill.files) {
      const fullPath = join(targetDir, filePath);
      if (!isPathSafe$1(targetDir, fullPath))
        continue;
      const parentDir = dirname(fullPath);
      if (parentDir !== targetDir)
        await mkdir(parentDir, { recursive: true });
      await writeFile(fullPath, agentType === "eve" && basename(filePath).toLowerCase() === "skill.md" && typeof content === "string" ? stripIgnoredEveFrontmatter(content) : content);
    }
  }
  try {
    if (installMode === "copy") {
      await cleanAndCreateDirectory(agentDir);
      await writeSkillFiles(agentDir);
      return {
        success: true,
        path: agentDir,
        mode: "copy"
      };
    }
    await assertNotCategoryDir(canonicalDir);
    if (!(isGlobal && readsCanonicalGlobally(agentType)))
      await assertNotCategoryDir(agentDir);
    await cleanAndCreateDirectory(canonicalDir);
    await writeSkillFiles(canonicalDir);
    if (isGlobal && readsCanonicalGlobally(agentType))
      return {
        success: true,
        path: canonicalDir,
        canonicalPath: canonicalDir,
        mode: "symlink"
      };
    if (!await createSymlink(canonicalDir, agentDir)) {
      await cleanAndCreateDirectory(agentDir);
      await writeSkillFiles(agentDir);
      return {
        success: true,
        path: agentDir,
        canonicalPath: canonicalDir,
        mode: "symlink",
        symlinkFailed: true
      };
    }
    return {
      success: true,
      path: agentDir,
      canonicalPath: canonicalDir,
      mode: "symlink"
    };
  } catch (error) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function installBlobSkillForAgent(skill, agentType, options = {}) {
  const agent = agents[agentType];
  const isGlobal = options.global ?? false;
  const cwd = options.cwd || process.cwd();
  const installMode = options.mode ?? "symlink";
  const eveSubagent = options.eveSubagent;
  if (isGlobal && agent.globalSkillsDir === undefined)
    return {
      success: false,
      path: "",
      mode: installMode,
      error: `${agent.displayName} does not support global skill installation`
    };
  const skillName = sanitizeName(skill.installName);
  const agentBase = getAgentBaseDir(agentType, isGlobal, cwd, eveSubagent);
  if (agentType === "eve" && !isEvePackagedSkill(skill.files)) {
    const flatSkillPath = join(agentBase, toEveFlatSkillFileName(skill.installName));
    if (!isPathSafe$1(agentBase, flatSkillPath))
      return {
        success: false,
        path: flatSkillPath,
        mode: installMode,
        error: "Invalid skill name: potential path traversal detected"
      };
    try {
      await mkdir(agentBase, { recursive: true });
      await rm(flatSkillPath, {
        recursive: true,
        force: true
      });
      await writeFile(flatSkillPath, getEveFlatSkillMarkdown(skill.files), "utf-8");
      return {
        success: true,
        path: flatSkillPath,
        mode: "copy"
      };
    } catch (error) {
      return {
        success: false,
        path: flatSkillPath,
        mode: installMode,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
  const canonicalBase = agentType === "eve" && installMode === "symlink" ? getAgentBaseDir(agentType, isGlobal, cwd, eveSubagent) : getCanonicalSkillsDir(isGlobal, cwd);
  const canonicalDir = join(canonicalBase, skillName);
  const agentDir = join(agentBase, skillName);
  if (!isPathSafe$1(canonicalBase, canonicalDir))
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: "Invalid skill name: potential path traversal detected"
    };
  if (!isPathSafe$1(agentBase, agentDir))
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: "Invalid skill name: potential path traversal detected"
    };
  async function writeSkillFiles(targetDir) {
    for (const file of skill.files) {
      if (isExcludedPath(file.path))
        continue;
      const fullPath = join(targetDir, file.path);
      if (!isPathSafe$1(targetDir, fullPath))
        continue;
      const parentDir = dirname(fullPath);
      if (parentDir !== targetDir)
        await mkdir(parentDir, { recursive: true });
      await writeFile(fullPath, agentType === "eve" && basename(file.path).toLowerCase() === "skill.md" ? stripIgnoredEveFrontmatter(file.contents) : file.contents, "utf-8");
    }
  }
  try {
    if (installMode === "copy") {
      await cleanAndCreateDirectory(agentDir);
      await writeSkillFiles(agentDir);
      return {
        success: true,
        path: agentDir,
        mode: "copy"
      };
    }
    const linksAgentDir = !(isGlobal && readsCanonicalGlobally(agentType)) && !shouldSkipProjectAgentSymlink(agentType, isGlobal, cwd, options.createMissingAgentRoot ?? false);
    await assertNotCategoryDir(canonicalDir);
    if (linksAgentDir)
      await assertNotCategoryDir(agentDir);
    await cleanAndCreateDirectory(canonicalDir);
    await writeSkillFiles(canonicalDir);
    if (isGlobal && readsCanonicalGlobally(agentType))
      return {
        success: true,
        path: canonicalDir,
        canonicalPath: canonicalDir,
        mode: "symlink"
      };
    if (shouldSkipProjectAgentSymlink(agentType, isGlobal, cwd, options.createMissingAgentRoot ?? false))
      return {
        success: true,
        path: canonicalDir,
        canonicalPath: canonicalDir,
        mode: "symlink",
        skipped: true,
        skipReason: "missing-agent-project-directory"
      };
    if (!await createSymlink(canonicalDir, agentDir)) {
      await cleanAndCreateDirectory(agentDir);
      await writeSkillFiles(agentDir);
      return {
        success: true,
        path: agentDir,
        canonicalPath: canonicalDir,
        mode: "symlink",
        symlinkFailed: true
      };
    }
    return {
      success: true,
      path: agentDir,
      canonicalPath: canonicalDir,
      mode: "symlink"
    };
  } catch (error) {
    return {
      success: false,
      path: agentDir,
      mode: installMode,
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
async function listInstalledSkills(options = {}) {
  const cwd = options.cwd || process.cwd();
  const skillsMap = /* @__PURE__ */ new Map;
  const scopes = [];
  const detectedAgents = await detectInstalledAgents(cwd);
  const agentFilter = options.agentFilter;
  const agentsToCheck = agentFilter ? detectedAgents.filter((a2) => agentFilter.includes(a2)) : detectedAgents;
  const scopeTypes = [];
  if (options.global === undefined)
    scopeTypes.push({ global: false }, { global: true });
  else
    scopeTypes.push({ global: options.global });
  for (const { global: isGlobal } of scopeTypes) {
    scopes.push({
      global: isGlobal,
      path: getCanonicalSkillsDir(isGlobal, cwd)
    });
    for (const agentType of agentsToCheck) {
      const agent = agents[agentType];
      if (isGlobal && agent.globalSkillsDir === undefined)
        continue;
      const agentDir = isGlobal ? agent.globalSkillsDir : join(cwd, agent.skillsDir);
      if (!scopes.some((s3) => s3.path === agentDir && s3.global === isGlobal))
        scopes.push({
          global: isGlobal,
          path: agentDir,
          agentType
        });
      if (agentType === "eve" && !isGlobal)
        for (const subagent of getEveSubagents(cwd)) {
          const subagentDir = getEveSubagentSkillsDir(subagent, cwd);
          if (!scopes.some((s3) => s3.path === subagentDir && s3.global === isGlobal))
            scopes.push({
              global: isGlobal,
              path: subagentDir,
              agentType
            });
        }
    }
    const allAgentTypes = Object.keys(agents);
    for (const agentType of allAgentTypes) {
      if (agentFilter && !agentFilter.includes(agentType))
        continue;
      if (agentsToCheck.includes(agentType))
        continue;
      const agent = agents[agentType];
      if (isGlobal && agent.globalSkillsDir === undefined)
        continue;
      const agentDir = isGlobal ? agent.globalSkillsDir : join(cwd, agent.skillsDir);
      if (scopes.some((s3) => s3.path === agentDir && s3.global === isGlobal))
        continue;
      if (existsSync(agentDir))
        scopes.push({
          global: isGlobal,
          path: agentDir,
          agentType
        });
    }
  }
  for (const scope of scopes)
    try {
      const entries = await readdir(scope.path, { withFileTypes: true });
      for (const entry of entries) {
        const skillDir = join(scope.path, entry.name);
        if (!await isDirEntryOrSymlinkToDir(entry, skillDir))
          continue;
        const skillMdPath = join(skillDir, "SKILL.md");
        try {
          await stat(skillMdPath);
        } catch {
          continue;
        }
        const skill = await parseSkillMd(skillMdPath);
        if (!skill)
          continue;
        const scopeKey = scope.global ? "global" : "project";
        const skillKey = `${scopeKey}:${skill.name}`;
        if (scope.agentType) {
          if (skillsMap.has(skillKey)) {
            const existing = skillsMap.get(skillKey);
            if (!existing.agents.includes(scope.agentType))
              existing.agents.push(scope.agentType);
          } else
            skillsMap.set(skillKey, {
              name: skill.name,
              description: skill.description,
              path: skillDir,
              canonicalPath: skillDir,
              scope: scopeKey,
              agents: [scope.agentType]
            });
          continue;
        }
        const sanitizedSkillName = sanitizeName(skill.name);
        const installedAgents = [];
        for (const agentType of agentsToCheck) {
          const agent = agents[agentType];
          if (scope.global && agent.globalSkillsDir === undefined)
            continue;
          const agentBase = getAgentBaseDir(agentType, scope.global, cwd);
          let found = false;
          const possibleNames = Array.from(/* @__PURE__ */ new Set([
            entry.name,
            sanitizedSkillName,
            skill.name.toLowerCase().replace(/\s+/g, "-").replace(/[\/\\:\0]/g, "")
          ]));
          for (const possibleName of possibleNames) {
            const agentSkillDir = join(agentBase, possibleName);
            if (!isPathSafe$1(agentBase, agentSkillDir))
              continue;
            try {
              await access(agentSkillDir);
              found = true;
              break;
            } catch {}
          }
          if (!found)
            try {
              const agentEntries = await readdir(agentBase, { withFileTypes: true });
              for (const agentEntry of agentEntries) {
                const candidateDir = join(agentBase, agentEntry.name);
                if (!await isDirEntryOrSymlinkToDir(agentEntry, candidateDir))
                  continue;
                if (!isPathSafe$1(agentBase, candidateDir))
                  continue;
                try {
                  const candidateSkillMd = join(candidateDir, "SKILL.md");
                  await stat(candidateSkillMd);
                  const candidateSkill = await parseSkillMd(candidateSkillMd);
                  if (candidateSkill && candidateSkill.name === skill.name) {
                    found = true;
                    break;
                  }
                } catch {}
              }
            } catch {}
          if (found)
            installedAgents.push(agentType);
        }
        if (skillsMap.has(skillKey)) {
          const existing = skillsMap.get(skillKey);
          for (const agent of installedAgents)
            if (!existing.agents.includes(agent))
              existing.agents.push(agent);
        } else
          skillsMap.set(skillKey, {
            name: skill.name,
            description: skill.description,
            path: skillDir,
            canonicalPath: skillDir,
            scope: scopeKey,
            agents: installedAgents
          });
      }
    } catch {}
  return Array.from(skillsMap.values());
}
function isCI() {
  return !!(process.env.CI || process.env.GITHUB_ACTIONS || process.env.GITLAB_CI || process.env.CIRCLECI || process.env.TRAVIS || process.env.BUILDKITE || process.env.JENKINS_URL || process.env.TEAMCITY_VERSION);
}
var TELEMETRY_URL = "https://www.skills.sh/tele/t";
var cliVersion = null;
var detectedAgentName = null;
function setDetectedAgent(agentName) {
  detectedAgentName = agentName;
}
function isEnabled() {
  return !process.env.DISABLE_TELEMETRY && !process.env.DO_NOT_TRACK;
}
function setVersion(version) {
  cliVersion = version;
}
var pendingTelemetry = [];
function track(data) {
  if (!isEnabled())
    return;
  try {
    const params = new URLSearchParams;
    if (cliVersion)
      params.set("v", cliVersion);
    if (isCI())
      params.set("ci", "1");
    if (detectedAgentName)
      params.set("agent", detectedAgentName);
    for (const [key, value] of Object.entries(data))
      if (value !== undefined && value !== null)
        params.set(key, String(value));
    const controller = new AbortController;
    const p3 = fetch(`${TELEMETRY_URL}?${params.toString()}`, { signal: controller.signal }).catch(() => {}).then(() => {});
    pendingTelemetry.push({
      promise: p3,
      controller
    });
  } catch {}
}
async function flushTelemetry(timeoutMs = 5000) {
  const pending = pendingTelemetry.splice(0);
  if (pending.length === 0)
    return;
  let timer;
  const timeout = new Promise((resolve2) => {
    timer = setTimeout(resolve2, timeoutMs);
  });
  await Promise.race([Promise.all(pending.map((item) => item.promise)), timeout]);
  clearTimeout(timer);
  for (const item of pending)
    item.controller.abort();
}
var import_dist2 = require_dist3();
var cachedResult = null;
function hasStrongCursorAgentSignal() {
  return Boolean(process.env.CURSOR_AGENT?.trim()) || process.env.CURSOR_EXTENSION_HOST_ROLE === "agent-exec";
}
function refineAgentResult(result) {
  if (!result.isAgent || !result.agent)
    return result;
  if (result.agent.name === "cursor" || result.agent.name === "cursor-cli") {
    if (!hasStrongCursorAgentSignal())
      return {
        isAgent: false,
        agent: undefined
      };
    if (result.agent.name === "cursor")
      return {
        isAgent: true,
        agent: { name: "cursor-cli" }
      };
  }
  return result;
}
var agentNameToType = {
  cursor: "cursor",
  "cursor-cli": "cursor",
  claude: "claude-code",
  cowork: "claude-code",
  devin: "universal",
  replit: "replit",
  gemini: "gemini-cli",
  codex: "codex",
  antigravity: "antigravity",
  "augment-cli": "augment",
  opencode: "opencode",
  "github-copilot": "github-copilot"
};
async function detectAgent() {
  if (cachedResult)
    return cachedResult;
  cachedResult = refineAgentResult(await (0, import_dist2.determineAgent)());
  if (cachedResult.isAgent)
    setDetectedAgent(cachedResult.agent.name);
  return cachedResult;
}
function getAgentType(agentName) {
  return agentNameToType[agentName] ?? null;
}
var ProviderRegistryImpl = class {
  providers = [];
  register(provider) {
    if (this.providers.some((p3) => p3.id === provider.id))
      throw diagnostics.SKILLS_PROVIDER_ALREADY_REGISTERED({ id: provider.id });
    this.providers.push(provider);
  }
  findProvider(url) {
    for (const provider of this.providers)
      if (provider.match(url).matches)
        return provider;
    return null;
  }
  getProviders() {
    return [...this.providers];
  }
};
new ProviderRegistryImpl;
var ZIP_LOCAL_FILE_HEADER = 67324752;
var ZIP_CENTRAL_DIRECTORY_HEADER = 33639248;
var ZIP_END_OF_CENTRAL_DIRECTORY = 101010256;
var ZIP64_END_OF_CENTRAL_DIRECTORY = 101075792;
var ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR = 117853008;
var ZIP_END_MIN_SIZE = 22;
var ZIP_MAX_COMMENT_SIZE = 65535;
var CP437_HIGH_BYTES = [
  "ÇüéâäàåçêëèïîìÄÅ",
  "ÉæÆôöòûùÿÖÜ¢£¥₧ƒ",
  "áíóúñÑªº¿⌐¬½¼¡«»",
  "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐",
  "└┴┬├─┼╞╟╚╔╩╦╠═╬╧",
  "╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀",
  "αßΓπΣσµτΦΘΩδ∞φε∩",
  "≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ "
].join("");
function ensureRange(buffer, offset, length, label) {
  if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(length) || offset < 0 || length < 0 || offset + length > buffer.length)
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: `Invalid zip archive: ${label} is out of bounds` });
}
function findEndOfCentralDirectory(buffer) {
  const minOffset = Math.max(0, buffer.length - ZIP_MAX_COMMENT_SIZE - ZIP_END_MIN_SIZE);
  for (let offset = buffer.length - ZIP_END_MIN_SIZE;offset >= minOffset; offset--) {
    if (buffer.readUInt32LE(offset) !== ZIP_END_OF_CENTRAL_DIRECTORY)
      continue;
    const commentLength = buffer.readUInt16LE(offset + 20);
    if (offset + ZIP_END_MIN_SIZE + commentLength === buffer.length)
      return offset;
  }
  return -1;
}
function readUInt64AsNumber(buffer, offset, label) {
  ensureRange(buffer, offset, 8, label);
  const value = buffer.readBigUInt64LE(offset);
  if (value > BigInt(Number.MAX_SAFE_INTEGER))
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: `Invalid zip archive: ${label} exceeds the safe integer range` });
  return Number(value);
}
function readCentralDirectory(buffer, endOffset) {
  const diskNumber = buffer.readUInt16LE(endOffset + 4);
  const centralDirectoryDisk = buffer.readUInt16LE(endOffset + 6);
  const entriesOnDisk = buffer.readUInt16LE(endOffset + 8);
  const totalEntries = buffer.readUInt16LE(endOffset + 10);
  const size = buffer.readUInt32LE(endOffset + 12);
  const offset = buffer.readUInt32LE(endOffset + 16);
  if (!(entriesOnDisk === 65535 || totalEntries === 65535 || size === 4294967295 || offset === 4294967295)) {
    if (diskNumber !== 0 || centralDirectoryDisk !== 0 || entriesOnDisk !== totalEntries)
      throw diagnostics.SKILLS_ARCHIVE_MULTI_DISK_ZIP();
    return {
      entries: totalEntries,
      offset,
      size,
      trailerOffset: endOffset
    };
  }
  if (diskNumber !== 0 || centralDirectoryDisk !== 0)
    throw diagnostics.SKILLS_ARCHIVE_MULTI_DISK_ZIP();
  const locatorOffset = endOffset - 20;
  ensureRange(buffer, locatorOffset, 20, "zip64 locator");
  if (buffer.readUInt32LE(locatorOffset) !== ZIP64_END_OF_CENTRAL_DIRECTORY_LOCATOR)
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip64 locator" });
  if (buffer.readUInt32LE(locatorOffset + 4) !== 0 || buffer.readUInt32LE(locatorOffset + 16) !== 1)
    throw diagnostics.SKILLS_ARCHIVE_MULTI_DISK_ZIP();
  const zip64EndOffset = readUInt64AsNumber(buffer, locatorOffset + 8, "zip64 end offset");
  ensureRange(buffer, zip64EndOffset, 56, "zip64 end of central directory");
  if (buffer.readUInt32LE(zip64EndOffset) !== ZIP64_END_OF_CENTRAL_DIRECTORY)
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip64 end of central directory" });
  const recordSize = readUInt64AsNumber(buffer, zip64EndOffset + 4, "zip64 end size");
  if (recordSize < 44)
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip64 end of central directory" });
  ensureRange(buffer, zip64EndOffset, recordSize + 12, "zip64 end of central directory");
  if (zip64EndOffset + recordSize + 12 !== locatorOffset)
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip64 end of central directory" });
  if (buffer.readUInt32LE(zip64EndOffset + 16) !== 0 || buffer.readUInt32LE(zip64EndOffset + 20) !== 0)
    throw diagnostics.SKILLS_ARCHIVE_MULTI_DISK_ZIP();
  const zip64EntriesOnDisk = readUInt64AsNumber(buffer, zip64EndOffset + 24, "zip64 entries on disk");
  const zip64TotalEntries = readUInt64AsNumber(buffer, zip64EndOffset + 32, "zip64 total entries");
  if (zip64EntriesOnDisk !== zip64TotalEntries)
    throw diagnostics.SKILLS_ARCHIVE_MULTI_DISK_ZIP();
  return {
    entries: zip64TotalEntries,
    size: readUInt64AsNumber(buffer, zip64EndOffset + 40, "zip64 central directory size"),
    offset: readUInt64AsNumber(buffer, zip64EndOffset + 48, "zip64 central directory offset"),
    trailerOffset: zip64EndOffset
  };
}
function normalizeArchivePath(rawPath) {
  if (!rawPath || rawPath.includes("\x00"))
    return null;
  const path2 = rawPath.replace(/\\/g, "/");
  if (path2.startsWith("/") || /^[A-Za-z]:/.test(path2))
    return null;
  const parts = path2.split("/");
  if (parts.some((part) => part === ".."))
    return null;
  const normalized = parts.filter((part) => part && part !== ".").join("/");
  if (!normalized && !path2.endsWith("/"))
    return null;
  return path2.endsWith("/") && normalized ? `${normalized}/` : normalized;
}
function findExtraField(buffer, extraOffset, extraLength, targetId) {
  const extraEnd = extraOffset + extraLength;
  let offset = extraOffset;
  while (offset < extraEnd) {
    if (offset + 4 > extraEnd)
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip extra field" });
    const id = buffer.readUInt16LE(offset);
    const size = buffer.readUInt16LE(offset + 2);
    const dataOffset = offset + 4;
    ensureRange(buffer, dataOffset, size, "zip extra field");
    if (dataOffset + size > extraEnd)
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip extra field" });
    if (id === targetId)
      return buffer.subarray(dataOffset, dataOffset + size);
    offset = dataOffset + size;
  }
  return null;
}
function decodeFileName(bytes, isUtf8, unicodePathExtra) {
  if (isUtf8)
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  if (unicodePathExtra && unicodePathExtra.length >= 5 && unicodePathExtra[0] === 1 && unicodePathExtra.readUInt32LE(1) === crc32(bytes))
    return new TextDecoder("utf-8", { fatal: true }).decode(unicodePathExtra.subarray(5));
  let result = "";
  for (const byte of bytes)
    result += byte < 128 ? String.fromCharCode(byte) : CP437_HIGH_BYTES[byte - 128];
  return result;
}
function readZip64EntryValues(buffer, extraOffset, extraLength, values) {
  if (!(values.uncompressedSize === 4294967295 || values.compressedSize === 4294967295 || values.localHeaderOffset === 4294967295 || values.diskStart === 65535)) {
    if (values.diskStart !== 0)
      throw diagnostics.SKILLS_ARCHIVE_MULTI_DISK_ZIP();
    return values;
  }
  const zip64Extra = findExtraField(buffer, extraOffset, extraLength, 1);
  if (!zip64Extra)
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip64 extra field" });
  let valueOffset = 0;
  const readNextUInt64 = (label) => {
    if (valueOffset + 8 > zip64Extra.length)
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: `Invalid zip64 extra field: missing ${label}` });
    const value = readUInt64AsNumber(zip64Extra, valueOffset, `zip64 ${label}`);
    valueOffset += 8;
    return value;
  };
  const resolved = { ...values };
  if (resolved.uncompressedSize === 4294967295)
    resolved.uncompressedSize = readNextUInt64("uncompressed size");
  if (resolved.compressedSize === 4294967295)
    resolved.compressedSize = readNextUInt64("compressed size");
  if (resolved.localHeaderOffset === 4294967295)
    resolved.localHeaderOffset = readNextUInt64("local header offset");
  if (resolved.diskStart === 65535) {
    if (valueOffset + 4 > zip64Extra.length)
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip64 extra field: missing disk start" });
    resolved.diskStart = zip64Extra.readUInt32LE(valueOffset);
  }
  if (resolved.diskStart !== 0)
    throw diagnostics.SKILLS_ARCHIVE_MULTI_DISK_ZIP();
  return resolved;
}
function readZipArchive(bytes, limits) {
  const buffer = Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const endOffset = findEndOfCentralDirectory(buffer);
  if (endOffset < 0)
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip archive" });
  const centralDirectory = readCentralDirectory(buffer, endOffset);
  const totalEntries = centralDirectory.entries;
  if (totalEntries > limits.maxEntries)
    throw diagnostics.SKILLS_ARCHIVE_TOO_MANY_FILES({
      count: totalEntries,
      max: limits.maxEntries
    });
  ensureRange(buffer, centralDirectory.offset, centralDirectory.size, "central directory");
  if (centralDirectory.offset + centralDirectory.size > centralDirectory.trailerOffset)
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip archive: central directory overlaps archive trailer" });
  const files = /* @__PURE__ */ new Map;
  let extractedBytes = 0;
  let offset = centralDirectory.offset;
  for (let index = 0;index < totalEntries; index++) {
    ensureRange(buffer, offset, 46, "central directory entry");
    if (buffer.readUInt32LE(offset) !== ZIP_CENTRAL_DIRECTORY_HEADER)
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip central directory entry" });
    const flags = buffer.readUInt16LE(offset + 8);
    const method = buffer.readUInt16LE(offset + 10);
    const expectedChecksum = buffer.readUInt32LE(offset + 16);
    let compressedSize = buffer.readUInt32LE(offset + 20);
    let uncompressedSize = buffer.readUInt32LE(offset + 24);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    let diskStart = buffer.readUInt16LE(offset + 34);
    const externalAttributes = buffer.readUInt32LE(offset + 38);
    let localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const variableSize = fileNameLength + extraLength + commentLength;
    ensureRange(buffer, offset + 46, variableSize, "central directory entry data");
    const nameStart = offset + 46;
    const extraOffset = nameStart + fileNameLength;
    ({ compressedSize, diskStart, localHeaderOffset, uncompressedSize } = readZip64EntryValues(buffer, extraOffset, extraLength, {
      compressedSize,
      diskStart,
      localHeaderOffset,
      uncompressedSize
    }));
    const centralFileName = buffer.subarray(nameStart, nameStart + fileNameLength);
    const rawFileName = decodeFileName(centralFileName, Boolean(flags & 2048), findExtraField(buffer, extraOffset, extraLength, 28789));
    const fileName = normalizeArchivePath(rawFileName);
    if (fileName === null)
      throw diagnostics.SKILLS_ARCHIVE_UNSAFE_PATH({ path: rawFileName });
    if (flags & 1)
      throw diagnostics.SKILLS_ARCHIVE_ENCRYPTED_ENTRY();
    const fileType = externalAttributes >>> 16 & 61440;
    if (fileType !== 0 && fileType !== 32768 && fileType !== 16384)
      throw diagnostics.SKILLS_ARCHIVE_LINK_ENTRY();
    const isDirectory = rawFileName.replace(/\\/g, "/").endsWith("/") || fileType === 16384;
    offset += 46 + variableSize;
    extractedBytes += uncompressedSize;
    if (extractedBytes > limits.maxExtractedBytes)
      throw diagnostics.SKILLS_ARCHIVE_TOO_LARGE({ maxBytes: limits.maxExtractedBytes });
    if (isDirectory)
      continue;
    ensureRange(buffer, localHeaderOffset, 30, "local file header");
    if (buffer.readUInt32LE(localHeaderOffset) !== ZIP_LOCAL_FILE_HEADER)
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip local file header" });
    const localFlags = buffer.readUInt16LE(localHeaderOffset + 6);
    const localMethod = buffer.readUInt16LE(localHeaderOffset + 8);
    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const localNameOffset = localHeaderOffset + 30;
    ensureRange(buffer, localNameOffset, localFileNameLength + localExtraLength, "local file header data");
    const localFileName = buffer.subarray(localNameOffset, localNameOffset + localFileNameLength);
    if (localFlags !== flags || localMethod !== method || !localFileName.equals(centralFileName))
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Zip local header does not match central directory" });
    const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    ensureRange(buffer, dataOffset, compressedSize, "file data");
    if (dataOffset + compressedSize > centralDirectory.offset)
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip archive: file data overlaps central directory" });
    const compressed = buffer.subarray(dataOffset, dataOffset + compressedSize);
    let contents;
    if (method === 0)
      contents = compressed;
    else if (method === 8)
      contents = inflateRawSync(compressed, { maxOutputLength: uncompressedSize + 1 });
    else
      throw diagnostics.SKILLS_ARCHIVE_UNSUPPORTED_COMPRESSION({ method });
    if (contents.byteLength !== uncompressedSize)
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Zip entry size mismatch" });
    if (crc32(contents) !== expectedChecksum)
      throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Zip entry checksum mismatch" });
    files.set(fileName, new Uint8Array(contents));
  }
  if (offset !== centralDirectory.offset + centralDirectory.size)
    throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid zip central directory size" });
  return files;
}
var DISCOVERY_SCHEMA_V2 = "https://schemas.agentskills.io/discovery/0.2.0/schema.json";
var MAX_ARCHIVE_UNPACKED_BYTES = 52428800;
var MAX_ARCHIVE_FILES = 1000;
var DISCOVERY_TIMEOUT_MS = 1e4;
var WellKnownProvider = class {
  id = "well-known";
  displayName = "Well-Known Skills";
  WELL_KNOWN_PATHS = [".well-known/agent-skills", ".well-known/skills"];
  INDEX_FILE = "index.json";
  match(url) {
    if (!url.startsWith("http://") && !url.startsWith("https://"))
      return { matches: false };
    try {
      const parsed = new URL(url);
      if ([
        "github.com",
        "gitlab.com",
        "huggingface.co"
      ].includes(parsed.hostname))
        return { matches: false };
      return {
        matches: true,
        sourceIdentifier: `wellknown/${parsed.hostname}`
      };
    } catch {
      return { matches: false };
    }
  }
  async fetchIndex(baseUrl, options) {
    return (await this.fetchIndexCandidates(baseUrl, options))[0] ?? null;
  }
  async fetchIndexCandidates(baseUrl, options) {
    try {
      const parsed = new URL(baseUrl);
      const basePath = parsed.pathname.replace(/\/$/, "");
      const signal = AbortSignal.timeout(DISCOVERY_TIMEOUT_MS);
      const urlsToTry = [];
      for (const wellKnownPath of this.WELL_KNOWN_PATHS) {
        urlsToTry.push({
          indexUrl: `${parsed.protocol}//${parsed.host}${basePath}/${wellKnownPath}/${this.INDEX_FILE}`,
          baseUrl: `${parsed.protocol}//${parsed.host}${basePath}`,
          wellKnownPath
        });
        if (basePath && basePath !== "")
          urlsToTry.push({
            indexUrl: `${parsed.protocol}//${parsed.host}/${wellKnownPath}/${this.INDEX_FILE}`,
            baseUrl: `${parsed.protocol}//${parsed.host}`,
            wellKnownPath
          });
      }
      const candidates = [];
      for (const { indexUrl, baseUrl: resolvedBase, wellKnownPath } of urlsToTry)
        try {
          const response = await fetch(indexUrl, {
            signal,
            ...options?.updateCheck ? { headers: { "X-Skills-Update-Check": "1" } } : {}
          });
          if (!response.ok)
            continue;
          const rawIndex = await response.json();
          const normalized = this.normalizeIndex(rawIndex, indexUrl, wellKnownPath);
          if (!normalized)
            continue;
          candidates.push({
            index: normalized.index,
            entries: normalized.entries,
            resolvedBaseUrl: resolvedBase,
            resolvedWellKnownPath: wellKnownPath,
            indexUrl
          });
        } catch {
          continue;
        }
      return candidates;
    } catch {
      return [];
    }
  }
  normalizeIndex(rawIndex, indexUrl, resolvedWellKnownPath) {
    if (!rawIndex || typeof rawIndex !== "object")
      return null;
    const record = rawIndex;
    if (!Array.isArray(record.skills))
      return null;
    const schema = record.$schema;
    if (schema === DISCOVERY_SCHEMA_V2) {
      const entries2 = [];
      const v2Entries = [];
      for (const entry of record.skills) {
        if (!this.isValidSkillEntryV2(entry))
          continue;
        const artifactUrl = new URL(entry.url, indexUrl).toString();
        entries2.push({
          version: "0.2.0",
          name: entry.name,
          description: entry.description,
          type: entry.type,
          artifactUrl,
          digest: entry.digest,
          indexEntry: entry
        });
        v2Entries.push(entry);
      }
      if (entries2.length === 0)
        return null;
      return {
        index: {
          $schema: DISCOVERY_SCHEMA_V2,
          skills: v2Entries
        },
        entries: entries2
      };
    }
    if (schema !== undefined)
      return null;
    const v1Entries = [];
    const entries = [];
    for (const entry of record.skills) {
      if (!this.isValidSkillEntryV1(entry))
        return null;
      v1Entries.push(entry);
      entries.push({
        version: "0.1.0",
        name: entry.name,
        description: entry.description,
        files: entry.files,
        baseUrl: this.getLegacySkillBaseUrl(indexUrl, resolvedWellKnownPath),
        wellKnownPath: resolvedWellKnownPath,
        indexEntry: entry
      });
    }
    return {
      index: { skills: v1Entries },
      entries
    };
  }
  getLegacySkillBaseUrl(indexUrl, wellKnownPath) {
    const parsed = new URL(indexUrl);
    const marker = `/${wellKnownPath}/${this.INDEX_FILE}`;
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.slice(0, -marker.length)}`;
  }
  isValidSkillName(name) {
    if (typeof name !== "string")
      return false;
    if (name.length < 1 || name.length > 64)
      return false;
    if (!/^[a-z0-9-]+$/.test(name))
      return false;
    if (name.startsWith("-") || name.endsWith("-"))
      return false;
    if (name.includes("--"))
      return false;
    return true;
  }
  isSafeLegacyFilePath(filePath) {
    if (typeof filePath !== "string" || filePath.length === 0)
      return false;
    if (filePath.startsWith("/") || filePath.startsWith("\\") || filePath.includes(".."))
      return false;
    if (filePath.includes("\x00"))
      return false;
    return true;
  }
  isValidSkillEntryV1(entry) {
    if (!entry || typeof entry !== "object")
      return false;
    const e = entry;
    if (!this.isValidSkillName(e.name))
      return false;
    if (typeof e.description !== "string" || !e.description)
      return false;
    if (!Array.isArray(e.files) || e.files.length === 0)
      return false;
    for (const file of e.files)
      if (!this.isSafeLegacyFilePath(file))
        return false;
    return e.files.some((f4) => typeof f4 === "string" && f4.toLowerCase() === "skill.md");
  }
  isValidSkillEntryV2(entry) {
    if (!entry || typeof entry !== "object")
      return false;
    const e = entry;
    if (!this.isValidSkillName(e.name))
      return false;
    if (typeof e.description !== "string" || !e.description || e.description.length > 1024)
      return false;
    if (e.type !== "skill-md" && e.type !== "archive")
      return false;
    if (typeof e.url !== "string" || !e.url)
      return false;
    if (typeof e.digest !== "string" || !/^sha256:[a-f0-9]{64}$/.test(e.digest))
      return false;
    try {
      new URL(e.url, "https://example.com/.well-known/agent-skills/index.json");
    } catch {
      return false;
    }
    return true;
  }
  async fetchSkill(url) {
    try {
      const parsed = new URL(url);
      const candidates = await this.fetchIndexCandidates(url);
      for (const result of candidates) {
        const { entries } = result;
        let skillName = null;
        const pathMatch = parsed.pathname.match(/\/.well-known\/(?:agent-skills|skills)\/([^/]+)\/?$/);
        if (pathMatch && pathMatch[1] && pathMatch[1] !== "index.json")
          skillName = pathMatch[1];
        else if (entries.length === 1)
          skillName = entries[0].name;
        if (!skillName)
          continue;
        const skillEntry = entries.find((s3) => s3.name === skillName);
        if (!skillEntry)
          continue;
        const skill = await this.fetchSkillByEntry(skillEntry);
        if (skill)
          return skill;
      }
      return null;
    } catch (error) {
      if (isDiagnostic(error, "SKILLS_WELLKNOWN_DIGEST_MISMATCH", "SKILLS_WELLKNOWN_FILE_FETCH_FAILED"))
        throw error;
      return null;
    }
  }
  async fetchSkillByEntry(baseUrlOrEntry, legacyEntry, legacyWellKnownPath) {
    if (typeof baseUrlOrEntry === "string") {
      if (!legacyEntry)
        return null;
      return this.fetchLegacySkillByEntry({
        version: "0.1.0",
        name: legacyEntry.name,
        description: legacyEntry.description,
        files: legacyEntry.files,
        baseUrl: baseUrlOrEntry,
        wellKnownPath: legacyWellKnownPath ?? this.WELL_KNOWN_PATHS[0],
        indexEntry: legacyEntry
      });
    }
    if (baseUrlOrEntry.version === "0.1.0")
      return this.fetchLegacySkillByEntry(baseUrlOrEntry);
    return this.fetchArtifactSkillByEntry(baseUrlOrEntry);
  }
  async fetchLegacySkillByEntry(entry) {
    const skill = await this.discoverLegacySkillByEntry(entry);
    return skill ? skill.load() : null;
  }
  async discoverLegacySkillByEntry(entry) {
    try {
      const skillBaseUrl = `${entry.baseUrl.replace(/\/$/, "")}/${entry.wellKnownPath}/${entry.name}`;
      const skillMdUrl = `${skillBaseUrl}/SKILL.md`;
      const response = await fetch(skillMdUrl);
      if (!response.ok)
        return null;
      const content = await response.text();
      const { data } = parseFrontmatter(content);
      if (typeof data.name !== "string" || typeof data.description !== "string")
        return null;
      const otherFiles = entry.files.filter((f4) => f4.toLowerCase() !== "skill.md");
      const skill = this.createSkill({
        name: data.name,
        description: data.description,
        content,
        installName: entry.name,
        sourceUrl: skillMdUrl,
        metadata: data.metadata,
        files: /* @__PURE__ */ new Map([["SKILL.md", content]]),
        indexEntry: entry.indexEntry
      });
      return {
        ...skill,
        filePaths: ["SKILL.md", ...otherFiles],
        async load() {
          const fileResults = await Promise.all(otherFiles.map(async (filePath) => {
            let status;
            try {
              const fileResponse = await fetch(`${skillBaseUrl}/${filePath}`);
              if (fileResponse.ok)
                return [filePath, new Uint8Array(await fileResponse.arrayBuffer())];
              status = fileResponse.status;
            } catch {}
            throw diagnostics.SKILLS_WELLKNOWN_FILE_FETCH_FAILED({
              skill: sanitizeMetadata(entry.name),
              path: sanitizeMetadata(filePath),
              status
            });
          }));
          return {
            ...skill,
            files: new Map([...skill.files, ...fileResults])
          };
        }
      };
    } catch {
      return null;
    }
  }
  async fetchArtifactSkillByEntry(entry) {
    try {
      const response = await fetch(entry.artifactUrl);
      if (!response.ok)
        return null;
      const contentType = response.headers.get("content-type") ?? "";
      const bytes = new Uint8Array(await response.arrayBuffer());
      const actualDigest = this.computeDigest(bytes);
      if (actualDigest !== entry.digest)
        throw diagnostics.SKILLS_WELLKNOWN_DIGEST_MISMATCH({
          skill: entry.name,
          expected: entry.digest,
          actual: actualDigest
        });
      if (entry.type === "skill-md") {
        const content2 = new TextDecoder().decode(bytes);
        const { data: data2 } = parseFrontmatter(content2);
        if (typeof data2.name !== "string" || typeof data2.description !== "string")
          return null;
        const files2 = /* @__PURE__ */ new Map;
        files2.set("SKILL.md", content2);
        return this.createSkill({
          name: data2.name,
          description: data2.description,
          content: content2,
          installName: entry.name,
          sourceUrl: entry.artifactUrl,
          metadata: data2.metadata,
          files: files2,
          indexEntry: entry.indexEntry
        });
      }
      const files = this.extractArchive(bytes, entry.artifactUrl, contentType);
      const skillMdBytes = files.get("SKILL.md");
      if (!skillMdBytes)
        return null;
      const content = typeof skillMdBytes === "string" ? skillMdBytes : new TextDecoder().decode(skillMdBytes);
      files.set("SKILL.md", content);
      const { data } = parseFrontmatter(content);
      if (typeof data.name !== "string" || typeof data.description !== "string")
        return null;
      return this.createSkill({
        name: data.name,
        description: data.description,
        content,
        installName: entry.name,
        sourceUrl: entry.artifactUrl,
        metadata: data.metadata,
        files,
        indexEntry: entry.indexEntry
      });
    } catch (error) {
      if (isDiagnostic(error, "SKILLS_WELLKNOWN_DIGEST_MISMATCH"))
        throw error;
      return null;
    }
  }
  createSkill(input) {
    return {
      name: sanitizeMetadata(input.name),
      description: sanitizeMetadata(input.description),
      content: input.content,
      installName: input.installName,
      sourceUrl: input.sourceUrl,
      metadata: input.metadata && typeof input.metadata === "object" ? input.metadata : undefined,
      files: input.files,
      indexEntry: input.indexEntry
    };
  }
  getScope(url) {
    try {
      const parsed = new URL(url);
      const scopePath = parsed.pathname.replace(/\/$/, "");
      if (!scopePath)
        return null;
      return {
        scopePath,
        rootBaseUrl: `${parsed.protocol}//${parsed.host}`
      };
    } catch {
      return null;
    }
  }
  async discoverSkills(url, options = {}) {
    try {
      const candidates = await this.fetchIndexCandidates(url);
      const scope = this.getScope(url);
      const scopedCandidates = scope ? candidates.filter((c3) => c3.resolvedBaseUrl !== scope.rootBaseUrl) : candidates;
      const includeInternal = options.includeInternal || shouldInstallInternalSkills();
      for (const result of scopedCandidates) {
        const skillPromises = result.entries.map(async (entry) => {
          if (entry.version === "0.1.0")
            return this.discoverLegacySkillByEntry(entry);
          const skill = await this.fetchArtifactSkillByEntry(entry);
          return skill ? {
            ...skill,
            filePaths: [...skill.files.keys()],
            load: async () => skill
          } : null;
        });
        const skills = (await Promise.all(skillPromises)).filter((s3) => s3 !== null).filter((skill) => includeInternal || !isInternalSkill(skill.metadata));
        if (skills.length > 0)
          return skills;
      }
      if (scope && scopedCandidates.length < candidates.length)
        throw diagnostics.SKILLS_WELLKNOWN_SCOPE_NOT_FOUND({
          scopePath: scope.scopePath,
          rootUrl: scope.rootBaseUrl
        });
      return [];
    } catch (error) {
      if (isDiagnostic(error, "SKILLS_WELLKNOWN_SCOPE_NOT_FOUND") || isDiagnostic(error, "SKILLS_WELLKNOWN_DIGEST_MISMATCH"))
        throw error;
      return [];
    }
  }
  async fetchAllSkills(url, options = {}) {
    const skills = await this.discoverSkills(url, options);
    return Promise.all(skills.map((skill) => skill.load()));
  }
  computeDigest(bytes) {
    return `sha256:${createHash$1("sha256").update(bytes).digest("hex")}`;
  }
  extractArchive(bytes, artifactUrl, contentType) {
    if (this.isZipArchive(bytes, artifactUrl, contentType))
      return new Map(readZipArchive(bytes, {
        maxExtractedBytes: MAX_ARCHIVE_UNPACKED_BYTES,
        maxEntries: MAX_ARCHIVE_FILES
      }));
    if (this.isTarGzArchive(bytes, artifactUrl, contentType))
      return this.extractTarGz(bytes);
    throw diagnostics.SKILLS_ARCHIVE_UNSUPPORTED_FORMAT();
  }
  isZipArchive(bytes, artifactUrl, contentType) {
    return contentType.includes("application/zip") || artifactUrl.toLowerCase().endsWith(".zip") || bytes[0] === 80 && bytes[1] === 75;
  }
  isTarGzArchive(bytes, artifactUrl, contentType) {
    const lower = artifactUrl.toLowerCase();
    return contentType.includes("application/gzip") || contentType.includes("application/x-gzip") || lower.endsWith(".tar.gz") || lower.endsWith(".tgz") || bytes[0] === 31 && bytes[1] === 139;
  }
  normalizeArchivePath(rawPath) {
    if (!rawPath || rawPath.includes("\x00"))
      return null;
    if (rawPath.startsWith("/") || rawPath.startsWith("\\"))
      return null;
    if (/^[A-Za-z]:/.test(rawPath))
      return null;
    if (rawPath.includes("\\"))
      return null;
    const parts = rawPath.split("/").filter(Boolean);
    if (parts.length === 0)
      return null;
    if (parts.some((part) => part === "." || part === ".."))
      return null;
    return parts.join("/");
  }
  addArchiveFile(files, path2, content, runningTotal) {
    const normalizedPath = this.normalizeArchivePath(path2);
    if (!normalizedPath)
      throw diagnostics.SKILLS_WELLKNOWN_ARCHIVE_UNSAFE_PATH({ path: path2 });
    runningTotal.bytes += content.byteLength;
    if (runningTotal.bytes > MAX_ARCHIVE_UNPACKED_BYTES)
      throw diagnostics.SKILLS_WELLKNOWN_ARCHIVE_TOO_LARGE();
    if (files.size >= MAX_ARCHIVE_FILES)
      throw diagnostics.SKILLS_WELLKNOWN_ARCHIVE_TOO_MANY_FILES();
    files.set(normalizedPath, content);
  }
  extractTarGz(bytes) {
    const tar = gunzipSync(Buffer.from(bytes));
    const files = /* @__PURE__ */ new Map;
    const runningTotal = { bytes: 0 };
    let offset = 0;
    while (offset + 512 <= tar.length) {
      const header = tar.subarray(offset, offset + 512);
      if (header.every((byte) => byte === 0))
        break;
      const name = this.readTarString(header, 0, 100);
      const sizeText = this.readTarString(header, 124, 12).trim();
      const typeFlag = header[156];
      const prefix = this.readTarString(header, 345, 155);
      const path2 = prefix ? `${prefix}/${name}` : name;
      const size = Number.parseInt(sizeText || "0", 8);
      if (!Number.isFinite(size) || size < 0)
        throw diagnostics.SKILLS_ARCHIVE_INVALID({ reason: "Invalid tar entry size" });
      offset += 512;
      if (typeFlag === 50 || typeFlag === 49)
        throw diagnostics.SKILLS_ARCHIVE_LINK_ENTRY();
      if (typeFlag === 0 || typeFlag === 48) {
        const content = tar.subarray(offset, offset + size);
        this.addArchiveFile(files, path2, new Uint8Array(content), runningTotal);
      }
      offset += Math.ceil(size / 512) * 512;
    }
    if (!files.has("SKILL.md"))
      throw diagnostics.SKILLS_ARCHIVE_MISSING_SKILL_MD();
    return files;
  }
  readTarString(buffer, offset, length) {
    const slice = buffer.subarray(offset, offset + length);
    const nul = slice.indexOf(0);
    return new TextDecoder().decode(nul >= 0 ? slice.subarray(0, nul) : slice);
  }
  toRawUrl(url) {
    try {
      const parsed = new URL(url);
      if (url.toLowerCase().endsWith("/skill.md"))
        return url;
      const primaryPath = this.WELL_KNOWN_PATHS[0];
      const pathMatch = parsed.pathname.match(/\/.well-known\/(?:agent-skills|skills)\/([^/]+)\/?$/);
      if (pathMatch && pathMatch[1]) {
        const basePath2 = parsed.pathname.replace(/\/.well-known\/(?:agent-skills|skills)\/.*$/, "");
        return `${parsed.protocol}//${parsed.host}${basePath2}/${primaryPath}/${pathMatch[1]}/SKILL.md`;
      }
      const basePath = parsed.pathname.replace(/\/$/, "");
      return `${parsed.protocol}//${parsed.host}${basePath}/${primaryPath}/${this.INDEX_FILE}`;
    } catch {
      return url;
    }
  }
  getSourceIdentifier(url) {
    try {
      return new URL(url).hostname.replace(/^www\./, "");
    } catch {
      return "unknown";
    }
  }
  async hasSkillsIndex(url) {
    return await this.fetchIndex(url) !== null;
  }
};
function computeWellKnownSkillDigest(skill) {
  if ("digest" in skill.indexEntry && skill.indexEntry.digest)
    return skill.indexEntry.digest;
  const hash = createHash$1("sha256");
  for (const path2 of Array.from(skill.files.keys()).sort()) {
    hash.update(path2);
    hash.update("\x00");
    hash.update(skill.files.get(path2));
    hash.update("\x00");
  }
  return `sha256:${hash.digest("hex")}`;
}
var wellKnownProvider = new WellKnownProvider;
var DEFAULT_DOWNLOAD_MAX_BYTES = 10485760;
var DEFAULT_EXTRACT_MAX_BYTES = 26214400;
var DEFAULT_EXTRACT_MAX_FILES = 1000;
var FETCH_TIMEOUT_MS = 30000;
function positiveIntegerOr(value, fallback) {
  return typeof value === "number" && Number.isInteger(value) && value > 0 ? value : fallback;
}
function getPositiveIntegerEnv(name, fallback) {
  const raw = process.env[name];
  if (!raw)
    return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function getDownloadLimits(options) {
  return {
    downloadMaxBytes: getPositiveIntegerEnv("SKILLS_DOWNLOAD_MAX_BYTES", positiveIntegerOr(options.downloadMaxBytes, DEFAULT_DOWNLOAD_MAX_BYTES)),
    extractMaxBytes: getPositiveIntegerEnv("SKILLS_EXTRACT_MAX_BYTES", positiveIntegerOr(options.extractMaxBytes, DEFAULT_EXTRACT_MAX_BYTES)),
    extractMaxFiles: getPositiveIntegerEnv("SKILLS_EXTRACT_MAX_FILES", positiveIntegerOr(options.extractMaxFiles, DEFAULT_EXTRACT_MAX_FILES))
  };
}
function isPathSafe(basePath, targetPath) {
  const normalizedBase = normalize$1(resolve$1(basePath));
  const normalizedTarget = normalize$1(resolve$1(targetPath));
  return normalizedTarget.startsWith(normalizedBase + sep$1) || normalizedTarget === normalizedBase;
}
function validateArchivePath(path2) {
  const normalized = path2.replace(/\\/g, "/").replace(/^\.\//, "");
  if (!normalized || normalized.endsWith("/"))
    return normalized;
  if (normalized.startsWith("/") || /^[a-zA-Z]:\//.test(normalized))
    return null;
  if (normalized.split("/").includes(".."))
    return null;
  return normalized;
}
function isRejectedArchive(error) {
  return isDiagnostic(error, "SKILLS_ARCHIVE_UNSAFE_PATH", "SKILLS_ARCHIVE_ENCRYPTED_ENTRY", "SKILLS_ARCHIVE_LINK_ENTRY", "SKILLS_ARCHIVE_TOO_MANY_FILES", "SKILLS_ARCHIVE_TOO_LARGE");
}
function incrementEntry(state, size, limits) {
  state.entries += 1;
  if (state.entries > limits.extractMaxFiles)
    throw diagnostics.SKILLS_ARCHIVE_TOO_MANY_FILES({
      count: state.entries,
      max: limits.extractMaxFiles,
      overrideEnv: "SKILLS_EXTRACT_MAX_FILES"
    });
  state.bytes += size;
  if (state.bytes > limits.extractMaxBytes)
    throw diagnostics.SKILLS_ARCHIVE_TOO_LARGE({
      maxBytes: limits.extractMaxBytes,
      overrideEnv: "SKILLS_EXTRACT_MAX_BYTES"
    });
}
async function downloadToFile(url, targetFile, limits) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    redirect: "follow"
  });
  if (!response.ok)
    throw diagnostics.SKILLS_DOWNLOAD_HTTP_ERROR({ status: response.status });
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const parsed = Number.parseInt(contentLength, 10);
    if (Number.isFinite(parsed) && parsed > limits.downloadMaxBytes)
      throw diagnostics.SKILLS_DOWNLOAD_TOO_LARGE({ maxBytes: limits.downloadMaxBytes });
  }
  if (!response.body)
    throw diagnostics.SKILLS_DOWNLOAD_NO_BODY();
  let downloaded = 0;
  const limitStream = new TransformStream({ transform(chunk, controller) {
    downloaded += chunk.byteLength;
    if (downloaded > limits.downloadMaxBytes)
      throw diagnostics.SKILLS_DOWNLOAD_TOO_LARGE({ maxBytes: limits.downloadMaxBytes });
    controller.enqueue(chunk);
  } });
  await pipeline(response.body.pipeThrough(limitStream), createWriteStream(targetFile));
}
async function isValidSkillMarkdown(filePath) {
  try {
    const { data } = parseFrontmatter(await readFile$1(filePath, "utf-8"));
    return typeof data.name === "string" && typeof data.description === "string";
  } catch {
    return false;
  }
}
async function extractZip(filePath, extractDir, limits) {
  const files = readZipArchive(await readFile$1(filePath), {
    maxExtractedBytes: limits.extractMaxBytes,
    maxEntries: limits.extractMaxFiles
  });
  for (const [path2, contents] of files) {
    const targetPath = join$1(extractDir, path2);
    if (!isPathSafe(extractDir, targetPath))
      throw diagnostics.SKILLS_ARCHIVE_UNSAFE_PATH({ path: path2 });
    await mkdir$1(dirname$1(targetPath), { recursive: true });
    await writeFile$1(targetPath, contents);
  }
}
function getTarEntryType(entry) {
  if (entry instanceof $e2)
    return entry.type;
  if (entry.isFile())
    return "File";
  if (entry.isDirectory())
    return "Directory";
  return "";
}
function isTarEntryFile(entry) {
  const type = getTarEntryType(entry);
  return type === "File" || type === "OldFile" || type === "ContiguousFile";
}
async function extractTar(filePath, extractDir, limits) {
  const state = {
    bytes: 0,
    entries: 0
  };
  let validationError;
  await So({
    strict: true,
    filter(entryPath, entry) {
      if (validationError)
        return false;
      try {
        const safePath = validateArchivePath(entryPath);
        if (safePath === null)
          throw diagnostics.SKILLS_ARCHIVE_UNSAFE_PATH({ path: entryPath });
        if (!isPathSafe(extractDir, join$1(extractDir, safePath)))
          throw diagnostics.SKILLS_ARCHIVE_UNSAFE_PATH({ path: entryPath });
        incrementEntry(state, entry.size, limits);
        if (isTarEntryFile(entry))
          return true;
        return getTarEntryType(entry) === "Directory";
      } catch (error) {
        if (isRejectedArchive(error)) {
          validationError = error;
          return false;
        }
        throw error;
      }
    },
    cwd: extractDir,
    preservePaths: false,
    noChmod: true,
    file: filePath
  });
  if (validationError)
    throw validationError;
}
async function tryExtractArchive(filePath, extractDir, limits) {
  const header = await readFile$1(filePath).then((buffer) => buffer.subarray(0, 512));
  const isZip = header[0] === 80 && header[1] === 75;
  const isGzip = header[0] === 31 && header[1] === 139;
  try {
    if (isZip) {
      await extractZip(filePath, extractDir, limits);
      return true;
    }
    if (isGzip) {
      await extractTar(filePath, extractDir, limits);
      return true;
    }
    await extractTar(filePath, extractDir, limits);
    return true;
  } catch (error) {
    await rm$1(extractDir, {
      recursive: true,
      force: true
    }).catch(() => {});
    await mkdir$1(extractDir, { recursive: true });
    if (isRejectedArchive(error))
      throw error;
    return false;
  }
}
async function getSingleTopLevelDirectory(dir) {
  const { readdir: readdir2 } = await import("node:fs/promises");
  const visibleEntries = (await readdir2(dir, { withFileTypes: true })).filter((entry) => entry.name !== "__MACOSX");
  if (visibleEntries.length !== 1 || !visibleEntries[0].isDirectory())
    return null;
  return join$1(dir, visibleEntries[0].name);
}
async function downloadSource(url, options = {}) {
  const limits = getDownloadLimits(options);
  const tempDir = await mkdtemp$1(join$1(tmpdir$1(), "skills-download-"));
  const downloadedFile = join$1(tempDir, "source.download");
  const extractDir = join$1(tempDir, "extract");
  try {
    await downloadToFile(url, downloadedFile, limits);
    if ((await stat$1(downloadedFile)).size === 0)
      throw diagnostics.SKILLS_DOWNLOAD_EMPTY();
    if (await isValidSkillMarkdown(downloadedFile)) {
      const skillDir = join$1(tempDir, "skill");
      await mkdir$1(skillDir, { recursive: true });
      await writeFile$1(join$1(skillDir, "SKILL.md"), await readFile$1(downloadedFile));
      return {
        rootDir: skillDir,
        tempDir,
        kind: "skill-md"
      };
    }
    await mkdir$1(extractDir, { recursive: true });
    if (await tryExtractArchive(downloadedFile, extractDir, limits))
      return {
        rootDir: await getSingleTopLevelDirectory(extractDir) ?? extractDir,
        tempDir,
        kind: "archive"
      };
    throw diagnostics.SKILLS_DOWNLOAD_NOT_A_SKILL();
  } catch (error) {
    await rm$1(tempDir, {
      recursive: true,
      force: true
    }).catch(() => {});
    throw error;
  }
}
var AGENTS_DIR = ".agents";
var LOCK_FILE = ".skill-lock.json";
var CURRENT_VERSION = 3;
function getSkillLockPath() {
  const xdgStateHome = process.env.XDG_STATE_HOME;
  if (xdgStateHome)
    return join(xdgStateHome, "skills", LOCK_FILE);
  return join(homedir(), AGENTS_DIR, LOCK_FILE);
}
async function readSkillLock() {
  const lockPath = getSkillLockPath();
  try {
    const content = await readFile(lockPath, "utf-8");
    const parsed = JSON.parse(content);
    if (typeof parsed.version !== "number" || !parsed.skills)
      return createEmptyLockFile();
    if (parsed.version < CURRENT_VERSION)
      return createEmptyLockFile();
    return parsed;
  } catch (error) {
    return createEmptyLockFile();
  }
}
async function writeSkillLock(lock) {
  const lockPath = getSkillLockPath();
  await mkdir(dirname(lockPath), { recursive: true });
  const content = JSON.stringify(lock, null, 2);
  await writeFile(lockPath, content, "utf-8");
}
function getGitHubToken() {
  if (process.env.GITHUB_TOKEN)
    return process.env.GITHUB_TOKEN;
  if (process.env.GH_TOKEN)
    return process.env.GH_TOKEN;
  return null;
}
async function addSkillToLock(skillName, entry) {
  const lock = await readSkillLock();
  const now = (/* @__PURE__ */ new Date()).toISOString();
  const existingEntry = lock.skills[skillName];
  lock.skills[skillName] = {
    ...entry,
    installedAt: existingEntry?.installedAt ?? now,
    updatedAt: now
  };
  await writeSkillLock(lock);
}
async function removeSkillFromLock(skillName) {
  const lock = await readSkillLock();
  if (!(skillName in lock.skills))
    return false;
  delete lock.skills[skillName];
  await writeSkillLock(lock);
  return true;
}
async function getSkillFromLock(skillName) {
  return (await readSkillLock()).skills[skillName] ?? null;
}
function createEmptyLockFile() {
  return {
    version: CURRENT_VERSION,
    skills: {},
    dismissed: {}
  };
}
var DOWNLOAD_BASE_URL = process.env.SKILLS_DOWNLOAD_URL || "https://skills.sh";
var BLOB_ALLOWED_REPOS = { "zapier/connectors": { downloadUrl: (slug) => `https://connectors-skills.zapier.com/download/${encodeURIComponent(slug)}/snapshot.json` } };
var FETCH_TIMEOUT = 1e4;
var GH_API_MAX_BUFFER = 16777216;
function toSkillSlug(name) {
  return name.toLowerCase().replace(/[\s_]+/g, "-").replace(/[^a-z0-9-]/g, "").replace(/-+/g, "-").replace(/^-|-$/g, "");
}
var _rateLimitedThisSession = false;
async function fetchTreeBranch(ownerRepo, branch, token) {
  try {
    const githubHost = getGitHubHost();
    const url = `${githubHost === "github.com" ? "https://api.github.com" : `https://${githubHost}/api/v3`}/repos/${ownerRepo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
    const headers = {
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "skills-cli"
    };
    if (token)
      headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(FETCH_TIMEOUT)
    });
    if (response.ok) {
      const data = await response.json();
      return {
        tree: {
          sha: data.sha,
          branch,
          tree: data.tree
        },
        rateLimited: false,
        authRetryable: false
      };
    }
    return {
      tree: null,
      rateLimited: response.status === 403 && response.headers.get("x-ratelimit-remaining") === "0",
      authRetryable: response.status === 401 || response.status === 404
    };
  } catch {
    return {
      tree: null,
      rateLimited: false,
      authRetryable: false
    };
  }
}
async function fetchTreeWithToken(ownerRepo, branches, getToken) {
  const token = getToken();
  if (!token)
    return null;
  for (const branch of branches) {
    const result = await fetchTreeBranch(ownerRepo, branch, token);
    if (result.tree)
      return result.tree;
  }
  return null;
}
async function fetchTreeWithGitHubCli(ownerRepo, branches) {
  for (const branch of branches)
    try {
      const endpoint = `repos/${ownerRepo}/git/trees/${encodeURIComponent(branch)}?recursive=1`;
      const stdout = await new Promise((resolve2, reject) => {
        execFile("gh", [
          "api",
          endpoint,
          "--method",
          "GET",
          "--hostname",
          getGitHubHost()
        ], {
          encoding: "utf8",
          timeout: FETCH_TIMEOUT,
          maxBuffer: GH_API_MAX_BUFFER,
          windowsHide: true,
          env: {
            ...process.env,
            GH_PROMPT_DISABLED: "1"
          }
        }, (error, output) => {
          if (error)
            reject(error);
          else
            resolve2(output);
        });
      });
      const data = JSON.parse(stdout);
      if (typeof data.sha !== "string" || !Array.isArray(data.tree))
        continue;
      return {
        sha: data.sha,
        branch,
        tree: data.tree
      };
    } catch {}
  return null;
}
async function fetchTreeWithAvailableAuth(ownerRepo, branches, getToken) {
  if (getToken) {
    const tree = await fetchTreeWithToken(ownerRepo, branches, getToken);
    if (tree)
      return tree;
  }
  return fetchTreeWithGitHubCli(ownerRepo, branches);
}
async function fetchRepoTree(ownerRepo, ref, getToken) {
  const branches = ref ? [ref] : [
    "HEAD",
    "main",
    "master"
  ];
  if (_rateLimitedThisSession)
    return fetchTreeWithAvailableAuth(ownerRepo, branches, getToken);
  let rateLimited = false;
  let authRetryable = false;
  for (const branch of branches) {
    const result = await fetchTreeBranch(ownerRepo, branch, null);
    if (result.tree)
      return result.tree;
    if (result.rateLimited) {
      rateLimited = true;
      break;
    }
    if (result.authRetryable) {
      authRetryable = true;
      break;
    }
  }
  if (!(rateLimited || authRetryable))
    return null;
  if (rateLimited)
    _rateLimitedThisSession = true;
  return fetchTreeWithAvailableAuth(ownerRepo, branches, getToken);
}
function getSkillFolderHashFromTree(tree, skillPath) {
  let folderPath = skillPath.replace(/\\/g, "/");
  if (folderPath.toLowerCase().endsWith("/skill.md"))
    folderPath = folderPath.slice(0, -9);
  else if (folderPath.toLowerCase().endsWith("skill.md"))
    folderPath = folderPath.slice(0, -8);
  if (folderPath.endsWith("/"))
    folderPath = folderPath.slice(0, -1);
  if (!folderPath)
    return tree.sha;
  return tree.tree.find((e) => e.type === "tree" && e.path === folderPath)?.sha ?? null;
}
var PRIORITY_PREFIXES = [
  "",
  "skills/",
  "skills/.curated/",
  "skills/.experimental/",
  "skills/.system/",
  ...AGENT_PROJECT_SKILL_DIRS.map((dir) => `${dir}/`)
];
function findSkillMdPaths(tree, subpath, extraContainers = []) {
  const allSkillMds = tree.tree.filter((e) => e.type === "blob" && e.path.split("/").at(-1).toLowerCase() === "skill.md").map((e) => e.path);
  const prefix = subpath ? subpath.endsWith("/") ? subpath : subpath + "/" : "";
  const filtered = prefix ? allSkillMds.filter((p3) => p3.startsWith(prefix) || p3 === prefix + "SKILL.md") : allSkillMds;
  if (filtered.length === 0)
    return [];
  const priorityResults = [];
  const seen = /* @__PURE__ */ new Set;
  const SKIP_DIRS2 = /* @__PURE__ */ new Set([
    "node_modules",
    ".git",
    "dist",
    "build",
    "__pycache__"
  ]);
  const lowerSkillMdSet = new Set(filtered.map((p3) => p3.toLowerCase()));
  const extraPrefixes = extraContainers.reduce((prefixes, dir) => {
    const prefix2 = `${dir}/`;
    if (!PRIORITY_PREFIXES.includes(prefix2))
      prefixes.add(prefix2);
    return prefixes;
  }, /* @__PURE__ */ new Set);
  const priorityPrefixes = [...PRIORITY_PREFIXES, ...extraPrefixes];
  for (const priorityPrefix of priorityPrefixes) {
    const fullPrefix = prefix + priorityPrefix;
    const isContainer = priorityPrefix !== "";
    const isExtraContainer = extraPrefixes.has(priorityPrefix);
    for (const skillMd of filtered) {
      if (!skillMd.startsWith(fullPrefix))
        continue;
      const rest = skillMd.slice(fullPrefix.length);
      if (rest.toLowerCase() === "skill.md") {
        if (isExtraContainer)
          continue;
        if (!seen.has(skillMd)) {
          priorityResults.push(skillMd);
          seen.add(skillMd);
        }
        continue;
      }
      const parts = rest.split("/");
      if (parts.length === 2 && parts[1].toLowerCase() === "skill.md") {
        if (!seen.has(skillMd)) {
          priorityResults.push(skillMd);
          seen.add(skillMd);
        }
        continue;
      }
      const skillDirs = parts.slice(0, -1);
      const hasAncestorSkill = skillDirs.slice(0, -1).some((_4, index) => {
        const ancestorPath = skillDirs.slice(0, index + 1).join("/");
        return lowerSkillMdSet.has(`${fullPrefix}${ancestorPath}/SKILL.md`.toLowerCase());
      });
      if (isContainer && parts.length >= 3 && parts.length <= 4 && parts.at(-1).toLowerCase() === "skill.md" && skillDirs.every((part) => !SKIP_DIRS2.has(part)) && !hasAncestorSkill) {
        if (!seen.has(skillMd)) {
          priorityResults.push(skillMd);
          seen.add(skillMd);
        }
      }
    }
  }
  if (priorityResults.length > 0)
    return priorityResults;
  return filtered.filter((p3) => {
    return p3.split("/").length <= 6;
  });
}
async function fetchRawContent(ownerRepo, branch, filePath) {
  try {
    const url = `https://raw.githubusercontent.com/${ownerRepo}/${branch}/${filePath}`;
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    if (!response.ok)
      return null;
    return await response.text();
  } catch {
    return null;
  }
}
async function fetchSkillsShPaths(ownerRepo, tree, subpath) {
  const configPath = (subpath ? subpath.replace(/\/+$/, "") + "/" : "") + SKILLS_SH_CONFIG_FILE;
  if (!tree.tree.some((e) => e.type === "blob" && e.path === configPath))
    return [];
  const content = await fetchRawContent(ownerRepo, tree.branch, configPath);
  return content ? parseSkillsShPaths(content) : [];
}
async function fetchSkillDownload(source, slug) {
  try {
    const [owner, repo] = source.split("/");
    const defaultUrl = `${DOWNLOAD_BASE_URL}/api/download/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(slug)}`;
    const url = BLOB_ALLOWED_REPOS[source.toLowerCase()]?.downloadUrl(slug) ?? defaultUrl;
    const response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
    if (!response.ok)
      return null;
    return await response.json();
  } catch {
    return null;
  }
}
function computeSnapshotHash(files) {
  return hashSkillFiles(files.filter((file) => !isExcludedPath(file.path)).map((file) => ({
    path: file.path,
    content: file.contents
  })));
}
function getSkillFolderPath(skillMdPath) {
  const pathLower = skillMdPath.toLowerCase();
  if (pathLower.endsWith("/skill.md"))
    return skillMdPath.slice(0, -9);
  if (pathLower === "skill.md")
    return "";
  return skillMdPath.slice(0, -9);
}
function isInstallableSnapshotPath(path2) {
  return !isExcludedPath(path2);
}
function hasCurrentSnapshot(tree, skillMdPath, files) {
  const folderPath = getSkillFolderPath(skillMdPath);
  const folderPrefix = folderPath ? `${folderPath}/` : "";
  const blobs = new Map(tree.tree.filter((entry) => entry.type === "blob" && entry.path.startsWith(folderPrefix)).map((entry) => [entry.path.slice(folderPrefix.length), entry.sha]));
  const requiredPaths = folderPath ? [...blobs.keys()].filter(isInstallableSnapshotPath) : [skillMdPath];
  const snapshotPaths = new Set(files.map((file) => file.path));
  if (!requiredPaths.every((path2) => snapshotPaths.has(path2)))
    return false;
  return files.every((file) => {
    const sha = createHash$1("sha1").update(`blob ${Buffer.byteLength(file.contents, "utf8")}\x00`).update(file.contents, "utf8").digest("hex");
    return blobs.get(file.path) === sha;
  });
}
async function tryBlobInstall(ownerRepo, options = {}) {
  if (options.ref !== undefined)
    return null;
  const tree = await fetchRepoTree(ownerRepo, options.ref, options.getToken);
  if (!tree)
    return null;
  const extraContainers = await fetchSkillsShPaths(ownerRepo, tree, options.subpath);
  let skillMdPaths = findSkillMdPaths(tree, options.subpath, extraContainers);
  if (skillMdPaths.length === 0)
    return null;
  if (options.skillFilter) {
    const filterSlug = toSkillSlug(options.skillFilter);
    const filtered = skillMdPaths.filter((p3) => {
      const parts = p3.split("/");
      if (parts.length < 2)
        return false;
      const folderName = parts[parts.length - 2];
      return toSkillSlug(folderName) === filterSlug;
    });
    if (filtered.length > 0)
      skillMdPaths = filtered;
  }
  const mdFetches = await Promise.all(skillMdPaths.map(async (mdPath) => {
    return {
      mdPath,
      content: await fetchRawContent(ownerRepo, tree.branch, mdPath)
    };
  }));
  const parsedSkills = [];
  for (const { mdPath, content } of mdFetches) {
    if (!content)
      continue;
    const { data } = parseFrontmatter(content);
    if (!data.name || !data.description)
      continue;
    if (typeof data.name !== "string" || typeof data.description !== "string")
      continue;
    if (isInternalSkill(data.metadata) && !options.includeInternal)
      continue;
    const safeName = sanitizeMetadata(data.name);
    const safeDescription = sanitizeMetadata(data.description);
    parsedSkills.push({
      mdPath,
      name: safeName,
      description: safeDescription,
      content,
      slug: toSkillSlug(safeName),
      metadata: data.metadata
    });
  }
  if (parsedSkills.length === 0)
    return null;
  let filteredSkills = parsedSkills;
  if (options.skillFilter) {
    const filterSlug = toSkillSlug(options.skillFilter);
    const nameFiltered = parsedSkills.filter((s3) => s3.slug === filterSlug);
    if (nameFiltered.length > 0)
      filteredSkills = nameFiltered;
    if (filteredSkills.length === 0)
      return null;
  }
  const source = ownerRepo.toLowerCase();
  const downloads = await Promise.all(filteredSkills.map(async (skill) => {
    return {
      skill,
      download: await fetchSkillDownload(source, skill.slug)
    };
  }));
  if (!downloads.every((d2) => d2.download !== null))
    return null;
  const blobSkills = downloads.map(({ skill, download }) => {
    const files = getSkillFolderPath(skill.mdPath) ? download.files : download.files.filter((file) => file.path.toLowerCase() === "skill.md");
    return {
      name: skill.name,
      description: skill.description,
      path: "",
      rawContent: skill.content,
      metadata: skill.metadata,
      files,
      snapshotHash: computeSnapshotHash(files),
      repoPath: skill.mdPath
    };
  });
  if (!blobSkills.every((skill) => hasCurrentSnapshot(tree, skill.repoPath, skill.files)))
    return null;
  return {
    skills: blobSkills,
    tree
  };
}
var version$1 = "1.8.1";
var NOTION_API_VERSION = "2026-03-11";
var NTN_TIMEOUT_MS = 30000;
var NTN_MAX_BUFFER_BYTES = 10485760;
var NOTION_DOWNLOAD_MAX_BYTES = 52428800;
var NOTION_EXTRACT_MAX_BYTES = 104857600;
var NOTION_EXTRACT_MAX_FILES = 5000;
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function assertString(value, field) {
  if (typeof value !== "string" || value.length === 0)
    throw diagnostics.SKILLS_NOTION_RESPONSE_MISSING_FIELD({
      response: "response",
      field
    });
  return value;
}
function optionalMetadata(value, field) {
  if (value === undefined || value === null)
    return "";
  if (typeof value !== "string")
    throw diagnostics.SKILLS_NOTION_RESPONSE_INVALID_FIELD({
      response: "response",
      field
    });
  return sanitizeMetadata(value);
}
function parsePack(value) {
  if (!isRecord(value))
    throw diagnostics.SKILLS_NOTION_INVALID_PACK();
  if (typeof value.name !== "string")
    throw diagnostics.SKILLS_NOTION_RESPONSE_MISSING_FIELD({
      response: "response",
      field: "pack.name"
    });
  const name = sanitizeMetadata(value.name);
  if (!name)
    return null;
  return {
    id: assertString(value.id, "pack.id"),
    name,
    description: optionalMetadata(value.description, "pack.description"),
    version_id: assertString(value.version_id, "pack.version_id")
  };
}
function parsePackList(value) {
  if (!isRecord(value) || !Array.isArray(value.results))
    throw diagnostics.SKILLS_NOTION_INVALID_LIST_RESPONSE();
  if (typeof value.has_more !== "boolean")
    throw diagnostics.SKILLS_NOTION_RESPONSE_MISSING_FIELD({
      response: "list response",
      field: "has_more"
    });
  const nextCursor = value.next_cursor;
  if (nextCursor !== null && typeof nextCursor !== "string")
    throw diagnostics.SKILLS_NOTION_RESPONSE_INVALID_FIELD({
      response: "list response",
      field: "next_cursor"
    });
  return {
    results: value.results.map(parsePack).filter((pack) => pack !== null),
    next_cursor: nextCursor,
    has_more: value.has_more
  };
}
function parseDirectory(value, label) {
  if (!isRecord(value))
    throw diagnostics.SKILLS_NOTION_INVALID_DIRECTORY_RESPONSE({ label });
  return {
    id: assertString(value.id, `${label} directory id`),
    version_id: assertString(value.version_id, `${label} directory version_id`),
    url: assertString(value.url, `${label} directory url`)
  };
}
function downloadNotionDirectory(url) {
  return downloadSource(url, {
    downloadMaxBytes: NOTION_DOWNLOAD_MAX_BYTES,
    extractMaxBytes: NOTION_EXTRACT_MAX_BYTES,
    extractMaxFiles: NOTION_EXTRACT_MAX_FILES
  });
}
function debugNtn(args) {
  if (process.env.SKILLS_DEBUG === "1")
    console.error(`[notion] ntn ${args.join(" ")}`);
}
async function runNtnApi(args) {
  debugNtn(args);
  return new Promise((resolve2, reject) => {
    const child = spawn2("ntn", args, {
      env: process.env,
      stdio: [
        "ignore",
        "pipe",
        "pipe"
      ]
    });
    const stdoutChunks = [];
    const stderrChunks = [];
    let outputBytes = 0;
    let settled = false;
    const finish = (callback) => {
      if (settled)
        return;
      settled = true;
      clearTimeout(timeout);
      callback();
    };
    const fail = (error) => finish(() => reject(error));
    const append = (chunks, chunk) => {
      outputBytes += chunk.length;
      if (outputBytes > NTN_MAX_BUFFER_BYTES) {
        child.kill("SIGTERM");
        fail(diagnostics.SKILLS_NOTION_API_OUTPUT_TOO_LARGE());
        return;
      }
      chunks.push(chunk);
    };
    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
      fail(diagnostics.SKILLS_NOTION_API_TIMEOUT({ seconds: NTN_TIMEOUT_MS / 1000 }));
    }, NTN_TIMEOUT_MS);
    child.stdout.on("data", (chunk) => append(stdoutChunks, chunk));
    child.stderr.on("data", (chunk) => append(stderrChunks, chunk));
    child.on("error", (error) => {
      if (error.code === "ENOENT") {
        fail(diagnostics.SKILLS_NOTION_CLI_MISSING({ cause: error }));
        return;
      }
      fail(diagnostics.SKILLS_NOTION_CLI_START_FAILED({
        detail: stripTerminalEscapes(error.message),
        cause: error
      }));
    });
    child.on("close", (code) => {
      const stdout = Buffer.concat(stdoutChunks).toString("utf8");
      const stderr = stripTerminalEscapes(Buffer.concat(stderrChunks).toString("utf8")).trim();
      if (code === 0) {
        finish(() => resolve2(stdout));
        return;
      }
      fail(diagnostics.SKILLS_NOTION_API_FAILED({
        stderr,
        exitCode: code
      }));
    });
  });
}
async function fetchNotionJson(args, label, runNtn = runNtnApi) {
  const output = await runNtn([
    "api",
    ...args,
    "--notion-version",
    NOTION_API_VERSION
  ]);
  try {
    return JSON.parse(output);
  } catch (error) {
    if (error instanceof SyntaxError)
      throw diagnostics.SKILLS_NOTION_INVALID_JSON({
        label,
        cause: error
      });
    throw error;
  }
}
async function fetchNotionPacks(options = {}) {
  const runNtn = options.runNtn ?? runNtnApi;
  const packs = [];
  const seenCursors = /* @__PURE__ */ new Set;
  let cursor2 = null;
  do {
    const args = ["/v1/ai/plugins", "page_size==100"];
    if (cursor2)
      args.push(`start_cursor==${cursor2}`);
    const page = parsePackList(await fetchNotionJson(args, "the Notion packs list", runNtn));
    packs.push(...page.results);
    if (!page.has_more)
      break;
    if (!page.next_cursor || seenCursors.has(page.next_cursor))
      throw diagnostics.SKILLS_NOTION_INVALID_CURSOR();
    cursor2 = page.next_cursor;
    seenCursors.add(cursor2);
  } while (cursor2);
  return packs;
}
async function fetchNotionPackDirectory(pack, options = {}) {
  const directory = parseDirectory(await fetchNotionJson([`/v1/ai/plugins/${encodeURIComponent(pack.id)}`], `Notion pack ${JSON.stringify(pack.name)}`, options.runNtn), "pack");
  if (directory.id !== pack.id || directory.version_id !== pack.version_id)
    throw diagnostics.SKILLS_NOTION_PACK_CHANGED({ pack: pack.name });
  return directory;
}
var NOTION_HOSTNAME = /(^|\.)notion\.(so|com)$/;
var NOTION_PAGE_ID = /(?:^|-)([0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
function formatPageId(rawId) {
  const hex = rawId.replace(/-/g, "");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
function parseNotionSkillUrl(source) {
  let url;
  try {
    url = new URL(source);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:")
    return null;
  if (!NOTION_HOSTNAME.test(url.hostname.toLowerCase()))
    return null;
  const lastSegment = url.pathname.split("/").filter(Boolean).pop();
  if (!lastSegment)
    return null;
  let decoded;
  try {
    decoded = decodeURIComponent(lastSegment);
  } catch {
    decoded = lastSegment;
  }
  const match = decoded.toLowerCase().match(NOTION_PAGE_ID);
  return match ? formatPageId(match[1]) : null;
}
var NOTION_PACK_URL_PREFIX = "notion://packs/";
function parseNotionPackUrl(url) {
  if (!url.startsWith(NOTION_PACK_URL_PREFIX))
    return null;
  return decodeURIComponent(url.slice(15)) || null;
}
function isNotionPackUrl(url) {
  return parseNotionPackUrl(url) !== null;
}
async function downloadNotionUrl(url, options = {}) {
  const download = options.download ?? downloadNotionDirectory;
  const packId = parseNotionPackUrl(url);
  if (packId) {
    const pack = (await fetchNotionPacks({ runNtn: options.runNtn })).find((candidate) => candidate.id === packId);
    if (!pack)
      throw diagnostics.SKILLS_NOTION_NO_MATCHING_PACKS({ requested: [packId] });
    return download((await fetchNotionPackDirectory(pack, { runNtn: options.runNtn })).url);
  }
  const pageId = parseNotionSkillUrl(url);
  if (pageId)
    return download((await fetchNotionSkillDirectory(pageId, { runNtn: options.runNtn })).url);
  return null;
}
async function fetchNotionSkillDirectory(pageId, options = {}) {
  return parseDirectory(await fetchNotionJson([`/v1/ai/skills/${encodeURIComponent(pageId)}`], `Notion skill ${pageId}`, options.runNtn), "skill");
}
async function isSourcePrivate(source) {
  const ownerRepo = parseOwnerRepo(source);
  if (!ownerRepo)
    return false;
  return isRepoPrivate(ownerRepo.owner, ownerRepo.repo);
}
function getLockSource(parsedUrl, normalizedSource) {
  if (parsedUrl.startsWith("git@") || parsedUrl.startsWith("ssh://"))
    return parsedUrl;
  if (parsedUrl.startsWith("http://") || parsedUrl.startsWith("https://"))
    try {
      if (new URL(parsedUrl).hostname !== "github.com")
        return parsedUrl;
    } catch {
      return normalizedSource;
    }
  return normalizedSource;
}
function getProjectLockSourceUrl(sourceType, sourceUrl) {
  return sourceType === "git" || sourceType === "gitlab" ? sourceUrl : undefined;
}
function targetDisplayName(target) {
  const base = agents[target.agent].displayName;
  return target.subagent ? `${base} (${target.subagent})` : base;
}
function ensureUniversalAgents(targetAgents) {
  const universalAgents = getUniversalAgents().filter(readsCanonicalGlobally);
  const result = [...targetAgents];
  for (const ua of universalAgents)
    if (!result.includes(ua))
      result.push(ua);
  return result;
}
async function nonInteractiveTargetAgents(cwd = process.cwd()) {
  const detected = await detectAgent();
  const hostAgent = detected.isAgent ? getAgentType(detected.agent.name) : null;
  if (hostAgent)
    return ensureUniversalAgents([hostAgent]);
  const installed = await detectInstalledAgents(cwd);
  if (installed.includes("eve"))
    return ["eve"];
  if (installed.length === 0)
    return Object.keys(agents);
  return ensureUniversalAgents(installed);
}
function defaultInstallMode(targets) {
  const allEve = targets.every((t2) => t2.agent === "eve");
  return new Set(targets.map((t2) => t2.subagent ? `eve:subagent:${t2.subagent}` : agents[t2.agent].skillsDir)).size <= 1 || allEve ? "copy" : "symlink";
}
setVersion(version$1);
var silentSpinner = {
  start: () => {},
  stop: () => {},
  message: () => {}
};
function isLockableDownloadUrl(url) {
  try {
    const parsed = new URL(url);
    return !parsed.search && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
function downloadSkillPath(rootDir, skillDir) {
  const folder = relative(rootDir, skillDir).split(sep).join("/");
  return folder ? `${folder}/SKILL.md` : "SKILL.md";
}
function findDownloadRoot(roots, skill) {
  let found;
  for (const root of roots) {
    const rel = relative(root.rootDir, skill.path);
    if (rel.startsWith("..") || isAbsolute(rel))
      continue;
    if (!found || root.rootDir.length > found.rootDir.length)
      found = root;
  }
  return found;
}
function downloadLockFields(roots, skills) {
  const fields = /* @__PURE__ */ new Map;
  const unlockable = /* @__PURE__ */ new Map;
  for (const skill of skills) {
    const root = findDownloadRoot(roots, skill);
    if (!root)
      continue;
    if (!isLockableDownloadUrl(root.url)) {
      unlockable.set(root.url, [...unlockable.get(root.url) ?? [], skill.name]);
      continue;
    }
    fields.set(skill, {
      source: isNotionPackUrl(root.url) ? "notion" : root.url,
      sourceUrl: root.url,
      sourceType: "download",
      skillPath: downloadSkillPath(root.rootDir, skill.path)
    });
  }
  for (const [url, names] of unlockable)
    warn(diagnostics.SKILLS_DOWNLOAD_NOT_LOCKED({
      url: redactUrl(url),
      skills: names
    }));
  return fields;
}
function redactUrl(url) {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return url;
  }
}
async function resolveSkills(parsed, options, spinner2) {
  const { includeInternal } = options;
  let skills;
  let blobResult = null;
  let tempDir = null;
  let discoveredRoot;
  let downloads;
  const missingRequestedSkill = (found) => !!options.requestedSkills?.some((name) => name !== "*" && filterSkills(found, [name]).length === 0);
  const discover = async (rootDir) => {
    discoveredRoot = rootDir;
    const found = await discoverSkills(rootDir, parsed.subpath, options);
    if (!options.fullDepth && missingRequestedSkill(found))
      return discoverSkills(rootDir, parsed.subpath, {
        ...options,
        fullDepth: true
      });
    return found;
  };
  try {
    if (parsed.type === "local") {
      spinner2.start("Discovering skills…");
      skills = await discover(parsed.localPath);
    } else if (parsed.type === "well-known" || parsed.type === "download") {
      spinner2.start("Downloading source...");
      const downloaded = parsed.type === "download" && await downloadNotionUrl(parsed.url) || await downloadSource(parsed.url);
      tempDir = downloaded.tempDir;
      downloads = [{
        url: parsed.url,
        rootDir: downloaded.rootDir
      }];
      spinner2.stop(`Downloaded ${downloaded.kind === "skill-md" ? "SKILL.md file" : "archive"}`);
      spinner2.start("Discovering skills...");
      skills = await discover(downloaded.rootDir);
    } else if (parsed.type === "github" && !options.fullDepth) {
      let attemptedBlobInstall = false;
      const BLOB_ALLOWED_OWNERS = [
        "vercel",
        "vercel-labs",
        "heygen-com",
        "remotion-dev"
      ];
      const ownerRepo = getOwnerRepo(parsed);
      const owner = ownerRepo?.split("/")[0]?.toLowerCase();
      const isSelfHostedRepo = !!ownerRepo && Object.hasOwn(BLOB_ALLOWED_REPOS, ownerRepo.toLowerCase());
      if (ownerRepo && owner && (isSelfHostedRepo || BLOB_ALLOWED_OWNERS.includes(owner))) {
        attemptedBlobInstall = true;
        spinner2.start("Fetching skills…");
        blobResult = await tryBlobInstall(ownerRepo, {
          subpath: parsed.subpath,
          skillFilter: parsed.skillFilter,
          ref: parsed.ref,
          getToken: getGitHubToken,
          includeInternal
        });
      }
      if (blobResult && missingRequestedSkill(blobResult.skills))
        blobResult = null;
      if (blobResult) {
        skills = blobResult.skills;
        spinner2.stop(`Found ${pc.green(skills.length)} skill${skills.length > 1 ? "s" : ""}`);
      } else {
        if (attemptedBlobInstall)
          spinner2.message("Cloning repository…");
        else
          spinner2.start("Cloning repository…");
        tempDir = await cloneRepo(parsed.url, parsed.ref);
        spinner2.stop("Repository cloned");
        spinner2.start("Discovering skills…");
        skills = await discover(tempDir);
      }
    } else {
      spinner2.start("Cloning repository…");
      tempDir = await cloneRepo(parsed.url, parsed.ref);
      spinner2.stop("Repository cloned");
      spinner2.start("Discovering skills…");
      skills = await discover(tempDir);
    }
  } catch (error) {
    await cleanup(tempDir);
    throw error;
  }
  return {
    skills,
    tempDir,
    blobResult,
    ...discoveredRoot && { rootDir: discoveredRoot },
    ...downloads && { downloads }
  };
}
function isWellKnownSourceSkill(skill) {
  return "wellKnown" in skill;
}
async function resolveWellKnownSkills(url, includeInternal) {
  const skills = await wellKnownProvider.fetchAllSkills(url, { includeInternal });
  if (skills.length === 0)
    return null;
  return {
    skills: skills.map((wellKnown) => ({
      name: wellKnown.installName,
      description: wellKnown.description,
      path: "",
      rawContent: wellKnown.content,
      wellKnown
    })),
    tempDir: null,
    blobResult: null
  };
}
async function installToTargets(resolved, skills, placement) {
  const results = [];
  for (const skill of skills)
    for (const target of placement.targets) {
      if (placement.skip?.(skill, target))
        continue;
      const { agent, subagent } = target;
      const installOptions = {
        global: placement.global,
        cwd: placement.cwd,
        mode: placement.mode,
        eveSubagent: subagent,
        createMissingAgentRoot: placement.createMissingAgentRoot?.(agent) ?? false
      };
      let result;
      if (isWellKnownSourceSkill(skill))
        result = await installWellKnownSkillForAgent(skill.wellKnown, agent, installOptions);
      else if (resolved.blobResult && "files" in skill) {
        const blobSkill = skill;
        result = await installBlobSkillForAgent({
          installName: blobSkill.name,
          files: blobSkill.files
        }, agent, installOptions);
      } else
        result = await installSkillForAgent(skill, agent, installOptions);
      results.push({
        skill: getSkillDisplayName(skill),
        agent: targetDisplayName(target),
        agentType: agent,
        pluginName: skill.pluginName,
        ...result
      });
    }
  return results;
}
function getSkillRepoPaths(resolved, skills) {
  const { tempDir, blobResult } = resolved;
  const skillFiles = {};
  for (const skill of skills)
    if (blobResult && "repoPath" in skill)
      skillFiles[skill.name] = skill.repoPath;
    else if (tempDir && skill.path === tempDir)
      skillFiles[skill.name] = "SKILL.md";
    else if (tempDir && skill.path.startsWith(tempDir + sep))
      skillFiles[skill.name] = skill.path.slice(tempDir.length + 1).split(sep).join("/") + "/SKILL.md";
  return skillFiles;
}
function getProjectLockSource(parsed) {
  return getLockSource(parsed.url, getOwnerRepo(parsed)) || parsed.url;
}
function projectLockEntry(parsed, skillPath, computedHash) {
  const sourceUrl = getProjectLockSourceUrl(parsed.type, parsed.url);
  return {
    source: getProjectLockSource(parsed),
    ...sourceUrl && { sourceUrl },
    ref: parsed.ref,
    sourceType: parsed.type,
    ...skillPath && { skillPath },
    computedHash
  };
}
function globalWellKnownLockEntry(baseUrl, skill) {
  return {
    source: wellKnownProvider.getSourceIdentifier(baseUrl),
    sourceType: "well-known",
    sourceUrl: skill.sourceUrl,
    skillFolderHash: "",
    sourceBaseUrl: baseUrl,
    wellKnownDigest: computeWellKnownSkillDigest(skill)
  };
}
function wellKnownLockEntry(url, skill, computedHash) {
  return {
    source: wellKnownProvider.getSourceIdentifier(url),
    sourceUrl: url,
    sourceType: "well-known",
    computedHash,
    wellKnownDigest: computeWellKnownSkillDigest(skill)
  };
}
async function fetchSource({ parsed, skills, fullDepth, includeInternal = skills.length > 0, includeDuplicateNames }) {
  try {
    return {
      parsed,
      resolved: parsed.type === "well-known" && await resolveWellKnownSkills(parsed.url, includeInternal) || await resolveSkills(parsed, {
        includeInternal,
        fullDepth,
        requestedSkills: skills,
        includeDuplicateNames
      }, silentSpinner)
    };
  } catch (error) {
    return {
      parsed,
      resolved: null,
      error: error instanceof Error ? error.message : String(error),
      cause: error
    };
  }
}
async function collectInstalled(skills, results) {
  const installed = [];
  for (const skill of skills) {
    const target = results.find((r3) => r3.success && r3.skill === getSkillDisplayName(skill));
    if (target)
      installed.push({
        skill,
        hash: await installedSkillHash(skill, target)
      });
  }
  return installed;
}
function releaseSource({ resolved }) {
  return cleanup(resolved?.tempDir ?? null);
}
async function recordProjectLock({ parsed, resolved }, installed, via, { cwd, installMode } = {}) {
  if (!resolved)
    return;
  const skills = installed.map(({ skill }) => skill);
  const repoPaths = getSkillRepoPaths(resolved, skills);
  const downloaded = resolved.downloads && downloadLockFields(resolved.downloads, skills);
  for (const { skill, hash } of installed) {
    let entry;
    if (downloaded) {
      const fields = downloaded.get(skill);
      if (!fields)
        continue;
      entry = {
        ...fields,
        computedHash: hash
      };
    } else if (isWellKnownSourceSkill(skill))
      entry = wellKnownLockEntry(parsed.url, skill.wellKnown, hash);
    else
      entry = projectLockEntry(parsed, repoPaths[skill.name], hash);
    await addSkillToLocalLock(skill.name, {
      ...entry,
      ...via && { via },
      ...installMode && { installMode }
    }, cwd);
  }
}
async function recordGlobalWellKnownLock(baseUrl, installed) {
  for (const { skill } of installed) {
    if (!isWellKnownSourceSkill(skill))
      continue;
    await addSkillToLock(skill.name, globalWellKnownLockEntry(baseUrl, skill.wellKnown));
  }
}
async function recordGlobalLock({ parsed, resolved }, skills, options) {
  if (!resolved || skills.length === 0)
    return;
  const installMode = options.installMode && { installMode: options.installMode };
  if (resolved.downloads) {
    const downloaded = downloadLockFields(resolved.downloads, skills);
    for (const skill of skills) {
      const fields = downloaded.get(skill);
      if (!fields)
        continue;
      try {
        await addSkillToLock(skill.name, {
          ...fields,
          skillFolderHash: await computeSkillFolderHash(skill.path),
          pluginName: skill.pluginName,
          ...installMode
        });
      } catch (error) {
        options.onWriteFailure(skill.name, error);
      }
    }
    return;
  }
  const normalizedSource = getOwnerRepo(parsed);
  if (!normalizedSource && parsed.type !== "local")
    return;
  const lockSource = getLockSource(parsed.url, normalizedSource);
  const { blobResult, tempDir } = resolved;
  const skillFiles = getSkillRepoPaths(resolved, skills);
  let cachedTree;
  if (parsed.type === "github" && !blobResult && normalizedSource)
    cachedTree = await fetchRepoTree(normalizedSource, parsed.ref, getGitHubToken);
  for (const skill of skills)
    try {
      let skillFolderHash = "";
      const skillPathValue = skillFiles[skill.name];
      if (blobResult && skillPathValue) {
        const hash = getSkillFolderHashFromTree(blobResult.tree, skillPathValue);
        if (hash)
          skillFolderHash = hash;
      } else if (parsed.type === "github" && skillPathValue && cachedTree) {
        const hash = getSkillFolderHashFromTree(cachedTree, skillPathValue);
        if (hash)
          skillFolderHash = hash;
      } else if (skillPathValue && tempDir) {
        const hash = await computeSkillFolderHash(join(tempDir, dirname(skillPathValue)));
        if (hash)
          skillFolderHash = hash;
      } else if (parsed.type === "local") {
        const hash = await computeSkillFolderHash(skill.path);
        if (hash)
          skillFolderHash = hash;
      }
      await addSkillToLock(skill.name, {
        source: lockSource || normalizedSource || parsed.url,
        sourceType: parsed.type,
        sourceUrl: parsed.url,
        ref: parsed.ref,
        skillPath: skillPathValue,
        skillFolderHash,
        pluginName: skill.pluginName,
        ...installMode
      });
    } catch (error) {
      options.onWriteFailure(skill.name, error);
    }
}
async function trackSourceInstall({ parsed, resolved }, skills, options) {
  if (!resolved || skills.length === 0)
    return;
  const common = {
    event: "install",
    agents: options.agents.join(","),
    ...options.global && { global: "1" },
    metadata: options.metadata
  };
  const wellKnown = skills.filter(isWellKnownSourceSkill);
  if (wellKnown.length > 0) {
    const sourceIdentifier = wellKnownProvider.getSourceIdentifier(parsed.url);
    if (await isSourcePrivate(sourceIdentifier) === true)
      return;
    track({
      ...common,
      source: sourceIdentifier,
      skills: wellKnown.map((s3) => s3.name).join(","),
      skillFiles: JSON.stringify(Object.fromEntries(wellKnown.map((s3) => [s3.name, s3.wellKnown.sourceUrl]))),
      installUrl: parsed.url,
      sourceType: "well-known"
    });
    return;
  }
  if (parsed.type === "download")
    return;
  const normalizedSource = getOwnerRepo(parsed);
  if (!normalizedSource)
    return;
  const ownerRepo = parseOwnerRepo(normalizedSource);
  if (ownerRepo && await isRepoPrivate(ownerRepo.owner, ownerRepo.repo) !== false)
    return;
  track({
    ...common,
    source: normalizedSource,
    skills: skills.map((s3) => s3.name).join(","),
    skillFiles: JSON.stringify(getSkillRepoPaths(resolved, skills))
  });
}
function sourceSkillHash(skill) {
  return "snapshotHash" in skill ? Promise.resolve(skill.snapshotHash) : computeSkillFolderHash(skill.path);
}
function installedSkillHash(skill, target) {
  return isWellKnownSourceSkill(skill) ? computeSkillFolderHash(target.canonicalPath || target.path) : sourceSkillHash(skill);
}
async function cleanup(tempDir) {
  if (tempDir)
    try {
      await cleanupTempDir(tempDir);
    } catch {}
}
function resolveSkillsToRemove(requested, folderNames, lockKeys = [], sourceByKey = {}) {
  const identityBySanitized = /* @__PURE__ */ new Map;
  for (const folder of folderNames)
    identityBySanitized.set(sanitizeName(folder), folder);
  for (const key of lockKeys)
    identityBySanitized.set(sanitizeName(key), key);
  const matched = /* @__PURE__ */ new Set;
  for (const name of requested) {
    const hit = identityBySanitized.get(sanitizeName(name));
    if (hit) {
      matched.add(hit);
      continue;
    }
    for (const key of lockKeys)
      if (sourceByKey[key] === name)
        matched.add(key);
  }
  return Array.from(matched);
}
function findUntrackedSkills(folderNames, lockKeys) {
  const tracked = new Set(lockKeys.map(sanitizeName));
  return folderNames.filter((folder) => !tracked.has(sanitizeName(folder)));
}
function isSameDir(a2, b4) {
  try {
    return realpathSync(a2) === realpathSync(b4);
  } catch {
    return false;
  }
}
async function scanInstalledSkillNames(isGlobal, cwd, onWarn) {
  const skillNamesSet = /* @__PURE__ */ new Set;
  const scanDir = async (dir) => {
    try {
      const entries = await readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith("."))
          continue;
        if (!await isDirEntryOrSymlinkToDir(entry, join(dir, entry.name)))
          continue;
        if (!await hasSkillMd(join(dir, entry.name)))
          continue;
        skillNamesSet.add(entry.name);
      }
    } catch (err) {
      if (err instanceof Error && err.code !== "ENOENT")
        onWarn?.(`Could not scan directory ${dir}: ${err.message}`);
    }
  };
  if (isGlobal) {
    await scanDir(getCanonicalSkillsDir(true, cwd));
    for (const agent of Object.values(agents))
      if (agent.globalSkillsDir !== undefined)
        await scanDir(agent.globalSkillsDir);
  } else {
    await scanDir(getCanonicalSkillsDir(false, cwd));
    for (const agent of Object.values(agents))
      await scanDir(join(cwd, agent.skillsDir));
    for (const subagent of getEveSubagents(cwd))
      await scanDir(getEveSubagentSkillsDir(subagent, cwd));
  }
  return Array.from(skillNamesSet).sort();
}
async function findGloballyTrackedSkills(selected, cwd) {
  if (!isSameDir(getCanonicalSkillsDir(false, cwd), getCanonicalSkillsDir(true)))
    return [];
  const lockEntries = (await readLocalLock(cwd)).skills;
  const globalNames = new Set(Object.keys((await readSkillLock()).skills).map(sanitizeName));
  return selected.filter((s3) => !lockEntries[s3] && globalNames.has(sanitizeName(s3)));
}
async function isUnmanagedProjectDir(path2, cwd, entry) {
  if ((relative(cwd, path2).split(sep)[0] ?? "").startsWith("."))
    return false;
  if (!entry)
    return true;
  if (entry.sourceType === "local" && pathsOverlap(entry.source, path2))
    return true;
  return await computeSkillFolderHash(path2).catch(() => {
    return;
  }) !== entry.computedHash;
}
async function removeInstalledSkills(skills, options) {
  const { global: isGlobal, cwd, targetAgents } = options;
  const results = [];
  const projectLock = isGlobal ? undefined : (await readLocalLock(cwd)).skills;
  for (const skillName of skills)
    try {
      const canonicalPath = getCanonicalPath(skillName, {
        global: isGlobal,
        cwd
      });
      for (const agentKey of targetAgents) {
        const agent = agents[agentKey];
        const skillPath = getInstallPath(skillName, agentKey, {
          global: isGlobal,
          cwd
        });
        const pathsToCleanup = /* @__PURE__ */ new Set([skillPath]);
        const sanitizedName = sanitizeName(skillName);
        if (isGlobal && agent.globalSkillsDir)
          pathsToCleanup.add(join(agent.globalSkillsDir, sanitizedName));
        else {
          pathsToCleanup.add(join(cwd, agent.skillsDir, sanitizedName));
          if (agentKey === "eve")
            for (const subagent of getEveSubagents(cwd))
              pathsToCleanup.add(join(getEveSubagentSkillsDir(subagent, cwd), sanitizedName));
        }
        for (const pathToCleanup of pathsToCleanup) {
          if (pathToCleanup === canonicalPath)
            continue;
          try {
            const stats = await lstat(pathToCleanup).catch(() => null);
            if (!stats)
              continue;
            if (projectLock && !stats.isSymbolicLink() && await isUnmanagedProjectDir(pathToCleanup, cwd, projectLock[skillName])) {
              warn(diagnostics.SKILLS_REMOVE_UNMANAGED_DIR_KEPT({ path: pathToCleanup }));
              continue;
            }
            await rm(pathToCleanup, {
              recursive: true,
              force: true
            });
          } catch (err) {
            options.onWarn?.(`Could not remove skill from ${agent.displayName}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }
      }
      const remainingAgents = (await detectInstalledAgents(cwd)).filter((a2) => !targetAgents.includes(a2));
      let isStillUsed = false;
      for (const agentKey of remainingAgents) {
        const path2 = getInstallPath(skillName, agentKey, {
          global: isGlobal,
          cwd
        });
        if (await lstat(path2).catch(() => null)) {
          isStillUsed = true;
          break;
        }
      }
      if (!isStillUsed)
        await rm(canonicalPath, {
          recursive: true,
          force: true
        });
      let effectiveSource = "local";
      let effectiveSourceType = "local";
      const updateLock = options.lockfile !== false && !isStillUsed;
      if (isGlobal) {
        const lockEntry = await getSkillFromLock(skillName);
        effectiveSource = lockEntry?.source || "local";
        effectiveSourceType = lockEntry?.sourceType || "local";
        if (updateLock)
          await removeSkillFromLock(skillName);
      } else {
        const lockEntry = (await readLocalLock(cwd)).skills[skillName];
        effectiveSource = lockEntry?.source || "local";
        effectiveSourceType = lockEntry?.sourceType || "local";
        if (updateLock)
          await removeSkillFromLocalLock(skillName, cwd);
      }
      results.push({
        skill: skillName,
        success: true,
        source: effectiveSource,
        sourceType: effectiveSourceType
      });
    } catch (err) {
      results.push({
        skill: skillName,
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });
    }
  return results;
}
function trackRemovals(results, targetAgents, isGlobal) {
  const successful = results.filter((r3) => r3.success);
  if (successful.length === 0)
    return;
  const bySource = /* @__PURE__ */ new Map;
  for (const r3 of successful) {
    const source = r3.sourceType === "local" || r3.sourceType === "download" ? r3.sourceType : r3.source || "local";
    const existing = bySource.get(source) || { skills: [] };
    existing.skills.push(r3.skill);
    existing.sourceType = r3.sourceType;
    bySource.set(source, existing);
  }
  for (const [source, data] of bySource)
    track({
      event: "remove",
      source,
      skills: data.skills.join(","),
      agents: targetAgents.join(","),
      ...isGlobal && { global: "1" },
      sourceType: data.sourceType
    });
}

// node_modules/skills/dist/index.mjs
import { existsSync as existsSync2 } from "fs";
import { join as join2, posix as posix2, relative as relative2, sep as sep2 } from "path";
import { lstat as lstat2, readdir as readdir2 } from "fs/promises";
function resolveConfig(options = {}) {
  const config = options.config ?? {};
  const pick = (key) => options[key] !== undefined ? options[key] : config[key];
  const resolved = {
    cwd: options.cwd ?? process.cwd(),
    scope: pick("scope") ?? "project",
    mode: pick("mode") ?? "auto",
    lockfile: pick("lockfile") ?? true,
    fullDepth: pick("fullDepth") ?? false,
    includeInternal: pick("includeInternal") ?? false,
    duplicates: pick("duplicates") ?? "first",
    symlinks: pick("symlinks") ?? "follow",
    telemetry: pick("telemetry") ?? true,
    agents: config.agents ?? {}
  };
  if (resolved.scope !== "project" && resolved.scope !== "global")
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "scope",
      expected: "'project' or 'global'"
    });
  if (![
    "auto",
    "symlink",
    "copy"
  ].includes(resolved.mode))
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "mode",
      expected: "'auto', 'symlink' or 'copy'"
    });
  if (resolved.duplicates !== "first" && resolved.duplicates !== "error")
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "duplicates",
      expected: "'first' or 'error'"
    });
  if (resolved.symlinks !== "follow" && resolved.symlinks !== "reject")
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "symlinks",
      expected: "'follow' or 'reject'"
    });
  assertKnownAgents(resolved.agents.include);
  assertKnownAgents(resolved.agents.exclude);
  assertKnownAgents(resolved.agents.default);
  return resolved;
}
function isKnownAgent(id) {
  return Object.hasOwn(agents, id);
}
function assertKnownAgents(ids) {
  const unknown = ids?.filter((id) => !isKnownAgent(id)) ?? [];
  if (unknown.length > 0)
    throw diagnostics.SKILLS_INVALID_AGENTS({
      invalid: unknown,
      valid: Object.keys(agents)
    });
}
function isAgentAllowed(agent, config) {
  if (config.include && !config.include.includes(agent))
    return false;
  return !config.exclude?.includes(agent);
}
var agentInfos;
function toAgentInfo(id) {
  const config = agents[id];
  return Object.freeze({
    id,
    name: config.displayName,
    projectSkillsDir: config.skillsDir,
    globalSkillsDir: config.globalSkillsDir ?? null,
    universal: isUniversalAgent(id)
  });
}
function getSupportedAgents() {
  agentInfos ??= Object.freeze(Object.keys(agents).map(toAgentInfo));
  return agentInfos;
}
async function detectAgents(options = {}) {
  const config = resolveConfig(options);
  options.signal?.throwIfAborted();
  const detected = await detectInstalledAgents(config.cwd);
  options.signal?.throwIfAborted();
  return { agents: detected.filter((id) => isAgentAllowed(id, config.agents)).map(toAgentInfo) };
}
var GIT_SOURCE_TYPES = /* @__PURE__ */ new Set([
  "github",
  "gitlab",
  "git"
]);
var sourceStates = /* @__PURE__ */ new WeakMap;
function parseSourceInput(input, cwd) {
  if (typeof input !== "string" || input.trim() === "")
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "source",
      expected: "a non-empty string"
    });
  return parseSource(input, { cwd });
}
function toSourceInfo(input, parsed, commit) {
  return Object.freeze({
    input,
    type: parsed.type,
    url: parsed.url,
    ...parsed.ref && { ref: parsed.ref },
    ...commit && { commit },
    ...parsed.subpath && { subpath: parsed.subpath }
  });
}
async function resolveSource(source, options = {}) {
  const config = resolveConfig(options);
  return withWarnings(options.onWarning, () => openSource(source, config, [], options));
}
async function openSource(input, config, requested, options) {
  const parsed = withRef(parseSourceInput(input, config.cwd), options.ref);
  options.signal?.throwIfAborted();
  if (parsed.type === "local" && !existsSync2(parsed.localPath))
    throw diagnostics.SKILLS_LOCAL_PATH_NOT_FOUND({ path: parsed.localPath });
  const skills = requested.length > 0 ? [...requested] : parsed.skillFilter ? [parsed.skillFilter] : [];
  options.onProgress?.({
    type: "resolve:start",
    source: input
  });
  const repoInfo = lookupGitHubRepo(parsed);
  const fetched = await fetchSource({
    parsed,
    skills,
    fullDepth: config.fullDepth,
    includeInternal: config.includeInternal || skills.length > 0,
    includeDuplicateNames: true
  });
  if (!fetched.resolved)
    throw fetchError(input, fetched);
  fetched.parsed = withCanonicalGitHubRepo(parsed, (await repoInfo)?.fullName);
  const handle = await createSkillSource(input, fetched);
  if (options.signal?.aborted) {
    await handle.dispose();
    options.signal?.throwIfAborted();
  }
  if (handle.skills.length === 0) {
    await handle.dispose();
    throw diagnostics.SKILLS_NO_VALID_SKILLS();
  }
  options.onProgress?.({
    type: "resolve:done",
    source: handle.source,
    skills: handle.skills.length
  });
  return handle;
}
function withRef(parsed, ref) {
  if (ref === undefined)
    return parsed;
  if (typeof ref !== "string" || ref.trim() === "")
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "ref",
      expected: "a non-empty string"
    });
  if (!GIT_SOURCE_TYPES.has(parsed.type))
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "ref",
      expected: "used only with git sources"
    });
  return {
    ...parsed,
    ref
  };
}
function fetchError(input, fetched) {
  const { cause } = fetched;
  if (cause instanceof Diagnostic)
    return cause;
  return diagnostics.SKILLS_SOURCE_FETCH_FAILED({
    source: input,
    detail: fetched.error ?? "unknown error",
    cause
  });
}
async function createSkillSource(input, raw) {
  const { fetched, duplicates } = dedupeSkills(raw);
  const skills = fetched.resolved.skills.map((skill) => {
    const path2 = skillPath(fetched, skill);
    const others = duplicates.get(skill);
    return Object.freeze({
      name: getSkillDisplayName(skill),
      description: skill.description,
      ...path2 !== undefined && { path: path2 },
      ...others && { duplicates: Object.freeze(others) },
      ...skill.pluginName && { pluginName: skill.pluginName },
      ...skill.metadata && { metadata: Object.freeze({ ...skill.metadata }) }
    });
  });
  const { resolved, parsed } = fetched;
  const commit = GIT_SOURCE_TYPES.has(parsed.type) && resolved.tempDir && !resolved.blobResult ? await getHeadCommit(resolved.tempDir) ?? undefined : undefined;
  const state = {
    fetched,
    disposed: false
  };
  const handle = Object.freeze({
    source: toSourceInfo(input, parsed, commit),
    skills: Object.freeze(skills),
    async dispose() {
      if (state.disposed)
        return;
      state.disposed = true;
      await releaseSource(fetched);
    }
  });
  sourceStates.set(handle, state);
  return handle;
}
function dedupeSkills(fetched) {
  const resolved = fetched.resolved;
  const first = /* @__PURE__ */ new Map;
  const duplicates = /* @__PURE__ */ new Map;
  for (const skill of resolved.skills) {
    const name = getSkillDisplayName(skill);
    const winner = first.get(name);
    if (!winner) {
      first.set(name, skill);
      continue;
    }
    const path2 = skillPath(fetched, skill);
    if (path2 !== undefined)
      duplicates.set(winner, [...duplicates.get(winner) ?? [], path2]);
  }
  return {
    fetched: {
      ...fetched,
      resolved: {
        ...resolved,
        skills: [...first.values()]
      }
    },
    duplicates
  };
}
function skillPath({ resolved }, skill) {
  if ("repoPath" in skill && typeof skill.repoPath === "string")
    return posix2.dirname(skill.repoPath);
  const root = resolved?.rootDir;
  if (!root || !skill.path)
    return;
  const rel = relative2(root, skill.path);
  return rel === "" ? "." : rel.split(sep2).join("/");
}
function getFetchedSource(handle) {
  const state = sourceStates.get(handle);
  if (!state)
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "source",
      expected: "a source string or a SkillSource returned by resolveSource()"
    });
  if (state.disposed)
    throw diagnostics.SKILLS_SOURCE_DISPOSED();
  return state.fetched;
}
var version = version$1;
async function installSkills(source, options = {}) {
  const config = resolveConfig(options);
  const requested = validateNames(options.skills, "skills");
  assertKnownAgents(validateNames(options.agents, "agents"));
  if (typeof source !== "string" && options.ref !== undefined)
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "ref",
      expected: "used with a source string; pass it to resolveSource() instead"
    });
  return withWarnings(options.onWarning, () => install(source, options, config, requested));
}
async function install(source, options, config, requested) {
  if (config.scope === "project" && config.lockfile)
    await assertReadableLock(config.cwd);
  options.signal?.throwIfAborted();
  const owned = typeof source === "string";
  const handle = owned ? await openSource(source, config, requested ?? [], options) : source;
  try {
    const fetched = getFetchedSource(handle);
    const skills = selectSkills(fetched, requested);
    if (config.duplicates === "error")
      rejectDuplicates(handle, skills);
    if (config.symlinks === "reject")
      await rejectSymlinks(fetched, skills);
    const { targets, failures } = await resolveTargets(options.agents, config, skills);
    options.signal?.throwIfAborted();
    const explicit = new Set(options.agents ?? config.agents.default ?? []);
    const placement = {
      global: config.scope === "global",
      cwd: config.cwd,
      targets: targets.map((agent) => ({ agent })),
      mode: config.mode === "auto" ? defaultInstallMode(targets.map((agent) => ({ agent }))) : config.mode,
      createMissingAgentRoot: (agent) => explicit.has(agent)
    };
    options.onProgress?.({
      type: "install:start",
      skills: skills.length,
      agents: targets.length
    });
    const results = await installToTargets(fetched.resolved, skills, placement);
    const result = buildResult(handle, results, failures, config);
    options.onProgress?.({
      type: "install:done",
      installed: result.installed.length,
      failed: result.failed.length
    });
    const installed = await collectInstalled(skills, results);
    if (config.lockfile && installed.length > 0)
      await recordLock(fetched, installed, config, config.mode === "copy");
    if (config.telemetry && installed.length > 0) {
      setVersion(version);
      await trackSourceInstall(fetched, installed.map(({ skill }) => skill), {
        agents: targets,
        global: placement.global,
        ...options.metadata && { metadata: JSON.stringify(options.metadata) }
      });
      await flushTelemetry(3000);
    }
    return result;
  } finally {
    if (owned)
      await handle.dispose();
  }
}
function validateNames(names, option) {
  if (names === undefined)
    return;
  if (!Array.isArray(names) || names.some((name) => typeof name !== "string" || name === ""))
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option,
      expected: "an array of non-empty strings"
    });
  return names;
}
async function assertReadableLock(cwd) {
  await readLocalLock(cwd);
}
function selectSkills(fetched, requested) {
  const available = fetched.resolved.skills;
  const names = requested ?? (fetched.parsed.skillFilter ? [fetched.parsed.skillFilter] : undefined);
  if (!names || names.length === 0 || names.includes("*"))
    return available;
  const ambiguous = names.find((name) => filterSkills(available, [name]).length > 1);
  if (ambiguous !== undefined)
    throw diagnostics.SKILLS_AMBIGUOUS_SKILL_SELECTOR({ selector: ambiguous });
  const missing = names.filter((name) => filterSkills(available, [name]).length === 0);
  if (missing.length > 0)
    throw diagnostics.SKILLS_NO_MATCHING_SKILLS({
      requested: missing,
      available: available.map(getSkillDisplayName)
    });
  return filterSkills(available, [...names]);
}
async function resolveTargets(requested, config, skills) {
  const named = requested ?? config.agents.default;
  const candidates = named ? [...new Set(named)] : await nonInteractiveTargetAgents(config.cwd);
  const global = config.scope === "global";
  const targets = [];
  const failures = [];
  const fail = (agent, diagnostic) => {
    if (!named)
      return;
    for (const skill of skills)
      failures.push(failure(getSkillDisplayName(skill), agent, diagnostic));
  };
  for (const agent of candidates)
    if (!isAgentAllowed(agent, config.agents))
      fail(agent, diagnostics.SKILLS_AGENT_NOT_ALLOWED({ agents: [agent] }));
    else if (global && agents[agent].globalSkillsDir === undefined)
      fail(agent, diagnostics.SKILLS_GLOBAL_INSTALL_UNSUPPORTED({ agent: agents[agent].displayName }));
    else
      targets.push(agent);
  if (targets.length === 0)
    throw diagnostics.SKILLS_NO_TARGET_AGENTS();
  return {
    targets,
    failures
  };
}
function failure(skill, agent, diagnostic) {
  return Object.freeze({
    skill,
    agent,
    code: diagnostic.code,
    message: diagnostic.message
  });
}
function buildResult(handle, results, failures, config) {
  const installed = [];
  const skipped = [];
  const failed = [...failures];
  for (const r3 of results)
    if (!r3.success) {
      const diagnostic = diagnostics.SKILLS_INSTALL_FAILED({
        skill: r3.skill,
        agent: r3.agentType,
        detail: r3.error ?? "unknown error"
      });
      failed.push(failure(r3.skill, r3.agentType, diagnostic));
    } else if (r3.skipReason === "missing-agent-project-directory")
      skipped.push({
        skill: r3.skill,
        agent: r3.agentType,
        reason: "missing-agent-directory"
      });
    else
      installed.push(Object.freeze({
        skill: r3.skill,
        agent: r3.agentType,
        scope: config.scope,
        mode: r3.mode === "copy" || r3.symlinkFailed ? "copy" : "symlink",
        path: r3.path,
        ...r3.canonicalPath && { canonicalPath: r3.canonicalPath }
      }));
  return Object.freeze({
    source: handle.source,
    installed: Object.freeze(installed),
    skipped: Object.freeze(skipped),
    failed: Object.freeze(failed)
  });
}
async function recordLock(fetched, installed, config, explicitCopy) {
  const lockedInstallMode = explicitCopy ? { installMode: "copy" } : {};
  try {
    if (config.scope === "project")
      await recordProjectLock(fetched, installed, undefined, {
        cwd: config.cwd,
        ...lockedInstallMode
      });
    else if (installed.some(({ skill }) => ("wellKnown" in skill)))
      await recordGlobalWellKnownLock(fetched.parsed.url, installed);
    else
      await recordGlobalLock(fetched, installed.map(({ skill }) => skill), {
        ...lockedInstallMode,
        onWriteFailure: (_skill, error) => {
          throw error;
        }
      });
  } catch (error) {
    throw diagnostics.SKILLS_LOCK_WRITE_FAILED({
      detail: error instanceof Error ? error.message : String(error),
      cause: error
    });
  }
}
function rejectDuplicates(handle, skills) {
  const names = new Set(skills.map(getSkillDisplayName));
  const duplicated = handle.skills.filter((info) => names.has(info.name) && info.duplicates);
  if (duplicated.length === 0)
    return;
  throw diagnostics.SKILLS_DUPLICATE_SKILL_NAME({ skills: duplicated.map((info) => `${info.name}: ${[info.path ?? "?", ...info.duplicates].join(", ")}`) });
}
async function rejectSymlinks(fetched, skills) {
  const found = [];
  for (const skill of skills)
    for (const link of await findSymlinks(fetched, skill))
      found.push(`${getSkillDisplayName(skill)}: ${link}`);
  if (found.length > 0)
    throw diagnostics.SKILLS_SKILL_CONTAINS_SYMLINKS({ links: found });
}
async function findSymlinks(fetched, skill) {
  if ("repoPath" in skill && typeof skill.repoPath === "string") {
    const dir = posix2.dirname(skill.repoPath);
    const prefix = dir === "." ? "" : `${dir}/`;
    return (fetched.resolved?.blobResult?.tree.tree ?? []).filter((entry) => entry.mode === "120000" && entry.path.startsWith(prefix)).map((entry) => entry.path.slice(prefix.length));
  }
  if (!skill.path)
    return [];
  const links = [];
  if ((await lstat2(skill.path)).isSymbolicLink())
    return ["."];
  const walk = async (dir, rel) => {
    for (const entry of await readdir2(dir, { withFileTypes: true })) {
      const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
      if (entry.isSymbolicLink())
        links.push(entryRel);
      else if (entry.isDirectory() && entry.name !== ".git")
        await walk(join2(dir, entry.name), entryRel);
    }
  };
  await walk(skill.path, "");
  return links;
}
function listSkills(options = {}) {
  return withWarnings(options.onWarning, () => list(options));
}
async function list(options) {
  const { cwd } = resolveConfig({
    cwd: options.cwd,
    config: options.config
  });
  const scope = options.scope ?? "all";
  if (scope !== "all" && scope !== "project" && scope !== "global")
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "scope",
      expected: "'project', 'global' or 'all'"
    });
  assertKnownAgents(options.agents);
  options.signal?.throwIfAborted();
  const found = await listInstalledSkills({
    cwd,
    ...scope !== "all" && { global: scope === "global" },
    ...options.agents && { agentFilter: [...options.agents] }
  });
  options.signal?.throwIfAborted();
  const sources = {
    project: scope === "global" ? {} : await lockSources(() => readLocalLock(cwd)),
    global: scope === "project" ? {} : await lockSources(readSkillLock)
  };
  return Object.freeze({ skills: Object.freeze(found.map((skill) => Object.freeze({
    name: skill.name,
    description: skill.description,
    scope: skill.scope,
    path: skill.canonicalPath || skill.path,
    agents: Object.freeze([...skill.agents]),
    ...sources[skill.scope][skill.name] && { source: sources[skill.scope][skill.name] }
  }))) });
}
async function lockSources(read) {
  try {
    const { skills } = await read();
    return Object.fromEntries(Object.entries(skills).map(([name, entry]) => [name, entry.source]));
  } catch {
    return {};
  }
}
function removeSkills(names, options = {}) {
  return withWarnings(options.onWarning, () => remove(names, options));
}
async function remove(names, options) {
  const config = resolveConfig(options);
  if (!Array.isArray(names) || names.some((name) => typeof name !== "string" || name === ""))
    throw diagnostics.SKILLS_INVALID_OPTION_VALUE({
      option: "names",
      expected: "an array of non-empty strings"
    });
  assertKnownAgents(options.agents);
  const disallowed = options.agents?.filter((agent) => !isAgentAllowed(agent, config.agents));
  if (disallowed && disallowed.length > 0)
    throw diagnostics.SKILLS_AGENT_NOT_ALLOWED({ agents: disallowed });
  const targetAgents = (options.agents ?? Object.keys(agents)).filter((agent) => isAgentAllowed(agent, config.agents));
  if (targetAgents.length === 0)
    throw diagnostics.SKILLS_NO_TARGET_AGENTS();
  options.signal?.throwIfAborted();
  const global = config.scope === "global";
  const { cwd } = config;
  const installed = await scanInstalledSkillNames(global, cwd);
  const lockEntries = global ? (await readSkillLock()).skills : (await readProjectLock(cwd)).skills;
  const lockKeys = Object.keys(lockEntries);
  const sourceByKey = Object.fromEntries(lockKeys.map((key) => [key, lockEntries[key]?.source]));
  const resolve2 = (requested) => resolveSkillsToRemove(requested, installed, lockKeys, sourceByKey);
  const all = names.includes("*");
  const notFound = all ? [] : names.filter((name) => resolve2([name]).length === 0);
  let selected = all ? resolve2(lockKeys) : resolve2([...names]);
  if (all) {
    const untracked = findUntrackedSkills(installed, lockKeys);
    if (untracked.length > 0)
      warn(diagnostics.SKILLS_REMOVE_UNTRACKED_SKIPPED({ skills: untracked }));
  }
  const failed = [];
  if (!global) {
    const tracked = new Set(await findGloballyTrackedSkills(selected, cwd));
    for (const skill of tracked) {
      const diagnostic = diagnostics.SKILLS_REMOVE_GLOBALLY_TRACKED({ skills: [skill] });
      failed.push({
        skill,
        code: diagnostic.code,
        message: diagnostic.message
      });
    }
    selected = selected.filter((skill) => !tracked.has(skill));
  }
  options.signal?.throwIfAborted();
  const results = await removeInstalledSkills(selected, {
    global,
    cwd,
    targetAgents,
    lockfile: config.lockfile
  });
  for (const r3 of results)
    if (!r3.success) {
      const diagnostic = diagnostics.SKILLS_REMOVE_FAILED({
        skill: r3.skill,
        detail: r3.error ?? "unknown error"
      });
      failed.push({
        skill: r3.skill,
        code: diagnostic.code,
        message: diagnostic.message
      });
    }
  if (config.telemetry) {
    setVersion(version);
    trackRemovals(results, targetAgents, global);
    await flushTelemetry(3000);
  }
  return Object.freeze({
    removed: Object.freeze(results.filter((r3) => r3.success).map((r3) => r3.skill)),
    notFound: Object.freeze(notFound),
    failed: Object.freeze(failed)
  });
}
function readProjectLock(cwd) {
  return readLocalLock(cwd);
}

// src/skills-lib.ts
import { mkdtemp as mkdtemp2, readFile as readFile2, rm as rm2 } from "node:fs/promises";
import { basename as basename2, join as join3 } from "node:path";
function sanitizeName2(name) {
  return name.toLowerCase().replace(/[^a-z0-9._]+/g, "-").replace(/^[.\-]+|[.\-]+$/g, "").substring(0, 255) || "unnamed-skill";
}
var PLUGIN_LOCK_KEPT = "PLUGIN_LOCK_KEPT";
var PLUGIN_STAGE_INCOMPLETE = "PLUGIN_STAGE_INCOMPLETE";
function toLibDiagnostic(error) {
  const message = error instanceof Error ? error.message : String(error);
  const code = error?.code;
  if (typeof code === "string" && (code.startsWith("SKILLS_") || code.startsWith("PLUGIN_")))
    return { code, message };
  return { code: "UNKNOWN", message };
}
var librarySources = new WeakMap;
function libraryOf(source) {
  const library = librarySources.get(source);
  if (!library)
    throw new Error("Source was not created by realSkillsLib.resolve");
  return library;
}
function toDiagnostic(failure2) {
  const out = { code: failure2.code, message: failure2.message };
  if (failure2.skill !== undefined)
    out.skill = failure2.skill;
  if (failure2.agent !== undefined)
    out.agent = failure2.agent;
  return out;
}
async function readLockKeys(cwd) {
  const path2 = join3(cwd, "skills-lock.json");
  let raw;
  try {
    raw = await readFile2(path2, "utf8");
  } catch (error) {
    if (error.code === "ENOENT")
      return [];
    throw invalidLock(path2, error.message);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw invalidLock(path2, error.message);
  }
  const lock = parsed;
  if (typeof lock?.version !== "number" || typeof lock.skills !== "object" || lock.skills === null || Array.isArray(lock.skills)) {
    throw invalidLock(path2, 'expected an object with "version" and "skills"');
  }
  if (lock.version !== 1 && lock.version !== 2)
    throw invalidLock(path2, `unsupported lock version ${lock.version}`);
  return Object.keys(lock.skills);
}
function invalidLock(path2, reason) {
  return Object.assign(new Error(`Invalid skills lock ${path2}: ${reason}`), { code: "SKILLS_INVALID_LOCAL_LOCK" });
}
async function readLockEntries(api, cwd) {
  const entries = new Map;
  await readLockKeys(cwd);
  const { skills } = await api.listSkills({ cwd, scope: "project" });
  for (const skill of skills) {
    if (skill.source === undefined)
      continue;
    entries.set(basename2(skill.path), { source: skill.source, libName: skill.name });
  }
  return entries;
}
function createSkillsLib(api) {
  return {
    async resolve(input, cwd) {
      const library = await api.resolveSource(input, { cwd });
      const resolved = {
        input: library.source.input,
        type: library.source.type,
        url: library.source.url,
        skills: library.skills.map((skill) => ({ name: skill.name, description: skill.description })),
        dispose: () => library.dispose()
      };
      librarySources.set(resolved, library);
      return resolved;
    },
    async stage(source, names, tmpdir2) {
      const root = await mkdtemp2(join3(tmpdir2, "stage-"));
      try {
        const result = await api.installSkills(libraryOf(source), {
          cwd: root,
          skills: names,
          agents: ["universal"],
          mode: "copy",
          lockfile: false,
          telemetry: false,
          duplicates: "error"
        });
        const failure2 = result.failed[0];
        if (failure2)
          throw Object.assign(new Error(failure2.message), { code: failure2.code });
        const staged = result.installed.map((target) => ({ name: target.skill, folder: basename2(target.path), path: target.path }));
        const requested = new Set(names).size;
        if (staged.length !== requested) {
          throw Object.assign(new Error(`Staged ${staged.length} of ${requested} requested skills (skipped: ${result.skipped.length})`), { code: PLUGIN_STAGE_INCOMPLETE });
        }
        return { staged, dispose: () => rm2(root, { recursive: true, force: true }) };
      } catch (error) {
        await rm2(root, { recursive: true, force: true });
        throw error;
      }
    },
    async install(source, { cwd, names, libAgents, onWarning }) {
      const result = await api.installSkills(libraryOf(source), {
        cwd,
        skills: names,
        agents: libAgents,
        mode: "copy",
        duplicates: "error",
        telemetry: false,
        onWarning: (warning) => onWarning(toLibDiagnostic(warning))
      });
      return { failed: result.failed.map(toDiagnostic) };
    },
    lockEntries: (cwd) => readLockEntries(api, cwd),
    async untrack(libNames, cwd, libAgents) {
      const result = await api.removeSkills(libNames, { cwd, scope: "project", agents: libAgents, telemetry: false });
      const failed = result.failed.map(toDiagnostic);
      const remaining = new Set(await readLockKeys(cwd));
      for (const name of libNames) {
        if (remaining.has(name)) {
          failed.push({
            code: PLUGIN_LOCK_KEPT,
            message: `The lock entry for ${name} was kept: a copy survives in a directory that was not targeted`,
            skill: name
          });
        }
      }
      return { failed };
    }
  };
}

// src/skills-real.ts
var realSkillsLib = createSkillsLib(exports_dist);
async function realLibAgents(home2) {
  const { agents: agents2 } = await detectAgents({ cwd: home2, config: { telemetry: false } });
  return new Set(agents2.map((agent) => agent.id));
}

// src/trash.ts
import { execFile as execFile2 } from "node:child_process";
var TRASH_BIN = "/usr/bin/trash";
var GIO_BIN = "/usr/bin/gio";
var TRASH_VERIFIED = new Set(["darwin"]);
var execRunner = (file, args) => new Promise((resolve2, reject) => {
  execFile2(file, [...args], { encoding: "utf8" }, (error, stdout, stderr) => {
    if (!error)
      return resolve2({ code: 0, stdout, stderr });
    const code = error.code;
    if (typeof code === "number")
      return resolve2({ code, stdout, stderr });
    reject(error);
  });
});
var COMMANDS = {
  darwin: { bin: TRASH_BIN, args: (paths) => [...paths] },
  linux: { bin: GIO_BIN, args: (paths) => ["trash", "--", ...paths] }
};
function systemTrasher(platform2, exists, run, verified = TRASH_VERIFIED) {
  if (platform2 === "win32")
    return { trasher: null, status: "unverified" };
  const command = Object.prototype.hasOwnProperty.call(COMMANDS, platform2) ? COMMANDS[platform2] : undefined;
  if (!command)
    return { trasher: null, status: "missing" };
  if (!verified.has(platform2))
    return { trasher: null, status: "unverified" };
  if (!exists(command.bin))
    return { trasher: null, status: "missing" };
  const trasher = async (paths) => {
    const { code, stderr } = await run(command.bin, command.args(paths));
    if (code !== 0)
      throw new Error(stderr.trim() || `${command.bin} exited with code ${code}`);
  };
  return { trasher, status: "ready" };
}

// src/worker-core.ts
import { randomUUID } from "node:crypto";
import { lstat as lstat7, mkdir as mkdir4, realpath as realpath6, stat as stat4 } from "node:fs/promises";
import { join as join9 } from "node:path";

// src/agents.ts
function agent(id, label, signals = {}) {
  return {
    id,
    label,
    libIds: signals.libIds ?? [],
    configDirs: signals.configDirs ?? [],
    icon: `agent-icons/${id}.png`
  };
}
var AGENTS = [
  agent("claude", "Claude", { libIds: ["claude-code"] }),
  agent("claude-agent-teams", "Claude Agent Teams"),
  agent("openclaude", "OpenClaude", { configDirs: [".openclaude"] }),
  agent("codex", "Codex", { libIds: ["codex"] }),
  agent("grok", "Grok", { libIds: ["grok"] }),
  agent("copilot", "GitHub Copilot", { libIds: ["github-copilot"] }),
  agent("opencode2", "OpenCode 2"),
  agent("opencode", "OpenCode", { libIds: ["opencode"] }),
  agent("mimo-code", "MiMo Code", { configDirs: [".config/mimocode"] }),
  agent("ante", "Ante", { configDirs: [".ante"] }),
  agent("trae", "Trae", { libIds: ["trae"] }),
  agent("muse", "Muse"),
  agent("dsh", "DeepSeek Harness", { configDirs: [".dsh"] }),
  agent("qoder", "Qoder CLI", { libIds: ["qoder"] }),
  agent("qoder-cn", "Qoder CLI China", { libIds: ["qoder-cn"] }),
  agent("zcode", "ZCode", { libIds: ["zcode"] }),
  agent("pi", "Pi", { libIds: ["pi"] }),
  agent("omp", "OMP", { configDirs: [".omp"] }),
  agent("prime-agent", "Prime Agent", { configDirs: [".prime/agent"] }),
  agent("gemini", "Gemini", { libIds: ["gemini-cli"] }),
  agent("antigravity", "Antigravity", { libIds: ["antigravity-cli", "antigravity"] }),
  agent("aider", "Aider"),
  agent("goose", "Goose", { libIds: ["goose"] }),
  agent("amp", "Amp", { libIds: ["amp"] }),
  agent("kilo", "Kilocode", { libIds: ["kilo"] }),
  agent("kiro", "Kiro", { libIds: ["kiro-cli"] }),
  agent("crush", "Charm", { libIds: ["crush"] }),
  agent("aug", "Auggie", { libIds: ["augment"] }),
  agent("autohand", "Autohand Code", { libIds: ["autohand-code"] }),
  agent("cline", "Cline", { libIds: ["cline"] }),
  agent("codebuff", "Codebuff", { configDirs: [".config/manicode"] }),
  agent("freebuff", "Freebuff", { configDirs: [".config/manicode"] }),
  agent("command-code", "Command Code", { libIds: ["command-code"] }),
  agent("continue", "Continue", { libIds: ["continue"] }),
  agent("cursor", "Cursor", { libIds: ["cursor"] }),
  agent("droid", "Droid", { libIds: ["droid"] }),
  agent("kimi", "Kimi", { libIds: ["kimi-code-cli"] }),
  agent("mistral-vibe", "Mistral Vibe", { libIds: ["mistral-vibe"] }),
  agent("qwen-code", "Qwen Code", { libIds: ["qwen-code"] }),
  agent("rovo", "Rovo Dev", { libIds: ["rovodev"] }),
  agent("hermes", "Hermes", { libIds: ["hermes-agent"] }),
  agent("devin", "Devin", { libIds: ["devin"] }),
  agent("openclaw", "OpenClaw", { libIds: ["openclaw"] }),
  agent("codebuddy", "CodeBuddy", { libIds: ["codebuddy"] }),
  agent("jcode", "Jcode", { configDirs: [".jcode"] })
];
var HISTORY_AGENTS = new Set([
  "claude",
  "codebuddy",
  "qoder",
  "codex",
  "hermes",
  "pi",
  "omp",
  "prime-agent",
  "cursor",
  "gemini",
  "antigravity",
  "rovo",
  "copilot",
  "opencode",
  "opencode2",
  "zcode",
  "grok",
  "openclaw",
  "devin",
  "droid",
  "cline",
  "kimi",
  "muse",
  "jcode",
  "kiro"
]);
function agentById(id) {
  return AGENTS.find((spec) => spec.id === id);
}
function byLabel(ids) {
  const labelOf = (id) => agentById(id)?.label ?? id;
  return [...ids].sort((a2, b4) => labelOf(a2).localeCompare(labelOf(b4), "en", { sensitivity: "base" }));
}

// src/hidden-agents.ts
var HIDDEN_AGENTS_KEY = "hiddenAgents";
function parseHiddenAgents(raw) {
  if (!Array.isArray(raw) || !raw.every((item) => typeof item === "string"))
    return [];
  return [...new Set(raw)];
}
function setHidden(hidden, installed, agent2, hide) {
  const has = hidden.includes(agent2);
  if (!hide)
    return has ? hidden.filter((id) => id !== agent2) : hidden;
  if (has || !installed.includes(agent2))
    return hidden;
  const visible = installed.filter((id) => id !== agent2 && !hidden.includes(id));
  return visible.length === 0 ? hidden : [...hidden, agent2];
}

// src/history.ts
var HISTORY_LIMIT = 200;
var codeOf = (error) => {
  const code = error?.code;
  return typeof code === "string" ? code : "error";
};
async function listHistoryAgents(call, has, log2) {
  if (!has("agent.listSessions")) {
    log2("history unavailable reason=no-method");
    return null;
  }
  let sessions;
  try {
    try {
      sessions = (await call("agent.listSessions", { limit: HISTORY_LIMIT })).sessions;
    } catch (error) {
      if (codeOf(error) !== "invalid_params")
        throw error;
      sessions = (await call("agent.listSessions")).sessions;
    }
  } catch (error) {
    log2(`history unavailable reason=${codeOf(error)}`);
    return null;
  }
  if (!Array.isArray(sessions) || sessions.some((session) => typeof session !== "object" || session === null)) {
    log2("history unavailable reason=malformed");
    return null;
  }
  const agents2 = new Set;
  for (const session of sessions)
    if (typeof session.agent === "string")
      agents2.add(session.agent);
  return agents2.size === 0 ? null : agents2;
}

// src/inventory.ts
import { join as join4 } from "node:path";
function installedAgents(history, lib, hasConfigDir) {
  const seen = new Set;
  for (const spec of AGENTS)
    if (history?.has(spec.id))
      seen.add(spec.id);
  const useHistory = seen.size > 0;
  const agents2 = AGENTS.filter((spec) => {
    if (useHistory && seen.has(spec.id))
      return true;
    if (useHistory && HISTORY_AGENTS.has(spec.id))
      return false;
    return spec.libIds.some((id) => lib.has(id)) || spec.configDirs.some((dir) => hasConfigDir(dir));
  }).map((spec) => spec.id);
  return { agents: agents2, source: useHistory ? "history" : "dirs" };
}
async function detectAgents2(deps, home2, history, log2) {
  const [seen, lib] = await Promise.all([
    history(),
    deps.libAgents(home2).catch(() => {
      log2("config dirs: library detection failed");
      return new Set;
    })
  ]);
  const { agents: agents2, source } = installedAgents(seen, lib, (dir) => deps.exists(join4(home2, dir)));
  return { agents: agents2, source, detectedAt: deps.now() };
}

// src/operations.ts
import { lstat as lstat5, mkdir as mkdir3, realpath as realpath4 } from "node:fs/promises";
import { basename as basename3, join as join7 } from "node:path";

// src/fsops.ts
import { createHash as createHash2 } from "node:crypto";
import { copyFile, lstat as lstat3, mkdir as mkdir2, readdir as readdir3, readFile as readFile3, realpath as realpath2, rm as rm3, stat as stat2 } from "node:fs/promises";
import { dirname as dirname2, join as join5 } from "node:path";

// src/paths.ts
import * as nodePath from "node:path";
function resolveInputPath(text, root, home2, path2 = nodePath) {
  if (text === "~")
    return path2.resolve(home2);
  if (text.startsWith("~/") || path2.sep === "\\" && text.startsWith("~\\"))
    return path2.resolve(home2, text.slice(2));
  return path2.resolve(root, text);
}
function abbreviateHome(path2, home2, pathApi = nodePath) {
  const win = pathApi.sep === "\\";
  const trimmed = home2.length > 1 ? home2.replace(win ? /[\\/]+$/ : /\/+$/, "") : home2;
  const norm = (value) => win ? value.replace(/\//g, "\\").toLowerCase() : value;
  const base = norm(trimmed);
  const subject = norm(path2);
  if (subject === base)
    return "~";
  if (base !== pathApi.sep && subject.startsWith(`${base}${pathApi.sep}`))
    return `~${path2.slice(trimmed.length)}`;
  return path2;
}
function isNetworkPath(path2, platform2) {
  return platform2 === "win32" && path2.startsWith("\\\\");
}
function isInside(child, parent) {
  const rel = nodePath.relative(parent, child);
  if (rel === "")
    return true;
  return rel !== ".." && !rel.startsWith(`..${nodePath.sep}`) && !nodePath.isAbsolute(rel);
}

// src/fsops.ts
var IGNORED = ".DS_Store";
var MAX_DEPTH = 24;
async function contentHash(dir) {
  const hash = createHash2("sha256");
  const source = await realpath2(dir);
  const addFile = async (rel, file) => {
    const bytes = await readFile3(file);
    hash.update(`F\x00${rel}\x00${bytes.length}\x00`);
    hash.update(bytes);
    hash.update("\x00");
  };
  async function walk(current, prefix, depth) {
    const names = (await readdir3(current)).filter((name) => name !== IGNORED).sort();
    for (const name of names) {
      const full = join5(current, name);
      const rel = prefix === "" ? name : `${prefix}/${name}`;
      const info = await lstat3(full);
      if (info.isSymbolicLink()) {
        const real = await realpath2(full).catch(() => null);
        if (real === null || !isInside(real, source))
          continue;
        if ((await stat2(real)).isFile())
          await addFile(rel, real);
      } else if (info.isDirectory()) {
        if (depth + 1 > MAX_DEPTH)
          continue;
        hash.update(`D\x00${rel}\x00`);
        await walk(full, rel, depth + 1);
      } else if (info.isFile()) {
        await addFile(rel, full);
      }
    }
  }
  await walk(dir, "", 0);
  return hash.digest("hex");
}
async function copySkill(from, to3) {
  const source = await realpath2(from);
  await mkdir2(dirname2(to3), { recursive: true });
  await mkdir2(to3);
  async function copyDir(current, target, depth) {
    for (const name of await readdir3(current)) {
      if (name === IGNORED)
        continue;
      const full = join5(current, name);
      const out = join5(target, name);
      const info = await lstat3(full);
      if (info.isDirectory()) {
        if (depth + 1 > MAX_DEPTH)
          continue;
        await mkdir2(out);
        await copyDir(full, out, depth + 1);
      } else if (info.isFile()) {
        await copyFile(full, out);
      } else if (info.isSymbolicLink()) {
        const real = await realpath2(full).catch(() => null);
        if (real === null || !isInside(real, source))
          continue;
        if ((await stat2(real)).isFile())
          await copyFile(real, out);
      }
    }
  }
  try {
    await copyDir(source, to3, 0);
  } catch (error) {
    await rm3(to3, { recursive: true, force: true });
    throw error;
  }
}

// src/skill-dirs.ts
var MANAGED_DIRS = [
  ".agents/skills",
  ".claude/skills",
  ".grok/skills",
  ".kiro/skills",
  ".qoder/skills",
  ".codebuddy/skills",
  ".zcode/skills",
  ".trae/skills",
  ".openclaude/skills",
  ".prime/agent/skills"
];
var AGENTS_DIR2 = ".agents/skills";
var CLAUDE_DIR = ".claude/skills";
var AGENT_READS = {
  claude: [CLAUDE_DIR],
  "claude-agent-teams": [CLAUDE_DIR],
  openclaude: [".openclaude/skills"],
  codex: [AGENTS_DIR2],
  grok: [".grok/skills"],
  copilot: [AGENTS_DIR2, CLAUDE_DIR],
  opencode: [AGENTS_DIR2, CLAUDE_DIR],
  opencode2: [AGENTS_DIR2, CLAUDE_DIR],
  "mimo-code": [AGENTS_DIR2],
  ante: [AGENTS_DIR2, CLAUDE_DIR],
  trae: [".trae/skills"],
  muse: [AGENTS_DIR2, CLAUDE_DIR],
  dsh: [AGENTS_DIR2],
  qoder: [".qoder/skills"],
  "qoder-cn": [".qoder/skills"],
  zcode: [".zcode/skills"],
  pi: [AGENTS_DIR2],
  omp: [AGENTS_DIR2],
  "prime-agent": [".prime/agent/skills"],
  gemini: [AGENTS_DIR2],
  antigravity: [AGENTS_DIR2],
  aider: null,
  goose: [AGENTS_DIR2, CLAUDE_DIR],
  amp: [AGENTS_DIR2, CLAUDE_DIR],
  kilo: [AGENTS_DIR2],
  kiro: [".kiro/skills"],
  crush: [AGENTS_DIR2, CLAUDE_DIR],
  aug: [AGENTS_DIR2, CLAUDE_DIR],
  autohand: [AGENTS_DIR2, CLAUDE_DIR],
  cline: [AGENTS_DIR2, CLAUDE_DIR],
  codebuff: [AGENTS_DIR2, CLAUDE_DIR],
  freebuff: [AGENTS_DIR2, CLAUDE_DIR],
  "command-code": [AGENTS_DIR2],
  continue: [CLAUDE_DIR],
  cursor: [AGENTS_DIR2, CLAUDE_DIR],
  droid: [AGENTS_DIR2],
  kimi: [AGENTS_DIR2],
  "mistral-vibe": [AGENTS_DIR2],
  "qwen-code": [AGENTS_DIR2],
  rovo: [AGENTS_DIR2],
  hermes: [AGENTS_DIR2],
  devin: [AGENTS_DIR2],
  openclaw: [AGENTS_DIR2],
  codebuddy: [".codebuddy/skills"],
  jcode: [AGENTS_DIR2, CLAUDE_DIR]
};
var TRUST_GATED = { hermes: "hermes", "mistral-vibe": "vibe" };
var LIB_AGENT_BY_DIR = {
  ".agents/skills": "universal",
  ".claude/skills": "claude-code",
  ".grok/skills": "grok",
  ".kiro/skills": "kiro-cli",
  ".qoder/skills": "qoder",
  ".codebuddy/skills": "codebuddy",
  ".zcode/skills": "zcode",
  ".trae/skills": "trae"
};
var COPY_ONLY_DIRS = [".openclaude/skills", ".prime/agent/skills"];
var FALLBACK_DIRS = [AGENTS_DIR2, CLAUDE_DIR];
function skillCapable(agents2) {
  return agents2.filter((agent2) => (AGENT_READS[agent2] ?? []).length > 0);
}
function targetDirOf(agent2) {
  const reads = AGENT_READS[agent2] ?? [];
  if (reads.includes(AGENTS_DIR2))
    return AGENTS_DIR2;
  if (reads.includes(CLAUDE_DIR))
    return CLAUDE_DIR;
  return reads[0] ?? null;
}
function writeSet(agents2) {
  const targets = new Set;
  for (const agent2 of agents2) {
    const target = targetDirOf(agent2);
    if (target)
      targets.add(target);
  }
  return MANAGED_DIRS.filter((dir) => targets.has(dir));
}
function readers(dir, agents2) {
  return agents2.filter((agent2) => AGENT_READS[agent2]?.includes(dir));
}

// src/scan.ts
import { lstat as lstat4, readdir as readdir4, readFile as readFile4, realpath as realpath3, stat as stat3 } from "node:fs/promises";
import { join as join6 } from "node:path";

// src/frontmatter.ts
var KEYS = ["name", "description"];
function unquote(value) {
  for (const quote of ['"', "'"]) {
    if (value.length >= 2 && value.startsWith(quote) && value.endsWith(quote))
      return value.slice(1, -1);
  }
  return value;
}
function parseFrontmatter2(text) {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/);
  if (lines[0]?.trimEnd() !== "---")
    return {};
  const end = lines.findIndex((line, index) => index > 0 && line.trimEnd() === "---");
  if (end === -1)
    return {};
  const block2 = lines.slice(1, end);
  const result = {};
  for (let i = 0;i < block2.length; i++) {
    const line = block2[i];
    const key = KEYS.find((candidate) => line.startsWith(`${candidate}:`));
    if (!key)
      continue;
    const value = line.slice(key.length + 1).trim();
    if (value.startsWith(">") || value.startsWith("|")) {
      const parts = [];
      while (i + 1 < block2.length) {
        const next = block2[i + 1];
        if (!/^[ \t]/.test(next) && next.trim() !== "")
          break;
        parts.push(next.trim());
        i++;
      }
      const kept = value.startsWith(">") ? parts.filter((part) => part !== "") : parts;
      result[key] = kept.join(value.startsWith(">") ? " " : `
`).trim();
    } else {
      result[key] = unquote(value);
    }
  }
  return result;
}

// src/scan.ts
async function isDirectory(path2) {
  return (await stat3(path2).catch(() => null))?.isDirectory() ?? false;
}
async function readEntry(root, dir, dirReal, name, safeDirs) {
  const entry = join6(dirReal, name);
  const info = await lstat4(entry);
  const realPath = await realpath3(entry).catch(() => null);
  if (realPath === null || !await isDirectory(realPath))
    return null;
  const skillFile = join6(realPath, "SKILL.md");
  if (!(await stat3(skillFile).catch(() => null))?.isFile())
    return null;
  let kind = "dir";
  if (info.isSymbolicLink()) {
    const internal = [...safeDirs.values()].some((safe) => realPath === join6(safe, name));
    kind = internal ? "internal-link" : "external-link";
  }
  const meta = parseFrontmatter2(await readFile4(skillFile, "utf8"));
  const copy = { dir, path: join6(root, dir, name), kind, realPath, hash: await contentHash(realPath) };
  return { copy, meta };
}
async function scanWorkspace(root) {
  const rootReal = await realpath3(root).catch(() => null);
  if (rootReal === null)
    return { skills: [], unsafeDirs: [] };
  const safeDirs = new Map;
  const unsafeDirs = [];
  for (const dir of MANAGED_DIRS) {
    const expected = join6(rootReal, dir);
    const real = await realpath3(expected).catch(() => null);
    if (real === null || !await isDirectory(real))
      continue;
    if (real === expected)
      safeDirs.set(dir, real);
    else
      unsafeDirs.push(dir);
  }
  const byFolder = new Map;
  for (const [dir, dirReal] of safeDirs) {
    const names = (await readdir4(dirReal).catch(() => [])).sort();
    for (const name of names) {
      const found = await readEntry(root, dir, dirReal, name, safeDirs).catch(() => null);
      if (!found)
        continue;
      const { copy, meta } = found;
      const known = byFolder.get(name);
      if (!known) {
        byFolder.set(name, { folder: name, displayName: meta.name || name, description: meta.description ?? "", copies: [copy] });
      } else {
        known.copies.push(copy);
        if (known.displayName === name && meta.name)
          known.displayName = meta.name;
        if (known.description === "" && meta.description)
          known.description = meta.description;
      }
    }
  }
  return { skills: [...byFolder.values()].sort((a2, b4) => a2.folder < b4.folder ? -1 : a2.folder > b4.folder ? 1 : 0), unsafeDirs };
}

// src/operations.ts
var fail = (error) => ({ ok: false, error });
var done = (warnings) => ({ ok: true, warnings });
function libError(error, trashed = false) {
  return { code: "lib", diagnostics: [toLibDiagnostic(error)], ...trashed ? { trashed: true } : {} };
}
function unsafeWarning(dir, lockKept = false) {
  const tail = lockKept ? " The lock entry was kept." : "";
  return { code: "PLUGIN_UNSAFE_DIR", message: `${dir} resolves outside this project, it was left untouched.${tail}` };
}
async function isAliased(rootReal, dir) {
  let current = rootReal;
  for (const part of dir.split("/")) {
    current = join7(current, part);
    const info = await lstat5(current).catch(() => null);
    if (info === null)
      return false;
    if (info.isSymbolicLink() || !info.isDirectory())
      return true;
  }
  return false;
}
async function readDisk(root) {
  const rootReal = await realpath4(root).catch(() => null);
  if (rootReal === null)
    return null;
  const scan = await scanWorkspace(root);
  const unsafe = [];
  for (const dir of MANAGED_DIRS) {
    if (scan.unsafeDirs.includes(dir) || await isAliased(rootReal, dir))
      unsafe.push(dir);
  }
  return { scan, unsafe };
}
var skillOf = (scan, folder) => scan.skills.find((skill) => skill.folder === folder);
async function moveToTrash(trash, paths) {
  if (paths.length === 0)
    return null;
  try {
    await trash(paths);
    return null;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const gone = await Promise.all(paths.map(async (path2) => await lstat5(path2).catch(() => null) === null));
    return {
      code: "lib",
      diagnostics: [{ code: "PLUGIN_TRASH_FAILED", message }],
      ...gone.some(Boolean) ? { trashed: true } : {}
    };
  }
}
var isPlainFolderName = (folder) => folder !== "" && folder !== "." && folder !== ".." && basename3(folder) === folder;
async function addSkills(ctx, source, names, replace) {
  if (ctx.writeDirs.length === 0)
    return fail({ code: "no-target" });
  const disk = await readDisk(ctx.root);
  if (!disk)
    return fail({ code: "no-workspace" });
  const unsafe = new Set(disk.unsafe);
  const dirs = ctx.writeDirs.filter((dir) => !unsafe.has(dir));
  const skipped = ctx.writeDirs.filter((dir) => unsafe.has(dir));
  if (dirs.length === 0)
    return fail({ code: "unsafe-dir", dirs: [...skipped] });
  const warnings = skipped.map((dir) => unsafeWarning(dir));
  try {
    await ctx.lib.lockEntries(ctx.root);
  } catch (error) {
    return fail(libError(error));
  }
  await mkdir3(ctx.tmpdir, { recursive: true });
  let disposeStage = null;
  try {
    let stage;
    try {
      stage = await ctx.lib.stage(source, names, ctx.tmpdir);
    } catch (error) {
      return fail(libError(error));
    }
    disposeStage = stage.dispose;
    const stagedPaths = new Map(stage.staged.map((entry) => [entry.folder, entry.path]));
    const folders = [...stagedPaths.keys()];
    if (folders.some((folder) => !isPlainFolderName(folder))) {
      return fail(libError(Object.assign(new Error("The library returned an invalid folder name"), { code: PLUGIN_STAGE_INCOMPLETE })));
    }
    const collidingFolders = [];
    const collidingPaths = [];
    for (const folder of folders) {
      for (const dir of dirs) {
        const path2 = join7(ctx.root, dir, folder);
        if (await lstat5(path2).catch(() => null) === null)
          continue;
        if (!collidingFolders.includes(folder))
          collidingFolders.push(folder);
        collidingPaths.push(path2);
      }
    }
    let trashed = false;
    if (collidingPaths.length > 0) {
      if (!replace)
        return fail({ code: "collision", folders: collidingFolders });
      if (!ctx.trash)
        return fail({ code: ctx.noTrashCode });
      const trashError = await moveToTrash(ctx.trash, collidingPaths);
      if (trashError)
        return fail(trashError);
      trashed = true;
    }
    const libDirs = dirs.filter((dir) => LIB_AGENT_BY_DIR[dir] !== undefined);
    const copyDirs = dirs.filter((dir) => COPY_ONLY_DIRS.includes(dir));
    if (libDirs.length > 0) {
      const libAgents = libDirs.map((dir) => LIB_AGENT_BY_DIR[dir]);
      try {
        const { failed } = await ctx.lib.install(source, { cwd: ctx.root, names, libAgents, onWarning: (w3) => warnings.push(w3) });
        if (failed.length > 0)
          return fail({ code: "lib", diagnostics: failed, ...trashed ? { trashed } : {} });
      } catch (error) {
        return fail(libError(error, trashed));
      }
    } else {
      warnings.push({ code: "PLUGIN_NOT_TRACKED", message: "These skills were copied without a lock entry: no targeted dir is known to the skills library." });
    }
    try {
      for (const folder of folders) {
        const from = libDirs.length > 0 ? join7(ctx.root, libDirs[0], folder) : stagedPaths.get(folder);
        for (const dir of copyDirs)
          await copySkill(from, join7(ctx.root, dir, folder));
      }
    } catch (error) {
      return fail(libError(error, trashed));
    }
    return done(warnings);
  } finally {
    await disposeStage?.().catch(() => {});
  }
}
async function propagate(ctx, folder, agents2) {
  const disk = await readDisk(ctx.root);
  if (!disk)
    return fail({ code: "no-workspace" });
  const skill = skillOf(disk.scan, folder);
  if (!skill)
    return fail({ code: "gone" });
  const targets = [...new Set(agents2.map(targetDirOf).filter((dir) => dir !== null))];
  if (targets.length === 0)
    return fail({ code: "no-target" });
  const unsafe = new Set(disk.unsafe);
  const unsafeTargets = targets.filter((dir) => unsafe.has(dir));
  const safeTargets = targets.filter((dir) => !unsafe.has(dir));
  if (safeTargets.length === 0)
    return fail({ code: "unsafe-dir", dirs: unsafeTargets });
  const warnings = unsafeTargets.map((dir) => unsafeWarning(dir));
  const real = skill.copies.find((copy) => copy.kind === "dir");
  const from = real ? real.path : skill.copies[0].realPath;
  for (const dir of safeTargets) {
    if (skill.copies.some((copy) => copy.dir === dir))
      continue;
    try {
      await copySkill(from, join7(ctx.root, dir, folder));
    } catch (error) {
      if (error.code === "EEXIST")
        return fail({ code: "collision", folders: [folder] });
      return fail(libError(error));
    }
  }
  return done(warnings);
}
async function keepVersion(ctx, folder, hash) {
  const disk = await readDisk(ctx.root);
  if (!disk)
    return fail({ code: "no-workspace" });
  const skill = skillOf(disk.scan, folder);
  if (!skill)
    return fail({ code: "gone" });
  const chosen = skill.copies.find((copy) => copy.kind === "dir" && copy.hash === hash) ?? skill.copies.find((copy) => copy.kind === "external-link" && copy.hash === hash);
  if (!chosen)
    return fail({ code: "gone" });
  const stale = skill.copies.filter((copy) => copy.kind === "dir" && copy.hash !== hash);
  if (stale.length === 0)
    return done([]);
  if (!ctx.trash)
    return fail({ code: ctx.noTrashCode });
  const trashError = await moveToTrash(ctx.trash, stale.map((copy) => copy.path));
  if (trashError)
    return fail(trashError);
  const from = chosen.kind === "dir" ? chosen.path : chosen.realPath;
  try {
    for (const copy of stale)
      await copySkill(from, copy.path);
  } catch (error) {
    return fail(libError(error, true));
  }
  return done([]);
}
async function removeSkill(ctx, folder) {
  if (!ctx.trash)
    return fail({ code: ctx.noTrashCode });
  const disk = await readDisk(ctx.root);
  if (!disk)
    return fail({ code: "no-workspace" });
  const skill = skillOf(disk.scan, folder);
  if (!skill)
    return fail({ code: "gone" });
  let entry;
  try {
    entry = (await ctx.lib.lockEntries(ctx.root)).get(folder);
  } catch (error) {
    return fail(libError(error));
  }
  const agentsUnsafe = disk.unsafe.includes(".agents/skills");
  const warnings = disk.unsafe.map((dir) => unsafeWarning(dir, dir === ".agents/skills" && entry !== undefined));
  const trashError = await moveToTrash(ctx.trash, skill.copies.map((copy) => copy.path));
  if (trashError)
    return fail(trashError);
  if (!entry || agentsUnsafe)
    return done(warnings);
  if (sanitizeName2(entry.libName) !== folder) {
    warnings.push({
      code: PLUGIN_LOCK_KEPT,
      message: `The lock entry for ${entry.libName} was kept: it belongs to another folder than ${folder}`,
      skill: entry.libName
    });
    return done(warnings);
  }
  const unsafe = new Set(disk.unsafe);
  const libDirs = MANAGED_DIRS.filter((dir) => !unsafe.has(dir) && LIB_AGENT_BY_DIR[dir] !== undefined);
  const libAgents = libDirs.map((dir) => LIB_AGENT_BY_DIR[dir]);
  const leftovers = [];
  for (const dir of new Set([...libDirs, ".agents/skills"])) {
    const path2 = join7(ctx.root, dir, folder);
    if (await lstat5(path2).catch(() => null) !== null)
      leftovers.push(path2);
  }
  const leftoverError = await moveToTrash(ctx.trash, leftovers);
  if (leftoverError)
    return fail({ ...leftoverError, trashed: true });
  try {
    const { failed } = await ctx.lib.untrack([entry.libName], ctx.root, libAgents);
    warnings.push(...failed.filter((diagnostic) => diagnostic.code === PLUGIN_LOCK_KEPT));
    const errors2 = failed.filter((diagnostic) => diagnostic.code !== PLUGIN_LOCK_KEPT);
    if (errors2.length > 0)
      return fail({ code: "lib", diagnostics: errors2, trashed: true });
  } catch (error) {
    return fail(libError(error, true));
  }
  return done(warnings);
}

// src/visibility.ts
import * as nodePath2 from "node:path";
function sourceLabel(entry, home2, pathApi = nodePath2) {
  if (!entry)
    return { kind: "handwritten" };
  if (pathApi.isAbsolute(entry.source))
    return { kind: "local", path: abbreviateHome(entry.source, home2, pathApi) };
  return { kind: "remote", source: entry.source };
}
var dirOrder = (copy) => MANAGED_DIRS.indexOf(copy.dir);
function contentOf(copy, copies) {
  if (copy.kind !== "internal-link")
    return copy.hash;
  const target = copies.find((other) => other.kind === "dir" && other.realPath === copy.realPath);
  return target ? target.hash : copy.hash;
}
function versionsOf(copies) {
  const byHash = new Map;
  for (const copy of copies) {
    const hash = contentOf(copy, copies);
    const dirs = byHash.get(hash);
    if (dirs)
      dirs.push(copy.dir);
    else
      byHash.set(hash, [copy.dir]);
  }
  return [...byHash].map(([hash, dirs]) => ({ hash, dirs }));
}
function buildRow(disk, source, active) {
  const copies = [...disk.copies].sort((a2, b4) => dirOrder(a2) - dirOrder(b4));
  const heldDirs = new Set(copies.map((copy) => copy.dir));
  const agents2 = active.map((agent2) => {
    const via = MANAGED_DIRS.filter((dir) => heldDirs.has(dir) && readers(dir, [agent2]).length > 0);
    return { agent: agent2, state: via.length > 0 ? "sees" : "absent", via };
  });
  return {
    folder: disk.folder,
    displayName: disk.displayName,
    description: disk.description,
    source,
    agents: agents2,
    missingFor: agents2.filter((a2) => a2.state === "absent").map((a2) => a2.agent),
    external: copies.some((copy) => copy.kind === "external-link"),
    versions: versionsOf(copies),
    copies: copies.map((copy) => ({ dir: copy.dir, kind: copy.kind, feeds: readers(copy.dir, active) }))
  };
}
function buildRows(scan, lock, active, home2, pathApi = nodePath2) {
  const capable = skillCapable(active);
  return scan.skills.map((disk) => buildRow(disk, sourceLabel(lock.get(disk.folder), home2, pathApi), capable));
}

// src/workspace.ts
import { lstat as lstat6, realpath as realpath5 } from "node:fs/promises";
import { join as join8 } from "node:path";
function classifyRoot(path2, platform2) {
  if (isNetworkPath(path2, platform2))
    return "unc";
  if (/^[A-Za-z]:[\\/]/.test(path2))
    return "drive";
  if (path2.startsWith("/"))
    return "posix";
  return "other";
}
var isRemoteHost = (hostId) => hostId !== null && (hostId.startsWith("ssh:") || hostId.startsWith("runtime:"));
async function isLinkedWorktree(root) {
  return (await lstat6(join8(root, ".git")).catch(() => null))?.isFile() ?? false;
}
async function resolveWorkspace(call, home2, platform2, log2 = () => {}, realpathFn = realpath5) {
  const context = await call("workspace.readContext", {});
  const id = context?.workspaceId;
  if (!context || !id)
    return { view: { status: "none" } };
  const { workspaces, truncated } = await call("workspace.list", {});
  const row = workspaces.find((candidate) => candidate.id === id);
  if (!row) {
    if (truncated)
      log2("workspace not found in a truncated workspace.list, treated as none");
    return { view: { status: "none" } };
  }
  const shape = classifyRoot(row.path, platform2);
  log2(`workspace root shape=${shape}`);
  if (isRemoteHost(row.hostId))
    return { view: { status: "remote" } };
  if (platform2 === "win32" && shape === "posix")
    return { view: { status: "wsl" } };
  const real = await realpathFn(row.path).catch(() => null);
  if (real === null)
    return { view: { status: "missing" } };
  if (real === await realpathFn(home2).catch(() => home2))
    return { view: { status: "home" } };
  return {
    root: row.path,
    view: {
      status: "ready",
      id: row.id,
      name: row.name,
      branch: row.branch ?? (context.branch === "" ? null : context.branch),
      linkedWorktree: await isLinkedWorktree(row.path),
      network: isNetworkPath(row.path, platform2)
    }
  };
}

// src/worker-core.ts
var ENV_NAMES = ["HOME", "USERPROFILE", "APPDATA", "XDG_CONFIG_HOME", "CLAUDE_CONFIG_DIR", "CODEX_HOME"];
var INVENTORY_TTL_MS = 1e4;
var PREVIEW_TTL_MS = 10 * 60000;
var messageOf = (error) => error instanceof Error ? error.message : String(error);
var codeOf2 = (error) => toLibDiagnostic(error).code;
var libFailure = (error) => ({ code: "lib", diagnostics: [toLibDiagnostic(error)] });
function describeError(error) {
  const codes = (error.diagnostics ?? []).map((diagnostic) => diagnostic.code).join(",");
  return `error=${error.code}${codes ? ` lib=${codes}` : ""}${error.trashed ? " trashed" : ""}`;
}
var folderOf = (op) => op.kind === "add" ? op.names.join(",") : op.folder;
var WORKSPACE_CHANGED = { code: "workspace-changed" };
var onNetwork = (view) => view.status === "ready" && view.network;
var isShownWorkspace = (focused, workspaceId) => focused.view.status === "ready" && focused.view.id === workspaceId;
async function overlapsManagedDirs(path2, root) {
  const rootReal = await realpath6(root).catch(() => null);
  const pathReal = await realpath6(path2).catch(() => null);
  if (rootReal === null || pathReal === null)
    return false;
  if (isInside(rootReal, pathReal))
    return true;
  for (const dir of MANAGED_DIRS) {
    const expected = join9(rootReal, dir);
    const candidates = [expected, await realpath6(expected).catch(() => null)];
    for (const candidate of candidates) {
      if (candidate !== null && (isInside(pathReal, candidate) || isInside(candidate, pathReal)))
        return true;
    }
  }
  return false;
}
var teardown = null;
async function deactivate() {
  await teardown?.();
}
function reusingTrial(lib, trial) {
  let spent = false;
  return {
    ...lib,
    stage: (...args) => {
      if (spent)
        return lib.stage(...args);
      spent = true;
      return Promise.resolve(trial);
    }
  };
}
async function activateWith(orca, deps) {
  const hostCall = orca.host.call.bind(orca.host);
  let lastShapeLine = "";
  const focusedWorkspace = () => resolveWorkspace(hostCall, deps.home, deps.platform, (line) => {
    if (line.startsWith("workspace root shape=")) {
      if (line === lastShapeLine)
        return;
      lastShapeLine = line;
    }
    orca.log(line);
  }, deps.realpath);
  let inventory = null;
  let probing = null;
  let writing = Promise.resolve();
  let current = null;
  let preview = null;
  let previewTicket = 0;
  let stateTicket = 0;
  function probe() {
    const log2 = (line) => orca.log(line);
    const readHistory = async () => {
      const seen = await listHistoryAgents(hostCall, (method) => orca.host.has(method), log2);
      if (seen)
        log2(`history agents=${[...seen].filter((id) => agentById(id) !== undefined).sort().join(",")}`);
      return seen;
    };
    const run = detectAgents2(deps.inventory, deps.home, readHistory, log2).then((next) => {
      inventory = next;
      orca.log(`inventory source=${next.source} agents=${next.agents.length}`);
      return next;
    }).finally(() => {
      if (probing === run)
        probing = null;
    });
    probing = run;
    return run;
  }
  function listInventory(force, anyAge = false) {
    if (!force && probing)
      return probing;
    if (!force && inventory && (anyAge || deps.inventory.now() - inventory.detectedAt < INVENTORY_TTL_MS))
      return Promise.resolve(inventory);
    return probe();
  }
  async function agentsOf(force = false, anyAge = false) {
    let found = null;
    try {
      found = await listInventory(force, anyAge);
    } catch (error) {
      orca.log(`inventory failed: ${messageOf(error)}`);
    }
    const installed = found ? byLabel(skillCapable(found.agents)) : [];
    const hidden = await readHidden();
    const active = installed.filter((id) => !hidden.includes(id));
    if (active.length === 0)
      return { installed, hidden, active: [], fallback: true, writeDirs: FALLBACK_DIRS };
    return { installed, hidden, active, fallback: false, writeDirs: writeSet(active) };
  }
  const present = ENV_NAMES.filter((name) => deps.env[name] !== undefined);
  orca.log(`env present=${present.length > 0 ? present.join(",") : "none"}`);
  listInventory(false).catch((error) => orca.log(`inventory failed: ${messageOf(error)}`));
  function serialize(task) {
    const run = writing.then(task);
    writing = run.catch(() => {
      return;
    });
    return run;
  }
  async function readHidden() {
    try {
      return parseHiddenAgents(await orca.storage.get(HIDDEN_AGENTS_KEY));
    } catch (error) {
      orca.log(`hidden agents unreadable: ${messageOf(error)}`);
      return [];
    }
  }
  async function readLock(root) {
    try {
      return { lock: await deps.lib.lockEntries(root), unreadable: false };
    } catch (error) {
      orca.log(`lock unreadable code=${codeOf2(error)}`);
      return { lock: new Map, unreadable: true };
    }
  }
  const agentViews = (active) => active.flatMap((id) => {
    const spec = agentById(id);
    return spec ? [{ id, label: spec.label, icon: spec.icon, trust: TRUST_GATED[id] ?? null }] : [];
  });
  async function currentState(force = false, anyAge = false) {
    const focused = await focusedWorkspace();
    const agents2 = await agentsOf(force, anyAge);
    const base = {
      workspace: focused.view,
      agents: agentViews(agents2.active),
      detected: agentViews(agents2.installed).map((view) => ({ ...view, hidden: agents2.hidden.includes(view.id) })),
      inventory: agents2.fallback ? "fallback" : "detected",
      capabilities: { trash: onNetwork(focused.view) ? "network" : deps.trashStatus, folderPicker: deps.pickFolder !== null },
      platform: deps.platform
    };
    if (!("root" in focused))
      return { ...base, rows: [], unsafeDirs: [], lockUnreadable: false, busy: current };
    const { root } = focused;
    const scan = await scanWorkspace(root);
    const { lock, unreadable } = await readLock(root);
    const rows = buildRows(scan, lock, agents2.active, deps.home);
    return { ...base, rows, unsafeDirs: scan.unsafeDirs, lockUnreadable: unreadable, busy: current };
  }
  async function postState() {
    const ticket = ++stateTicket;
    const state = await currentState();
    if (ticket === stateTicket)
      orca.panels.post("state.changed", state);
  }
  const postStateSafely = () => postState().catch((error) => orca.log(`state failed: ${messageOf(error)}`));
  orca.panels.handle("state.get", () => currentState());
  orca.panels.handle("state.refresh", () => currentState(true));
  orca.panels.handle("agents.setHidden", async ({ agent: agent2, hidden }) => {
    await serialize(async () => {
      const current2 = parseHiddenAgents(await orca.storage.get(HIDDEN_AGENTS_KEY));
      const { installed } = await agentsOf(false, true);
      const next = setHidden(current2, installed, agent2, hidden);
      if (next !== current2)
        await orca.storage.set(HIDDEN_AGENTS_KEY, [...next]);
    });
    return currentState(false, true);
  });
  orca.events.on("workspace.changed", () => postStateSafely());
  function releasePreview() {
    if (!preview)
      return;
    if (preview.timer)
      clearTimeout(preview.timer);
    const { source } = preview;
    preview = null;
    source.dispose().catch((error) => orca.log(`preview dispose failed: ${messageOf(error)}`));
  }
  function armPreview(held) {
    if (held.timer)
      clearTimeout(held.timer);
    held.timer = setTimeout(() => {
      if (preview === held)
        releasePreview();
    }, PREVIEW_TTL_MS);
    held.timer.unref?.();
  }
  function pickByHit(source, skillId) {
    return source.skills.find((skill) => skill.name.toLowerCase() === skillId.toLowerCase()) ?? source.skills.find((skill) => sanitizeName2(skill.name) === sanitizeName2(skillId));
  }
  const addRunning = () => current?.kind === "add";
  async function previewSource(request, signal) {
    if (addRunning())
      return { ok: false, error: { code: "busy" } };
    const focused = await focusedWorkspace();
    if (!("root" in focused))
      return { ok: false, error: { code: "no-workspace" } };
    if (!isShownWorkspace(focused, request.workspaceId))
      return { ok: false, error: WORKSPACE_CHANGED };
    if (addRunning())
      return { ok: false, error: { code: "busy" } };
    const ticket = ++previewTicket;
    releasePreview();
    let input;
    let label;
    if (request.kind === "path") {
      input = resolveInputPath(request.text.trim(), focused.root, deps.home);
      if (!await stat4(input).catch(() => null))
        return { ok: false, error: { code: "path-not-found" } };
      if (await overlapsManagedDirs(input, focused.root))
        return { ok: false, error: { code: "source-in-project" } };
      label = { kind: "local", path: abbreviateHome(input, deps.home) };
    } else {
      input = request.source;
      label = { kind: "remote", source: request.source };
    }
    let source;
    try {
      source = await deps.lib.resolve(input, focused.root);
    } catch (error) {
      return { ok: false, error: libFailure(error) };
    }
    let skills = source.skills.map(({ name, description }) => ({ name, description }));
    if (request.kind === "remote") {
      const hit = pickByHit(source, request.skillId);
      if (!hit) {
        await source.dispose().catch(() => {
          return;
        });
        const missing = new Error(`No skill matches ${request.skillId} in ${request.source}`);
        return { ok: false, error: libFailure(Object.assign(missing, { code: "SKILLS_NO_MATCHING_SKILLS" })) };
      }
      skills = [{ name: hit.name, description: hit.description }];
    }
    if (signal.aborted || ticket !== previewTicket) {
      await source.dispose().catch(() => {
        return;
      });
      return { ok: false, error: { code: "preview-expired" } };
    }
    const held = { id: randomUUID(), source, workspaceId: request.workspaceId, root: focused.root, timer: null };
    armPreview(held);
    preview = held;
    return { ok: true, previewId: held.id, label, skills, preselected: skills.map((skill) => skill.name) };
  }
  orca.panels.handle("source.preview", async (request, context) => {
    try {
      const answer = await previewSource(request, context.signal);
      if (!answer.ok)
        orca.log(`op=preview ${describeError(answer.error)}`);
      return answer;
    } catch (error) {
      orca.log(`op=preview failed: ${messageOf(error)}`);
      throw error;
    }
  });
  async function installedKeys() {
    try {
      const focused = await focusedWorkspace();
      if (!("root" in focused))
        return new Set;
      const [scan, { lock }] = await Promise.all([scanWorkspace(focused.root), readLock(focused.root)]);
      const keys = new Set;
      for (const skill of scan.skills) {
        const entry = lock.get(skill.folder);
        if (entry)
          keys.add(`${skill.folder}
${entry.source}`);
      }
      return keys;
    } catch (error) {
      orca.log(`installed lookup failed: ${messageOf(error)}`);
      return new Set;
    }
  }
  orca.panels.handle("search", async ({ query }, context) => {
    if (query.trim() === "")
      return { ok: true, hits: [] };
    try {
      const hits = await searchSkills(query, { base: deps.searchBase, fetch: deps.fetch, signal: context.signal });
      const installed = await installedKeys();
      return { ok: true, hits: hits.map((hit) => ({ ...hit, installed: installed.has(`${hit.skillId}
${hit.source}`) })) };
    } catch (error) {
      if (!(error instanceof SearchError)) {
        orca.log(`search failed: ${messageOf(error)}`);
        throw error;
      }
      orca.log(`search failed code=${error.code}`);
      return { ok: false, error: error.code };
    }
  });
  orca.panels.handle("path.check", async ({ text, workspaceId }) => {
    const focused = await focusedWorkspace();
    if (!("root" in focused))
      return { exists: false };
    if (!isShownWorkspace(focused, workspaceId))
      return { exists: false, error: WORKSPACE_CHANGED };
    const info = await stat4(resolveInputPath(text.trim(), focused.root, deps.home)).catch(() => null);
    return { exists: info?.isDirectory() ?? false };
  });
  orca.panels.handle("folder.pick", async () => {
    if (!deps.pickFolder)
      return { path: null };
    try {
      return { path: await deps.pickFolder() };
    } catch (error) {
      orca.log(`folder picker failed: ${messageOf(error)}`);
      return { path: null };
    }
  });
  function logError(op, error) {
    orca.log(`op=${op.kind} folder=${folderOf(op)} ${describeError(error)}`);
  }
  function logWarnings(op, warnings) {
    for (const warning of warnings)
      orca.log(`op=${op.kind} folder=${folderOf(op)} warning=${warning.code}`);
  }
  async function prepareAdd(op, ctx, held) {
    await mkdir4(ctx.tmpdir, { recursive: true });
    let trial;
    try {
      trial = await ctx.lib.stage(held.source, op.names, ctx.tmpdir);
    } catch (error) {
      return { error: libFailure(error) };
    }
    const refuse = async (error) => {
      await trial.dispose().catch(() => {
        return;
      });
      return { error };
    };
    try {
      const unsafe = new Set((await scanWorkspace(ctx.root)).unsafeDirs);
      const dirs = ctx.writeDirs.filter((dir) => !unsafe.has(dir));
      const colliding = [];
      for (const { folder } of trial.staged) {
        for (const dir of dirs) {
          if (await lstat7(join9(ctx.root, dir, folder)).catch(() => null) === null)
            continue;
          if (!colliding.includes(folder))
            colliding.push(folder);
        }
      }
      if (colliding.length > 0) {
        if (!op.replace)
          return await refuse({ code: "collision", folders: colliding });
        if (!ctx.trash)
          return await refuse({ code: ctx.noTrashCode });
      }
      return { ctx: { ...ctx, lib: reusingTrial(ctx.lib, trial) } };
    } catch (error) {
      await trial.dispose().catch(() => {
        return;
      });
      throw error;
    }
  }
  function runOp(op, ctx, held) {
    switch (op.kind) {
      case "add":
        return addSkills(ctx, held.source, op.names, op.replace);
      case "propagate":
        return propagate(ctx, op.folder, op.agents);
      case "keep":
        return keepVersion(ctx, op.folder, op.hash);
      case "remove":
        return removeSkill(ctx, op.folder);
    }
  }
  async function execute(opId, op, ctx, held) {
    let result;
    try {
      result = await runOp(op, ctx, held);
    } catch (error) {
      result = { ok: false, error: libFailure(error) };
    }
    if (op.kind === "add" && held && preview === held)
      releasePreview();
    if (result.ok)
      logWarnings(op, result.warnings);
    else
      logError(op, result.error);
    current = null;
    const finished = result.ok ? { opId, op, ok: true, warnings: result.warnings } : { opId, op, ok: false, error: result.error, warnings: [] };
    orca.panels.post("op.finished", finished);
    await postStateSafely();
  }
  async function startOp(op, workspaceId) {
    const refuse = (error) => {
      logError(op, error);
      return { ok: false, error };
    };
    const focused = await focusedWorkspace();
    if (!("root" in focused))
      return refuse({ code: "no-workspace" });
    if (!isShownWorkspace(focused, workspaceId))
      return refuse(WORKSPACE_CHANGED);
    const agents2 = await agentsOf();
    const network = onNetwork(focused.view);
    let ctx = {
      root: focused.root,
      lib: deps.lib,
      trash: network ? null : deps.trash,
      noTrashCode: network ? "network-path" : deps.trashStatus === "unverified" ? "trash-unverified" : "no-trash",
      tmpdir: deps.tmpdir,
      writeDirs: agents2.writeDirs
    };
    let held = null;
    if (op.kind === "add") {
      held = preview?.id === op.previewId ? preview : null;
      if (!held)
        return refuse({ code: "preview-expired" });
      if (held.workspaceId !== workspaceId || held.root !== focused.root) {
        releasePreview();
        return refuse(WORKSPACE_CHANGED);
      }
      if (held.timer)
        clearTimeout(held.timer);
      let prepared;
      try {
        prepared = await prepareAdd(op, ctx, held);
      } catch (error) {
        armPreview(held);
        return refuse(libFailure(error));
      }
      if ("error" in prepared) {
        armPreview(held);
        return refuse(prepared.error);
      }
      ctx = prepared.ctx;
    }
    const opId = randomUUID();
    execute(opId, op, ctx, held).catch((error) => {
      current = null;
      orca.log(`op=${op.kind} folder=${folderOf(op)} failed: ${messageOf(error)}`);
    });
    return { ok: true, opId };
  }
  orca.panels.handle("op.start", async ({ op, workspaceId }) => {
    if (current) {
      logError(op, { code: "busy" });
      return { ok: false, error: { code: "busy" } };
    }
    current = op;
    let started = false;
    try {
      const answer = await startOp(op, workspaceId);
      started = answer.ok;
      return answer;
    } catch (error) {
      orca.log(`op=${op.kind} folder=${folderOf(op)} failed: ${messageOf(error)}`);
      throw error;
    } finally {
      if (!started)
        current = null;
    }
  });
  teardown = async () => {
    releasePreview();
  };
}

// src/worker.ts
function activate(orca) {
  const { trasher, status } = systemTrasher(process.platform, existsSync3, execRunner);
  return activateWith(orca, {
    lib: realSkillsLib,
    inventory: { libAgents: realLibAgents, exists: existsSync3, now: Date.now },
    trash: trasher,
    trashStatus: status,
    pickFolder: folderPicker(process.platform, execRunner),
    fetch,
    searchBase: SKILLS_SH,
    home: homedir2(),
    tmpdir: tmpdir2(),
    platform: process.platform,
    env: process.env
  });
}
export {
  deactivate,
  activate as default
};
