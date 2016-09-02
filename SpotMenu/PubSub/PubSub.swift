//
//  PubSub.swift
//  SpotifyVsTheWorld
//
//  Created by Egan Bisma on 12/6/20.
//  Copyright © 2020 KM. All rights reserved.

import Starscream

public protocol PubSubDelegate: class {
    func updateListenerCount(notification: NSNotification) -> Void
}

@objc protocol PubSubProtocol {
    @objc optional func validateCurrentArtist () -> String
}

final class PubSub: PubSubProtocol,WebSocketDelegate {
    private var host: String {
        let dictionary = ProcessInfo.processInfo.environment
        return "wss://\(dictionary["PUBSUB_URL"] ?? "oops" )"
    }
    var currentArtist: String = ""
    private var artistTooEarly: (String, TimeInterval) = ("", 0)
    public weak var delegate: PubSubDelegate!
    private var isArtistTransition: Bool = false
    private var isDisconnected: Bool = false
    private var idleTimer : Timer?
    private var pubSubUrl = ProcessInfo.processInfo.environment["PUBSUB_URL"]
    private let countNotification = Notification.Name(rawValue: "PubSub")
    private let pubSubDisconnectNotification = Notification.Name(rawValue: "PubSubDisconnect")
    public var isPlaying: Bool = false
    private let pubSubPlaybackNotification = Notification.Name(rawValue: "PubSubIsPlaying")
    private let pubSubArtistChangeNotification = Notification.Name(rawValue: "PubSubArtistChange")
    private var socket: WebSocket?
    private var isWebsocketConnecting: Bool = false;
    
    // duration user can be idle (in minutes)
    private let IDLE_TIME: Double = 8.0
    
    let queue = DispatchQueue(label: "PubSub", qos: .background)
    
    var task: DispatchWorkItem?
    
    func didReceive(event: WebSocketEvent, client: WebSocket) {
       switch event {
           case .connected(_):
               isDisconnected = false
               debugPrint("[Websocket] Connected")
            DispatchQueue.main.async { [weak self] in
                guard let self = self else {return}
                NotificationCenter.default.post(name: self.pubSubDisconnectNotification, object: true)
            }
            socket!.write(string: "")
           case .disconnected(let reason, let code):
               print("Websocket is disconnected: \(reason) with code: \(code)")
               lostConnection()
           case .text(let data):
               print ("Received text. Listener Count: \(data)")
                //extract listener count from rest of body (e.g. c=3 -> 3)
                guard let range = data.range(of: "=") else {
                    return
                }
                var count = data[range.upperBound...]
                if (count.count == 0) {
                    count = "0"
                }
                DispatchQueue.main.async {
                    let name = Notification.Name(rawValue: "PubSub")
                    NotificationCenter.default.post(name: name, object: (count as AnyObject))
                }
           case .binary(let data):
               print("Received data: \(data.count)")
           case .ping(_):
               print("ping")
               break
           case .pong(_):
               print("ping")
               break
           case .viabilityChanged(_):
               break
           case .reconnectSuggested(_):
               break
           case .cancelled:
               print("Cancelled connection")
                lostConnection()
           case .error(let error):
               if let error = error {
                   handleError(error: error)
               }
              socket!.disconnect()
              lostConnection()
       }
   }
    
    func lostConnection() {
        debugPrint("[Disconnected] SSE")
        self.isWebsocketConnecting = false
        self.isDisconnected = true
        if self.isArtistTransition == true {
            self.isArtistTransition = false
            self.createWebsocketConnection(formattedArtistName: self.currentArtist)
        } else {
            DispatchQueue.main.async { [weak self] in
                guard let self = self else {return}
                NotificationCenter.default.post(name: self.pubSubDisconnectNotification, object: false)
            }
        }
    }
    
    func handleError(error: Any) {
        print("error \(error)")
    }

    init() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(updateIsPlaying),
            name: pubSubPlaybackNotification,
            object: nil
        )
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(updateArtist),
            name: pubSubArtistChangeNotification,
            object: nil
        )
        
        NSWorkspace.shared.notificationCenter.addObserver(
                self, selector: #selector(onWakeNote(note:)),
                name: NSWorkspace.didWakeNotification, object: nil)
    }
    
    @objc func onWakeNote(note: NSNotification) {
        debugPrint("woke up. subscribing to \(self.currentArtist)")
        subscribe(formattedArtistName: self.currentArtist)
    }
    
    deinit {
        guard let definedSocket = socket else {return}
        definedSocket.disconnect()
        definedSocket.delegate = nil
}
    
    /*
        creates eventsource connection and add event listeners to them
     */
    func createWebsocketConnection(formattedArtistName: String) {
        guard let url = URL(string: "\(host)/pubsub/\(formattedArtistName)") else {return}
        guard isWebsocketConnecting == false else {return}
        let request = URLRequest(url: url)
        socket = WebSocket(request: request)
        socket!.delegate = self
        socket!.connect()
        isWebsocketConnecting = true
    }
    
    // disconnect websocket after 8 minutes + track minutes from now
    func startTimer () {
        task?.cancel()
        task = DispatchWorkItem {
            guard let socket = self.socket else {return}
            socket.disconnect()
        }
        let timeToWait = (self.IDLE_TIME * 60)
        DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + timeToWait, execute: task!)
        debugPrint("[Create] timer")
    }
    
    func subscribe(formattedArtistName: String) {
        if (socket != nil && !isDisconnected) {
            self.isArtistTransition = true
            socket!.disconnect()
        } else {
            createWebsocketConnection(formattedArtistName: formattedArtistName)
        }
    }
}

extension PubSub {
    @objc func validateCurrentArtist(notification: NSNotification) -> String? {
        guard let notif = notification.object as? [String: Any] else { return nil }
        guard let currentArtist = notif["artistName"] as? String else {
            return nil }
        
        let formattedChannelName = formatChannelName(text: currentArtist)
        debugPrint("called \(self.currentArtist) \(formattedChannelName) \(self.currentArtist == formattedChannelName)")
        guard self.currentArtist != formattedChannelName || isDisconnected == true else {
            return nil
        }
        return formattedChannelName
    }
}

