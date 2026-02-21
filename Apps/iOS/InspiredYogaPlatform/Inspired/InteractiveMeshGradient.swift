//
//  InteractiveMeshGradient.swift
//  Inspired
//
//  Created by Marcell Kresz on 29/06/2024.
//

import SwiftUI

struct InteractiveMeshGradient: View {

    final class Node: ObservableObject {

        @Published var color: Color
        @Published var position: SIMD2<Float>

        init(color: Color, position: SIMD2<Float>) {
            self.color = color
            self.position = position
        }
    }

    final class Control: Identifiable, ObservableObject  {

        let id = UUID()

        let node: Node
        @Published var location: CGPoint = .zero

        init(node: Node, location: CGPoint) {
            self.node = node
            self.location = location
        }
    }

    final class ViewModel: ObservableObject {

        var width: Int
        var height: Int
        @Published var controls: [[Control]]

        init(width: Int, height: Int, nodes: [[Node]]) {
            self.width = width
            self.height = height
            self.controls = nodes.map({
                $0.map { node in
                    Control(node: node, location: .zero)
                }
            })
        }
    }

    @Namespace private var animation

    @StateObject var viewModel: ViewModel
    @State private var viewSize: CGSize = .zero
    @State private var showControls = true
    @State private var isEditing = false

    private let controlSize = CGSize(width: 24, height: 24)

    init(width: Int, height: Int, nodes: () -> [[Node]]) {
        let nodes = nodes()
        self._viewModel = .init(wrappedValue: ViewModel(
            width: width,
            height: height,
            nodes: nodes
        ))
    }

    var body: some View {
        NavigationStack {
            content
                .padding()
                .toolbar {
                    ToolbarItem(placement: .topBarLeading) {
                        Button {
                            withAnimation {
                                showControls.toggle()
                            }
                        } label: {
                            Image(systemName: showControls ? "eye.slash" : "eye")
                                .font(.body)
                        }
                        .buttonStyle(BorderedButtonStyle())
                        .contentTransition(.symbolEffect(.replace))
                        .frame(height: 44.0)
                    }

                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            withAnimation {
                                isEditing.toggle()
                            }
                        } label: {
                            Text(isEditing ? "Done" : "Edit")
                        }
                        .buttonStyle(BorderedButtonStyle())
                        .contentTransition(.symbolEffect(.replace))
                        .frame(height: 44.0)
                    }
                }
        }
    }

    var content: some View {
        EditMeshControls(isEditing: $isEditing) {
                ZStack {
                    Rectangle()
                        .strokeBorder(style: StrokeStyle(lineWidth: 1.0, dash: [10.0, 10.0]))
                        .opacity(showControls ? 1 : 0)
                    mesh
                    controls
                        .opacity(showControls ? 1 : 0)
                }
                .onGeometryChange(for: CGSize.self) { proxy in
                    proxy.size
                } action: { newValue in
                    viewSize = newValue
                    updateLocations()
                }
        } add: { edge in
            switch edge {
            case .top:
                addRowAbove()
            case .leading:
                addRowBefore()
            case .bottom:
                addRowBelow()
            case .trailing:
                addRowAfter()
            }
        } remove: { edge in

        }
    }

    var mesh: some View {
        let controls = viewModel.controls.flatMap({ $0 })
        return MeshGradient(
            width: viewModel.width,
            height: viewModel.height,
            points: controls.map { $0.node.position },
            colors: controls.map { $0.node.color }
        )
    }

    var controls: some View {
        GeometryReader { proxy in
            ForEach($viewModel.controls.flatMap({ $0 })) { $control in
                DragControl(location: $control.location, node: control.node, coordinateSpaceSize: viewSize)
                    .frame(width: controlSize.width, height: controlSize.height)
            }
        }
    }

    func updateLocations() {
        for control in viewModel.controls.flatMap({ $0 }) {
            control.location = CGPoint(position: control.node.position, size: viewSize)
        }
    }

    func addRowAbove() {
        let new = viewModel.controls[0].map {
            Control(node: Node(color: $0.node.color, position: .init(x: $0.node.position.x, y: 0)), location: .zero)
        }

        viewModel.height += 1
        viewModel.controls.insert(new, at: 0)

        viewModel.controls.enumerated().forEach { row, controls in
            for control in controls {
                control.node.position.y = Float(row) / Float(viewModel.height - 1)
            }
        }

        updateLocations()
    }

    func addRowBelow() {

    }

    func addRowBefore() {

    }

    func addRowAfter() {

    }
}

extension InteractiveMeshGradient {

    struct EditMeshControls<Content: View>: View {

        @Binding var isEditing: Bool
        
        let content: Content
        let add: (Edge) -> Void
        let remove: (Edge) -> Void

        init(isEditing: Binding<Bool>,
             @ViewBuilder content: () -> Content,
             add: @escaping (Edge) -> Void,
             remove: @escaping (Edge) -> Void) {
            self._isEditing = isEditing
            self.content = content()
            self.add = add
            self.remove = remove
        }

        var body: some View {
            HStack {
                if isEditing {
                    addButton { add(.leading) }
                }

                VStack {
                    if isEditing {
                        addButton { add(.top) }
                    }

                    content

                    if isEditing {
                        addButton { add(.bottom) }
                    }
                }
                .padding()

                if isEditing {
                    addButton { add(.trailing) }
                }
            }
        }

        func addButton(_ action: @escaping () -> Void) -> some View {
            Button {
                action()
            } label: {
                Text("+")
            }
            .buttonStyle(BorderedProminentButtonStyle())
            .foregroundColor(Color(white: 0.3))
            .tint(Color(white: 0.8))
            .padding(.vertical)
        }
    }
}

extension InteractiveMeshGradient {

    struct DragControl: View {

        @Binding var location: CGPoint

        let node: Node
        let coordinateSpaceSize: CGSize


        var body: some View {
            Circle()
                .fill(node.color)
                .strokeBorder(.white, style: StrokeStyle(lineWidth: 2.0))
                .shadow(color: Color.init(white: 0.3, opacity: 0.5), radius: 8.0)
                .position(location)
                .gesture(onDrag(node: node))
        }

        private func onDrag(node: Node) -> some Gesture {
            DragGesture()
                .onChanged { info in
                    // Restricting drag to go out of the View
                    let newLocation = CGPoint(x: min(coordinateSpaceSize.width, max(0, info.location.x)),
                                              y: min(coordinateSpaceSize.height, max(0, info.location.y)))
                    node.position = SIMD2(Float(newLocation.x / coordinateSpaceSize.width),
                                          Float(newLocation.y / coordinateSpaceSize.height))
                    location = newLocation
                }
        }
    }
}

extension CGPoint {
    init(position: SIMD2<Float>, size: CGSize) {
        self.init(x: CGFloat(position.x) * size.width, y: CGFloat(position.y) * size.height)
    }
}

#Preview {
    InteractiveMeshGradient(width: 3, height: 3) {[
        [.init(color: .red, position: .init(0, 0)), .init(color: .purple, position: .init(0.5, 0)), .init(color: .indigo, position: .init(1, 0))],
        [.init(color: .orange, position: .init(0, 0.5)), .init(color: .white, position: .init(0.5, 0.5)), .init(color: .blue, position: .init(1, 0.5))],
        [.init(color: .yellow, position: .init(0, 1)), .init(color: .green, position: .init(0.5, 1)), .init(color: .mint, position: .init(1, 1))]
    ]}
}
