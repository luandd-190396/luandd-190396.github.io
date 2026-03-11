/**
 * Utility Functions
 * Common helper functions used across the application
 */

const Utils = {
  /**
   * Shuffle an array randomly
   * @param {Array} array - Array to shuffle
   * @returns {Array} Shuffled array
   */
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  },

  /**
   * Get random items from array
   * @param {Array} array - Source array
   * @param {number} count - Number of items to get
   * @returns {Array} Random items
   */
  getRandomItems(array, count) {
    const shuffled = this.shuffleArray(array);
    return shuffled.slice(0, Math.min(count, array.length));
  },

  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  /**
   * Debounce function execution
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  /**
   * Filter data by search term
   * @param {Array} data - Data array to filter
   * @param {string} searchTerm - Search term
   * @param {Array<string>} fields - Fields to search in
   * @returns {Array} Filtered data
   */
  filterBySearch(data, searchTerm, fields) {
    if (!searchTerm || searchTerm.trim() === '') {
      return data;
    }

    const term = searchTerm.toLowerCase().trim();
    return data.filter(item => {
      return fields.some(field => {
        const value = item[field];
        return value && value.toString().toLowerCase().includes(term);
      });
    });
  },

  /**
   * Download JSON file
   * @param {Object} data - Data to download
   * @param {string} filename - Filename
   */
  downloadJSON(data, filename) {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Show toast notification
   * @param {string} message - Message to show
   * @param {string} type - Type (success, error, info, warning)
   */
  showToast(message, type = 'info') {
    // Remove existing toasts
    $('.toast-notification').remove();

    const bgColor = {
      'success': 'bg-success',
      'error': 'bg-danger',
      'info': 'bg-info',
      'warning': 'bg-warning'
    }[type] || 'bg-info';

    const toast = $(`
      <div class="toast-notification position-fixed top-0 start-50 translate-middle-x mt-3 ${bgColor} text-white px-4 py-2 rounded shadow" style="z-index: 9999;">
        ${Utils.escapeHtml(message)}
      </div>
    `);

    $('body').append(toast);

    setTimeout(() => {
      toast.fadeOut(300, function() {
        $(this).remove();
      });
    }, 3000);
  },

  /**
   * Confirm dialog
   * @param {string} message - Confirmation message
   * @returns {boolean} User confirmation
   */
  confirm(message) {
    return window.confirm(message);
  },

  /**
   * Format date to string
   * @param {Date} date - Date object
   * @returns {string} Formatted date
   */
  formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}_${hours}-${minutes}`;
  },

  /**
   * Get unique values from array field
   * @param {Array} array - Source array
   * @param {string} field - Field name
   * @returns {Array} Unique values
   */
  getUniqueValues(array, field) {
    const values = array.map(item => item[field]).filter(val => val !== undefined && val !== null);
    return [...new Set(values)];
  },

  /**
   * Group array by field
   * @param {Array} array - Source array
   * @param {string} field - Field to group by
   * @returns {Object} Grouped object
   */
  groupBy(array, field) {
    return array.reduce((acc, item) => {
      const key = item[field];
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(item);
      return acc;
    }, {});
  },

  /**
   * Generate unique ID
   * @param {string} prefix - ID prefix
   * @returns {string} Unique ID
   */
  generateId(prefix = 'item') {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Read file as text
   * @param {File} file - File object
   * @returns {Promise<string>} File content
   */
  readFileAsText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  },

  /**
   * Validate JSON string
   * @param {string} jsonString - JSON string
   * @returns {boolean} Is valid JSON
   */
  isValidJSON(jsonString) {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  }
};
