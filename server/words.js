// words.js - The word bank for the game
// Words are grouped by category to keep things fun and varied

const words = {
  animals: [
    "cat", "dog", "elephant", "giraffe", "penguin", "dolphin", "tiger", "zebra",
    "kangaroo", "panda", "lion", "monkey", "parrot", "shark", "whale", "butterfly",
    "eagle", "crocodile", "jellyfish", "octopus", "flamingo", "gorilla", "cheetah"
  ],
  objects: [
    "umbrella", "guitar", "bicycle", "telescope", "lighthouse", "compass", "hammer",
    "trophy", "lantern", "telescope", "anchor", "camera", "microscope", "hourglass",
    "candle", "clock", "mirror", "ladder", "magnet", "paintbrush", "scissors", "torch"
  ],
  food: [
    "pizza", "sushi", "hamburger", "ice cream", "watermelon", "banana", "taco",
    "cupcake", "hotdog", "pasta", "spaghetti", "popcorn", "donut", "pancake",
    "sandwich", "pretzel", "waffle", "burrito", "smoothie", "croissant"
  ],
  actions: [
    "swimming", "dancing", "sleeping", "cooking", "painting", "running", "flying",
    "climbing", "fishing", "singing", "jumping", "reading", "laughing", "surfing",
    "skiing", "knitting", "gardening", "driving", "hugging", "stretching"
  ],
  places: [
    "beach", "volcano", "forest", "castle", "library", "airport", "stadium",
    "desert", "jungle", "cave", "lighthouse", "igloo", "pyramid", "treehouse",
    "submarine", "spaceship", "farm", "hospital", "museum", "circus"
  ],
  nature: [
    "rainbow", "thunder", "snowflake", "tornado", "waterfall", "volcano", "glacier",
    "canyon", "aurora", "eclipse", "tsunami", "avalanche", "coral reef", "geyser"
  ]
};

// Flatten all words into one array
const allWords = Object.values(words).flat();

// Get N random words from the pool
function getRandomWords(count = 3) {
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

module.exports = { words, allWords, getRandomWords };
