const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Array of users with famous portraits from Wikimedia Commons
const users = [
  {
    id: "1",
    name: "Lisa Gherardini",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Mona_Lisa-restored.jpg/250px-Mona_Lisa-restored.jpg",
  },
  {
    id: "2",
    name: "Girl with Pearl Earring",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Girl_with_a_Pearl_Earring.jpg/250px-Girl_with_a_Pearl_Earring.jpg",
  },
  {
    id: "3",
    name: "Vincent van Gogh",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg/250px-Vincent_van_Gogh_-_Self-Portrait_-_Google_Art_Project.jpg",
  },
  {
    id: "4",
    name: "Rembrandt",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Rembrandt_Harmensz._van_Rijn_135.jpg/162px-Rembrandt_Harmensz._van_Rijn_135.jpg",
  },
  {
    id: "5",
    name: "Albrecht Dürer",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/40/D%C3%BCrer_Alte_Pinakothek.jpg/142px-D%C3%BCrer_Alte_Pinakothek.jpg",
  },
  {
    id: "6",
    name: "Judith Leyster",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Self-portrait_by_Judith_Leyster.jpg/175px-Self-portrait_by_Judith_Leyster.jpg",
  },
  {
    id: "7",
    name: "Elisabeth Vigée-Lebrun",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Self-portrait_with_Her_Daughter_by_Elisabeth-Louise_Vig%C3%A9e_Le_Brun.jpg/148px-Self-portrait_with_Her_Daughter_by_Elisabeth-Louise_Vig%C3%A9e_Le_Brun.jpg",
  },
  {
    id: "8",
    name: "Artemisia Gentileschi",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Self-portrait_as_the_Allegory_of_Painting_%28La_Pittura%29_-_Artemisia_Gentileschi.jpg/148px-Self-portrait_as_the_Allegory_of_Painting_%28La_Pittura%29_-_Artemisia_Gentileschi.jpg",
  },
  {
    id: "9",
    name: "Nobleman in Blue",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d2/Man_with_Blue_Sleeve_2.jpg/250px-Man_with_Blue_Sleeve_2.jpg",
  },
  {
    id: "10",
    name: "American Gothic Couple",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Grant_DeVolson_Wood_-_American_Gothic.jpg/250px-Grant_DeVolson_Wood_-_American_Gothic.jpg",
  },
  {
    id: "11",
    name: "Pope Innocent X",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PopeInnocentX.jpg/250px-PopeInnocentX.jpg",
  },
  {
    id: "12",
    name: "Madame Récamier",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Jacques-Louis_David_016.jpg/330px-Jacques-Louis_David_016.jpg",
  },
  {
    id: "13",
    name: "Adele Bloch-Bauer",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Gustav_Klimt%2C_1907%2C_Adele_Bloch-Bauer_I%2C_Neue_Galerie_New_York.jpg/250px-Gustav_Klimt%2C_1907%2C_Adele_Bloch-Bauer_I%2C_Neue_Galerie_New_York.jpg",
  },
  {
    id: "14",
    name: "Madame X",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Sargent_MadameX.jpeg/105px-Sargent_MadameX.jpeg",
  },
  {
    id: "15",
    name: "Dr. Gachet",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Portrait_of_Dr._Gachet.jpg/250px-Portrait_of_Dr._Gachet.jpg",
  },
  {
    id: "16",
    name: "Giovanna Tornabuoni",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Ghirlandaio-Giovanna_Tornabuoni_cropped.jpg/120px-Ghirlandaio-Giovanna_Tornabuoni_cropped.jpg",
  },
  {
    id: "17",
    name: "Baldassare Castiglione",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Baldassare_Castiglione%2C_by_Raffaello_Sanzio%2C_from_C2RMF_retouched.jpg/161px-Baldassare_Castiglione%2C_by_Raffaello_Sanzio%2C_from_C2RMF_retouched.jpg",
  },
  {
    id: "18",
    name: "The Laughing Cavalier",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Frans_Hals_%E2%80%93_The_Laughing_Cavalier.jpg/164px-Frans_Hals_%E2%80%93_The_Laughing_Cavalier.jpg",
  },
  {
    id: "19",
    name: "Susanna Fourment",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/Le_Chapeau_de_Paille_by_Peter_Paul_Rubens.jpg/250px-Le_Chapeau_de_Paille_by_Peter_Paul_Rubens.jpg",
  },
  {
    id: "20",
    name: "Charles I of England",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Charles_I_of_England.jpg/153px-Charles_I_of_England.jpg",
  },
  {
    id: "21",
    name: "Doge Leonardo Loredan",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Giovanni_Bellini%2C_portrait_of_Doge_Leonardo_Loredan.jpg/142px-Giovanni_Bellini%2C_portrait_of_Doge_Leonardo_Loredan.jpg",
  },
  {
    id: "22",
    name: "Eleonora di Toledo",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Bronzino_-_Eleonora_di_Toledo_col_figlio_Giovanni_-_Google_Art_Project.jpg/250px-Bronzino_-_Eleonora_di_Toledo_col_figlio_Giovanni_-_Google_Art_Project.jpg",
  },
  {
    id: "23",
    name: "Mary Tudor",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fe/Anthonis_Mor_001.jpg/250px-Anthonis_Mor_001.jpg",
  },
  {
    id: "24",
    name: "Elizabeth I",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Elizabeth_I_%28Armada_Portrait%29.jpg/250px-Elizabeth_I_%28Armada_Portrait%29.jpg",
  },
  {
    id: "25",
    name: "Louis XIV of France",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/5f/Louis_XIV_of_France.jpg/141px-Louis_XIV_of_France.jpg",
  },
  {
    id: "26",
    name: "The Beautiful Strasbourg Woman",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Largilli%C3%A8re_-_Die_sch%C3%B6ne_Stra%C3%9Fburgerin.jpg/250px-Largilli%C3%A8re_-_Die_sch%C3%B6ne_Stra%C3%9Fburgerin.jpg",
  },
  {
    id: "27",
    name: "Lady with the Veil",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Alexander_Roslin_-_The_Lady_with_the_Veil_%28the_Artist%27s_Wife%29_-_Google_Art_Project.jpg/250px-Alexander_Roslin_-_The_Lady_with_the_Veil_%28the_Artist%27s_Wife%29_-_Google_Art_Project.jpg",
  },
  {
    id: "28",
    name: "Blue Boy",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/The_Blue_Boy.jpg/135px-The_Blue_Boy.jpg",
  },
  {
    id: "29",
    name: "Lady Caroline Scott",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Lady_Caroline_Scott_-_Sir_Joshua_Reynolds.png/157px-Lady_Caroline_Scott_-_Sir_Joshua_Reynolds.png",
  },
  {
    id: "30",
    name: "Manuel Osorio Manrique",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Manuel_Osorio_Manrique_de_Zu%C3%B1iga_%281784%E2%80%931792%29_MET_DP287624.jpg/147px-Manuel_Osorio_Manrique_de_Zu%C3%B1iga_%281784%E2%80%931792%29_MET_DP287624.jpg",
  },
  {
    id: "31",
    name: "Pinkie",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Thomas_Lawrence_Pinkie.jpg/250px-Thomas_Lawrence_Pinkie.jpg",
  },
  {
    id: "32",
    name: "George Washington",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Gilbert_Stuart%2C_George_Washington_%28Lansdowne_portrait%2C_1796%29.jpg/124px-Gilbert_Stuart%2C_George_Washington_%28Lansdowne_portrait%2C_1796%29.jpg",
  },
  {
    id: "33",
    name: "Maja Vestida",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Goya_Maja_ubrana2.jpg/300px-Goya_Maja_ubrana2.jpg",
  },
  {
    id: "34",
    name: "Napoleon Bonaparte",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Jacques-Louis_David_-_The_Emperor_Napoleon_in_His_Study_at_the_Tuileries_-_Google_Art_Project.jpg/120px-Jacques-Louis_David_-_The_Emperor_Napoleon_in_His_Study_at_the_Tuileries_-_Google_Art_Project.jpg",
  },
  {
    id: "35",
    name: "Eugène Delacroix",
    avatarUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/F%C3%A9lix_Nadar_1820-1910_portraits_Eug%C3%A8ne_Delacroix_restored.jpg/250px-F%C3%A9lix_Nadar_1820-1910_portraits_Eug%C3%A8ne_Delacroix_restored.jpg",
  },
];

// Database file path
const dbPath = path.join(__dirname, 'users.db');

// Create a new database connection
const db = new sqlite3.Database(dbPath);

// Create the users table and insert data
db.serialize(() => {
  // Drop the table if it exists
  db.run('DROP TABLE IF EXISTS users');
  
  // Create the users table
  db.run(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatarUrl TEXT NOT NULL
    )
  `);
  
  // Prepare the insert statement
  const stmt = db.prepare('INSERT INTO users (id, name, avatarUrl) VALUES (?, ?, ?)');
  
  // Insert each user
  users.forEach(user => {
    stmt.run(user.id, user.name, user.avatarUrl);
  });
  
  // Finalize the statement
  stmt.finalize();
  
  // Verify the data was inserted
  db.all('SELECT COUNT(*) as count FROM users', (err, rows) => {
    if (err) {
      console.error('Error counting users:', err);
    } else {
      console.log(`Inserted ${rows[0].count} users into the database`);
    }
    
    // Close the database connection
    db.close();
  });
});

console.log(`Database initialized at ${dbPath}`);
