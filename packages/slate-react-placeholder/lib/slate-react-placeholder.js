'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = _interopDefault(require('react'));

var isProduction = "development" === 'production';
var prefix = 'Invariant failed';
var index = (function (condition, message) {
  if (condition) {
    return;
  }

  if (isProduction) {
    throw new Error(prefix);
  } else {
    throw new Error(prefix + ": " + (message || ''));
  }
});

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



































var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/*
 * Instance counter to enable unique marks for multiple Placeholder instances.
 */

var instanceCounter = 0;

/**
 * A plugin that renders a React placeholder for a given Slate node.
 *
 * @param {Object} options
 * @return {Object}
 */

function SlateReactPlaceholder() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  var instanceId = instanceCounter++;
  var placeholderMark = {
    type: 'placeholder',
    data: { key: instanceId }
  };

  var placeholder = options.placeholder,
      when = options.when,
      _options$style = options.style,
      style = _options$style === undefined ? {} : _options$style;


  index(placeholder, 'You must pass `SlateReactPlaceholder` an `options.placeholder` string.');

  index(when, 'You must pass `SlateReactPlaceholder` an `options.when` query.');

  /**
   * Decorate a match node with a placeholder mark when it fits the query.
   *
   * @param {Node} node
   * @param {Editor} editor
   * @param {Function} next
   * @return {Array}
   */

  function decorateNode(node, editor, next) {
    if (!editor.query(when, node)) {
      return next();
    }

    var others = next();
    var first = node.getFirstText();
    var last = node.getLastText();
    var decoration = {
      anchor: { key: first.key, offset: 0 },
      focus: { key: last.key, offset: last.text.length },
      mark: placeholderMark
    };

    return [].concat(toConsumableArray(others), [decoration]);
  }

  /**
   * Render an inline placeholder for the placeholder mark.
   *
   * @param {Object} props
   * @param {Editor} editor
   * @param {Function} next
   * @return {Element}
   */

  function renderMark(props, editor, next) {
    var children = props.children,
        mark = props.mark;


    if (mark.type === 'placeholder' && mark.data.get('key') === instanceId) {
      var placeHolderStyle = _extends({
        pointerEvents: 'none',
        display: 'inline-block',
        width: '0',
        maxWidth: '100%',
        whiteSpace: 'nowrap',
        opacity: '0.333'
      }, style);

      return React.createElement(
        'span',
        null,
        React.createElement(
          'span',
          { contentEditable: false, style: placeHolderStyle },
          placeholder
        ),
        children
      );
    }

    return next();
  }

  /**
   * Return the plugin.
   *
   * @return {Object}
   */

  return { decorateNode: decorateNode, renderMark: renderMark };
}

exports.default = SlateReactPlaceholder;
//# sourceMappingURL=slate-react-placeholder.js.map
