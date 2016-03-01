// Attach sortie to jQuery
jQuery.fn.sortie = function(options) {
    var args = Array.prototype.slice.apply(arguments);

    return $(this).each(function() {
        if (typeof options === 'string') {
            var command = options;
            $(this).data('mySortieInstance')[command](args.slice(1));
        } else {
            if (!$(this).data('mySortieInstance')) {
                Sortie.create(this, options);
            }
        }
    });
}
