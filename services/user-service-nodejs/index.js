require('./tracing');
const express = require('express');
const cors = require('cors');
const { trace } = require('@opentelemetry/api');

const app = express();
const PORT = 10119;

app.use(cors());
app.use(express.json());

// Sample user data
const users = [
  {
    id: "1",
    name: "Meminator User",
    avatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
  },
  {
    id: "2",
    name: "Honeycomb Hero",
    avatarUrl: "https://www.gravatar.com/avatar/abc123?d=identicon&s=128"
  },
  {
    id: "3",
    name: "Observability Fan",
    avatarUrl: "https://www.gravatar.com/avatar/def456?d=retro&s=128"
  }
];

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ message: "User service is healthy", status_code: 0 });
});

// Get current user endpoint
app.get('/current-user', (req, res) => {
  const currentSpan = trace.getActiveSpan();
  
  // Always return the first user for now
  const user = users[0];
  
  if (currentSpan) {
    currentSpan.setAttribute("user.id", user.id);
    currentSpan.setAttribute("user.name", user.name);
  }
  
  res.json(user);
});

// Get user by ID endpoint
app.get('/user/:id', (req, res) => {
  const currentSpan = trace.getActiveSpan();
  const userId = req.params.id;
  
  if (currentSpan) {
    currentSpan.setAttribute("user.id.requested", userId);
  }
  
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }
  
  if (currentSpan) {
    currentSpan.setAttribute("user.name", user.name);
  }
  
  res.json(user);
});

// Start the server
app.listen(PORT, () => {
  console.log(`User service running on http://localhost:${PORT}`);
});
