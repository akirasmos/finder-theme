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
      submitButton.disabled = !variant.available;
      submitButton.setAttribute('aria-disabled', String(!variant.available));
      if (submitLabel) {
        submitLabel.textContent = variant.available
          ? submitButton.getAttribute('data-label-available')
          : submitButton.getAttribute('data-label-sold-out');
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

  /* Quantity stepper */
  var quantityInput = document.querySelector('[data-quantity-input]');
  var decreaseBtn = document.querySelector('[data-quantity-decrease]');
  var increaseBtn = document.querySelector('[data-quantity-increase]');

  function nudgeQuantity(delta) {
    if (!quantityInput) return;
    var value = Math.max(1, (parseInt(quantityInput.value, 10) || 1) + delta);
    quantityInput.value = value;
  }

  if (decreaseBtn) decreaseBtn.addEventListener('click', function () { nudgeQuantity(-1); });
  if (increaseBtn) increaseBtn.addEventListener('click', function () { nudgeQuantity(1); });

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
