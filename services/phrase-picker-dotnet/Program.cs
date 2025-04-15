using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

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
    "test in prod",
    "it was dns",
    "all the best things are stupid",
    "entropy comes for us all",
    "I'm down if you're up for it",
    "Can you give me a concrete example?"
};

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHealthChecks();
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder => tracerProviderBuilder
        .ConfigureResource(resource => resource.AddService(builder.Environment.ApplicationName))
        .AddHttpClientInstrumentation()
        .AddAspNetCoreInstrumentation()
        .AddOtlpExporter()
    );

var app = builder.Build();

app.MapHealthChecks("/health");

app.MapGet("/phrase", () =>
{
    return new { 
        phrase = phrases[Random.Shared.Next(phrases.Length)]
    };
});

app.Run();
