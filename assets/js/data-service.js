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
    kanji: 'jpapp_kanji',
    grammar: 'jpapp_grammar'
  },

  GRAMMAR_LESSON_OFFSET: {
    N5: 0,
    N4: 25,
    N3: 50,
    N2: 75,
    N1: 100
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
      kanji: 'kanji.json',
      grammar: 'grammar.json'
    };
    
    // Detect if we're in a subdirectory (pages/) or root
    const isInSubdir = window.location.pathname.includes('/pages/');
    const basePath = isInSubdir ? '../assets/data/' : './assets/data/';
    
    return basePath + paths[type];
  },

  /**
   * Normalize lesson value to integer form
   * Supports formats like "L1", "1", "Lesson 1"
   * @param {string|number} lesson - Lesson value
   * @returns {number|null}
   */
  normalizeLessonNumber(lesson) {
    if (lesson === null || lesson === undefined) return null;
    const str = String(lesson).trim().toUpperCase();
    if (!str) return null;
    if (/^L\d+$/.test(str)) return parseInt(str.slice(1), 10);
    if (/^\d+$/.test(str)) return parseInt(str, 10);
    const match = str.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : null;
  },

  /**
   * Convert a lesson number to grammar lesson index by level
   * @param {string} level - JLPT level
   * @param {number} lessonNumber - Relative lesson number
   * @returns {number}
   */
  toGrammarLessonByLevel(level, lessonNumber) {
    const offset = this.GRAMMAR_LESSON_OFFSET[level] || 0;
    return offset + lessonNumber;
  },

  /**
   * Load default data from JSON file
   * @param {string} type - Data type (hiragana, katakana, vocab, kanji, grammar)
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
   * Get available lessons for a JLPT level with item counts
   * @param {string} level - JLPT level (N5..N1)
   * @returns {Promise<Array>}
   */
  async getAvailableLessons(level) {
    const [vocab, kanji, grammar] = await Promise.all([
      this.getModuleData('vocab'),
      this.getModuleData('kanji'),
      this.getModuleData('grammar')
    ]);

    const vocabByLesson = {};
    const kanjiByLesson = {};
    const grammarByLesson = {};

    vocab
      .filter(item => item.level === level)
      .forEach(item => {
        const lessonNo = this.normalizeLessonNumber(item.lesson);
        if (!lessonNo) return;
        vocabByLesson[lessonNo] = (vocabByLesson[lessonNo] || 0) + 1;
      });

    kanji
      .filter(item => item.level === level)
      .forEach(item => {
        const lessonNo = this.normalizeLessonNumber(item.lesson);
        if (!lessonNo) return;
        kanjiByLesson[lessonNo] = (kanjiByLesson[lessonNo] || 0) + 1;
      });

    const offset = this.GRAMMAR_LESSON_OFFSET[level] || 0;
    grammar
      .filter(item => item.jlpt_level === level)
      .forEach(item => {
        const absoluteLesson = this.normalizeLessonNumber(item.lesson);
        if (!absoluteLesson) return;
        const lessonNo = absoluteLesson - offset;
        if (lessonNo <= 0) return;
        grammarByLesson[lessonNo] = (grammarByLesson[lessonNo] || 0) + 1;
      });

    const lessonSet = new Set([
      ...Object.keys(vocabByLesson),
      ...Object.keys(kanjiByLesson),
      ...Object.keys(grammarByLesson)
    ].map(x => parseInt(x, 10)));

    return Array.from(lessonSet)
      .sort((a, b) => a - b)
      .map(lessonNo => ({
        lesson: lessonNo,
        vocabCount: vocabByLesson[lessonNo] || 0,
        kanjiCount: kanjiByLesson[lessonNo] || 0,
        grammarCount: grammarByLesson[lessonNo] || 0,
        totalCount: (vocabByLesson[lessonNo] || 0) + (kanjiByLesson[lessonNo] || 0) + (grammarByLesson[lessonNo] || 0)
      }));
  },

  /**
   * Get lesson bundle for one level + lesson
   * @param {string} level - JLPT level
   * @param {number} lesson - Relative lesson number
   * @returns {Promise<Object>}
   */
  async getLessonBundle(level, lesson) {
    const lessonNo = this.normalizeLessonNumber(lesson);
    if (!lessonNo) {
      return {
        level,
        lesson: lesson,
        vocab: [],
        kanji: [],
        grammar: []
      };
    }

    const [vocab, kanji, grammar] = await Promise.all([
      this.getModuleData('vocab'),
      this.getModuleData('kanji'),
      this.getModuleData('grammar')
    ]);

    const grammarLesson = this.toGrammarLessonByLevel(level, lessonNo);

    const lessonVocab = vocab.filter(item =>
      item.level === level && this.normalizeLessonNumber(item.lesson) === lessonNo
    );
    const lessonKanji = kanji.filter(item =>
      item.level === level && this.normalizeLessonNumber(item.lesson) === lessonNo
    );
    const lessonGrammar = grammar.filter(item =>
      item.jlpt_level === level && this.normalizeLessonNumber(item.lesson) === grammarLesson
    );

    return {
      level,
      lesson: lessonNo,
      vocab: lessonVocab,
      kanji: lessonKanji,
      grammar: lessonGrammar
    };
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
