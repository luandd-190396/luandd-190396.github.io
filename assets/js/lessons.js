/**
 * Lessons Module
 * Structured study flow: vocabulary + grammar + kanji + final lesson quiz
 */

const LessonsModule = {
  level: 'N5',
  lesson: null,
  lessons: [],
  lessonData: null,
  quizProgress: {},

  /**
   * Initialize module
   */
  async init() {
    this.readStateFromURL();
    this.applySavedLevel();
    this.setupEventListeners();
    this.quizProgress = Storage.getData('jpapp_lesson_progress') || {};

    $('#levelSelector').val(this.level);
    await this.loadLessonsByLevel();
    await this.loadLessonContent();
  },

  /**
   * Read initial state from URL params
   */
  readStateFromURL() {
    const params = new URLSearchParams(window.location.search);
    const level = params.get('level');
    const lesson = DataService.normalizeLessonNumber(params.get('lesson'));

    if (['N5', 'N4', 'N3', 'N2', 'N1'].includes(level)) {
      this.level = level;
    }
    if (lesson) {
      this.lesson = lesson;
    }
  },

  /**
   * Apply saved level if no level was given in URL
   */
  applySavedLevel() {
    const savedLevel = Storage.getCurrentLevel();
    if (savedLevel && ['N5', 'N4', 'N3', 'N2', 'N1'].includes(savedLevel)) {
      const params = new URLSearchParams(window.location.search);
      if (!params.get('level')) {
        this.level = savedLevel;
      }
    }
  },

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    $('#levelSelector').on('change', async (e) => {
      this.level = $(e.target).val();
      this.lesson = null;
      await this.loadLessonsByLevel();
      await this.loadLessonContent();
      this.syncURL();
    });

    $('#lessonSelector').on('change', async (e) => {
      this.lesson = DataService.normalizeLessonNumber($(e.target).val());
      await this.loadLessonContent();
      this.syncURL();
    });

    $('#btnPrevLesson').on('click', async () => {
      this.moveLesson(-1);
      await this.loadLessonContent();
      this.syncURL();
    });

    $('#btnNextLesson').on('click', async () => {
      this.moveLesson(1);
      await this.loadLessonContent();
      this.syncURL();
    });
  },

  /**
   * Update URL query params for current lesson context
   */
  syncURL() {
    if (!this.lesson) return;
    const url = new URL(window.location.href);
    url.searchParams.set('level', this.level);
    url.searchParams.set('lesson', String(this.lesson));
    window.history.replaceState({}, '', url.toString());
  },

  /**
   * Navigate to previous/next available lesson
   * @param {number} step - -1 or 1
   */
  moveLesson(step) {
    if (!this.lessons.length || !this.lesson) return;
    const idx = this.lessons.findIndex(item => item.lesson === this.lesson);
    if (idx === -1) return;
    const nextIdx = idx + step;
    if (nextIdx < 0 || nextIdx >= this.lessons.length) return;
    this.lesson = this.lessons[nextIdx].lesson;
    $('#lessonSelector').val(String(this.lesson));
  },

  /**
   * Load available lessons by level
   */
  async loadLessonsByLevel() {
    this.lessons = await DataService.getAvailableLessons(this.level);
    this.renderLessonOptions();
  },

  /**
   * Render lesson selector options
   */
  renderLessonOptions() {
    const $selector = $('#lessonSelector');
    $selector.empty();

    if (!this.lessons.length) {
      $selector.append('<option value="">Không tìm thấy bài học</option>');
      this.lesson = null;
      return;
    }

    this.lessons.forEach(item => {
      const label = `Lesson ${item.lesson} (V${item.vocabCount}/G${item.grammarCount}/K${item.kanjiCount})`;
      $selector.append(`<option value="${item.lesson}">${Utils.escapeHtml(label)}</option>`);
    });

    const lessonExists = this.lessons.some(item => item.lesson === this.lesson);
    if (!lessonExists) {
      this.lesson = this.lessons[0].lesson;
    }
    $selector.val(String(this.lesson));
    this.updateLessonButtons();
  },

  /**
   * Enable/disable prev-next lesson buttons
   */
  updateLessonButtons() {
    if (!this.lessons.length || !this.lesson) {
      $('#btnPrevLesson').prop('disabled', true);
      $('#btnNextLesson').prop('disabled', true);
      return;
    }
    const idx = this.lessons.findIndex(item => item.lesson === this.lesson);
    $('#btnPrevLesson').prop('disabled', idx <= 0);
    $('#btnNextLesson').prop('disabled', idx === -1 || idx >= this.lessons.length - 1);
  },

  /**
   * Load content for selected lesson
   */
  async loadLessonContent() {
    if (!this.lesson) {
      this.lessonData = { vocab: [], grammar: [], kanji: [] };
      this.render();
      return;
    }

    this.lessonData = await DataService.getLessonBundle(this.level, this.lesson);
    this.updateLessonButtons();
    this.render();
  },

  /**
   * Render page
   */
  render() {
    this.renderStats();
    this.renderVocabSection();
    this.renderGrammarSection();
    this.renderKanjiSection();
    this.renderQuizLink();
  },

  /**
   * Render summary stats
   */
  renderStats() {
    const vocabCount = (this.lessonData?.vocab || []).length;
    const grammarCount = (this.lessonData?.grammar || []).length;
    const kanjiCount = (this.lessonData?.kanji || []).length;
    const progressKey = `${this.level}-L${this.lesson}`;
    const progress = this.quizProgress[progressKey];

    $('#statLessonVocab').text(vocabCount);
    $('#statLessonGrammar').text(grammarCount);
    $('#statLessonKanji').text(kanjiCount);
    $('#badgeVocabCount').text(vocabCount);
    $('#badgeGrammarCount').text(grammarCount);
    $('#badgeKanjiCount').text(kanjiCount);

    if (progress && progress.total > 0) {
      $('#statLessonQuiz').text(`${progress.score}/${progress.total} (${progress.percentage}%)`);
    } else {
      $('#statLessonQuiz').text('-');
    }
  },

  /**
   * Render lesson quiz link
   */
  renderQuizLink() {
    if (!this.lesson) {
      $('#btnStartLessonQuiz').addClass('disabled');
      return;
    }
    const url = `quiz.html?type=lesson&level=${encodeURIComponent(this.level)}&lesson=${encodeURIComponent(this.lesson)}`;
    $('#btnStartLessonQuiz').attr('href', url).removeClass('disabled');
  },

  /**
   * Render vocabulary section
   */
  renderVocabSection() {
    const data = this.lessonData?.vocab || [];
    if (!data.length) {
      $('#lessonVocabContainer').html('<div class="lesson-empty">Không có từ vựng cho bài học này.</div>');
      return;
    }

    const rows = data.map(item => `
      <tr>
        <td class="lesson-japanese">${Utils.escapeHtml(item.word || '')}</td>
        <td>${Utils.escapeHtml(item.reading || '')}</td>
        <td>${Utils.escapeHtml(item.meaning_vi || '')}</td>
        <td>${Utils.escapeHtml(item.type || '')}</td>
      </tr>
    `).join('');

    $('#lessonVocabContainer').html(`
      <div class="table-responsive">
        <table class="table table-hover lesson-table">
          <thead>
            <tr>
              <th>Word</th>
              <th>Reading</th>
              <th>Meaning</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);
  },

  /**
   * Render grammar section
   */
  renderGrammarSection() {
    const data = this.lessonData?.grammar || [];
    if (!data.length) {
      $('#lessonGrammarContainer').html('<div class="lesson-empty">Không có ngữ pháp cho bài học này.</div>');
      return;
    }

    const cards = data.map(item => {
      let examplesHtml = '';
      
      // Add example 1
      if (item.example_1) {
        examplesHtml += `
          <div class="grammar-example mb-2">
            <div class="example-jp">${Utils.escapeHtml(item.example_1)}</div>
            ${item.example_1_reading ? `<div class="example-reading">${Utils.escapeHtml(item.example_1_reading)}</div>` : ''}
            ${item.example_1_translation_vi ? `<div class="example-vi">${Utils.escapeHtml(item.example_1_translation_vi)}</div>` : ''}
          </div>
        `;
      }
      
      // Add example 2
      if (item.example_2) {
        examplesHtml += `
          <div class="grammar-example mb-2">
            <div class="example-jp">${Utils.escapeHtml(item.example_2)}</div>
            ${item.example_2_reading ? `<div class="example-reading">${Utils.escapeHtml(item.example_2_reading)}</div>` : ''}
            ${item.example_2_translation_vi ? `<div class="example-vi">${Utils.escapeHtml(item.example_2_translation_vi)}</div>` : ''}
          </div>
        `;
      }

      return `
        <div class="grammar-card mb-3">
          <div class="grammar-header">
            <h5 class="grammar-pattern">${Utils.escapeHtml(item.pattern || '')}</h5>
          </div>
          <div class="grammar-body">
            <div class="grammar-info mb-2">
              <strong>Nghĩa:</strong> ${Utils.escapeHtml(item.meaning_vi || '')}
            </div>
            <div class="grammar-info mb-3">
              <strong>Cấu trúc:</strong> ${Utils.escapeHtml(item.structure || '')}
            </div>
            ${examplesHtml ? `
              <div class="grammar-examples">
                <strong>Ví dụ:</strong>
                <div class="mt-2">${examplesHtml}</div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    $('#lessonGrammarContainer').html(cards);
  },

  /**
   * Render kanji section
   */
  renderKanjiSection() {
    const data = this.lessonData?.kanji || [];
    if (!data.length) {
      $('#lessonKanjiContainer').html('<div class="lesson-empty">Không có kanji cho bài học này.</div>');
      return;
    }

    const rows = data.map(item => `
      <tr>
        <td class="lesson-japanese">${Utils.escapeHtml(item.kanji || '')}</td>
        <td>${Utils.escapeHtml(item.meaning_vi || '')}</td>
        <td>${Utils.escapeHtml(item.onyomi || '')}</td>
        <td>${Utils.escapeHtml(item.kunyomi || '')}</td>
      </tr>
    `).join('');

    $('#lessonKanjiContainer').html(`
      <div class="table-responsive">
        <table class="table table-hover lesson-table">
          <thead>
            <tr>
              <th>Kanji</th>
              <th>Meaning</th>
              <th>Onyomi</th>
              <th>Kunyomi</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `);
  }
};

// Initialize on page load
$(document).ready(function() {
  if ($('#lessonSelector').length) {
    LessonsModule.init();
  }
});
