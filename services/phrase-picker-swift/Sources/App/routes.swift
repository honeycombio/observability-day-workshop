import Vapor


func routes(_ app: Application) throws {
    app.get { req async in
        "Try /phrase"
    }

    app.get("health") { req async -> String in
        "OK"
    }

    app.get("phrase") { req async throws -> PhraseResult in
       return try await PhraseController().getPhrase(req)
    }
}
