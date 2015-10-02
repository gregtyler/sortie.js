function Sortie(el, options) {
    "use strict";
    var defaults = {
        initialSort: 0,
        markers: {
            asc: '&#8595;',
            desc: '&#8593;',
            unsorted: '&#8597;'
        }
    };

    // Get the variables we'll be using in this sortie object
    var $table = $(el);
    var $body = $table.find('tbody').eq(0);
    var $headers = $table.find('thead th');
    var current;
    var options;

   /**
    * Get the options object
    */
    function getOptions() {
        var dataAttr = $table.data();
        var dataOptions = {};
        for (var key in dataAttr) {
            if (key.substr(0,6) === 'sortie' && key.length > 6) {
                dataOptions[key.substr(6, 1).toLowerCase() + key.substr(7)] = dataAttr[key];
            }
        }
        return $.extend(true, {}, defaults, options, dataOptions);
    }

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

   /**
    * Initialise sortie
    */
    function init() {
        // Set the options object
        options = getOptions();

        // Determine the sort order
        var sorts = options.sort || $table.attr('data-sortie');
        if (!typeof sorts !== 'object') {
            sorts = sorts.split(',');
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
            $table.attr('id', 'sortieTable' + ((new Date())*1));
        }

        // Add sortie specification to each column
        for (var col in sorts) {
            // Skip columns with no sort criteria
            if (!sorts[col]) continue;

            // Add a sorting icon to click
            var $button = $('<button />').css({backgroundColor: 'transparent', border: 'none'}).html(options.markers.unsorted);
            $button.attr('aria-controls', $table.attr('id'));
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
        if (options.initialSort !== false) {
            var opts = {};
            if (options.initialSort.toString().substr(-1,1) === 'D') {
                opts.dir = 'DESC';
            } else if(options.initialSort.toString().substr(-1,1) === 'A') {
                opts.dir = 'ASC';
            }

            sort(options.initialSort, opts);
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
        var rows = $body.find('tr').get();
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
        for (var i in rows) {
            $body.append(rows[i]);
        }

        $table.trigger('sortie:sorted');
    }

   /**
    * Return the suitable comparison function for the column
    */
    function compareFactory(col, sortSpec) {
        var callback = function() {return 0};

        if (sortSpec.substr(0,1) === 'a') {
            callback = compareAlpha;
        } else if(sortSpec.substr(0,1) === 'd') {
            callback = compareDate;
        } else if(sortSpec.substr(0,1) === 'i') {
            callback = compareInt;
        }

        return function compare(a, b) {
            var cellA = a.children[col];
            var cellB = b.children[col];

            var order = callback.call(window, cellA, cellB, sortSpec);

            // If asked to, reverse the search order
            return sortSpec.substr(1, 1) === 'r' ? -order : order;
        }
    }

    // Compare alphanumerically
    function compareAlpha(cellA, cellB) {
        var ah = textContent(cellA).trim();
        var bh = textContent(cellB).trim();
        if (cellA.dir === 'rtl') ah = strReverse(ah);
        if (cellB.dir === 'rtl') bh = strReverse(bh);
        return ah.localeCompare(bh);
    }

    // Compare dates
    function compareDate(cellA, cellB, sortSpec) {
        var dateFormat = sortSpec.substr(2);
        var dateA = parseDate(textContent(cellA), dateFormat);
        var dateB = parseDate(textContent(cellB), dateFormat);

        if (dateA > dateB) {
            return 1;
        } else if(dateB < dateA) {
            return -1;
        } else {
            return 0;
        }
    }

    // Compare by data attributes
    function compareData(cellA, cellB) {
        var aVal = parseFloat(cellA.getAttribute('data-val'));
        var bVal = parseFloat(cellB.getAttribute('data-val'));
        var aTotal = parseFloat(cellA.getAttribute('data-total')) || 0;
        var bTotal = parseFloat(cellB.getAttribute('data-total')) || 0;
        return bVal - aVal || bTotal - aTotal;
    }

    // Compare integers
    function compareInt(cellA, cellB) {
        var aInt = parseInt(textContent(cellA), 10);
        var bInt = parseInt(textContent(cellB), 10);
        if (isNaN(bInt)) {
            return isNaN(aInt) ? 0 : 1;
        } else if (isNaN(aInt)) {
            return -1;
        } else {
            return aInt - bInt;
        }
    }

    // Run the initialisation
    init();
}

// Attach sortie to jQuery
$.fn.sortie = function(options) {
    $(this).each(function(){
        Sortie(this, options);
    }
)};