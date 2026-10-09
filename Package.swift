// swift-tools-version: 6.2
// Solo para compilar y testear la lógica pura (GymApp/Core) fuera de Xcode: `swift test`.
// La app se abre con GymApp.xcodeproj.
import PackageDescription

let package = Package(
    name: "GymCore",
    platforms: [.macOS(.v14), .iOS(.v17)],
    products: [
        .library(name: "GymCore", targets: ["GymCore"]),
    ],
    targets: [
        .target(name: "GymCore", path: "GymApp/Core"),
        .testTarget(name: "GymCoreTests", dependencies: ["GymCore"], path: "Tests/GymCoreTests"),
    ]
)
