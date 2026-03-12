/**
 * Quiz Module
 * Handles quiz functionality with multiple question types
 */

const QuizModule = {
  type: 'hiragana',
  mode: 'kana-to-romaji',
  data: [],
  lessonData: null,
  lessonContext: null,
  questions: [],
  currentQuestionIndex: 0,
  score: 0,
  answers: [],

  /**
   * Initialize the module
   */
  async init() {
    this.getTypeFromURL();
    await this.loadData();
    this.setupEventListeners();
    this.updateTypeSelector();
    this.updateModeSelector();
    this.updateContextUI();
    this.startQuiz();
  },

  /**
   * Get type from URL parameter
   */
  getTypeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type && ['hiragana', 'katakana', 'vocab', 'kanji', 'grammar', 'lesson'].includes(type)) {
      this.type = type;
    }

    if (this.type === 'lesson') {
      const level = urlParams.get('level') || Storage.getCurrentLevel() || 'N5';
      const lesson = DataService.normalizeLessonNumber(urlParams.get('lesson')) || 1;
      this.lessonContext = { level, lesson };
    }
  },

  /**
   * Load data
   */
  async loadData() {
    if (this.type === 'lesson') {
      const context = this.lessonContext || { level: Storage.getCurrentLevel() || 'N5', lesson: 1 };
      this.lessonData = await DataService.getLessonBundle(context.level, context.lesson);
      this.data = [];
      return;
    }

    let data = await DataService.getModuleData(this.type);

    // Filter by saved level if applicable
    const savedLevel = Storage.getCurrentLevel();
    if (savedLevel && (this.type === 'vocab' || this.type === 'kanji' || this.type === 'grammar')) {
      data = data.filter(item => item.level === savedLevel || item.jlpt_level === savedLevel);
    }

    this.data = data;
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Type selector
    $('#typeSelector').on('change', async (e) => {
      this.type = $(e.target).val();
      if (this.type === 'lesson') {
        const defaultLevel = Storage.getCurrentLevel() || 'N5';
        this.lessonContext = { level: defaultLevel, lesson: 1 };
      } else {
        this.lessonContext = null;
      }

      await this.loadData();
      this.updateModeOptions();
      this.updateContextUI();
      this.startQuiz();
    });

    // Mode selector
    $('#modeSelector').on('change', (e) => {
      this.mode = $(e.target).val();
      this.startQuiz();
    });

    // Restart button
    $('#btnRestart').on('click', () => this.startQuiz());
    $('#btnRestartSummary').on('click', () => this.startQuiz());
    $('#btnHome').on('click', () => window.location.href = '../index.html');
  },

  /**
   * Update type selector value
   */
  updateTypeSelector() {
    if (this.type === 'lesson' && $('#typeSelector option[value="lesson"]').length === 0) {
      $('#typeSelector').append('<option value="lesson">Lesson Final Test</option>');
    }
    $('#typeSelector').val(this.type);
  },

  /**
   * Update mode selector value
   */
  updateModeSelector() {
    this.updateModeOptions();
    $('#modeSelector').val(this.mode);
  },

  /**
   * Update mode options based on type
   */
  updateModeOptions() {
    const $modeSelector = $('#modeSelector');
    $modeSelector.empty();

    let modes = [];

    switch (this.type) {
      case 'hiragana':
      case 'katakana':
        modes = [
          { value: 'kana-to-romaji', label: 'Kana -> Romaji' },
          { value: 'romaji-to-kana', label: 'Romaji -> Kana' }
        ];
        break;

      case 'vocab':
        modes = [
          { value: 'word-to-meaning', label: 'Word -> Meaning' },
          { value: 'meaning-to-word', label: 'Meaning -> Word' },
          { value: 'reading-to-word', label: 'Reading -> Word' },
          { value: 'word-to-reading', label: 'Word -> Reading' }
        ];
        break;

      case 'kanji':
        modes = [
          { value: 'kanji-to-meaning', label: 'Kanji -> Meaning' },
          { value: 'meaning-to-kanji', label: 'Meaning -> Kanji' }
        ];
        break;

      case 'grammar':
        modes = [
          { value: 'pattern-to-meaning', label: 'Pattern -> Meaning' },
          { value: 'meaning-to-pattern', label: 'Meaning -> Pattern' },
          { value: 'pattern-to-usage', label: 'Pattern -> Usage' }
        ];
        break;

      case 'lesson':
        modes = [
          { value: 'lesson-mixed', label: 'Lesson Mixed Test' }
        ];
        break;
    }

    modes.forEach(mode => {
      $modeSelector.append(`<option value="${mode.value}">${mode.label}</option>`);
    });

    // Set first mode as default
    if (modes.length > 0) {
      this.mode = modes[0].value;
    }
  },

  /**
   * Start a new quiz
   */
  startQuiz() {
    this.currentQuestionIndex = 0;
    this.score = 0;
    this.answers = [];
    this.generateQuestions();

    if (!this.questions.length) {
      this.showEmptyQuizState('No questions available for this quiz context.');
      return;
    }

    this.showQuestion();
    this.updateProgress();

    // Show quiz container, hide summary
    $('#quizContainer').show();
    $('#summaryContainer').hide();
  },

  /**
   * Generate quiz questions
   */
  generateQuestions() {
    if (this.type === 'lesson') {
      this.generateLessonQuestions();
      return;
    }

    const questionCount = Math.min(10, this.data.length);
    const selectedData = Utils.getRandomItems(this.data, questionCount);

    this.questions = selectedData.map(item => this.generateQuestion(item));
  },

  /**
   * Generate lesson-mixed questions
   */
  generateLessonQuestions() {
    const lesson = this.lessonData || { vocab: [], grammar: [], kanji: [] };

    const selectedVocab = Utils.getRandomItems(lesson.vocab || [], Math.min(5, (lesson.vocab || []).length));
    const selectedGrammar = Utils.getRandomItems(lesson.grammar || [], Math.min(4, (lesson.grammar || []).length));
    const selectedKanji = Utils.getRandomItems(lesson.kanji || [], Math.min(4, (lesson.kanji || []).length));

    const vocabPool = (lesson.vocab || []).map(i => i.meaning_vi).filter(Boolean);
    const grammarPool = (lesson.grammar || []).map(i => i.meaning_vi).filter(Boolean);
    const kanjiPool = (lesson.kanji || []).map(i => i.meaning_vi).filter(Boolean);
    const fallbackPool = [...vocabPool, ...grammarPool, ...kanjiPool];

    const questions = [];

    selectedVocab.forEach(item => {
      const correct = item.meaning_vi || item.meaning_en || '';
      questions.push({
        category: 'Vocabulary',
        question: item.word || '',
        correctAnswer: correct,
        options: this.generateLessonOptions(correct, vocabPool, fallbackPool)
      });
    });

    selectedGrammar.forEach(item => {
      const correct = item.meaning_vi || '';
      questions.push({
        category: 'Grammar',
        question: item.pattern || '',
        correctAnswer: correct,
        options: this.generateLessonOptions(correct, grammarPool, fallbackPool)
      });
    });

    selectedKanji.forEach(item => {
      const correct = item.meaning_vi || '';
      questions.push({
        category: 'Kanji',
        question: item.kanji || '',
        correctAnswer: correct,
        options: this.generateLessonOptions(correct, kanjiPool, fallbackPool)
      });
    });

    // Ensure at least 10 questions when possible
    if (questions.length < 10) {
      const extraVocab = (lesson.vocab || []).filter(item => !selectedVocab.includes(item));
      const extraGrammar = (lesson.grammar || []).filter(item => !selectedGrammar.includes(item));
      const extraKanji = (lesson.kanji || []).filter(item => !selectedKanji.includes(item));
      const extraItems = Utils.shuffleArray([
        ...extraVocab.map(item => ({ type: 'Vocabulary', item })),
        ...extraGrammar.map(item => ({ type: 'Grammar', item })),
        ...extraKanji.map(item => ({ type: 'Kanji', item }))
      ]);

      for (const extra of extraItems) {
        if (questions.length >= 10) break;
        if (extra.type === 'Vocabulary') {
          const correct = extra.item.meaning_vi || extra.item.meaning_en || '';
          questions.push({
            category: 'Vocabulary',
            question: extra.item.word || '',
            correctAnswer: correct,
            options: this.generateLessonOptions(correct, vocabPool, fallbackPool)
          });
        } else if (extra.type === 'Grammar') {
          const correct = extra.item.meaning_vi || '';
          questions.push({
            category: 'Grammar',
            question: extra.item.pattern || '',
            correctAnswer: correct,
            options: this.generateLessonOptions(correct, grammarPool, fallbackPool)
          });
        } else {
          const correct = extra.item.meaning_vi || '';
          questions.push({
            category: 'Kanji',
            question: extra.item.kanji || '',
            correctAnswer: correct,
            options: this.generateLessonOptions(correct, kanjiPool, fallbackPool)
          });
        }
      }
    }

    this.questions = Utils.shuffleArray(questions).slice(0, 12);
  },

  /**
   * Generate a single question
   * @param {Object} item - Data item
   * @returns {Object} Question object
   */
  generateQuestion(item) {
    const question = {
      data: item,
      question: '',
      correctAnswer: '',
      options: []
    };

    // Generate question based on type and mode
    switch (this.type) {
      case 'hiragana':
      case 'katakana':
        if (this.mode === 'kana-to-romaji') {
          question.question = item.kana;
          question.correctAnswer = item.romaji;
          question.options = this.generateOptions(item, 'romaji');
        } else {
          question.question = item.romaji;
          question.correctAnswer = item.kana;
          question.options = this.generateOptions(item, 'kana');
        }
        break;

      case 'vocab':
        if (this.mode === 'word-to-meaning') {
          question.question = item.word;
          question.correctAnswer = item.meaning_en;
          question.options = this.generateOptions(item, 'meaning_en');
        } else if (this.mode === 'meaning-to-word') {
          question.question = item.meaning_en;
          question.correctAnswer = item.word;
          question.options = this.generateOptions(item, 'word');
        } else if (this.mode === 'reading-to-word') {
          question.question = item.reading;
          question.correctAnswer = item.word;
          question.options = this.generateOptions(item, 'word');
        } else {
          question.question = item.word;
          question.correctAnswer = item.reading;
          question.options = this.generateOptions(item, 'reading');
        }
        break;

      case 'kanji':
        if (this.mode === 'kanji-to-meaning') {
          question.question = item.kanji;
          question.correctAnswer = item.meaning_vi;
          question.options = this.generateOptions(item, 'meaning_vi');
        } else {
          question.question = item.meaning_vi;
          question.correctAnswer = item.kanji;
          question.options = this.generateOptions(item, 'kanji');
        }
        break;

      case 'grammar':
        if (this.mode === 'pattern-to-meaning') {
          question.question = item.pattern;
          question.correctAnswer = item.meaning_vi;
          question.options = this.generateOptions(item, 'meaning_vi');
        } else if (this.mode === 'meaning-to-pattern') {
          question.question = item.meaning_vi;
          question.correctAnswer = item.pattern;
          question.options = this.generateOptions(item, 'pattern');
        } else {
          question.question = item.pattern;
          question.correctAnswer = item.usage_note_vi;
          question.options = this.generateOptions(item, 'usage_note_vi');
        }
        break;
    }

    return question;
  },

  /**
   * Generate answer options
   * @param {Object} correctItem - Correct answer item
   * @param {string} field - Field to use for options
   * @returns {Array} Shuffled options
   */
  generateOptions(correctItem, field) {
    const options = [correctItem[field]];
    const otherItems = this.data.filter(item => item.id !== correctItem.id);
    const randomItems = Utils.getRandomItems(otherItems, 3);

    randomItems.forEach(item => {
      if (item[field] && !options.includes(item[field])) {
        options.push(item[field]);
      }
    });

    // Fill with more options if needed
    let safetyCounter = 0;
    while (options.length < 4 && safetyCounter < 30 && otherItems.length > 0) {
      const randomItem = otherItems[Math.floor(Math.random() * otherItems.length)];
      if (randomItem && randomItem[field] && !options.includes(randomItem[field])) {
        options.push(randomItem[field]);
      }
      safetyCounter++;
    }

    return Utils.shuffleArray(options.slice(0, 4));
  },

  /**
   * Generate options for lesson mixed questions
   * @param {string} correctAnswer - Correct answer
   * @param {Array<string>} localPool - Same category option pool
   * @param {Array<string>} fallbackPool - Fallback option pool
   * @returns {Array<string>}
   */
  generateLessonOptions(correctAnswer, localPool, fallbackPool) {
    const options = [correctAnswer];
    const samePool = Utils.shuffleArray((localPool || []).filter(opt => opt && opt !== correctAnswer));
    samePool.slice(0, 3).forEach(opt => options.push(opt));

    if (options.length < 4) {
      const fallback = Utils.shuffleArray((fallbackPool || []).filter(opt => opt && !options.includes(opt)));
      fallback.slice(0, 4 - options.length).forEach(opt => options.push(opt));
    }

    return Utils.shuffleArray(options.slice(0, 4));
  },

  /**
   * Show empty quiz state
   * @param {string} message - Message to show
   */
  showEmptyQuizState(message) {
    $('#quizContainer').show();
    $('#summaryContainer').hide();
    $('#questionNumber').text('Question 0 of 0');
    $('#currentScore').text('Score: 0/0');
    $('#quizProgressAnswered').css('width', '0%');
    $('#quizProgressCorrect').css('width', '0%');
    $('#questionText').html(`<div class="question-display text-muted">${Utils.escapeHtml(message)}</div>`);
    $('#optionsContainer').empty();
    $('#optionsContainer').append(`<div class="alert alert-warning text-center">${Utils.escapeHtml(message)}</div>`);
  },

  /**
   * Show current question
   */
  showQuestion() {
    if (this.currentQuestionIndex >= this.questions.length) {
      this.showSummary();
      return;
    }

    const question = this.questions[this.currentQuestionIndex];
    const categoryBadge = question.category
      ? `<div class="mb-2"><span class="badge bg-info text-dark">${Utils.escapeHtml(question.category)}</span></div>`
      : '';

    // Update question text
    $('#questionText').html(`${categoryBadge}<div class="question-display">${Utils.escapeHtml(question.question)}</div>`);

    // Render options
    const $optionsContainer = $('#optionsContainer');
    $optionsContainer.empty();

    question.options.forEach((option) => {
      const $button = $(`
        <button class="btn btn-outline-primary btn-lg w-100 mb-3 quiz-option">
          ${Utils.escapeHtml(option)}
        </button>
      `);

      $button.on('click', () => this.selectAnswer(option, question.correctAnswer, $button));
      $optionsContainer.append($button);
    });

    this.updateProgress();
  },

  /**
   * Handle answer selection
   * @param {string} selected - Selected answer
   * @param {string} correct - Correct answer
   * @param {jQuery} $button - Button element
   */
  selectAnswer(selected, correct, $button) {
    const isCorrect = selected === correct;

    // Disable all buttons
    $('.quiz-option').prop('disabled', true);

    // Show correct/wrong styling
    if (isCorrect) {
      $button.removeClass('btn-outline-primary').addClass('btn-success correct');
      this.score++;
    } else {
      $button.removeClass('btn-outline-primary').addClass('btn-danger wrong');
      // Highlight correct answer
      $('.quiz-option').each(function() {
        if ($(this).text().trim() === correct) {
          $(this).removeClass('btn-outline-primary').addClass('btn-success');
        }
      });
    }

    // Record answer
    this.answers.push({
      question: this.questions[this.currentQuestionIndex].question,
      selected: selected,
      correct: correct,
      isCorrect: isCorrect,
      category: this.questions[this.currentQuestionIndex].category || null
    });

    // Move to next question after delay
    setTimeout(() => {
      this.currentQuestionIndex++;
      this.showQuestion();
    }, 1200);
  },

  /**
   * Update progress display
   */
  updateProgress() {
    const current = this.currentQuestionIndex + 1;
    const total = this.questions.length;
    const safeTotal = total || 1;

    $('#questionNumber').text(`Question ${current} of ${total}`);
    $('#currentScore').text(`Score: ${this.score}/${this.currentQuestionIndex}`);

    // Update progress bars
    const answeredPercentage = (this.currentQuestionIndex / safeTotal) * 100;
    const correctPercentage = (this.score / safeTotal) * 100;

    $('#quizProgressAnswered').css('width', `${answeredPercentage}%`);
    $('#quizProgressCorrect').css('width', `${correctPercentage}%`);
  },

  /**
   * Show quiz summary
   */
  showSummary() {
    $('#quizContainer').hide();
    $('#summaryContainer').show();

    const total = this.questions.length;
    if (total === 0) {
      $('#finalScore').text('0 / 0');
      $('#scorePercentage').text('0%');
      $('#summaryProgress').css('width', '0%');
      $('#performanceMessage').html('<h4 class="text-muted">No questions answered.</h4>');
      $('#detailedResults').empty();
      return;
    }

    const percentage = Math.round((this.score / total) * 100);

    $('#finalScore').text(`${this.score} / ${total}`);
    $('#scorePercentage').text(`${percentage}%`);

    // Update progress circle
    $('#summaryProgress').css('width', `${percentage}%`);

    // Show performance message
    let message = '';
    let messageClass = '';

    if (percentage >= 90) {
      message = 'Xuất sắc!';
      messageClass = 'text-success';
    } else if (percentage >= 70) {
      message = 'Làm tốt lắm!';
      messageClass = 'text-primary';
    } else if (percentage >= 50) {
      message = 'Cố gắng luyện tập thêm!';
      messageClass = 'text-warning';
    } else {
      message = 'Cần luyện tập nhiều hơn.';
      messageClass = 'text-danger';
    }

    $('#performanceMessage').html(`<h4 class="${messageClass}">${message}</h4>`);

    // Show detailed results
    this.renderDetailedResults();

    if (this.type === 'lesson') {
      this.saveLessonProgress(total, percentage);
    }
  },

  /**
   * Save lesson quiz progress
   * @param {number} total - Number of questions
   * @param {number} percentage - Score percentage
   */
  saveLessonProgress(total, percentage) {
    if (!this.lessonContext) return;

    const key = `${this.lessonContext.level}-L${this.lessonContext.lesson}`;
    const allProgress = Storage.getData('jpapp_lesson_progress') || {};
    allProgress[key] = {
      score: this.score,
      total: total,
      percentage: percentage,
      updatedAt: new Date().toISOString()
    };
    Storage.setData('jpapp_lesson_progress', allProgress);
  },

  /**
   * Update lesson context banner
   */
  updateContextUI() {
    if (this.type === 'lesson' && this.lessonContext) {
      $('#quizContextBanner').show();
      $('#quizContextText').text(`Lesson Final Test: ${this.lessonContext.level} - Lesson ${this.lessonContext.lesson}`);
    } else {
      $('#quizContextBanner').hide();
      $('#quizContextText').text('');
    }
  },

  /**
   * Render detailed quiz results
   */
  renderDetailedResults() {
    const $container = $('#detailedResults');
    $container.empty();

    this.answers.forEach((answer, index) => {
      const icon = answer.isCorrect ? 'OK' : 'X';
      const badgeClass = answer.isCorrect ? 'bg-success' : 'bg-danger';
      const category = answer.category ? `<span class="badge bg-light text-dark me-2">${Utils.escapeHtml(answer.category)}</span>` : '';

      $container.append(`
        <div class="card mb-2">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>Q${index + 1}:</strong> ${category}${Utils.escapeHtml(answer.question)}
              </div>
              <span class="badge ${badgeClass}">${icon}</span>
            </div>
            <div class="mt-2">
              <small>
                <strong>Your answer:</strong> <span class="${answer.isCorrect ? 'text-success' : 'text-danger'}">${Utils.escapeHtml(answer.selected)}</span>
                ${!answer.isCorrect ? `<br><strong>Correct answer:</strong> <span class="text-success">${Utils.escapeHtml(answer.correct)}</span>` : ''}
              </small>
            </div>
          </div>
        </div>
      `);
    });
  }
};

// Initialize on page load
$(document).ready(function() {
  if ($('#quizContainer').length) {
    QuizModule.init();
  }
});
