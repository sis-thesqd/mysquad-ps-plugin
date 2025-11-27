import React, { useRef, useEffect } from 'react';

/**
 * Tab navigation component for switching between plugin panels
 * Uses Adobe Spectrum Web Components sp-action-group (UXP compatible)
 * @param {Object} props - Component props
 * @param {Array} props.tabs - Array of tab objects with id and label
 * @param {string} props.activeTab - Currently active tab id
 * @param {Function} props.onTabChange - Callback when tab changes
 */
const TabNavigation = ({ tabs, activeTab, onTabChange }) => {
  const buttonRefs = useRef({});

  useEffect(() => {
    const handlers = {};

    tabs.forEach((tab) => {
      const buttonEl = buttonRefs.current[tab.id];
      if (buttonEl) {
        handlers[tab.id] = () => {
          if (onTabChange) {
            onTabChange(tab.id);
          }
        };
        buttonEl.addEventListener('click', handlers[tab.id]);
      }
    });

    return () => {
      tabs.forEach((tab) => {
        const buttonEl = buttonRefs.current[tab.id];
        if (buttonEl && handlers[tab.id]) {
          buttonEl.removeEventListener('click', handlers[tab.id]);
        }
      });
    };
  }, [tabs, onTabChange]);

  return (
    <div className="tab-navigation">
      <sp-action-group selects="single" selected={activeTab}>
        {tabs.map((tab) => (
          <sp-action-button
            key={tab.id}
            ref={(el) => (buttonRefs.current[tab.id] = el)}
            value={tab.id}
            selected={activeTab === tab.id ? true : undefined}
            quiet
          >
            {tab.label}
          </sp-action-button>
        ))}
      </sp-action-group>
    </div>
  );
};

export default TabNavigation;

