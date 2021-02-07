/*jshint esversion: 9 */

import { generateTable } from './generateTable.js';
import { generatePages } from './generatePages.js';

const HOST = "https://server.spotifyvstheworld.com";
const leaderboardHourUrl = `${HOST}/leaderboard/last6Hours`;
const leaderboardAlltimeUrl = `${HOST}/leaderboard/alltime`;
const leaderboardRealtimeUrl = `${HOST}/leaderboard-realtime`;


function buttonClick(elementClicked, elementsUnclicked) {
    elementClicked.style.fontWeight = 700;
    elementClicked.style.textDecoration = "underline";
    elementsUnclicked.forEach((element) => {
        element.style.fontWeight = 100;
        elementClicked.style.textDecoration = "none";
    });
}
window.onload = async function () {
    const { alltime: leaderboardAlltimePages, hour: leaderboardHourPages } = await (await fetch(`${HOST}/leaderboard/page_total`)).json();
    let isRealtimeTab = true;

    try {
        let leaderboardHourZset;
        let leaderboardAlltimeZset;
        let leaderboardRealtimeZset = await (await fetch(leaderboardRealtimeUrl)).json();

        const createEventSource = () => {
            const es = new EventSource(
                `https://nchan.spotifyvstheworld.com/subraw?chanid=realtime`,
            );
            es.onmessage = (e) => {
                const newZset = JSON.parse(e.data);
                if (isRealtimeTab) {
                    generateTable(newZset, 0, false, leaderboardRealtimeZset);
                }
                leaderboardRealtimeZset = newZset;
            };

            es.onopen = async () => {
                console.log(`subscribing to realtime leaderboard`);
            };
        };
        createEventSource();

        const cache = {};
        cache[leaderboardHourUrl] = {
        };
        cache[leaderboardAlltimeUrl] = {
        };

        cache[leaderboardRealtimeUrl] = null;

        const leaderboardLast6Hours = document.getElementById("leaderboard-last-6-hours");
        const leaderboardAlltime = document.getElementById("leaderboard-alltime");
        const leaderboardRealtime = document.getElementById("leaderboard-realtime");

        leaderboardLast6Hours.onclick = async () => {
            isRealtimeTab = false;
            buttonClick(leaderboardLast6Hours, [leaderboardAlltime,
                leaderboardRealtime
            ])
            if (!leaderboardHourZset) {
                leaderboardHourZset = await (await fetch(`${leaderboardHourUrl}/0`)).json();
                cache[leaderboardHourUrl] = {
                    "0": leaderboardHourZset
                };
            }
            generateTable(leaderboardHourZset);
            await generatePages(leaderboardHourPages, leaderboardHourUrl, cache);
        };

        leaderboardAlltime.onclick = async () => {
            isRealtimeTab = false;
            buttonClick(leaderboardAlltime, [leaderboardLast6Hours,
                leaderboardRealtime
            ])
            if (!leaderboardAlltimeZset) {
                leaderboardAlltimeZset = await (await fetch(`${leaderboardAlltimeUrl}/0`)).json();
                cache[leaderboardAlltimeUrl] = {
                    "0": leaderboardAlltimeZset
                };
            }
            generateTable(leaderboardAlltimeZset);
            await generatePages(leaderboardAlltimePages, leaderboardAlltimeUrl, cache);
        };

        leaderboardRealtime.onclick = async () => {
            isRealtimeTab = true;
            buttonClick(leaderboardRealtime, [leaderboardLast6Hours, leaderboardAlltime]);
            generateTable(leaderboardRealtimeZset, 0, false);
            await generatePages(1, null, cache);
        };
        leaderboardRealtime.click();
    } catch (error) {
        console.log(error.message);
        console.log(`error::: ${JSON.stringify(error, null, 4)}`);
    }
};
