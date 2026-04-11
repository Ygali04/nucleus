// Interactive task-list checkboxes with localStorage persistence.
//
// pymdownx.tasklist renders `- [ ]` as disabled checkboxes. This script
// enables them, assigns each checkbox a stable ID based on its page
// path + index, and persists the checked state to localStorage so the
// reader's progress survives page reloads and navigation.

(function () {
  'use strict';

  const STORAGE_PREFIX = 'nucleus:tasklist:';

  function stableKey(checkbox, index) {
    // Key by pathname + index so the same list on two pages doesn't collide.
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    return STORAGE_PREFIX + path + ':' + index;
  }

  function initTaskList() {
    const checkboxes = document.querySelectorAll(
      '.md-typeset .task-list-item input[type="checkbox"]'
    );
    if (!checkboxes.length) {
      return;
    }

    checkboxes.forEach(function (checkbox, index) {
      // Enable the checkbox (pymdownx.tasklist ships them disabled by default).
      checkbox.disabled = false;
      checkbox.removeAttribute('disabled');
      checkbox.style.cursor = 'pointer';

      const key = stableKey(checkbox, index);
      const saved = localStorage.getItem(key);
      if (saved === '1') {
        checkbox.checked = true;
        checkbox.closest('li').classList.add('task-done');
      } else if (saved === '0') {
        checkbox.checked = false;
      }

      checkbox.addEventListener('change', function () {
        if (checkbox.checked) {
          localStorage.setItem(key, '1');
          checkbox.closest('li').classList.add('task-done');
        } else {
          localStorage.setItem(key, '0');
          checkbox.closest('li').classList.remove('task-done');
        }
        updateProgress();
      });
    });

    updateProgress();
  }

  function updateProgress() {
    const progressEl = document.getElementById('reading-list-progress');
    if (!progressEl) return;
    const checkboxes = document.querySelectorAll(
      '.md-typeset .task-list-item input[type="checkbox"]'
    );
    const total = checkboxes.length;
    const done = Array.from(checkboxes).filter(function (c) {
      return c.checked;
    }).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    progressEl.textContent = done + ' / ' + total + ' read (' + pct + '%)';
    const bar = document.getElementById('reading-list-bar');
    if (bar) {
      bar.style.width = pct + '%';
    }
  }

  // mkdocs-material uses instant navigation; re-initialise on each page.
  if (typeof document$ !== 'undefined' && document$.subscribe) {
    document$.subscribe(initTaskList);
  } else {
    document.addEventListener('DOMContentLoaded', initTaskList);
  }
})();
