import Vapor
import OpenTelemetryApi

func routes(_ app: Application) throws {
    
    let tracer = OpenTelemetry.instance.tracerProvider.get(instrumentationName: "routes", instrumentationVersion: "1.2.3")

    
    app.get { req async in
        "Try /phrase"
    }

    app.get("health") { req async -> String in
        "OK"
    }

    app.get("phrase") { req async throws -> PhraseResult in
       let span = tracer.spanBuilder(spanName: "GET /phrase").startSpan();
       let result = try await PhraseController().getPhrase(req)
        span.end()
        return result
    }
}
