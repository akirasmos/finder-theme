# The Quill Games

A daily games section for *The Quill*, the student news publication of Morris
Knolls High School, styled in The Quill's green and gold to sit alongside mkquill.com:

- **Quirdle**: guess the hidden 5-letter word in 6 tries.
- **Quill Mini**: a 5×5 daily crossword with a timer.

It's plain HTML, CSS and JavaScript with no build step and no server code, so it
works on any host: GitHub Pages, Netlify, your school's web server, or an
"embed HTML" block in WordPress, Squarespace or Wix (upload the folder and link to it).

```
quill-games/
├── index.html        Games home page (links to both games)
├── quirdle.html      Quirdle
├── mini.html         Quill Mini crossword
├── css/games.css     Shared styles (colors are at the top)
└── js/
    ├── common.js     Launch date, saving, pop-ups, keyboard
    ├── words.js      Quirdle answers + accepted guesses
    ├── puzzles.js    Mini Crossword puzzles
    ├── quirdle.js
    └── mini.js
```

## Try it locally

```sh
cd quill-games
python3 -m http.server 8000
# open http://localhost:8000
```

(Opening `index.html` by double-clicking works too.)

## Putting it on the site

Upload the whole `quill-games` folder next to your newspaper's pages, then add a
**Games** link to your nav bar that points to `quill-games/index.html`.

## Daily puzzles

Every player gets the same puzzle on the same day. The puzzle changes at local
midnight. Day 1 is `LAUNCH_DATE` at the top of `js/common.js`. Set it to the day
you go live.

### Quirdle words

`js/words.js` has two lists:

- `QUIRDLE_ANSWERS`: one answer per day, in order. The first few are
  newspaper-themed (QUILL, WRITE, STORY, PAPER, PRINT). Swap in school-themed words
  (mascot, teacher nicknames, etc.) wherever you like. Words must be 5 lowercase
  letters. The list has about 645 words (almost two years) and then starts over.
- `QUIRDLE_VALID`: extra words that are accepted as guesses but never used as
  answers.

### Mini Crossword puzzles

`js/puzzles.js` has one entry per day. After the last one it starts over, so
**keep adding puzzles** (a staff crossword editor is a great job for this). Format:

```js
{
  title: "Deadline Day",
  author: "Your Name",
  grid: ["##SOD",
         "#PLAY",
         "WRITE",
         "EACH#",
         "BYE##"],          // "#" = black square
  across: [["SOD", "Grass sold in rolls"], ...],
  down:   [["SLICE", "Piece of pizza"], ...],
}
```

Clue numbers are worked out from the grid, so you only pair each answer with
its clue. Every row and column of letters has to spell a real word. If a clue is
missing or doesn't match the grid, the browser's developer console will tell you
which one.

## Customizing the look

The colors are CSS variables at the top of `css/games.css`. `--brand` is Quill
green and `--gold` is Golden Eagles gold. If mkquill.com uses slightly different
shades, paste its hex codes there and everything updates. The games always display in light mode, like mkquill.com.
Fonts are Libre Baskerville (masthead), Oswald (labels and nav) and Source Sans 3
(text) from Google Fonts.

The nav bar on the games home page (`index.html`) links to the main sections of
mkquill.com. Edit that list if the site's sections change.

## Notes

- Progress, stats and streaks are saved in each player's browser (`localStorage`).
  There are no accounts and nothing is sent to a server.
- Since everything runs in the browser, a curious student could find the answers
  in the page source. That's normal for games like this.
