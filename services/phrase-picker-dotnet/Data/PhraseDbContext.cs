using Microsoft.EntityFrameworkCore;
using phrase_picker_dotnet.Models;

namespace phrase_picker_dotnet.Data;

/// <summary>
/// Database context for phrases
/// </summary>
public class PhraseDbContext : DbContext
{
    /// <summary>
    /// Initializes a new instance of the PhraseDbContext class
    /// </summary>
    /// <param name="options">The options to be used by the DbContext</param>
    public PhraseDbContext(DbContextOptions<PhraseDbContext> options) : base(options)
    {
    }

    /// <summary>
    /// Gets or sets the phrases in the database
    /// </summary>
    public DbSet<Phrase> Phrases { get; set; } = null!;

    /// <summary>
    /// Configures the model that was discovered by convention from the entity types
    /// </summary>
    /// <param name="modelBuilder">The builder being used to construct the model for this context</param>
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Configure the Phrase entity
        modelBuilder.Entity<Phrase>(entity =>
        {
            entity.ToTable("phrases");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Text).HasColumnName("text").IsRequired();
        });
    }
}
