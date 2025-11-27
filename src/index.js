// src/index.js

// Polyfills must load FIRST
import './polyfills.js';

import React from 'react';
import ReactDOM from 'react-dom/client';

/**
 * Safely import Spectrum Web Components
 * Prevents "CustomElementRegistry already contains an entry" errors on plugin reload
 */
const safeImportComponents = async () => {
  const componentsToLoad = [
    ['sp-theme', () => import('@spectrum-web-components/theme/sp-theme.js')],
    ['sp-theme-styles', () => import('@spectrum-web-components/theme/src/themes.js')],
    ['sp-card', () => import('@swc-uxp-wrappers/card/sp-card.js')],
    ['sp-action-button', () => import('@swc-uxp-wrappers/action-button/sp-action-button.js')],
    ['sp-action-group', () => import('@swc-uxp-wrappers/action-group/sp-action-group.js')],
    ['sp-button', () => import('@swc-uxp-wrappers/button/sp-button.js')],
    ['sp-menu', () => import('@swc-uxp-wrappers/menu/sp-menu.js')],
    ['sp-menu-item', () => import('@swc-uxp-wrappers/menu/sp-menu-item.js')],
    ['sp-menu-divider', () => import('@swc-uxp-wrappers/menu/sp-menu-divider.js')],
    ['sp-divider', () => import('@swc-uxp-wrappers/divider/sp-divider.js')],
    ['sp-popover', () => import('@swc-uxp-wrappers/popover/sp-popover.js')],
    ['sp-overlay', () => import('@swc-uxp-wrappers/overlay/sp-overlay.js')],
    ['sp-action-menu', () => import('@spectrum-web-components/action-menu/sp-action-menu.js')],
    ['sp-badge', () => import('@spectrum-web-components/badge/sp-badge.js')],
    ['sp-tooltip', () => import('@swc-uxp-wrappers/tooltip/sp-tooltip.js')],
    ['overlay-trigger', () => import('@swc-uxp-wrappers/overlay/overlay-trigger.js')],
    // sp-progressbar and sp-label are native UXP Spectrum widgets (no import needed)
  ];

  for (const [name, importFn] of componentsToLoad) {
    // Skip if element is already registered (handles plugin reload)
    if (name !== 'sp-theme-styles' && customElements.get(name)) {
      continue;
    }

    try {
      await importFn();
    } catch (err) {
      // Ignore "already defined" errors, log others
      if (!err.message?.includes('already contains an entry')) {
        console.warn(`[Component Import] ${name}:`, err.message);
      }
    }
  }
};

import App from './App';
import './styles.css';

// Initialize components then render
safeImportComponents().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
}).catch((err) => {
  console.error('[Plugin Init Error]', err);
});
