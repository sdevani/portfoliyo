var PYO = (function (PYO, $) {

    'use strict';

    $(function () {
        // plugins
        $('input[placeholder], textarea[placeholder]').placeholder();
        $('#messages').messages({handleAjax: true});

        // local.js
        PYO.ajaxifyForm('.signup .container form');
        PYO.villageScroll('.village-feed');
    });

    return PYO;

}(PYO || {}, jQuery));
