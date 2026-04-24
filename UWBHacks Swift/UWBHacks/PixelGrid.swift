import SwiftUI

// MARK: - Pixel Grid Renderer
// Renders ASCII-art grids as crisp pixel sprites using SwiftUI Canvas.
struct PixelGridView: View {
    let rows: [String]
    let palette: [Character: Color]
    let scale: CGFloat

    private var gridWidth: Int  { rows.first?.count ?? 0 }
    private var gridHeight: Int { rows.count }

    var body: some View {
        Canvas { context, _ in
            for (y, row) in rows.enumerated() {
                for (x, char) in row.enumerated() {
                    guard char != "." && char != " " else { continue }
                    guard let color = palette[char] else { continue }
                    let rect = CGRect(
                        x: CGFloat(x) * scale,
                        y: CGFloat(y) * scale,
                        width: scale,
                        height: scale
                    )
                    context.fill(Path(rect), with: .color(color))
                }
            }
        }
        .frame(
            width:  CGFloat(gridWidth)  * scale,
            height: CGFloat(gridHeight) * scale
        )
    }
}

// MARK: - Blob Pixel Data
let blobThriving: [String] = [
    "........bbbbbb........",
    "......bbWWWWWWbb......",
    ".....bWWWWWWWWWWb.....",
    "....bWWWWWWWWWWWWb....",
    "...bWWWWWWWWWWWWWWb...",
    "..bWWWWWWWWWWWWWWWWb..",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWkkWWWWWWWWkkWWWb.",
    ".bWWkKKkWWWWWWkKKkWWb.",
    ".bWWkKKkWWWWWWkKKkWWb.",
    ".bWWWkkWWccWWccWkkWWb.",
    ".bWWWWWWWWkkkkWWWWWWb.",
    ".bWWWWWWkKKKKKKkWWWWb.",
    ".bWWWWWWWkkkkkWWWWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    "..bWWWWWWWWWWWWWWWWb..",
    "...bWWWWWWWWWWWWWWb...",
    "....bbWWWWWWWWWWbb....",
    "......bbWWWWWWbb......",
    "........bbbbbb........",
]

let blobHealthy: [String] = [
    "........bbbbbb........",
    "......bbWWWWWWbb......",
    ".....bWWWWWWWWWWb.....",
    "....bWWWWWWWWWWWWb....",
    "...bWWWWWWWWWWWWWWb...",
    "..bWWWWWWWWWWWWWWWWb..",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWkkWWWWWWWWkkWWWb.",
    ".bWWWkkWWWWWWWWkkWWWb.",
    ".bWWWWWWWccWWccWWWWWb.",
    ".bWWWWWWWWkkkkWWWWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    "..bWWWWWWWWWWWWWWWWb..",
    "...bWWWWWWWWWWWWWWb...",
    "....bbWWWWWWWWWWbb....",
    "......bbWWWWWWbb......",
    "........bbbbbb........",
]

let blobSick: [String] = [
    "........bbbbbb........",
    "......bbWWWWWWbb......",
    ".....bWWWWWWWWWWb.....",
    "....bWWWWWWWWWWWWb....",
    "...bWWWWWWWWWWWWWWb...",
    "..bWWWWWWWWWWWWWWWWb..",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWkkkWWWWWWkkkWWWb.",
    ".bWWWkkkWWWWWWkkkWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWWWWWWkkkkWWWWWWb.",
    ".bWWWWWWkkWWWWkkWWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    "..bWWWWWWWWWWWWWWWWb..",
    "...bWWWWWWWWWWWWWWb...",
    "....bbWWWWWWWWWWbb....",
    "......bbWWWWWWbb......",
    "........bbbbbb........",
]

let blobCritical: [String] = [
    "........bbbbbb........",
    "......bbWWWWWWbb......",
    ".....bWWWWWWWWWWb.....",
    "....bWWWWWWWWWWWWb....",
    "...bWWWWWWWWWWWWWWb...",
    "..bWWWWWWWWWWWWWWWWb..",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWkkkWWWWWWkkkWWWb.",
    ".bWWWkWkWWWWWWkWkWWWb.",
    ".bWWWkkkWWWWWWkkkWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    ".bWWWWWWkkkkkkWWWWWWb.",
    ".bWWWWWkKWWWWKkWWWWWb.",
    ".bWWWWWWkkkkkkWWWWWWb.",
    ".bWWWWWWWWWWWWWWWWWWb.",
    "..bWWWWWWWWWWWWWWWWb..",
    "...bWWWWWWWWWWWWWWb...",
    "....bbWWWWWWWWWWbb....",
    "......bbWWWWWWbb......",
    "........bbbbbb........",
]

let blobPalettes: [AvatarState: [Character: Color]] = [
    .thriving: [
        "b": Color(hex: "1b4a43"), "W": Color(hex: "8eb2aa"),
        "k": Color(hex: "1D1D1B"), "K": Color(hex: "EAE4DA"), "c": Color(hex: "EAA7C7"),
    ],
    .healthy: [
        "b": Color(hex: "4a5a8a"), "W": Color(hex: "c9cee4"),
        "k": Color(hex: "1D1D1B"), "K": Color(hex: "EAE4DA"), "c": Color(hex: "EAA7C7"),
    ],
    .sick: [
        "b": Color(hex: "a85428"), "W": Color(hex: "f4b494"),
        "k": Color(hex: "1D1D1B"), "K": Color(hex: "EAE4DA"), "c": Color(hex: "EAC119"),
    ],
    .critical: [
        "b": Color(hex: "7a2a2a"), "W": Color(hex: "e79b9a"),
        "k": Color(hex: "1D1D1B"), "K": Color(hex: "d8cfc0"), "c": Color(hex: "9a6a74"),
    ],
]

// MARK: - Island Pixel Data
let islandPalm: [String] = [
    ".................llll...........",
    "..............LLlllLLL..........",
    ".............LLLLllLLLL.........",
    "............LLLLllllLLLL........",
    ".............LLllllllLL.........",
    "..............ttlllLL...........",
    "..............tttt..............",
    ".............ttTt...............",
    ".............tTtt..............f",
    "............ttTtt............fff",
    "...........sstTtttss.........fff",
    "..........ssssttsssssss....fff..",
    ".........sssSssssSsssssss.ff....",
    "........ssssssssssssssssss......",
    ".......ssssSssssssssSssssssss...",
    "......dddssssssssssssssssssddd..",
    ".....dddddssssssssssssssdddddd..",
    "....ddddddddssssssssddddddddd...",
    "....ddddddddddddddddddddddd.....",
    ".....dddddddddddddddddddd.......",
    ".......ddddddddddddddd..........",
    "....AAAAAAAAAAAAAAAAAAAAAAAAA...",
    ".....aaaaaaaaaaaaaaaaaaaaaaaa...",
]

let islandMountain: [String] = [
    "................................",
    ".............MM.................",
    "............MMMM................",
    "...........MMwwMM...............",
    "..........MMwwwwMM..............",
    ".........MMwwwwwwMM.............",
    "........MMwwwwwwwwMM............",
    ".......MMMMMMMMMMMMMM...........",
    "......MMMMMMMMMMMMMMMM..........",
    "....nnMMMMMMMMMMMMMMMMnn........",
    "...nnnnnnnMMMMMMMMnnnnnnn.......",
    "..nnnnnnnnnnnnnnnnnnnnnnnn......",
    ".ssssnnnnnnnnnnnnnnnnnnnnsss....",
    "ssssssssnnnnnnnnnnnnnnssssssss..",
    ".sssssssssssssssssssssssssss....",
    "..ddddsssssssssssssssssddd......",
    "...dddddddddddddddddddddd.......",
    "....ddddddddddddddddddd.........",
    "......dddddddddddddd............",
    "...AAAAAAAAAAAAAAAAAAAAAAAAAA...",
    "....aaaaaaaaaaaaaaaaaaaaaaaaaa..",
]

let islandVolcano: [String] = [
    "................................",
    "..........GGG...................",
    "..........GGG...................",
    ".........rGGGr..................",
    "........rrRRRrr.................",
    ".......rRRRRRRRr................",
    "......rrRRRRRRRrr...............",
    ".....rrRRRRRRRRRRrr.............",
    "....rrRRRRRRRRRRRRrr............",
    "...vvRRRRRRRRRRRRRRvv...........",
    "..vvvvvvvvRRRRRvvvvvvvv.........",
    ".vvvvvvvvvvvvvvvvvvvvvvv........",
    ".sssvvvvvvvvvvvvvvvvssss........",
    "ssssssssvvvvvvvvvvsssssssss.....",
    ".ssssssssssssssssssssssssss.....",
    "..ddddssssssssssssssssddd.......",
    "...ddddddddddddddddddddd........",
    ".....dddddddddddddddd...........",
    "...AAAAAAAAAAAAAAAAAAAAAAAAA....",
    "....aaaaaaaaaaaaaaaaaaaaaaaaa...",
]

let islandBamboo: [String] = [
    ".................lllll..........",
    "................lLLLLLl.........",
    ".................lllll..........",
    "..lll......lll....lll...........",
    ".lLLLl....lLLLl..lLLLl..........",
    "..lll......lll....lll...........",
    "..|||......|||....|||...........",
    "..|||......|||....|||...........",
    "..|++......|++....|++...........",
    "..|||......|||....|||...........",
    "..|||......|||....|||...........",
    "..|++......|++....|++...........",
    "..sssssssssssssssssssss.........",
    ".sssssssssssssssssssssss........",
    ".ssssssssssssssssssssssss.......",
    "..ddddsssssssssssssssddd........",
    "...dddddddddddddddddddd.........",
    "....ddddddddddddddd.............",
    "..AAAAAAAAAAAAAAAAAAAAAAAAA.....",
    "...aaaaaaaaaaaaaaaaaaaaaaaaa....",
]

let islandShrine: [String] = [
    "................................",
    ".............rrrrr..............",
    "............rrRRRrr.............",
    "...........rrrrrrrrr............",
    "...........pppppppp.............",
    "...........pwwwwwwp.............",
    "...........pwPPPPwp.............",
    "...........pppppppp.............",
    "..........rrrrrrrrrr............",
    "..........rrrrrrrrrr............",
    ".........pppppppppppp...........",
    ".........pwwwwPwwwwwp...........",
    ".........pppppppppppp...........",
    "........ssssssssssssss..........",
    ".......sssssssssssssss..........",
    "......ssssssssssssssssss........",
    ".....ddddssssssssssssdddd.......",
    "......dddddddddddddddddd........",
    "........dddddddddddddd..........",
    "....AAAAAAAAAAAAAAAAAAAAAA......",
    ".....aaaaaaaaaaaaaaaaaaaaaaa....",
]

typealias IslandPalette = [Character: Color]

let islandPalettes: [AvatarState: IslandPalette] = [
    .thriving: [
        "s": Color(hex: "EAE4DA"), "S": Color(hex: "f4efe6"), "d": Color(hex: "c8bda6"),
        "L": Color(hex: "3f8577"), "l": Color(hex: "245E55"),
        "t": Color(hex: "5a4a3a"), "T": Color(hex: "2a1f15"), "f": Color(hex: "EAA7C7"),
        "M": Color(hex: "808BC5"), "w": Color(hex: "EAE4DA"), "n": Color(hex: "3f8577"),
        "r": Color(hex: "4a3a2a"), "R": Color(hex: "6a5a42"), "v": Color(hex: "3f8577"),
        "G": Color(hex: "7a6856"),
        "|": Color(hex: "3f8577"), "+": Color(hex: "1b4a43"),
        "p": Color(hex: "C63F3E"), "P": Color(hex: "EAE4DA"),
        "A": Color(hex: "b3e5ed"), "a": Color(hex: "5ab3c0"),
    ],
    .healthy: [
        "s": Color(hex: "EAE4DA"), "S": Color(hex: "f4efe6"), "d": Color(hex: "beb29a"),
        "L": Color(hex: "8eb2aa"), "l": Color(hex: "3f8577"),
        "t": Color(hex: "5a4a3a"), "T": Color(hex: "3a2a18"), "f": Color(hex: "ED773C"),
        "M": Color(hex: "a0a9d0"), "w": Color(hex: "d8deec"), "n": Color(hex: "8eb2aa"),
        "r": Color(hex: "5a4838"), "R": Color(hex: "6a5a42"), "v": Color(hex: "8eb2aa"),
        "G": Color(hex: "9a6030"),
        "|": Color(hex: "8eb2aa"), "+": Color(hex: "3f8577"),
        "p": Color(hex: "C63F3E"), "P": Color(hex: "EAE4DA"),
        "A": Color(hex: "a0d4de"), "a": Color(hex: "4896a2"),
    ],
    .sick: [
        "s": Color(hex: "dcd4c2"), "S": Color(hex: "e6ded0"), "d": Color(hex: "aa9a7e"),
        "L": Color(hex: "b8a68a"), "l": Color(hex: "7a6a4a"),
        "t": Color(hex: "6a5a4a"), "T": Color(hex: "3a2a1a"), "f": Color(hex: "ED773C"),
        "M": Color(hex: "8a90a4"), "w": Color(hex: "b8bcca"), "n": Color(hex: "a8a07a"),
        "r": Color(hex: "5a4a3a"), "R": Color(hex: "6a5a42"), "v": Color(hex: "a8a07a"),
        "G": Color(hex: "cc5518"),
        "|": Color(hex: "a8a07a"), "+": Color(hex: "6a5a3a"),
        "p": Color(hex: "a85234"), "P": Color(hex: "d8c08a"),
        "A": Color(hex: "8cbbc6"), "a": Color(hex: "3d7e8a"),
    ],
    .critical: [
        "s": Color(hex: "a89a7e"), "S": Color(hex: "b8aa8a"), "d": Color(hex: "706248"),
        "L": Color(hex: "7a7258"), "l": Color(hex: "4a4230"),
        "t": Color(hex: "4a3a2a"), "T": Color(hex: "1D1D1B"), "f": Color(hex: "8a4a2a"),
        "M": Color(hex: "6a6a7a"), "w": Color(hex: "8a8a96"), "n": Color(hex: "58604a"),
        "r": Color(hex: "38281a"), "R": Color(hex: "483828"), "v": Color(hex: "58604a"),
        "G": Color(hex: "ff6600"),
        "|": Color(hex: "6a6850"), "+": Color(hex: "38342a"),
        "p": Color(hex: "7a3a3a"), "P": Color(hex: "a89868"),
        "A": Color(hex: "6e9098"), "a": Color(hex: "2e636a"),
    ],
]

let islandRows: [IslandType: [String]] = [
    .walk:   islandPalm,
    .sleep:  islandMountain,
    .screen: islandVolcano,
    .learn:  islandBamboo,
    .quest:  islandShrine,
]
