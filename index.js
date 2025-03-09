document.addEventListener("DOMContentLoaded", function () {
    document.querySelector("form").addEventListener("submit", async function(e) {
        e.preventDefault();

        const companyName = document.getElementById("companyName").value;
        const loadPorts = Array.from(document.getElementById("load").selectedOptions).map(opt => opt.value);
        const destinations = Array.from(document.getElementById("dest").selectedOptions).map(opt => opt.value);
        const containers = Array.from(document.getElementById("container").selectedOptions).map(opt => opt.value);

        try {
            const [quotes, portPairs] = await Promise.all([
                fetch("http://localhost:8000/quotes").then(res => res.json()),
                fetch("http://localhost:8000/portPairs").then(res => res.json())
            ]);

            const matchPortPairs = portPairs.filter(portPair =>
                loadPorts.includes(portPair.load) &&
                destinations.includes(portPair.destination)
            );
            const matchPortPairId = matchPortPairs.map(pair => pair.id);

            const filterQuotes = quotes.filter(quote =>
                matchPortPairId.includes(quote.portPairId)
            );
            const custQuote= filterQuotes.map(quote => ({
                ...quote,
                rates: quote.rates.filter(rate => containers.includes(getContainerType(rate.containerId)))
            })
            );
            updateTable(custQuote, companyName);
        } catch (error) {
            console.error("Error retrieving quote:", error);
        }
    });
    function getContainerType(containerId) {
        const containerMap = {
            1: "20GP",
            2: "40GP",
            3: "40HC",
            4: "20RE",
            5: "40REHC"
        };
        return containerMap[containerId] || "unknown";
    }
    async function updateTable(quotes, companyName) {
        const tableBody = document.getElementById("table-body");

        document.getElementById("table").style.display = "block";

        while (tableBody.firstChild) {
            tableBody.removeChild(tableBody.firstChild);
        }
        if (quotes.length === 0) {
            const noDataRow = document.createElement("tr");
            const noDataCell = document.createElement("td");
            noDataCell.setAttribute("colspan", "10");
            noDataCell.textContent = "No matching quotes found.";
            noDataRow.appendChild(noDataCell);
            tableBody.appendChild(noDataRow);
            return;
        }
        for (const quote of quotes) {
            for (const rate of quote.rates) {
                const row = document.createElement("tr");
         
            row.appendChild(createCell(companyName));
            row.appendChild(createCell(await getPortById(quote.portPairId, "load")));
            row.appendChild(createCell(await getPortById(quote.portPairId, "destination")));
            row.appendChild(createCell(quote.transitTime));
            row.appendChild(createCell(getContainerType(rate.containerId)));
            row.appendChild(createCell(`${rate.freight} USD`));
            row.appendChild(createCell(`${rate.thc} AUD`));
            row.appendChild(createCell(`${rate.doc} AUD`));
            row.appendChild(createCell(`${rate.dhc} AUD`));
            row.appendChild(createCell(`${rate.lss} USD`));

            tableBody.appendChild(row);
        }
    }
}

    function createCell(text) {
        const cell = document.createElement("td");
        cell.textContent = text;
        return cell;
    }

    async function getPortById(portPairId, key) {
        const portsresponse = await fetch("http://localhost:8000/portPairs");
        const portPairs = await portsresponse.json();
        const portPair = portPairs.find(pair => pair.id === portPairId);
        return portPair ? portPair[key] : "Unknown";
    }
});