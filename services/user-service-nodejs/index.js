require("./tracing");
const express = require("express");
const { trace } = require("@opentelemetry/api");

const app = express();
const PORT = 10119;

app.use(express.json());

// Current user data
const currentUser = {
  id: "1",
  name: "Meminator User",
  avatarUrl:
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
};

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ message: "User service is healthy", status_code: 0 });
});

// Get current user endpoint
app.get("/current-user", (req, res) => {
  const currentSpan = trace.getActiveSpan();

  // Current user data
  const user = {
    id: "1",
    name: "Meminator User",
    avatarUrl:
      "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y",
  };

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
