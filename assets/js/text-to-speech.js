/**
 * Text-to-Speech Module
 * Handles Japanese text-to-speech using Web Speech API
 */

const TextToSpeech = {
  synthesis: null,
  utterance: null,
  isSupported: false,
  japaneseVoice: null,
  isSpeaking: false,

  /**
   * Initialize the TTS module
   */
  init() {
    // Check if Speech Synthesis is supported
    if ('speechSynthesis' in window) {
      this.synthesis = window.speechSynthesis;
      this.isSupported = true;
      
      // Load voices when available
      if (this.synthesis.getVoices().length > 0) {
        this.loadVoices();
      } else {
        // Chrome requires waiting for voices to load
        this.synthesis.addEventListener('voiceschanged', () => {
          this.loadVoices();
        });
      }
    } else {
      console.warn('Text-to-Speech is not supported in this browser');
      this.isSupported = false;
    }
  },

  /**
   * Load available voices and select Japanese voice
   */
  loadVoices() {
    const voices = this.synthesis.getVoices();
    
    // Try to find Japanese voice (prefer ja-JP)
    this.japaneseVoice = voices.find(voice => voice.lang === 'ja-JP') ||
                         voices.find(voice => voice.lang.startsWith('ja')) ||
                         null;
    
    if (this.japaneseVoice) {
      console.log('Japanese voice found:', this.japaneseVoice.name);
    } else {
      console.warn('No Japanese voice found. Using default voice.');
    }
  },

  /**
   * Speak Japanese text
   * @param {string} text - Japanese text to speak
   * @param {Object} options - Optional settings
   */
  speak(text, options = {}) {
    if (!this.isSupported) {
      console.warn('Text-to-Speech is not supported');
      return;
    }

    if (!text || text.trim() === '') {
      console.warn('No text provided for TTS');
      return;
    }

    // Cancel any ongoing speech
    this.stop();

    // Create new utterance
    this.utterance = new SpeechSynthesisUtterance(text);
    
    // Set Japanese voice if available
    if (this.japaneseVoice) {
      this.utterance.voice = this.japaneseVoice;
    }
    
    // Set language
    this.utterance.lang = options.lang || 'ja-JP';
    
    // Set rate (speed: 0.1 to 10, default 1)
    this.utterance.rate = options.rate || 0.9;
    
    // Set pitch (0 to 2, default 1)
    this.utterance.pitch = options.pitch || 1;
    
    // Set volume (0 to 1, default 1)
    this.utterance.volume = options.volume || 1;

    // Event handlers
    this.utterance.onstart = () => {
      this.isSpeaking = true;
      if (options.onStart) options.onStart();
    };

    this.utterance.onend = () => {
      this.isSpeaking = false;
      if (options.onEnd) options.onEnd();
    };

    this.utterance.onerror = (event) => {
      this.isSpeaking = false;
      console.error('Speech synthesis error:', event);
      if (options.onError) options.onError(event);
    };

    // Speak
    this.synthesis.speak(this.utterance);
  },

  /**
   * Stop current speech
   */
  stop() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  },

  /**
   * Pause current speech
   */
  pause() {
    if (this.synthesis && this.isSpeaking) {
      this.synthesis.pause();
    }
  },

  /**
   * Resume paused speech
   */
  resume() {
    if (this.synthesis && this.synthesis.paused) {
      this.synthesis.resume();
    }
  },

  /**
   * Check if TTS is currently speaking
   * @returns {boolean}
   */
  isTTSSpeaking() {
    return this.isSpeaking;
  },

  /**
   * Get list of available voices
   * @returns {Array}
   */
  getVoices() {
    return this.synthesis ? this.synthesis.getVoices() : [];
  },

  /**
   * Get Japanese voices only
   * @returns {Array}
   */
  getJapaneseVoices() {
    const voices = this.getVoices();
    return voices.filter(voice => voice.lang.startsWith('ja'));
  }
};

// Initialize on page load
$(document).ready(function() {
  TextToSpeech.init();
});
