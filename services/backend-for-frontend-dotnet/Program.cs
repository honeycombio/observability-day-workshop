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

// User info endpoint to fetch and display user information
app.MapGet("/user-info", async (HttpClient client) => {
    var currentActivity = Activity.Current;

    try {
        // Fetch user data from user-service
        var userResponse = await client.GetAsync("http://user-service:10119/current-user");

        // Default user data in case the service is unavailable
        var defaultUser = new UserResponse
        {
            Id = "0",
            Name = "Anonymous User",
            AvatarUrl = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"
        };

        // Parse the user data from the response
        UserResponse userData;
        if (userResponse.IsSuccessStatusCode) {
            var userContent = await userResponse.Content.ReadAsStringAsync();
            userData = JsonSerializer.Deserialize<UserResponse>(userContent) ?? defaultUser;
        } else {
            userData = defaultUser;
        }

        // Add user info to the current activity (span)
        if (currentActivity != null) {
            currentActivity.SetTag("user.id", userData.Id ?? "0");
            currentActivity.SetTag("user.name", userData.Name ?? "Anonymous User");
        }

        // HTML template for the user info
        var userInfoTemplate = $@"<div class=""user-info"" id=""user-info"" data-user-id=""{userData.Id}"" data-user-name=""{userData.Name}"">
          <a href=""https://commons.wikimedia.org/wiki/Famous_portraits"">
            <img id=""user-avatar"" src=""{userData.AvatarUrl}"" alt=""User Avatar"" class=""user-avatar"">
          </a>
          <span id=""user-name"" class=""user-name"">{userData.Name}</span>
        </div>";

        // Return the rendered template
        return Results.Content(userInfoTemplate, "text/html");
    } catch (Exception ex) {
        Console.Error.WriteLine($"Error fetching user info: {ex}");
        return Results.Content("<div class=\"user-info\" id=\"user-info\">Error loading user information</div>", "text/html");
    }
});

app.MapPost("/createPicture", async (HttpClient client, CreatePictureRequest request) => {
    var imagePickerResponse = await client.GetFromJsonAsync<ImagePickerResponse>("http://image-picker:10118/imageUrl");
    var phrasePickerResponse = await client.GetFromJsonAsync<PhrasePickerResponse>("http://phrase-picker:10117/phrase");

    // Extract user data from the request
    var userId = request.UserId ?? "unknown";
    var userName = request.UserName ?? "Anonymous User";

    var image = await client.PostAsJsonAsync($"http://meminator:10116/applyPhraseToImage",
        new {
            imageUrl = imagePickerResponse!.ImageUrl,
            inputPhrase = phrasePickerResponse!.Phrase,
            userId = userId,
            userName = userName
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

                // Add user data to the span
                activity.SetTag("user.id", ratingData.UserId ?? "unknown");
                activity.SetTag("user.name", ratingData.UserName ?? "Anonymous User");
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

    [JsonPropertyName("userId")]
    public string? UserId { get; init; }

    [JsonPropertyName("userName")]
    public string? UserName { get; init; }
}

record CreatePictureRequest
{
    [JsonPropertyName("userId")]
    public string? UserId { get; init; }

    [JsonPropertyName("userName")]
    public string? UserName { get; init; }
}

record UserResponse
{
    [JsonPropertyName("id")]
    public string? Id { get; init; }

    [JsonPropertyName("name")]
    public string? Name { get; init; }

    [JsonPropertyName("avatarUrl")]
    public string? AvatarUrl { get; init; }
}