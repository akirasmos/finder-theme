/**
 * standard.zip — gallery lightbox. Opens a photo full-size or plays a
 * video (cloned from a hidden <template> so Shopify's own adaptive
 * video markup is used as-is, not reconstructed in JS).
 */
(function () {
  'use strict';

  var lightbox = document.querySelector('[data-lightbox]');
  var items = document.querySelectorAll('[data-gallery-item]');
  if (!lightbox || !items.length) return;

  var backdrop = lightbox.querySelector('[data-lightbox-backdrop]');
  var closeBtn = lightbox.querySelector('[data-lightbox-close]');
  var content = lightbox.querySelector('[data-lightbox-content]');
  var lastFocused = null;

  function open(node) {
    lastFocused = document.activeElement;
    content.innerHTML = '';

    if (node.getAttribute('data-gallery-type') === 'video') {
      var templateId = node.getAttribute('data-gallery-template');
      var template = document.querySelector('template[data-gallery-template="' + templateId + '"]');
      if (template) content.appendChild(template.content.cloneNode(true));
    } else {
      var img = document.createElement('img');
      img.src = node.getAttribute('data-gallery-src');
      img.alt = node.getAttribute('data-gallery-alt') || '';
      img.className = 'lightbox__image';
      content.appendChild(img);
    }

    lightbox.hidden = false;
    window.requestAnimationFrame(function () {
      lightbox.classList.add('is-open');
    });
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
  }

  function close() {
    lightbox.classList.remove('is-open');
    document.body.style.overflow = '';
    document.removeEventListener('keydown', onKeydown);
    window.setTimeout(function () {
      lightbox.hidden = true;
      content.innerHTML = '';
    }, 160);
    if (lastFocused) lastFocused.focus();
  }

  function onKeydown(event) {
    if (event.key === 'Escape') close();
  }

  items.forEach(function (item) {
    item.addEventListener('click', function () {
      open(item);
    });
  });

  backdrop.addEventListener('click', close);
  closeBtn.addEventListener('click', close);
})();
