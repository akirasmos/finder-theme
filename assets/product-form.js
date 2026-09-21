/**
 * standard.zip — product page variant selection, price/availability sync,
 * quantity stepper, and thumbnail gallery. Vanilla JS, deferred.
 * AJAX submission of the form itself is handled by cart.js so this file
 * stays focused on the buy box's own state.
 */
(function () {
  'use strict';

  var form = document.querySelector('[data-product-form]');
  if (!form) return;

  var wrapper = document.querySelector('.product-info-window');
  var moneyFormat = (wrapper && wrapper.getAttribute('data-money-format')) || '${{amount}}';
  var jsonEl = document.querySelector('[data-product-json]');
  var variants = jsonEl ? JSON.parse(jsonEl.textContent) : [];
  var optionKeys = ['option1', 'option2', 'option3'];

  // How many of each variant of *this* product the customer already has
  // in their Bag, keyed by variant id. Seeded from the server-rendered
  // cart at page load, then kept in sync after every successful add (see
  // the cart:variant-added listener below) so repeated "Move to Bag"
  // clicks — or switching to a variant already sitting in the Bag —
  // can't push a line past its actual stock.
  var cartQtyEl = document.querySelector('[data-cart-quantities]');
  var cartQuantities = cartQtyEl ? JSON.parse(cartQtyEl.textContent) : {};

  function remainingStock(variant) {
    if (variant.inventory_management !== 'shopify') return Infinity;
    var inCart = cartQuantities[String(variant.id)] || 0;
    return variant.inventory_quantity - inCart;
  }

  var optionGroups = Array.prototype.slice.call(document.querySelectorAll('[data-option-position]'));
  var variantIdInput = document.querySelector('[data-product-variant-id]');
  var priceValueEl = document.querySelector('[data-price-value]');
  var priceCompareEl = document.querySelector('[data-price-compare]');
  var availabilityRow = document.querySelector('[data-availability-row]');
  var submitButton = document.querySelector('[data-add-to-bag]');
  var submitLabel = document.querySelector('[data-add-to-bag-label]');
  var mainImage = document.querySelector('[data-product-main-image]');

  function formatWithDelimiters(number, precision) {
    number = (number / 100).toFixed(precision);
    var parts = number.split('.');
    var dollars = parts[0].replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
    return parts[1] ? dollars + '.' + parts[1] : dollars;
  }

  function formatMoney(cents) {
    var match = moneyFormat.match(/\{\{\s*(\w+)\s*\}\}/);
    if (!match) return moneyFormat;
    var precision = match[1] === 'amount_no_decimals' ? 0 : 2;
    return moneyFormat.replace(match[0], formatWithDelimiters(cents, precision));
  }

  function getSelectedValues() {
    var values = [];
    optionGroups.forEach(function (group) {
      var position = parseInt(group.getAttribute('data-option-position'), 10);
      var checked = group.querySelector('input:checked');
      values[position] = checked ? checked.value : null;
    });
    return values;
  }

  function findVariant(values) {
    return variants.filter(function (variant) {
      return values.every(function (value, index) {
        return value == null || variant[optionKeys[index]] === value;
      });
    })[0] || null;
  }

  function isAvailableWith(position, value, otherValues) {
    var testValues = otherValues.slice();
    testValues[position] = value;
    return variants.some(function (variant) {
      var matches = testValues.every(function (v, index) {
        return v == null || variant[optionKeys[index]] === v;
      });
      return matches && variant.available;
    });
  }

  function updateOptionAvailability() {
    var selected = getSelectedValues();
    optionGroups.forEach(function (group) {
      var position = parseInt(group.getAttribute('data-option-position'), 10);
      var inputs = group.querySelectorAll('input[type="radio"]');
      inputs.forEach(function (input) {
        var available = isAvailableWith(position, input.value, selected);
        input.disabled = !available;
        var label = group.querySelector('label[for="' + input.id + '"]');
        if (label) label.classList.toggle('variant-picker__pill--unavailable', !available);
      });
    });
  }

  function updateVariantUI(variant) {
    if (!variant) {
      if (submitButton) {
        submitButton.disabled = true;
        submitButton.setAttribute('aria-disabled', 'true');
        if (submitLabel) submitLabel.textContent = submitButton.getAttribute('data-label-unavailable');
      }
      if (availabilityRow) availabilityRow.hidden = true;
      return;
    }

    if (variantIdInput) variantIdInput.value = variant.id;

    if (priceValueEl) priceValueEl.textContent = formatMoney(variant.price);

    if (priceCompareEl) {
      var priceWrap = priceCompareEl.closest('.price');
      if (variant.compare_at_price > variant.price) {
        priceCompareEl.textContent = formatMoney(variant.compare_at_price);
        priceCompareEl.hidden = false;
        if (priceWrap) priceWrap.classList.add('price--sale');
      } else {
        priceCompareEl.hidden = true;
        if (priceWrap) priceWrap.classList.remove('price--sale');
      }
    }

    if (availabilityRow) availabilityRow.hidden = !!variant.available;

    if (submitButton) {
      var atStockCap = variant.available && remainingStock(variant) <= 0;
      submitButton.disabled = !variant.available || atStockCap;
      submitButton.setAttribute('aria-disabled', String(!variant.available || atStockCap));
      if (submitLabel) {
        if (!variant.available) {
          submitLabel.textContent = submitButton.getAttribute('data-label-sold-out');
        } else if (atStockCap) {
          submitLabel.textContent = submitButton.getAttribute('data-label-max-stock');
        } else {
          submitLabel.textContent = submitButton.getAttribute('data-label-available');
        }
      }
    }

    if (mainImage && variant.featured_image) {
      mainImage.src = variant.featured_image.src;
    }

    try {
      var url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);
    } catch (e) {
      /* ignore */
    }
  }

  optionGroups.forEach(function (group) {
    group.addEventListener('change', function () {
      updateOptionAvailability();
      updateVariantUI(findVariant(getSelectedValues()));
    });
  });

  updateOptionAvailability();

  // Called by cart.js: with (variantId, quantity) after a successful
  // /cart/add.js call, to record the variant's new total Bag quantity
  // (straight from the server, so it already accounts for anything
  // Shopify itself capped) and re-render the button from it; with no
  // arguments, to just re-render from whatever is already known. Always
  // re-deriving from the shared cartQuantities map — rather than each
  // caller assuming its own outcome — is what keeps this correct when
  // two "Move to Bag" clicks are in flight at once.
  window.standardZipSyncBuyButton = function (variantId, quantity) {
    if (variantId != null) cartQuantities[String(variantId)] = quantity;
    updateVariantUI(findVariant(getSelectedValues()));
  };

  /* Thumbnail gallery */
  var thumbs = document.querySelectorAll('[data-product-thumb]');
  thumbs.forEach(function (thumb) {
    thumb.addEventListener('click', function () {
      thumbs.forEach(function (t) {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      thumb.classList.add('is-active');
      thumb.setAttribute('aria-selected', 'true');
      if (mainImage) {
        mainImage.src = thumb.getAttribute('data-full');
        mainImage.srcset = thumb.getAttribute('data-srcset');
      }
    });
  });
})();
