using phrase_picker_dotnet.Models;

namespace phrase_picker_dotnet.Data;

/// <summary>
/// Interface for accessing phrases
/// </summary>
public interface IPhraseRepository
{
    /// <summary>
    /// Gets a random phrase from the repository
    /// </summary>
    /// <returns>A random phrase, or null if no phrases are available</returns>
    Task<Phrase?> GetRandomPhraseAsync();
    
    /// <summary>
    /// Gets the total count of phrases in the repository
    /// </summary>
    /// <returns>The number of phrases</returns>
    Task<int> GetPhraseCountAsync();
    
    /// <summary>
    /// Checks if the database exists and is accessible
    /// </summary>
    /// <returns>True if the database exists and is accessible, otherwise false</returns>
    bool DatabaseExists();
}
