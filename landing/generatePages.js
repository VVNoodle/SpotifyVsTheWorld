/*jshint esversion: 9 */
import { generateTable } from './generateTable.js';

export function generatePages(pages, url, cache) {
    const paginationContainer = document.getElementById("pagination");
    paginationContainer.innerHTML = "";
    for (let i = 0; i < pages; i++) {
        const pageNumber = document.createElement("div");
        pageNumber.className = "page-number";
        pageNumber.innerHTML = i + 1;
        pageNumber.onclick = async () => {
            if (cache[url][i]) {
                await generateTable(cache[url][i], i, true);
            } else {
                let data = await fetch(`${url}/${i}`, { cf: { cacheEverything: true } });
                data = await data.json();
                await generateTable(data, i, true);
                cache[url][i] = data;
            }
        };
        paginationContainer.appendChild(pageNumber);
    }
}