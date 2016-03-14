/*!
 * Sortie.js v0.2.0
 * An inoffensive table sorter for developers
 */
(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        // Node. Does not work with strict CommonJS, but only CommonJS-like
        // environments that support module.exports, like Node.
        module.exports = factory();
    } else {
        // Browser globals (root is window)
        root.Sortie = factory();
    }
}(this, function SortieConstructor() { // jscs:ignore requirePaddingNewLinesAfterBlocks
    'use strict';

    /**
     * Variable definitions
     */
    var defaults = {
        initialsort: -1,
        markers: {
            asc: '&#8595;',
            desc: '&#8593;',
            unsorted: '&#8597;'
        }
    };

    var compareFunctions = {};

    // A polyfill for Object.assign
    if (typeof Object.assign != 'function') {
      Object.assign = function(target) {
        if (target === undefined || target === null) {
          throw new TypeError('Cannot convert undefined or null to object');
        }

        var output = Object(target);
        for (var index = 1; index < arguments.length; index++) {
          var source = arguments[index];
          if (source !== undefined && source !== null) {
            for (var nextKey in source) {
              if (source.hasOwnProperty(nextKey)) {
                output[nextKey] = source[nextKey];
              }
            }
          }
        }
        return output;
      };
    }

    // A polyfill for textContent
    if (Object.defineProperty
      && Object.getOwnPropertyDescriptor
      && Object.getOwnPropertyDescriptor(Element.prototype, 'textContent')
      && !Object.getOwnPropertyDescriptor(Element.prototype, 'textContent').get) {
      var innerText = Object.getOwnPropertyDescriptor(Element.prototype, 'innerText');
      Object.defineProperty(Element.prototype, 'textContent', {
          get: function() {
            return innerText.get.call(this);
          },
          set: function(s) {
            return innerText.set.call(this, s);
          }
        }
      );
    }

    // A little internal data tracker
    var _data = (function() {
        var data = [];

        function getIndex($obj) {
            for (var index = 0, l = data.length; index < l; index++) {
                if (data[index].__obj === $obj) {
                    return index;
                }
            }

            // Otherwise, create the item
            data.push({__obj: $obj});
            return data.length - 1;
        }

        function get($obj, key) {
            var index = getIndex($obj);

            if (data[index] && data[index][key]) {
                return data[index][key];
            } else {
                return null;
            }
        }

        function set($obj, key, val) {
            var index = getIndex($obj);

            if (typeof data[index] === 'undefined') {
                data[index] = {};
            }

            data[index][key] = val;
        }

        return {
            get: get,
            set: set
        }
    }());

    /**
     * Reverse a string
     */
    function strReverse(str) {
        return str.split('').reverse().join('');
    }

    /**
     * Parse a date from a format
     * e.g. parseDate('1990-07-26 07:24', 'yyyy-mm-ss hh:ii')
     */
    function parseDate(str, format) {
        var parts = {};
        if (typeof format === 'undefined') format = 'yyyy-mm-dd';
        format.replace(/(dd|mm|yyyy|hh|ii)/g, function(match, type, start) {
            parts[type] = str.substr(start, type.length);
        });

        return new Date(
            parts.yyyy || 0,
            (parts.mm - 1) || 0,
            parts.dd || 1,
            parts.hh || 0,
            parts.ii || 0,
            parts.ss || 0
        );
    }

    /**
     * Get the text content of a node
     */
    function textContent(node) {
        return node.textContent;
    }

    function SortieInstance($table, options) {
        // Get the variables we'll be using in this sortie object
        var $body = $table.querySelector('tbody');
        var $headers = $table.querySelectorAll('thead th');
        var current;

        /**
        * Get the options object
        */
        function getOptions() {
            var dataAttr = $table.attributes;
            var dataOptions = {};
            for (var i = 0, l = dataAttr.length; i < l; i++) {
                var attr = dataAttr[i];

                if (attr.name.substr(0, 11) === 'data-sortie' && attr.name.length > 11) {
                    var normkey = attr.name.toLowerCase().replace(/-/g, '');
                    dataOptions[normkey.substr(11)] = attr.value;
                }
            }

            return Object.assign(true, {}, defaults, options, dataOptions);
        }

        /**
         * Initialise sortie
         */
        function init() {
            // Set the options object
            options = getOptions();

            // Determine the sort order
            var sorts;
            if (typeof options.sort !== 'undefined') {
                sorts = options.sort;
            } else {
                sorts = $table.getAttribute('data-sortie');
            }

            // If there's no suitable sorting string, drop out
            if (sorts === null) return false;

            // If the sorts were a string, turn them into an object
            if (typeof sorts === 'string') {
                sorts = sorts.split('|');
            }

            if (sorts.length > $headers.length) {
                console.error('Sortie config error: Too many sort columns specified');
            }

            // Add aria role-live settings and
            $table.setAttribute('aria-atomic', true);
            $table.setAttribute('aria-live', 'polite');
            $table.setAttribute('aria-relevant', 'all');

            // Generate an ID for the table
            if (!$table.getAttribute('id')) {
                $table.setAttribute('id', 'sortieTable' + (new Date() * 1));
            }

            // Add sortie specification to each column
            for (var col in sorts) {
                // Skip columns with no sort criteria
                if (!sorts[col]) continue;

                // Add a sorting icon to click
                var $button = document.createElement('button');
                $button.style.backgroundColor = 'transparent';
                $button.style.border = 'none';
                $button.innerHTML = options.markers.unsorted;
                $button.setAttribute('type', 'button');
                $button.setAttribute('aria-controls', $table.getAttribute('id'));

                var $header = $headers[col];
                $header.style.whiteSpace = 'nowrap';
                $header.style.cursor = 'pointer';
                $header.addEventListener('click', sortFactory(col));
                $header.setAttribute('data-sortie', true);
                _data.set($header, 'sortieCompareFunction', compareFactory(col, sorts[col]));
                //$header.setAttribute('data-sortieButton', $button);
                _data.set($header, 'sortieButton', $button);
                $header.appendChild(document.createTextNode(' '));
                $header.appendChild($button);
            }

            // Perform an initial sort
            if (options.initialsort !== false) {
                var opts = {};
                if (options.initialsort.toString().substr(-1, 1) === 'D') {
                    opts.dir = 'DESC';
                } else if (options.initialsort.toString().substr(-1, 1) === 'A') {
                    opts.dir = 'ASC';
                } else if (options.initialsort.toString() === '-1') {
                    for (var i = 0, l = sorts.length; i < l; i++) {
                        if (sorts[i]) {
                            options.initialsort = i;
                            break;
                        }
                    }
                }

                sort(options.initialsort, opts);
            }
        }

        // Factory for the sort function
        function sortFactory(col) {
            return function() {
                sort(col);
            }
        }

        /**
         * Sort the table by the given column
         */
        function sort(col, opts) {
            // Convert col to an integer
            col = parseInt(col, 10);

            var opts = Object.assign({}, opts);
            var $th = $headers[col];
            //var $btn = $th.getAttribute('data-sortieButton');
            var $btn = _data.get($th, 'sortieButton');
            var rows = Array.prototype.slice.call($body.querySelectorAll('tr'), 0);
            var dir = typeof opts.dir !== 'undefined' ? opts.dir : 'ASC';

            // Get the sort order
            if (current === col && _data.get($th, 'sortieDirection') === 'ASC' && typeof opts.dir == 'undefined') {
                dir = 'DESC';
            }

            // Save the new state
            current = col;
            _data.set($th, 'sortieDirection', dir);
            $th.setAttribute('aria-sort', dir.toLowerCase() + 'ending')

            // Perform the sort
            rows.sort(_data.get($th, 'sortieCompareFunction'));

            // Update the button's HTML
            if (dir === 'DESC') {
                $btn.innerHTML = options.markers.desc;
                rows = rows.reverse();
            } else {
                $btn.innerHTML = options.markers.asc;
            }

            // Update the other buttons
            //$headers.not($th).each(function(index, el) {
            for (var i = 0, l = $headers.length; i < l; i++) {
                var $el = $headers[i];
                // Only update "other" buttons
                if ($el === $th) continue;

                // Reset each button
                $el.removeAttribute('aria-sort');
                if ($el.getAttribute('data-sortie')) {
                    _data.get($el, 'sortieButton').innerHTML = options.markers.unsorted;
                }
            }

            // Update the content of the now-sorted table
            var frag = document.createDocumentFragment();

            for (var i in rows) {
                frag.appendChild(rows[i]);
            }

            // Put the now sorted rows back onto the page
            $body.innerHTML = '';
            $body.appendChild(frag);
        }

        /**
         * Return the suitable comparison function for the column
         */
        function compareFactory(col, sortSpec) {
            var bits = sortSpec.split(':');
            var operation = bits[0];
            var args = bits[1] ? bits[1].split(',') : [];
            var callback = compareFunctions[operation];

            if (typeof callback !== 'function') {
                console.error('Sortie error: comparison function not found for rule "' + operation + '"');
                var callback = function() {return 0};
            }

            return function compare(a, b) {
                var cellA = a.children[col];
                var cellB = b.children[col];

                var order = callback.call(window, cellA, cellB, args);

                // If asked to, reverse the search order
                return sortSpec.substr(1, 1) === 'r' ? -order : order;
            }
        }

        // Run the initialisation
        init();

        // Return values
        return { sort: sort };
    }

    // Create a new sortie instance
    function create(el, options) {
        return new SortieInstance(el, options);
    }

    // Register a new comparison function
    function registerComparison(codes, callback) {
        if (typeof codes === 'string') codes = [codes];

        // Register against each code provided
        for (var i = 0, l = codes.length; i < l; i++) {
            compareFunctions[codes[i]] = callback;
        }
    }

    /*** Comparison functions ***/

    // Compare alphanumerically
    registerComparison(['a', 'alpha'], function compareAlpha(cellA, cellB) {
        var ah = textContent(cellA).trim();
        var bh = textContent(cellB).trim();
        if (cellA.dir === 'rtl') ah = strReverse(ah);
        if (cellB.dir === 'rtl') bh = strReverse(bh);
        return ah.localeCompare(bh);
    });

    // Compare by date attributes
    registerComparison(['d', 'date'], function compareDate(cellA, cellB, args) {
        var dateFormat = args[0];
        var dateA = parseDate(textContent(cellA), dateFormat);
        var dateB = parseDate(textContent(cellB), dateFormat);

        if (dateA > dateB) {
            return 1;
        } else if (dateA < dateB) {
            return -1;
        } else {
            return 0;
        }
    });

    // Compare integers
    registerComparison(['i', 'int'], function compareInt(cellA, cellB) {
        var aInt = parseInt(textContent(cellA), 10);
        var bInt = parseInt(textContent(cellB), 10);
        if (isNaN(bInt)) {
            return isNaN(aInt) ? 0 : 1;
        } else if (isNaN(aInt)) {
            return -1;
        } else {
            return aInt - bInt;
        }
    });

    /**
     * Return public methods
     */
    return {
        registerComparison: registerComparison,
        create: create
    };
}));
