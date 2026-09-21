/**
 * standard.zip — Spotlight-lite search: a floating overlay wired to
 * Shopify's real predictive search endpoint. The title bar's search
 * icon is a plain link to /search until this script intercepts it, so
 * search still works with JS disabled.
 */
(function () {
  'use strict';

  var trigger = document.querySelector('[data-search-trigger]');
  var overlay = document.querySelector('[data-spotlight]');
  if (!trigger || !overlay) return;

  var backdrop = overlay.querySelector('[data-spotlight-backdrop]');
  var closeBtn = overlay.querySelector('[data-spotlight-close]');
  var input = overlay.querySelector('[data-spotlight-input]');
  var resultsEl = overlay.querySelector('[data-spotlight-results]');

  var noResultsTitle = overlay.getAttribute('data-no-results-title');
  var noResultsDescription = overlay.getAttribute('data-no-results-description');
  var viewAllLabelTemplate = overlay.getAttribute('data-view-all-label');

  var debounceTimer = null;
  var activeIndex = -1;
  var lastFocused = null;
  var currentRequest = 0;

  function routeUrl(path) {
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    return root.replace(/\/$/, '') + '/' + path;
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function open() {
    lastFocused = document.activeElement;
    overlay.hidden = false;
    window.requestAnimationFrame(function () {
      overlay.classList.add('is-open');
    });
    input.value = '';
    resultsEl.innerHTML = '';
    input.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = 'hidden';
    input.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    overlay.classList.remove('is-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    window.setTimeout(function () {
      overlay.hidden = true;
    }, 160);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  function getResultItems() {
    return Array.prototype.slice.call(resultsEl.querySelectorAll('[data-spotlight-result]'));
  }

  function moveActive(delta) {
    var items = getResultItems();
    if (!items.length) return;
    activeIndex = (activeIndex + delta + items.length) % items.length;
    items.forEach(function (item, index) {
      item.classList.toggle('is-active', index === activeIndex);
    });
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  function onKeydown(event) {
    if (event.key === 'Escape') {
      close();
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Enter') {
      var items = getResultItems();
      if (activeIndex >= 0 && items[activeIndex]) {
        event.preventDefault();
        window.location.href = items[activeIndex].getAttribute('href');
      }
    }
  }

  function renderResults(products, query) {
    activeIndex = -1;

    if (!products.length) {
      resultsEl.innerHTML =
        '<div class="spotlight__empty">' +
        '<p class="spotlight__empty-title">' + escapeHtml(noResultsTitle) + '</p>' +
        '<p class="spotlight__empty-description">' + escapeHtml(noResultsDescription) + '</p>' +
        '</div>';
      input.setAttribute('aria-expanded', 'true');
      return;
    }

    var rows = products
      .map(function (product) {
        var image = product.image
          ? '<img src="' + escapeHtml(product.image) + '" alt="" width="32" height="32" loading="lazy">'
          : '';
        return (
          '<li><a href="' + escapeHtml(product.url) + '" class="spotlight__result" data-spotlight-result role="option">' +
          '<span class="spotlight__result-icon">' + image + '</span>' +
          '<span class="spotlight__result-name">' + escapeHtml(product.title) + '</span>' +
          '<span class="spotlight__result-price">' + escapeHtml(product.price) + '</span>' +
          '</a></li>'
        );
      })
      .join('');

    var viewAllUrl = routeUrl('search') + '?type=product&q=' + encodeURIComponent(query);
    var viewAllLabel = viewAllLabelTemplate.replace('{{ query }}', query);

    resultsEl.innerHTML =
      '<ul class="spotlight__list" role="listbox">' + rows + '</ul>' +
      '<a class="spotlight__view-all" href="' + viewAllUrl + '">' + escapeHtml(viewAllLabel) + '</a>';
    input.setAttribute('aria-expanded', 'true');
  }

  function search(query) {
    var requestId = ++currentRequest;
    var url =
      routeUrl('search/suggest.json') +
      '?q=' + encodeURIComponent(query) +
      '&resources[type]=product' +
      '&resources[limit]=6' +
      '&resources[options][unavailable_products]=last';

    fetch(url, { headers: { Accept: 'application/json' } })
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        if (requestId !== currentRequest) return;
        var products = (data.resources && data.resources.results && data.resources.results.products) || [];
        renderResults(products, query);
      })
      .catch(function () {
        if (requestId !== currentRequest) return;
        resultsEl.innerHTML = '';
      });
  }

  trigger.addEventListener('click', function (event) {
    event.preventDefault();
    open();
  });

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);

  input.addEventListener('input', function () {
    var query = input.value.trim();
    window.clearTimeout(debounceTimer);
    if (query.length < 2) {
      resultsEl.innerHTML = '';
      input.setAttribute('aria-expanded', 'false');
      return;
    }
    debounceTimer = window.setTimeout(function () {
      search(query);
    }, 200);
  });
})();
