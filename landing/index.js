/*jshint esversion: 8 */
const MAX_NAME_LENGTH = 20;
const HOST = "https://server.spotifyvstheworld.com";
const leaderboardHourUrl = `${HOST}/leaderboard/last6Hours`;
const leaderboardAlltimeUrl = `${HOST}/leaderboard/alltime`;

console.log = function () { }

const leaderboardTableHeaders = `
            <tr>
                <th>
                    Artist
                </th>
                <th>
                    listeners
                </th>
            </tr>
        `;

function appendTable(artistName, count, empty) {
    const tableRow = document.createElement("tr");
    const artistTableContent = document.createElement("td");
    const countTableContent = document.createElement("td");

    if (empty) {
        artistTableContent.style.padding = "0";
        artistTableContent.style.height = "26px";
    } else {
        if (artistName.length > MAX_NAME_LENGTH) {
            artistTableContent.innerHTML = artistName.slice(0, MAX_NAME_LENGTH) + "...";
        } else {
            artistTableContent.innerHTML = artistName;
        }
        countTableContent.innerHTML = count;
        countTableContent.id = `${artistName}-count`;
        tableRow.id = artistName;
    }

    tableRow.appendChild(artistTableContent);
    tableRow.appendChild(countTableContent);
    document.getElementById(`leaderboard-table`).appendChild(tableRow);
}

window.onload = async function () {
    const { alltime: leaderboardAlltimePages, hour: leaderboardHourPages } = await (await fetch(`${HOST}/leaderboard/page_total`)).json();
    console.log(`pages: ${leaderboardAlltimePages}, ${leaderboardHourPages}`);
    let isRealtimeTab = true;

    try {
        let leaderboardHourZset = await (await fetch(`${leaderboardHourUrl}/0`)).json();
        let leaderboardAlltimeZset = await (await fetch(`${leaderboardAlltimeUrl}/0`)).json();
        let leaderboardRealtimeZset = leaderboardHourZset;

        const createEventSource = () => {
            // const eventSourceInitDict = { https: { rejectUnauthorized: true } };
            const es = new EventSource(
                `https://nchan.spotifyvstheworld.com/subraw/realtime`,
                // eventSourceInitDict,
            );
            es.onmessage = (e) => {
                if (isRealtimeTab) {
                    console.log(`subscribers updated: ${e.data} ${(new Date()).getMilliseconds()}`);
                    leaderboardRealtimeZset = e.data.split(",");
                    console.log(leaderboardRealtimeZset);
                    generateTable(leaderboardRealtimeZset);
                }
            };

            es.onopen = async () => {
                console.log(`subscribing to realtime leaderboard`);
            };
        };
        createEventSource();

        async function generateTable(zset) {
            document.getElementById('leaderboard-table').innerHTML = leaderboardTableHeaders;
            zset.forEach((data, index) => {
                // if index is odd, then data is listener count
                // else data is artist name
                const isCount = index % 2 != 0;
                if (isCount) {
                    return;
                }
                appendTable(data, zset[index + 1]);
            });
            if (zset.length / 2 < 20) {
                const emptyPadding = 40 - zset.length;
                for (let i = 0; i < emptyPadding / 2; i++) {
                    appendTable(null, null, true);
                }
            }
        }

        const cache = {};
        cache[leaderboardHourUrl] = {
            "0": leaderboardHourZset
        };
        cache[leaderboardAlltimeUrl] = {
            "0": leaderboardAlltimeZset
        };
        function generatePages(pages, url, zset) {
            const paginationContainer = document.getElementById("pagination");
            paginationContainer.innerHTML = "";
            for (let i = 0; i < pages; i++) {
                const pageNumber = document.createElement("div");
                pageNumber.className = "page-number";
                pageNumber.innerHTML = i + 1;
                pageNumber.onclick = async () => {
                    if (cache[url][i]) {
                        await generateTable(cache[url][i]);
                    } else {
                        const foo = await fetch(`${url}/${i}`, { cf: { cacheEverything: true } });
                        zset = await foo.json();
                        await generateTable(zset);
                        cache[url][i] = zset;
                    }
                };
                paginationContainer.appendChild(pageNumber);
            }
        }

        await generateTable(leaderboardRealtimeZset);
        const leaderboardLast6Hours = document.getElementById("leaderboard-last-6-hours")
        const leaderboardAlltime = document.getElementById("leaderboard-alltime");
        const leaderboardRealtime = document.getElementById("leaderboard-realtime");

        function buttonClick(elementClicked, elementsUnclicked) {
            const PUSH_LENGTH = "3px";
            elementClicked.style.boxShadow = `0 ${PUSH_LENGTH} #afc244`;
            elementClicked.style.transform = `translateY(6px)`;
            elementClicked.style.color = "#fff";

            elementClicked.onmouseover = () => {
            }
            elementClicked.onmouseleave = () => {
            }

            elementsUnclicked.forEach((element) => {
                element.style.transform = "translateY(0px)"
                element.style.backgroundColor = "#3d3d3d"
                element.style.boxShadow = "0 9px #999"
                element.style.color = "rgb(227, 227, 227)"



                element.onmouseover = (en) => {
                    element.style.transform = "translateY(2px)";
                    element.style.boxShadow = "0 7px #999";
                };
                element.onmouseleave = () => {
                    element.style.transform = "translateY(0px)"
                    element.style.boxShadow = "0 9px #999"
                }
            })

        }

        leaderboardLast6Hours.onclick = async () => {
            isRealtimeTab = false;
            buttonClick(leaderboardLast6Hours, [leaderboardAlltime,
                leaderboardRealtime
            ])
            generateTable(leaderboardHourZset);
            await generatePages(leaderboardHourPages, leaderboardHourUrl, leaderboardHourZset);
        };

        leaderboardAlltime.onclick = async () => {
            isRealtimeTab = false;
            buttonClick(leaderboardAlltime, [leaderboardLast6Hours,
                leaderboardRealtime
            ])
            generateTable(leaderboardAlltimeZset);
            await generatePages(leaderboardAlltimePages, leaderboardAlltimeUrl, leaderboardAlltimeZset);
        };

        leaderboardRealtime.onclick = async () => {
            isRealtimeTab = true;
            buttonClick(leaderboardRealtime, [leaderboardLast6Hours, leaderboardAlltime]);
            generateTable(leaderboardRealtimeZset);
        };

        leaderboardRealtime.click();



    } catch (error) {
        console.log(error.message);
        console.log(`error::: ${JSON.stringify(error, null, 4)}`);
    }
};

// function test(e) {
//     console.log('hello');
//     document.getElementById("input-form-interactive-demo-section")
// }
