/**
 * standard.zip — AJAX Bag (cart). Handles "Move to Bag" from the product
 * page (with its copy-progress micro-animation) and in-place quantity/
 * remove updates on the Bag page itself. Loaded on every page since the
 * title bar's Bag badge can change from anywhere a product form exists.
 */
(function () {
  'use strict';

  var MIN_ANIMATION_MS = 450;
  var SUCCESS_HOLD_MS = 900;

  function qs(sel, ctx) {
    return (ctx || document).querySelector(sel);
  }

  function delay(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function routeUrl(path) {
    var root = (window.Shopify && window.Shopify.routes && window.Shopify.routes.root) || '/';
    return root.replace(/\/$/, '') + '/' + path;
  }

  function updateCartBadge(count) {
    var icon = qs('[data-cart-icon]');
    if (!icon) return;
    var badge = qs('[data-cart-count]', icon);
    if (count > 0) {
      if (!badge) {
        badge = document.createElement('span');
        badge.className = 'icon-btn__badge';
        badge.setAttribute('data-cart-count', '');
        icon.appendChild(badge);
      }
      badge.textContent = count;
    } else if (badge) {
      badge.remove();
    }
  }

  function announce(message) {
    var region = qs('#CartStatus');
    if (region) region.textContent = message;
  }

  function formatMoney(cents) {
    var formatEl = qs('[data-money-format]');
    var format = (formatEl && formatEl.getAttribute('data-money-format')) || '${{amount}}';
    var match = format.match(/\{\{\s*(\w+)\s*\}\}/);
    var precision = match && match[1] === 'amount_no_decimals' ? 0 : 2;
    var number = (cents / 100).toFixed(precision);
    var parts = number.split('.');
    var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    var value = parts[1] ? dollars + '.' + parts[1] : dollars;
    return match ? format.replace(match[0], value) : format;
  }

  /* ---------------------------------------------------------------------
     Move to Bag — product page
     ------------------------------------------------------------------- */
  function initProductForm() {
    var form = qs('[data-product-form]');
    if (!form) return;

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var button = qs('[data-add-to-bag]', form);
      if (!button || button.disabled) return;

      var label = qs('[data-add-to-bag-label]', button);
      var formData = new FormData(form);

      button.disabled = true;
      button.classList.add('is-loading');

      var request = fetch(routeUrl('cart/add.js'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          id: formData.get('id'),
          quantity: formData.get('quantity') || 1
        })
      }).then(function (response) {
        return response.json().then(function (data) {
          return { ok: response.ok, data: data };
        });
      });

      Promise.all([request, delay(MIN_ANIMATION_MS)])
        .then(function (results) {
          var result = results[0];
          button.classList.remove('is-loading');

          if (!result.ok) {
            button.classList.add('is-error');
            if (label) label.textContent = button.getAttribute('data-label-error');
            announce(result.data.description || button.getAttribute('data-label-error'));
            return null;
          }

          button.classList.add('is-success');
          if (label) label.textContent = button.getAttribute('data-label-moved');
          announce(result.data.title + ' moved to Bag.');
          return fetch(routeUrl('cart.js'), { headers: { Accept: 'application/json' } }).then(function (r) {
            return r.json();
          });
        })
        .then(function (cart) {
          if (cart) updateCartBadge(cart.item_count);
        })
        .catch(function () {
          button.classList.remove('is-loading');
          button.classList.add('is-error');
          if (label) label.textContent = button.getAttribute('data-label-error');
          announce(button.getAttribute('data-label-error'));
        })
        .then(function () {
          return delay(SUCCESS_HOLD_MS);
        })
        .then(function () {
          button.classList.remove('is-success', 'is-error');
          button.disabled = false;
          button.setAttribute('aria-disabled', 'false');
          if (label) label.textContent = button.getAttribute('data-label-available');
        });
    });
  }

  /* ---------------------------------------------------------------------
     Bag page — quantity +/- and remove via /cart/change.js
     ------------------------------------------------------------------- */
  function initCartPage() {
    var form = qs('[data-cart-form]');
    if (!form) return;

    function setLineQuantity(key, quantity) {
      return fetch(routeUrl('cart/change.js'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ id: key, quantity: quantity })
      }).then(function (response) {
        return response.json();
      });
    }

    function updateSubtotal(cart) {
      var subtotalEl = qs('[data-cart-subtotal]');
      if (subtotalEl) subtotalEl.textContent = formatMoney(cart.total_price);
    }

    function refreshRow(itemEl, item) {
      if (!item) return;
      var priceEl = qs('[data-cart-item-price]', itemEl);
      if (priceEl) priceEl.textContent = formatMoney(item.final_line_price);
    }

    function handleChange(itemEl, quantity) {
      var key = itemEl.getAttribute('data-cart-item-key');
      itemEl.classList.add('is-updating');

      setLineQuantity(key, quantity)
        .then(function (cart) {
          updateCartBadge(cart.item_count);
          updateSubtotal(cart);

          if (cart.item_count === 0) {
            window.location.reload();
            return;
          }

          if (quantity <= 0) {
            itemEl.classList.add('is-removing');
            window.setTimeout(function () {
              itemEl.remove();
            }, 180);
            return;
          }

          var updatedItem = cart.items.filter(function (i) {
            return i.key === key;
          })[0];
          refreshRow(itemEl, updatedItem);
          itemEl.classList.remove('is-updating');
        })
        .catch(function () {
          itemEl.classList.remove('is-updating');
        });
    }

    form.addEventListener('click', function (event) {
      var decrease = event.target.closest('[data-cart-quantity-decrease]');
      var increase = event.target.closest('[data-cart-quantity-increase]');
      var remove = event.target.closest('[data-cart-remove]');
      if (!decrease && !increase && !remove) return;

      event.preventDefault();
      var itemEl = event.target.closest('[data-cart-item]');
      if (!itemEl) return;
      var input = qs('[data-cart-quantity-input]', itemEl);
      var quantity = parseInt(input.value, 10) || 0;

      if (remove) {
        quantity = 0;
      } else if (increase) {
        quantity += 1;
      } else if (decrease) {
        quantity = Math.max(0, quantity - 1);
      }

      input.value = quantity;
      handleChange(itemEl, quantity);
    });

    form.addEventListener('change', function (event) {
      var input = event.target.closest('[data-cart-quantity-input]');
      if (!input) return;
      var itemEl = input.closest('[data-cart-item]');
      var quantity = Math.max(0, parseInt(input.value, 10) || 0);
      handleChange(itemEl, quantity);
    });
  }

  initProductForm();
  initCartPage();
})();
