/* Mini Crossword puzzles. One per day, in order, starting on the launch
 * date set in mini.js. When the list runs out it starts over from the top.
 *
 * Adding a puzzle:
 *   grid:   5 rows of 5 characters. Letters for answers, "#" for black squares.
 *   across: [ANSWER, clue] for every across word (2+ letters), in any order.
 *   down:   [ANSWER, clue] for every down word, in any order.
 * Clue numbers are worked out from the grid automatically. If an answer
 * doesn't match the grid, the browser console will say which one.
 */
window.MINI_PUZZLES = [
  {
    title: "Deadline Day",
    author: "The Quill Staff",
    grid: ["##SOD", "#PLAY", "WRITE", "EACH#", "BYE##"],
    across: [
      ["SOD", "Grass sold in rolls"],
      ["PLAY", "Hit the ___ button"],
      ["WRITE", "What Quill reporters do on deadline"],
      ["EACH", "Apiece"],
      ["BYE", "Casual farewell"],
    ],
    down: [
      ["SLICE", "Piece of pizza"],
      ["OATH", "Sworn promise"],
      ["DYE", "Hair color product"],
      ["PRAY", "Hope really, really hard"],
      ["WEB", "World Wide ___"],
    ],
  },
  {
    title: "Study Hall",
    author: "The Quill Staff",
    grid: ["##ASH", "#ONTO", "EAGER", "ATLAS", "THEME"],
    across: [
      ["ASH", "Volcanic leftover"],
      ["ONTO", "\"I'm ___ you!\""],
      ["EAGER", "Raring to go"],
      ["ATLAS", "Book of maps in the library"],
      ["THEME", "Prom committee's big decision"],
    ],
    down: [
      ["ANGLE", "Acute or obtuse thing in geometry"],
      ["STEAM", "What rises from hot cocoa"],
      ["HORSE", "Basketball game spelled out one miss at a time"],
      ["OATH", "Promise made with a raised right hand"],
      ["EAT", "Hit the cafeteria"],
    ],
  },
  {
    title: "Buzzworthy",
    author: "The Quill Staff",
    grid: ["##ORB", "#CLUE", "WHILE", "HIVE#", "ONE##"],
    across: [
      ["ORB", "Glowing sphere"],
      ["CLUE", "What you're reading right now"],
      ["WHILE", "\"Be back in a little ___\""],
      ["HIVE", "Home for a 3-Down"],
      ["ONE", "Loneliest number, in song"],
    ],
    down: [
      ["OLIVE", "Pizza topping that's often black"],
      ["RULE", "Guideline in the student handbook"],
      ["BEE", "Honey maker"],
      ["CHIN", "Spot for a beard"],
      ["WHO", "A journalist's first W"],
    ],
  },
  {
    title: "Picture Day",
    author: "The Quill Staff",
    grid: ["##CAP", "#PAGE", "COMET", "USED#", "EEL##"],
    across: [
      ["CAP", "Graduation headwear"],
      ["PAGE", "Front ___ (where the top story goes)"],
      ["COMET", "Halley's is visible every 76 years"],
      ["USED", "Secondhand"],
      ["EEL", "Slippery sea creature"],
    ],
    down: [
      ["CAMEL", "Humped desert animal"],
      ["AGED", "Like fine cheese"],
      ["PET", "Goldfish or hamster, for example"],
      ["POSE", "Strike a ___ for the yearbook photo"],
      ["CUE", "Actor's signal to enter"],
    ],
  },
  {
    title: "Swim Meet",
    author: "The Quill Staff",
    grid: ["##FUR", "#LANE", "SOLID", "POST#", "APE##"],
    across: [
      ["FUR", "Cat's coat"],
      ["LANE", "Swimmer's assigned strip"],
      ["SOLID", "Ice, but not water"],
      ["POST", "Share on social media"],
      ["APE", "Gorilla or chimp"],
    ],
    down: [
      ["FALSE", "Opposite of true, on a quiz"],
      ["UNIT", "Textbook section with a test at the end"],
      ["RED", "Color of a teacher's correction pen"],
      ["LOOP", "Roller coaster feature"],
      ["SPA", "Place for a mud mask"],
    ],
  },
  {
    title: "Undercover",
    author: "The Quill Staff",
    grid: ["##SPY", "#SOLE", "ATLAS", "NAVY#", "DYE##"],
    across: [
      ["SPY", "Secret agent"],
      ["SOLE", "Bottom of a sneaker"],
      ["ATLAS", "Titan who holds up the sky"],
      ["NAVY", "Dark shade of blue"],
      ["DYE", "Tie-___ (summer camp craft)"],
    ],
    down: [
      ["SOLVE", "What you're doing to this puzzle"],
      ["PLAY", "Drama club's spring production"],
      ["YES", "RSVP you hope to get"],
      ["STAY", "\"Don't go!\""],
      ["AND", "Word spelled with an ampersand"],
    ],
  },
  {
    title: "Showtime",
    author: "The Quill Staff",
    grid: ["##SEA", "#STAR", "SHARE", "HORN#", "YET##"],
    across: [
      ["SEA", "Ocean"],
      ["STAR", "Gold sticker on a great test"],
      ["SHARE", "Split your lunch, say"],
      ["HORN", "Band instrument with a bell"],
      ["YET", "\"Are we there ___?\""],
    ],
    down: [
      ["START", "Get going"],
      ["EARN", "Make, as money from a summer job"],
      ["ARE", "\"You ___ here\" (map label)"],
      ["SHOE", "It has laces and a tongue"],
      ["SHY", "Quiet in class, maybe"],
    ],
  },
];
