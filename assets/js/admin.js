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
    $('.nav-tabs button').on('click', (e) => {
      // Remove active class from all buttons
      $('.nav-tabs button').removeClass('active');
      // Add active class to clicked button
      $(e.target).addClass('active');
      
      // Get tab name from button id
      const tabId = $(e.target).attr('id').replace('tab-', '').replace('-btn', '');
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
          <td colspan="10" class="text-center text-muted py-4">Không có dữ liệu</td>
        </tr>
      `);
      return;
    }

    this.currentData.forEach((item, index) => {
      const row = this.createTableRow(item, index);
      $tbody.append(row);
    });

    // Update count
    $('#itemCount').text(`${this.currentData.length} mục`);
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
      
      case 'grammar':
        cells = `
          <td>${Utils.escapeHtml(item.pattern)}</td>
          <td>${Utils.escapeHtml(item.meaning_vi)}</td>
          <td>${Utils.escapeHtml(item.jlpt_level)}</td>
          <td>${Utils.escapeHtml(item.lesson)}</td>
          <td>${Utils.escapeHtml((item.tags || []).join(', '))}</td>
        `;
        break;
    }

    return $(`
      <tr data-id="${Utils.escapeHtml(item.id)}">
        <td>${index + 1}</td>
        ${cells}
        <td>
          <button class="btn btn-sm btn-primary me-1" onclick="AdminModule.editItem('${item.id}')">
            <i class="bi bi-pencil"></i> Sửa
          </button>
          <button class="btn btn-sm btn-danger" onclick="AdminModule.deleteItem('${item.id}')">
            <i class="bi bi-trash"></i> Xóa
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
    $('#modalTitle').text(`Thêm ${this.currentTab.charAt(0).toUpperCase() + this.currentTab.slice(1)}`);
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
    $('#modalTitle').text(`Sửa ${this.currentTab.charAt(0).toUpperCase() + this.currentTab.slice(1)}`);
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
      
      case 'grammar':
        fields = [
          { name: 'pattern', label: 'Pattern', type: 'text', required: true },
          { name: 'title', label: 'Title', type: 'text', required: false },
          { name: 'meaning_vi', label: 'Meaning (Vietnamese)', type: 'text', required: true },
          { name: 'meaning_en', label: 'Meaning (English)', type: 'text', required: true },
          { name: 'structure', label: 'Structure', type: 'text', required: true },
          { name: 'formation', label: 'Formation', type: 'text', required: false },
          { name: 'usage_note_vi', label: 'Usage Note (Vietnamese)', type: 'textarea', required: true },
          { name: 'usage_note_en', label: 'Usage Note (English)', type: 'textarea', required: true },
          { name: 'jlpt_level', label: 'JLPT Level', type: 'select', options: ['N5', 'N4', 'N3', 'N2', 'N1'], required: true },
          { name: 'lesson', label: 'Lesson', type: 'text', required: true },
          { name: 'example_1', label: 'Example 1', type: 'text', required: true },
          { name: 'example_1_reading', label: 'Example 1 Reading', type: 'text', required: true },
          { name: 'example_1_translation_vi', label: 'Example 1 Translation (VI)', type: 'text', required: true },
          { name: 'example_2', label: 'Example 2', type: 'text', required: true },
          { name: 'example_2_reading', label: 'Example 2 Reading', type: 'text', required: true },
          { name: 'example_2_translation_vi', label: 'Example 2 Translation (VI)', type: 'text', required: true },
          { name: 'related_patterns', label: 'Related Patterns (comma-separated)', type: 'text', required: false },
          { name: 'tags', label: 'Tags (comma-separated)', type: 'text', required: false }
        ];
        break;
    }

    fields.forEach(field => {
      let value = data[field.name] || '';
      
      // Handle arrays for grammar
      if (field.name === 'related_patterns' || field.name === 'tags') {
        if (Array.isArray(value)) {
          value = value.join(', ');
        }
      }
      
      const requiredAttr = field.required ? 'required' : '';

      if (field.type === 'select') {
        const options = field.options.map(opt => 
          `<option value="${opt}" ${value === opt ? 'selected' : ''}>${opt}</option>`
        ).join('');
        
        $form.append(`
          <div class="mb-3">
            <label for="field-${field.name}" class="form-label">${field.label}</label>
            <select class="form-select" id="field-${field.name}" name="${field.name}" ${requiredAttr}>
              <option value="">Chọn...</option>
              ${options}
            </select>
          </div>
        `);
      } else if (field.type === 'textarea') {
        $form.append(`
          <div class="mb-3">
            <label for="field-${field.name}" class="form-label">${field.label}</label>
            <textarea class="form-control" id="field-${field.name}" 
                   name="${field.name}" rows="3" ${requiredAttr}>${Utils.escapeHtml(value)}</textarea>
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
    $('#itemForm').find('input, select, textarea').each(function() {
      const name = $(this).attr('name');
      let value = $(this).val();
      
      // Handle array fields for grammar
      if (name === 'related_patterns' || name === 'tags') {
        if (value) {
          value = value.split(',').map(v => v.trim()).filter(v => v);
        } else {
          value = [];
        }
      }
      
      formData[name] = value;
    });

    // Validate required fields
    if (!this.validateForm(formData)) {
      Utils.showToast('Vui lòng điền đầy đủ các trường bắt buộc', 'error');
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
    Utils.showToast('Lưu thành công', 'success');
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
      'kanji': ['kanji', 'meaning_vi', 'onyomi', 'level'],
      'grammar': ['pattern', 'meaning_vi', 'meaning_en', 'structure', 'usage_note_vi', 'usage_note_en', 'jlpt_level', 'lesson', 'example_1', 'example_1_reading', 'example_1_translation_vi', 'example_2', 'example_2_reading', 'example_2_translation_vi']
    };

    return requiredFields[this.currentTab]?.includes(fieldName) || false;
  },

  /**
   * Delete item
   * @param {string} id - Item ID
   */
  async deleteItem(id) {
    if (!Utils.confirm('Bạn có chắc chắn muốn xóa mục này?')) {
      return;
    }

    this.currentData = this.currentData.filter(item => item.id !== id);
    DataService.saveModuleData(this.currentTab, this.currentData);
    this.renderTable();
    Utils.showToast('Xóa thành công', 'success');
  },

  /**
   * Export current tab data
   */
  async exportCurrentTab() {
    const data = await DataService.getModuleData(this.currentTab);
    const filename = `${this.currentTab}_${Utils.formatDate(new Date())}.json`;
    Utils.downloadJSON(data, filename);
    Utils.showToast('Xuất dữ liệu thành công', 'success');
  },

  /**
   * Export all data
   */
  async exportAll() {
    const allData = await DataService.exportAllData();
    const filename = `japanese_study_backup_${Utils.formatDate(new Date())}.json`;
    Utils.downloadJSON(allData, filename);
    Utils.showToast('Xuất tất cả dữ liệu thành công', 'success');
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
        Utils.showToast('Tệp JSON không hợp lệ', 'error');
        return;
      }

      const importData = JSON.parse(fileContent);

      // Check if it's a single module or all data
      if (Array.isArray(importData)) {
        // Single module import
        if (!Utils.confirm(`Nhập dữ liệu vào ${this.currentTab}? Điều này sẽ thay thế dữ liệu hiện tại.`)) {
          return;
        }
        DataService.saveModuleData(this.currentTab, importData);
        await this.loadTab(this.currentTab);
        Utils.showToast('Nhập dữ liệu thành công', 'success');
      } else if (typeof importData === 'object') {
        // All data import
        if (!Utils.confirm('Nhập tất cả dữ liệu? Điều này sẽ thay thế tất cả dữ liệu hiện tại.')) {
          return;
        }
        DataService.importData(importData);
        await this.loadTab(this.currentTab);
        Utils.showToast('Nhập tất cả dữ liệu thành công', 'success');
      } else {
        Utils.showToast('Định dạng dữ liệu không hợp lệ', 'error');
      }

    } catch (error) {
      console.error('Import error:', error);
      Utils.showToast('Nhập dữ liệu thất bại', 'error');
    }

    // Reset file input
    $('#importFile').val('');
  },

  /**
   * Reset current tab to default
   */
  async resetCurrentTab() {
    if (!Utils.confirm(`Đặt lại ${this.currentTab} về dữ liệu mặc định? Thao tác này không thể hoàn tác.`)) {
      return;
    }

    await DataService.resetModuleData(this.currentTab);
    await this.loadTab(this.currentTab);
    Utils.showToast('Đặt lại dữ liệu thành công', 'success');
  },

  /**
   * Reset all data to defaults
   */
  async resetAll() {
    if (!Utils.confirm('Đặt lại TẤT CẢ dữ liệu về mặc định? Thao tác này không thể hoàn tác.')) {
      return;
    }

    const success = await DataService.resetAllData();
    if (success) {
      await this.loadTab(this.currentTab);
      Utils.showToast('Đặt lại tất cả dữ liệu thành công', 'success');
    } else {
      Utils.showToast('Đặt lại dữ liệu thất bại', 'error');
    }
  }
};

// Initialize on page load
$(document).ready(function() {
  if ($('#dataTable').length) {
    AdminModule.init();
  }
});
