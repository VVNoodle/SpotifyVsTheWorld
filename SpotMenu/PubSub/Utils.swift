//
//  Utils.swift
//  SpotifyVsTheWorld
//
//  Created by Egan Bisma on 1/23/21.
//  Copyright © 2021 KM. All rights reserved.
//

import Foundation

func formatChannelName(text: String) -> String {
    let urlString = text.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed)!
    print("urlString \(urlString)")
    return urlString
}

extension PubSub {
    // proceeds when user plays a track when something else was playing
    @objc func updateArtist(notification: NSNotification) {
        guard let artistData = validateCurrentArtist(notification: notification) else {
            return
        }
        self.currentArtist = artistData
        subscribe(artistData: self.currentArtist)
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
        
        guard let artistData = validateCurrentArtist(notification: notification) else {
            return
        }
        self.currentArtist = artistData
        subscribe(artistData: currentArtist)
    }
    
    @objc func validateCurrentArtist(notification: NSNotification) -> [String: String]? {
        guard let notif = notification.object as? [String: Any] else { return nil }
        guard let artist = notif["artist"] as? String else {
            return nil }
        guard let trackId = notif["trackId"] as? String else {
            return nil }
        guard let trackTitle = notif["trackTitle"] as? String else {
            return nil }
        
        let formattedChannelName = formatChannelName(text: artist)
        return ["artist": formattedChannelName, "trackId": trackId, "trackTitle": trackTitle]
    }
}
