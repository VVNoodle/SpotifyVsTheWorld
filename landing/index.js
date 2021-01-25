/*jshint esversion: 8 */

const MAX_NAME_LENGTH = 20;
const leaderboardHourUrl = "https://server.spotifyvstheworld.com/leaderboard/last6Hours";
const leaderboardAlltimeUrl = "https://server.spotifyvstheworld.com/leaderboard/alltime";

const leaderboardTableHeaders = `
            <tr>
                <th>
                    Artist
                </th>
                <th>
                    listeners
                </th>
            </tr>
        `

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
    const { alltime: leaderboardAlltimePages, hour: leaderboardHourPages } = await (await fetch("https://server.spotifyvstheworld.com/leaderboard/page_total")).json()
    console.log(`pages: ${leaderboardAlltimePages}, ${leaderboardHourPages}`);

    try {
        let leaderboardHourZset = await (await fetch(`${leaderboardHourUrl}/0`)).json()
        let leaderboardAlltimeZset = await (await fetch(`${leaderboardAlltimeUrl}/0`)).json()

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
            if (zset.length < 20) {
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

        await generateTable(leaderboardAlltimeZset);
        const leaderboardLast6Hours = document.getElementById("leaderboard-last-6-hours")
        const leaderboardAlltime = document.getElementById("leaderboard-alltime")

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
            buttonClick(leaderboardLast6Hours, [leaderboardAlltime,
                // leaderboardRealtime
            ])
            generateTable(leaderboardHourZset);
            await generatePages(leaderboardHourPages, leaderboardHourUrl, leaderboardHourZset);
        }

        leaderboardAlltime.onclick = async () => {
            buttonClick(leaderboardAlltime, [leaderboardLast6Hours,
                // leaderboardRealtime
            ])
            generateTable(leaderboardAlltimeZset)
            await generatePages(leaderboardAlltimePages, leaderboardAlltimeUrl, leaderboardAlltimeZset);
        }

        // leaderboardRealtime.onclick = () => {
        //     buttonClick(leaderboardRealtime, [leaderboardLast6Hours, leaderboardAlltime])
        //     document.getElementById('leaderboard-table').innerHTML = leaderboardTableHeaders;

        //     leaderboardAlltimeZset.forEach((data, index) => {
        //         // if index is odd, then data is listener count
        //         // else data is artist name
        //         const isCount = index % 2 != 0;
        //         if (isCount) {
        //             return;
        //         }
        //         appendTable(data, leaderboardAlltimeZset[index + 1]);
        //     });
        // }

        leaderboardAlltime.click();
    } catch (error) {
        console.log(error.message);
        console.log(`error::: ${JSON.stringify(error, null, 4)}`);
    }
};

// function test(e) {
//     console.log('hello');
//     document.getElementById("input-form-interactive-demo-section")
// }
