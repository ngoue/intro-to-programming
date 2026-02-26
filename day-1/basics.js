// ========================================
// DAY 1: JavaScript Basics
// Welcome to your first day of coding! 🚀
// ========================================

// ========================================
// 1. CONSOLE.LOG - Printing to the screen
// ========================================
// console.log() lets you display messages and see what your code is doing

console.log("Hello, world!");
console.log("Welcome to JavaScript!");
console.log("This is going to be awesome! 🎮");

// ========================================
// 2. VARIABLES - Storing information
// ========================================
// Variables are like labeled boxes that hold information

// STRING - text (always use quotes)
let playerName = "Alex";
let favoriteGame = "Minecraft";
console.log("Player name:", playerName);
console.log("Favorite game:", favoriteGame);

// NUMBER - any number (no quotes needed)
let age = 14;
let score = 9500;
console.log("Age:", age);
console.log("Score:", score);

// BOOLEAN - true or false (no quotes)
let isOnline = true;
let hasWon = false;
console.log("Is online?", isOnline);
console.log("Has won?", hasWon);

// ========================================
// 3. SIMPLE MATH - Doing calculations
// ========================================
// You can do math just like in a calculator!

let apples = 5;
let oranges = 3;
let totalFruit = apples + oranges;
console.log("Total fruit:", totalFruit);

let money = 50;
let snackCost = 12;
let moneyLeft = money - snackCost;
console.log("Money left:", moneyLeft);

let level = 3;
let pointsPerLevel = 100;
let totalPoints = level * pointsPerLevel;
console.log("Total points:", totalPoints);

// ========================================
// 4. CONDITIONALS - Making decisions
// ========================================
// if/else lets your code make choices based on conditions

let temperature = 75;

if (temperature > 80) {
  console.log("It's hot! Time for ice cream! 🍦");
} else {
  console.log("Nice weather for a walk! 🌤️");
}

let lives = 3;

if (lives > 0) {
  console.log("Keep playing! You have", lives, "lives left");
} else {
  console.log("Game over! Try again");
}

// ========================================
// 5. FOR LOOP - Repeating code a set number of times
// ========================================
// Loops help you repeat actions without writing the same code over and over

console.log("Counting to 5:");
for (let i = 1; i <= 5; i++) {
  console.log(i);
}

console.log("Countdown:");
for (let i = 3; i >= 1; i--) {
  console.log(i);
}
console.log("Blast off! 🚀");

// ========================================
// 6. WHILE LOOP - Repeating while a condition is true
// ========================================
// A while loop keeps going as long as something is true

let energy = 5;
console.log("Running until tired...");

while (energy > 0) {
  console.log("Energy level:", energy);
  energy = energy - 1;
}
console.log("Too tired! Need a break 😴");

// ========================================
// 🎯 MINI CHALLENGE
// ========================================
// Try to figure out what this code does before running it!
// Then modify the numbers and see what happens!

let playerLevel = 1;
let experience = 0;

for (let quest = 1; quest <= 5; quest++) {
  experience = experience + 20;
  console.log("Quest", quest, "complete! XP:", experience);

  if (experience >= 50) {
    playerLevel = playerLevel + 1;
    console.log("🎉 LEVEL UP! Now level", playerLevel);
    experience = 0;
  }
}

// ========================================
// 🏆 CHALLENGE FOR YOU:
// ========================================
// 1. Change your playerName to your own name
// 2. Create a variable for your favorite number
// 3. Write an if/else that checks if your number is greater than 10
// 4. Make a loop that counts from 1 to your favorite number
//
// Have fun coding! 💻✨
