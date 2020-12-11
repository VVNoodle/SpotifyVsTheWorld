//
//  PubSub.swift
//  SpotifyVsTheWorld
//
//  Created by Egan Bisma on 12/6/20.
//  Copyright © 2020 KM. All rights reserved.
//

import Foundation
import ScClient

public protocol PubSubDelegate: class {
    func didUpdateListenerCount(notification: NSNotification) -> Void
}

final class PubSub {
    var client = ScClient(url: "http://localhost:8000/socketcluster/")
    var fclient: ScClient? = nil
    var currentArtist: String = ""
    private var artistTooEarly: String = ""
    public weak var delegate: PubSubDelegate!

    var onConnect = {
        (client :ScClient) in
        print("Connnected to server")
    }

    var onDisconnect = {
        (client :ScClient, error : Error?) in
        print("Disconnected from server")
    }

    func onAuthentication(client :ScClient, isAuthenticated : Bool?) {
        print("Authenticated is ", isAuthenticated! as Bool)
        fclient = client
        if artistTooEarly.count > 0 {
            subscribe(currentArtist: artistTooEarly)
        }
    }

    var onSetAuthentication = {
        (client : ScClient, token : String?) in
        print("Token is ", token! as String)
    }
    
    func subscribe(currentArtist: String) {
        artistTooEarly = currentArtist
        guard fclient != nil, currentArtist != self.currentArtist else {return}
        artistTooEarly = ""
        client.publish(channelName: "changeArtist", data: [
            "prevArtist": self.currentArtist,
            "currArtist": currentArtist
        ] as AnyObject)
        
        
        unsubscribe(artistName: self.currentArtist)
        client.subscribeAck(channelName: currentArtist, ack : {
            (channelName : String, error : AnyObject?, data : AnyObject?) in
            if (error is NSNull) {
             print("Successfully subscribed to channel ", channelName)
            } else {
             print("Got error while subscribing ", error! as AnyObject)
            }
         })

        client.onChannel(channelName: currentArtist, ack: {
            (channelName : String , data : AnyObject?) in
            print ("Got data for channel", channelName, " object data is ", data! as AnyObject)
            DispatchQueue.main.async {
                let name = Notification.Name(rawValue: "PubSub")
                NotificationCenter.default.post(name: name, object: (data! as AnyObject))
            }
        })
        
        self.currentArtist = currentArtist
    }
    
    func unsubscribe(artistName: String) {
        guard artistName != "" else {return}
        fclient!.unsubscribeAck(channelName: artistName, ack : {
            (channelName : String, error : AnyObject?, data : AnyObject?) in
            if (error is NSNull) {
                print("Successfully unsubscribed to channel ", channelName)
            } else {
                print("Got error while unsubscribing ", error! as AnyObject)
            }
        })
    }
    
    init() {
    }
    
    func runPubSub() {
        print("running pubsub!")
        client.setBasicListener(onConnect: onConnect, onConnectError: nil, onDisconnect: onDisconnect)
        client.setAuthenticationListener(onSetAuthentication: onSetAuthentication, onAuthentication: onAuthentication)
        client.connect()
    }
}

