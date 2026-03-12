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
      this.initLevelSelector();
    }

    // Set active navigation
    this.setActiveNav();
    
    // Display current level in navbar
    this.displayCurrentLevel();

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
  },

  /**
   * Initialize level selector on homepage
   */
  initLevelSelector() {
    const currentLevel = Storage.getCurrentLevel();
    
    // Update display
    this.updateLevelDisplay(currentLevel);
    
    // Handle level button clicks
    $('.level-btn').on('click', function() {
      const level = $(this).data('level');
      
      if (level === 'ALL') {
        Storage.clearCurrentLevel();
      } else {
        Storage.setCurrentLevel(level);
      }
      
      // Update display
      App.updateLevelDisplay(level === 'ALL' ? null : level);
      
      // Show success message
      const levelText = level === 'ALL' ? 'All levels' : level;
      alert(`Learning level set to: ${levelText}\n\nAll vocabulary, kanji, flashcards, and quizzes will be filtered accordingly.`);
    });
  },

  /**
   * Update level display on homepage
   * @param {string|null} level - Current level or null
   */
  updateLevelDisplay(level) {
    // Update buttons
    $('.level-btn').removeClass('btn-primary btn-secondary').addClass('btn-outline-primary');
    $('.level-btn[data-level="ALL"]').removeClass('btn-outline-primary').addClass('btn-outline-secondary');
    
    if (level) {
      $(`.level-btn[data-level="${level}"]`).removeClass('btn-outline-primary').addClass('btn-primary');
      $('#currentLevelDisplay').html(`<span class="badge bg-primary">${level}</span>`);
    } else {
      $('.level-btn[data-level="ALL"]').removeClass('btn-outline-secondary').addClass('btn-secondary');
      $('#currentLevelDisplay').text('All levels (no filter)');
    }
  },

  /**
   * Display current level in navbar (all pages)
   */
  displayCurrentLevel() {
    const currentLevel = Storage.getCurrentLevel();
    
    if (currentLevel) {
      // Add level indicator to navbar
      const levelIndicator = `
        <li class="nav-item">
          <span class="nav-link">
            <i class="bi bi-mortarboard"></i> Level: <strong>${currentLevel}</strong>
          </span>
        </li>
      `;
      
      $('.navbar-nav').prepend(levelIndicator);
    }
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
