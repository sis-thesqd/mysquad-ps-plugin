// src/index.js

// Polyfills must load FIRST
import './polyfills.js';

import React from 'react';
import ReactDOM from 'react-dom/client';

// Spectrum Web Components - UXP Wrappers (v0.37.0)
import '@spectrum-web-components/theme/sp-theme.js';
import '@spectrum-web-components/theme/src/themes.js';
import '@swc-uxp-wrappers/card/sp-card.js';
import '@swc-uxp-wrappers/action-button/sp-action-button.js';
import '@swc-uxp-wrappers/action-group/sp-action-group.js';
import '@swc-uxp-wrappers/button/sp-button.js';
import '@swc-uxp-wrappers/menu/sp-menu.js';
import '@swc-uxp-wrappers/menu/sp-menu-item.js';
import '@swc-uxp-wrappers/menu/sp-menu-divider.js';
import '@swc-uxp-wrappers/popover/sp-popover.js';
import '@swc-uxp-wrappers/overlay/sp-overlay.js';
import '@spectrum-web-components/action-menu/sp-action-menu.js';
import '@spectrum-web-components/badge/sp-badge.js';

import App from './App';
import './styles.css';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
