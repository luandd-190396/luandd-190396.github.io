/**
 * PWA Install Prompt
 * Show "Add to Home Screen" prompt for mobile users
 */

let deferredPrompt;
let installPromptShown = false;

// Listen for beforeinstallprompt event
window.addEventListener('beforeinstallprompt', (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later
  deferredPrompt = e;
  
  // Don't show if already shown in this session
  if (!installPromptShown && !localStorage.getItem('pwa_install_dismissed')) {
    showInstallPrompt();
  }
});

// Show custom install prompt
function showInstallPrompt() {
  installPromptShown = true;
  
  // Create prompt HTML
  const promptHTML = `
    <div id="pwa-install-prompt" style="
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      max-width: 90%;
      width: 400px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 15px;
      box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 15px;
      animation: slideUp 0.3s ease-out;
    ">
      <div style="display: flex; justify-content: space-between; align-items: start;">
        <div style="flex: 1;">
          <h4 style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600;">
            📱 Install Japanese Study App
          </h4>
          <p style="margin: 0; font-size: 14px; opacity: 0.95;">
            Add to your home screen for quick access and offline use!
          </p>
        </div>
        <button id="pwa-dismiss" style="
          background: transparent;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          padding: 0;
          width: 30px;
          height: 30px;
          line-height: 1;
        ">&times;</button>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="pwa-install-btn" style="
          flex: 1;
          background: white;
          color: #667eea;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Install Now</button>
        <button id="pwa-later-btn" style="
          flex: 1;
          background: rgba(255,255,255,0.2);
          color: white;
          border: 1px solid rgba(255,255,255,0.3);
          padding: 12px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          font-size: 14px;
        ">Maybe Later</button>
      </div>
    </div>
    <style>
      @keyframes slideUp {
        from {
          transform: translate(-50%, 100px);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }
      @keyframes slideDown {
        from {
          transform: translate(-50%, 0);
          opacity: 1;
        }
        to {
          transform: translate(-50%, 100px);
          opacity: 0;
        }
      }
    </style>
  `;
  
  // Add to page
  document.body.insertAdjacentHTML('beforeend', promptHTML);
  
  // Setup event listeners
  document.getElementById('pwa-install-btn').addEventListener('click', installApp);
  document.getElementById('pwa-later-btn').addEventListener('click', dismissPrompt);
  document.getElementById('pwa-dismiss').addEventListener('click', dismissForever);
}

// Install the app
async function installApp() {
  if (!deferredPrompt) return;
  
  // Show the install prompt
  deferredPrompt.prompt();
  
  // Wait for the user to respond to the prompt
  const { outcome } = await deferredPrompt.userChoice;
  
  console.log(`User response to install prompt: ${outcome}`);
  
  if (outcome === 'accepted') {
    console.log('User accepted the install prompt');
  } else {
    console.log('User dismissed the install prompt');
  }
  
  // Clear the deferredPrompt
  deferredPrompt = null;
  
  // Remove prompt
  removePrompt();
}

// Dismiss prompt for this session
function dismissPrompt() {
  removePrompt();
}

// Dismiss prompt forever
function dismissForever() {
  localStorage.setItem('pwa_install_dismissed', 'true');
  removePrompt();
}

// Remove prompt from DOM
function removePrompt() {
  const prompt = document.getElementById('pwa-install-prompt');
  if (prompt) {
    prompt.style.animation = 'slideDown 0.3s ease-out';
    setTimeout(() => {
      prompt.remove();
    }, 300);
  }
}

// Listen for app installed event
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  localStorage.setItem('pwa_install_dismissed', 'true');
  
  // Show success message
  if (typeof Utils !== 'undefined' && Utils.showToast) {
    Utils.showToast('App installed successfully! 🎉', 'success');
  }
});

// Check if running as standalone (already installed)
if (window.matchMedia('(display-mode: standalone)').matches) {
  console.log('Running as PWA');
}
