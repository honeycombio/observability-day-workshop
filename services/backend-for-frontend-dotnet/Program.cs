using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using System.Diagnostics;
using System.Text.Json;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();
builder.Services.AddHealthChecks();
// Create an ActivitySource for the rating span
var ratingActivitySource = new ActivitySource("report-rating");

builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder => tracerProviderBuilder
        .ConfigureResource(resource => resource.AddService(builder.Environment.ApplicationName))
        .AddHttpClientInstrumentation()
        .AddAspNetCoreInstrumentation()
        .AddSource("report-rating") // Register our custom ActivitySource
        .AddOtlpExporter()
    );

var app = builder.Build();

app.MapPost("/createPicture", async (HttpClient client) => {
    var imagePickerResponse = await client.GetFromJsonAsync<ImagePickerResponse>("http://image-picker:10118/imageUrl");
    var phrasePickerResponse = await client.GetFromJsonAsync<PhrasePickerResponse>("http://phrase-picker:10117/phrase");

    var image = await client.PostAsJsonAsync($"http://meminator:10116/applyPhraseToImage",
        new {
            imageUrl = imagePickerResponse!.ImageUrl,
            inputPhrase = phrasePickerResponse!.Phrase
        });
    if (!image.IsSuccessStatusCode)
    {
        return Results.StatusCode((int)image.StatusCode);
    }
    return Results.File(image.Content.ReadAsStream(), "image/png");
});

// Rating endpoint to handle user ratings
app.MapPost("/rating", (RatingRequest ratingData) => {
    // Get the current activity (span)
    var currentActivity = Activity.Current;

    // Set rating attributes on current span
    if (currentActivity != null && !string.IsNullOrEmpty(ratingData.Rating))
    {
        currentActivity.SetTag("app.rating", ratingData.Rating);
        if (!string.IsNullOrEmpty(ratingData.RatingEmoji))
        {
            currentActivity.SetTag("app.rating.emoji", ratingData.RatingEmoji);
        }
    }

    // Create a special span that is attached to the picture-creation trace
    if (ratingData.PictureSpanContext == null)
    {
        return Results.BadRequest(new { status = "error", message = "Missing pictureSpanContext in request body" });
    }

    try
    {
        // Use the global ActivitySource for the rating span

        // Create the context for the new span
        var traceIdBytes = ActivityTraceId.CreateFromString(ratingData.PictureSpanContext.TraceId);
        var spanIdBytes = ActivitySpanId.CreateFromString(ratingData.PictureSpanContext.SpanId);

        // Create a link to the original span
        var context = new ActivityContext(
            traceIdBytes,
            spanIdBytes,
            ActivityTraceFlags.Recorded,
            isRemote: true
        );

        // Start a new activity (span) with the context
        using (var activity = ratingActivitySource.StartActivity("user rating", ActivityKind.Server, context))
        {
            if (activity != null)
            {
                // Add attributes to the span
                activity.SetTag("app.rating", ratingData.Rating);
                if (!string.IsNullOrEmpty(ratingData.RatingEmoji))
                {
                    activity.SetTag("app.rating.emoji", ratingData.RatingEmoji);
                }
            }
        }

        return Results.Json(new { status = "success" });
    }
    catch (Exception ex)
    {
        Console.Error.WriteLine($"Error creating span in picture trace context: {ex}");
        return Results.StatusCode(500);
    }
});

app.Run();

record ImagePickerResponse(string ImageUrl);

record PhrasePickerResponse(string Phrase);

record PictureSpanContext(string TraceId, string SpanId);

record RatingRequest
{
    [JsonPropertyName("rating")]
    public string Rating { get; init; } = string.Empty;

    [JsonPropertyName("ratingEmoji")]
    public string? RatingEmoji { get; init; }

    [JsonPropertyName("pictureSpanContext")]
    public PictureSpanContext? PictureSpanContext { get; init; }
}