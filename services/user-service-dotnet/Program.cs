using System;
using System.Data;
using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using System.Diagnostics;
using System.Text.Json;
using Microsoft.Data.Sqlite;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Configure OpenTelemetry
var serviceName = Environment.GetEnvironmentVariable("OTEL_SERVICE_NAME") ?? "user-service-dotnet";
var serviceVersion = "1.0.0";

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource
        .AddService(serviceName, serviceVersion))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddOtlpExporter());

// Get port from environment variable or use default
var port = Environment.GetEnvironmentVariable("PORT") ?? "3000";
builder.WebHost.UseUrls($"http://*:{port}");

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Health check endpoint
app.MapGet("/health", () =>
{
    return Results.Json(new { message = "User service is healthy", status_code = 0 });
});

// Get current user endpoint
app.MapGet("/current-user", async (HttpContext context) =>
{
    var activity = Activity.Current;

    try
    {
        var user = GetRandomUser();

        if (user == null)
        {
            if (activity != null)
            {
                activity.SetTag("error", true);
                activity.SetTag("error.message", "Failed to retrieve user data");
                activity.AddEvent(new ActivityEvent("api.error",
                    tags: new ActivityTagsCollection
                    {
                        { "error.message", "Failed to retrieve user data" },
                        { "http.status_code", 500 },
                        { "service.name", "user-service-dotnet" }
                    }));
            }

            return Results.Json(new { error = "Failed to retrieve user data" }, statusCode: 500);
        }

        if (activity != null)
        {
            activity.SetTag("user.id", user.Id);
            activity.SetTag("user.name", user.Name);
            activity.AddEvent(new ActivityEvent("user.retrieved",
                tags: new ActivityTagsCollection
                {
                    { "user.id", user.Id },
                    { "user.name", user.Name }
                }));
        }

        return Results.Json(user);
    }
    catch (Exception ex)
    {
        if (activity != null)
        {
            activity.SetTag("error", true);
            activity.SetTag("error.message", ex.Message);
            activity.AddEvent(new ActivityEvent("api.exception",
                tags: new ActivityTagsCollection
                {
                    { "error.message", ex.Message },
                    { "error.type", ex.GetType().Name },
                    { "http.status_code", 500 },
                    { "service.name", "user-service-dotnet" }
                }));
        }

        return Results.Json(new { error = "Internal server error" }, statusCode: 500);
    }
});

app.Run();

// Helper function to get a random user from the database
User? GetRandomUser()
{
    var activity = Activity.Current;

    // Determine the database path
    string dbPath = "/app/shared-data/users.db";

    // Try alternative paths if the default doesn't exist
    if (!File.Exists(dbPath))
    {
        // Try relative path from current directory
        string relativePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "../shared-data/users.db");
        if (File.Exists(relativePath))
        {
            dbPath = relativePath;
        }
        else
        {
            // Try another common location
            string altPath = Path.Combine(Directory.GetCurrentDirectory(), "shared-data/users.db");
            if (File.Exists(altPath))
            {
                dbPath = altPath;
            }
        }
    }

    // Log the database path for debugging
    Console.WriteLine($"Using database path: {dbPath}");
    Console.WriteLine($"Database exists: {File.Exists(dbPath)}");

    // Create connection string with read-only mode
    string connectionString = $"Data Source={dbPath};Mode=ReadOnly;";

    try
    {
        Console.WriteLine($"Opening connection with: {connectionString}");
        using (var connection = new SqliteConnection(connectionString))
        {
            connection.Open();
            Console.WriteLine("Connection opened successfully");

            // Count the total number of users
            using (var countCommand = connection.CreateCommand())
            {
                countCommand.CommandText = "SELECT COUNT(*) as count FROM users";
                Console.WriteLine("Executing count query");
                var count = Convert.ToInt32(countCommand.ExecuteScalar());
                Console.WriteLine($"Found {count} users in database");

                if (count == 0)
                {
                    Console.WriteLine("No users found in database");
                    if (activity != null)
                    {
                        activity.AddEvent(new ActivityEvent("database.query.error",
                            tags: new ActivityTagsCollection
                            {
                                { "error.message", "No users found in database" }
                            }));
                    }
                    return null;
                }

                // Get a random user from the database
                var randomId = new Random().Next(1, count + 1).ToString();
                Console.WriteLine($"Selected random user ID: {randomId}");

                using (var userCommand = connection.CreateCommand())
                {
                    userCommand.CommandText = "SELECT * FROM users WHERE id = @id";
                    userCommand.Parameters.AddWithValue("@id", randomId);
                    Console.WriteLine("Executing user query");

                    using (var reader = userCommand.ExecuteReader())
                    {
                        if (reader.Read())
                        {
                            Console.WriteLine("User found, creating user object");
                            var user = new User
                            {
                                Id = reader["id"].ToString(),
                                Name = reader["name"].ToString(),
                                AvatarUrl = reader["avatarUrl"].ToString()
                            };
                            Console.WriteLine($"Returning user: {user.Id}, {user.Name}");
                            return user;
                        }
                        else
                        {
                            Console.WriteLine($"User with ID {randomId} not found");
                            if (activity != null)
                            {
                                activity.AddEvent(new ActivityEvent("database.query.error",
                                    tags: new ActivityTagsCollection
                                    {
                                        { "error.message", $"User with ID {randomId} not found" },
                                        { "user.id", randomId }
                                    }));
                            }
                            return null;
                        }
                    }
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
        }
        return null;
    }
}

// User model
public class User
{
    public string Id { get; set; }
    public string Name { get; set; }
    public string AvatarUrl { get; set; }
}
