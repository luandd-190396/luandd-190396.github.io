/**
 * Hiragana Module
 * Handles Hiragana page functionality
 */

const HiraganaModule = {
  data: [],
  filteredData: [],

  /**
   * Initialize the module
   */
  async init() {
    await this.loadData();
    this.setupEventListeners();
    this.renderCards();
    this.populateGroupFilter();
  },

  /**
   * Load hiragana data
   */
  async loadData() {
    this.data = await DataService.getModuleData('hiragana');
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

    // Group filter
    $('#groupFilter').on('change', () => {
      this.filterData();
    });

    // Flashcard button
    $('#btnFlashcard').on('click', () => {
      window.location.href = 'flashcards.html?type=hiragana';
    });

    // Quiz button
    $('#btnQuiz').on('click', () => {
      window.location.href = 'quiz.html?type=hiragana';
    });
  },

  /**
   * Filter data based on search and group
   */
  filterData() {
    const searchTerm = $('#searchInput').val();
    const selectedGroup = $('#groupFilter').val();

    let filtered = [...this.data];

    // Apply search filter
    if (searchTerm) {
      filtered = Utils.filterBySearch(filtered, searchTerm, ['kana', 'romaji', 'example']);
    }

    // Apply group filter
    if (selectedGroup && selectedGroup !== 'all') {
      filtered = filtered.filter(item => item.group === selectedGroup);
    }

    this.filteredData = filtered;
    this.renderCards();
  },

  /**
   * Populate group filter dropdown
   */
  populateGroupFilter() {
    const groups = Utils.getUniqueValues(this.data, 'group');
    const $select = $('#groupFilter');
    
    $select.empty();
    $select.append('<option value="all">All Groups</option>');
    
    groups.forEach(group => {
      $select.append(`<option value="${group}">${group}</option>`);
    });
  },

  /**
   * Render character cards
   */
  renderCards() {
    const $container = $('#cardsContainer');
    $container.empty();

    if (this.filteredData.length === 0) {
      $container.append(`
        <div class="col-12 text-center py-5">
          <p class="text-muted">No characters found</p>
        </div>
      `);
      return;
    }

    this.filteredData.forEach(item => {
      const card = this.createCard(item);
      $container.append(card);
    });

    // Update count
    $('#resultCount').text(`${this.filteredData.length} characters`);
  },

  /**
   * Create a character card
   * @param {Object} item - Character data
   * @returns {jQuery} Card element
   */
  createCard(item) {
    return $(`
      <div class="col-6 col-md-4 col-lg-3 col-xl-2 mb-3">
        <div class="card h-100 text-center kana-card">
          <div class="card-body">
            <div class="kana-char mb-2">${Utils.escapeHtml(item.kana)}</div>
            <div class="romaji mb-2 text-primary">${Utils.escapeHtml(item.romaji)}</div>
            <hr>
            <div class="example">
              <div class="fw-bold">${Utils.escapeHtml(item.example)}</div>
              <small class="text-muted">${Utils.escapeHtml(item.example_meaning)}</small>
            </div>
          </div>
        </div>
      </div>
    `);
  }
};

// Initialize on page load
$(document).ready(function() {
  if ($('#cardsContainer').length) {
    HiraganaModule.init();
  }
});
