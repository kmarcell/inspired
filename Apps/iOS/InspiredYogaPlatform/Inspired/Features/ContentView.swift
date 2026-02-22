//
//  ContentView.swift
//  Inspired
//
//  Created by Marcell Kresz on 20/03/2024.
//

import SwiftUI
import SwiftData

//struct ContentView: View {
//    @Environment(\.modelContext) private var modelContext
//    @Query private var items: [Item]
//
//    var body: some View {
//        NavigationSplitView {
//            List {
//                ForEach(items) { item in
//                    NavigationLink {
//                        Text("Item at \(item.timestamp, format: Date.FormatStyle(date: .numeric, time: .standard))")
//                    } label: {
//                        Text(item.timestamp, format: Date.FormatStyle(date: .numeric, time: .standard))
//                    }
//                }
//                .onDelete(perform: deleteItems)
//            }
//#if os(macOS)
//            .navigationSplitViewColumnWidth(min: 180, ideal: 200)
//#endif
//            .toolbar {
//#if os(iOS)
//                ToolbarItem(placement: .navigationBarTrailing) {
//                    EditButton()
//                }
//#endif
//                ToolbarItem {
//                    Button(action: addItem) {
//                        Label("Add Item", systemImage: "plus")
//                    }
//                }
//            }
//        } detail: {
//            Text("Select an item")
//        }
//    }
//
//    private func addItem() {
//        withAnimation {
//            let newItem = Item(timestamp: Date())
//            modelContext.insert(newItem)
//        }
//    }
//
//    private func deleteItems(offsets: IndexSet) {
//        withAnimation {
//            for index in offsets {
//                modelContext.delete(items[index])
//            }
//        }
//    }
//}

#Preview {
    ContentView()
        .modelContainer(for: Item.self, inMemory: true)
}

import SwiftUI

struct ContentView: View {
    let items: [GridItem] = Array(repeating: .init(.flexible()), count: 2)
    let data = (1...20).map { "Item \($0)" }
    let doubleSizeIndices: Set<Int> = [3, 7, 11] // Indices of items that should be double size

    var body: some View {
        ScrollView {
            LazyVGrid(columns: items, spacing: 20) {
                ForEach(data.indices, id: \.self) { index in
                    if doubleSizeIndices.contains(index) {
                        // Double size cell
                        VStack {
                            Image(systemName: "photo")
                                .resizable()
                                .scaledToFit()
                                .frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
                            Text(data[index])
                        }
                        .frame(height: 200) // Double the height for vertical double size
                        .background(Color.blue)
                        .cornerRadius(8)
                    } else {
                        // Single size cell
                        VStack {
                            Image(systemName: "photo")
                                .resizable()
                                .scaledToFit()
                                .frame(minWidth: 0, maxWidth: .infinity, minHeight: 0, maxHeight: .infinity)
                            Text(data[index])
                        }
                        .frame(height: 100)
                        .background(Color.green)
                        .cornerRadius(8)
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
