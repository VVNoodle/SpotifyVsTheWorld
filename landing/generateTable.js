/*jshint esversion: 9 */

import { appendTable } from './appendTable.js';

export async function generateTable(newZset, pageNumber = 0, past = true) {
    let rank = 0;

    for (let index = 0; index < newZset.leaderboard.length; index += 2) {
        const artistName = newZset.leaderboard[index];

        appendTable(artistName, rank + 1 + pageNumber * 20, newZset.leaderboard[index + 1], false, newZset.artistMetadata ? newZset.artistMetadata[rank] : null, past);
        rank++;
    }

    // newZset.leaderboard.forEach((data, index) => {
    //     // if index is odd, then data is listener count
    //     // else data is artist name
    //     const isCount = index % 2 != 0;
    //     if (isCount) {
    //         return;
    //     }
    //     appendTable(data, rank + 1 + pageNumber * 20, newZset.leaderboard[index + 1], false, newZset.artistMetadata ? newZset.artistMetadata[rank] : null, past);
    //     rank++;
    // });
    if (newZset.leaderboard.length / 2 < 20) {
        const emptyPadding = 40 - newZset.leaderboard.length;
        for (let i = 0; i < emptyPadding / 2; i++) {
            appendTable(null, rank + 1, null, true, past);
            rank++;
        }
    }
}