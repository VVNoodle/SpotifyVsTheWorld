//
//  PubSub.swift
//  SpotifyVsTheWorld
//
//  Created by Egan Bisma on 12/6/20.
//  Copyright © 2020 KM. All rights reserved.
//

import Starscream

public protocol PubSubDelegate: class {
    func didUpdateListenerCount(notification: NSNotification) -> Void
}

final class PubSub: WebSocketDelegate {
    var currentArtist: String = ""
    private var artistTooEarly: String = ""
    public weak var delegate: PubSubDelegate!
    private var socket: WebSocket?
    private var isConnected: Bool = false
    private var isConnecting: Bool = false
    private var idleTimer : Timer?
    private var pubSubUrl = ProcessInfo.processInfo.environment["PUBSUB_URL"]
    
    func didReceive(event: WebSocketEvent, client: WebSocket) {
            switch event {
            case .connected(_):
                isConnected = true
                isConnecting = false
                print("Client connected to websocket")
                if artistTooEarly.count > 0 {
                    print("Subs attempt too early. Subing now. artist: \(artistTooEarly)")
                    subscribe(currentArtist: artistTooEarly)
                    artistTooEarly = ""
                }
            case .disconnected(let reason, let code):
                isConnected = false
                isConnecting = false
                print("Websocket is disconnected: \(reason) with code: \(code)")
            case .text(let string):
                print ("Received text. Listener Count: \(string)")
                DispatchQueue.main.async {
                    let name = Notification.Name(rawValue: "PubSub")
                    NotificationCenter.default.post(name: name, object: (string as AnyObject))
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
                isConnected = false
                isConnecting = false
                print("Cancelled connection")
            case .error(let error):
                isConnected = false
                if let error = error {
                    handleError(error: error)
                }
            }
        }

    
    func formatChannelName(rawChannelName: String) -> String {
        return rawChannelName.lowercased().replacingOccurrences(of: " ", with: "_")
    }
    
    let queue = DispatchQueue(label: "PubSub", qos: .background)
    
    var task: DispatchWorkItem?
    
    @objc func disconnect() {
        print("Disconnecting")
        self.socket!.forceDisconnect()
    }

   func startTimer () {
        task?.cancel()
        task = DispatchWorkItem { self.disconnect() }
        DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + (15 * 60), execute: task!)
        print("Creating timer")
    }

    
    func subscribe(currentArtist: String) {
        artistTooEarly = currentArtist
        guard let definedSocket = socket, isConnected else {
            print("Socket undefined")
            if isConnecting == false {
                print("not connected. connecting back")
                connect()
            }
            return
        }
        guard currentArtist != self.currentArtist else {
            return
        }
        artistTooEarly = ""
        definedSocket.write(string: "\(formatChannelName(rawChannelName: self.currentArtist)),\(formatChannelName(rawChannelName: currentArtist))")
        self.currentArtist = currentArtist
        print("Subbed to \(self.currentArtist)")
        startTimer()
    }
    
    func connect() {
        guard let pubsubUrl = pubSubUrl else {return}
        
        let request = URLRequest(url: URL(string: "ws://\(pubsubUrl)/api/websocket")!)
        socket = WebSocket(request: request)
        
        socket!.delegate = self
        socket!.connect()
        self.isConnecting = true
    }
    
    init() {
        print("running pubsub!")
        connect()
    }
    
    func handleError(error: Any) {
        print("error \(error)")
    }
    
    deinit {
        guard let definedSocket = socket else {return}
        definedSocket.disconnect()
        definedSocket.delegate = nil
    }
}

