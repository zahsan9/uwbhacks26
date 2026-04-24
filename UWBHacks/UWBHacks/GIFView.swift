import SwiftUI
import UIKit
import ImageIO

// Decodes and plays an animated GIF from the app bundle using UIImageView.
struct GIFView: UIViewRepresentable {
    let filename: String

    func makeUIView(context: Context) -> UIImageView {
        let view = UIImageView()
        view.contentMode = .scaleAspectFit
        view.clipsToBounds = true
        if let image = loadGIF(named: filename) {
            view.image = image
        }
        return view
    }

    func updateUIView(_ uiView: UIImageView, context: Context) {}

    private func loadGIF(named name: String) -> UIImage? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "gif"),
              let data = try? Data(contentsOf: url),
              let source = CGImageSourceCreateWithData(data as CFData, nil) else { return nil }

        let count = CGImageSourceGetCount(source)
        var images: [UIImage] = []
        var totalDuration: Double = 0

        for i in 0..<count {
            guard let cgImage = CGImageSourceCreateImageAtIndex(source, i, nil) else { continue }
            images.append(UIImage(cgImage: cgImage))
            let props = CGImageSourceCopyPropertiesAtIndex(source, i, nil) as? [String: Any]
            let gifProps = props?[kCGImagePropertyGIFDictionary as String] as? [String: Any]
            let delay = (gifProps?[kCGImagePropertyGIFUnclampedDelayTime as String] as? Double)
                     ?? (gifProps?[kCGImagePropertyGIFDelayTime as String] as? Double)
                     ?? 0.1
            totalDuration += delay
        }

        guard !images.isEmpty else { return nil }
        return UIImage.animatedImage(with: images, duration: totalDuration)
    }
}
