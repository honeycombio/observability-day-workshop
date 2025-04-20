namespace phrase_picker_dotnet.Models;

/// <summary>
/// Represents a phrase in the database
/// </summary>
public class Phrase
{
    /// <summary>
    /// The unique identifier for the phrase
    /// </summary>
    public int Id { get; set; }
    
    /// <summary>
    /// The text content of the phrase
    /// </summary>
    public string Text { get; set; } = string.Empty;
}
