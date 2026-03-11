/**
 * Quiz Module
 * Handles quiz functionality with multiple question types
 */

const QuizModule = {
  type: 'hiragana',
  mode: 'kana-to-romaji',
  data: [],
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
    this.startQuiz();
  },

  /**
   * Get type from URL parameter
   */
  getTypeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type');
    if (type && ['hiragana', 'katakana', 'vocab', 'kanji'].includes(type)) {
      this.type = type;
    }
  },

  /**
   * Load data
   */
  async loadData() {
    this.data = await DataService.getModuleData(this.type);
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Type selector
    $('#typeSelector').on('change', async (e) => {
      this.type = $(e.target).val();
      await this.loadData();
      this.updateModeOptions();
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
    
    switch(this.type) {
      case 'hiragana':
      case 'katakana':
        modes = [
          { value: 'kana-to-romaji', label: 'Kana → Romaji' },
          { value: 'romaji-to-kana', label: 'Romaji → Kana' }
        ];
        break;
      
      case 'vocab':
        modes = [
          { value: 'word-to-meaning', label: 'Word → Meaning' },
          { value: 'meaning-to-word', label: 'Meaning → Word' },
          { value: 'reading-to-word', label: 'Reading → Word' },
          { value: 'word-to-reading', label: 'Word → Reading' }
        ];
        break;
      
      case 'kanji':
        modes = [
          { value: 'kanji-to-meaning', label: 'Kanji → Meaning' },
          { value: 'meaning-to-kanji', label: 'Meaning → Kanji' }
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
    const questionCount = Math.min(10, this.data.length);
    const selectedData = Utils.getRandomItems(this.data, questionCount);
    
    this.questions = selectedData.map(item => this.generateQuestion(item));
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
    switch(this.type) {
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
    while (options.length < 4) {
      const randomItem = otherItems[Math.floor(Math.random() * otherItems.length)];
      if (randomItem && randomItem[field] && !options.includes(randomItem[field])) {
        options.push(randomItem[field]);
      }
    }

    return Utils.shuffleArray(options.slice(0, 4));
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
    
    // Update question text
    $('#questionText').html(`<div class="question-display">${Utils.escapeHtml(question.question)}</div>`);
    
    // Render options
    const $optionsContainer = $('#optionsContainer');
    $optionsContainer.empty();

    question.options.forEach((option, index) => {
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
      isCorrect: isCorrect
    });

    // Move to next question after delay
    setTimeout(() => {
      this.currentQuestionIndex++;
      this.showQuestion();
    }, 1500);
  },

  /**
   * Update progress display
   */
  updateProgress() {
    const current = this.currentQuestionIndex + 1;
    const total = this.questions.length;
    
    $('#questionNumber').text(`Question ${current} of ${total}`);
    $('#currentScore').text(`Score: ${this.score}/${this.currentQuestionIndex}`);
    
    // Update progress bar
    const percentage = (this.currentQuestionIndex / total) * 100;
    $('#quizProgress').css('width', `${percentage}%`);
  },

  /**
   * Show quiz summary
   */
  showSummary() {
    $('#quizContainer').hide();
    $('#summaryContainer').show();

    const total = this.questions.length;
    const percentage = Math.round((this.score / total) * 100);

    $('#finalScore').text(`${this.score} / ${total}`);
    $('#scorePercentage').text(`${percentage}%`);

    // Update progress circle
    $('#summaryProgress').css('width', `${percentage}%`);

    // Show performance message
    let message = '';
    let messageClass = '';
    
    if (percentage >= 90) {
      message = 'Excellent! 🎉';
      messageClass = 'text-success';
    } else if (percentage >= 70) {
      message = 'Good job! 👍';
      messageClass = 'text-primary';
    } else if (percentage >= 50) {
      message = 'Keep practicing! 💪';
      messageClass = 'text-warning';
    } else {
      message = 'Need more practice 📚';
      messageClass = 'text-danger';
    }

    $('#performanceMessage').html(`<h4 class="${messageClass}">${message}</h4>`);

    // Show detailed results
    this.renderDetailedResults();
  },

  /**
   * Render detailed quiz results
   */
  renderDetailedResults() {
    const $container = $('#detailedResults');
    $container.empty();

    this.answers.forEach((answer, index) => {
      const icon = answer.isCorrect ? '✓' : '✗';
      const badgeClass = answer.isCorrect ? 'bg-success' : 'bg-danger';
      
      $container.append(`
        <div class="card mb-2">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <strong>Q${index + 1}:</strong> ${Utils.escapeHtml(answer.question)}
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
