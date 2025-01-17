import getWindow from 'get-window';
import invariant from 'tiny-invariant';
import { Value, Node, PathUtils, Editor } from 'slate';
import { IS_IE, IS_EDGE, ANDROID_API_VERSION, IS_IOS, IS_FIREFOX, HAS_INPUT_EVENTS_LEVEL_2, IS_ANDROID, IS_SAFARI } from 'slate-dev-environment';
import Debug from 'debug';
import pick from 'lodash/pick';
import Base64 from 'slate-base64-serializer';
import Plain from 'slate-plain-serializer';
import Hotkeys from 'slate-hotkeys';
import ReactDOM from 'react-dom';
import React from 'react';
import Types from 'prop-types';
import SlateTypes from 'slate-prop-types';
import ImmutableTypes from 'react-immutable-proptypes';
import { Set } from 'immutable';
import warning from 'tiny-warning';
import isBackward from 'selection-is-backward';
import throttle from 'lodash/throttle';
import PlaceholderPlugin from 'slate-react-placeholder';
import memoizeOne from 'memoize-one';

/**
 * Event handlers used by Slate plugins.
 *
 * @type {Array}
 */

var EVENT_HANDLERS = ['onBeforeInput', 'onBlur', 'onClick', 'onContextMenu', 'onCompositionEnd', 'onCompositionStart', 'onCopy', 'onCut', 'onDragEnd', 'onDragEnter', 'onDragExit', 'onDragLeave', 'onDragOver', 'onDragStart', 'onDrop', 'onInput', 'onFocus', 'onKeyDown', 'onKeyUp', 'onMouseDown', 'onMouseUp', 'onPaste', 'onSelect'];

/**
 * Fixes a selection within the DOM when the cursor is in Slate's special
 * zero-width block. Slate handles empty blocks in a special manner and the
 * cursor can end up either before or after the non-breaking space. This
 * causes different behavior in Android and so we make sure the seleciton is
 * always before the zero-width space.
 *
 * @param {Window} window
 */

function fixSelectionInZeroWidthBlock(window) {
  var domSelection = window.getSelection();
  var anchorNode = domSelection.anchorNode;
  var dataset = anchorNode.parentElement.dataset;

  var isZeroWidth = dataset ? dataset.slateZeroWidth === 'n' : false;

  // We are doing three checks to see if we need to move the cursor.
  // Is this a zero-width slate span?
  // Is the current cursor position not at the start of it?
  // Is there more than one character (i.e. the zero-width space char) in here?
  if (isZeroWidth && anchorNode.textContent.length === 1 && domSelection.anchorOffset !== 0) {
    var range = window.document.createRange();
    range.setStart(anchorNode, 0);
    range.setEnd(anchorNode, 0);
    domSelection.removeAllRanges();
    domSelection.addRange(range);
  }
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
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



var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};











var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};





var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();













var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/**
 * Offset key parser regex.
 *
 * @type {RegExp}
 */

var PARSER = /^([\w-]+)(?::(\d+))?$/;

/**
 * Parse an offset key `string`.
 *
 * @param {String} string
 * @return {Object}
 */

function parse(string) {
  var matches = PARSER.exec(string);

  if (!matches) {
    throw new Error("Invalid offset key string \"" + string + "\".");
  }

  var _matches = slicedToArray(matches, 3),
      original = _matches[0],
      key = _matches[1],
      index = _matches[2]; // eslint-disable-line no-unused-vars


  return {
    key: key,
    index: parseInt(index, 10)
  };
}

/**
 * Stringify an offset key `object`.
 *
 * @param {Object} object
 *   @property {String} key
 *   @property {Number} index
 * @return {String}
 */

function stringify(object) {
  return object.key + ":" + object.index;
}

/**
 * Export.
 *
 * @type {Object}
 */

var OffsetKey = {
  parse: parse,
  stringify: stringify
};

/**
 * Constants.
 *
 * @type {String}
 */

var ZERO_WIDTH_ATTRIBUTE = 'data-slate-zero-width';
var ZERO_WIDTH_SELECTOR = '[' + ZERO_WIDTH_ATTRIBUTE + ']';
var OFFSET_KEY_ATTRIBUTE = 'data-offset-key';
var RANGE_SELECTOR = '[' + OFFSET_KEY_ATTRIBUTE + ']';
var TEXT_SELECTOR = '[data-key]';
var VOID_SELECTOR = '[data-slate-void]';

/**
 * Find a Slate point from a DOM selection's `nativeNode` and `nativeOffset`.
 *
 * @param {Element} nativeNode
 * @param {Number} nativeOffset
 * @param {Editor} editor
 * @return {Point}
 */

function findPoint(nativeNode, nativeOffset, editor) {
  invariant(!Value.isValue(editor), 'As of Slate 0.42.0, the `findPoint` utility takes an `editor` instead of a `value`.');

  var _normalizeNodeAndOffs = normalizeNodeAndOffset(nativeNode, nativeOffset),
      nearestNode = _normalizeNodeAndOffs.node,
      nearestOffset = _normalizeNodeAndOffs.offset;

  var window = getWindow(nativeNode);
  var parentNode = nearestNode.parentNode;

  var rangeNode = parentNode.closest(RANGE_SELECTOR);
  var offset = void 0;
  var node = void 0;

  // Calculate how far into the text node the `nearestNode` is, so that we can
  // determine what the offset relative to the text node is.
  if (rangeNode) {
    var range = window.document.createRange();
    var textNode = rangeNode.closest(TEXT_SELECTOR);
    range.setStart(textNode, 0);
    range.setEnd(nearestNode, nearestOffset);
    node = textNode;

    // COMPAT: Edge has a bug where Range.prototype.toString() will convert \n
    // into \r\n. The bug causes a loop when slate-react attempts to reposition
    // its cursor to match the native position. Use textContent.length instead.
    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/10291116/
    offset = range.cloneContents().textContent.length;
  } else {
    // For void nodes, the element with the offset key will be a cousin, not an
    // ancestor, so find it by going down from the nearest void parent.
    var voidNode = parentNode.closest(VOID_SELECTOR);
    if (!voidNode) return null;
    rangeNode = voidNode.querySelector(RANGE_SELECTOR);
    if (!rangeNode) return null;
    node = rangeNode;
    offset = node.textContent.length;
  }

  // COMPAT: If the parent node is a Slate zero-width space, this is because the
  // text node should have no characters. However, during IME composition the
  // ASCII characters will be prepended to the zero-width space, so subtract 1
  // from the offset to account for the zero-width space character.
  if (offset === node.textContent.length && parentNode.hasAttribute(ZERO_WIDTH_ATTRIBUTE)) {
    offset--;
  }

  // Get the string value of the offset key attribute.
  var offsetKey = rangeNode.getAttribute(OFFSET_KEY_ATTRIBUTE);
  if (!offsetKey) return null;

  var _OffsetKey$parse = OffsetKey.parse(offsetKey),
      key = _OffsetKey$parse.key;

  // COMPAT: If someone is clicking from one Slate editor into another, the
  // select event fires twice, once for the old editor's `element` first, and
  // then afterwards for the correct `element`. (2017/03/03)


  var value = editor.value;

  if (!value.document.hasDescendant(key)) return null;

  var point = value.document.createPoint({ key: key, offset: offset });
  return point;
}

/**
 * From a DOM selection's `node` and `offset`, normalize so that it always
 * refers to a text node.
 *
 * @param {Element} node
 * @param {Number} offset
 * @return {Object}
 */

function normalizeNodeAndOffset(node, offset) {
  // If it's an element node, its offset refers to the index of its children
  // including comment nodes, so try to find the right text child node.
  if (node.nodeType === 1 && node.childNodes.length) {
    var isLast = offset === node.childNodes.length;
    var direction = isLast ? 'backward' : 'forward';
    var index = isLast ? offset - 1 : offset;
    node = getEditableChild(node, index, direction);

    // If the node has children, traverse until we have a leaf node. Leaf nodes
    // can be either text nodes, or other void DOM nodes.
    while (node.nodeType === 1 && node.childNodes.length) {
      var i = isLast ? node.childNodes.length - 1 : 0;
      node = getEditableChild(node, i, direction);
    }

    // Determine the new offset inside the text node.
    offset = isLast ? node.textContent.length : 0;
  }

  // Return the node and offset.
  return { node: node, offset: offset };
}

/**
 * Get the nearest editable child at `index` in a `parent`, preferring
 * `direction`.
 *
 * @param {Element} parent
 * @param {Number} index
 * @param {String} direction ('forward' or 'backward')
 * @return {Element|Null}
 */

function getEditableChild(parent, index, direction) {
  var childNodes = parent.childNodes;

  var child = childNodes[index];
  var i = index;
  var triedForward = false;
  var triedBackward = false;

  // While the child is a comment node, or an element node with no children,
  // keep iterating to find a sibling non-void, non-comment node.
  while (child.nodeType === 8 || child.nodeType === 1 && child.childNodes.length === 0 || child.nodeType === 1 && child.getAttribute('contenteditable') === 'false') {
    if (triedForward && triedBackward) break;

    if (i >= childNodes.length) {
      triedForward = true;
      i = index - 1;
      direction = 'backward';
      continue;
    }

    if (i < 0) {
      triedBackward = true;
      i = index + 1;
      direction = 'forward';
      continue;
    }

    child = childNodes[i];
    if (direction === 'forward') i++;
    if (direction === 'backward') i--;
  }

  return child || null;
}

/**
 * Find the DOM node for a `key`.
 *
 * @param {String|Node} key
 * @param {Window} win (optional)
 * @return {Element}
 */

function findDOMNode(key) {
  var win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;

  if (Node.isNode(key)) {
    key = key.key;
  }

  var el = win.document.querySelector('[data-key="' + key + '"]');

  if (!el) {
    throw new Error('Unable to find a DOM node for "' + key + '". This is often because of forgetting to add `props.attributes` to a custom component.');
  }

  return el;
}

/**
 * Find a native DOM selection point from a Slate `point`.
 *
 * @param {Point} point
 * @param {Window} win (optional)
 * @return {Object|Null}
 */

function findDOMPoint(point) {
  var win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;

  var el = findDOMNode(point.key, win);
  var start = 0;

  // For each leaf, we need to isolate its content, which means filtering to its
  // direct text and zero-width spans. (We have to filter out any other siblings
  // that may have been rendered alongside them.)
  var texts = Array.from(el.querySelectorAll('[data-slate-content], [data-slate-zero-width]'));

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = texts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var text = _step.value;

      var node = text.childNodes[0];
      var domLength = node.textContent.length;
      var slateLength = domLength;

      if (text.hasAttribute('data-slate-length')) {
        slateLength = parseInt(text.getAttribute('data-slate-length'), 10);
      }

      var end = start + slateLength;

      if (point.offset <= end) {
        var offset = Math.min(domLength, Math.max(0, point.offset - start));
        return { node: node, offset: offset };
      }

      start = end;
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

  return null;
}

/**
 * Find a Slate range from a DOM `native` selection.
 *
 * @param {Selection} native
 * @param {Editor} editor
 * @return {Range}
 */

function findRange(native, editor) {
  invariant(!Value.isValue(editor), 'As of Slate 0.42.0, the `findNode` utility takes an `editor` instead of a `value`.');

  var el = native.anchorNode || native.startContainer;
  if (!el) return null;

  var window = getWindow(el);

  // If the `native` object is a DOM `Range` or `StaticRange` object, change it
  // into something that looks like a DOM `Selection` instead.
  if (native instanceof window.Range || window.StaticRange && native instanceof window.StaticRange) {
    native = {
      anchorNode: native.startContainer,
      anchorOffset: native.startOffset,
      focusNode: native.endContainer,
      focusOffset: native.endOffset
    };
  }

  var _native = native,
      anchorNode = _native.anchorNode,
      anchorOffset = _native.anchorOffset,
      focusNode = _native.focusNode,
      focusOffset = _native.focusOffset,
      isCollapsed = _native.isCollapsed;
  var value = editor.value;

  var anchor = findPoint(anchorNode, anchorOffset, editor);
  var focus = isCollapsed ? anchor : findPoint(focusNode, focusOffset, editor);
  if (!anchor || !focus) return null;

  // COMPAT: ??? The Edge browser seems to have a case where if you select the
  // last word of a span, it sets the endContainer to the containing span.
  // `selection-is-backward` doesn't handle this case.
  if (IS_IE || IS_EDGE) {
    var domAnchor = findDOMPoint(anchor);
    var domFocus = findDOMPoint(focus);

    native = {
      anchorNode: domAnchor.node,
      anchorOffset: domAnchor.offset,
      focusNode: domFocus.node,
      focusOffset: domFocus.offset
    };
  }

  var document = value.document;

  var range = document.createRange({
    anchor: anchor,
    focus: focus
  });

  return range;
}

function getSelectionFromDOM(window, editor, domSelection) {
  var value = editor.value;
  var document = value.document;

  // If there are no ranges, the editor was blurred natively.

  if (!domSelection.rangeCount) {
    editor.blur();
    return;
  }

  // Otherwise, determine the Slate selection from the native one.
  var range = findRange(domSelection, editor);

  if (!range) {
    return;
  }

  var _range = range,
      anchor = _range.anchor,
      focus = _range.focus;

  var anchorText = document.getNode(anchor.key);
  var focusText = document.getNode(focus.key);
  var anchorInline = document.getClosestInline(anchor.key);
  var focusInline = document.getClosestInline(focus.key);
  var focusBlock = document.getClosestBlock(focus.key);
  var anchorBlock = document.getClosestBlock(anchor.key);

  // COMPAT: If the anchor point is at the start of a non-void, and the
  // focus point is inside a void node with an offset that isn't `0`, set
  // the focus offset to `0`. This is due to void nodes <span>'s being
  // positioned off screen, resulting in the offset always being greater
  // than `0`. Since we can't know what it really should be, and since an
  // offset of `0` is less destructive because it creates a hanging
  // selection, go with `0`. (2017/09/07)
  if (anchorBlock && !editor.isVoid(anchorBlock) && anchor.offset === 0 && focusBlock && editor.isVoid(focusBlock) && focus.offset !== 0) {
    range = range.setFocus(focus.setOffset(0));
  }

  // COMPAT: If the selection is at the end of a non-void inline node, and
  // there is a node after it, put it in the node after instead. This
  // standardizes the behavior, since it's indistinguishable to the user.
  if (anchorInline && !editor.isVoid(anchorInline) && anchor.offset === anchorText.text.length) {
    var block = document.getClosestBlock(anchor.key);
    var nextText = block.getNextText(anchor.key);
    if (nextText) range = range.moveAnchorTo(nextText.key, 0);
  }

  if (focusInline && !editor.isVoid(focusInline) && focus.offset === focusText.text.length) {
    var _block = document.getClosestBlock(focus.key);
    var _nextText = _block.getNextText(focus.key);
    if (_nextText) range = range.moveFocusTo(_nextText.key, 0);
  }

  var selection = document.createSelection(range);
  selection = selection.setIsFocused(true);

  // Preserve active marks from the current selection.
  // They will be cleared by `editor.select` if the selection actually moved.
  selection = selection.set('marks', value.selection.marks);

  return selection;
}

/**
 * Looks at the DOM and generates the equivalent Slate Selection.
 *
 * @param {Window} window
 * @param {Editor} editor
 * @param {Selection} domSelection - The DOM's selection Object
 */

function setSelectionFromDOM(window, editor, domSelection) {
  var selection = getSelectionFromDOM(window, editor, domSelection);
  editor.select(selection);
}

/**
 * setTextFromDomNode lets us take a domNode and reconcile the text in the
 * editor's Document such that it reflects the text in the DOM. This is the
 * opposite of what the Editor usually does which takes the Editor's Document
 * and React modifies the DOM to match. The purpose of this method is for
 * composition changes where we don't know what changes the user made by
 * looking at events. Instead we wait until the DOM is in a safe state, we
 * read from it, and update the Editor's Document.
 *
 * @param {Window} window
 * @param {Editor} editor
 * @param {Node} domNode
 */

function setTextFromDomNode(window, editor, domNode) {
  var point = findPoint(domNode, 0, editor);
  if (!point) return;

  // Get the text node and leaf in question.
  var value = editor.value;
  var document = value.document,
      selection = value.selection;

  var node = document.getDescendant(point.key);
  var block = document.getClosestBlock(node.key);
  var leaves = node.getLeaves();
  var lastText = block.getLastText();
  var lastLeaf = leaves.last();
  var start = 0;
  var end = 0;

  var leaf = leaves.find(function (r) {
    start = end;
    end += r.text.length;
    if (end > point.offset) return true;
  }) || lastLeaf;

  // Get the text information.
  var text = leaf.text;
  var textContent = domNode.textContent;

  var isLastText = node === lastText;
  var isLastLeaf = leaf === lastLeaf;
  var lastChar = textContent.charAt(textContent.length - 1);

  // COMPAT: If this is the last leaf, and the DOM text ends in a new line,
  // we will have added another new line in <Leaf>'s render method to account
  // for browsers collapsing a single trailing new lines, so remove it.
  if (isLastText && isLastLeaf && lastChar === '\n') {
    textContent = textContent.slice(0, -1);
  }

  // If the text is no different, abort.
  if (textContent === text) return;

  // Determine what the selection should be after changing the text.
  // const delta = textContent.length - text.length
  // const corrected = selection.moveToEnd().moveForward(delta)
  var entire = selection.moveAnchorTo(point.key, start).moveFocusTo(point.key, end);

  entire = document.resolveRange(entire);

  // Change the current value to have the leaf's text replaced.
  editor.insertTextAtRange(entire, textContent, leaf.marks);
}

/**
 * In Android API 26 and 27 we can tell if the input key was pressed by
 * waiting for the `beforeInput` event and seeing that the last character
 * of its `data` property is char code `10`.
 *
 * Note that at this point it is too late to prevent the event from affecting
 * the DOM so we use other methods to clean the DOM up after we have detected
 * the input.
 *
 * @param  {String} data
 * @return {Boolean}
 */

function isInputDataEnter(data) {
  if (data == null) return false;
  var lastChar = data[data.length - 1];
  var charCode = lastChar.charCodeAt(0);
  return charCode === 10;
}

/**
 * In Android sometimes the only way to tell what the user is trying to do
 * is to look at an event's `data` property and see if the last characters
 * matches a character. This method helps us make that determination.
 *
 * @param {String} data
 * @param {[String]} chars
 * @return {Boolean}
 */

function isInputDataLastChar(data, chars) {
  if (!Array.isArray(chars)) throw new Error("chars must be an array of one character strings");
  if (data == null) return false;
  var lastChar = data[data.length - 1];
  return chars.includes(lastChar);
}

/**
 * Is the given node a text node?
 *
 * @param {node} node
 * @param {Window} window
 * @return {Boolean}
 */

function isTextNode(node, window) {
  return node.nodeType === window.Node.TEXT_NODE;
}

/**
 * Takes a node and returns a snapshot of the node.
 *
 * @param {node} node
 * @param {Window} window
 * @return {object} element snapshot
 */

function getElementSnapshot(node, window) {
  var snapshot = {};
  snapshot.node = node;

  if (isTextNode(node, window)) {
    snapshot.text = node.textContent;
  }

  snapshot.children = Array.from(node.childNodes).map(function (childNode) {
    return getElementSnapshot(childNode, window);
  });
  return snapshot;
}

/**
 * Takes an array of elements and returns a snapshot
 *
 * @param {elements[]} elements
 * @param {Window} window
 * @return {object} snapshot
 */

function getSnapshot(elements, window) {
  if (!elements.length) throw new Error('elements must be an Array');

  var lastElement = elements[elements.length - 1];
  var snapshot = {
    elements: elements.map(function (element) {
      return getElementSnapshot(element, window);
    }),
    parent: lastElement.parentElement,
    next: lastElement.nextElementSibling
  };
  return snapshot;
}

/**
 * Takes an element snapshot and applies it to the element in the DOM.
 * Basically, it fixes the DOM to the point in time that the snapshot was
 * taken. This will put the DOM back in sync with React.
 *
 * @param {Object} snapshot
 * @param {Window} window
 */

function applyElementSnapshot(snapshot, window) {
  var el = snapshot.node;

  if (isTextNode(el, window)) {
    // Update text if it is different
    if (el.textContent !== snapshot.text) {
      el.textContent = snapshot.text;
    }
  }

  snapshot.children.forEach(function (childSnapshot) {
    applyElementSnapshot(childSnapshot, window);
    el.appendChild(childSnapshot.node);
  });

  // remove children that shouldn't be there
  var snapLength = snapshot.children.length;

  while (el.childNodes.length > snapLength) {
    el.removeChild(el.childNodes[0]);
  }

  // remove any clones from the DOM. This can happen when a block is split.
  var dataset = el.dataset;

  if (!dataset) return; // if there's no dataset, don't remove it
  var key = dataset.key;
  if (!key) return; // if there's no `data-key`, don't remove it
  var dups = new window.Set(Array.from(window.document.querySelectorAll('[data-key=\'' + key + '\']')));
  dups.delete(el);
  dups.forEach(function (dup) {
    return dup.parentElement.removeChild(dup);
  });
}

/**
 * Takes a snapshot and applies it to the DOM. Rearranges both the contents
 * of the elements in the snapshot as well as putting the elements back into
 * position relative to each other and also makes sure the last element is
 * before the same element as it was when the snapshot was taken.
 *
 * @param {snapshot} snapshot
 * @param {Window} window
 */

function applySnapshot(snapshot, window) {
  var elements = snapshot.elements,
      next = snapshot.next,
      parent = snapshot.parent;

  elements.forEach(function (element) {
    return applyElementSnapshot(element, window);
  });
  var lastElement = elements[elements.length - 1].node;

  if (snapshot.next) {
    parent.insertBefore(lastElement, next);
  } else {
    parent.appendChild(lastElement);
  }

  var prevElement = lastElement;

  for (var i = elements.length - 2; i >= 0; i--) {
    var element = elements[i].node;
    parent.insertBefore(element, prevElement);
    prevElement = element;
  }
}

/**
 * A snapshot of one or more elements.
 */

var ElementSnapshot = function () {
  /**
   * constructor
   * @param {elements[]} elements - array of element to snapshot. Must be in order.
   * @param {object} data - any arbitrary data you want to store with the snapshot
   */

  function ElementSnapshot(elements, data) {
    classCallCheck(this, ElementSnapshot);

    this.window = getWindow(elements[0]);
    this.snapshot = getSnapshot(elements, this.window);
    this.data = data;
  }

  /**
   * apply the current snapshot to the DOM.
   */

  createClass(ElementSnapshot, [{
    key: 'apply',
    value: function apply() {
      applySnapshot(this.snapshot, this.window);
    }

    /**
     * get the data you passed into the constructor.
     *
     * @return {object} data
     */

  }, {
    key: 'getData',
    value: function getData() {
      return this.data;
    }
  }]);
  return ElementSnapshot;
}();

/**
 * Returns the closest element that matches the selector.
 * Unlike the native `Element.closest` method, this doesn't require the
 * starting node to be an Element.
 *
 * @param  {Node} node to start at
 * @param  {String} css selector to match
 * @return {Element} the closest matching element
 */

function closest(node, selector) {
  var win = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : window;

  if (node.nodeType === win.Node.TEXT_NODE) {
    node = node.parentNode;
  }
  return node.closest(selector);
}

/**
 * A DomSnapshot remembers the state of elements at a given point in time
 * and also remembers the state of the Editor at that time as well.
 * The state can be applied to the DOM at a time in the future.
 */

var DomSnapshot = function () {
  /**
   * Constructor.
   *
   * @param {Window} window
   * @param {Editor} editor
   * @param {Boolean} options.before - should we remember the element before the one passed in
   */

  function DomSnapshot(window, editor) {
    var _ref = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {},
        _ref$before = _ref.before,
        before = _ref$before === undefined ? false : _ref$before;

    classCallCheck(this, DomSnapshot);

    var domSelection = window.getSelection();
    var anchorNode = domSelection.anchorNode;

    var subrootEl = closest(anchorNode, '[data-slate-editor] > *');
    var elements = [subrootEl];

    // The before option is for when we need to take a snapshot of the current
    // subroot and the element before when the user hits the backspace key.
    if (before) {
      var previousElementSibling = subrootEl.previousElementSibling;


      if (previousElementSibling) {
        elements.unshift(previousElementSibling);
      }
    }

    this.snapshot = new ElementSnapshot(elements);
    this.selection = getSelectionFromDOM(window, editor, domSelection);
  }

  /**
   * Apply the snapshot to the DOM and set the selection in the Editor.
   *
   * @param {Editor} editor
   */

  createClass(DomSnapshot, [{
    key: 'apply',
    value: function apply(editor) {
      var snapshot = this.snapshot,
          selection = this.selection;

      snapshot.apply();
      editor.moveTo(selection.anchor.key, selection.anchor.offset);
    }
  }]);
  return DomSnapshot;
}();

/**
 * A function that does nothing
 * @return {Function}
 */

function noop() {}

/**
 * Creates an executor like a `resolver` or a `deleter` that handles
 * delayed execution of a method using a `requestAnimationFrame` or `setTimeout`.
 *
 * Unlike a `requestAnimationFrame`, after a method is cancelled, it can be
 * resumed. You can also optionally add a `timeout` after which time the
 * executor is automatically cancelled.
 */

var Executor =
/**
 * Executor
 * @param {window} window
 * @param {Function} fn - the function to execute when done
 * @param {Object} options
 */

function Executor(window, fn) {
  var _this = this;

  var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
  classCallCheck(this, Executor);

  this.__call__ = function () {
    // I don't clear the timeout since it will be noop'ed anyways. Less code.
    _this.fn();
    _this.preventFurtherCalls(); // Ensure you can only call the function once
  };

  this.preventFurtherCalls = function () {
    _this.fn = noop;
  };

  this.resume = function (ms) {
    // in case resume is called more than once, we don't want old timers
    // from executing because the `timeoutId` or `callbackId` is overwritten.
    _this.cancel();

    if (ms) {
      _this.mode = 'timeout';
      _this.timeoutId = _this.window.setTimeout(_this.__call__, ms);
    } else {
      _this.mode = 'animationFrame';
      _this.callbackId = _this.window.requestAnimationFrame(_this.__call__);
    }
  };

  this.cancel = function () {
    if (_this.mode === 'timeout') {
      _this.window.clearTimeout(_this.timeoutId);
    } else {
      _this.window.cancelAnimationFrame(_this.callbackId);
    }

    if (_this.onCancel) _this.onCancel();
  };

  this.__setTimeout__ = function (timeout) {
    if (timeout == null) return;

    _this.window.setTimeout(function () {
      _this.cancel();
      _this.preventFurtherCalls();
    }, timeout);
  };

  this.fn = fn;
  this.window = window;
  this.resume();
  this.onCancel = options.onCancel;
  this.__setTimeout__(options.timeout);
};

var debug = Debug('slate:android');
debug.reconcile = Debug('slate:reconcile');

debug('ANDROID_API_VERSION', { ANDROID_API_VERSION: ANDROID_API_VERSION });

/**
 * Define variables related to composition state.
 */

var NONE = 0;
var COMPOSING = 1;

function AndroidPlugin() {
  /**
   * The current state of composition.
   *
   * @type {NONE|COMPOSING|WAITING}
   */

  var status = NONE;

  /**
   * The set of nodes that we need to process when we next reconcile.
   * Usually this is soon after the `onCompositionEnd` event.
   *
   * @type {Set} set containing Node objects
   */

  var nodes = new window.Set();

  /**
   * Keep a snapshot after a composition end for API 26/27. If a `beforeInput`
   * gets called with data that ends in an ENTER then we need to use this
   * snapshot to revert the DOM so that React doesn't get out of sync with the
   * DOM. We also need to cancel the `reconcile` operation as it interferes in
   * certain scenarios like hitting 'enter' at the end of a word.
   *
   * @type {DomSnapshot} [compositionEndSnapshot]
   
   */

  var compositionEndSnapshot = null;

  /**
   * When there is a `compositionEnd` we ened to reconcile Slate's Document
   * with the DOM. The `reconciler` is an instance of `Executor` that does
   * this for us. It is created on every `compositionEnd` and executes on the
   * next `requestAnimationFrame`. The `Executor` can be cancelled and resumed
   * which some methods do.
   *
   * @type {Executor}
   */

  var reconciler = null;

  /**
   * A snapshot that gets taken when there is a `keydown` event in API26/27.
   * If an `input` gets called with `inputType` of `deleteContentBackward`
   * we need to undo the delete that Android does to keep React in sync with
   * the DOM.
   *
   * @type {DomSnapshot}
   */

  var keyDownSnapshot = null;

  /**
   * The deleter is an instace of `Executor` that will execute a delete
   * operation on the next `requestAnimationFrame`. It has to wait because
   * we need Android to finish all of its DOM operations to do with deletion
   * before we revert them to a Snapshot. After reverting, we then execute
   * Slate's version of delete.
   *
   * @type {Executor}
   */

  var deleter = null;

  /**
   * Because Slate implements its own event handler for `beforeInput` in
   * addition to React's version, we actually get two. If we cancel the
   * first native version, the React one will still fire. We set this to
   * `true` if we don't want that to happen. Remember that when we prevent it,
   * we need to tell React to `preventDefault` so the event doesn't continue
   * through React's event system.
   *
   * type {Boolean}
   */

  var preventNextBeforeInput = false;

  /**
   * When a composition ends, in some API versions we may need to know what we
   * have learned so far about the composition and what we want to do because of
   * some actions that may come later.
   *
   * For example in API 26/27, if we get a `beforeInput` that tells us that the
   * input was a `.`, then we want the reconcile to happen even if there are
   * `onInput:delete` events that follow. In this case, we would set
   * `compositionEndAction` to `period`. During the `onInput` we would check if
   * the `compositionEndAction` says `period` and if so we would not start the
   * `delete` action.
   *
   * @type {(String|null)}
   */

  var compositionEndAction = null;

  /**
   * Looks at the `nodes` we have collected, usually the things we have edited
   * during the course of a composition, and then updates Slate's internal
   * Document based on the text values in these DOM nodes and also updates
   * Slate's Selection based on the current cursor position in the Editor.
   *
   * @param {Window} window
   * @param {Editor} editor
   * @param {String} options.from - where reconcile was called from for debug
   */

  function reconcile(window, editor, _ref) {
    var from = _ref.from;

    debug.reconcile({ from: from });
    var domSelection = window.getSelection();

    nodes.forEach(function (node) {
      setTextFromDomNode(window, editor, node);
    });

    setSelectionFromDOM(window, editor, domSelection);
    nodes.clear();
  }

  /**
   * On before input.
   *
   * Check `components/content` because some versions of Android attach a
   * native `beforeinput` event on the Editor. In this case, you might need
   * to distinguish whether the event coming through is the native or React
   * version of the event. Also, if you cancel the native version that does
   * not necessarily mean that the React version is cancelled.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onBeforeInput(event, editor, next) {
    var isNative = !event.nativeEvent;

    debug('onBeforeInput', {
      isNative: isNative,
      event: event,
      status: status,
      e: pick(event, ['data', 'inputType', 'isComposing', 'nativeEvent'])
    });

    var window = getWindow(event.target);

    if (preventNextBeforeInput) {
      event.preventDefault();
      preventNextBeforeInput = false;
      return;
    }

    switch (ANDROID_API_VERSION) {
      case 25:
        // prevent onBeforeInput to allow selecting an alternate suggest to
        // work.
        break;
      case 26:
      case 27:
        if (deleter) {
          deleter.cancel();
          reconciler.resume();
        }

        // This analyses Android's native `beforeInput` which Slate adds
        // on in the `Content` component. It only fires if the cursor is at
        // the end of a block. Otherwise, the code below checks.
        if (isNative) {
          if (event.inputType === 'insertParagraph' || event.inputType === 'insertLineBreak') {
            debug('onBeforeInput:enter:native', {});
            var domSelection = window.getSelection();
            var selection = getSelectionFromDOM(window, editor, domSelection);
            preventNextBeforeInput = true;
            event.preventDefault();
            editor.moveTo(selection.anchor.key, selection.anchor.offset);
            editor.splitBlock();
          }
        } else {
          if (isInputDataLastChar(event.data, ['.'])) {
            debug('onBeforeInput:period');
            reconciler.cancel();
            compositionEndAction = 'period';
            return;
          }

          // This looks at the beforeInput event's data property and sees if it
          // ends in a linefeed which is character code 10. This appears to be
          // the only way to detect that enter has been pressed except at end
          // of line where it doesn't work.
          var isEnter = isInputDataEnter(event.data);

          if (isEnter) {
            if (reconciler) reconciler.cancel();

            window.requestAnimationFrame(function () {
              debug('onBeforeInput:enter:react', {});
              compositionEndSnapshot.apply(editor);
              editor.splitBlock();
            });
          }
        }

        break;
      case 28:
        // If a `beforeInput` event fires after an `input:deleteContentBackward`
        // event, it appears to be a good indicator that it is some sort of
        // special combined Android event. If this is the case, then we don't
        // want to have a deletion to happen, we just want to wait until Android
        // has done its thing and then at the end we just want to reconcile.
        if (deleter) {
          deleter.cancel();
          reconciler.resume();
        }

        break;
      default:
        if (status !== COMPOSING) next();
    }
  }

  /**
   * On Composition end. By default, when a `compositionEnd` event happens,
   * we start a reconciler. The reconciler will update Slate's Document using
   * the DOM as the source of truth. In some cases, the reconciler needs to
   * be cancelled and can also be resumed. For example, when a delete
   * immediately followed a `compositionEnd`, we don't want to reconcile.
   * Instead, we want the `delete` to take precedence.
   *
   * @param  {Event} event
   * @param  {Editor} editor
   * @param  {Function} next
   */

  function onCompositionEnd(event, editor, next) {
    debug('onCompositionEnd', { event: event });
    var window = getWindow(event.target);
    var domSelection = window.getSelection();
    var anchorNode = domSelection.anchorNode;


    switch (ANDROID_API_VERSION) {
      case 26:
      case 27:
        compositionEndSnapshot = new DomSnapshot(window, editor);
        // fixes a bug in Android API 26 & 27 where a `compositionEnd` is triggered
        // without the corresponding `compositionStart` event when clicking a
        // suggestion.
        //
        // If we don't add this, the `onBeforeInput` is triggered and passes
        // through to the `before` plugin.
        status = COMPOSING;
        break;
    }

    compositionEndAction = 'reconcile';
    nodes.add(anchorNode);

    reconciler = new Executor(window, function () {
      status = NONE;
      reconcile(window, editor, { from: 'onCompositionEnd:reconciler' });
      compositionEndAction = null;
    });
  }

  /**
   * On composition start.
   *
   * @param  {Event} event
   * @param  {Editor} editor
   * @param  {Function} next
   */

  function onCompositionStart(event, editor, next) {
    debug('onCompositionStart', { event: event });
    status = COMPOSING;
    nodes.clear();
  }

  /**
   * On composition update.
   *
   * @param  {Event} event
   * @param  {Editor} editor
   * @param  {Function} next
   */

  function onCompositionUpdate(event, editor, next) {
    debug('onCompositionUpdate', { event: event });
  }

  /**
   * On input.
   *
   * @param  {Event} event
   * @param  {Editor} editor
   * @param  {Function} next
   */

  function onInput(event, editor, next) {
    debug('onInput', {
      event: event,
      status: status,
      e: pick(event, ['data', 'nativeEvent', 'inputType', 'isComposing'])
    });

    switch (ANDROID_API_VERSION) {
      case 24:
      case 25:
        break;
      case 26:
      case 27:
      case 28:
        var nativeEvent = event.nativeEvent;


        if (ANDROID_API_VERSION === 28) {
          // NOTE API 28:
          // When a user hits space and then backspace in `middle` we end up
          // with `midle`.
          //
          // This is because when the user hits space, the composition is not
          // ended because `compositionEnd` is not called yet. When backspace is
          // hit, the `compositionEnd` is called. We need to revert the DOM but
          // the reconciler has not had a chance to run from the
          // `compositionEnd` because it is set to run on the next
          // `requestAnimationFrame`. When the backspace is carried out on the
          // Slate Value, Slate doesn't know about the space yet so the
          // backspace is carried out without the space cuasing us to lose a
          // character.
          //
          // This fix forces Android to reconcile immediately after hitting
          // the space.
          //
          // NOTE API 27:
          // It is confirmed that this bug does not present itself on API27.
          // A space fires a `compositionEnd` (as well as other events including
          // an input that is a delete) so the reconciliation happens.
          //
          if (nativeEvent.inputType === 'insertText' && nativeEvent.data === ' ') {
            if (reconciler) reconciler.cancel();
            if (deleter) deleter.cancel();
            reconcile(window, editor, { from: 'onInput:space' });
            return;
          }
        }

        if (ANDROID_API_VERSION === 26 || ANDROID_API_VERSION === 27) {
          if (compositionEndAction === 'period') {
            debug('onInput:period:abort');
            // This means that there was a `beforeInput` that indicated the
            // period was pressed. When a period is pressed, you get a bunch
            // of delete actions mixed in. We want to ignore those. At this
            // point, we add the current node to the list of things we need to
            // resolve at the next compositionEnd. We know that a new
            // composition will start right after this event so it is safe to
            // do this.

            var _window$getSelection = window.getSelection(),
                anchorNode = _window$getSelection.anchorNode;

            nodes.add(anchorNode);
            return;
          }
        }

        if (nativeEvent.inputType === 'deleteContentBackward') {
          debug('onInput:delete', { keyDownSnapshot: keyDownSnapshot });
          var _window = getWindow(event.target);
          if (reconciler) reconciler.cancel();
          if (deleter) deleter.cancel();

          deleter = new Executor(_window, function () {
            debug('onInput:delete:callback', { keyDownSnapshot: keyDownSnapshot });
            keyDownSnapshot.apply(editor);
            editor.deleteBackward();
            deleter = null;
          }, {
            onCancel: function onCancel() {
              deleter = null;
            }
          });
          return;
        }

        if (status === COMPOSING) {
          var _window$getSelection2 = window.getSelection(),
              _anchorNode = _window$getSelection2.anchorNode;

          nodes.add(_anchorNode);
          return;
        }

        // Some keys like '.' are input without compositions. This happens
        // in API28. It might be happening in API 27 as well. Check by typing
        // `It me. No.` On a blank line.
        if (ANDROID_API_VERSION === 28) {
          debug('onInput:fallback');

          var _window$getSelection3 = window.getSelection(),
              _anchorNode2 = _window$getSelection3.anchorNode;

          nodes.add(_anchorNode2);

          window.requestAnimationFrame(function () {
            debug('onInput:fallback:callback');
            reconcile(window, editor, { from: 'onInput:fallback' });
          });
          return;
        }

        break;
      default:
        if (status === COMPOSING) return;
        next();
    }
  }

  /**
   * On key down.
   *
   * @param  {Event} event
   * @param  {Editor} editor
   * @param  {Function} next
   */

  function onKeyDown(event, editor, next) {
    debug('onKeyDown', {
      event: event,
      status: status,
      e: pick(event, ['char', 'charCode', 'code', 'key', 'keyCode', 'keyIdentifier', 'keyLocation', 'location', 'nativeEvent', 'which'])
    });

    var window = getWindow(event.target);

    switch (ANDROID_API_VERSION) {
      // 1. We want to allow enter keydown to allows go through
      // 2. We want to deny keydown, I think, when it fires before the composition
      //    or something. Need to remember what it was.

      case 25:
        // in API25 prevent other keys to fix clicking a word and then
        // selecting an alternate suggestion.
        //
        // NOTE:
        // The `setSelectionFromDom` is to allow hitting `Enter` to work
        // because the selection needs to be in the right place; however,
        // for now we've removed the cancelling of `onSelect` and everything
        // appears to be working. Not sure why we removed `onSelect` though
        // in API25.
        if (event.key === 'Enter') {
          // const window = getWindow(event.target)
          // const selection = window.getSelection()
          // setSelectionFromDom(window, editor, selection)
          next();
        }

        break;
      case 26:
      case 27:
        if (event.key === 'Enter') {
          debug('onKeyDown:enter', {});

          if (deleter) {
            // If a `deleter` exists which means there was an onInput with
            // `deleteContentBackward` that hasn't fired yet, then we know
            // this is one of the cases where we have to revert to before
            // the split.
            deleter.cancel();
            event.preventDefault();

            window.requestAnimationFrame(function () {
              debug('onKeyDown:enter:callback');
              compositionEndSnapshot.apply(editor);
              editor.splitBlock();
            });
          } else {
            event.preventDefault();
            // If there is no deleter, all we have to do is prevent the
            // action before applying or splitBlock. In this scenario, we
            // have to grab the selection from the DOM.
            var domSelection = window.getSelection();
            var selection = getSelectionFromDOM(window, editor, domSelection);
            editor.moveTo(selection.anchor.key, selection.anchor.offset);
            editor.splitBlock();
          }
          return;
        }

        // We need to take a snapshot of the current selection and the
        // element before when the user hits the backspace key. This is because
        // we only know if the user hit backspace if the `onInput` event that
        // follows has an `inputType` of `deleteContentBackward`. At that time
        // it's too late to stop the event.
        keyDownSnapshot = new DomSnapshot(window, editor, {
          before: true
        });

        // If we let 'Enter' through it breaks handling of hitting
        // enter at the beginning of a word so we need to stop it.
        break;
      case 28:
        {
          if (event.key === 'Enter') {
            debug('onKeyDown:enter');
            event.preventDefault();
            if (reconciler) reconciler.cancel();
            if (deleter) deleter.cancel();

            window.requestAnimationFrame(function () {
              reconcile(window, editor, { from: 'onKeyDown:enter' });
              editor.splitBlock();
            });
            return;
          }

          // We need to take a snapshot of the current selection and the
          // element before when the user hits the backspace key. This is because
          // we only know if the user hit backspace if the `onInput` event that
          // follows has an `inputType` of `deleteContentBackward`. At that time
          // it's too late to stop the event.
          keyDownSnapshot = new DomSnapshot(window, editor, {
            before: true
          });

          debug('onKeyDown:snapshot', { keyDownSnapshot: keyDownSnapshot });
        }

        // If we let 'Enter' through it breaks handling of hitting
        // enter at the beginning of a word so we need to stop it.
        break;

      default:
        if (status !== COMPOSING) {
          next();
        }
    }
  }

  /**
   * On select.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onSelect(event, editor, next) {
    debug('onSelect', { event: event, status: status });

    switch (ANDROID_API_VERSION) {
      // We don't want to have the selection move around in an onSelect because
      // it happens after we press `enter` in the same transaction. This
      // causes the cursor position to not be properly placed.
      case 26:
      case 27:
      case 28:
        var _window2 = getWindow(event.target);
        fixSelectionInZeroWidthBlock(_window2);
        break;
      default:
        break;
    }
  }

  /**
   * Return the plugin.
   *
   * @type {Object}
   */

  return {
    onBeforeInput: onBeforeInput,
    onCompositionEnd: onCompositionEnd,
    onCompositionStart: onCompositionStart,
    onCompositionUpdate: onCompositionUpdate,
    onInput: onInput,
    onKeyDown: onKeyDown,
    onSelect: onSelect
  };
}

/**
 * The transfer types that Slate recognizes.
 *
 * @type {Object}
 */

var TRANSFER_TYPES = {
  FRAGMENT: 'application/x-slate-fragment',
  HTML: 'text/html',
  NODE: 'application/x-slate-node',
  RICH: 'text/rtf',
  TEXT: 'text/plain'

  /**
   * Export.
   *
   * @type {Object}
   */

};

/**
 * COMPAT: if we are in <= IE11 and the selection contains
 * tables, `removeAllRanges()` will throw
 * "unable to complete the operation due to error 800a025e"
 *
 * @param {Selection} selection document selection
 */

function removeAllRanges(selection) {
  var doc = window.document;

  if (doc && doc.body.createTextRange) {
    // All IE but Edge
    var range = doc.body.createTextRange();
    range.collapse();
    range.select();
  } else {
    selection.removeAllRanges();
  }
}

var FRAGMENT = TRANSFER_TYPES.FRAGMENT;
var HTML = TRANSFER_TYPES.HTML;
var TEXT = TRANSFER_TYPES.TEXT;

/**
 * Prepares a Slate document fragment to be copied to the clipboard.
 *
 * @param {Event} event
 * @param {Editor} editor
 */

function cloneFragment(event, editor) {
  var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : function () {
    return undefined;
  };

  invariant(!Value.isValue(editor), 'As of Slate 0.42.0, the `cloneFragment` utility takes an `editor` instead of a `value`.');

  var window = getWindow(event.target);
  var native = window.getSelection();
  var value = editor.value;
  var document = value.document,
      fragment = value.fragment,
      selection = value.selection;
  var start = selection.start,
      end = selection.end;

  var startVoid = document.getClosestVoid(start.key, editor);
  var endVoid = document.getClosestVoid(end.key, editor);

  // If the selection is collapsed, and it isn't inside a void node, abort.
  if (native.isCollapsed && !startVoid) return;

  // Create a fake selection so that we can add a Base64-encoded copy of the
  // fragment to the HTML, to decode on future pastes.
  var encoded = Base64.serializeNode(fragment);
  var range = native.getRangeAt(0);
  var contents = range.cloneContents();
  var attach = contents.childNodes[0];

  // Make sure attach is a non-empty node, since empty nodes will not get copied
  contents.childNodes.forEach(function (node) {
    if (node.textContent && node.textContent.trim() !== '') {
      attach = node;
    }
  });

  // COMPAT: If the end node is a void node, we need to move the end of the
  // range from the void node's spacer span, to the end of the void node's
  // content, since the spacer is before void's content in the DOM.
  if (endVoid) {
    var r = range.cloneRange();
    var node = findDOMNode(endVoid, window);
    r.setEndAfter(node);
    contents = r.cloneContents();
  }

  // COMPAT: If the start node is a void node, we need to attach the encoded
  // fragment to the void node's content node instead of the spacer, because
  // attaching it to empty `<div>/<span>` nodes will end up having it erased by
  // most browsers. (2018/04/27)
  if (startVoid) {
    attach = contents.childNodes[0].childNodes[1].firstChild;
  }

  // Remove any zero-width space spans from the cloned DOM so that they don't
  // show up elsewhere when pasted.
  [].slice.call(contents.querySelectorAll(ZERO_WIDTH_SELECTOR)).forEach(function (zw) {
    var isNewline = zw.getAttribute(ZERO_WIDTH_ATTRIBUTE) === 'n';
    zw.textContent = isNewline ? '\n' : '';
  });

  // Set a `data-slate-fragment` attribute on a non-empty node, so it shows up
  // in the HTML, and can be used for intra-Slate pasting. If it's a text
  // node, wrap it in a `<span>` so we have something to set an attribute on.
  if (attach.nodeType === 3) {
    var span = window.document.createElement('span');

    // COMPAT: In Chrome and Safari, if we don't add the `white-space` style
    // then leading and trailing spaces will be ignored. (2017/09/21)
    span.style.whiteSpace = 'pre';

    span.appendChild(attach);
    contents.appendChild(span);
    attach = span;
  }

  attach.setAttribute('data-slate-fragment', encoded);

  //  Creates value from only the selected blocks
  //  Then gets plaintext for clipboard with proper linebreaks for BLOCK elements
  //  Via Plain serializer
  var valFromSelection = Value.create({ document: fragment });
  var plainText = Plain.serialize(valFromSelection);

  // Add the phony content to a div element. This is needed to copy the
  // contents into the html clipboard register.
  var div = window.document.createElement('div');
  div.appendChild(contents);

  // For browsers supporting it, we set the clipboard registers manually,
  // since the result is more predictable.
  // COMPAT: IE supports the setData method, but only in restricted sense.
  // IE doesn't support arbitrary MIME types or common ones like 'text/plain';
  // it only accepts "Text" (which gets mapped to 'text/plain') and "Url"
  // (mapped to 'text/url-list'); so, we should only enter block if !IS_IE
  if (event.clipboardData && event.clipboardData.setData && !IS_IE) {
    event.preventDefault();
    event.clipboardData.setData(TEXT, plainText);
    event.clipboardData.setData(FRAGMENT, encoded);
    event.clipboardData.setData(HTML, div.innerHTML);
    callback();
    return;
  }

  // COMPAT: For browser that don't support the Clipboard API's setData method,
  // we must rely on the browser to natively copy what's selected.
  // So we add the div (containing our content) to the DOM, and select it.
  var editorEl = event.target.closest('[data-slate-editor]');
  div.setAttribute('contenteditable', true);
  div.style.position = 'absolute';
  div.style.left = '-9999px';
  editorEl.appendChild(div);
  native.selectAllChildren(div);

  // Revert to the previous selection right after copying.
  window.requestAnimationFrame(function () {
    editorEl.removeChild(div);
    removeAllRanges(native);
    native.addRange(range);
    callback();
  });
}

/**
 * Find a Slate node from a DOM `element`.
 *
 * @param {Element} element
 * @param {Editor} editor
 * @return {Node|Null}
 */

function findNode(element, editor) {
  invariant(!Value.isValue(editor), 'As of Slate 0.42.0, the `findNode` utility takes an `editor` instead of a `value`.');

  var closest = element.closest('[data-key]');
  if (!closest) return null;

  var key = closest.getAttribute('data-key');
  if (!key) return null;

  var value = editor.value;
  var document = value.document;

  var node = document.getNode(key);
  return node || null;
}

/**
 * Get the target range from a DOM `event`.
 *
 * @param {Event} event
 * @param {Editor} editor
 * @return {Range}
 */

function getEventRange(event, editor) {
  invariant(!Value.isValue(editor), 'As of Slate 0.42.0, the `findNode` utility takes an `editor` instead of a `value`.');

  if (event.nativeEvent) {
    event = event.nativeEvent;
  }

  var _event = event,
      x = _event.clientX,
      y = _event.clientY,
      target = _event.target;

  if (x == null || y == null) return null;

  var value = editor.value;
  var document = value.document;

  var node = findNode(target, editor);
  if (!node) return null;

  // If the drop target is inside a void node, move it into either the next or
  // previous node, depending on which side the `x` and `y` coordinates are
  // closest to.
  if (editor.query('isVoid', node)) {
    var rect = target.getBoundingClientRect();
    var isPrevious = node.object === 'inline' ? x - rect.left < rect.left + rect.width - x : y - rect.top < rect.top + rect.height - y;

    var text = node.getFirstText();
    var _range = document.createRange();

    if (isPrevious) {
      var previousText = document.getPreviousText(text.key);

      if (previousText) {
        return _range.moveToEndOfNode(previousText);
      }
    }

    var nextText = document.getNextText(text.key);
    return nextText ? _range.moveToStartOfNode(nextText) : null;
  }

  // Else resolve a range from the caret position where the drop occured.
  var window = getWindow(target);
  var native = void 0;

  // COMPAT: In Firefox, `caretRangeFromPoint` doesn't exist. (2016/07/25)
  if (window.document.caretRangeFromPoint) {
    native = window.document.caretRangeFromPoint(x, y);
  } else if (window.document.caretPositionFromPoint) {
    var position = window.document.caretPositionFromPoint(x, y);
    native = window.document.createRange();
    native.setStart(position.offsetNode, position.offset);
    native.setEnd(position.offsetNode, position.offset);
  } else if (window.document.body.createTextRange) {
    // COMPAT: In IE, `caretRangeFromPoint` and
    // `caretPositionFromPoint` don't exist. (2018/07/11)
    native = window.document.body.createTextRange();

    try {
      native.moveToPoint(x, y);
    } catch (error) {
      // IE11 will raise an `unspecified error` if `moveToPoint` is
      // called during a dropEvent.
      return null;
    }
  }

  // Resolve a Slate range from the DOM range.
  var range = findRange(native, editor);
  if (!range) return null;

  return range;
}

/**
 * Transfer types.
 *
 * @type {String}
 */

var FRAGMENT$1 = TRANSFER_TYPES.FRAGMENT;
var HTML$1 = TRANSFER_TYPES.HTML;
var NODE = TRANSFER_TYPES.NODE;
var RICH = TRANSFER_TYPES.RICH;
var TEXT$1 = TRANSFER_TYPES.TEXT;

/**
 * Fragment matching regexp for HTML nodes.
 *
 * @type {RegExp}
 */

var FRAGMENT_MATCHER = / data-slate-fragment="([^\s"]+)"/;

/**
 * Get the transfer data from an `event`.
 *
 * @param {Event} event
 * @return {Object}
 */

function getEventTransfer(event) {
  // COMPAT: IE 11 doesn't populate nativeEvent with either
  // dataTransfer or clipboardData. We'll need to use the base event
  // object (2018/14/6)
  if (!IS_IE && event.nativeEvent) {
    event = event.nativeEvent;
  }

  var transfer = event.dataTransfer || event.clipboardData;
  var fragment = getType(transfer, FRAGMENT$1);
  var node = getType(transfer, NODE);
  var html = getType(transfer, HTML$1);
  var rich = getType(transfer, RICH);
  var text = getType(transfer, TEXT$1);
  var files = void 0;

  // If there isn't a fragment, but there is HTML, check to see if the HTML is
  // actually an encoded fragment.
  if (!fragment && html && ~html.indexOf(' data-slate-fragment="')) {
    var matches = FRAGMENT_MATCHER.exec(html);

    var _matches = slicedToArray(matches, 2),
        full = _matches[0],
        encoded = _matches[1]; // eslint-disable-line no-unused-vars


    if (encoded) fragment = encoded;
  }

  // COMPAT: Edge doesn't handle custom data types
  // These will be embedded in text/plain in this case (2017/7/12)
  if (text) {
    var embeddedTypes = getEmbeddedTypes(text);

    if (embeddedTypes[FRAGMENT$1]) fragment = embeddedTypes[FRAGMENT$1];
    if (embeddedTypes[NODE]) node = embeddedTypes[NODE];
    if (embeddedTypes[TEXT$1]) text = embeddedTypes[TEXT$1];
  }

  // Decode a fragment or node if they exist.
  if (fragment) fragment = Base64.deserializeNode(fragment);
  if (node) node = Base64.deserializeNode(node);

  // COMPAT: Edge sometimes throws 'NotSupportedError'
  // when accessing `transfer.items` (2017/7/12)
  try {
    // Get and normalize files if they exist.
    if (transfer.items && transfer.items.length) {
      files = Array.from(transfer.items).map(function (item) {
        return item.kind === 'file' ? item.getAsFile() : null;
      }).filter(function (exists) {
        return exists;
      });
    } else if (transfer.files && transfer.files.length) {
      files = Array.from(transfer.files);
    }
  } catch (err) {
    if (transfer.files && transfer.files.length) {
      files = Array.from(transfer.files);
    }
  }

  // Determine the type of the data.
  var data = { files: files, fragment: fragment, html: html, node: node, rich: rich, text: text };
  data.type = getTransferType(data);
  return data;
}

/**
 * Takes text input, checks whether contains embedded data
 * and returns object with original text +/- additional data
 *
 * @param {String} text
 * @return {Object}
 */

function getEmbeddedTypes(text) {
  var prefix = 'SLATE-DATA-EMBED::';

  if (text.substring(0, prefix.length) !== prefix) {
    return { TEXT: text };
  }

  // Attempt to parse, if fails then just standard text/plain
  // Otherwise, already had data embedded
  try {
    return JSON.parse(text.substring(prefix.length));
  } catch (err) {
    throw new Error('Unable to parse custom Slate drag event data.');
  }
}

/**
 * Get the type of a transfer from its `data`.
 *
 * @param {Object} data
 * @return {String}
 */

function getTransferType(data) {
  if (data.fragment) return 'fragment';
  if (data.node) return 'node';

  // COMPAT: Microsoft Word adds an image of the selected text to the data.
  // Since files are preferred over HTML or text, this would cause the type to
  // be considered `files`. But it also adds rich text data so we can check
  // for that and properly set the type to `html` or `text`. (2016/11/21)
  if (data.rich && data.html) return 'html';
  if (data.rich && data.text) return 'text';

  if (data.files && data.files.length) return 'files';
  if (data.html) return 'html';
  if (data.text) return 'text';
  return 'unknown';
}

/**
 * Get one of types `TYPES.FRAGMENT`, `TYPES.NODE`, `text/html`, `text/rtf` or
 * `text/plain` from transfers's `data` if possible, otherwise return null.
 *
 * @param {Object} transfer
 * @param {String} type
 * @return {String}
 */

function getType(transfer, type) {
  if (!transfer.types || !transfer.types.length) {
    // COMPAT: In IE 11, there is no `types` field but `getData('Text')`
    // is supported`. (2017/06/23)
    return type === TEXT$1 ? transfer.getData('Text') || null : null;
  }

  // COMPAT: In Edge, transfer.types doesn't respond to `indexOf`. (2017/10/25)
  var types = Array.from(transfer.types);

  return types.indexOf(type) !== -1 ? transfer.getData(type) || null : null;
}

/**
 * The default plain text transfer type.
 *
 * @type {String}
 */

var TEXT$2 = TRANSFER_TYPES.TEXT;

/**
 * Set data with `type` and `content` on an `event`.
 *
 * COMPAT: In Edge, custom types throw errors, so embed all non-standard
 * types in text/plain compound object. (2017/7/12)
 *
 * @param {Event} event
 * @param {String} type
 * @param {String} content
 */

function setEventTransfer(event, type, content) {
  var mime = TRANSFER_TYPES[type.toUpperCase()];

  if (!mime) {
    throw new Error('Cannot set unknown transfer type "' + mime + '".');
  }

  if (event.nativeEvent) {
    event = event.nativeEvent;
  }

  var transfer = event.dataTransfer || event.clipboardData;

  try {
    transfer.setData(mime, content);
    // COMPAT: Safari needs to have the 'text' (and not 'text/plain') value in dataTransfer
    // to display the cursor while dragging internally.
    transfer.setData('text', transfer.getData('text'));
  } catch (err) {
    var prefix = 'SLATE-DATA-EMBED::';
    var text = transfer.getData(TEXT$2);
    var obj = {};

    // If the existing plain text data is prefixed, it's Slate JSON data.
    if (text.substring(0, prefix.length) === prefix) {
      try {
        obj = JSON.parse(text.substring(prefix.length));
      } catch (e) {
        throw new Error('Failed to parse Slate data from `DataTransfer` object.');
      }
    } else {
      // Otherwise, it's just set it as is.
      obj[TEXT$2] = text;
    }

    obj[mime] = content;
    var string = '' + prefix + JSON.stringify(obj);
    transfer.setData(TEXT$2, string);
  }
}

/**
 * Debug.
 *
 * @type {Function}
 */

var debug$1 = Debug('slate:after');

/**
 * A plugin that adds the "after" browser-specific logic to the editor.
 *
 * @param {Object} options
 * @return {Object}
 */

function AfterPlugin() {
  var isDraggingInternally = null;
  var isMouseDown = false;

  /**
   * On before input.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onBeforeInput(event, editor, next) {
    var value = editor.value;

    var isSynthetic = !!event.nativeEvent;

    // If the event is synthetic, it's React's polyfill of `beforeinput` that
    // isn't a true `beforeinput` event with meaningful information. It only
    // gets triggered for character insertions, so we can just insert directly.
    if (isSynthetic) {
      event.preventDefault();
      editor.insertText(event.data);
      return next();
    }

    // Otherwise, we can use the information in the `beforeinput` event to
    // figure out the exact change that will occur, and prevent it.

    var _event$getTargetRange = event.getTargetRanges(),
        _event$getTargetRange2 = slicedToArray(_event$getTargetRange, 1),
        targetRange = _event$getTargetRange2[0];

    if (!targetRange) return next();

    debug$1('onBeforeInput', { event: event });

    event.preventDefault();

    var document = value.document,
        selection = value.selection;

    var range = findRange(targetRange, editor);

    switch (event.inputType) {
      case 'deleteByDrag':
      case 'deleteByCut':
      case 'deleteContent':
      case 'deleteContentBackward':
      case 'deleteContentForward':
        {
          editor.deleteAtRange(range);
          break;
        }

      case 'deleteWordBackward':
        {
          editor.deleteWordBackwardAtRange(range);
          break;
        }

      case 'deleteWordForward':
        {
          editor.deleteWordForwardAtRange(range);
          break;
        }

      case 'deleteSoftLineBackward':
      case 'deleteHardLineBackward':
        {
          editor.deleteLineBackwardAtRange(range);
          break;
        }

      case 'deleteSoftLineForward':
      case 'deleteHardLineForward':
        {
          editor.deleteLineForwardAtRange(range);
          break;
        }

      case 'insertLineBreak':
      case 'insertParagraph':
        {
          var hasVoidParent = document.hasVoidParent(selection.start.path, editor);

          if (hasVoidParent) {
            editor.moveToStartOfNextText();
          } else {
            editor.splitBlockAtRange(range);
          }

          break;
        }

      case 'insertFromYank':
      case 'insertReplacementText':
      case 'insertText':
        {
          // COMPAT: `data` should have the text for the `insertText` input type
          // and `dataTransfer` should have the text for the
          // `insertReplacementText` input type, but Safari uses `insertText` for
          // spell check replacements and sets `data` to `null`. (2018/08/09)
          var text = event.data == null ? event.dataTransfer.getData('text/plain') : event.data;

          if (text == null) break;

          editor.insertTextAtRange(range, text, selection.marks);

          // If the text was successfully inserted, and the selection had marks
          // on it, unset the selection's marks.
          if (selection.marks && value.document !== editor.value.document) {
            editor.select({ marks: null });
          }

          break;
        }
    }

    next();
  }

  /**
   * On blur.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onBlur(event, editor, next) {
    debug$1('onBlur', { event: event });
    editor.blur();
    next();
  }

  /**
   * On click.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onClick(event, editor, next) {
    if (editor.readOnly) return next();

    var value = editor.value;
    var document = value.document;

    var node = findNode(event.target, editor);
    if (!node) return next();

    debug$1('onClick', { event: event });

    var ancestors = document.getAncestors(node.key);
    var isVoid = node && (editor.isVoid(node) || ancestors.some(function (a) {
      return editor.isVoid(a);
    }));

    if (isVoid) {
      // COMPAT: In Chrome & Safari, selections that are at the zero offset of
      // an inline node will be automatically replaced to be at the last offset
      // of a previous inline node, which screws us up, so we always want to set
      // it to the end of the node. (2016/11/29)
      editor.focus().moveToEndOfNode(node);
    }

    next();
  }

  /**
   * On copy.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onCopy(event, editor, next) {
    debug$1('onCopy', { event: event });
    cloneFragment(event, editor);
    next();
  }

  /**
   * On cut.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onCut(event, editor, next) {
    debug$1('onCut', { event: event });

    // Once the fake cut content has successfully been added to the clipboard,
    // delete the content in the current selection.
    cloneFragment(event, editor, function () {
      // If user cuts a void block node or a void inline node,
      // manually removes it since selection is collapsed in this case.
      var value = editor.value;
      var endBlock = value.endBlock,
          endInline = value.endInline,
          selection = value.selection;
      var isCollapsed = selection.isCollapsed;

      var isVoidBlock = endBlock && editor.isVoid(endBlock) && isCollapsed;
      var isVoidInline = endInline && editor.isVoid(endInline) && isCollapsed;

      if (isVoidBlock) {
        editor.removeNodeByKey(endBlock.key);
      } else if (isVoidInline) {
        editor.removeNodeByKey(endInline.key);
      } else {
        editor.delete();
      }
    });

    next();
  }

  /**
   * On drag end.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDragEnd(event, editor, next) {
    debug$1('onDragEnd', { event: event });
    isDraggingInternally = null;
    next();
  }

  /**
   * On drag start.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDragStart(event, editor, next) {
    debug$1('onDragStart', { event: event });

    isDraggingInternally = true;

    var value = editor.value;
    var document = value.document;

    var node = findNode(event.target, editor);
    var ancestors = document.getAncestors(node.key);
    var isVoid = node && (editor.isVoid(node) || ancestors.some(function (a) {
      return editor.isVoid(a);
    }));
    var selectionIncludesNode = value.blocks.some(function (block) {
      return block.key === node.key;
    });

    // If a void block is dragged and is not selected, select it (necessary for local drags).
    if (isVoid && !selectionIncludesNode) {
      editor.moveToRangeOfNode(node);
    }

    var fragment = editor.value.fragment;
    var encoded = Base64.serializeNode(fragment);
    setEventTransfer(event, 'fragment', encoded);
    next();
  }

  /**
   * On drop.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDrop(event, editor, next) {
    var value = editor.value;
    var document = value.document,
        selection = value.selection;

    var window = getWindow(event.target);
    var target = getEventRange(event, editor);
    if (!target) return next();

    debug$1('onDrop', { event: event });

    var transfer = getEventTransfer(event);
    var type = transfer.type,
        fragment = transfer.fragment,
        text = transfer.text;


    editor.focus();

    // If the drag is internal and the target is after the selection, it
    // needs to account for the selection's content being deleted.
    if (isDraggingInternally && selection.end.key === target.end.key && selection.end.offset < target.end.offset) {
      target = target.moveForward(selection.start.key === selection.end.key ? 0 - selection.end.offset + selection.start.offset : 0 - selection.end.offset);
    }

    if (isDraggingInternally) {
      editor.delete();
    }

    editor.select(target);

    if (type === 'text' || type === 'html') {
      var _target = target,
          anchor = _target.anchor;

      var hasVoidParent = document.hasVoidParent(anchor.key, editor);

      if (hasVoidParent) {
        var n = document.getNode(anchor.key);

        while (hasVoidParent) {
          n = document.getNextText(n.key);
          if (!n) break;
          hasVoidParent = document.hasVoidParent(n.key, editor);
        }

        if (n) editor.moveToStartOfNode(n);
      }

      if (text) {
        text.split('\n').forEach(function (line, i) {
          if (i > 0) editor.splitBlock();
          editor.insertText(line);
        });
      }
    }

    if (type === 'fragment') {
      editor.insertFragment(fragment);
    }

    // COMPAT: React's onSelect event breaks after an onDrop event
    // has fired in a node: https://github.com/facebook/react/issues/11379.
    // Until this is fixed in React, we dispatch a mouseup event on that
    // DOM node, since that will make it go back to normal.
    var focusNode = document.getNode(target.focus.key);
    var el = findDOMNode(focusNode, window);

    if (el) {
      el.dispatchEvent(new MouseEvent('mouseup', {
        view: window,
        bubbles: true,
        cancelable: true
      }));
    }

    next();
  }

  /**
   * On focus.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onFocus(event, editor, next) {
    debug$1('onFocus', { event: event });

    // COMPAT: If the focus event is a mouse-based one, it will be shortly
    // followed by a `selectionchange`, so we need to deselect here to prevent
    // the old selection from being set by the `updateSelection` of `<Content>`,
    // preventing the `selectionchange` from firing. (2018/11/07)
    if (isMouseDown && !IS_IE && !IS_EDGE) {
      editor.deselect().focus();
    } else {
      editor.focus();
    }

    next();
  }

  /**
   * On input.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onInput(event, editor, next) {
    debug$1('onInput');
    var window = getWindow(event.target);

    // Get the selection point.
    var selection = window.getSelection();
    var anchorNode = selection.anchorNode;


    setTextFromDomNode(window, editor, anchorNode);
    setSelectionFromDOM(window, editor, selection);
    next();
  }

  /**
   * On key down.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onKeyDown(event, editor, next) {
    debug$1('onKeyDown', { event: event });

    var value = editor.value;
    var document = value.document,
        selection = value.selection;

    var hasVoidParent = document.hasVoidParent(selection.start.path, editor);

    // COMPAT: In iOS, some of these hotkeys are handled in the
    // `onNativeBeforeInput` handler of the `<Content>` component in order to
    // preserve native autocorrect behavior, so they shouldn't be handled here.
    if (Hotkeys.isSplitBlock(event) && !IS_IOS) {
      return hasVoidParent ? editor.moveToStartOfNextText() : editor.splitBlock();
    }

    if (Hotkeys.isDeleteBackward(event) && !IS_IOS) {
      return editor.deleteCharBackward();
    }

    if (Hotkeys.isDeleteForward(event) && !IS_IOS) {
      return editor.deleteCharForward();
    }

    if (Hotkeys.isDeleteLineBackward(event)) {
      return editor.deleteLineBackward();
    }

    if (Hotkeys.isDeleteLineForward(event)) {
      return editor.deleteLineForward();
    }

    if (Hotkeys.isDeleteWordBackward(event)) {
      return editor.deleteWordBackward();
    }

    if (Hotkeys.isDeleteWordForward(event)) {
      return editor.deleteWordForward();
    }

    if (Hotkeys.isRedo(event)) {
      return editor.redo();
    }

    if (Hotkeys.isUndo(event)) {
      return editor.undo();
    }

    // COMPAT: Certain browsers don't handle the selection updates properly. In
    // Chrome, the selection isn't properly extended. And in Firefox, the
    // selection isn't properly collapsed. (2017/10/17)
    if (Hotkeys.isMoveLineBackward(event)) {
      event.preventDefault();
      return editor.moveToStartOfBlock();
    }

    if (Hotkeys.isMoveLineForward(event)) {
      event.preventDefault();
      return editor.moveToEndOfBlock();
    }

    if (Hotkeys.isExtendLineBackward(event)) {
      event.preventDefault();
      return editor.moveFocusToStartOfBlock();
    }

    if (Hotkeys.isExtendLineForward(event)) {
      event.preventDefault();
      return editor.moveFocusToEndOfBlock();
    }

    // COMPAT: If a void node is selected, or a zero-width text node adjacent to
    // an inline is selected, we need to handle these hotkeys manually because
    // browsers won't know what to do.
    if (Hotkeys.isMoveBackward(event)) {
      event.preventDefault();

      if (!selection.isCollapsed) {
        return editor.moveToStart();
      }

      return editor.moveBackward();
    }

    if (Hotkeys.isMoveForward(event)) {
      event.preventDefault();

      if (!selection.isCollapsed) {
        return editor.moveToEnd();
      }

      return editor.moveForward();
    }

    if (Hotkeys.isMoveWordBackward(event)) {
      event.preventDefault();
      return editor.moveWordBackward();
    }

    if (Hotkeys.isMoveWordForward(event)) {
      event.preventDefault();
      return editor.moveWordForward();
    }

    if (Hotkeys.isExtendBackward(event)) {
      var previousText = value.previousText,
          startText = value.startText;

      var isPreviousInVoid = previousText && document.hasVoidParent(previousText.key, editor);

      if (hasVoidParent || isPreviousInVoid || startText.text === '') {
        event.preventDefault();
        return editor.moveFocusBackward();
      }
    }

    if (Hotkeys.isExtendForward(event)) {
      var nextText = value.nextText,
          _startText = value.startText;

      var isNextInVoid = nextText && document.hasVoidParent(nextText.key, editor);

      if (hasVoidParent || isNextInVoid || _startText.text === '') {
        event.preventDefault();
        return editor.moveFocusForward();
      }
    }

    next();
  }

  /**
   * On mouse down.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onMouseDown(event, editor, next) {
    debug$1('onMouseDown', { event: event });
    isMouseDown = true;
    next();
  }

  /**
   * On mouse up.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onMouseUp(event, editor, next) {
    debug$1('onMouseUp', { event: event });
    isMouseDown = false;
    next();
  }

  /**
   * On paste.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onPaste(event, editor, next) {
    debug$1('onPaste', { event: event });

    var value = editor.value;

    var transfer = getEventTransfer(event);
    var type = transfer.type,
        fragment = transfer.fragment,
        text = transfer.text;


    if (type === 'fragment') {
      editor.insertFragment(fragment);
    }

    if (type === 'text' || type === 'html') {
      if (!text) return next();
      var document = value.document,
          selection = value.selection,
          startBlock = value.startBlock;

      if (editor.isVoid(startBlock)) return next();

      var defaultBlock = startBlock;
      var defaultMarks = document.getInsertMarksAtRange(selection);
      var frag = Plain.deserialize(text, { defaultBlock: defaultBlock, defaultMarks: defaultMarks }).document;
      editor.insertFragment(frag);
    }

    next();
  }

  /**
   * On select.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onSelect(event, editor, next) {
    debug$1('onSelect', { event: event });
    var window = getWindow(event.target);
    var selection = window.getSelection();
    setSelectionFromDOM(window, editor, selection);
    next();
  }

  /**
   * On composition end.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onCompositionEnd(event, editor, next) {
    debug$1('onCompositionEnd', { event: event });

    var data = event.data;

    // A reliable way for adding text from IME
    // For example, when typing Vietnamese if the user finishes a word without
    // whitespace or enter (no onCompositionEnd yet) and suddenly change the
    // selection (onCompositionEnd occurred) then no text was inserted, but the
    // component still displays the text which causes that text to disappear if
    // the user does other edit commands (text input, bold,...)

    window.requestAnimationFrame(function () {
      editor.insertText(data);
    });

    next();
  }

  /**
   * Return the plugin.
   *
   * @type {Object}
   */

  return {
    onBeforeInput: onBeforeInput,
    onBlur: onBlur,
    onClick: onClick,
    onCopy: onCopy,
    onCut: onCut,
    onDragEnd: onDragEnd,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onFocus: onFocus,
    onInput: onInput,
    onKeyDown: onKeyDown,
    onMouseDown: onMouseDown,
    onMouseUp: onMouseUp,
    onPaste: onPaste,
    onSelect: onSelect,
    onCompositionEnd: onCompositionEnd
  };
}

/**
 * Debug.
 *
 * @type {Function}
 */

var debug$2 = Debug('slate:before');

/**
 * A plugin that adds the "before" browser-specific logic to the editor.
 *
 * @return {Object}
 */

function BeforePlugin() {
  var activeElement = null;
  var compositionCount = 0;
  var _isComposing = false;
  var isCopying = false;
  var isDragging = false;

  /**
   * The before plugin queries.
   *
   * @type {Object}
   */

  var queries = {
    isComposing: function isComposing() {
      return _isComposing;
    }

    /**
     * On before input.
     *
     * @param {Event} event
     * @param {Editor} editor
     * @param {Function} next
     */

  };function onBeforeInput(event, editor, next) {
    var isSynthetic = !!event.nativeEvent;
    if (editor.readOnly || _isComposing) return;

    // COMPAT: If the browser supports Input Events Level 2, we will have
    // attached a custom handler for the real `beforeinput` events, instead of
    // allowing React's synthetic polyfill, so we need to ignore synthetics.
    if (isSynthetic && HAS_INPUT_EVENTS_LEVEL_2) return;

    debug$2('onBeforeInput', { event: event });
    next();
  }

  /**
   * On blur.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onBlur(event, editor, next) {
    if (isCopying) return;
    if (editor.readOnly) return;

    var relatedTarget = event.relatedTarget,
        target = event.target;

    var window = getWindow(target);

    // COMPAT: If the current `activeElement` is still the previous one, this is
    // due to the window being blurred when the tab itself becomes unfocused, so
    // we want to abort early to allow to editor to stay focused when the tab
    // becomes focused again.
    if (activeElement === window.document.activeElement) return;

    // COMPAT: The `relatedTarget` can be null when the new focus target is not
    // a "focusable" element (eg. a `<div>` without `tabindex` set).
    if (relatedTarget) {
      var el = ReactDOM.findDOMNode(editor);

      // COMPAT: The event should be ignored if the focus is returning to the
      // editor from an embedded editable element (eg. an <input> element inside
      // a void node).
      if (relatedTarget === el) return;

      // COMPAT: The event should be ignored if the focus is moving from the
      // editor to inside a void node's spacer element.
      if (relatedTarget.hasAttribute('data-slate-spacer')) return;

      // COMPAT: The event should be ignored if the focus is moving to a non-
      // editable section of an element that isn't a void node (eg. a list item
      // of the check list example).
      var node = findNode(relatedTarget, editor);
      if (el.contains(relatedTarget) && node && !editor.isVoid(node)) return;
    }

    debug$2('onBlur', { event: event });
    next();
  }

  /**
   * On composition end.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onCompositionEnd(event, editor, next) {
    var n = compositionCount;

    // The `count` check here ensures that if another composition starts
    // before the timeout has closed out this one, we will abort unsetting the
    // `isComposing` flag, since a composition is still in affect.
    window.requestAnimationFrame(function () {
      if (compositionCount > n) return;
      _isComposing = false;
    });

    debug$2('onCompositionEnd', { event: event });
    next();
  }

  /**
   * On click.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onClick(event, editor, next) {
    debug$2('onClick', { event: event });
    next();
  }

  /**
   * On composition start.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onCompositionStart(event, editor, next) {
    _isComposing = true;
    compositionCount++;

    var value = editor.value;
    var selection = value.selection;


    if (!selection.isCollapsed) {
      // https://github.com/ianstormtaylor/slate/issues/1879
      // When composition starts and the current selection is not collapsed, the
      // second composition key-down would drop the text wrapping <spans> which
      // resulted on crash in content.updateSelection after composition ends
      // (because it cannot find <span> nodes in DOM). This is a workaround that
      // erases selection as soon as composition starts and preventing <spans>
      // to be dropped.
      editor.delete();
    }

    debug$2('onCompositionStart', { event: event });
    next();
  }

  /**
   * On copy.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onCopy(event, editor, next) {
    var window = getWindow(event.target);
    isCopying = true;
    window.requestAnimationFrame(function () {
      return isCopying = false;
    });

    debug$2('onCopy', { event: event });
    next();
  }

  /**
   * On cut.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onCut(event, editor, next) {
    if (editor.readOnly) return;

    var window = getWindow(event.target);
    isCopying = true;
    window.requestAnimationFrame(function () {
      return isCopying = false;
    });

    debug$2('onCut', { event: event });
    next();
  }

  /**
   * On drag end.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDragEnd(event, editor, next) {
    isDragging = false;
    debug$2('onDragEnd', { event: event });
    next();
  }

  /**
   * On drag enter.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDragEnter(event, editor, next) {
    debug$2('onDragEnter', { event: event });
    next();
  }

  /**
   * On drag exit.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDragExit(event, editor, next) {
    debug$2('onDragExit', { event: event });
    next();
  }

  /**
   * On drag leave.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDragLeave(event, editor, next) {
    debug$2('onDragLeave', { event: event });
    next();
  }

  /**
   * On drag over.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDragOver(event, editor, next) {
    // If the target is inside a void node, and only in this case,
    // call `preventDefault` to signal that drops are allowed.
    // When the target is editable, dropping is already allowed by
    // default, and calling `preventDefault` hides the cursor.
    var node = findNode(event.target, editor);
    if (editor.isVoid(node)) event.preventDefault();

    // COMPAT: IE won't call onDrop on contentEditables unless the
    // default dragOver is prevented:
    // https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/913982/
    // (2018/07/11)
    if (IS_IE) {
      event.preventDefault();
    }

    // If a drag is already in progress, don't do this again.
    if (!isDragging) {
      isDragging = true;

      // COMPAT: IE will raise an `unspecified error` if dropEffect is
      // set. (2018/07/11)
      if (!IS_IE) {
        event.nativeEvent.dataTransfer.dropEffect = 'move';
      }
    }

    debug$2('onDragOver', { event: event });
    next();
  }

  /**
   * On drag start.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDragStart(event, editor, next) {
    isDragging = true;
    debug$2('onDragStart', { event: event });
    next();
  }

  /**
   * On drop.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onDrop(event, editor, next) {
    if (editor.readOnly) return;

    // Prevent default so the DOM's value isn't corrupted.
    event.preventDefault();

    debug$2('onDrop', { event: event });
    next();
  }

  /**
   * On focus.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onFocus(event, editor, next) {
    if (isCopying) return;
    if (editor.readOnly) return;

    var el = ReactDOM.findDOMNode(editor);

    // Save the new `activeElement`.
    var window = getWindow(event.target);
    activeElement = window.document.activeElement;

    // COMPAT: If the editor has nested editable elements, the focus can go to
    // those elements. In Firefox, this must be prevented because it results in
    // issues with keyboard navigation. (2017/03/30)
    if (IS_FIREFOX && event.target !== el) {
      el.focus();
      return;
    }

    debug$2('onFocus', { event: event });
    next();
  }

  /**
   * On input.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onInput(event, editor, next) {
    if (_isComposing) return;
    if (editor.value.selection.isBlurred) return;
    debug$2('onInput', { event: event });
    next();
  }

  /**
   * On key down.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onKeyDown(event, editor, next) {
    if (editor.readOnly) return;

    // When composing, we need to prevent all hotkeys from executing while
    // typing. However, certain characters also move the selection before
    // we're able to handle it, so prevent their default behavior.
    if (_isComposing) {
      if (Hotkeys.isCompose(event)) event.preventDefault();
      return;
    }

    // Certain hotkeys have native editing behaviors in `contenteditable`
    // elements which will editor the DOM and cause our value to be out of sync,
    // so they need to always be prevented.
    if (!IS_IOS && (Hotkeys.isBold(event) || Hotkeys.isDeleteBackward(event) || Hotkeys.isDeleteForward(event) || Hotkeys.isDeleteLineBackward(event) || Hotkeys.isDeleteLineForward(event) || Hotkeys.isDeleteWordBackward(event) || Hotkeys.isDeleteWordForward(event) || Hotkeys.isItalic(event) || Hotkeys.isRedo(event) || Hotkeys.isSplitBlock(event) || Hotkeys.isTransposeCharacter(event) || Hotkeys.isUndo(event))) {
      event.preventDefault();
    }

    debug$2('onKeyDown', { event: event });
    next();
  }

  /**
   * On paste.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onPaste(event, editor, next) {
    if (editor.readOnly) return;

    // Prevent defaults so the DOM state isn't corrupted.
    event.preventDefault();

    debug$2('onPaste', { event: event });
    next();
  }

  /**
   * On select.
   *
   * @param {Event} event
   * @param {Editor} editor
   * @param {Function} next
   */

  function onSelect(event, editor, next) {
    if (isCopying) return;
    if (_isComposing) return;

    if (editor.readOnly) return;

    // Save the new `activeElement`.
    var window = getWindow(event.target);
    activeElement = window.document.activeElement;

    debug$2('onSelect', { event: event });
    next();
  }

  /**
   * Return the plugin.
   *
   * @type {Object}
   */

  return {
    queries: queries,
    onBeforeInput: onBeforeInput,
    onBlur: onBlur,
    onClick: onClick,
    onCompositionEnd: onCompositionEnd,
    onCompositionStart: onCompositionStart,
    onCopy: onCopy,
    onCut: onCut,
    onDragEnd: onDragEnd,
    onDragEnter: onDragEnter,
    onDragExit: onDragExit,
    onDragLeave: onDragLeave,
    onDragOver: onDragOver,
    onDragStart: onDragStart,
    onDrop: onDrop,
    onFocus: onFocus,
    onInput: onInput,
    onKeyDown: onKeyDown,
    onPaste: onPaste,
    onSelect: onSelect
  };
}

/**
 * A plugin that adds the browser-specific logic to the editor.
 *
 * @param {Object} options
 * @return {Object}
 */

function DOMPlugin() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _options$plugins = options.plugins,
      plugins = _options$plugins === undefined ? [] : _options$plugins;
  // Add Android specific handling separately before it gets to the other
  // plugins because it is specific (other browser don't need it) and finicky
  // (it has to come before other plugins to work).

  var beforeBeforePlugins = IS_ANDROID ? [AndroidPlugin()] : [];
  var beforePlugin = BeforePlugin();
  var afterPlugin = AfterPlugin();
  return [].concat(beforeBeforePlugins, [beforePlugin], toConsumableArray(plugins), [afterPlugin]);
}

/**
 * Debugger.
 *
 * @type {Function}
 */

var debug$3 = Debug('slate:leaves');

/**
 * Leaf.
 *
 * @type {Component}
 */

var Leaf = function (_React$Component) {
  inherits(Leaf, _React$Component);

  function Leaf() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, Leaf);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = Leaf.__proto__ || Object.getPrototypeOf(Leaf)).call.apply(_ref, [this].concat(args))), _this), _initialiseProps.call(_this), _temp), possibleConstructorReturn(_this, _ret);
  }
  /**
   * Property types.
   *
   * @type {Object}
   */

  /**
   * Debug.
   *
   * @param {String} message
   * @param {Mixed} ...args
   */

  createClass(Leaf, [{
    key: 'shouldComponentUpdate',


    /**
     * Should component update?
     *
     * @param {Object} props
     * @return {Boolean}
     */

    value: function shouldComponentUpdate(props) {
      // If any of the regular properties have changed, re-render.
      if (props.index !== this.props.index || props.marks !== this.props.marks || props.text !== this.props.text || props.parent !== this.props.parent) {
        return true;
      }

      // Otherwise, don't update.
      return false;
    }

    /**
     * Render the leaf.
     *
     * @return {Element}
     */

  }, {
    key: 'render',
    value: function render() {
      this.debug('render', this);

      var _props = this.props,
          node = _props.node,
          index = _props.index;

      var offsetKey = OffsetKey.stringify({
        key: node.key,
        index: index
      });

      return React.createElement(
        'span',
        { 'data-slate-leaf': true, 'data-offset-key': offsetKey },
        this.renderMarks()
      );
    }

    /**
     * Render all of the leaf's mark components.
     *
     * @return {Element}
     */

  }, {
    key: 'renderMarks',
    value: function renderMarks() {
      var _props2 = this.props,
          marks = _props2.marks,
          node = _props2.node,
          offset = _props2.offset,
          text = _props2.text,
          editor = _props2.editor;

      var leaf = this.renderText();
      var attributes = {
        'data-slate-mark': true
      };

      return marks.reduce(function (children, mark) {
        var props = {
          editor: editor,
          mark: mark,
          marks: marks,
          node: node,
          offset: offset,
          text: text,
          children: children,
          attributes: attributes
        };
        var element = editor.run('renderMark', props);
        return element || children;
      }, leaf);
    }

    /**
     * Render the text content of the leaf, accounting for browsers.
     *
     * @return {Element}
     */

  }, {
    key: 'renderText',
    value: function renderText() {
      var _props3 = this.props,
          block = _props3.block,
          node = _props3.node,
          editor = _props3.editor,
          parent = _props3.parent,
          text = _props3.text,
          index = _props3.index,
          leaves = _props3.leaves;

      // COMPAT: Render text inside void nodes with a zero-width space.
      // So the node can contain selection but the text is not visible.

      if (editor.query('isVoid', parent)) {
        return React.createElement(
          'span',
          { 'data-slate-zero-width': 'z', 'data-slate-length': parent.text.length },
          '\uFEFF'
        );
      }

      // COMPAT: If this is the last text node in an empty block, render a zero-
      // width space that will convert into a line break when copying and pasting
      // to support expected plain text.
      if (text === '' && parent.object === 'block' && parent.text === '' && parent.nodes.last() === node) {
        return React.createElement(
          'span',
          { 'data-slate-zero-width': 'n', 'data-slate-length': 0 },
          '\uFEFF',
          React.createElement('br', null)
        );
      }

      // COMPAT: If the text is empty, it's because it's on the edge of an inline
      // node, so we render a zero-width space so that the selection can be
      // inserted next to it still.
      if (text === '') {
        return React.createElement(
          'span',
          { 'data-slate-zero-width': 'z', 'data-slate-length': 0 },
          '\uFEFF'
        );
      }

      // COMPAT: Browsers will collapse trailing new lines at the end of blocks,
      // so we need to add an extra trailing new lines to prevent that.
      var lastText = block.getLastText();
      var lastChar = text.charAt(text.length - 1);
      var isLastText = node === lastText;
      var isLastLeaf = index === leaves.size - 1;
      if (isLastText && isLastLeaf && lastChar === '\n') return React.createElement(
        'span',
        { 'data-slate-content': true },
        text + '\n'
      );

      // Otherwise, just return the content.
      return React.createElement(
        'span',
        { 'data-slate-content': true },
        text
      );
    }
  }]);
  return Leaf;
}(React.Component);

/**
 * Export.
 *
 * @type {Component}
 */

Leaf.propTypes = {
  block: SlateTypes.block.isRequired,
  editor: Types.object.isRequired,
  index: Types.number.isRequired,
  leaves: SlateTypes.leaves.isRequired,
  marks: SlateTypes.marks.isRequired,
  node: SlateTypes.node.isRequired,
  offset: Types.number.isRequired,
  parent: SlateTypes.node.isRequired,
  text: Types.string.isRequired };

var _initialiseProps = function _initialiseProps() {
  var _this2 = this;

  this.debug = function (message) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    debug$3.apply(undefined, [message, _this2.props.node.key + '-' + _this2.props.index].concat(args));
  };
};

/**
 * Debug.
 *
 * @type {Function}
 */

var debug$4 = Debug('slate:node');

/**
 * Text.
 *
 * @type {Component}
 */

var Text = function (_React$Component) {
  inherits(Text, _React$Component);

  function Text() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, Text);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = Text.__proto__ || Object.getPrototypeOf(Text)).call.apply(_ref, [this].concat(args))), _this), _initialiseProps$1.call(_this), _temp), possibleConstructorReturn(_this, _ret);
  }
  /**
   * Property types.
   *
   * @type {Object}
   */

  /**
   * Default prop types.
   *
   * @type {Object}
   */

  /**
   * Debug.
   *
   * @param {String} message
   * @param {Mixed} ...args
   */

  /**
   * Should the node update?
   *
   * @param {Object} nextProps
   * @param {Object} value
   * @return {Boolean}
   */

  createClass(Text, [{
    key: 'render',


    /**
     * Render.
     *
     * @return {Element}
     */

    value: function render() {
      var _this2 = this;

      this.debug('render', this);

      var _props = this.props,
          decorations = _props.decorations,
          editor = _props.editor,
          node = _props.node,
          style = _props.style;
      var value = editor.value;
      var document = value.document;
      var key = node.key;


      var decs = decorations.filter(function (d) {
        var start = d.start,
            end = d.end;

        // If either of the decoration's keys match, include it.

        if (start.key === key || end.key === key) return true;

        // Otherwise, if the decoration is in a single node, it's not ours.
        if (start.key === end.key) return false;

        // If the node's path is before the start path, ignore it.
        var path = document.assertPath(key);
        if (PathUtils.compare(path, start.path) === -1) return false;

        // If the node's path is after the end path, ignore it.
        if (PathUtils.compare(path, end.path) === 1) return false;

        // Otherwise, include it.
        return true;
      });

      // PERF: Take advantage of cache by avoiding arguments
      var leaves = decs.size === 0 ? node.getLeaves() : node.getLeaves(decs);
      var offset = 0;

      var children = leaves.map(function (leaf, i) {
        var child = _this2.renderLeaf(leaves, leaf, i, offset);
        offset += leaf.text.length;
        return child;
      });

      return React.createElement(
        'span',
        { 'data-key': key, style: style },
        children
      );
    }

    /**
     * Render a single leaf given a `leaf` and `offset`.
     *
     * @param {List<Leaf>} leaves
     * @param {Leaf} leaf
     * @param {Number} index
     * @param {Number} offset
     * @return {Element} leaf
     */

  }]);
  return Text;
}(React.Component);

/**
 * Export.
 *
 * @type {Component}
 */

Text.propTypes = {
  block: SlateTypes.block,
  decorations: ImmutableTypes.list.isRequired,
  editor: Types.object.isRequired,
  node: SlateTypes.node.isRequired,
  parent: SlateTypes.node.isRequired,
  style: Types.object };
Text.defaultProps = {
  style: null };

var _initialiseProps$1 = function _initialiseProps() {
  var _this3 = this;

  this.debug = function (message) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    var node = _this3.props.node;
    var key = node.key;

    debug$4.apply(undefined, [message, key + ' (text)'].concat(args));
  };

  this.shouldComponentUpdate = function (nextProps) {
    var props = _this3.props;

    var n = nextProps;
    var p = props;

    // If the node has changed, update. PERF: There are cases where it will have
    // changed, but it's properties will be exactly the same (eg. copy-paste)
    // which this won't catch. But that's rare and not a drag on performance, so
    // for simplicity we just let them through.
    if (n.node !== p.node) return true;

    // If the node parent is a block node, and it was the last child of the
    // block, re-render to cleanup extra `\n`.
    if (n.parent.object === 'block') {
      var pLast = p.parent.nodes.last();
      var nLast = n.parent.nodes.last();
      if (p.node === pLast && n.node !== nLast) return true;
    }

    // Re-render if the current decorations have changed.
    if (!n.decorations.equals(p.decorations)) return true;

    // Otherwise, don't update.
    return false;
  };

  this.renderLeaf = function (leaves, leaf, index, offset) {
    var _props2 = _this3.props,
        block = _props2.block,
        node = _props2.node,
        parent = _props2.parent,
        editor = _props2.editor;
    var text = leaf.text,
        marks = leaf.marks;


    return React.createElement(Leaf, {
      key: node.key + '-' + index,
      block: block,
      editor: editor,
      index: index,
      marks: marks,
      node: node,
      offset: offset,
      parent: parent,
      leaves: leaves,
      text: text
    });
  };
};

/**
 * Debug.
 *
 * @type {Function}
 */

var debug$5 = Debug('slate:void');

/**
 * Void.
 *
 * @type {Component}
 */

var Void = function (_React$Component) {
  inherits(Void, _React$Component);

  function Void() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, Void);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = Void.__proto__ || Object.getPrototypeOf(Void)).call.apply(_ref, [this].concat(args))), _this), _initialiseProps$2.call(_this), _temp), possibleConstructorReturn(_this, _ret);
  }
  /**
   * Property types.
   *
   * @type {Object}
   */

  /**
   * Debug.
   *
   * @param {String} message
   * @param {Mixed} ...args
   */

  createClass(Void, [{
    key: 'render',


    /**
     * Render.
     *
     * @return {Element}
     */

    value: function render() {
      var props = this.props;
      var children = props.children,
          node = props.node,
          readOnly = props.readOnly;

      var Tag = node.object === 'block' ? 'div' : 'span';
      var style = {
        height: '0',
        color: 'transparent',
        outline: 'none',
        position: 'absolute'
      };

      var spacer = React.createElement(
        Tag,
        { 'data-slate-spacer': true, style: style },
        this.renderText()
      );

      var content = React.createElement(
        Tag,
        { contentEditable: readOnly ? null : false },
        children
      );

      this.debug('render', { props: props });

      return React.createElement(
        Tag,
        {
          'data-slate-void': true,
          'data-key': node.key,
          contentEditable: readOnly || node.object === 'block' ? null : false
        },
        readOnly ? null : spacer,
        content
      );
    }

    /**
     * Render the void node's text node, which will catch the cursor when it the
     * void node is navigated to with the arrow keys.
     *
     * Having this text node there means the browser continues to manage the
     * selection natively, so it keeps track of the right offset when moving
     * across the block.
     *
     * @return {Element}
     */

  }]);
  return Void;
}(React.Component);

/**
 * Export.
 *
 * @type {Component}
 */

Void.propTypes = {
  block: SlateTypes.block,
  children: Types.any.isRequired,
  editor: Types.object.isRequired,
  node: SlateTypes.node.isRequired,
  parent: SlateTypes.node.isRequired,
  readOnly: Types.bool.isRequired };

var _initialiseProps$2 = function _initialiseProps() {
  var _this2 = this;

  this.debug = function (message) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    var node = _this2.props.node;
    var key = node.key,
        type = node.type;

    var id = key + ' (' + type + ')';
    debug$5.apply(undefined, [message, '' + id].concat(args));
  };

  this.renderText = function () {
    var _props = _this2.props,
        block = _props.block,
        decorations = _props.decorations,
        node = _props.node,
        readOnly = _props.readOnly,
        editor = _props.editor;

    var child = node.getFirstText();
    return React.createElement(Text, {
      block: node.object === 'block' ? node : block,
      decorations: decorations,
      editor: editor,
      key: child.key,
      node: child,
      parent: node,
      readOnly: readOnly
    });
  };
};

/**
 * Split the decorations in lists of relevant decorations for each child.
 *
 * @param {Node} node
 * @param {List} decorations
 * @return {Array<List<Decoration>>}
 */

function getChildrenDecorations(node, decorations) {
  var activeDecorations = Set().asMutable();
  var childrenDecorations = [];

  orderChildDecorations(node, decorations).forEach(function (item) {
    if (item.isRangeStart) {
      // Item is a decoration start
      activeDecorations.add(item.decoration);
    } else if (item.isRangeEnd) {
      // item is a decoration end
      activeDecorations.remove(item.decoration);
    } else {
      // Item is a child node
      childrenDecorations.push(activeDecorations.toList());
    }
  });

  return childrenDecorations;
}

/**
 * Orders the children of provided node and its decoration endpoints (start, end)
 * so that decorations can be passed only to relevant children (see use in Node.render())
 *
 * @param {Node} node
 * @param {List} decorations
 * @return {Array<Item>}
 *
 * where type Item =
 * {
 *   child: Node,
 *   // Index of the child in its parent
 *   index: number
 * }
 * or {
 *   // True if this represents the start of the given decoration
 *   isRangeStart: boolean,
 *   // True if this represents the end of the given decoration
 *   isRangeEnd: boolean,
 *   decoration: Range
 * }
 */

function orderChildDecorations(node, decorations) {
  if (decorations.isEmpty()) {
    return node.nodes.toArray().map(function (child, index) {
      return {
        child: child,
        index: index
      };
    });
  }

  // Map each key to its global order
  var keyOrders = defineProperty({}, node.key, 0);
  var globalOrder = 1;

  node.forEachDescendant(function (child) {
    keyOrders[child.key] = globalOrder;
    globalOrder = globalOrder + 1;
  });

  var childNodes = node.nodes.toArray();

  var endPoints = childNodes.map(function (child, index) {
    return {
      child: child,
      index: index,
      order: keyOrders[child.key]
    };
  });

  decorations.forEach(function (decoration) {
    // Range start.
    // A rangeStart should be before the child containing its startKey, in order
    // to consider it active before going down the child.
    var startKeyOrder = keyOrders[decoration.start.key];
    var containingChildOrder = startKeyOrder === undefined ? 0 : getContainingChildOrder(childNodes, keyOrders, startKeyOrder);

    endPoints.push({
      isRangeStart: true,
      order: containingChildOrder - 0.5,
      decoration: decoration
    });

    // Range end.
    var endKeyOrder = (keyOrders[decoration.end.key] || globalOrder) + 0.5;

    endPoints.push({
      isRangeEnd: true,
      order: endKeyOrder,
      decoration: decoration
    });
  });

  return endPoints.sort(function (a, b) {
    return a.order > b.order ? 1 : -1;
  });
}

/*
 * Returns the key order of the child right before the given order.
 */

function getContainingChildOrder(children, keyOrders, order) {
  // Find the first child that is after the given key
  var nextChildIndex = children.findIndex(function (child) {
    return order < keyOrders[child.key];
  });

  if (nextChildIndex <= 0) {
    return 0;
  }

  var containingChild = children[nextChildIndex - 1];
  return keyOrders[containingChild.key];
}

/**
 * Debug.
 *
 * @type {Function}
 */

var debug$6 = Debug('slate:node');

/**
 * Node.
 *
 * @type {Component}
 */

var Node$1 = function (_React$Component) {
  inherits(Node$$1, _React$Component);

  function Node$$1() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, Node$$1);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = Node$$1.__proto__ || Object.getPrototypeOf(Node$$1)).call.apply(_ref, [this].concat(args))), _this), _initialiseProps$3.call(_this), _temp), possibleConstructorReturn(_this, _ret);
  }
  /**
   * Property types.
   *
   * @type {Object}
   */

  /**
   * Debug.
   *
   * @param {String} message
   * @param {Mixed} ...args
   */

  createClass(Node$$1, [{
    key: 'shouldComponentUpdate',


    /**
     * Should the node update?
     *
     * @param {Object} nextProps
     * @param {Object} value
     * @return {Boolean}
     */

    value: function shouldComponentUpdate(nextProps) {
      var props = this.props;
      var editor = props.editor;

      var shouldUpdate = editor.run('shouldNodeComponentUpdate', props, nextProps);
      var n = nextProps;
      var p = props;

      // If the `Component` has a custom logic to determine whether the component
      // needs to be updated or not, return true if it returns true. If it returns
      // false, we need to ignore it, because it shouldn't be allowed it.
      if (shouldUpdate != null) {
        if (shouldUpdate) {
          return true;
        }

        warning(shouldUpdate !== false, "Returning false in `shouldNodeComponentUpdate` does not disable Slate's internal `shouldComponentUpdate` logic. If you want to prevent updates, use React's `shouldComponentUpdate` instead.");
      }

      // If the `readOnly` status has changed, re-render in case there is any
      // user-land logic that depends on it, like nested editable contents.
      if (n.readOnly !== p.readOnly) return true;

      // If the node has changed, update. PERF: There are cases where it will have
      // changed, but it's properties will be exactly the same (eg. copy-paste)
      // which this won't catch. But that's rare and not a drag on performance, so
      // for simplicity we just let them through.
      if (n.node !== p.node) return true;

      // If the selection value of the node or of some of its children has changed,
      // re-render in case there is any user-land logic depends on it to render.
      // if the node is selected update it, even if it was already selected: the
      // selection value of some of its children could have been changed and they
      // need to be rendered again.
      if (n.isSelected || p.isSelected) return true;
      if (n.isFocused || p.isFocused) return true;

      // If the decorations have changed, update.
      if (!n.decorations.equals(p.decorations)) return true;

      // Otherwise, don't update.
      return false;
    }

    /**
     * Render.
     *
     * @return {Element}
     */

  }, {
    key: 'render',
    value: function render() {
      var _this2 = this;

      this.debug('render', this);
      var _props = this.props,
          editor = _props.editor,
          isSelected = _props.isSelected,
          isFocused = _props.isFocused,
          node = _props.node,
          decorations = _props.decorations,
          parent = _props.parent,
          readOnly = _props.readOnly;
      var value = editor.value;
      var selection = value.selection;

      var indexes = node.getSelectionIndexes(selection, isSelected);
      var decs = decorations.concat(node.getDecorations(editor));
      var childrenDecorations = getChildrenDecorations(node, decs);
      var children = [];

      node.nodes.forEach(function (child, i) {
        var isChildSelected = !!indexes && indexes.start <= i && i < indexes.end;

        children.push(_this2.renderNode(child, isChildSelected, childrenDecorations[i]));
      });

      // Attributes that the developer must mix into the element in their
      // custom node renderer component.
      var attributes = { 'data-key': node.key

        // If it's a block node with inline children, add the proper `dir` attribute
        // for text direction.
      };if (node.isLeafBlock()) {
        var direction = node.getTextDirection();
        if (direction === 'rtl') attributes.dir = 'rtl';
      }

      var props = {
        key: node.key,
        editor: editor,
        isFocused: isFocused,
        isSelected: isSelected,
        node: node,
        parent: parent,
        readOnly: readOnly
      };

      var element = editor.run('renderNode', _extends({}, props, {
        attributes: attributes,
        children: children
      }));

      return editor.query('isVoid', node) ? React.createElement(
        Void,
        this.props,
        element
      ) : element;
    }

    /**
     * Render a `child` node.
     *
     * @param {Node} child
     * @param {Boolean} isSelected
     * @param {Array<Decoration>} decorations
     * @return {Element}
     */

  }]);
  return Node$$1;
}(React.Component);

/**
 * Export.
 *
 * @type {Component}
 */

Node$1.propTypes = {
  block: SlateTypes.block,
  decorations: ImmutableTypes.list.isRequired,
  editor: Types.object.isRequired,
  isFocused: Types.bool.isRequired,
  isSelected: Types.bool.isRequired,
  node: SlateTypes.node.isRequired,
  parent: SlateTypes.node.isRequired,
  readOnly: Types.bool.isRequired };

var _initialiseProps$3 = function _initialiseProps() {
  var _this3 = this;

  this.debug = function (message) {
    for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
      args[_key2 - 1] = arguments[_key2];
    }

    var node = _this3.props.node;
    var key = node.key,
        type = node.type;

    debug$6.apply(undefined, [message, key + ' (' + type + ')'].concat(args));
  };

  this.renderNode = function (child, isSelected, decorations) {
    var _props2 = _this3.props,
        block = _props2.block,
        editor = _props2.editor,
        node = _props2.node,
        readOnly = _props2.readOnly,
        isFocused = _props2.isFocused;

    var Component = child.object === 'text' ? Text : Node$1;

    return React.createElement(Component, {
      block: node.object === 'block' ? node : block,
      decorations: decorations,
      editor: editor,
      isSelected: isSelected,
      isFocused: isFocused && isSelected,
      key: child.key,
      node: child,
      parent: node,
      readOnly: readOnly
    });
  };
};

/**
 * Find a native DOM range Slate `range`.
 *
 * @param {Range} range
 * @param {Window} win (optional)
 * @return {Object|Null}
 */

function findDOMRange(range) {
  var win = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : window;
  var anchor = range.anchor,
      focus = range.focus,
      isBackward$$1 = range.isBackward,
      isCollapsed = range.isCollapsed;

  var domAnchor = findDOMPoint(anchor, win);
  var domFocus = isCollapsed ? domAnchor : findDOMPoint(focus, win);

  if (!domAnchor || !domFocus) return null;

  var r = win.document.createRange();
  var start = isBackward$$1 ? domFocus : domAnchor;
  var end = isBackward$$1 ? domAnchor : domFocus;
  r.setStart(start.node, start.offset);
  r.setEnd(end.node, end.offset);
  return r;
}

/**
 * CSS overflow values that would cause scrolling.
 *
 * @type {Array}
 */

var OVERFLOWS = ['auto', 'overlay', 'scroll'];

/**
 * Detect whether we are running IOS version 11
 */

var IS_IOS_11 = IS_IOS && !!window.navigator.userAgent.match(/os 11_/i);

/**
 * Find the nearest parent with scrolling, or window.
 *
 * @param {el} Element
 */

function findScrollContainer(el, window) {
  var parent = el.parentNode;
  var scroller = void 0;

  while (!scroller) {
    if (!parent.parentNode) break;

    var style = window.getComputedStyle(parent);
    var overflowY = style.overflowY;


    if (OVERFLOWS.includes(overflowY)) {
      scroller = parent;
      break;
    }

    parent = parent.parentNode;
  }

  // COMPAT: Because Chrome does not allow doucment.body.scrollTop, we're
  // assuming that window.scrollTo() should be used if the scrollable element
  // turns out to be document.body or document.documentElement. This will work
  // unless body is intentionally set to scrollable by restricting its height
  // (e.g. height: 100vh).
  if (!scroller) {
    return window.document.body;
  }

  return scroller;
}

/**
 * Scroll the current selection's focus point into view if needed.
 *
 * @param {Selection} selection
 */

function scrollToSelection(selection) {
  if (IS_IOS_11) return;
  if (!selection.anchorNode) return;

  var window = getWindow(selection.anchorNode);
  var scroller = findScrollContainer(selection.anchorNode, window);
  var isWindow = scroller === window.document.body || scroller === window.document.documentElement;
  var backward = isBackward(selection);

  var range = selection.getRangeAt(0).cloneRange();
  range.collapse(backward);
  var cursorRect = range.getBoundingClientRect();

  // COMPAT: range.getBoundingClientRect() returns 0s in Safari when range is
  // collapsed. Expanding the range by 1 is a relatively effective workaround
  // for vertical scroll, although horizontal may be off by 1 character.
  // https://bugs.webkit.org/show_bug.cgi?id=138949
  // https://bugs.chromium.org/p/chromium/issues/detail?id=435438
  if (IS_SAFARI) {
    if (range.collapsed && cursorRect.top === 0 && cursorRect.height === 0) {
      if (range.startOffset === 0) {
        range.setEnd(range.endContainer, 1);
      } else {
        range.setStart(range.startContainer, range.startOffset - 1);
      }

      cursorRect = range.getBoundingClientRect();

      if (cursorRect.top === 0 && cursorRect.height === 0) {
        if (range.getClientRects().length) {
          cursorRect = range.getClientRects()[0];
        }
      }
    }
  }

  var width = void 0;
  var height = void 0;
  var yOffset = void 0;
  var xOffset = void 0;
  var scrollerTop = 0;
  var scrollerLeft = 0;
  var scrollerBordersY = 0;
  var scrollerBordersX = 0;
  var scrollerPaddingTop = 0;
  var scrollerPaddingBottom = 0;
  var scrollerPaddingLeft = 0;
  var scrollerPaddingRight = 0;

  if (isWindow) {
    var innerWidth = window.innerWidth,
        innerHeight = window.innerHeight,
        pageYOffset = window.pageYOffset,
        pageXOffset = window.pageXOffset;

    width = innerWidth;
    height = innerHeight;
    yOffset = pageYOffset;
    xOffset = pageXOffset;
  } else {
    var offsetWidth = scroller.offsetWidth,
        offsetHeight = scroller.offsetHeight,
        scrollTop = scroller.scrollTop,
        scrollLeft = scroller.scrollLeft;

    var _window$getComputedSt = window.getComputedStyle(scroller),
        borderTopWidth = _window$getComputedSt.borderTopWidth,
        borderBottomWidth = _window$getComputedSt.borderBottomWidth,
        borderLeftWidth = _window$getComputedSt.borderLeftWidth,
        borderRightWidth = _window$getComputedSt.borderRightWidth,
        paddingTop = _window$getComputedSt.paddingTop,
        paddingBottom = _window$getComputedSt.paddingBottom,
        paddingLeft = _window$getComputedSt.paddingLeft,
        paddingRight = _window$getComputedSt.paddingRight;

    var scrollerRect = scroller.getBoundingClientRect();
    width = offsetWidth;
    height = offsetHeight;
    scrollerTop = scrollerRect.top + parseInt(borderTopWidth, 10);
    scrollerLeft = scrollerRect.left + parseInt(borderLeftWidth, 10);

    scrollerBordersY = parseInt(borderTopWidth, 10) + parseInt(borderBottomWidth, 10);

    scrollerBordersX = parseInt(borderLeftWidth, 10) + parseInt(borderRightWidth, 10);

    scrollerPaddingTop = parseInt(paddingTop, 10);
    scrollerPaddingBottom = parseInt(paddingBottom, 10);
    scrollerPaddingLeft = parseInt(paddingLeft, 10);
    scrollerPaddingRight = parseInt(paddingRight, 10);
    yOffset = scrollTop;
    xOffset = scrollLeft;
  }

  var cursorTop = cursorRect.top + yOffset - scrollerTop;
  var cursorLeft = cursorRect.left + xOffset - scrollerLeft;

  var x = xOffset;
  var y = yOffset;

  if (cursorLeft < xOffset) {
    // selection to the left of viewport
    x = cursorLeft - scrollerPaddingLeft;
  } else if (cursorLeft + cursorRect.width + scrollerBordersX > xOffset + width) {
    // selection to the right of viewport
    x = cursorLeft + scrollerBordersX + scrollerPaddingRight - width;
  }

  if (cursorTop < yOffset) {
    // selection above viewport
    y = cursorTop - scrollerPaddingTop;
  } else if (cursorTop + cursorRect.height + scrollerBordersY > yOffset + height) {
    // selection below viewport
    y = cursorTop + scrollerBordersY + scrollerPaddingBottom + cursorRect.height - height;
  }

  if (isWindow) {
    window.scrollTo(x, y);
  } else {
    scroller.scrollTop = y;
    scroller.scrollLeft = x;
  }
}

var FIREFOX_NODE_TYPE_ACCESS_ERROR = /Permission denied to access property "nodeType"/;

/**
 * Debug.
 *
 * @type {Function}
 */

var debug$7 = Debug('slate:content');

/**
 * Separate debug to easily see when the DOM has updated either by render or
 * changing selection.
 *
 * @type {Function}
 */

debug$7.update = Debug('slate:update');

/**
 * Content.
 *
 * @type {Component}
 */

var Content = function (_React$Component) {
  inherits(Content, _React$Component);

  function Content() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, Content);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = Content.__proto__ || Object.getPrototypeOf(Content)).call.apply(_ref, [this].concat(args))), _this), _this.tmp = {
      isUpdatingSelection: false

      /**
       * Create a set of bound event handlers.
       *
       * @type {Object}
       */

    }, _this.handlers = EVENT_HANDLERS.reduce(function (obj, handler) {
      obj[handler] = function (event) {
        return _this.onEvent(handler, event);
      };
      return obj;
    }, {}), _this.updateSelection = function () {
      var editor = _this.props.editor;
      var value = editor.value;
      var selection = value.selection;
      var isBackward$$1 = selection.isBackward;

      var window = getWindow(_this.element);
      var native = window.getSelection();
      var activeElement = window.document.activeElement;

      // COMPAT: In Firefox, there's a but where `getSelection` can return `null`.
      // https://bugzilla.mozilla.org/show_bug.cgi?id=827585 (2018/11/07)
      // or the IME is turned on and is composing

      if (!native || editor.isComposing()) {
        return;
      }

      if (debug$7.enabled) {
        debug$7.update('updateSelection', { selection: selection.toJSON() });
      }

      var rangeCount = native.rangeCount,
          anchorNode = native.anchorNode;

      var updated = false;

      // If the Slate selection is blurred, but the DOM's active element is still
      // the editor, we need to blur it.
      if (selection.isBlurred && activeElement === _this.element) {
        _this.element.blur();
        updated = true;
      }

      // If the Slate selection is unset, but the DOM selection has a range
      // selected in the editor, we need to remove the range.
      if (selection.isUnset && rangeCount && _this.isInEditor(anchorNode)) {
        removeAllRanges(native);
        updated = true;
      }

      // If the Slate selection is focused, but the DOM's active element is not
      // the editor, we need to focus it. We prevent scrolling because we handle
      // scrolling to the correct selection.
      if (selection.isFocused && activeElement !== _this.element) {
        _this.element.focus({ preventScroll: true });
        updated = true;
      }

      // Otherwise, figure out which DOM nodes should be selected...
      if (selection.isFocused && selection.isSet) {
        var current = !!rangeCount && native.getRangeAt(0);
        var range = findDOMRange(selection, window);

        if (!range) {
          warning(false, 'Unable to find a native DOM range from the current selection.');

          return;
        }

        var startContainer = range.startContainer,
            startOffset = range.startOffset,
            endContainer = range.endContainer,
            endOffset = range.endOffset;

        // If the new range matches the current selection, there is nothing to fix.
        // COMPAT: The native `Range` object always has it's "start" first and "end"
        // last in the DOM. It has no concept of "backwards/forwards", so we have
        // to check both orientations here. (2017/10/31)

        if (current) {
          if (startContainer === current.startContainer && startOffset === current.startOffset && endContainer === current.endContainer && endOffset === current.endOffset || startContainer === current.endContainer && startOffset === current.endOffset && endContainer === current.startContainer && endOffset === current.startOffset) {
            return;
          }
        }

        // Otherwise, set the `isUpdatingSelection` flag and update the selection.
        updated = true;
        _this.tmp.isUpdatingSelection = true;
        removeAllRanges(native);

        // COMPAT: IE 11 does not support `setBaseAndExtent`. (2018/11/07)
        if (native.setBaseAndExtent) {
          // COMPAT: Since the DOM range has no concept of backwards/forwards
          // we need to check and do the right thing here.
          if (isBackward$$1) {
            native.setBaseAndExtent(range.endContainer, range.endOffset, range.startContainer, range.startOffset);
          } else {
            native.setBaseAndExtent(range.startContainer, range.startOffset, range.endContainer, range.endOffset);
          }
        } else {
          native.addRange(range);
        }

        // Scroll to the selection, in case it's out of view.
        scrollToSelection(native);

        // Then unset the `isUpdatingSelection` flag after a delay, to ensure that
        // it is still set when selection-related events from updating it fire.
        setTimeout(function () {
          // COMPAT: In Firefox, it's not enough to create a range, you also need
          // to focus the contenteditable element too. (2016/11/16)
          if (IS_FIREFOX && _this.element) {
            _this.element.focus();
          }

          _this.tmp.isUpdatingSelection = false;
        });
      }

      if (updated) {
        debug$7('updateSelection', { selection: selection, native: native, activeElement: activeElement });
        debug$7.update('updateSelection-applied', { selection: selection });
      }
    }, _this.ref = function (element) {
      _this.element = element;
    }, _this.isInEditor = function (target) {
      var _this2 = _this,
          element = _this2.element;


      var el = void 0;

      try {
        // COMPAT: In Firefox, sometimes the node can be comment which doesn't
        // have .closest and it crashes.
        if (target.nodeType === 8) {
          return false;
        }

        // COMPAT: Text nodes don't have `isContentEditable` property. So, when
        // `target` is a text node use its parent node for check.
        el = target.nodeType === 3 ? target.parentNode : target;
      } catch (err) {
        // COMPAT: In Firefox, `target.nodeType` will throw an error if target is
        // originating from an internal "restricted" element (e.g. a stepper
        // arrow on a number input)
        // see github.com/ianstormtaylor/slate/issues/1819
        if (IS_FIREFOX && FIREFOX_NODE_TYPE_ACCESS_ERROR.test(err.message)) {
          return false;
        }

        throw err;
      }

      return el.isContentEditable && (el === element || el.closest('[data-slate-editor]') === element);
    }, _this.onNativeSelectionChange = throttle(function (event) {
      if (_this.props.readOnly) return;

      var window = getWindow(event.target);
      var activeElement = window.document.activeElement;

      if (activeElement !== _this.element) return;

      _this.props.onEvent('onSelect', event);
    }, 100), _this.renderNode = function (child, isSelected, decorations) {
      var _this$props = _this.props,
          editor = _this$props.editor,
          readOnly = _this$props.readOnly;
      var value = editor.value;
      var document = value.document,
          selection = value.selection;
      var isFocused = selection.isFocused;


      return React.createElement(Node$1, {
        block: null,
        editor: editor,
        decorations: decorations,
        isSelected: isSelected,
        isFocused: isFocused && isSelected,
        key: child.key,
        node: child,
        parent: document,
        readOnly: readOnly
      });
    }, _temp), possibleConstructorReturn(_this, _ret);
  }
  /**
   * Property types.
   *
   * @type {Object}
   */

  /**
   * Default properties.
   *
   * @type {Object}
   */

  /**
   * Temporary values.
   *
   * @type {Object}
   */

  createClass(Content, [{
    key: 'componentDidMount',


    /**
     * When the editor first mounts in the DOM we need to:
     *
     *   - Add native DOM event listeners.
     *   - Update the selection, in case it starts focused.
     */

    value: function componentDidMount() {
      var window = getWindow(this.element);

      window.document.addEventListener('selectionchange', this.onNativeSelectionChange);

      // COMPAT: Restrict scope of `beforeinput` to clients that support the
      // Input Events Level 2 spec, since they are preventable events.
      if (HAS_INPUT_EVENTS_LEVEL_2) {
        this.element.addEventListener('beforeinput', this.handlers.onBeforeInput);
      }

      this.updateSelection();
    }

    /**
     * When unmounting, remove DOM event listeners.
     */

  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var window = getWindow(this.element);

      if (window) {
        window.document.removeEventListener('selectionchange', this.onNativeSelectionChange);
      }

      if (HAS_INPUT_EVENTS_LEVEL_2) {
        this.element.removeEventListener('beforeinput', this.handlers.onBeforeInput);
      }
    }

    /**
     * On update, update the selection.
     */

  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      debug$7.update('componentDidUpdate');
      this.updateSelection();
    }

    /**
     * Update the native DOM selection to reflect the internal model.
     */

    /**
     * The React ref method to set the root content element locally.
     *
     * @param {Element} element
     */

    /**
     * Check if an event `target` is fired from within the contenteditable
     * element. This should be false for edits happening in non-contenteditable
     * children, such as void nodes and other nested Slate editors.
     *
     * @param {Element} target
     * @return {Boolean}
     */

  }, {
    key: 'onEvent',


    /**
     * On `event` with `handler`.
     *
     * @param {String} handler
     * @param {Event} event
     */

    value: function onEvent(handler, event) {
      debug$7('onEvent', handler);

      // Ignore `onBlur`, `onFocus` and `onSelect` events generated
      // programmatically while updating selection.
      if (this.tmp.isUpdatingSelection && (handler === 'onSelect' || handler === 'onBlur' || handler === 'onFocus')) {
        return;
      }

      // COMPAT: There are situations where a select event will fire with a new
      // native selection that resolves to the same internal position. In those
      // cases we don't need to trigger any changes, since our internal model is
      // already up to date, but we do want to update the native selection again
      // to make sure it is in sync. (2017/10/16)
      //
      // ANDROID: The updateSelection causes issues in Android when you are
      // at the end of a block. The selection ends up to the left of the inserted
      // character instead of to the right. This behavior continues even if
      // you enter more than one character. (2019/01/03)
      if (!IS_ANDROID && handler === 'onSelect') {
        var editor = this.props.editor;
        var value = editor.value;
        var selection = value.selection;

        var window = getWindow(event.target);
        var native = window.getSelection();
        var range = findRange(native, editor);

        if (range && range.equals(selection.toRange())) {
          this.updateSelection();
          return;
        }
      }

      // Don't handle drag and drop events coming from embedded editors.
      if (handler === 'onDragEnd' || handler === 'onDragEnter' || handler === 'onDragExit' || handler === 'onDragLeave' || handler === 'onDragOver' || handler === 'onDragStart' || handler === 'onDrop') {
        var closest = event.target.closest('[data-slate-editor]');

        if (closest !== this.element) {
          return;
        }
      }

      // Some events require being in editable in the editor, so if the event
      // target isn't, ignore them.
      if (handler === 'onBeforeInput' || handler === 'onBlur' || handler === 'onCompositionEnd' || handler === 'onCompositionStart' || handler === 'onCopy' || handler === 'onCut' || handler === 'onFocus' || handler === 'onInput' || handler === 'onKeyDown' || handler === 'onKeyUp' || handler === 'onPaste' || handler === 'onSelect') {
        if (!this.isInEditor(event.target)) {
          return;
        }
      }

      this.props.onEvent(handler, event);
    }

    /**
     * On native `selectionchange` event, trigger the `onSelect` handler. This is
     * needed to account for React's `onSelect` being non-standard and not firing
     * until after a selection has been released. This causes issues in situations
     * where another change happens while a selection is being made.
     *
     * @param {Event} event
     */

  }, {
    key: 'render',


    /**
     * Render the editor content.
     *
     * @return {Element}
     */

    value: function render() {
      var _this3 = this;

      var props = this.props,
          handlers = this.handlers;
      var id = props.id,
          className = props.className,
          readOnly = props.readOnly,
          editor = props.editor,
          tabIndex = props.tabIndex,
          role = props.role,
          tagName = props.tagName,
          spellCheck = props.spellCheck;
      var value = editor.value;

      var Container = tagName;
      var document = value.document,
          selection = value.selection,
          decorations = value.decorations;

      var indexes = document.getSelectionIndexes(selection);
      var decs = document.getDecorations(editor).concat(decorations);
      var childrenDecorations = getChildrenDecorations(document, decs);

      var children = document.nodes.toArray().map(function (child, i) {
        var isSelected = !!indexes && indexes.start <= i && i < indexes.end;

        return _this3.renderNode(child, isSelected, childrenDecorations[i]);
      });

      var style = _extends({
        // Prevent the default outline styles.
        outline: 'none',
        // Preserve adjacent whitespace and new lines.
        whiteSpace: 'pre-wrap',
        // Allow words to break if they are too long.
        wordWrap: 'break-word'
      }, readOnly ? {} : { WebkitUserModify: 'read-write-plaintext-only' }, props.style);

      debug$7('render', { props: props });

      debug$7.update('render', {
        text: value.document.text,
        selection: value.selection.toJSON(),
        value: value.toJSON()
      });

      return React.createElement(
        Container,
        _extends({}, handlers, {
          'data-slate-editor': true,
          ref: this.ref,
          'data-key': document.key,
          contentEditable: readOnly ? null : true,
          suppressContentEditableWarning: true,
          id: id,
          className: className,
          autoCorrect: props.autoCorrect ? 'on' : 'off',
          spellCheck: spellCheck,
          style: style,
          role: readOnly ? null : role || 'textbox',
          tabIndex: tabIndex
          // COMPAT: The Grammarly Chrome extension works by changing the DOM out
          // from under `contenteditable` elements, which leads to weird behaviors
          // so we have to disable it like this. (2017/04/24)
          , 'data-gramm': false
        }),
        children
      );
    }

    /**
     * Render a `child` node of the document.
     *
     * @param {Node} child
     * @param {Boolean} isSelected
     * @return {Element}
     */

  }]);
  return Content;
}(React.Component);

/**
 * Export.
 *
 * @type {Component}
 */

Content.propTypes = {
  autoCorrect: Types.bool.isRequired,
  className: Types.string,
  editor: Types.object.isRequired,
  id: Types.string,
  readOnly: Types.bool.isRequired,
  role: Types.string,
  spellCheck: Types.bool.isRequired,
  style: Types.object,
  tabIndex: Types.number,
  tagName: Types.string };
Content.defaultProps = {
  style: {},
  tagName: 'div' };

/**
 * Props that can be defined by plugins.
 *
 * @type {Array}
 */

var PROPS = [].concat(toConsumableArray(EVENT_HANDLERS), ['commands', 'decorateNode', 'queries', 'renderEditor', 'renderMark', 'renderNode', 'schema']);

/**
 * A plugin that adds the React-specific rendering logic to the editor.
 *
 * @param {Object} options
 * @return {Object}
 */

function ReactPlugin() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var placeholder = options.placeholder,
      _options$plugins = options.plugins,
      plugins = _options$plugins === undefined ? [] : _options$plugins;

  /**
   * Decorate node.
   *
   * @param {Object} node
   * @param {Editor} editor
   * @param {Function} next
   * @return {Array}
   */

  function decorateNode(node, editor, next) {
    return [];
  }

  /**
   * Render editor.
   *
   * @param {Object} props
   * @param {Editor} editor
   * @param {Function} next
   * @return {Element}
   */

  function renderEditor(props, editor, next) {
    return React.createElement(Content, {
      autoCorrect: props.autoCorrect,
      className: props.className,
      editor: editor,
      id: props.id,
      onEvent: function onEvent(handler, event) {
        return editor.run(handler, event);
      },
      readOnly: props.readOnly,
      role: props.role,
      spellCheck: props.spellCheck,
      style: props.style,
      tabIndex: props.tabIndex,
      tagName: props.tagName
    });
  }

  /**
   * Render node.
   *
   * @param {Object} props
   * @param {Editor} editor
   * @param {Function} next
   * @return {Element}
   */

  function renderNode(props, editor, next) {
    var attributes = props.attributes,
        children = props.children,
        node = props.node;
    var object = node.object;

    if (object !== 'block' && object !== 'inline') return null;

    var Tag = object === 'block' ? 'div' : 'span';
    var style = { position: 'relative' };
    return React.createElement(
      Tag,
      _extends({}, attributes, { style: style }),
      children
    );
  }

  /**
   * Return the plugins.
   *
   * @type {Array}
   */

  var ret = [];
  var editorPlugin = PROPS.reduce(function (memo, prop) {
    if (prop in options) memo[prop] = options[prop];
    return memo;
  }, {});

  ret.push(DOMPlugin({
    plugins: [editorPlugin].concat(toConsumableArray(plugins))
  }));

  if (placeholder) {
    ret.push(PlaceholderPlugin({
      placeholder: placeholder,
      when: function when(editor, node) {
        return node.object === 'document' && node.text === '' && node.nodes.size === 1 && node.getTexts().size === 1;
      }
    }));
  }

  ret.push({
    decorateNode: decorateNode,
    renderEditor: renderEditor,
    renderNode: renderNode
  });

  return ret;
}

/**
 * Debug.
 *
 * @type {Function}
 */

var debug$8 = Debug('slate:editor');

/**
 * Editor.
 *
 * @type {Component}
 */

var Editor$1 = function (_React$Component) {
  inherits(Editor$$1, _React$Component);

  function Editor$$1() {
    var _ref;

    var _temp, _this, _ret;

    classCallCheck(this, Editor$$1);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return _ret = (_temp = (_this = possibleConstructorReturn(this, (_ref = Editor$$1.__proto__ || Object.getPrototypeOf(Editor$$1)).call.apply(_ref, [this].concat(args))), _this), _this.state = { value: _this.props.defaultValue

      /**
       * Temporary values.
       *
       * @type {Object}
       */

    }, _this.tmp = {
      mounted: false,
      change: null,
      resolves: 0,
      updates: 0

      /**
       * When the component first mounts, flush a queued change if one exists.
       */

    }, _this.resolveController = memoizeOne(function () {
      warning(_this.tmp.resolves < 5 || _this.tmp.resolves !== _this.tmp.updates, 'A Slate <Editor> component is re-resolving the `plugins`, `schema`, `commands`, `queries` or `placeholder` prop on each update, which leads to poor performance. This is often due to passing in a new references for these props with each render by declaring them inline in your render function. Do not do this! Declare them outside your render function, or memoize them instead.');

      _this.tmp.resolves++;
      var react = ReactPlugin(_extends({}, _this.props, {
        value: _this.props.value || _this.state.value
      }));

      var onChange = function onChange(change) {
        if (_this.tmp.mounted) {
          _this.handleChange(change);
        } else {
          _this.tmp.change = change;
        }
      };

      _this.controller = new Editor({ plugins: [react], onChange: onChange }, { controller: _this, construct: false });

      _this.controller.run('onConstruct');
    }), _temp), possibleConstructorReturn(_this, _ret);
  }
  /**
   * Property types.
   *
   * @type {Object}
   */

  /**
   * Default properties.
   *
   * @type {Object}
   */

  /**
   * Initial state.
   *
   * @type {Object}
   */

  createClass(Editor$$1, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.tmp.mounted = true;
      this.tmp.updates++;

      if (this.props.autoFocus) {
        this.focus();
      }

      if (this.tmp.change) {
        this.handleChange(this.tmp.change);
        this.tmp.change = null;
      }
    }

    /**
     * When the component updates, flush a queued change if one exists.
     */

  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {
      this.tmp.updates++;

      if (this.tmp.change) {
        this.handleChange(this.tmp.change);
        this.tmp.change = null;
      }
    }

    /**
     * When the component unmounts, make sure async commands don't trigger react updates.
     */

  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.tmp.mounted = false;
    }

    /**
     * Render the editor.
     *
     * @return {Element}
     */

  }, {
    key: 'render',
    value: function render() {
      debug$8('render', this);
      var props = _extends({}, this.props, { editor: this

        // Re-resolve the controller if needed based on memoized props.
      });var commands = props.commands,
          placeholder = props.placeholder,
          plugins = props.plugins,
          queries = props.queries,
          schema = props.schema;

      this.resolveController(plugins, schema, commands, queries, placeholder);

      // Set the current props on the controller.
      var options = props.options,
          readOnly = props.readOnly,
          valueFromProps = props.value;
      var valueFromState = this.state.value;

      var value = valueFromProps || valueFromState;
      this.controller.setReadOnly(readOnly);
      this.controller.setValue(value, options);

      // Render the editor's children with the controller.
      var children = this.controller.run('renderEditor', _extends({}, props, {
        value: value
      }));
      return children;
    }

    /**
     * Resolve an editor controller from the passed-in props. This method takes
     * all of the props as individual arguments to be able to properly memoize
     * against anything that could change and invalidate the old editor.
     *
     * @param {Array} plugins
     * @param {Object} schema
     * @param {Object} commands
     * @param {Object} queries
     * @param {String} placeholder
     * @return {Editor}
     */

  }, {
    key: 'handleChange',
    value: function handleChange(change) {
      var onChange = this.props.onChange;
      var value = this.state.value;


      if (value) {
        // Syncing value inside this component since parent does not want control of it (defaultValue was used)
        this.setState({ value: change.value });
      }

      onChange(change);
    }

    /**
     * Mimic the API of the `Editor` controller, so that this component instance
     * can be passed in its place to plugins.
     */

  }, {
    key: 'applyOperation',
    value: function applyOperation() {
      var _controller;

      return (_controller = this.controller).applyOperation.apply(_controller, arguments);
    }
  }, {
    key: 'command',
    value: function command() {
      var _controller2;

      return (_controller2 = this.controller).command.apply(_controller2, arguments);
    }
  }, {
    key: 'hasCommand',
    value: function hasCommand() {
      var _controller3;

      return (_controller3 = this.controller).hasCommand.apply(_controller3, arguments);
    }
  }, {
    key: 'hasQuery',
    value: function hasQuery() {
      var _controller4;

      return (_controller4 = this.controller).hasQuery.apply(_controller4, arguments);
    }
  }, {
    key: 'normalize',
    value: function normalize() {
      var _controller5;

      return (_controller5 = this.controller).normalize.apply(_controller5, arguments);
    }
  }, {
    key: 'query',
    value: function query() {
      var _controller6;

      return (_controller6 = this.controller).query.apply(_controller6, arguments);
    }
  }, {
    key: 'registerCommand',
    value: function registerCommand() {
      var _controller7;

      return (_controller7 = this.controller).registerCommand.apply(_controller7, arguments);
    }
  }, {
    key: 'registerQuery',
    value: function registerQuery() {
      var _controller8;

      return (_controller8 = this.controller).registerQuery.apply(_controller8, arguments);
    }
  }, {
    key: 'run',
    value: function run() {
      var _controller9;

      return (_controller9 = this.controller).run.apply(_controller9, arguments);
    }
  }, {
    key: 'withoutNormalizing',
    value: function withoutNormalizing() {
      var _controller10;

      return (_controller10 = this.controller).withoutNormalizing.apply(_controller10, arguments);
    }

    /**
     * Deprecated.
     */

  }, {
    key: 'call',
    value: function call() {
      var _controller11;

      return (_controller11 = this.controller).call.apply(_controller11, arguments);
    }
  }, {
    key: 'change',
    value: function change() {
      var _controller12;

      return (_controller12 = this.controller).change.apply(_controller12, arguments);
    }
  }, {
    key: 'onChange',
    value: function onChange() {
      var _controller13;

      return (_controller13 = this.controller).onChange.apply(_controller13, arguments);
    }
  }, {
    key: 'applyOperations',
    value: function applyOperations() {
      var _controller14;

      return (_controller14 = this.controller).applyOperations.apply(_controller14, arguments);
    }
  }, {
    key: 'setOperationFlag',
    value: function setOperationFlag() {
      var _controller15;

      return (_controller15 = this.controller).setOperationFlag.apply(_controller15, arguments);
    }
  }, {
    key: 'getFlag',
    value: function getFlag() {
      var _controller16;

      return (_controller16 = this.controller).getFlag.apply(_controller16, arguments);
    }
  }, {
    key: 'unsetOperationFlag',
    value: function unsetOperationFlag() {
      var _controller17;

      return (_controller17 = this.controller).unsetOperationFlag.apply(_controller17, arguments);
    }
  }, {
    key: 'withoutNormalization',
    value: function withoutNormalization() {
      var _controller18;

      return (_controller18 = this.controller).withoutNormalization.apply(_controller18, arguments);
    }
  }, {
    key: 'operations',
    get: function get$$1() {
      return this.controller.operations;
    }
  }, {
    key: 'readOnly',
    get: function get$$1() {
      return this.controller.readOnly;
    }
  }, {
    key: 'value',
    get: function get$$1() {
      return this.controller.value;
    }
  }, {
    key: 'editor',
    get: function get$$1() {
      return this.controller.editor;
    }
  }, {
    key: 'schema',
    get: function get$$1() {
      invariant(false, 'As of Slate 0.42, the `editor.schema` property no longer exists, and its functionality has been folded into the editor itself. Use the `editor` instead.');
    }
  }, {
    key: 'stack',
    get: function get$$1() {
      invariant(false, 'As of Slate 0.42, the `editor.stack` property no longer exists, and its functionality has been folded into the editor itself. Use the `editor` instead.');
    }
  }]);
  return Editor$$1;
}(React.Component);

/**
 * Export.
 *
 * @type {Component}
 */

Editor$1.propTypes = _extends({
  autoCorrect: Types.bool,
  autoFocus: Types.bool,
  className: Types.string,
  defaultValue: SlateTypes.value,
  id: Types.string,
  onChange: Types.func,
  options: Types.object,
  placeholder: Types.any,
  plugins: Types.array,
  readOnly: Types.bool,
  role: Types.string,
  schema: Types.object,
  spellCheck: Types.bool,
  style: Types.object,
  tabIndex: Types.number,
  value: SlateTypes.value
}, EVENT_HANDLERS.reduce(function (obj, handler) {
  obj[handler] = Types.func;
  return obj;
}, {}));
Editor$1.defaultProps = {
  autoFocus: false,
  autoCorrect: true,
  onChange: function onChange() {},
  options: {},
  placeholder: '',
  plugins: [],
  readOnly: false,
  schema: {},
  spellCheck: true };

var index = {
  Editor: Editor$1,
  cloneFragment: cloneFragment,
  findDOMNode: findDOMNode,
  findDOMRange: findDOMRange,
  findNode: findNode,
  findRange: findRange,
  getEventRange: getEventRange,
  getEventTransfer: getEventTransfer,
  setEventTransfer: setEventTransfer,
  ReactPlugin: ReactPlugin
};

export default index;
export { Editor$1 as Editor, cloneFragment, findDOMNode, findDOMRange, findNode, findRange, getEventRange, getEventTransfer, setEventTransfer, ReactPlugin };
//# sourceMappingURL=slate-react.es.js.map
