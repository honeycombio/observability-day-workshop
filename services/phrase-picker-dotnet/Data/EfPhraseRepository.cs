using System.Diagnostics;
using Microsoft.EntityFrameworkCore;
using phrase_picker_dotnet.Models;

namespace phrase_picker_dotnet.Data;

/// <summary>
/// Entity Framework implementation of IPhraseRepository
/// </summary>
public class EfPhraseRepository : IPhraseRepository
{
    private readonly PhraseDbContext _context;
    private readonly string _dbPath;
    private readonly Random _random = new Random();

    /// <summary>
    /// Initializes a new instance of the EfPhraseRepository class
    /// </summary>
    /// <param name="context">The database context</param>
    /// <param name="dbPath">The path to the database file</param>
    public EfPhraseRepository(PhraseDbContext context, string dbPath)
    {
        _context = context;
        _dbPath = dbPath;
    }

    /// <summary>
    /// Gets a random phrase from the repository
    /// </summary>
    /// <returns>A random phrase, or null if no phrases are available</returns>
    public async Task<Phrase?> GetRandomPhraseAsync()
    {
        var activity = Activity.Current;
        
        try
        {
            // Get the count of phrases
            var count = await GetPhraseCountAsync();
            
            if (count == 0)
            {
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
            
            // Generate a random ID between 1 and count
            var randomId = _random.Next(1, count + 1);
            
            if (activity != null)
            {
                activity.SetTag("app.random_phrase_id", randomId);
                activity.SetTag("app.phrase_count", count);
            }
            
            // Get the phrase with the random ID
            var phrase = await _context.Phrases.FindAsync(randomId);
            
            if (phrase == null)
            {
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
                activity.SetTag("app.phrase", phrase.Text);
            }
            
            return phrase;
        }
        catch (Exception ex)
        {
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
            
            return null;
        }
    }

    /// <summary>
    /// Gets the total count of phrases in the repository
    /// </summary>
    /// <returns>The number of phrases</returns>
    public async Task<int> GetPhraseCountAsync()
    {
        return await _context.Phrases.CountAsync();
    }

    /// <summary>
    /// Checks if the database exists and is accessible
    /// </summary>
    /// <returns>True if the database exists and is accessible, otherwise false</returns>
    public bool DatabaseExists()
    {
        var activity = Activity.Current;
        
        if (activity != null)
        {
            activity.SetTag("app.db_path", _dbPath);
            activity.SetTag("app.db_exists", File.Exists(_dbPath));
        }
        
        return File.Exists(_dbPath);
    }
}
