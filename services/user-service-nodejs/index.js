require("./tracing");
const express = require("express");
const { trace } = require("@opentelemetry/api");

const app = express();
// Use environment variable for port with a different default for local development
const PORT = process.env.PORT || 3000; // Docker uses 10119, local dev uses 3000

app.use(express.json());

// Array of users with famous portraits from Wikimedia Commons
const users = [
  {
    id: "1",
    name: "Leonardo da Vinci - Mona Lisa",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mona_Lisa-restored.jpg/250px-Mona_Lisa-restored.jpg",
  },
  {
    id: "2",
    name: "Johannes Vermeer - Girl With The Pearl Earring",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Girl_with_a_Pearl_Earring.jpg/250px-Girl_with_a_Pearl_Earring.jpg",
  },
  {
    id: "3",
    name: "Vincent van Gogh - Self-Portrait",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg/250px-Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg",
  },
  {
    id: "4",
    name: "Rembrandt - Self-Portrait at the Age of 63",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Rembrandt_Harmensz._van_Rijn_135.jpg/162px-Rembrandt_Harmensz._van_Rijn_135.jpg",
  },
  {
    id: "5",
    name: "Albrecht Dürer - Self-Portrait",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/D%C3%BCrer_Alte_Pinakothek.jpg/142px-D%C3%BCrer_Alte_Pinakothek.jpg",
  },
  {
    id: "6",
    name: "Judith Leyster - Self-portrait",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Self-portrait_by_Judith_Leyster.jpg/175px-Self-portrait_by_Judith_Leyster.jpg",
  },
  {
    id: "7",
    name: "Elisabeth Louise Vigée-Lebrun - Self-portrait with daughter",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Self-portrait_with_Her_Daughter_by_Elisabeth-Louise_Vig%C3%A9e_Le_Brun.jpg/148px-Self-portrait_with_Her_Daughter_by_Elisabeth-Louise_Vig%C3%A9e_Le_Brun.jpg",
  },
  {
    id: "8",
    name: "Artemisia Gentileschi - Self-Portrait as the Allegory of Painting",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Self-portrait_as_the_Allegory_of_Painting_%28La_Pittura%29_-_Artemisia_Gentileschi.jpg/148px-Self-portrait_as_the_Allegory_of_Painting_%28La_Pittura%29_-_Artemisia_Gentileschi.jpg",
  },
  {
    id: "9",
    name: "Titian - Man in blue",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Man_with_Blue_Sleeve_2.jpg/250px-Man_with_Blue_Sleeve_2.jpg",
  },
  {
    id: "10",
    name: "Grant Wood - American Gothic",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Grant_DeVolson_Wood_-_American_Gothic.jpg/250px-Grant_DeVolson_Wood_-_American_Gothic.jpg",
  },
];

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ message: "User service is healthy", status_code: 0 });
});

// Helper function to get a random user
function getRandomUser() {
  const randomIndex = Math.floor(Math.random() * users.length);
  return users[randomIndex];
}

// Get current user endpoint
app.get("/current-user", (req, res) => {
  const currentSpan = trace.getActiveSpan();

  // Get a random user
  const user = getRandomUser();

  if (currentSpan) {
    currentSpan.setAttribute("user.id", user.id);
    currentSpan.setAttribute("user.name", user.name);
  }

  res.json(user);
});

// Start the server
app.listen(PORT, () => {
  console.log(`User service running on http://localhost:${PORT}`);
});
