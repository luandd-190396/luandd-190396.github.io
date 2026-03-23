/**
 * Flashcards Module
 * Handles interactive flashcard functionality
 */

const FlashcardsModule = {
  deck: [],
  currentIndex: 0,
  isFlipped: false,
  type: 'hiragana',

  /**
   * Initialize the module
   */
  async init() {
    this.getTypeFromURL();
    await this.loadDeck();
    this.setupEventListeners();
    this.updateTypeSelector();
    await this.populateLessonFilter();
    this.showCard();
  },

  /**
   * Get type from URL parameter
   */
  getTypeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type && ['hiragana', 'katakana', 'vocab', 'kanji', 'grammar'].includes(type)) {
      this.type = type;
    }
  },

  /**
   * Load flashcard deck
   */
  async loadDeck(shuffle = false) {
    let data = await DataService.getModuleData(this.type);
    
    // Filter by saved level if applicable
    const savedLevel = Storage.getCurrentLevel();
    if (savedLevel && (this.type === 'vocab' || this.type === 'kanji' || this.type === 'grammar')) {
      data = data.filter(item => item.level === savedLevel || item.jlpt_level === savedLevel);
    }
    
    // Filter by selected lesson if applicable
    const selectedLesson = $('#lessonFilter').val();
    if (selectedLesson && selectedLesson !== 'all' && (this.type === 'vocab' || this.type === 'kanji' || this.type === 'grammar')) {
      const selectedLessonNo = DataService.normalizeLessonNumber(selectedLesson);
      data = data.filter(item => {
        const itemLessonNo = DataService.normalizeLessonNumber(item.lesson);
        if (selectedLessonNo && itemLessonNo) {
          return itemLessonNo === selectedLessonNo;
        }
        return String(item.lesson) === selectedLesson;
      });
    }
    
    this.deck = shuffle ? Utils.shuffleArray(data) : [...data];
    this.currentIndex = 0;
    this.isFlipped = false;
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Type selector
    $('#typeSelector').on('change', async (e) => {
      this.type = $(e.target).val();
      await this.populateLessonFilter();
      await this.loadDeck();
      this.showCard();
    });

    // Lesson filter
    $('#lessonFilter').on('change', async () => {
      await this.loadDeck();
      this.showCard();
    });

    // Navigation buttons
    $('#btnPrev').on('click', () => this.prevCard());
    $('#btnNext').on('click', () => this.nextCard());
    $('#btnFlip').on('click', () => this.flipCard());
    $('#btnShuffle').on('click', () => this.shuffleDeck());

    // Keyboard navigation
    $(document).on('keydown', (e) => {
      if (e.key === 'ArrowLeft') this.prevCard();
      if (e.key === 'ArrowRight') this.nextCard();
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        this.flipCard();
      }
    });

    // Click on card to flip
    $('.flashcard').on('click', () => this.flipCard());
  },

  /**
   * Update type selector value
   */
  updateTypeSelector() {
    $('#typeSelector').val(this.type);
  },

  /**
   * Populate lesson filter dropdown
   */
  async populateLessonFilter() {
    const $lessonSelect = $('#lessonFilter');
    $lessonSelect.empty();
    $lessonSelect.append('<option value="all">All Lessons</option>');
    
    // Only show lessons for vocab, kanji, and grammar
    if (this.type === 'vocab' || this.type === 'kanji' || this.type === 'grammar') {
      const data = await DataService.getModuleData(this.type);
      const lessons = Utils.getUniqueValues(data, 'lesson').sort((a, b) => {
        const lessonA = DataService.normalizeLessonNumber(a) || 0;
        const lessonB = DataService.normalizeLessonNumber(b) || 0;
        return lessonA - lessonB;
      });
      lessons.forEach(lesson => {
        $lessonSelect.append(`<option value="${lesson}">${lesson}</option>`);
      });
      $lessonSelect.prop('disabled', false);
    } else {
      $lessonSelect.prop('disabled', true);
    }
  },

  /**
   * Show current card
   */
  showCard() {
    if (this.deck.length === 0) {
      $('.flashcard-front').html('<h2>No data available</h2>');
      $('.flashcard-back').html('<h2>No data available</h2>');
      return;
    }

    const card = this.deck[this.currentIndex];
    
    // Reset flip state
    this.isFlipped = false;
    $('.flashcard').removeClass('flipped');

    // Render front and back
    this.renderFront(card);
    this.renderBack(card);

    // Auto-scale text to fit
    this.autoScaleText();

    // Update progress
    this.updateProgress();
  },

  /**
   * Auto-scale text to fit in flashcard
   */
  autoScaleText() {
    // Scale main text on front
    this.scaleElement('.flashcard-front .flashcard-main', 5, 2, 350);
    // Scale main text on back
    this.scaleElement('.flashcard-back .flashcard-main', 5, 2, 350);
    // Scale reading text
    this.scaleElement('.flashcard-reading', 2, 1.2, 350);
  },

  /**
   * Scale an element's font size to fit container
   * @param {string} selector - Element selector
   * @param {number} maxSize - Maximum font size in rem
   * @param {number} minSize - Minimum font size in rem
   * @param {number} maxHeight - Maximum height in px
   */
  scaleElement(selector, maxSize, minSize, maxHeight) {
    const $element = $(selector);
    if ($element.length === 0) return;

    // Reset to max size first
    $element.css('font-size', maxSize + 'rem');

    // Get text length for adjustment
    const textLength = $element.text().length;
    const elementHeight = $element.outerHeight();

    let fontSize = maxSize;

    // Scale based on text length
    if (textLength > 50) {
      fontSize = Math.max(minSize, maxSize * 0.4);
    } else if (textLength > 30) {
      fontSize = Math.max(minSize, maxSize * 0.5);
    } else if (textLength > 20) {
      fontSize = Math.max(minSize, maxSize * 0.6);
    } else if (textLength > 10) {
      fontSize = Math.max(minSize, maxSize * 0.75);
    } else if (textLength > 5) {
      fontSize = Math.max(minSize, maxSize * 0.85);
    }

    // Also check height
    if (elementHeight > maxHeight) {
      fontSize = Math.max(minSize, fontSize * 0.7);
    }

    $element.css('font-size', fontSize + 'rem');
  },

  /**
   * Render card front
   * @param {Object} card - Card data
   */
  renderFront(card) {
    const $front = $('.flashcard-front');
    
    switch(this.type) {
      case 'hiragana':
      case 'katakana':
        $front.html(`
          <div class="flashcard-main">${Utils.escapeHtml(card.kana)}</div>
        `);
        break;
      
      case 'vocab':
        $front.html(`
          <div class="flashcard-main">${Utils.escapeHtml(card.word || '')}</div>
          <div class="flashcard-reading">${Utils.escapeHtml(card.reading || '')}</div>
          ${card.reading_romaji ? `<div class="flashcard-romaji text-muted">${Utils.escapeHtml(card.reading_romaji)}</div>` : ''}
        `);
        break;
      
      case 'kanji':
        $front.html(`
          <div class="flashcard-main">${Utils.escapeHtml(card.kanji)}</div>
        `);
        break;
      
      case 'grammar':
        $front.html(`
          <div class="flashcard-main">${Utils.escapeHtml(card.pattern)}</div>
          <div class="flashcard-reading">${Utils.escapeHtml(card.structure)}</div>
          ${card.pattern_romaji ? `<div class="flashcard-romaji text-muted">${Utils.escapeHtml(card.pattern_romaji)}</div>` : ''}
        `);
        break;
    }
  },

  /**
   * Render card back
   * @param {Object} card - Card data
   */
  renderBack(card) {
    const $back = $('.flashcard-back');
    
    switch(this.type) {
      case 'hiragana':
      case 'katakana':
        $back.html(`
          <div class="flashcard-main">${Utils.escapeHtml(card.romaji)}</div>
          <hr>
          <div class="flashcard-example">
            <div>${Utils.escapeHtml(card.example)}</div>
            <div class="text-muted">${Utils.escapeHtml(card.example_meaning)}</div>
          </div>
        `);
        break;
      
      case 'vocab':
        const vocabRomaji = card.reading_romaji || card.word_romaji || '-';
        $back.html(`
          <div class="flashcard-main">${Utils.escapeHtml(card.meaning_en || card.meaning_vi || '')}</div>
          <div class="flashcard-reading">${Utils.escapeHtml(card.meaning_vi || card.meaning_en || '')}</div>
          <hr>
          <div class="flashcard-example">
            <div><strong>Romaji:</strong> ${Utils.escapeHtml(vocabRomaji)}</div>
            ${card.word_romaji && card.reading_romaji && card.word_romaji !== card.reading_romaji ? `
              <div><strong>Word romaji:</strong> ${Utils.escapeHtml(card.word_romaji)}</div>
            ` : ''}
            ${card.example ? `
              <div class="mt-2">${Utils.escapeHtml(card.example)}</div>
              <div class="text-muted small">${Utils.escapeHtml(card.example_meaning || '')}</div>
            ` : ''}
          </div>
        `);
        break;
      
      case 'kanji':
        $back.html(`
          <div class="flashcard-main">${Utils.escapeHtml(card.meaning_vi)}</div>
          <hr>
          <div class="flashcard-readings">
            <div><strong>On:</strong> <span class="text-danger">${Utils.escapeHtml(card.onyomi)}</span></div>
            ${card.onyomi_romaji ? `<div class="flashcard-romaji-small text-muted">Romaji: ${Utils.escapeHtml(card.onyomi_romaji)}</div>` : ''}
            <div class="mt-1"><strong>Kun:</strong> <span class="text-success">${Utils.escapeHtml(card.kunyomi || '-')}</span></div>
            ${card.kunyomi_romaji ? `<div class="flashcard-romaji-small text-muted">Romaji: ${Utils.escapeHtml(card.kunyomi_romaji)}</div>` : ''}
          </div>
          ${card.example_word ? `
            <hr>
            <div class="flashcard-example">
              <div>${Utils.escapeHtml(card.example_word)} - ${Utils.escapeHtml(card.example_reading)}</div>
              ${card.example_reading_romaji ? `<div class="flashcard-romaji-small text-muted">${Utils.escapeHtml(card.example_reading_romaji)}</div>` : ''}
              <div class="text-muted">${Utils.escapeHtml(card.example_meaning)}</div>
            </div>
          ` : ''}
        `);
        break;
      
      case 'grammar':
        $back.html(`
          <div class="flashcard-main">${Utils.escapeHtml(card.meaning_vi)}</div>
          <div class="flashcard-reading">${Utils.escapeHtml(card.meaning_en)}</div>
          ${card.pattern_romaji ? `<div class="flashcard-romaji-small text-muted">Romaji: ${Utils.escapeHtml(card.pattern_romaji)}</div>` : ''}
          <hr>
          <div class="flashcard-example">
            <div class="mb-2"><strong>Usage:</strong> ${Utils.escapeHtml(card.usage_note_vi)}</div>
            ${card.example_1 ? `
              <div class="mt-2">${Utils.escapeHtml(card.example_1)}</div>
              <div class="text-muted small">${Utils.escapeHtml(card.example_1_translation_vi)}</div>
            ` : ''}
          </div>
        `);
        break;
    }
  },

  /**
   * Flip the card
   */
  flipCard() {
    this.isFlipped = !this.isFlipped;
    $('.flashcard').toggleClass('flipped');
  },

  /**
   * Go to next card
   */
  nextCard() {
    if (this.deck.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.deck.length;
    this.showCard();
  },

  /**
   * Go to previous card
   */
  prevCard() {
    if (this.deck.length === 0) return;
    
    this.currentIndex = (this.currentIndex - 1 + this.deck.length) % this.deck.length;
    this.showCard();
  },

  /**
   * Shuffle the deck
   */
  async shuffleDeck() {
    await this.loadDeck(true);
    this.showCard();
    Utils.showToast('Xáo trộn thành công!', 'success');
  },

  /**
   * Update progress display
   */
  updateProgress() {
    const current = this.currentIndex + 1;
    const total = this.deck.length;
    $('#cardProgress').text(`${current} / ${total}`);
    
    // Update progress bar
    const percentage = (current / total) * 100;
    $('#progressBar').css('width', `${percentage}%`);
  }
};

// Initialize on page load
$(document).ready(function() {
  if ($('.flashcard').length) {
    FlashcardsModule.init();
  }
});
