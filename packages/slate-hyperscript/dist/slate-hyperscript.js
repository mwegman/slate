(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('slate')) :
	typeof define === 'function' && define.amd ? define(['exports', 'slate'], factory) :
	(factory((global.SlateHyperscript = {}),global.Slate));
}(this, (function (exports,slate) { 'use strict';

/*!
 * isobject <https://github.com/jonschlinkert/isobject>
 *
 * Copyright (c) 2014-2017, Jon Schlinkert.
 * Released under the MIT License.
 */

var isobject = function isObject(val) {
  return val != null && typeof val === 'object' && Array.isArray(val) === false;
};

function isObjectObject(o) {
  return isobject(o) === true
    && Object.prototype.toString.call(o) === '[object Object]';
}

var isPlainObject = function isPlainObject(o) {
  var ctor,prot;

  if (isObjectObject(o) === false) return false;

  // If has modified constructor
  ctor = o.constructor;
  if (typeof ctor !== 'function') return false;

  // If has modified prototype
  prot = ctor.prototype;
  if (isObjectObject(prot) === false) return false;

  // If constructor does not have an Object-specific method
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  // Most likely a plain Object
  return true;
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};









var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};













var objectWithoutProperties = function (obj, keys) {
  var target = {};

  for (var i in obj) {
    if (keys.indexOf(i) >= 0) continue;
    if (!Object.prototype.hasOwnProperty.call(obj, i)) continue;
    target[i] = obj[i];
  }

  return target;
};

/**
 * Auto-incrementing ID to keep track of paired decorations.
 *
 * @type {Number}
 */

var uid = 0;

/**
 * Create an anchor point.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {AnchorPoint}
 */

function createAnchor(tagName, attributes, children) {
  return new AnchorPoint(attributes);
}

/**
 * Create a block.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {Block}
 */

function createBlock(tagName, attributes, children) {
  var attrs = _extends({}, attributes, { object: 'block' });
  var block = createNode('node', attrs, children);
  return block;
}

/**
 * Create a cursor point.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {CursorPoint}
 */

function createCursor(tagName, attributes, children) {
  return new CursorPoint(attributes);
}

/**
 * Create a decoration point, or wrap a list of leaves and set the decoration
 * point tracker on them.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {DecorationPoint|List<Leaf>}
 */

function createDecoration(tagName, attributes, children) {
  var key = attributes.key,
      data = attributes.data;

  var type = tagName;

  if (key) {
    return new DecorationPoint({ id: key, type: type, data: data });
  }

  var leaves = createLeaves('leaves', {}, children);
  var first = leaves.first();
  var last = leaves.last();
  var id = '__decoration_' + uid++ + '__';
  var start = new DecorationPoint({ id: id, type: type, data: data });
  var end = new DecorationPoint({ id: id, type: type, data: data });
  setPoint(first, start, 0);
  setPoint(last, end, last.text.length);
  return leaves;
}

/**
 * Create a document.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {Document}
 */

function createDocument(tagName, attributes, children) {
  var attrs = _extends({}, attributes, { object: 'document' });
  var document = createNode('node', attrs, children);
  return document;
}

/**
 * Create a focus point.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {FocusPoint}
 */

function createFocus(tagName, attributes, children) {
  return new FocusPoint(attributes);
}

/**
 * Create an inline.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {Inline}
 */

function createInline(tagName, attributes, children) {
  var attrs = _extends({}, attributes, { object: 'inline' });
  var inline = createNode('node', attrs, children);
  return inline;
}

/**
 * Create a list of leaves.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {List<Leaf>}
 */

function createLeaves(tagName, attributes, children) {
  var _attributes$marks = attributes.marks,
      marks = _attributes$marks === undefined ? slate.Mark.createSet() : _attributes$marks;

  var length = 0;
  var leaves = slate.Leaf.createList([]);
  var leaf = void 0;

  children.forEach(function (child) {
    if (slate.Leaf.isLeafList(child)) {
      if (leaf) {
        leaves = leaves.push(leaf);
        leaf = null;
      }

      child.forEach(function (l) {
        l = preservePoint(l, function (obj) {
          return obj.addMarks(marks);
        });
        leaves = leaves.push(l);
      });
    } else {
      if (!leaf) {
        leaf = slate.Leaf.create({ marks: marks, text: '' });
        length = 0;
      }

      if (typeof child === 'string') {
        var offset = leaf.text.length;
        leaf = preservePoint(leaf, function (obj) {
          return obj.insertText(offset, child);
        });
        length += child.length;
      }

      if (isPoint(child)) {
        setPoint(leaf, child, length);
      }
    }
  });

  if (!leaves.size && !leaf) {
    leaf = slate.Leaf.create({ marks: marks, text: '' });
  }

  if (leaf) {
    leaves = leaves.push(leaf);
  }

  return leaves;
}

/**
 * Create a list of leaves from a mark.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {List<Leaf>}
 */

function createMark(tagName, attributes, children) {
  var marks = slate.Mark.createSet([attributes]);
  var leaves = createLeaves('leaves', { marks: marks }, children);
  return leaves;
}

/**
 * Create a node.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {Node}
 */

function createNode(tagName, attributes, children) {
  var object = attributes.object;


  if (object === 'text') {
    return createText('text', {}, children);
  }

  var nodes = [];
  var others = [];

  children.forEach(function (child) {
    if (slate.Node.isNode(child)) {
      if (others.length) {
        var text = createText('text', {}, others);
        nodes.push(text);
      }

      nodes.push(child);
      others = [];
    } else {
      others.push(child);
    }
  });

  if (others.length) {
    var text = createText('text', {}, others);
    nodes.push(text);
  }

  var node = slate.Node.create(_extends({}, attributes, { nodes: nodes }));
  return node;
}

/**
 * Create a selection.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {Selection}
 */

function createSelection(tagName, attributes, children) {
  var anchor = children.find(function (c) {
    return c instanceof AnchorPoint;
  });
  var focus = children.find(function (c) {
    return c instanceof FocusPoint;
  });
  var marks = attributes.marks,
      focused = attributes.focused;

  var selection = slate.Selection.create({
    marks: marks,
    isFocused: focused,
    anchor: anchor && {
      key: anchor.key,
      offset: anchor.offset,
      path: anchor.path
    },
    focus: focus && {
      key: focus.key,
      offset: focus.offset,
      path: focus.path
    }
  });

  return selection;
}

/**
 * Create a text node.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {Text}
 */

function createText(tagName, attributes, children) {
  var key = attributes.key;

  var leaves = createLeaves('leaves', {}, children);
  var text = slate.Text.create({ key: key, leaves: leaves });
  var length = 0;

  leaves.forEach(function (leaf) {
    incrementPoint(leaf, length);
    preservePoint(leaf, function () {
      return text;
    });
    length += leaf.text.length;
  });

  return text;
}

/**
 * Create a value.
 *
 * @param {String} tagName
 * @param {Object} attributes
 * @param {Array} children
 * @return {Value}
 */

function createValue(tagName, attributes, children) {
  var data = attributes.data;

  var document = children.find(slate.Document.isDocument);
  var selection = children.find(slate.Selection.isSelection);
  var anchor = void 0;
  var focus = void 0;
  var marks = void 0;
  var isFocused = void 0;
  var decorations = [];
  var partials = {};

  // Search the document's texts to see if any of them have the anchor or
  // focus information saved, or decorations applied.
  if (document) {
    document.getTexts().forEach(function (text) {
      var __anchor = text.__anchor,
          __decorations = text.__decorations,
          __focus = text.__focus;


      if (__anchor != null) {
        anchor = slate.Point.create({ key: text.key, offset: __anchor.offset });
        marks = __anchor.marks;
        isFocused = __anchor.isFocused;
      }

      if (__focus != null) {
        focus = slate.Point.create({ key: text.key, offset: __focus.offset });
        marks = __focus.marks;
        isFocused = __focus.isFocused;
      }

      if (__decorations != null) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
          for (var _iterator = __decorations[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var dec = _step.value;
            var id = dec.id;

            var partial = partials[id];
            delete partials[id];

            if (!partial) {
              dec.key = text.key;
              partials[id] = dec;
              continue;
            }

            var decoration = slate.Decoration.create({
              anchor: {
                key: partial.key,
                offset: partial.offset
              },
              focus: {
                key: text.key,
                offset: dec.offset
              },
              mark: {
                type: dec.type,
                data: dec.data
              }
            });

            decorations.push(decoration);
          }
        } catch (err) {
          _didIteratorError = true;
          _iteratorError = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion && _iterator.return) {
              _iterator.return();
            }
          } finally {
            if (_didIteratorError) {
              throw _iteratorError;
            }
          }
        }
      }
    });
  }

  if (Object.keys(partials).length > 0) {
    throw new Error('Slate hyperscript must have both a start and an end defined for each decoration using the `key=` prop.');
  }

  if (anchor && !focus) {
    throw new Error('Slate hyperscript ranges must have both `<anchor />` and `<focus />` defined if one is defined, but you only defined `<anchor />`. For collapsed selections, use `<cursor />` instead.');
  }

  if (!anchor && focus) {
    throw new Error('Slate hyperscript ranges must have both `<anchor />` and `<focus />` defined if one is defined, but you only defined `<focus />`. For collapsed selections, use `<cursor />` instead.');
  }

  if (anchor || focus) {
    if (!selection) {
      selection = slate.Selection.create({ anchor: anchor, focus: focus, isFocused: isFocused, marks: marks });
    } else {
      selection = selection.setPoints([anchor, focus]);
    }
  } else if (!selection) {
    selection = slate.Selection.create();
  }

  selection = selection.normalize(document);

  if (decorations.length > 0) {
    decorations = decorations.map(function (d) {
      return d.normalize(document);
    });
  }

  var value = slate.Value.fromJSON(_extends({
    data: data,
    decorations: decorations,
    document: document,
    selection: selection
  }, attributes));

  return value;
}

/**
 * Point classes that can be created at different points in the document and
 * then searched for afterwards, for creating ranges.
 *
 * @type {Class}
 */

var CursorPoint = function CursorPoint() {
  var attrs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  classCallCheck(this, CursorPoint);
  var _attrs$isFocused = attrs.isFocused,
      isFocused = _attrs$isFocused === undefined ? true : _attrs$isFocused,
      _attrs$marks = attrs.marks,
      marks = _attrs$marks === undefined ? null : _attrs$marks;

  this.isFocused = isFocused;
  this.marks = marks;
  this.offset = null;
};

var AnchorPoint = function AnchorPoint() {
  var attrs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  classCallCheck(this, AnchorPoint);
  var _attrs$isFocused2 = attrs.isFocused,
      isFocused = _attrs$isFocused2 === undefined ? true : _attrs$isFocused2,
      _attrs$key = attrs.key,
      key = _attrs$key === undefined ? null : _attrs$key,
      _attrs$marks2 = attrs.marks,
      marks = _attrs$marks2 === undefined ? null : _attrs$marks2,
      _attrs$offset = attrs.offset,
      offset = _attrs$offset === undefined ? null : _attrs$offset,
      _attrs$path = attrs.path,
      path = _attrs$path === undefined ? null : _attrs$path;

  this.isFocused = isFocused;
  this.key = key;
  this.marks = marks;
  this.offset = offset;
  this.path = path;
};

var FocusPoint = function FocusPoint() {
  var attrs = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  classCallCheck(this, FocusPoint);
  var _attrs$isFocused3 = attrs.isFocused,
      isFocused = _attrs$isFocused3 === undefined ? true : _attrs$isFocused3,
      _attrs$key2 = attrs.key,
      key = _attrs$key2 === undefined ? null : _attrs$key2,
      _attrs$marks3 = attrs.marks,
      marks = _attrs$marks3 === undefined ? null : _attrs$marks3,
      _attrs$offset2 = attrs.offset,
      offset = _attrs$offset2 === undefined ? null : _attrs$offset2,
      _attrs$path2 = attrs.path,
      path = _attrs$path2 === undefined ? null : _attrs$path2;

  this.isFocused = isFocused;
  this.key = key;
  this.marks = marks;
  this.offset = offset;
  this.path = path;
};

var DecorationPoint = function DecorationPoint(attrs) {
  classCallCheck(this, DecorationPoint);
  var _attrs$id = attrs.id,
      id = _attrs$id === undefined ? null : _attrs$id,
      _attrs$data = attrs.data,
      data = _attrs$data === undefined ? {} : _attrs$data,
      type = attrs.type;

  this.id = id;
  this.offset = null;
  this.type = type;
  this.data = data;
};

/**
 * Increment any existing `point` on object by `n`.
 *
 * @param {Any} object
 * @param {Number} n
 */

function incrementPoint(object, n) {
  var __anchor = object.__anchor,
      __focus = object.__focus,
      __decorations = object.__decorations;


  if (__anchor != null) {
    __anchor.offset += n;
  }

  if (__focus != null && __focus !== __anchor) {
    __focus.offset += n;
  }

  if (__decorations != null) {
    __decorations.forEach(function (d) {
      return d.offset += n;
    });
  }
}

/**
 * Check whether an `object` is a point.
 *
 * @param {Any} object
 * @return {Boolean}
 */

function isPoint(object) {
  return object instanceof AnchorPoint || object instanceof CursorPoint || object instanceof DecorationPoint || object instanceof FocusPoint;
}

/**
 * Preserve any point information on an object.
 *
 * @param {Any} object
 * @param {Function} updator
 * @return {Any}
 */

function preservePoint(object, updator) {
  var __anchor = object.__anchor,
      __focus = object.__focus,
      __decorations = object.__decorations;

  var next = updator(object);
  if (__anchor != null) next.__anchor = __anchor;
  if (__focus != null) next.__focus = __focus;
  if (__decorations != null) next.__decorations = __decorations;
  return next;
}

/**
 * Set a `point` on an `object`.
 *
 * @param {Any} object
 * @param {*Point} point
 * @param {Number} offset
 */

function setPoint(object, point, offset) {
  if (point instanceof AnchorPoint || point instanceof CursorPoint) {
    point.offset = offset;
    object.__anchor = point;
  }

  if (point instanceof FocusPoint || point instanceof CursorPoint) {
    point.offset = offset;
    object.__focus = point;
  }

  if (point instanceof DecorationPoint) {
    point.offset = offset;
    object.__decorations = object.__decorations || [];
    object.__decorations = object.__decorations.concat(point);
  }
}

/**
 * Create a Slate hyperscript function with `options`.
 *
 * @param {Object} options
 * @return {Function}
 */

function createHyperscript() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _options$blocks = options.blocks,
      blocks = _options$blocks === undefined ? {} : _options$blocks,
      _options$inlines = options.inlines,
      inlines = _options$inlines === undefined ? {} : _options$inlines,
      _options$marks = options.marks,
      marks = _options$marks === undefined ? {} : _options$marks,
      _options$decorations = options.decorations,
      decorations = _options$decorations === undefined ? {} : _options$decorations;


  var creators = _extends({
    anchor: createAnchor,
    block: createBlock,
    cursor: createCursor,
    decoration: createDecoration,
    document: createDocument,
    focus: createFocus,
    inline: createInline,
    mark: createMark,
    node: createNode,
    selection: createSelection,
    text: createText,
    value: createValue
  }, options.creators || {});

  for (var key in blocks) {
    creators[key] = normalizeCreator(blocks[key], createBlock);
  }

  for (var _key in inlines) {
    creators[_key] = normalizeCreator(inlines[_key], createInline);
  }

  for (var _key2 in marks) {
    creators[_key2] = normalizeCreator(marks[_key2], createMark);
  }

  for (var _key3 in decorations) {
    creators[_key3] = normalizeCreator(decorations[_key3], createDecoration);
  }

  function create(tagName, attributes) {
    for (var _len = arguments.length, children = Array(_len > 2 ? _len - 2 : 0), _key4 = 2; _key4 < _len; _key4++) {
      children[_key4 - 2] = arguments[_key4];
    }

    var creator = creators[tagName];

    if (!creator) {
      throw new Error('No hyperscript creator found for tag: "' + tagName + '"');
    }

    if (attributes == null) {
      attributes = {};
    }

    if (!isPlainObject(attributes)) {
      children = [attributes].concat(children);
      attributes = {};
    }

    children = children.filter(function (child) {
      return Boolean(child);
    }).reduce(function (memo, child) {
      return memo.concat(child);
    }, []);

    var ret = creator(tagName, attributes, children);
    return ret;
  }

  return create;
}

/**
 * Normalize a `creator` of `value`.
 *
 * @param {Function|Object|String} value
 * @param {Function} creator
 * @return {Function}
 */

function normalizeCreator(value, creator) {
  if (typeof value === 'function') {
    return value;
  }

  if (typeof value === 'string') {
    value = { type: value };
  }

  if (isPlainObject(value)) {
    return function (tagName, attributes, children) {
      var key = attributes.key,
          rest = objectWithoutProperties(attributes, ['key']);

      var attrs = _extends({}, value, {
        key: key,
        data: _extends({}, value.data || {}, rest)
      });

      return creator(tagName, attrs, children);
    };
  }

  throw new Error('Slate hyperscript creators can be either functions, objects or strings, but you passed: ' + value);
}

/**
 * Export.
 *
 * @type {Function}
 */

var index = createHyperscript();

exports.default = index;
exports.createHyperscript = createHyperscript;

Object.defineProperty(exports, '__esModule', { value: true });

})));
