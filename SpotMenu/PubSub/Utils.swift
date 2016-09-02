//
//  Utils.swift
//  SpotifyVsTheWorld
//
//  Created by Egan Bisma on 1/23/21.
//  Copyright © 2021 KM. All rights reserved.
//

import Foundation

func formatChannelName(text: String) -> String {
    let okayChars = Set("abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLKMNOPQRSTUVWXYZ1234567890+-=().!_")
    let filteredChars =  text.filter {okayChars.contains($0) }
    return filteredChars.lowercased().replacingOccurrences(of: " ", with: "_")
}

extension PubSub {
    // proceeds when user plays a track when something else was playing
    @objc func updateArtist(notification: NSNotification) {
        guard let foo = validateCurrentArtist(notification: notification) else {
            return
        }
        self.currentArtist = foo
        subscribe(formattedArtistName: self.currentArtist)
    }
    
    // proceeds when user plays from pause, user pause from playing
    @objc func updateIsPlaying(notification: NSNotification) {
        guard let notif = notification.object as? [String: Any] else { return }
        
        guard let isPlaying = (notif["isPlaying"] as? Bool) else {
            return
        }
        
        // If it was playing, and its still going, then ignore it. if its
        // diff artist, then updateArtist w ill handle. If it's same artist, no need to do anything
        if self.isPlaying && isPlaying {
            self.isPlaying = isPlaying
            return
        }
        
        self.isPlaying = isPlaying
        
        // if playing (user is active), cancel timer. else, start new timer
        if (isPlaying) {
            debugPrint("cancelling timer")
            task?.cancel()
        } else {
            startTimer()
        }
        
        guard let foo = validateCurrentArtist(notification: notification) else {
            return
        }
        self.currentArtist = foo
        subscribe(formattedArtistName: currentArtist)
    }
}
