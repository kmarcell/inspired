//
//  CheckoutSlider.swift
//  Inspired
//
//  Created by Marcell Kresz on 09/06/2024.
//

import SwiftUI

protocol SliderStyle {
    associatedtype Body: View

    typealias Configuration = SliderStyleConfiguration

    func makeBody(configuration: Self.Configuration) -> Self.Body
}

struct SliderStyleKey: EnvironmentKey {
    static var defaultValue: any SliderStyle = DefaultSliderStyle()
}

extension EnvironmentValues {
    var sliderStyle: any SliderStyle {
        get { self[SliderStyleKey.self] }
        set { self[SliderStyleKey.self] = newValue }
    }
}

extension View {
    func sliderStyle<S: SliderStyle>(_ style: S) -> some View {
        environment(\.sliderStyle, style)
    }
}

struct SliderStyleConfiguration {
    var value: Binding<Double>
}

/// Default style for `SliderStyle`
struct DefaultSliderStyle : SliderStyle {

    /// The range of the valid values. Defaults to 0...1.
    let range: ClosedRange<Double> = 0...1

    func makeBody(configuration: SliderStyleConfiguration) -> some View {
        Slider(value: configuration.value, in: range)
    }
}

struct StylishSlider: View {

    @Environment(\.sliderStyle) var style

    @State var value: Double

    var body: some View {
        AnyView(style
            .makeBody(
                configuration: SliderStyleConfiguration(
                    value: $value
                )
            ))
    }
}

#Preview {
    StylishSlider(value: 0.2)
        .sliderStyle(DefaultSliderStyle())
        .padding()
}

/// Stepper style for `SliderStyle` like a volume slider
struct StepperSliderStyle : SliderStyle {
    /// SwiftUI uses the label for accessibility. For example, VoiceOver uses the label to identify the purpose of the slider.
    var label: String
    /// The range of the valid values. Defaults to 0...100.
    var range: ClosedRange<Double> = 0...100
    /// The distance between each valid value.
    var step: Double = 1
    /// SFSymbol to be used for the plus button
    var plusSymbol = "plus.circle"
    /// SFSymbol to be used for the minus button
    var minusSymbol = "minus.circle"

    func makeBody(configuration: SliderStyleConfiguration) -> some View {
        Slider(
            value: configuration.value,
            in: range,
            step: step
        ) {
            Text(label)
        } minimumValueLabel: {
            Button {
                configuration.value.wrappedValue = max(configuration.value.wrappedValue - step, range.lowerBound)
            } label: {
                Image(systemName: minusSymbol)
            }
            .disabled(configuration.value.wrappedValue == range.lowerBound)
        } maximumValueLabel: {
            Button {
                configuration.value.wrappedValue = min(configuration.value.wrappedValue + step, range.upperBound)
            } label: {
                Image(systemName: plusSymbol)
            }
            .disabled(configuration.value.wrappedValue == range.upperBound)
        }
    }
}

#Preview {
    StylishSlider(value: 0.0)
        .sliderStyle(StepperSliderStyle(label: "Drag to change volume", step: 10.0))
        .padding()
}

struct CheckoutSliderStyleOriginal : SliderStyle {
    /// SwiftUI uses the label for accessibility. For example, VoiceOver uses the label to identify the purpose of the slider.
    var label: String
    /// The range of the valid values. Defaults to 0...1.
    var range: ClosedRange<Double> = 0...1
    /// Called when user swiped all the way to the `upperBound` of the range.
    var onCheckout: () -> ()

    func makeBody(configuration: Configuration) -> some View {
        ZStack {
            Capsule(style: .circular)
                .fill(Color.yellow)
            Text(label)
            Slider(
                value: configuration.value,
                in: range,
                label: { Text(label) },
                onEditingChanged: { isEditing in
                    // Reverting if not swiped till the end
                    if configuration.value.wrappedValue < range.upperBound {
                        configuration.value.wrappedValue = range.lowerBound
                    } else {
                        onCheckout()
                    }
                }
            )
                .tint(.clear)
                .padding()
        }
        .animation(.snappy, value: configuration.value.wrappedValue)
        .frame(width: 324.0, height: 64.0)
    }
}

struct SliderInactiveTrackKey: EnvironmentKey {
    static var defaultValue: Color = Color(white: 0.6, opacity: 0.4)
}

extension EnvironmentValues {
    var inactiveSliderTrackColor: Color {
        get { self[SliderInactiveTrackKey.self] }
        set { self[SliderInactiveTrackKey.self] = newValue }
    }
}

extension View {
    func inactiveSliderTrackColor(_ color: Color) -> some View {
        environment(\.inactiveSliderTrackColor, color)
    }
}

struct BetterSlider: View {
    /// The selected value within bounds.
    @Binding private var value: Double
    /// The range of the valid values. Defaults to 0...100.
    private let range: ClosedRange<Double>
    /// SwiftUI uses the label for accessibility. For example, VoiceOver uses the label to identify the purpose of the slider.
    private let label: Text
    /// A callback for when editing begins and ends.
    private let onEditingChanged: (Bool) -> Void
    /// Radius of the control circle
    private let radius = 16.0

    @Environment(\.inactiveSliderTrackColor) var inactiveSliderTrackColor
    @State private var location: CGPoint
    @State private var viewSize: CGSize = .zero
    @State private var isEditing = false {
        didSet {
            onEditingChanged(isEditing)
        }
    }

    init(value: Binding<Double>,
         in range: ClosedRange<Double>  = 0...1,
         label: () -> Text,
         onEditingChanged: @escaping (Bool) -> Void) {
        self._value = value
        self.range = range
        self.label = label()
        self.onEditingChanged = onEditingChanged
        self.location = CGPoint(x: radius, y: 0)
    }

    var onDrag: some Gesture {
        DragGesture()
            .onChanged { newValue in
                if !isEditing {
                    isEditing = true
                }

                let newX = min(max(radius, newValue.location.x), viewSize.width - radius)
                location = CGPoint(x: newX, y: viewSize.height / 2.0)
                updateValue()
            }
            .onEnded { _ in
                isEditing = false
            }
    }

    func updateLocation(_ value: Double) {
        let maxWidth = viewSize.width - radius * 2.0
        let newX = min(value * maxWidth, maxWidth)
        location = CGPoint(x: radius + newX, y: viewSize.height / 2.0)
    }

    func updateValue() {
        let normalized = range.upperBound - range.lowerBound
        let maxWidth = viewSize.width - radius * 2.0
        let percent = (location.x - radius) / maxWidth
        value = min(range.upperBound, max(range.lowerBound, (percent * normalized))) + range.lowerBound
    }

    var body: some View {
        HStack(spacing: 0) {
            Capsule(style: .circular)
                .foregroundColor(Color.accentColor)
                .frame(width: location.x - radius, height: 4.0)
            Capsule(style: .circular)
                .foregroundColor(inactiveSliderTrackColor)
                .frame(height: 4.0)
        }
        .padding(.horizontal, radius)
        .onGeometryChange(for: CGSize.self) { proxy in
            proxy.size
        } action: { newValue in
            viewSize = newValue
            updateLocation(value)
        }
        .onChange(of: value, { _, newValue in
            if !isEditing {
                updateLocation(newValue)
            }
        })
        .accessibilityLabel(label)
        .overlay {
            Circle()
                .frame(width: radius * 2.0, height: radius * 2.0)
                .foregroundColor(Color.white)
                .shadow(color: Color.init(white: 0.7, opacity: 0.4), radius: 4.0, y: 8)
                .position(location)
                .gesture(onDrag)
        }
    }
}

struct CheckoutSliderStyle : SliderStyle {
    /// SwiftUI uses the label for accessibility. For example, VoiceOver uses the label to identify the purpose of the slider.
    var label: String
    /// The range of the valid values. Defaults to 0...1.
    var range: ClosedRange<Double> = 0...1
    /// Called when user swiped all the way to the `upperBound` of the range.
    var onCheckout: () -> ()

    func makeBody(configuration: Configuration) -> some View {
        ZStack {
            Capsule(style: .circular)
                .fill(Color.yellow)

            Text(label)

            BetterSlider(
                value: configuration.value,
                in: range,
                label: { Text(label) },
                onEditingChanged: { isEditing in
                    guard !isEditing else { return }
                    print("Ended \(configuration.value.wrappedValue) vs \(range.upperBound)")
                    // Reverting if not swiped till the end
                    if configuration.value.wrappedValue < range.upperBound {
                        configuration.value.wrappedValue = range.lowerBound
                    } else {
                        onCheckout()
                    }
                }
            )
            .padding()
            .accentColor(.clear)
            .inactiveSliderTrackColor(.clear)
        }
        .animation(.snappy(extraBounce: 0), value: configuration.value.wrappedValue)
        .frame(width: 324.0, height: 64.0)
    }
}

#Preview {
    @Previewable @State var didCheckout = false

    if didCheckout {
        Text("Thank you for purchasing!")
            .padding()
    } else {
        StylishSlider(value: 0.0)
            .sliderStyle(CheckoutSliderStyle(
                label: "Swipe to buy",
                onCheckout: {
                    didCheckout = true
                }))
            .padding()
    }
}
