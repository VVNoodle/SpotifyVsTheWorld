//
//  ListenerCountTextView.swift
//  SpotifyVsTheWorld
//
//  Created by Egan Bisma on 12/9/20.
//  Copyright © 2020 KM. All rights reserved.
//

import Cocoa

class ListenerCountTextView: NSView {
    private var point = NSPoint(x: 3, y: 3)
    
    /// Text to scroll
    open var text: NSString?
    
    open var textColor: NSColor = .black
    
    /// Font for scrolling text
    open var font: NSFont?
    
    private(set) var stringSize = NSSize(width: 0, height: 0) {
        didSet {
            point.x = 0
        }
    }
    
    
    /**
     Sets up the scrolling text view
    - Parameters:
    - string: The string that will be used as the text in the view
    */
   open func setup(string: String) {
        text = string as NSString
        stringSize = text?.size(withAttributes: textFontAttributes) ?? NSSize(width: 0, height: 0)
        setFrameSize(NSSize.init(width: stringSize.width, height: stringSize.height))
   }

    private lazy var textFontAttributes: [NSAttributedString.Key: Any] = {
        return [
            NSAttributedString.Key.font: font ?? NSFont.systemFont(ofSize: 14),
            NSAttributedString.Key.backgroundColor: (.yellow as NSColor)
        ]
    }()
//
    override open func draw(_ dirtyRect: NSRect) {
        textFontAttributes[NSAttributedString.Key.foregroundColor] = textColor
        (NSString.init(string: text ?? "")).draw(at: NSPoint.init(x: point.x, y: point.y), withAttributes: textFontAttributes)
    }
}
