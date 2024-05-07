using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();
builder.Services.AddHealthChecks();
builder.Services.AddOpenTelemetry()
    .WithTracing(tracerProviderBuilder => tracerProviderBuilder
        .ConfigureResource(resource => resource.AddService(builder.Environment.ApplicationName))
        .AddHttpClientInstrumentation()
        .AddAspNetCoreInstrumentation()
        .AddOtlpExporter()
    );

var app = builder.Build();

app.MapPost("/createPicture", async (HttpClient client) => {
    var imagePickerResponse = await client.GetFromJsonAsync<ImagePickerResponse>("http://image-picker:10114/imageUrl");
    var phrasePickerResponse = await client.GetFromJsonAsync<PhrasePickerResponse>("http://phrase-picker:10114/phrase");

    var image = await client.PostAsJsonAsync($"http://meminator:10114/applyPhraseToImage",
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

app.Run();

record ImagePickerResponse(string ImageUrl);

record PhrasePickerResponse(string Phrase);