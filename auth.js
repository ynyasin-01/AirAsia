// Demo UI session only: never use hard-coded credentials for real authentication.
(function () {
  'use strict';
  const key = 'airasia.demo.session';
  const button = document.getElementById('authButton');
  const dialog = document.getElementById('loginDialog');
  const form = document.getElementById('loginForm');
  const error = document.getElementById('loginError');
  const status = document.getElementById('authStatus');
  let loggedIn = false;
  let pendingBooking = null;
  try { loggedIn = sessionStorage.getItem(key) === 'admin'; } catch {}
  function render() {
    button.textContent = loggedIn ? 'Sign out · admin' : 'Log in';
    button.setAttribute('aria-label', loggedIn ? 'Sign out of admin demo account' : 'Log in to demo account');
  }
  window.airasiaRequireLogin=function(continueBooking){
    try {loggedIn=sessionStorage.getItem(key)==='admin';} catch {loggedIn=false;}
    render();
    if(loggedIn)return true;
    pendingBooking=continueBooking;
    form.reset();error.textContent='Please log in to continue your booking.';
    if(!dialog.open)dialog.showModal();
    document.getElementById('loginUsername').focus();
    return false;
  };
  function close() { pendingBooking=null; dialog.close(); form.reset(); error.textContent = ''; button.focus(); }
  document.querySelector('.login-close').addEventListener('click', close);
  dialog.addEventListener('cancel', function () { pendingBooking=null; form.reset(); error.textContent = ''; });
  button.addEventListener('click', function () {
    if (loggedIn) {
      try { sessionStorage.removeItem(key); } catch { status.textContent = 'Unable to sign out. Please close this tab to end the demo session.'; return; }
      loggedIn = false; pendingBooking=null; render(); status.textContent = 'You have signed out.';
    } else {
      form.reset(); error.textContent = ''; dialog.showModal(); document.getElementById('loginUsername').focus();
    }
  });
  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (form.elements.username.value.trim() !== 'admin' || form.elements.password.value !== 'admin') {
      error.textContent = 'Incorrect username or password. Use admin for both.';
      form.elements.password.value = ''; form.elements.password.focus(); return;
    }
    try { sessionStorage.setItem(key, 'admin'); }
    catch { error.textContent = 'Enable browser storage to use the demo login.'; return; }
    const resume=pendingBooking; loggedIn = true; render(); close(); status.textContent = 'Logged in as admin.'; if(resume)resume();
  });
  render();
})();
