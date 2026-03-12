# Japanese Study App v2.0

A complete static web application for learning Japanese language including Hiragana, Katakana, Kanji, Grammar, JLPT vocabulary (N5-N1), and lesson-based study flow.

## Features

- **Hiragana Learning** - Study all Hiragana characters with examples
- **Katakana Learning** - Learn Katakana characters with usage examples  
- **Vocabulary** - JLPT vocabulary from N5 to N1 levels
- **Kanji** - Learn Japanese Kanji with readings and meanings
- **Grammar** - Japanese grammar patterns based on Minna no Nihongo and JLPT levels
- **Lesson Mode** - Study by lesson (Vocabulary + Grammar + Kanji) and do final lesson quiz
- **Flashcards Mode** - Interactive flashcards with flip animations
- **Quiz Mode** - Test your knowledge with multiple question types
- **Admin Panel** - Full CRUD operations for data management
- **Import/Export** - Backup and restore your learning data
- **Offline Support** - All data stored in browser localStorage

## Tech Stack

- **HTML5** - Semantic markup
- **CSS3** - Modern styling with animations
- **Bootstrap 5** - Responsive UI framework
- **jQuery** - DOM manipulation and AJAX
- **localStorage** - Client-side data persistence
- **JSON** - Data storage format

## Project Structure

```
japanese-study-app/
├── index.html                 # Homepage
├── README.md                  # This file
├── pages/
│   ├── hiragana.html         # Hiragana learning page
│   ├── katakana.html         # Katakana learning page
│   ├── vocab.html            # Vocabulary page
│   ├── kanji.html            # Kanji learning page
│   ├── grammar.html          # Grammar patterns page
│   ├── flashcards.html       # Flashcards practice
│   ├── quiz.html             # Quiz interface
│   └── admin.html            # Data management
├── assets/
│   ├── css/
│   │   ├── style.css         # Global styles
│   │   ├── cards.css         # Card components
│   │   ├── flashcard.css     # Flashcard animations
│   │   ├── quiz.css          # Quiz interface styles
│   │   ├── grammar.css       # Grammar patterns styles
│   │   └── admin.css         # Admin panel styles
│   ├── js/
│   │   ├── app.js            # Main application logic
│   │   ├── storage.js        # localStorage wrapper
│   │   ├── data-service.js   # Data management service
│   │   ├── utils.js          # Utility functions
│   │   ├── hiragana.js       # Hiragana page logic
│   │   ├── katakana.js       # Katakana page logic
│   │   ├── vocab.js          # Vocabulary page logic
│   │   ├── kanji.js          # Kanji page logic
│   │   ├── grammar.js        # Grammar page logic
│   │   ├── flashcards.js     # Flashcards functionality
│   │   ├── quiz.js           # Quiz functionality
│   │   └── admin.js          # Admin panel logic
│   └── data/
│       ├── hiragana.json     # Default Hiragana data
│       ├── katakana.json     # Default Katakana data
│       ├── vocab.json        # Default vocabulary data
│       ├── kanji.json        # Default Kanji data
│       └── grammar.json      # Default grammar patterns
```

## Installation & Usage

### Local Development

1. **Clone or download** this repository
2. **Open `index.html`** in a modern web browser
3. That's it! No build process or server required.

```bash
# Just open the file
# Windows
start index.html

# macOS
open index.html

# Linux
xdg-open index.html
```

### Using a Local Server (Optional)

For better development experience:

```bash
# Python 3
python -m http.server 8000

# Node.js (http-server)
npx http-server

# PHP
php -S localhost:8000
```

Then visit `http://localhost:8000` in your browser.

## Deployment

### GitHub Pages

1. **Create a GitHub repository**
2. **Push your code** to the repository
3. **Enable GitHub Pages** in repository settings
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main (or master)
   - Folder: / (root)
4. **Access your site** at `https://username.github.io/repository-name/`

### Other Static Hosting Platforms

This app works on any static file hosting service:

- **Netlify** - Drag and drop the folder
- **Vercel** - Connect your GitHub repo
- **Cloudflare Pages** - Deploy directly from Git
- **Firebase Hosting** - Use Firebase CLI
- **Surge.sh** - Simple CLI deployment

## Data Management

### localStorage Keys

The app uses these localStorage keys:

- `jpapp_hiragana` - Hiragana characters data
- `jpapp_katakana` - Katakana characters data
- `jpapp_vocab` - Vocabulary data
- `jpapp_kanji` - Kanji data
- `jpapp_grammar` - Grammar patterns data
- `jpapp_lesson_progress` - Lesson final quiz progress

### Data Flow

1. **First Load**: App loads default data from JSON files
2. **Save to localStorage**: Data is stored for offline use
3. **Subsequent Loads**: Data is read from localStorage
4. **Updates**: Any changes are immediately saved to localStorage

### Backup & Restore

#### Export Data

1. Navigate to **Admin Panel**
2. Click **Export** to download current tab data
3. Click **Export All** to download all data

Files are saved as JSON with timestamp:
- `hiragana_2026-03-11_14-30.json`
- `japanese_study_backup_2026-03-11_14-30.json`

#### Import Data

1. Navigate to **Admin Panel**
2. Click **Import** button
3. Select your JSON backup file
4. Data will be restored immediately

#### Reset Data

- **Reset** - Reset current tab to default data
- **Reset All** - Reset all data to defaults

**⚠️ Warning**: Reset operations cannot be undone!

## Data Schema

### Hiragana/Katakana

```json
{
  "id": "hira-a",
  "kana": "あ",
  "romaji": "a",
  "group": "vowels",
  "example": "あさ",
  "example_meaning": "morning"
}
```

### Vocabulary

```json
{
  "id": "vocab-n5-001",
  "word": "学校",
  "reading": "がっこう",
  "romaji": "gakkou",
  "meaning_vi": "trường học",
  "meaning_en": "school",
  "level": "N5",
  "type": "noun",
  "lesson": "L1",
  "example": "学校へ行きます",
  "example_reading": "がっこう へ いきます",
  "example_meaning": "I go to school"
}
```

### Kanji

```json
{
  "id": "kanji-n5-001",
  "kanji": "日",
  "meaning_vi": "ngày, mặt trời",
  "onyomi": "ニチ ジツ",
  "kunyomi": "ひ",
  "level": "N5",
  "lesson": "L1",
  "example_word": "日本",
  "example_reading": "にほん",
  "example_meaning": "Nhật Bản"
}
```

### Grammar

```json
{
  "id": "grammar_l01_001",
  "lesson": "1",
  "jlpt_level": "N5",
  "title": "〜は〜です",
  "pattern": "〜は〜です",
  "meaning_vi": "A là B",
  "meaning_en": "A is B",
  "structure": "Noun + は + Noun + です",
  "formation": "Danh từ 1 + は + Danh từ 2 + です",
  "usage_note_vi": "Dùng để giới thiệu hoặc khẳng định một danh từ là gì.",
  "usage_note_en": "Used to identify or introduce a noun.",
  "example_1": "私は学生です。",
  "example_1_reading": "わたしはがくせいです。",
  "example_1_translation_vi": "Tôi là sinh viên.",
  "example_2": "マイクさんは会社員です。",
  "example_2_reading": "マイクさんはかいしゃいんです。",
  "example_2_translation_vi": "Anh Mike là nhân viên công ty.",
  "related_patterns": ["〜は〜じゃありません", "〜は〜ですか"],
  "tags": ["introduction", "copula", "lesson1"]
}
```

## Features Detail

### Learning Pages

Each learning page includes:
- **Search** - Search by any field
- **Filters** - Filter by group, level, type, etc.
- **Card Display** - Visual card-based layout
- **Quick Actions** - Direct links to Flashcards and Quiz

### Grammar Module

The Grammar module provides comprehensive Japanese grammar learning:

- **Organized Structure**:
  - Organized by Minna no Nihongo lessons
  - Categorized by JLPT levels (N5-N1)
  - Searchable by pattern, meaning, or tags
  
- **Detailed Information**:
  - Grammar pattern in Japanese
  - Vietnamese and English meanings
  - Structure and formation explanation
  - Usage notes in both languages
  - Two example sentences with readings and translations
  - Related grammar patterns
  - Tags for easy categorization

- **View Modes**:
  - Card view - Visual cards with key information
  - List view - Table format for quick scanning

- **Filtering Options**:
  - Filter by JLPT level
  - Filter by lesson number
  - Filter by tags/categories
  - Full-text search across all fields

- **Grammar Detail Modal**:
  - Complete pattern explanation
  - All examples and translations
  - Related patterns for deeper learning
  - Quick access to flashcards and quizzes

- **Integration**:
  - Grammar flashcards for memorization
  - Grammar quizzes for testing
  - Admin panel for CRUD operations

### Flashcards Mode

- **3D Flip Animation** - Smooth card flipping effect
- **Navigation** - Previous/Next buttons and keyboard shortcuts
- **Progress Tracking** - Visual progress bar
- **Shuffle** - Randomize card order
- **Multiple Datasets** - Choose from Hiragana, Katakana, Vocab, Kanji, or Grammar

**Keyboard Shortcuts**:
- `Space` or `Enter` - Flip card
- `← Left Arrow` - Previous card
- `→ Right Arrow` - Next card

### Quiz Mode

- **Multiple Question Types**:
  - Kana → Romaji
  - Romaji → Kana
  - Word → Meaning
  - Meaning → Word
  - Kanji → Meaning
  - Pattern → Meaning (Grammar)
  - Meaning → Pattern (Grammar)
  - Pattern → Usage (Grammar)
  - And more...

- **4 Multiple Choice Options**
- **Instant Feedback** - Correct/wrong indication
- **Score Tracking** - Real-time score display
- **Progress Bar** - Visual progress indicator
- **Detailed Results** - Review all answers at the end

### Admin Panel

- **CRUD Operations**:
  - Add new items
  - Edit existing items
  - Delete items
  - Bulk operations

- **Data Management**:
  - Export current dataset
  - Export all data
  - Import from JSON
  - Reset to defaults

- **Tabbed Interface** - Separate tabs for each dataset

## Browser Compatibility

Tested and working on:

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Opera 76+

**Requirements**:
- JavaScript enabled
- localStorage support
- Modern CSS support (Flexbox, Grid, Animations)

## Customization

### Adding More Data

1. **Via Admin Panel** (User-friendly):
   - Go to Admin page
   - Select appropriate tab
   - Click "Add New"
   - Fill in the form
   - Save

2. **Via JSON Files** (For bulk updates):
   - Edit files in `assets/data/`
   - Follow existing schema
   - Refresh page or reset data

### Styling

All styles are in `assets/css/`:
- Modify `style.css` for global styles
- Modify specific CSS files for component styles
- CSS variables in `:root` for easy theming

### Extending Functionality

The modular architecture makes it easy to:
- Add new data types
- Create new quiz modes
- Add new features
- Integrate with APIs

## Troubleshooting

### Data Not Loading

1. Check browser console for errors
2. Verify JSON files are accessible
3. Clear localStorage and reload
4. Try different browser

### localStorage Full

- Export your data
- Clear other site data
- Use smaller datasets

### Styles Not Working

1. Check CSS files are loaded
2. Verify Bootstrap CDN is accessible
3. Clear browser cache
4. Check for CSS conflicts

## Performance

- **Fast Loading** - No build process
- **Lightweight** - Minimal dependencies
- **Offline-capable** - Works without internet after first load
- **Responsive** - Optimized for all screen sizes

## Contributing

To extend this project:

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Test thoroughly
5. Submit pull request

## License

This project is open source and available for educational purposes.

## Credits

Built with:
- [Bootstrap 5](https://getbootstrap.com/)
- [jQuery](https://jquery.com/)
- [Bootstrap Icons](https://icons.getbootstrap.com/)

## Support

For issues or questions:
- Check existing documentation
- Review code comments
- Open GitHub issue

## Future Enhancements

Potential features to add:
- Speech synthesis for pronunciation
- Stroke order animations for Kanji
- Progress tracking and statistics
- Study reminders
- Mobile app version
- More JLPT levels and vocabulary
- Grammar lessons
- Reading practice texts

---

**Made with ❤️ for Japanese learners**

Happy studying! 頑張ってください！(Ganbatte kudasai!)
