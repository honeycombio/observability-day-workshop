using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using phrase_picker_dotnet.Data;
using phrase_picker_dotnet.Models;

// We don't use fallback phrases as per project guidelines
// Instead, we'll let the service fail if the database is not available
// This is better for instructional purposes to demonstrate error telemetry

var builder = WebApplication.CreateBuilder(args);

// Database path
string dbPath = "/app/shared-data/phrases.db";

// Add services to the container
builder.Services.AddHealthChecks();

// Configure Entity Framework Core with SQLite
builder.Services.AddDbContext<PhraseDbContext>(options =>
    options.UseSqlite($"Data Source={dbPath};Mode=ReadOnly;"));

// Register the repository
builder.Services.AddScoped<IPhraseRepository>(provider =>
    new EfPhraseRepository(provider.GetRequiredService<PhraseDbContext>(), dbPath));

// Configure OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder => tracerProviderBuilder
        .ConfigureResource(resource => resource.AddService(builder.Environment.ApplicationName))
        .AddHttpClientInstrumentation()
        .AddAspNetCoreInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter()
    );

var app = builder.Build();

app.MapHealthChecks("/health");

app.MapGet("/phrase", async (IPhraseRepository repository) =>
{
    var activity = Activity.Current;

    try
    {
        // Check if the database exists
        if (!repository.DatabaseExists())
        {
            if (activity != null)
            {
                activity.SetTag("error", true);
                activity.SetTag("error.message", "Database file not found");
                activity.SetTag("error.type", "database.file.missing");
                activity.AddEvent(new ActivityEvent("database.file.missing",
                    tags: new ActivityTagsCollection
                    {
                        { "error.message", "Database file not found" }
                    }));
            }
            return Results.Json(new { error = "Database file not found" }, statusCode: 500);
        }

        // Get a random phrase
        var phraseEntity = await repository.GetRandomPhraseAsync();

        if (phraseEntity != null)
        {
            // Add phrase to the current activity (span)
            if (activity != null)
            {
                activity.SetTag("app.phrase", phraseEntity.Text);
            }

            return Results.Json(new { phrase = phraseEntity.Text });
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
        if (activity != null)
        {
            activity.SetTag("error", true);
            activity.SetTag("error.message", ex.Message);
        }

        return Results.Json(new { error = "Internal server error" }, statusCode: 500);
    }
});

app.Run();
