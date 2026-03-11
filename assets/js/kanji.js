/**
 * Kanji Module
 * Handles Kanji page functionality
 */

const KanjiModule = {
  data: [],
  filteredData: [],

  /**
   * Initialize the module
   */
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderCards();
    this.populateFilters();
  },

  /**
   * Load kanji data
   */
  async loadData() {
    this.data = await DataService.getModuleData('kanji');
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

    // Flashcard button
    $('#btnFlashcard').on('click', () => {
      window.location.href = 'flashcards.html?type=kanji';
    });

    // Quiz button
    $('#btnQuiz').on('click', () => {
      window.location.href = 'quiz.html?type=kanji';
    });
  },

  /**
   * Filter data based on search, level, and lesson
   */
  filterData() {
    const searchTerm = $('#searchInput').val();
    const selectedLevel = $('#levelFilter').val();
    const selectedLesson = $('#lessonFilter').val();

    let filtered = [...this.data];

    // Apply search filter
    if (searchTerm) {
      filtered = Utils.filterBySearch(filtered, searchTerm, ['kanji', 'meaning_vi', 'onyomi', 'kunyomi', 'example_word']);
    }

    // Apply level filter
    if (selectedLevel && selectedLevel !== 'all') {
      filtered = filtered.filter(item => item.level === selectedLevel);
    }

    // Apply lesson filter
    if (selectedLesson && selectedLesson !== 'all') {
      filtered = filtered.filter(item => item.lesson === selectedLesson);
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

    // Lesson filter
    const lessons = Utils.getUniqueValues(this.data, 'lesson').sort();
    const $lessonSelect = $('#lessonFilter');
    $lessonSelect.empty();
    $lessonSelect.append('<option value="all">All Lessons</option>');
    lessons.forEach(lesson => {
      $lessonSelect.append(`<option value="${lesson}">${lesson}</option>`);
    });
  },

  /**
   * Render kanji cards
   */
  renderCards() {
    const $container = $('#cardsContainer');
    $container.empty();

    if (this.filteredData.length === 0) {
      $container.append(`
        <div class="col-12 text-center py-5">
          <p class="text-muted">No kanji found</p>
        </div>
      `);
      return;
    }

    this.filteredData.forEach(item => {
      const card = this.createCard(item);
      $container.append(card);
    });

    // Update count
    $('#resultCount').text(`${this.filteredData.length} kanji`);
  },

  /**
   * Create a kanji card
   * @param {Object} item - Kanji data
   * @returns {jQuery} Card element
   */
  createCard(item) {
    return $(`
      <div class="col-12 col-md-6 col-lg-4 mb-3">
        <div class="card h-100 kanji-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <div class="kanji-char-large">${Utils.escapeHtml(item.kanji)}</div>
              <span class="badge bg-primary">${Utils.escapeHtml(item.level)}</span>
            </div>
            <div class="meaning mb-3">
              <strong>Meaning:</strong> ${Utils.escapeHtml(item.meaning_vi)}
            </div>
            <hr>
            <div class="readings mb-2">
              <div class="mb-1">
                <strong>On'yomi:</strong> <span class="text-danger">${Utils.escapeHtml(item.onyomi)}</span>
              </div>
              <div>
                <strong>Kun'yomi:</strong> <span class="text-success">${Utils.escapeHtml(item.kunyomi || '-')}</span>
              </div>
            </div>
            ${item.example_word ? `
              <hr>
              <div class="example">
                <div><strong>Example:</strong> ${Utils.escapeHtml(item.example_word)}</div>
                <div class="text-muted">${Utils.escapeHtml(item.example_reading)}</div>
                <div class="text-muted small">${Utils.escapeHtml(item.example_meaning)}</div>
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
  if ($('#cardsContainer').length && window.location.pathname.includes('kanji')) {
    KanjiModule.init();
  }
});
