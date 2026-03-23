/**
 * Vocabulary Module
 * Handles Vocabulary page functionality
 */

const VocabModule = {
  data: [],
  filteredData: [],

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
   * Load vocabulary data
   */
  async loadData() {
    this.data = await DataService.getModuleData('vocab');
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

    // Type filter
    $('#typeFilter').on('change', () => {
      this.filterData();
    });

    // Lesson filter
    $('#lessonFilter').on('change', () => {
      this.filterData();
    });

    // Flashcard button
    $('#btnFlashcard').on('click', () => {
      window.location.href = 'flashcards.html?type=vocab';
    });

    // Quiz button
    $('#btnQuiz').on('click', () => {
      window.location.href = 'quiz.html?type=vocab';
    });
  },

  /**
   * Filter data based on search, level, type, and lesson
   */
  filterData() {
    const searchTerm = $('#searchInput').val();
    const selectedLevel = $('#levelFilter').val();
    const selectedType = $('#typeFilter').val();
    const selectedLesson = $('#lessonFilter').val();

    let filtered = [...this.data];

    // Apply search filter
    if (searchTerm) {
      filtered = Utils.filterBySearch(filtered, searchTerm, [
        'word', 'reading', 'romaji', 'meaning_vi', 'meaning_en', 'type', 'category', 'lesson_title'
      ]);
    }

    // Apply level filter
    if (selectedLevel && selectedLevel !== 'all') {
      filtered = filtered.filter(item => item.level === selectedLevel);
    }

    // Apply type filter
    if (selectedType && selectedType !== 'all') {
      filtered = filtered.filter(item => item.type === selectedType);
    }

    // Apply lesson filter
    if (selectedLesson && selectedLesson !== 'all') {
      const selectedLessonNo = DataService.normalizeLessonNumber(selectedLesson);
      filtered = filtered.filter(item => {
        const itemLessonNo = DataService.normalizeLessonNumber(item.lesson);
        if (selectedLessonNo && itemLessonNo) {
          return itemLessonNo === selectedLessonNo;
        }
        return String(item.lesson) === selectedLesson;
      });
    }

    this.filteredData = filtered;
    this.renderCards();
  },

  /**
   * Populate filter dropdowns
   */
  populateFilters() {
    // Level filter
    const levels = Utils.getUniqueValues(this.data, 'level').sort((a, b) => {
      const order = { 'N5': 1, 'N4': 2, 'N3': 3, 'N2': 4, 'N1': 5 };
      return order[a] - order[b];
    });
    
    const $levelSelect = $('#levelFilter');
    $levelSelect.empty();
    $levelSelect.append('<option value="all">All Levels</option>');
    levels.forEach(level => {
      $levelSelect.append(`<option value="${level}">${level}</option>`);
    });

    // Type filter
    const types = Utils.getUniqueValues(this.data, 'type')
      .map(type => String(type || '').trim())
      .filter(type => type !== '')
      .sort();
    const $typeSelect = $('#typeFilter');
    $typeSelect.empty();
    $typeSelect.append('<option value="all">All Types</option>');
    types.forEach(type => {
      $typeSelect.append(`<option value="${type}">${type}</option>`);
    });

    // Lesson filter
    const lessons = Utils.getUniqueValues(this.data, 'lesson').sort((a, b) => {
      const lessonA = DataService.normalizeLessonNumber(a) || 0;
      const lessonB = DataService.normalizeLessonNumber(b) || 0;
      return lessonA - lessonB;
    });
    const $lessonSelect = $('#lessonFilter');
    $lessonSelect.empty();
    $lessonSelect.append('<option value="all">All Lessons</option>');
    lessons.forEach(lesson => {
      $lessonSelect.append(`<option value="${lesson}">${lesson}</option>`);
    });
  },

  /**
   * Apply saved level filter from storage
   */
  applyLevelFilter() {
    const savedLevel = Storage.getCurrentLevel();
    if (savedLevel) {
      $('#levelFilter').val(savedLevel);
    }
  },

  /**
   * Apply URL filters if present (?level=N5&lesson=1)
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
      if (lessonNo) {
        const lessonKey = `L${lessonNo}`;
        if ($('#lessonFilter option[value="' + lessonKey + '"]').length > 0) {
          $('#lessonFilter').val(lessonKey);
        } else if ($('#lessonFilter option[value="' + String(lessonNo) + '"]').length > 0) {
          $('#lessonFilter').val(String(lessonNo));
        }
      }
    }
  },

  /**
   * Render vocabulary cards
   */
  renderCards() {
    const $container = $('#cardsContainer');
    $container.empty();

    if (this.filteredData.length === 0) {
      $container.append(`
        <div class="col-12 text-center py-5">
          <p class="text-muted">Không tìm thấy từ vựng</p>
        </div>
      `);
      return;
    }

    this.filteredData.forEach(item => {
      const card = this.createCard(item);
      $container.append(card);
    });

    // Update count
    $('#resultCount').text(`${this.filteredData.length} từ`);
  },

  /**
   * Create a vocabulary card
   * @param {Object} item - Vocabulary data
   * @returns {jQuery} Card element
   */
  createCard(item) {
    const level = item.level || '-';
    const reading = item.reading || '';
    const romaji = item.romaji || '';
    const meaningVi = item.meaning_vi || item.meaning_en || '';
    const meaningEn = item.meaning_en || item.meaning_vi || '';
    const type = item.type || item.category || '-';

    return $(`
      <div class="col-12 col-md-6 col-lg-4 mb-3">
        <div class="card h-100 vocab-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <h5 class="card-title mb-0 kanji-char">${Utils.escapeHtml(item.word)}</h5>
              <span class="badge bg-primary">${Utils.escapeHtml(level)}</span>
            </div>
            <div class="reading mb-2 text-secondary">${Utils.escapeHtml(reading)}</div>
            ${romaji ? `<div class="romaji mb-2 text-muted small">${Utils.escapeHtml(romaji)}</div>` : ''}
            <hr>
            <div class="meaning mb-2">
              <strong>VN:</strong> ${Utils.escapeHtml(meaningVi)}<br>
              <strong>EN:</strong> ${Utils.escapeHtml(meaningEn)}
            </div>
            <div class="type-badge">
              <span class="badge bg-secondary">${Utils.escapeHtml(type)}</span>
            </div>
            ${item.example ? `
              <hr>
              <div class="example small">
                <div><strong>Example:</strong> ${Utils.escapeHtml(item.example)}</div>
                ${item.example_reading ? `<div class="text-muted">${Utils.escapeHtml(item.example_reading)}</div>` : ''}
                ${item.example_meaning ? `<div class="text-muted">${Utils.escapeHtml(item.example_meaning)}</div>` : ''}
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `);
  }
};

// Initialize on page load
$(document).ready(function() {
  if ($('#cardsContainer').length && window.location.pathname.includes('vocab')) {
    VocabModule.init();
  }
});
