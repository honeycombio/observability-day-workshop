import Vapor

// Define your model (for demonstration, let's assume it's called `MyModel`)
struct PhraseResult: Content {
    var phrase: String
}

// Your Vapor route handler
func myEndpointHandler(req: Request) throws -> EventLoopFuture<Response> {
    // Create an instance of your model
    let data = PhraseResult(phrase: "Eat it")
    
    // Encode the model to JSON and create a response
    let response = Response(status: .ok, body: try JSONEncoder().encode(data))
    
    // Set the response Content-Type header to application/json
    response.headers.contentType = .json
    
    // Return the response
    return req.eventLoop.future(response)
}
