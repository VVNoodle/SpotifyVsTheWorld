/*jshint esversion: 9 */

import { appendTable } from './appendTable.js';

export async function generateTable(newZset, pageNumber = 0, past = true, oldZset) {
    let rank = 0;

    for (let index = 0; index < newZset.leaderboard.length; index += 2) {
        const oldArtistNames = [];

        if (!!oldZset) {
            oldArtistNames.push(oldZset.leaderboard[index]);

            // if only move one spot, no need to add animation
            if (index + 2 < newZset.leaderboard.length) {
                oldArtistNames.push(oldZset.leaderboard[index + 2]);
            }
            if (index - 2 < newZset.leaderboard.length) {
                oldArtistNames.push(oldZset.leaderboard[index - 2]);
            }
        }

        appendTable(newZset.leaderboard[index], rank + 1 + pageNumber * 20, newZset.leaderboard[index + 1], false, newZset.artistMetadata ? newZset.artistMetadata[rank] : null, past, oldArtistNames);
        rank++;
    }

    if (newZset.leaderboard.length / 2 < 20) {
        const emptyPadding = 40 - newZset.leaderboard.length;
        for (let i = 0; i < emptyPadding / 2; i++) {
            appendTable(null, rank + 1, null, true, past);
            rank++;
        }
    }
}