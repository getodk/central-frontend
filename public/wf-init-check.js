// NB use legacy JavaScript to support older browsers
var __handle = function(e) {
  var spinner = document.getElementById('loading-spinner');
  if (!spinner) return;
  var error = document.getElementById('loading-error');
  var message = document.getElementById('error-message');
  var msg = e.message || (e.reason && e.reason.message) || 'An unknown error occurred.';
  console.error('FATAL ERROR while loading forms app:', msg);
  spinner.style.display = 'none';
  if (error) error.style.display = 'block';
  if (message) message.innerText = msg;
};
if (globalThis) {
  globalThis.__deregisterInitializationErrorHandling = function() {
    window.removeEventListener('error', __handle, { capture: true });
    window.removeEventListener('unhandledrejection', __handle);
  };
}
window.addEventListener('error', __handle, { capture: true, once: true });
window.addEventListener('unhandledrejection', __handle, { once: true });
