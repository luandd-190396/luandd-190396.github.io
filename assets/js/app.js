/**
 * Main Application Entry Point
 * Initializes the application and handles common functionality
 */

$(document).ready(function() {
  // Initialize application
  App.init();
});

const App = {
  /**
   * Initialize the application
   */
  async init() {
    console.log('Japanese Study App Initialized');
    
    // Load statistics on homepage
    if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
      await this.loadStatistics();
    }

    // Set active navigation
    this.setActiveNav();

    // Initialize tooltips if Bootstrap is available
    if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
      const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
      tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
      });
    }
  },

  /**
   * Load and display statistics on homepage
   */
  async loadStatistics() {
    try {
      const stats = await DataService.getStatistics();
      
      // Update statistics cards
      $('#stat-hiragana').text(stats.hiragana || 0);
      $('#stat-katakana').text(stats.katakana || 0);
      $('#stat-vocab').text(stats.vocab || 0);
      $('#stat-kanji').text(stats.kanji || 0);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  },

  /**
   * Set active navigation item based on current page
   */
  setActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    $('.navbar-nav .nav-link').each(function() {
      const href = $(this).attr('href');
      if (href && (href === currentPage || href.includes(currentPage))) {
        $(this).addClass('active');
      } else {
        $(this).removeClass('active');
      }
    });
  },

  /**
   * Navigate to a page
   * @param {string} page - Page filename
   */
  navigateTo(page) {
    window.location.href = page;
  },

  /**
   * Reload current page
   */
  reload() {
    window.location.reload();
  }
};

// Global error handler
window.addEventListener('error', function(e) {
  console.error('Global error:', e.error);
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
});
