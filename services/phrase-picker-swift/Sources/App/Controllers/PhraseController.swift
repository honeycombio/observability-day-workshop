import Vapor

// Define your model (for demonstration, let's assume it's called `MyModel`)
struct PhraseResult: Content {
    var phrase: String
}

// Define a controller
final class PhraseController {
    func getPhrase(_ req: Request) async throws -> PhraseResult {
        let phrase = "Eat it"
        return PhraseResult(phrase: phrase)
    }
}
