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
     Sidebar toggle. The same button collapses/expands the persistent
     sidebar column on desktop, and shows/hides it as an overlay sheet
     on mobile (where there's no room for it alongside content).
     -------------------------------------------------------------------- */
  function initSidebar() {
    var sidebar = document.getElementById('FinderSidebar');
    var backdrop = document.querySelector('[data-sidebar-backdrop]');
    var toggles = document.querySelectorAll('[data-sidebar-toggle]');
    var finderWindow = document.getElementById('FinderWindow');
    if (!sidebar || !backdrop || !toggles.length || !finderWindow) return;

    var lastFocused = null;

    function isMobile() {
      return window.innerWidth < MOBILE_BREAKPOINT;
    }

    function isMobileOpen() {
      return sidebar.classList.contains('is-open');
    }

    function isDesktopCollapsed() {
      return finderWindow.classList.contains('sidebar-collapsed');
    }

    function syncAriaExpanded() {
      var expanded = isMobile() ? isMobileOpen() : !isDesktopCollapsed();
      toggles.forEach(function (btn) {
        btn.setAttribute('aria-expanded', String(expanded));
      });
    }

    function openMobile() {
      lastFocused = document.activeElement;
      sidebar.classList.add('is-open');
      backdrop.classList.add('is-visible');
      backdrop.hidden = false;
      syncAriaExpanded();
      document.body.style.overflow = 'hidden';
      var firstLink = sidebar.querySelector('a, button');
      if (firstLink) firstLink.focus();
      document.addEventListener('keydown', onKeydown);
    }

    function closeMobile() {
      sidebar.classList.remove('is-open');
      backdrop.classList.remove('is-visible');
      syncAriaExpanded();
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeydown);
      window.setTimeout(function () {
        if (!isMobileOpen()) backdrop.hidden = true;
      }, 250);
      if (lastFocused) lastFocused.focus();
    }

    function toggleDesktop() {
      finderWindow.classList.toggle('sidebar-collapsed');
      syncAriaExpanded();
    }

    function onKeydown(event) {
      if (event.key === 'Escape') {
        closeMobile();
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

    syncAriaExpanded();

    toggles.forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (isMobile()) {
          isMobileOpen() ? closeMobile() : openMobile();
        } else {
          toggleDesktop();
        }
      });
    });

    backdrop.addEventListener('click', closeMobile);

    sidebar.addEventListener('click', function (event) {
      if (isMobile() && isMobileOpen() && event.target.closest('a')) closeMobile();
    });

    window.addEventListener('resize', function () {
      if (!isMobile() && isMobileOpen()) closeMobile();
      syncAriaExpanded();
    });
  }

  initFooterDrawer();
  initSidebar();
})();
