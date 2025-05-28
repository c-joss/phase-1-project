document.addEventListener("DOMContentLoaded", function () {
  document.querySelector("form").addEventListener("submit", async function (e) {
    e.preventDefault();

    const companyName = document.getElementById("companyName").value;
    const loadPorts = getCheckedValues("load");
    const destinations = getCheckedValues("dest");
    const containers = getCheckedValues("container");
    const toggleSpecial = document.getElementById("toggleSpecial");
    const requirementsInput = document.getElementById("requirements");
    const requirementsText = requirementsInput && requirementsInput.value ? requirementsInput.value.trim() : "";

    if (companyName.trim() === "") {
      alert("Please enter your company name.");
      return;
    }
    if (loadPorts.length === 0) {
      alert("Please select at least one port.");
      return;
    }
    if (destinations.length === 0) {
      alert("Please select at least one destination.");
      return;
    }
    if (containers.length === 0) {
      alert("Please select at least one container size.");
      return;
    }
    if (toggleSpecial.checked && requirementsText === "") {
      alert("Please enter your special requirements or uncheck the box.");
      return;
    }

    try {
      const [quotes, portPairs] = await Promise.all([
        fetch("http://localhost:8000/quotes").then((res) => res.json()),
        fetch("http://localhost:8000/portPairs").then((res) => res.json()),
      ]);

      const matchPortPairs = portPairs.filter(
        (pair) => loadPorts.includes(pair.load) && destinations.includes(pair.destination)
      );
      const matchPortPairId = matchPortPairs.map((pair) => pair.id);

      const filteredQuotes = quotes.filter((quote) =>
        matchPortPairId.includes(quote.portPairId)
      );

      const custQuote = filteredQuotes.map((quote) => ({
        ...quote,
        rates: quote.rates.filter((rate) =>
          containers.includes(getContainerType(rate.containerId))
        ),
      }));

      updateTable(custQuote, companyName, requirementsText);
      e.target.reset();
      clearCheckboxGroups();
      document.getElementById("requirements").style.display = "none";
    } catch (error) {
      console.error("Error retrieving quote:", error);
    }
  });

  function getCheckedValues(groupId) {
    return Array.from(document.querySelectorAll(`#${groupId} input[type='checkbox']:checked`)).map(
      (checkbox) => checkbox.value
    );
  }

  function clearCheckboxGroups() {
    document.querySelectorAll(".multi-checkbox-group input[type='checkbox']").forEach(
      (checkbox) => (checkbox.checked = false)
    );
  }

  function getContainerType(containerId) {
    const containerMap = {
      1: "20GP",
      2: "40GP",
      3: "40HC",
      4: "20RE",
      5: "40REHC",
    };
    return containerMap[containerId] || "unknown";
  }

  async function updateTable(quotes, companyName, requirementsText) {
    const tableBody = document.getElementById("table-body");
    document.getElementById("table").style.display = "block";
    document.getElementById("booking-btn").style.display = "block";
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

    if (requirementsText && requirementsText !== "") {
      const specialRow = document.createElement("tr");
      const specialCell = document.createElement("td");
      specialCell.setAttribute("colspan", "10");
      specialCell.textContent = `Special Requirements: ${requirementsText}`;
      specialCell.style.fontStyle = "italic";
      specialCell.style.backgroundColor = "#eef5ff";
      specialCell.style.padding = "10px";
      specialRow.appendChild(specialCell);
      tableBody.appendChild(specialRow);
    }
  }

  function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }

  async function getPortById(portPairId, key) {
    const response = await fetch("http://localhost:8000/portPairs");
    const portPairs = await response.json();
    const pair = portPairs.find((p) => p.id === portPairId);
    return pair ? pair[key] : "Unknown";
  }
});

document.querySelector("form").addEventListener("mouseenter", function() {
  this.style.boxShadow = "0 0 10px #3d518c";
});
document.querySelector("form").addEventListener("mouseleave", function() {
  this.style.boxShadow = "none";
});

document.getElementById("toggleSpecial").addEventListener("change", function(e) {
  document.getElementById("requirements").style.display = e.target.checked ? "block" : "none";
});

document.querySelectorAll(".multi-checkbox-group label").forEach(label => {
    label.addEventListener("mouseenter", () => {
      label.style.backgroundColor = "#e6f0ff";
      label.style.borderRadius = "4px";
      label.style.paddingLeft = "5px";
    });
    label.addEventListener("mouseleave", () => {
      label.style.backgroundColor = "";
      label.style.borderRadius = "";
      label.style.paddingLeft = "";
    });
  });

  document.getElementById("companyName").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    e.preventDefault();
    document.querySelector("form").dispatchEvent(new Event("submit"));
  }
});
