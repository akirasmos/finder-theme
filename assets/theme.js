/**
 * standard.zip — core theme behavior. Vanilla JS, no framework.
 * Loaded with `defer`, so DOM is parsed by the time this runs.
 */
(function () {
  'use strict';

  var MOBILE_BREAKPOINT = 768;

  /* --------------------------------------------------------------------
     Footer drawer (slides up from the status bar's tagline/info control)
     -------------------------------------------------------------------- */
  function initFooterDrawer() {
    var trigger = document.querySelector('[data-footer-toggle]');
    var drawer = document.querySelector('[data-footer-drawer]');
    if (!trigger || !drawer) return;

    var backdrop = drawer.querySelector('[data-footer-backdrop]');
    var closeBtn = drawer.querySelector('[data-footer-close]');
    var lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      drawer.hidden = false;
      window.requestAnimationFrame(function () {
        drawer.classList.add('is-open');
      });
      document.body.style.overflow = 'hidden';
      if (closeBtn) closeBtn.focus();
      document.addEventListener('keydown', onKeydown);
    }

    function close() {
      drawer.classList.remove('is-open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
      window.setTimeout(function () {
        drawer.hidden = true;
      }, 220);
      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') close();
    }

    trigger.addEventListener('click', open);
    if (backdrop) backdrop.addEventListener('click', close);
    if (closeBtn) closeBtn.addEventListener('click', close);
  }

  /* --------------------------------------------------------------------
     Mobile sidebar sheet
     -------------------------------------------------------------------- */
  function initSidebar() {
    var sidebar = document.getElementById('FinderSidebar');
    var backdrop = document.querySelector('[data-sidebar-backdrop]');
    var toggles = document.querySelectorAll('[data-sidebar-toggle]');
    if (!sidebar || !backdrop || !toggles.length) return;

    var lastFocused = null;

    function isOpen() {
      return sidebar.classList.contains('is-open');
    }

    function open() {
      lastFocused = document.activeElement;
      sidebar.classList.add('is-open');
      backdrop.classList.add('is-visible');
      backdrop.hidden = false;
      toggles.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'true');
      });
      document.body.style.overflow = 'hidden';
      var firstLink = sidebar.querySelector('a, button');
      if (firstLink) firstLink.focus();
      document.addEventListener('keydown', onKeydown);
    }

    function close() {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-visible');
      toggles.forEach(function (btn) {
        btn.setAttribute('aria-expanded', 'false');
      });
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
      window.setTimeout(function () {
        if (!isOpen()) backdrop.hidden = true;
      }, 250);
      if (lastFocused) lastFocused.focus();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') {
        close();
        return;
      }
      if (event.key === 'Tab') {
        trapFocus(event);
      }
    }

    function trapFocus(event) {
      var focusable = sidebar.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;
      var first = focusable[0];
      var last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    toggles.forEach(function (btn) {
      btn.setAttribute('aria-expanded', 'false');
      btn.addEventListener('click', function () {
        isOpen() ? close() : open();
      });
    });

    backdrop.addEventListener('click', close);

    sidebar.addEventListener('click', function (event) {
      if (event.target.closest('a')) close();
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth >= MOBILE_BREAKPOINT && isOpen()) close();
    });
  }

  /* --------------------------------------------------------------------
     Grid / list view toggle (persisted per-browser via localStorage).
     Applied immediately (this script runs deferred, so the DOM carrying
     the server-rendered default view already exists) to avoid a flash
     of the wrong view when a returning visitor's stored choice differs.
     -------------------------------------------------------------------- */
  function setView(view) {
    document.querySelectorAll('[data-view-target]').forEach(function (el) {
      el.setAttribute('data-view', view);
    });
    document.querySelectorAll('[data-view-toggle]').forEach(function (btn) {
      btn.setAttribute('aria-pressed', String(btn.getAttribute('data-view-toggle') === view));
    });
    try {
      window.localStorage.setItem('sz-view', view);
    } catch (e) {
      /* storage unavailable (private mode, blocked) — view just won't persist */
    }
  }

  function initViewToggle() {
    var buttons = document.querySelectorAll('[data-view-toggle]');
    if (!buttons.length) return;

    var stored = null;
    try {
      stored = window.localStorage.getItem('sz-view');
    } catch (e) {
      /* ignore */
    }
    if (stored) setView(stored);

    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        setView(btn.getAttribute('data-view-toggle'));
      });
    });
  }

  initFooterDrawer();
  initSidebar();
  initViewToggle();
})();
