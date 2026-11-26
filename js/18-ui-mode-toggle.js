/* Maki's Bio: Wii U <-> Miiverse Web UI mode switch. */
(function () {
  'use strict';

  var STORAGE_KEY = 'makisBio.uiMode.v1';
  var currentMode = 'wiiu';

  function readStoredMode() {
    try {
      var value = window.localStorage.getItem(STORAGE_KEY);
      return value === 'offdevice' ? 'offdevice' : 'wiiu';
    } catch (error) {
      return 'wiiu';
    }
  }

  function saveMode(mode) {
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch (error) {
      // Private browsing or file:// restrictions: the toggle still works in-session.
    }
  }

  function applyMode(mode) {
    currentMode = mode === 'offdevice' ? 'offdevice' : 'wiiu';
    document.documentElement.classList.toggle('ui-offdevice', currentMode === 'offdevice');
    document.documentElement.setAttribute('data-maki-ui-mode', currentMode);
    updateButton();
  }

  function createButton() {
    if (document.getElementById('maki-ui-mode-toggle')) return;

    var button = document.createElement('button');
    button.type = 'button';
    button.id = 'maki-ui-mode-toggle';
    button.setAttribute('aria-label', 'Cambiar interfaz');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = '<span class="maki-ui-mode-arrows" aria-hidden="true">⇄</span><span class="maki-ui-mode-label"></span>';
    button.addEventListener('click', function () {
      applyMode(currentMode === 'wiiu' ? 'offdevice' : 'wiiu');
      saveMode(currentMode);
    });
    document.body.appendChild(button);
    updateButton();
  }

  function updateButton() {
    var button = document.getElementById('maki-ui-mode-toggle');
    if (!button) return;

    var label = button.querySelector('.maki-ui-mode-label');
    var nextLabel = currentMode === 'offdevice' ? 'UI Wii U' : 'Miiverse Web';
    if (label) label.textContent = nextLabel;
    button.setAttribute('aria-pressed', currentMode === 'offdevice' ? 'true' : 'false');
    button.setAttribute('title', currentMode === 'offdevice' ? 'Cambiar a la interfaz Wii U' : 'Cambiar a la interfaz Miiverse Web');
    button.setAttribute('aria-label', currentMode === 'offdevice' ? 'Cambiar a la interfaz Wii U' : 'Cambiar a la interfaz Miiverse Web');
  }

  // Apply before the body is painted to reduce flicker when a saved mode exists.
  applyMode(readStoredMode());

  // This file is loaded at the end of index.html, so the body is already present.
  createButton();
})();
