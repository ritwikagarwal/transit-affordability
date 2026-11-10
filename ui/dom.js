export const $ = selector => document.querySelector(selector);
export const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;',
}[character]));

// A common close behavior for all native dialogs. Escape also closes them.
export function bindDialogs() {
  document.addEventListener('click', event => {
    const close = event.target.closest('[data-close]');
    if (close) close.closest('dialog').close();
  });
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const box = dialog.getBoundingClientRect();
      if (event.clientX < box.left || event.clientX > box.right ||
          event.clientY < box.top || event.clientY > box.bottom) dialog.close();
    });
  });
}
