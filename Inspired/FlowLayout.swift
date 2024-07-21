//
//  FlowLayout.swift
//  Inspired
//
//  Created by Marcell Kresz on 07/04/2024.
//

import Foundation
#if canImport(UIKit)
import UIKit
import SwiftUI

class CustomCollectionViewCell: UICollectionViewListCell {
    
    static let reuseIdentifier = "CustomCollectionViewCell"
    
    var image: UIImage? {
        didSet {
            var content = defaultContentConfiguration().updated(for: UICellConfigurationState(traitCollection: traitCollection))
            content.image = image
            content.imageProperties.maximumSize = CGSize(width: 50, height: 50)
            contentConfiguration = content
        }
    }
    
    var title: String? {
        didSet {
            var content = defaultContentConfiguration().updated(for: UICellConfigurationState(traitCollection: traitCollection))
            content.text = title
            contentConfiguration = content
        }
    }
    
    override func updateConfiguration(using state: UICellConfigurationState) {
        var content = defaultContentConfiguration().updated(for: state)
        content.image = image
        content.imageProperties.maximumSize = CGSize(width: 50, height: 50)
        content.text = title
        contentConfiguration = content
    }
}

//class CustomCollectionViewCell: UICollectionViewCell {
//    static let reuseIdentifier = "CustomCollectionViewCell"
//    
//    let imageView = UIImageView()
//    let titleLabel = UILabel()
//    
//    override init(frame: CGRect) {
//        super.init(frame: frame)
//        setupViews()
//    }
//    
//    required init?(coder: NSCoder) {
//        fatalError("init(coder:) has not been implemented")
//    }
//    
//    private func setupViews() {
//        imageView.translatesAutoresizingMaskIntoConstraints = false
//        imageView.contentMode = .scaleAspectFit
//        imageView.image = UIImage(systemName: "photo")
//        
//        titleLabel.translatesAutoresizingMaskIntoConstraints = false
//        titleLabel.textAlignment = .center
//        
//        contentView.addSubview(imageView)
//        contentView.addSubview(titleLabel)
//        
//        NSLayoutConstraint.activate([
//            imageView.topAnchor.constraint(equalTo: contentView.topAnchor),
//            imageView.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
//            imageView.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
//            imageView.heightAnchor.constraint(equalTo: contentView.widthAnchor),
//            
//            titleLabel.topAnchor.constraint(equalTo: imageView.bottomAnchor),
//            titleLabel.leadingAnchor.constraint(equalTo: contentView.leadingAnchor),
//            titleLabel.trailingAnchor.constraint(equalTo: contentView.trailingAnchor),
//            titleLabel.bottomAnchor.constraint(equalTo: contentView.bottomAnchor)
//        ])
//    }
//}

class MosaicLayout: UICollectionViewLayout {
    // Define the number of columns you want in your mosaic layout
    private let numberOfColumns: Int = 2
    private let cellPadding: CGFloat = 6.0 // Adjust as needed

    // Keep track of cell attributes
    private var cellAttributes: [UICollectionViewLayoutAttributes] = []
    
    private var columnHeights: [CGFloat] = []

    override func prepare() {
        super.prepare()

        guard let collectionView = collectionView else { return }

        // Calculate available width for the collection view
        let availableWidth = collectionView.bounds.inset(by: collectionView.layoutMargins).width

        // Calculate cell width based on the number of columns
        let cellWidth = (availableWidth - CGFloat(numberOfColumns - 1) * cellPadding) / CGFloat(numberOfColumns)

        // Initialize the y-coordinate for each column
        columnHeights = Array(repeating: 0.0, count: numberOfColumns)

        // Iterate through each item in the collection view
        for item in 0..<collectionView.numberOfItems(inSection: 0) {
            let indexPath = IndexPath(item: item, section: 0)

            // Calculate cell height (you can customize this based on your data)
            let cellHeight = indexPath.row % 3 == 1 ? 94.0 : 44.0// Your logic to determine cell height

            // Find the shortest column
            let shortestColumnIndex = columnHeights.firstIndex(of: columnHeights.min() ?? 0.0) ?? 0

            // Calculate cell frame
            let x = CGFloat(shortestColumnIndex) * (cellWidth + cellPadding)
            let y = columnHeights[shortestColumnIndex]
            let cellFrame = CGRect(x: x, y: y, width: cellWidth, height: cellHeight)

            // Update column height
            columnHeights[shortestColumnIndex] += cellHeight + cellPadding

            // Create layout attributes for the cell
            let attributes = UICollectionViewLayoutAttributes(forCellWith: indexPath)
            attributes.frame = cellFrame
            cellAttributes.append(attributes)
        }
    }

    override var collectionViewContentSize: CGSize {
        guard let lastColumnHeight = columnHeights.max() else { return .zero }
        return CGSize(width: collectionView?.bounds.width ?? 0.0, height: lastColumnHeight)
    }

    override func layoutAttributesForElements(in rect: CGRect) -> [UICollectionViewLayoutAttributes]? {
        return cellAttributes.filter { $0.frame.intersects(rect) }
    }

    override func layoutAttributesForItem(at indexPath: IndexPath) -> UICollectionViewLayoutAttributes? {
        return cellAttributes[indexPath.item]
    }
}

class CustomCollectionViewController: UICollectionViewController {
    init() {
        let layout = MosaicLayout() // UICollectionViewFlowLayout()
        
//        layout.minimumLineSpacing = 10
//        layout.minimumInteritemSpacing = 10
        super.init(collectionViewLayout: layout)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        collectionView.register(CustomCollectionViewCell.self, forCellWithReuseIdentifier: CustomCollectionViewCell.reuseIdentifier)
        collectionView.backgroundColor = .white
    }
    
    override func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
        return 20 // Replace with your actual data count
    }
    
//    override func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
//        guard let cell = collectionView.dequeueReusableCell(withReuseIdentifier: CustomCollectionViewCell.reuseIdentifier, for: indexPath) as? CustomCollectionViewCell else {
//            fatalError("Unable to dequeue CustomCollectionViewCell")
//        }
//        cell.titleLabel.text = "Title \(indexPath.row)" // Replace with your actual data
//        return cell
//    }
    
    // Usage in CustomCollectionViewController:
    override func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
        guard let cell = collectionView.dequeueReusableCell(withReuseIdentifier: CustomCollectionViewCell.reuseIdentifier, for: indexPath) as? CustomCollectionViewCell else {
            fatalError("Unable to dequeue CustomCollectionViewCell")
        }
        cell.image = UIImage(systemName: "sun.min") // Replace with your actual image
        cell.title = "Title \(indexPath.row)" // Replace with your actual title
        cell.backgroundConfiguration?.backgroundColor = .systemOrange
        return cell
    }
}

extension CustomCollectionViewController: UICollectionViewDelegateFlowLayout {
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        let isDoubleHeight = indexPath.row % 3 == 2
        let width = (collectionView.frame.width - 10) / 2
        let height = isDoubleHeight ? width * 2 + 10 : width
        return CGSize(width: width, height: height)
    }
}

struct CustomCollectionView: UIViewControllerRepresentable {
    func makeUIViewController(context: Context) -> CustomCollectionViewController {
        // Create an instance of CustomCollectionViewController
        return CustomCollectionViewController()
    }
    
    func updateUIViewController(_ uiViewController: CustomCollectionViewController, context: Context) {
        // Update the controller if needed
    }
}

// Usage: Instantiate CustomCollectionViewController and present it in your view hierarchy.
#Preview {
    CustomCollectionView()
        .modelContainer(for: Item.self, inMemory: true)
}

#endif
