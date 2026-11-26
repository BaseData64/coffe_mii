/* ============================================================
   MAKI'S BIO — VERIFIED BADGE STORE
   Uses the existing portal history; no real payment is processed.
   ============================================================ */
(function () {
    'use strict';

    function byId(id) {
        return document.getElementById(id);
    }

    function resetStoreMessage() {
        var offer = byId('verified-store-main');
        var result = byId('verified-store-result');
        if (offer) offer.hidden = false;
        if (result) result.hidden = true;
    }

    function enterStore() {
        resetStoreMessage();
        if (typeof window.conmutarPortal === 'function') {
            window.conmutarPortal(8, 'global-menu-community');
        }
        window.scrollTo(0, 0);
    }

    function leaveStore() {
        if (typeof window.manejadorNavegacionFija === 'function') {
            window.manejadorNavegacionFija();
        } else if (typeof window.conmutarPortal === 'function') {
            window.conmutarPortal(0, 'global-menu-community');
        }
    }

    function showPurchaseMessage() {
        var offer = byId('verified-store-main');
        var result = byId('verified-store-result');
        if (offer) offer.hidden = true;
        if (result) {
            result.hidden = false;
            var heading = result.querySelector('h2');
            if (heading) heading.setAttribute('tabindex', '-1');
            if (heading) heading.focus();
        }
    }

    function returnToOffer() {
        resetStoreMessage();
        var buyButton = byId('verified-store-buy');
        if (buyButton) buyButton.focus();
    }

    document.addEventListener('DOMContentLoaded', function () {
        var trigger = byId('verified-store-trigger');
        var noButton = byId('verified-store-no');
        var buyButton = byId('verified-store-buy');
        var returnButton = byId('verified-store-return');

        if (trigger) trigger.addEventListener('click', enterStore);
        if (noButton) noButton.addEventListener('click', leaveStore);
        if (buyButton) buyButton.addEventListener('click', showPurchaseMessage);
        if (returnButton) returnButton.addEventListener('click', returnToOffer);
    });
}());
