/**
 * Data Service Module
 * Handles data loading, saving, and management
 */

const DataService = {
  // Storage keys
  KEYS: {
    hiragana: 'jpapp_hiragana',
    katakana: 'jpapp_katakana',
    vocab: 'jpapp_vocab',
    kanji: 'jpapp_kanji'
  },

  /**
   * Get the correct data path based on current location
   * @param {string} type - Data type
   * @returns {string} Correct path to data file
   */
  getDataPath(type) {
    const paths = {
      hiragana: 'hiragana.json',
      katakana: 'katakana.json',
      vocab: 'vocab.json',
      kanji: 'kanji.json'
    };
    
    // Detect if we're in a subdirectory (pages/) or root
    const isInSubdir = window.location.pathname.includes('/pages/');
    const basePath = isInSubdir ? '../assets/data/' : './assets/data/';
    
    return basePath + paths[type];
  },

  /**
   * Load default data from JSON file
   * @param {string} type - Data type (hiragana, katakana, vocab, kanji)
   * @returns {Promise<Array>} Default data
   */
  async loadDefaultData(type) {
    // Special handling for vocab - load from multiple files
    if (type === 'vocab') {
      return await this.loadAllVocabData();
    }

    const path = this.getDataPath(type);
    if (!path) {
      throw new Error(`Invalid data type: ${type}`);
    }

    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`Error loading default data for "${type}":`, error);
      return [];
    }
  },

  /**
   * Load all vocabulary data from N5 to N1 files
   * @returns {Promise<Array>} Combined vocabulary data
   */
  async loadAllVocabData() {
    const isInSubdir = window.location.pathname.includes('/pages/');
    const basePath = isInSubdir ? '../assets/data/' : './assets/data/';
    
    const vocabFiles = [
      'vocab_n5.json',
      'vocab_n4.json',
      'vocab_n3.json',
      'vocab_n2.json',
      'vocab_n1.json'
    ];

    let allVocab = [];

    for (const file of vocabFiles) {
      try {
        const response = await fetch(basePath + file);
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data)) {
            allVocab = allVocab.concat(data);
          }
        }
      } catch (error) {
        console.warn(`Error loading ${file}:`, error);
      }
    }

    console.log(`Loaded ${allVocab.length} vocabulary items from all levels`);
    return allVocab;
  },

  /**
   * Get module data (from localStorage or default)
   * @param {string} type - Data type
   * @returns {Promise<Array>} Module data
   */
  async getModuleData(type) {
    const key = this.KEYS[type];
    if (!key) {
      throw new Error(`Invalid data type: ${type}`);
    }

    // Check if data exists in localStorage
    const storedData = Storage.getData(key);
    
    if (storedData && Array.isArray(storedData) && storedData.length > 0) {
      return storedData;
    }

    // Load default data and save to localStorage
    const defaultData = await this.loadDefaultData(type);
    if (defaultData.length > 0) {
      Storage.setData(key, defaultData);
    }
    
    return defaultData;
  },

  /**
   * Save module data to localStorage
   * @param {string} type - Data type
   * @param {Array} data - Data to save
   * @returns {boolean} Success status
   */
  saveModuleData(type, data) {
    const key = this.KEYS[type];
    if (!key) {
      throw new Error(`Invalid data type: ${type}`);
    }

    return Storage.setData(key, data);
  },

  /**
   * Reset module data to default
   * @param {string} type - Data type
   * @returns {Promise<Array>} Reset data
   */
  async resetModuleData(type) {
    const key = this.KEYS[type];
    if (!key) {
      throw new Error(`Invalid data type: ${type}`);
    }

    // Remove from localStorage
    Storage.removeData(key);

    // Load and save default data
    const defaultData = await this.loadDefaultData(type);
    if (defaultData.length > 0) {
      Storage.setData(key, defaultData);
    }

    return defaultData;
  },

  /**
   * Get statistics for all modules
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    const stats = {};
    
    for (const type of Object.keys(this.KEYS)) {
      const data = await this.getModuleData(type);
      stats[type] = data.length;
    }

    return stats;
  },

  /**
   * Export all data as JSON
   * @returns {Promise<Object>} All data
   */
  async exportAllData() {
    const exportData = {};
    
    for (const type of Object.keys(this.KEYS)) {
      exportData[type] = await this.getModuleData(type);
    }

    return exportData;
  },

  /**
   * Import data from JSON object
   * @param {Object} importData - Data to import
   * @returns {boolean} Success status
   */
  importData(importData) {
    try {
      for (const type of Object.keys(this.KEYS)) {
        if (importData[type] && Array.isArray(importData[type])) {
          this.saveModuleData(type, importData[type]);
        }
      }
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  /**
   * Reset all data to defaults
   * @returns {Promise<boolean>} Success status
   */
  async resetAllData() {
    try {
      for (const type of Object.keys(this.KEYS)) {
        await this.resetModuleData(type);
      }
      return true;
    } catch (error) {
      console.error('Error resetting all data:', error);
      return false;
    }
  }
};
