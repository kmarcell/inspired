//
//  CircularLoaderViewTests.swift
//  InspiredTests
//
//  Created by Marcell Kresz on 19/04/2024.
//

import Foundation
import SwiftUI
import XCTest

struct CircularLoaderView: View {
    struct Configuration {
        var radius: CGFloat
        var strokeWidth: CGFloat
        var strokeColor: Color
        var animationDuration: Double
        var rotationDuration: Double
    }

    var configuration: Configuration

    @State private(set) var startPoint: Angle = .zero
    @State private(set) var endPoint: Angle = .zero
    @State private(set) var rotationEffect: Angle = .zero

    var body: some View {
        Circle()
            .trim(from: startPoint.degrees / 360.0, to: endPoint.degrees / 360.0)
            .stroke(configuration.strokeColor, style: StrokeStyle(lineWidth: configuration.strokeWidth, lineCap: .round))
            .rotationEffect(.degrees(-90))
            .rotationEffect(rotationEffect, anchor: .center)
            .frame(width: configuration.radius / 2.0,
                   height: configuration.radius / 2.0)
            .onAppear {
                withAnimation(.linear(duration: configuration.animationDuration).repeatForever(autoreverses: false)) {
                    startPoint = .degrees(0)
                    endPoint = .degrees(360)
                }
                withAnimation(.linear(duration: configuration.rotationDuration).repeatForever(autoreverses: false)) {
                    rotationEffect = .degrees(360)
                }
            }
    }
}

final class CircularLoaderViewTests: XCTestCase {

    func testCircularLoaderInitialState() {

        let testee = CircularLoaderView(
            configuration: CircularLoaderView.Configuration(radius: 100.0, strokeWidth: 4.0, strokeColor: Color.blue, animationDuration: 2.0, rotationDuration: 4.0)
        )

        XCTAssertEqual(testee.startPoint, Angle(degrees: 0))
        XCTAssertEqual(testee.endPoint, Angle(degrees: 0))
        XCTAssertEqual(testee.rotationEffect, Angle(degrees: 0))
    }
}
