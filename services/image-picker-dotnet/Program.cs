using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var images = new [] {
    "Angrybird.JPG",
    "Arco&Tub.png",
    "IMG_9343.jpg",
    "heatmap.png",
    "angry-lemon-ufo.JPG",
    "austintiara4.png",
    "baby-geese.jpg",
    "bbq.jpg",
    "beach.JPG",
    "bunny-mask.jpg",
    "busted-light.jpg",
    "cat-glowing-eyes.JPG",
    "cat-on-leash.JPG",
    "cat-with-bowtie.heic",
    "cat.jpg",
    "clementine.png",
    "cow-peeking.jpg",
    "different-animals-01.png",
    "dratini.png",
    "everything-is-an-experiment.png",
    "experiment.png",
    "fine-food.jpg",
    "flower.jpg",
    "frenwho.png",
    "genshin-spa.jpg",
    "grass-and-desert-guy.png",
    "honeycomb-dogfood-logo.png",
    "horse-maybe.png",
    "is-this-emeri.png",
    "jean-and-statue.png",
    "jessitron.png",
    "keys-drying.jpg",
    "lime-on-soap-dispenser.jpg",
    "loki-closeup.jpg",
    "lynia.png",
    "ninguang-at-work.png",
    "paul-r-allen.png",
    "please.png",
    "roswell-nose.jpg",
    "roswell.JPG",
    "salt-packets-in-jar.jpg",
    "scarred-character.png",
    "square-leaf-with-nuts.jpg",
    "stu.jpeg",
    "sweating-it.png",
    "tanuki.png",
    "tennessee-sunset.JPG",
    "this-is-fine-trash.jpg",
    "three-pillars-2.png",
    "trash-flat.jpg",
    "walrus-painting.jpg",
    "windigo.png",
    "yellow-lines.JPG"
};

var bucketname = "random-pictures";
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

app.MapGet("/imageUrl", () => {
    return new {
        imageUrl = $"https://{bucketname}.s3.amazonaws.com/{images[Random.Shared.Next(images.Length)]}"
    };
});

app.Run();
