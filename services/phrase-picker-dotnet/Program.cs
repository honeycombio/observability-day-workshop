using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using phrase_picker_dotnet.Data;
using phrase_picker_dotnet.Models;



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

        var phraseEntity = await repository.GetRandomPhraseAsync();

        if (phraseEntity != null)
        {
            if (activity != null)
            {
                activity.SetTag("app.phrase", phraseEntity.Text);
            }

            return Results.Json(new { phrase = phraseEntity.Text });
        }
        else
        {
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
