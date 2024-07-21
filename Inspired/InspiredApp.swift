//
//  InspiredApp.swift
//  Inspired
//
//  Created by Marcell Kresz on 20/03/2024.
//

import SwiftUI
import SwiftData

@main
struct InspiredApp: App {
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            Item.self,
        ])
        let modelConfiguration = ModelConfiguration(schema: schema, isStoredInMemoryOnly: false)

        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()

    var body: some Scene {
        WindowGroup {
            InteractiveMeshGradient(width: 3, height: 3) {[
                .init(color: .red, position: .init(0, 0)), .init(color: .purple, position: .init(0.5, 0)), .init(color: .indigo, position: .init(1, 0)),
                .init(color: .orange, position: .init(0, 0.5)), .init(color: .white, position: .init(0.5, 0.5)), .init(color: .blue, position: .init(1, 0.5)),
                .init(color: .yellow, position: .init(0, 1)), .init(color: .green, position: .init(0.5, 1)), .init(color: .mint, position: .init(1, 1))
            ]}
        }
        .modelContainer(sharedModelContainer)
    }
}
