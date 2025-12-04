import React, { useRef, useEffect } from 'react';

/**
 * Tab navigation component for switching between plugin panels
 * Uses individual action buttons without sp-action-group to avoid UXP issues
 * @param {Object} props - Component props
 * @param {Array} props.tabs - Array of tab objects with id and label
 * @param {string} props.activeTab - Currently active tab id
 * @param {Function} props.onTabChange - Callback when tab changes
 * @param {string} [props.size] - Button size ('s', 'm', 'l', 'xl') - default is medium
 * @param {boolean} [props.quiet=true] - Whether buttons should be quiet style
 * @param {string} [props.className] - Additional CSS class for the container
 */
const TabNavigation = ({
  tabs,
  activeTab,
  onTabChange,
  size,
  quiet = true,
  className = 'tab-navigation'
}) => {
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
    <div className={className}>
      <div className="tab-button-group">
        {tabs.map((tab) => (
          <sp-action-button
            key={tab.id}
            ref={(el) => (buttonRefs.current[tab.id] = el)}
            value={tab.id}
            selected={activeTab === tab.id ? true : undefined}
            quiet={quiet ? true : undefined}
            size={size}
          >
            {tab.label}
          </sp-action-button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;

