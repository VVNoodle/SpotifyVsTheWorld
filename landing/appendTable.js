/*jshint esversion: 9 */

const MAX_NAME_LENGTH = 20;
const width = window.innerWidth || document.documentElement.clientWidth ||
    document.body.clientWidth;

const getEquivalentRank = (rank) => {
    let rankNum = parseInt(rank);
    while (rankNum > 0) {
        if (rankNum - 20 <= 0) {
            return rankNum;
        }
        rankNum = rankNum - 20;
    }
    return rankNum;
}

export function appendTable(artistName, rank, count, empty, artistMetadata = null, past = true) {
    const formattedArtistName = empty ? "" : artistName.replaceAll(/[^\w\s]/gi, '').replaceAll(" ", "_");
    const tableRow = document.querySelector(`[data-rank='${getEquivalentRank(rank)}']`);
    const rankTableContent = tableRow.querySelector("[class='artist-rank']");
    const artistTableContent = tableRow.getElementsByClassName("artist-profile")[0];
    const artistColumn = tableRow.querySelector("[class='artist-column']");

    // artist didn't move rank
    if (tableRow.id === formattedArtistName) {
        artistColumn.querySelector("[class='artist-count-num']").innerHTML = `${count} <span class="listeners-text">${past ? "listening" : "listening"}</span>`
        return;
    }

    // animation fadeout
    tableRow.classList.add("artist-profile-moverank")

    if (past) {
        logic(formattedArtistName, tableRow, rankTableContent, artistTableContent, artistColumn, artistMetadata, artistName, count, rank, past, empty);
    } else {
        setTimeout(() => {
            logic(formattedArtistName, tableRow, rankTableContent, artistTableContent, artistColumn, artistMetadata, artistName, count, rank, past, empty);
        }, 300)
    }
}

function logic(formattedArtistName, tableRow, rankTableContent, artistTableContent, artistColumn, artistMetadata, artistName, count, rank, past, empty) {
    artistTableContent.classList = ["artist-profile"]


    const picArea = artistTableContent.getElementsByClassName("placeholder-pic")[0];
    const existingImage = artistTableContent.getElementsByTagName("img")[0];

    const artistMetadataObj = artistMetadata ? JSON.parse(artistMetadata) : null;
    if (empty) {
        artistTableContent.classList = ["artist-profile-empty"]
        if (!picArea) {
            if (!!existingImage) {
                existingImage.remove();
            }
            const placeHolderImage = document.createElement("div");
            placeHolderImage.className = "placeholder-pic";
            artistTableContent.prepend(placeHolderImage);
            placeHolderImage.style.backgroundColor = "rgba(32, 32, 32, 0.44)";
        } else {
            picArea.style.backgroundColor = "rgba(32, 32, 32, 0.44)";
        }
        rankTableContent.innerHTML = ""
        tableRow.removeAttribute("id")
    } else {
        rankTableContent.innerHTML = `<p>#${rank}</p>`;
        rankTableContent.classList = ['artist-rank'];
        if (artistMetadataObj) {
            const colorThief = new ColorThief();
            if (!!existingImage) {
                existingImage.remove();
            } else {
                picArea.remove();
            }
            const img = new Image();
            const childNodes = document.getElementsByClassName(`${formattedArtistName}-bars`);
            if (count > 0 && past === false) {
                img.addEventListener('load', function () {
                    const colors = colorThief.getColor(img).map((color) => color < 50 ? color * 2 + 30 : color);
                    console.log(colors);
                    Array.prototype.forEach.call(childNodes, (_, index) => {
                        childNodes[index].style.backgroundColor = `rgba(${colors.join(",")}, 1)`;
                    });
                });
            }
            img.crossOrigin = 'Anonymous';
            img.src = artistMetadataObj.image.url;
            // img.width = parseInt(artistMetadataObj.image.width) / 4;
            img.className = "artist-profile-pic";
            artistTableContent.appendChild(img);
        } else {
            if (!picArea) {
                if (!!existingImage) {
                    existingImage.remove();
                }
                const placeHolderImage = document.createElement("div");
                placeHolderImage.className = "placeholder-pic";
                placeHolderImage.style.backgroundColor = '#' + Math.floor(Math.random() * 16777215).toString(16);
                artistTableContent.appendChild(placeHolderImage);
            }
            tableRow.removeAttribute("id")
        }

        artistTableContent.appendChild(rankTableContent);



        let finalArtistName = artistName;
        if (artistName.length > MAX_NAME_LENGTH) {
            finalArtistName = `${artistName.slice(0, MAX_NAME_LENGTH)}...`;
        }
        tableRow.id = formattedArtistName;
        tableRow.classList.remove("artist-profile-moverank")

    }
    let genres = "";
    if (!empty && artistMetadataObj && width >= 500) {
        genres = artistMetadataObj.genres.slice(0, 4).map((genre) => `<p class="genre-chips">${genre}</p>`).join("")
    }
    const emptyMetadataPadding = artistMetadataObj ? "" : "style='padding-top:5px'";
    artistColumn.className = "artist-column";
    artistColumn.innerHTML = `
        <p class="artist-name" ${emptyMetadataPadding}>${empty ? "" : artistName}</p>
        <div class="artist-genres">
            ${genres}
            <div class="artist-count">
                ${count == 0 || past === true ? "" : `
                <div class="bars">
                    <div class="bar ${formattedArtistName}-bars">
                    </div>
                    <div class="bar  ${formattedArtistName}-bars">
                    </div>
                    <div class="bar  ${formattedArtistName}-bars">
                    </div>
                </div>
                `}
                ${empty ? ""
            : `
                        <p class="artist-count-num">
                            ${count} <span class="listeners-text">${past ? "listening" : "listening"}</span>
                        </p>
                    `}
            </div>
        </div>
    `;
    artistTableContent.appendChild(artistColumn);
    artistTableContent.classList.add(`artist-profile`);
    tableRow.appendChild(artistTableContent);
}