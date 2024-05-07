using System.Drawing;
using Microsoft.AspNetCore.Mvc;
using SkiaSharp;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpClient();

var app = builder.Build();

app.MapPost("/applyPhraseToImage", async (
    [FromServices]HttpClient client, 
    [FromBody]ApplyPhraseRequest request) => {

    var imageDownload = await client.GetAsync(request.ImageUrl);

    var image = SKBitmap.Decode(imageDownload.Content.ReadAsStream());

    using SKCanvas canvas = new(image);

    using SKPaint paint = new()
    {
        Color = SKColors.White,
        IsAntialias = true,
        TextSize = 200,
        IsStroke = false,
        TextAlign = SKTextAlign.Center
    };

    var font = new SKFont(SKTypeface.FromFile(Path.Combine("Angkor", "Angkor-Regular.ttf")), 200);

    canvas.DrawText(request.InputPhrase, image.Width / 2, 150, font, paint);

    using (var ms = new MemoryStream())
    {
        image.Encode(ms, SKEncodedImageFormat.Png, quality: 100);
        ms.Seek(0, SeekOrigin.Begin);

        var bytes = ms.ToArray();

        return Results.File(bytes, "image/png");
    }
});

app.Run();

record ApplyPhraseRequest(string InputPhrase, string ImageUrl);
