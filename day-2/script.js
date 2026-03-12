// ========================================
// DAY 2: Making Your Page Interactive
// JavaScript makes things happen! ⚡
// ========================================

// STEP 1: Find the button on the page
// We use getElementById to grab the button by its id
const button = document.getElementById("magicButton");

// STEP 2: Find the message box where we'll change the text
const messageBox = document.getElementById("messageBox");

// STEP 3: Keep track of how many times the button was clicked
let clickCount = 0;

// STEP 4: Add a click event to the button
// This means "when someone clicks the button, do this stuff"
button.addEventListener("click", () => {
  // Add 1 to the click count each time
  clickCount = clickCount + 1;

  // Change the text in the message box
  messageBox.textContent =
    "🎉 You clicked the button " + clickCount + " times! Keep going!";

  // Change the background color based on clicks
  if (clickCount < 5) {
    messageBox.style.backgroundColor = "#ffffcc"; // Light yellow
  } else if (clickCount < 10) {
    messageBox.style.backgroundColor = "#ffccff"; // Light pink
  } else {
    messageBox.style.backgroundColor = "#ccffcc"; // Light green
    messageBox.textContent =
      "🏆 WOW! You're a clicking champion! " + clickCount + " clicks!";
  }
});

// ========================================
// 🏆 CHALLENGE FOR YOU:
// ========================================
// 1. Change the messages to something funny
// 2. Try different background colors (Google "CSS colors")
// 3. Change what happens at 5 and 10 clicks
// 4. Add your own creative twist!
