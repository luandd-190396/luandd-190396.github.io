/**
 * Admin Module
 * Handles data management (CRUD operations, import/export, reset)
 */

const AdminModule = {
  currentTab: 'hiragana',
  currentData: [],
  editingId: null,

  /**
   * Initialize the module
   */
  async init() {
    this.setupEventListeners();
    this.loadTab('hiragana');
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Tab switching
    $('button[data-bs-toggle="tab"]').on('shown.bs.tab', (e) => {
      const tabId = $(e.target).attr('data-bs-target').replace('#tab-', '');
      this.loadTab(tabId);
    });

    // Add button
    $('#btnAdd').on('click', () => this.showAddModal());

    // Save button in modal
    $('#btnSaveItem').on('click', () => this.saveItem());

    // Export buttons
    $('#btnExport').on('click', () => this.exportCurrentTab());
    $('#btnExportAll').on('click', () => this.exportAll());

    // Import button
    $('#btnImport').on('click', () => $('#importFile').click());
    $('#importFile').on('change', (e) => this.handleImport(e));

    // Reset buttons
    $('#btnReset').on('click', () => this.resetCurrentTab());
    $('#btnResetAll').on('click', () => this.resetAll());
  },

  /**
   * Load tab data
   * @param {string} tab - Tab name (hiragana, katakana, vocab, kanji)
   */
  async loadTab(tab) {
    this.currentTab = tab;
    this.currentData = await DataService.getModuleData(tab);
    this.renderTable();
  },

  /**
   * Render data table
   */
  renderTable() {
    const $tbody = $('#dataTable tbody');
    $tbody.empty();

    if (this.currentData.length === 0) {
      $tbody.append(`
        <tr>
          <td colspan="10" class="text-center text-muted py-4">No data available</td>
        </tr>
      `);
      return;
    }

    this.currentData.forEach((item, index) => {
      const row = this.createTableRow(item, index);
      $tbody.append(row);
    });

    // Update count
    $('#itemCount').text(`${this.currentData.length} items`);
  },

  /**
   * Create table row based on data type
   * @param {Object} item - Data item
   * @param {number} index - Row index
   * @returns {jQuery} Table row
   */
  createTableRow(item, index) {
    let cells = '';

    switch(this.currentTab) {
      case 'hiragana':
      case 'katakana':
        cells = `
          <td>${Utils.escapeHtml(item.kana)}</td>
          <td>${Utils.escapeHtml(item.romaji)}</td>
          <td>${Utils.escapeHtml(item.group)}</td>
          <td>${Utils.escapeHtml(item.example)}</td>
          <td>${Utils.escapeHtml(item.example_meaning)}</td>
        `;
        break;

      case 'vocab':
        cells = `
          <td>${Utils.escapeHtml(item.word)}</td>
          <td>${Utils.escapeHtml(item.reading)}</td>
          <td>${Utils.escapeHtml(item.meaning_en)}</td>
          <td>${Utils.escapeHtml(item.level)}</td>
          <td>${Utils.escapeHtml(item.type)}</td>
        `;
        break;

      case 'kanji':
        cells = `
          <td>${Utils.escapeHtml(item.kanji)}</td>
          <td>${Utils.escapeHtml(item.meaning_vi)}</td>
          <td>${Utils.escapeHtml(item.onyomi)}</td>
          <td>${Utils.escapeHtml(item.kunyomi || '-')}</td>
          <td>${Utils.escapeHtml(item.level)}</td>
        `;
        break;
    }

    return $(`
      <tr data-id="${Utils.escapeHtml(item.id)}">
        <td>${index + 1}</td>
        ${cells}
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="AdminModule.editItem('${item.id}')">
            <i class="bi bi-pencil"></i> Edit
          </button>
          <button class="btn btn-sm btn-danger" onclick="AdminModule.deleteItem('${item.id}')">
            <i class="bi bi-trash"></i> Delete
          </button>
        </td>
      </tr>
    `);
  },

  /**
   * Show add modal
   */
  showAddModal() {
    this.editingId = null;
    $('#modalTitle').text(`Add ${this.currentTab.charAt(0).toUpperCase() + this.currentTab.slice(1)}`);
    this.renderForm();
    $('#editModal').modal('show');
  },

  /**
   * Edit item
   * @param {string} id - Item ID
   */
  editItem(id) {
    const item = this.currentData.find(i => i.id === id);
    if (!item) return;

    this.editingId = id;
    $('#modalTitle').text(`Edit ${this.currentTab.charAt(0).toUpperCase() + this.currentTab.slice(1)}`);
    this.renderForm(item);
    $('#editModal').modal('show');
  },

  /**
   * Render form based on data type
   * @param {Object} data - Item data (for editing)
   */
  renderForm(data = {}) {
    const $form = $('#itemForm');
    $form.empty();

    let fields = [];

    switch(this.currentTab) {
      case 'hiragana':
      case 'katakana':
        fields = [
          { name: 'kana', label: 'Kana', type: 'text', required: true },
          { name: 'romaji', label: 'Romaji', type: 'text', required: true },
          { name: 'group', label: 'Group', type: 'text', required: true },
          { name: 'example', label: 'Example', type: 'text', required: true },
          { name: 'example_meaning', label: 'Example Meaning', type: 'text', required: true }
        ];
        break;

      case 'vocab':
        fields = [
          { name: 'word', label: 'Word', type: 'text', required: true },
          { name: 'reading', label: 'Reading', type: 'text', required: true },
          { name: 'romaji', label: 'Romaji', type: 'text', required: true },
          { name: 'meaning_vi', label: 'Meaning (Vietnamese)', type: 'text', required: true },
          { name: 'meaning_en', label: 'Meaning (English)', type: 'text', required: true },
          { name: 'level', label: 'JLPT Level', type: 'select', options: ['N5', 'N4', 'N3', 'N2', 'N1'], required: true },
          { name: 'type', label: 'Type', type: 'text', required: true },
          { name: 'lesson', label: 'Lesson', type: 'text', required: false },
          { name: 'example', label: 'Example', type: 'text', required: false },
          { name: 'example_reading', label: 'Example Reading', type: 'text', required: false },
          { name: 'example_meaning', label: 'Example Meaning', type: 'text', required: false }
        ];
        break;

      case 'kanji':
        fields = [
          { name: 'kanji', label: 'Kanji', type: 'text', required: true },
          { name: 'meaning_vi', label: 'Meaning (Vietnamese)', type: 'text', required: true },
          { name: 'onyomi', label: "On'yomi", type: 'text', required: true },
          { name: 'kunyomi', label: "Kun'yomi", type: 'text', required: false },
          { name: 'level', label: 'JLPT Level', type: 'select', options: ['N5', 'N4', 'N3', 'N2', 'N1'], required: true },
          { name: 'lesson', label: 'Lesson', type: 'text', required: false },
          { name: 'example_word', label: 'Example Word', type: 'text', required: false },
          { name: 'example_reading', label: 'Example Reading', type: 'text', required: false },
          { name: 'example_meaning', label: 'Example Meaning', type: 'text', required: false }
        ];
        break;
    }

    fields.forEach(field => {
      const value = data[field.name] || '';
      const requiredAttr = field.required ? 'required' : '';

      if (field.type === 'select') {
        const options = field.options.map(opt => 
          `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
        ).join('');
        
        $form.append(`
          <div class="mb-3">
            <label for="field-${field.name}" class="form-label">${field.label}</label>
            <select class="form-select" id="field-${field.name}" name="${field.name}" ${requiredAttr}>
              <option value="">Select...</option>
              ${options}
            </select>
          </div>
        `);
      } else {
        $form.append(`
          <div class="mb-3">
            <label for="field-${field.name}" class="form-label">${field.label}</label>
            <input type="${field.type}" class="form-control" id="field-${field.name}" 
                   name="${field.name}" value="${Utils.escapeHtml(value)}" ${requiredAttr}>
          </div>
        `);
      }
    });
  },

  /**
   * Save item (add or update)
   */
  saveItem() {
    const formData = {};
    $('#itemForm').find('input, select').each(function() {
      const name = $(this).attr('name');
      const value = $(this).val();
      formData[name] = value;
    });

    // Validate required fields
    if (!this.validateForm(formData)) {
      Utils.showToast('Please fill in all required fields', 'error');
      return;
    }

    if (this.editingId) {
      // Update existing item
      const index = this.currentData.findIndex(i => i.id === this.editingId);
      if (index !== -1) {
        this.currentData[index] = { ...this.currentData[index], ...formData };
      }
    } else {
      // Add new item
      const newItem = {
        id: Utils.generateId(`${this.currentTab}-new`),
        ...formData
      };
      this.currentData.push(newItem);
    }

    // Save to storage
    DataService.saveModuleData(this.currentTab, this.currentData);

    // Close modal and refresh
    $('#editModal').modal('hide');
    this.renderTable();
    Utils.showToast('Item saved successfully', 'success');
  },

  /**
   * Validate form data
   * @param {Object} data - Form data
   * @returns {boolean} Is valid
   */
  validateForm(data) {
    // Check if required fields have values
    for (const key in data) {
      if (data[key] === '' && this.isRequiredField(key)) {
        return false;
      }
    }
    return true;
  },

  /**
   * Check if field is required
   * @param {string} fieldName - Field name
   * @returns {boolean} Is required
   */
  isRequiredField(fieldName) {
    const requiredFields = {
      'hiragana': ['kana', 'romaji', 'group', 'example', 'example_meaning'],
      'katakana': ['kana', 'romaji', 'group', 'example', 'example_meaning'],
      'vocab': ['word', 'reading', 'romaji', 'meaning_vi', 'meaning_en', 'level', 'type'],
      'kanji': ['kanji', 'meaning_vi', 'onyomi', 'level']
    };

    return requiredFields[this.currentTab]?.includes(fieldName) || false;
  },

  /**
   * Delete item
   * @param {string} id - Item ID
   */
  async deleteItem(id) {
    if (!Utils.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    this.currentData = this.currentData.filter(item => item.id !== id);
    DataService.saveModuleData(this.currentTab, this.currentData);
    this.renderTable();
    Utils.showToast('Item deleted successfully', 'success');
  },

  /**
   * Export current tab data
   */
  async exportCurrentTab() {
    const data = await DataService.getModuleData(this.currentTab);
    const filename = `${this.currentTab}_${Utils.formatDate(new Date())}.json`;
    Utils.downloadJSON(data, filename);
    Utils.showToast('Data exported successfully', 'success');
  },

  /**
   * Export all data
   */
  async exportAll() {
    const allData = await DataService.exportAllData();
    const filename = `japanese_study_backup_${Utils.formatDate(new Date())}.json`;
    Utils.downloadJSON(allData, filename);
    Utils.showToast('All data exported successfully', 'success');
  },

  /**
   * Handle import from file
   * @param {Event} event - File input change event
   */
  async handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const fileContent = await Utils.readFileAsText(file);
      
      if (!Utils.isValidJSON(fileContent)) {
        Utils.showToast('Invalid JSON file', 'error');
        return;
      }

      const importData = JSON.parse(fileContent);

      // Check if it's a single module or all data
      if (Array.isArray(importData)) {
        // Single module import
        if (!Utils.confirm(`Import data to ${this.currentTab}? This will replace existing data.`)) {
          return;
        }
        DataService.saveModuleData(this.currentTab, importData);
        await this.loadTab(this.currentTab);
        Utils.showToast('Data imported successfully', 'success');
      } else if (typeof importData === 'object') {
        // All data import
        if (!Utils.confirm('Import all data? This will replace all existing data.')) {
          return;
        }
        DataService.importData(importData);
        await this.loadTab(this.currentTab);
        Utils.showToast('All data imported successfully', 'success');
      } else {
        Utils.showToast('Invalid data format', 'error');
      }

    } catch (error) {
      console.error('Import error:', error);
      Utils.showToast('Failed to import data', 'error');
    }

    // Reset file input
    $('#importFile').val('');
  },

  /**
   * Reset current tab to default
   */
  async resetCurrentTab() {
    if (!Utils.confirm(`Reset ${this.currentTab} to default data? This cannot be undone.`)) {
      return;
    }

    await DataService.resetModuleData(this.currentTab);
    await this.loadTab(this.currentTab);
    Utils.showToast('Data reset successfully', 'success');
  },

  /**
   * Reset all data to defaults
   */
  async resetAll() {
    if (!Utils.confirm('Reset ALL data to defaults? This cannot be undone.')) {
      return;
    }

    const success = await DataService.resetAllData();
    if (success) {
      await this.loadTab(this.currentTab);
      Utils.showToast('All data reset successfully', 'success');
    } else {
      Utils.showToast('Failed to reset data', 'error');
    }
  }
};

// Initialize on page load
$(document).ready(function() {
  if ($('#dataTable').length) {
    AdminModule.init();
  }
});
