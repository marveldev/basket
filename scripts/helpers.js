window.App = window.App || {};

(function() {
  // Generate a unique ID for list items
  function generateId() {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Encode state to Base64 for URL sharing
  function encodeState(state) {
    try {
      const json = JSON.stringify(state);
      return btoa(encodeURIComponent(json));
    } catch (e) {
      console.error('Encoding failed', e);
      return '';
    }
  }

  // Decode state from Base64
  function decodeState(encoded) {
    try {
      const json = decodeURIComponent(atob(encoded));
      return JSON.parse(json);
    } catch (e) {
      console.error('Decoding failed', e);
      return null;
    }
  }

  // Parse natural language list input (simple heuristic fallback if AI fails)
  function parseListText(text) {
    return text.split(/[\n,;]+/).map(t => t.trim()).filter(t => t.length > 0);
  }

  // Formatting currency
  function formatCurrency(num) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }

  // Expose utilities
  window.App.Helpers = {
    generateId,
    encodeState,
    decodeState,
    parseListText,
    formatCurrency
  };
})();