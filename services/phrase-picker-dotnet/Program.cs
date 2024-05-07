var phrases = new [] {
    "you're muted",
    "not dead yet",
    "Let them.",
    "Boiling Loves Company!",
    "Must we?",
    "SRE not-sorry",
    "Honeycomb at home",
    "There is no cloud",
    "This is fine",
    "It's a trap!",
    "Not Today",
    "You had one job",
    "bruh",
    "have you tried restarting?",
    "try again after coffee",
    "deploy != release",
    "oh, just the crimes",
    "not a bug, it's a feature",
    "test in prod"
};

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks();

var app = builder.Build();

app.MapHealthChecks("/health");

app.MapGet("/phrase", () =>
{
    return new { 
        phrase = phrases[Random.Shared.Next(phrases.Length)]
    };
});

app.Run();
