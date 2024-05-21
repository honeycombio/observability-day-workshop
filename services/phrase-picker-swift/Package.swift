// swift-tools-version:5.10
import PackageDescription

let package = Package(
    name: "phrase-picker",
    platforms: [
       .macOS(.v13)
    ],
    dependencies: [
        // 💧 A server-side Swift web framework.
        .package(url: "https://github.com/vapor/vapor.git", from: "4.92.4"),
        .package(url: "https://github.com/open-telemetry/opentelemetry-swift", from: "1.0.0"),
    ],
    targets: [
        .executableTarget(
            name: "App",
            dependencies: [
                .product(name: "Vapor", package: "vapor"),
                .product(name: "OpenTelemetryApi", package: "opentelemetry-swift"),
                 .product(name: "OpenTelemetrySdk", package: "opentelemetry-swift"),
                 .product(name: "OpenTelemetryProtocolExporter", package: "opentelemetry-swift"),
                 .product(name: "ResourceExtension", package: "opentelemetry-swift"),
                        
            ],
            swiftSettings: swiftSettings
        ),
        .testTarget(
            name: "AppTests",
            dependencies: [
                .target(name: "App"),
                .product(name: "XCTVapor", package: "vapor"),
            ],
            swiftSettings: swiftSettings
        )
    ]
)

var swiftSettings: [SwiftSetting] { [
    .enableUpcomingFeature("DisableOutwardActorInference"),
    .enableExperimentalFeature("StrictConcurrency"),
] }
