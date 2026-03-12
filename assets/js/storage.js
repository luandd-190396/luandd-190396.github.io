/**
 * Storage Module
 * Handles localStorage operations
 */

const Storage = {
  /**
   * Get data from localStorage
   * @param {string} key - The storage key
   * @returns {*} Parsed data or null if not found
   */
  getData(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error getting data for key "${key}":`, error);
      return null;
    }
  },

  /**
   * Save data to localStorage
   * @param {string} key - The storage key
   * @param {*} data - Data to store (will be JSON stringified)
   * @returns {boolean} Success status
   */
  setData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Error setting data for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Remove data from localStorage
   * @param {string} key - The storage key
   * @returns {boolean} Success status
   */
  removeData(key) {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`Error removing data for key "${key}":`, error);
      return false;
    }
  },

  /**
   * Clear all localStorage data
   */
  clearAll() {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  },

  /**
   * Check if a key exists in localStorage
   * @param {string} key - The storage key
   * @returns {boolean}
   */
  hasKey(key) {
    return localStorage.getItem(key) !== null;
  },

  /**
   * Get current learning level
   * @returns {string|null} Current level (N5, N4, N3, N2, N1) or null
   */
  getCurrentLevel() {
    return this.getData('currentLevel');
  },

  /**
   * Set current learning level
   * @param {string} level - Level to set (N5, N4, N3, N2, N1)
   * @returns {boolean} Success status
   */
  setCurrentLevel(level) {
    const validLevels = ['N5', 'N4', 'N3', 'N2', 'N1'];
    if (!validLevels.includes(level)) {
      console.error(`Invalid level: ${level}`);
      return false;
    }
    return this.setData('currentLevel', level);
  },

  /**
   * Clear current learning level
   * @returns {boolean} Success status
   */
  clearCurrentLevel() {
    return this.removeData('currentLevel');
  }
};
