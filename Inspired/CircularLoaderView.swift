//
//  CircularLoaderView.swift
//  Inspired
//
//  Created by Marcell Kresz on 19/04/2024.
//

import SwiftUI

struct CircularLoaderView: View {
    struct Configuration {
        var radius: CGFloat
        var strokeWidth: CGFloat
        var strokeColor: Color
        var animationDuration: Double
        var rotationDuration: Double
    }

    var configuration: Configuration

    @State private(set) var points: AnimatablePair<Double, Double> = AnimatablePair(0, 0)
    @State private(set) var rotationEffect: Angle = .zero // Added rotation effect

    var body: some View {
        Circle()
            .trim(from: points.first, to: points.second)
            .stroke(configuration.strokeColor, style: StrokeStyle(lineWidth: configuration.strokeWidth, lineCap: .round))
            .rotationEffect(.degrees(-90))
            .rotationEffect(rotationEffect, anchor: .center) // Added rotation effect
            .frame(width: configuration.radius / 2.0,
                   height: configuration.radius / 2.0)
            .onReceive(Timer.publish(every: configuration.animationDuration, on: .main, in: .common).autoconnect()) { _ in

                switch (points.first, points.second) {
                case (0.0, 0.0):
                    animatePoints(AnimatablePair(0.0, 1.0))
                case (1.0, 1.0):
                    points = AnimatablePair(0.0, 0.0)
                    animatePoints(AnimatablePair(0.0, 1.0))
                case (_, _):
                    animatePoints(AnimatablePair(1.0, 1.0))
                }
            }
            .onAppear {
                withAnimation(.linear(duration: configuration.rotationDuration).repeatForever(autoreverses: false)) {
                    rotationEffect = .degrees(360)
                }
            }
    }

    func animatePoints(_ newValues: AnimatablePair<Double, Double>,
                       curve: (_ duration: TimeInterval) -> Animation = Animation.easeOut(duration: )) {
        withAnimation(curve(configuration.animationDuration)) {
            points = newValues
        }
    }
}

//withAnimation(.linear(duration: configuration.animationDuration).repeatForever(autoreverses: false)).phaseAnimator(phases: [0.0, 1.0]) { phase in
//    startPoint = .degrees(0 + (360 * phase))
//    endPoint = .degrees(360 + (360 * phase))
//}

//                withAnimation(.keyframedAnimation(
//                    Animation.linear(duration: configuration.animationDuration),
//                    values: [
//                        .init(strokeStart: 0, strokeEnd: 1),
//                        .init(strokeStart: 1, strokeEnd: 0)
//                    ],
//                    keyTimes: [0, 1],
//                    timingFunctions: [.linear, .linear]
//                )) {
//                    startPoint = .degrees(0)
//                    endPoint = .degrees(360)
//                }

//                withAnimation(.keyframes(duration: configuration.animationDuration, repeatCount: .max)) {
//                    Animation
//                        .linear(duration: configuration.animationDuration)
//                        .keyframeAnimation(
//                            values: [
//                                .init(strokeStart: 0, strokeEnd: 1),
//                                .init(strokeStart: 1, strokeEnd: 0)
//                            ],
//                            keyTimes: [0, 1],
//                            timingFunctions: [.linear, .linear]
//                        )
//                }

#Preview {
    HStack {
        CircularLoaderView(configuration: .init(radius: 100.0, strokeWidth: 8.0, strokeColor: Color.accentColor, animationDuration: 1.0, rotationDuration: 2.0))
    }
}
