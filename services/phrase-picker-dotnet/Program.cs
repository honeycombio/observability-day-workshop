using System.Diagnostics;
using Microsoft.Data.Sqlite;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

// We don't use fallback phrases as per project guidelines
// Instead, we'll let the service fail if the database is not available
// This is better for instructional purposes to demonstrate error telemetry

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

    // Use the configured database path - no fallbacks
    string dbPath = "/app/shared-data/phrases.db";

    // Add database path info to the activity
    if (activity != null)
    {
        activity.SetTag("app.db_path", dbPath);
        activity.SetTag("app.db_exists", File.Exists(dbPath));
    }

    // If database doesn't exist, return null to indicate failure
    if (!File.Exists(dbPath))
    {
        // Error is already logged via activity tags
        if (activity != null)
        {
            activity.SetTag("error", true);
            activity.SetTag("error.message", "Database file not found");
            activity.SetTag("error.type", "database.file.missing");
            activity.AddEvent(new ActivityEvent("database.file.missing",
                tags: new ActivityTagsCollection
                {
                    { "error.message", "Database file not found" },
                    { "app.db_path", dbPath }
                }));
        }
        return null;
    }

    // Create connection string with read-only mode
    string connectionString = $"Data Source={dbPath};Mode=ReadOnly;";

    try
    {
        if (activity != null)
        {
            activity.SetTag("app.db_connection_string", connectionString);
        }

        using (var connection = new SqliteConnection(connectionString))
        {
            connection.Open();

            if (activity != null)
            {
                activity.AddEvent(new ActivityEvent("database.connection.opened"));
            }

            // Count the total number of phrases
            using (var countCommand = connection.CreateCommand())
            {
                countCommand.CommandText = "SELECT COUNT(*) as count FROM phrases";

                if (activity != null)
                {
                    activity.AddEvent(new ActivityEvent("database.query.count",
                        tags: new ActivityTagsCollection
                        {
                            { "query", countCommand.CommandText }
                        }));
                }

                var count = Convert.ToInt32(countCommand.ExecuteScalar());

                if (count == 0)
                {
                    // Error is already logged via activity tags
                    if (activity != null)
                    {
                        activity.SetTag("error", true);
                        activity.SetTag("error.message", "No phrases found in database");
                        activity.SetTag("error.type", "database.query.error");
                        activity.AddEvent(new ActivityEvent("database.query.error",
                            tags: new ActivityTagsCollection
                            {
                                { "error.message", "No phrases found in database" }
                            }));
                    }
                    return null;
                }

                // Get a random phrase from the database
                var randomId = new Random().Next(1, count + 1);
                if (activity != null)
                {
                    activity.SetTag("app.random_phrase_id", randomId);
                    activity.SetTag("app.phrase_count", count);
                }

                using (var phraseCommand = connection.CreateCommand())
                {
                    phraseCommand.CommandText = "SELECT text FROM phrases WHERE id = @id";
                    phraseCommand.Parameters.AddWithValue("@id", randomId);

                    if (activity != null)
                    {
                        activity.AddEvent(new ActivityEvent("database.query.phrase",
                            tags: new ActivityTagsCollection
                            {
                                { "query", phraseCommand.CommandText },
                                { "phrase.id", randomId }
                            }));
                    }

                    var phrase = phraseCommand.ExecuteScalar()?.ToString();

                    if (string.IsNullOrEmpty(phrase))
                    {
                        // Error is already logged via activity tags
                        if (activity != null)
                        {
                            activity.SetTag("error", true);
                            activity.SetTag("error.message", $"Phrase with ID {randomId} not found");
                            activity.SetTag("error.type", "database.query.error");
                            activity.SetTag("phrase.id", randomId);
                            activity.AddEvent(new ActivityEvent("database.query.error",
                                tags: new ActivityTagsCollection
                                {
                                    { "error.message", $"Phrase with ID {randomId} not found" },
                                    { "phrase.id", randomId }
                                }));
                        }
                        return null;
                    }

                    if (activity != null)
                    {
                        activity.SetTag("app.phrase", phrase);
                    }
                    return phrase;
                }
            }
        }
    }
    catch (Exception ex)
    {
        // Error is already logged via activity tags

        if (activity != null)
        {
            activity.SetTag("error", true);
            activity.SetTag("error.message", ex.Message);
            activity.SetTag("error.type", "database.query.exception");
            activity.AddEvent(new ActivityEvent("database.query.exception",
                tags: new ActivityTagsCollection
                {
                    { "error.message", ex.Message },
                    { "error.type", ex.GetType().Name }
                }));
        }

        // Return null to indicate failure
        return null;
    }
}

app.Run();
