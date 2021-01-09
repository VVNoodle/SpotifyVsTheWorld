//
//  PubSub.swift
//  SpotifyVsTheWorld
//
//  Created by Egan Bisma on 12/6/20.
//  Copyright © 2020 KM. All rights reserved.

import Starscream
import IKEventSource
import Alamofire
import SwiftyJSON

public protocol PubSubDelegate: class {
    func didUpdateListenerCount(notification: NSNotification) -> Void
}

final class PubSub {
    var currentArtist: String = ""
    private var artistTooEarly: (String, TimeInterval) = ("", 0)
    public weak var delegate: PubSubDelegate!
    private var isTempDisconnect: Bool = false
    private var idleTimer : Timer?
    private var pubSubUrl = ProcessInfo.processInfo.environment["PUBSUB_URL"]
    private let countNotification = Notification.Name(rawValue: "PubSub")
    private let disconnectNotification = Notification.Name(rawValue: "PubSubDisconnect")
    private let host = "https://nchan.spotifyvstheworld.com"
    
    private var eventSourceSubscriber: EventSource!;
    
    func formatChannelName(rawChannelName: String) -> String {
        return rawChannelName.lowercased().replacingOccurrences(of: " ", with: "_")
    }
    
    let queue = DispatchQueue(label: "PubSub", qos: .background)
    
    var task: DispatchWorkItem?
    
    // disconnect websocket after 8 minutes + track minutes from now
    func startTimer (duration: TimeInterval) {
        task?.cancel()
        task = DispatchWorkItem {
            self.eventSourceSubscriber.disconnect()
        }
        DispatchQueue.main.asyncAfter(deadline: DispatchTime.now() + (8 * 60) + duration, execute: task!)
        print("Creating timer")
    }
    
    
    func subscribe(currentArtist: String, duration: TimeInterval) {
        startTimer(duration: duration)
        guard currentArtist != self.currentArtist else {
            return
        }
        let formattedArtistName = formatChannelName(rawChannelName: currentArtist)
        
        // get subscribers count
        let headers: HTTPHeaders = [
            "Content-Type": "application/json",
            "Accept": "application/json"
        ]
        request("\(host)/pub/\(formattedArtistName)", method: .get, headers: headers).responseJSON { response in
            guard let data = response.data else {
                return
            }
            let JSONData = JSON(data)
            debugPrint("data \(JSONData["subscribers"].stringValue)")
            
            var count = JSONData["subscribers"].stringValue.count > 0 ? JSONData["subscribers"].stringValue : "0"
            count = String(Int(count)! + 1)
            let param = [
                "c": count,
            ]
            debugPrint(param)
            DispatchQueue.main.async { [weak self] in
                guard let self = self else {return}
                NotificationCenter.default.post(name: self.countNotification, object: (count as AnyObject))
            }
            
            request(
                "\(self.host)/pub/\(formattedArtistName)",
                method: .post,
                parameters: param,
                headers: headers
            ).responseJSON { [self] response in
                if (eventSourceSubscriber != nil) {
                    isTempDisconnect = true
                    eventSourceSubscriber.disconnect()
                }
                eventSourceSubscriber = EventSource(url: URL(string: "\(host)/sub/\(formattedArtistName)")!)
                eventSourceSubscriber.connect()
                eventSourceSubscriber.onOpen {
                    print("connected to server!!!")
                    DispatchQueue.main.async { [weak self] in
                        guard let self = self else {return}
                        NotificationCenter.default.post(name: self.disconnectNotification, object: true)
                    }
                }
                eventSourceSubscriber.onMessage({ id, event, data in
                    guard let data = data else {
                        print("no data found")
                        return
                    }
                    
                    //extract listener count from rest of body (e.g. c=3 -> 3)
                    guard let range = data.range(of: "=") else {
                        return
                    }
                    var count = data[range.upperBound...]
                    if (count.count == 0) {
                        count = "0"
                    }
                    
                    DispatchQueue.main.async { [weak self] in
                        guard let self = self else {return}
                        NotificationCenter.default.post(name: self.countNotification, object: (count as AnyObject))
                    }
                })
                eventSourceSubscriber.onComplete({ id, bl, err in
                    print("EventSource connection is disconnected: \(bl) with code: \(err)")
                    if isTempDisconnect {
                        isTempDisconnect = false
                    } else {
                        DispatchQueue.main.async { [weak self] in
                            guard let self = self else {return}
                            NotificationCenter.default.post(name: self.disconnectNotification, object: false)
                        }
                    }
                })
            }
        }
        self.currentArtist = currentArtist
        print("Subbed to \(self.currentArtist)")
        
        
    }
    
    
    init() {
        print("running pubsub!")
    }
    
    func handleError(error: Any) {
        print("error \(error)")
    }
    
    deinit {
        guard let eventSourceSubscriber = eventSourceSubscriber else {return}
        eventSourceSubscriber.disconnect()
    }
}

