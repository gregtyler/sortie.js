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
        return node.textContent || $(node).text();
    }

    function SortieInstance(el, options) {
        // Get the variables we'll be using in this sortie object
        var $table = $(el);
        var $body = $table.find('tbody').eq(0);
        var $headers = $table.find('thead th');
        var current;

       /**
        * Get the options object
        */
        function getOptions() {
            var dataAttr = $table.data();
            var dataOptions = {};
            for (var key in dataAttr) {
                if (key.substr(0, 6) === 'sortie' && key.length > 6) {
                    var normkey = key.toLowerCase().replace(/-/g, '');
                    dataOptions[normkey.substr(6)] = dataAttr[key];
                }
            }

            return $.extend(true, {}, defaults, options, dataOptions);
        }

       /**
        * Initialise sortie
        */
        function init() {
            // Set the options object
            options = getOptions();

            // Determine the sort order
            var sorts = options.sort || $table.attr('data-sortie');
            if (!typeof sorts !== 'object') {
                sorts = sorts.split('|');
            }

            if (sorts.length > $headers.length) {
                console.error('Sortie config error: Too many sort columns specified');
            }

            // Add aria role-live settings and
            $table.attr({
                'aria-atomic': true,
                'aria-live': 'polite',
                'aria-relevant': 'all'
            });

            // Generate an ID for the table
            if (!$table.attr('id')) {
                $table.attr('id', 'sortieTable' + (new Date() * 1));
            }

            // Add sortie specification to each column
            for (var col in sorts) {
                // Skip columns with no sort criteria
                if (!sorts[col]) continue;

                // Add a sorting icon to click
                var $button = $('<button />').css({backgroundColor: 'transparent', border: 'none'}).html(options.markers.unsorted);
                $button.attr({
                   type: 'button',
                   'aria-controls': $table.attr('id')
                });
                $headers.eq(col)
                    .css({whiteSpace:'nowrap', cursor:'pointer'})
                    .click(sortFactory(col))
                    .data({
                        sortie: true,
                        sortieCompareFunction: compareFactory(col, sorts[col]),
                        sortieButton: $button
                    })
                    .append(' ', $button);
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

            var opts = $.extend({}, opts);
            var $th = $headers.eq(col);
            var $btn = $th.data('sortieButton');
            var rows = Array.prototype.slice.call($body.find('tr').get(), 0);
            var dir = typeof opts.dir !== 'undefined' ? opts.dir : 'ASC';

            // Get the sort order
            if (current === col && $th.data('sortieDirection') === 'ASC' && typeof opts.dir == 'undefined') {
                dir = 'DESC';
            }

            // Save the new state
            current = col;
            $th.data('sortieDirection', dir);
            $th.attr('aria-sort', dir.toLowerCase() + 'ending')

            // Perform the sort
            rows.sort($th.data('sortieCompareFunction'));

            // Update the button's HTML
            if (dir === 'DESC') {
                $btn.html(options.markers.desc);
                rows = rows.reverse();
            } else {
                $btn.html(options.markers.asc);
            }

            // Update the other buttons
            $headers.not($th).each(function(index, el) {
                var $el = $(el);
                $el.removeAttr('aria-sort');
                if ($el.data('sortie')) {
                    $el.data('sortieButton').html(options.markers.unsorted);
                }
            });

            // Update the content of the now-sorted table
            var frag = document.createDocumentFragment();
            var tbody = $body.get(0);

            for (var i in rows) {
                frag.appendChild(rows[i]);
            }

            // Put the now sorted rows back onto the page
            tbody.innerHTML = '';
            tbody.appendChild(frag);

            $table.trigger('sortie:sorted');
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
        var obj = { sort: sort };
        $table.data('mySortieInstance', obj);
        return obj;
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
    registerComparison(['d', 'date'], function compareData(cellA, cellB, args) {
        var dateFormat = args[0];
        var dateA = parseDate(textContent(cellA), dateFormat);
        var dateB = parseDate(textContent(cellB), dateFormat);

        if (dateA > dateB) {
            return 1;
        } else if (dateB < dateA) {
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

    return {
        registerComparison: registerComparison,
        create: create
    };
}));
