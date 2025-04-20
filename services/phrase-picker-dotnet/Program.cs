using System.Diagnostics;
using Microsoft.Data.Sqlite;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

// Fallback phrases in case the database is not available
var fallbackPhrases = new [] {
    "you're muted",
    "not dead yet",
    "Let them.",
    "This is fine",
    "It's a trap!",
    "Not Today",
    "You had one job",
    "bruh",
    "have you tried restarting?",
    "try again after coffee",
    "not a bug, it's a feature",
    "test in prod"
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
    var activity = Activity.Current;

    try
    {
        var phrase = GetRandomPhrase();

        if (phrase != null)
        {
            // Add phrase to the current activity (span)
            if (activity != null)
            {
                activity.SetTag("app.phrase", phrase);
            }

            return Results.Json(new { phrase });
        }
        else
        {
            // If we couldn't get a phrase, return a 500 error
            if (activity != null)
            {
                activity.SetTag("error", true);
                activity.SetTag("error.message", "Failed to retrieve phrase data");
            }

            return Results.Json(new { error = "Failed to retrieve phrase data" }, statusCode: 500);
        }
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"Error getting random phrase: {ex}");

        if (activity != null)
        {
            activity.SetTag("error", true);
            activity.SetTag("error.message", ex.Message);
        }

        return Results.Json(new { error = "Internal server error" }, statusCode: 500);
    }
});

// Helper function to get a random phrase from the database
string? GetRandomPhrase()
{
    var activity = Activity.Current;

    // Determine the database path
    string dbPath = "/app/shared-data/phrases.db";

    // Try alternative paths if the default doesn't exist
    if (!File.Exists(dbPath))
    {
        // Try relative path from current directory
        string relativePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "../shared-data/phrases.db");
        if (File.Exists(relativePath))
        {
            dbPath = relativePath;
        }
        else
        {
            // Try another common location
            string altPath = Path.Combine(Directory.GetCurrentDirectory(), "shared-data/phrases.db");
            if (File.Exists(altPath))
            {
                dbPath = altPath;
            }
        }
    }

    // Log the database path for debugging
    Console.WriteLine($"Using database path: {dbPath}");
    Console.WriteLine($"Database exists: {File.Exists(dbPath)}");

    // If database doesn't exist, use fallback phrases
    if (!File.Exists(dbPath))
    {
        Console.WriteLine("Database not found, using fallback phrases");
        if (activity != null)
        {
            activity.SetTag("app.using_fallback", true);
        }
        return fallbackPhrases[Random.Shared.Next(fallbackPhrases.Length)];
    }

    // Create connection string with read-only mode
    string connectionString = $"Data Source={dbPath};Mode=ReadOnly;";

    try
    {
        Console.WriteLine($"Opening connection with: {connectionString}");
        using (var connection = new SqliteConnection(connectionString))
        {
            connection.Open();
            Console.WriteLine("Connection opened successfully");

            // Count the total number of phrases
            using (var countCommand = connection.CreateCommand())
            {
                countCommand.CommandText = "SELECT COUNT(*) as count FROM phrases";
                Console.WriteLine("Executing count query");
                var count = Convert.ToInt32(countCommand.ExecuteScalar());
                Console.WriteLine($"Found {count} phrases in database");

                if (count == 0)
                {
                    Console.WriteLine("No phrases found in database, using fallback phrases");
                    if (activity != null)
                    {
                        activity.AddEvent(new ActivityEvent("database.query.error",
                            tags: new ActivityTagsCollection
                            {
                                { "error.message", "No phrases found in database" }
                            }));
                        activity.SetTag("app.using_fallback", true);
                    }
                    return fallbackPhrases[Random.Shared.Next(fallbackPhrases.Length)];
                }

                // Get a random phrase from the database
                var randomId = new Random().Next(1, count + 1);
                Console.WriteLine($"Selected random phrase ID: {randomId}");
                if (activity != null)
                {
                    activity.SetTag("app.random_phrase_id", randomId);
                    activity.SetTag("app.phrase_count", count);
                }

                using (var phraseCommand = connection.CreateCommand())
                {
                    phraseCommand.CommandText = "SELECT text FROM phrases WHERE id = @id";
                    phraseCommand.Parameters.AddWithValue("@id", randomId);
                    Console.WriteLine("Executing phrase query");

                    var phrase = phraseCommand.ExecuteScalar()?.ToString();

                    if (string.IsNullOrEmpty(phrase))
                    {
                        Console.WriteLine($"Phrase with ID {randomId} not found, using fallback phrases");
                        if (activity != null)
                        {
                            activity.AddEvent(new ActivityEvent("database.query.error",
                                tags: new ActivityTagsCollection
                                {
                                    { "error.message", $"Phrase with ID {randomId} not found" },
                                    { "phrase.id", randomId }
                                }));
                            activity.SetTag("app.using_fallback", true);
                        }
                        return fallbackPhrases[Random.Shared.Next(fallbackPhrases.Length)];
                    }

                    Console.WriteLine($"Returning phrase: {phrase}");
                    return phrase;
                }
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Exception: {ex.GetType().Name}: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");

        if (activity != null)
        {
            activity.AddEvent(new ActivityEvent("database.query.exception",
                tags: new ActivityTagsCollection
                {
                    { "error.message", ex.Message },
                    { "error.type", ex.GetType().Name }
                }));
            activity.SetTag("app.using_fallback", true);
        }

        // Use fallback phrases in case of error
        return fallbackPhrases[Random.Shared.Next(fallbackPhrases.Length)];
    }
}

app.Run();
