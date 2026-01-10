$(function() {
  // Contract Check
  try {
    const hasApp = !!window.App;
    const hasInit = hasApp && typeof window.App.init === 'function';

    if (!hasApp || !hasInit) {
      console.error('[Contract] Missing App.init');
      return;
    }

    // Start the application
    window.App.init();
    
    console.log('Basket AI initialized.');

  } catch (e) {
    console.error('Initialization failed', e);
  }
});