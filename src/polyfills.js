// Minimal polyfills for UXP environment

// matchMedia polyfill - required by action-menu's MatchMediaController
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = function(query) {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: function() {},
      removeListener: function() {},
      addEventListener: function() {},
      removeEventListener: function() {},
      dispatchEvent: function() { return true; }
    };
  };
}

console.log('UXP polyfills loaded');
