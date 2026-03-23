/**
 * Grammar Module
 * Handles Grammar page functionality
 */

const GrammarModule = {
  data: [],
  filteredData: [],
  viewMode: 'card', // 'card' or 'list'

  /**
   * Initialize the module
   */
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.populateFilters();
    this.applyLevelFilter(); // Apply saved level filter
    this.applyURLFilters();
    this.filterData(); // Trigger filter to apply level
  },

  /**
   * Load grammar data
   */
  async loadData() {
    this.data = await DataService.getModuleData('grammar');
    this.filteredData = [...this.data];
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Search input
    $('#searchInput').on('input', Utils.debounce(() => {
      this.filterData();
    }, 300));

    // Level filter
    $('#levelFilter').on('change', () => {
      this.filterData();
    });

    // Lesson filter
    $('#lessonFilter').on('change', () => {
      this.filterData();
    });

    // Tag filter
    $('#tagFilter').on('change', () => {
      this.filterData();
    });

    // Reset filters
    $('#btnResetFilters').on('click', () => {
      this.resetFilters();
    });

    // View mode toggle
    $('#btnCardView').on('click', () => {
      this.setViewMode('card');
    });

    $('#btnListView').on('click', () => {
      this.setViewMode('list');
    });

    // Flashcard button
    $('#btnFlashcard').on('click', () => {
      window.location.href = 'flashcards.html?type=grammar';
    });

    // Quiz button
    $('#btnQuiz').on('click', () => {
      window.location.href = 'quiz.html?type=grammar';
    });

    // Modal flashcard/quiz buttons
    $('#btnFlashcardDetail').on('click', () => {
      window.location.href = 'flashcards.html?type=grammar';
    });

    $('#btnQuizDetail').on('click', () => {
      window.location.href = 'quiz.html?type=grammar';
    });
  },

  /**
   * Filter data based on search, level, lesson, and tag
   */
  filterData() {
    const searchTerm = $('#searchInput').val().toLowerCase();
    const selectedLevel = $('#levelFilter').val();
    const selectedLesson = $('#lessonFilter').val();
    const selectedTag = $('#tagFilter').val();

    let filtered = [...this.data];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchFields = [
          item.pattern,
          item.title,
          item.meaning_vi,
          item.meaning_en,
          item.usage_note_vi,
          item.usage_note_en,
          ...(item.tags || [])
        ].map(field => (field || '').toLowerCase());

        return searchFields.some(field => field.includes(searchTerm));
      });
    }

    // Apply level filter
    if (selectedLevel && selectedLevel !== 'all') {
      filtered = filtered.filter(item => item.jlpt_level === selectedLevel);
    }

    // Apply lesson filter
    if (selectedLesson && selectedLesson !== 'all') {
      const selectedLessonNo = DataService.normalizeLessonNumber(selectedLesson);
      filtered = filtered.filter(item => {
        const itemLessonNo = DataService.normalizeLessonNumber(item.lesson);
        if (selectedLessonNo && itemLessonNo) {
          return itemLessonNo === selectedLessonNo;
        }
        return String(item.lesson) === String(selectedLesson);
      });
    }

    // Apply tag filter
    if (selectedTag && selectedTag !== 'all') {
      filtered = filtered.filter(item => 
        item.tags && item.tags.includes(selectedTag)
      );
    }

    this.filteredData = filtered;
    this.render();
  },

  /**
   * Populate filter dropdowns
   */
  populateFilters() {
    // Populate JLPT levels
    const levels = Utils.getUniqueValues(this.data, 'jlpt_level').sort((a, b) => {
      const order = { 'N5': 1, 'N4': 2, 'N3': 3, 'N2': 4, 'N1': 5 };
      return order[a] - order[b];
    });
    const $levelSelect = $('#levelFilter');
    levels.forEach(level => {
      $levelSelect.append(`<option value="${level}">${level}</option>`);
    });

    // Populate lessons
    const lessons = Utils.getUniqueValues(this.data, 'lesson').sort((a, b) => {
      const lessonA = DataService.normalizeLessonNumber(a) || 0;
      const lessonB = DataService.normalizeLessonNumber(b) || 0;
      return lessonA - lessonB;
    });
    const $lessonSelect = $('#lessonFilter');
    lessons.forEach(lesson => {
      $lessonSelect.append(`<option value="${lesson}">Lesson ${lesson}</option>`);
    });

    // Populate tags
    const allTags = new Set();
    this.data.forEach(item => {
      if (item.tags && Array.isArray(item.tags)) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });
    const tags = Array.from(allTags).sort();
    const $tagSelect = $('#tagFilter');
    tags.forEach(tag => {
      $tagSelect.append(`<option value="${tag}">${tag}</option>`);
    });
  },

  /**
   * Apply saved level filter
   */
  applyLevelFilter() {
    const savedLevel = Storage.getCurrentLevel();
    if (savedLevel) {
      $('#levelFilter').val(savedLevel);
    }
  },

  /**
   * Apply URL filters if present (?level=N5&lesson=1)
   * For grammar, lesson in URL is relative lesson by level and gets mapped to absolute.
   */
  applyURLFilters() {
    const params = new URLSearchParams(window.location.search);
    const level = params.get('level');
    const lesson = params.get('lesson');

    if (level) {
      $('#levelFilter').val(level);
    }

    if (lesson) {
      const lessonNo = DataService.normalizeLessonNumber(lesson);
      const selectedLevel = level || $('#levelFilter').val();
      if (lessonNo && selectedLevel && selectedLevel !== 'all') {
        const grammarLesson = DataService.toGrammarLessonByLevel(selectedLevel, lessonNo);
        if ($('#lessonFilter option[value="' + String(grammarLesson) + '"]').length > 0) {
          $('#lessonFilter').val(String(grammarLesson));
        }
      } else if (lessonNo && $('#lessonFilter option[value="' + String(lessonNo) + '"]').length > 0) {
        $('#lessonFilter').val(String(lessonNo));
      }
    }
  },

  /**
   * Reset all filters
   */
  resetFilters() {
    $('#searchInput').val('');
    $('#levelFilter').val('all');
    $('#lessonFilter').val('all');
    $('#tagFilter').val('all');
    this.filterData();
  },

  /**
   * Set view mode
   */
  setViewMode(mode) {
    this.viewMode = mode;
    
    // Update button states
    $('#btnCardView').toggleClass('active', mode === 'card');
    $('#btnListView').toggleClass('active', mode === 'list');
    
    // Toggle containers
    $('#cardViewContainer').toggle(mode === 'card');
    $('#listViewContainer').toggle(mode === 'list');
    
    this.render();
  },

  /**
   * Render data based on view mode
   */
  render() {
    // Update item count
    $('#itemCount').text(this.filteredData.length);

    if (this.viewMode === 'card') {
      this.renderCards();
    } else {
      this.renderTable();
    }
  },

  /**
   * Render grammar cards
   */
  renderCards() {
    const $container = $('#grammarCards');
    $container.empty();

    if (this.filteredData.length === 0) {
      $container.append(`
        <div class="col-12">
          <div class="grammar-empty-state">
            <i class="bi bi-inbox"></i>
            <h3>Không tìm thấy mẫu ngữ pháp</h3>
            <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        </div>
      `);
      return;
    }

    this.filteredData.forEach(item => {
      const card = this.createCard(item);
      $container.append(card);
    });
  },

  /**
   * Create a grammar card
   */
  createCard(item) {
    const levelClass = (item.jlpt_level || 'n5').toLowerCase();
    const tags = item.tags && Array.isArray(item.tags) 
      ? item.tags.map(tag => `<span class="grammar-tag">${Utils.escapeHtml(tag)}</span>`).join('')
      : '';

    return $(`
      <div class="col-md-6 col-lg-4">
        <div class="grammar-card">
          <div class="grammar-pattern">${Utils.escapeHtml(item.pattern)}</div>
          
          <div class="grammar-meta">
            <span class="grammar-level-badge ${levelClass}">${Utils.escapeHtml(item.jlpt_level)}</span>
            <span class="grammar-lesson-badge">Lesson ${Utils.escapeHtml(item.lesson)}</span>
          </div>

          <div class="grammar-meaning">
            <div class="grammar-meaning-vi">🇻🇳 ${Utils.escapeHtml(item.meaning_vi)}</div>
            <div class="grammar-meaning-en">🇬🇧 ${Utils.escapeHtml(item.meaning_en)}</div>
          </div>

          <div class="grammar-structure">
            <strong>Structure:</strong> ${Utils.escapeHtml(item.structure)}
          </div>

          <div class="grammar-example">
            <div class="grammar-example-text">${Utils.escapeHtml(item.example_1)}</div>
            <div class="grammar-example-reading">${Utils.escapeHtml(item.example_1_reading)}</div>
            <div class="grammar-example-translation">${Utils.escapeHtml(item.example_1_translation_vi)}</div>
          </div>

          ${tags ? `<div class="mb-2">${tags}</div>` : ''}

          <div class="grammar-card-actions">
            <button class="btn btn-sm btn-primary" onclick="GrammarModule.showDetail('${item.id}')">
              <i class="bi bi-eye"></i> Details
            </button>
          </div>
        </div>
      </div>
    `);
  },

  /**
   * Render grammar table
   */
  renderTable() {
    const $tbody = $('#grammarTableBody');
    $tbody.empty();

    if (this.filteredData.length === 0) {
      $tbody.append(`
        <tr>
          <td colspan="7" class="text-center text-muted py-4">
            <div class="grammar-empty-state">
              <i class="bi bi-inbox"></i>
              <h3>Không tìm thấy mẫu ngữ pháp</h3>
              <p>Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
            </div>
          </td>
        </tr>
      `);
      return;
    }

    this.filteredData.forEach(item => {
      const levelClass = (item.jlpt_level || 'n5').toLowerCase();
      const tags = item.tags && Array.isArray(item.tags)
        ? item.tags.map(tag => `<span class="grammar-tag">${Utils.escapeHtml(tag)}</span>`).join(' ')
        : '';

      $tbody.append(`
        <tr>
          <td><strong>${Utils.escapeHtml(item.pattern)}</strong></td>
          <td>${Utils.escapeHtml(item.meaning_vi)}</td>
          <td>${Utils.escapeHtml(item.meaning_en)}</td>
          <td>${Utils.escapeHtml(item.lesson)}</td>
          <td><span class="grammar-level-badge ${levelClass}">${Utils.escapeHtml(item.jlpt_level)}</span></td>
          <td>${tags}</td>
          <td>
            <button class="btn btn-sm btn-primary" onclick="GrammarModule.showDetail('${item.id}')">
              <i class="bi bi-eye"></i> View
            </button>
          </td>
        </tr>
      `);
    });
  },

  /**
   * Show grammar detail in modal
   */
  showDetail(id) {
    const item = this.data.find(g => g.id === id);
    if (!item) return;

    const levelClass = (item.jlpt_level || 'n5').toLowerCase();
    const relatedPatterns = item.related_patterns && Array.isArray(item.related_patterns)
      ? item.related_patterns.map(p => `<span class="grammar-related-pattern">${Utils.escapeHtml(p)}</span>`).join('')
      : '<span class="text-muted">None</span>';
    
    const tags = item.tags && Array.isArray(item.tags)
      ? item.tags.map(tag => `<span class="grammar-tag">${Utils.escapeHtml(tag)}</span>`).join('')
      : '<span class="text-muted">None</span>';

    const modalContent = `
      <div class="grammar-detail">
        <div class="text-center mb-4">
          <div class="grammar-pattern">${Utils.escapeHtml(item.pattern)}</div>
          <div class="grammar-meta justify-content-center">
            <span class="grammar-level-badge ${levelClass}">${Utils.escapeHtml(item.jlpt_level)}</span>
            <span class="grammar-lesson-badge">Lesson ${Utils.escapeHtml(item.lesson)}</span>
          </div>
        </div>

        <div class="grammar-detail-section">
          <h6><i class="bi bi-translate"></i> Meaning</h6>
          <div class="grammar-meaning">
            <div class="grammar-meaning-vi">🇻🇳 ${Utils.escapeHtml(item.meaning_vi)}</div>
            <div class="grammar-meaning-en">🇬🇧 ${Utils.escapeHtml(item.meaning_en)}</div>
          </div>
        </div>

        <div class="grammar-detail-section">
          <h6><i class="bi bi-diagram-3"></i> Structure</h6>
          <div class="grammar-structure">
            ${Utils.escapeHtml(item.structure)}
          </div>
          ${item.formation ? `<div class="mt-2"><strong>Formation:</strong> ${Utils.escapeHtml(item.formation)}</div>` : ''}
        </div>

        <div class="grammar-detail-section">
          <h6><i class="bi bi-lightbulb"></i> Usage Notes</h6>
          <div class="grammar-usage-note">
            <div class="grammar-usage-note-title">Vietnamese</div>
            <div class="grammar-usage-note-content">${Utils.escapeHtml(item.usage_note_vi)}</div>
          </div>
          <div class="grammar-usage-note" style="background-color: #f0fff4; border-color: #48bb78;">
            <div class="grammar-usage-note-title" style="color: #22543d;">English</div>
            <div class="grammar-usage-note-content">${Utils.escapeHtml(item.usage_note_en)}</div>
          </div>
        </div>

        <div class="grammar-detail-section">
          <h6><i class="bi bi-clipboard-check"></i> Examples</h6>
          <div class="grammar-example">
            <div class="grammar-example-text">${Utils.escapeHtml(item.example_1)}</div>
            <div class="grammar-example-reading">${Utils.escapeHtml(item.example_1_reading)}</div>
            <div class="grammar-example-translation">${Utils.escapeHtml(item.example_1_translation_vi)}</div>
          </div>
          <div class="grammar-example">
            <div class="grammar-example-text">${Utils.escapeHtml(item.example_2)}</div>
            <div class="grammar-example-reading">${Utils.escapeHtml(item.example_2_reading)}</div>
            <div class="grammar-example-translation">${Utils.escapeHtml(item.example_2_translation_vi)}</div>
          </div>
        </div>

        <div class="grammar-detail-section">
          <h6><i class="bi bi-link-45deg"></i> Related Patterns</h6>
          <div class="grammar-related-patterns">
            ${relatedPatterns}
          </div>
        </div>

        <div class="grammar-detail-section">
          <h6><i class="bi bi-tags"></i> Tags</h6>
          <div>
            ${tags}
          </div>
        </div>
      </div>
    `;

    $('#modalTitle').text(item.title || item.pattern);
    $('#modalBody').html(modalContent);
    
    const modal = new bootstrap.Modal(document.getElementById('grammarDetailModal'));
    modal.show();
  },

  /**
   * Get grammar by lesson
   */
  getGrammarByLesson(lesson) {
    return this.data.filter(item => item.lesson === lesson);
  },

  /**
   * Get grammar by JLPT level
   */
  getGrammarByLevel(level) {
    return this.data.filter(item => item.jlpt_level === level);
  }
};

// Initialize on page load
$(document).ready(() => {
  GrammarModule.init();
});
