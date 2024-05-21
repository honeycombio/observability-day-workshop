import Vapor
import Logging
import OpenTelemetryApi
import OpenTelemetrySdk
import OpenTelemetryProtocolExporterGrpc
import ResourceExtension

import Foundation
import GRPC
import NIO
import NIOSSL

@main
enum Entrypoint {
    static func main() async throws {
        
        
        let tracer = self.initOtel()
        
        let span = tracer.spanBuilder(spanName: "test span").setSpanKind(spanKind: .client).startSpan()
        span.end();
        
        var env = try Environment.detect()
        try LoggingSystem.bootstrap(from: &env)
        
        let app = try await Application.make(env)
        defer { app.shutdown() }
        
        do {
            try await configure(app)
        } catch {
            app.logger.report(error: error)
            throw error
        }
        try await app.execute()
    }
    
    static func initOtel() -> Tracer {
        let configuration = ClientConnection.Configuration.default(
            target: .hostAndPort("localhost", 4317),
            eventLoopGroup: MultiThreadedEventLoopGroup(numberOfThreads: 1)
        )
        
        let client = ClientConnection(configuration: configuration)
       let otlpTraceExporter = OtlpTraceExporter(channel: client)
      let spanProcessor = SimpleSpanProcessor(spanExporter: otlpTraceExporter)
      let resources = DefaultResources().get()

      let instrumentationScopeName = "DiceServer"
      let instrumentationScopeVersion = "semver:0.1.0"

      OpenTelemetry.registerTracerProvider(tracerProvider:
          TracerProviderBuilder()
              .add(spanProcessor: spanProcessor)
              .with(resource: resources)
              .build()
      )
      let tracer = OpenTelemetry.instance.tracerProvider.get(instrumentationName: instrumentationScopeName, instrumentationVersion: instrumentationScopeVersion) as! TracerSdk

        return tracer;
    }
}
