# Introduction to Programming

## What is Programming?

Programming is giving instructions to a computer, like writing a recipe. You tell the computer exactly what to do, step by step, and it follows your instructions.

Think of it like this: if you wanted to teach a robot to make a sandwich, you'd need to be very specific—"pick up bread," "spread peanut butter," "add jelly," "put bread on top." That's programming!

## What is JavaScript?

JavaScript is a programming language that makes websites interactive. It's what makes buttons work, games run, and pages change without reloading.

**Example:** When you click "Like" on a video and the number goes up instantly—that's JavaScript!

## Variables

Variables are like labeled boxes that store information. You can put things in them and use them later.

```javascript
let playerName = "Alex";
let score = 100;
let isWinning = true;
```

Think of it like this:

- `playerName` is a box with "Alex" written on a piece of paper inside
- `score` is a box with the number 100 inside
- `isWinning` is a box with either true or false inside

## Conditionals

Conditionals let your code make decisions using `if` and `else`. It's like saying "IF this happens, THEN do that."

```javascript
if (score > 50) {
  console.log("You're doing great!");
} else {
  console.log("Keep trying!");
}
```

**Real life example:** IF it's raining, THEN bring an umbrella, ELSE wear sunglasses.

## Loops

Loops repeat actions without writing the same code over and over. There are two main types:

**For Loop** - repeat a specific number of times:

```javascript
for (let i = 1; i <= 5; i++) {
  console.log("Count: " + i);
}
// Prints: Count: 1, Count: 2, Count: 3, Count: 4, Count: 5
```

**While Loop** - repeat while something is true:

```javascript
let lives = 3;
while (lives > 0) {
  console.log("Lives left: " + lives);
  lives = lives - 1;
}
```

**Real life example:** Doing jumping jacks—you could do 10 (for loop) or keep going until you're tired (while loop).

## HTML, CSS, and JavaScript

Building a website is like building a house:

### HTML - The Structure

HTML is the skeleton and walls. It creates the basic structure—buttons, text, images, and sections.

**Example:** "Put a button here, put a title there."

### CSS - The Style

CSS is the paint, furniture, and decorations. It makes things look good—colors, sizes, fonts, and layouts.

**Example:** "Make the button blue, make the text big, center everything."

### JavaScript - The Functionality

JavaScript is the electricity and plumbing. It makes things work and respond to actions.

**Example:** "When someone clicks the button, change the text and play a sound."

---

**Together they create websites:**

- HTML says "Here's a button"
- CSS says "Make it blue and round"
- JavaScript says "When clicked, do something cool"
