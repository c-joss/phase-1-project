document.addEventListener("DOMContentLoaded", function () {
  const form = document.querySelector("form");
  const companyNameInput = document.getElementById("companyName");
  const toggleSpecial = document.getElementById("toggleSpecial");
  const requirementsInput = document.getElementById("requirements");

  let cachedPortPairs = [];
  let cachedContainers = [];

  // Preload Port Pairs and Container Types
  Promise.all([
    fetch("http://localhost:8000/portPairs").then((res) => res.json()),
    fetch("http://localhost:8000/containers").then((res) => res.json()),
  ]).then(([portPairs, containers]) => {
    cachedPortPairs = portPairs;
    cachedContainers = containers;
  });

  // Form Submit Event

  form.addEventListener("submit", async function (e) {
    e.preventDefault();

    const companyName = companyNameInput.value.trim();
    const loadPorts = getCheckedValues("load");
    const destinations = getCheckedValues("dest");
    const containers = getCheckedValues("container");
    const requirementsText = requirementsInput?.value?.trim() || "";

    // Form validation

    if (!companyName) return alert("Please enter your company name.");
    if (loadPorts.length === 0)
      return alert("Please select at least one port.");
    if (destinations.length === 0)
      return alert("Please select at least one destination.");
    if (containers.length === 0)
      return alert("Please select at least one container size.");
    if (toggleSpecial.checked && !requirementsText)
      return alert(
        "Please enter your special requirements or uncheck the box."
      );

    try {
      const quotes = await fetch("http://localhost:8000/quotes").then((res) =>
        res.json()
      );

      const matchPortPairIds = cachedPortPairs
        .filter(
          (pair) =>
            loadPorts.includes(pair.load) &&
            destinations.includes(pair.destination)
        )
        .map((pair) => pair.id);

      const custQuote = quotes
        .filter((quote) => matchPortPairIds.includes(quote.portPairId))
        .map((quote) => ({
          ...quote,
          rates: quote.rates.filter((rate) =>
            containers.includes(
              getContainerType(rate.containerId, cachedContainers)
            )
          ),
        }));

      updateTable(custQuote, companyName, requirementsText);
      e.target.reset();
      clearCheckboxGroups();
      requirementsInput.style.display = "none";
    } catch (error) {
      console.error("Error retrieving quote:", error);
    }
  });

  // Event listeners

  toggleSpecial.addEventListener("change", function (e) {
    requirementsInput.style.display = e.target.checked ? "block" : "none";
  });

  companyNameInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      e.preventDefault();
      form.dispatchEvent(new Event("submit"));
    }
  });

  async function updateTable(quotes, companyName, requirementsText) {
    const tableBody = document.getElementById("table-body");
    document.getElementById("table").style.display = "block";
    document.getElementById("booking-btn").style.display = "block";

    while (tableBody.firstChild) tableBody.removeChild(tableBody.firstChild);

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
        const pair = cachedPortPairs.find((p) => p.id === quote.portPairId);
        row.appendChild(createCell(companyName));
        row.appendChild(createCell(pair?.load || "Unknown"));
        row.appendChild(createCell(pair?.destination || "Unknown"));
        row.appendChild(createCell(quote.transitTime));
        row.appendChild(
          createCell(getContainerType(rate.containerId, cachedContainers))
        );
        row.appendChild(createCell(`${rate.freight} USD`));
        row.appendChild(createCell(`${rate.thc} AUD`));
        row.appendChild(createCell(`${rate.doc} AUD`));
        row.appendChild(createCell(`${rate.dhc} AUD`));
        row.appendChild(createCell(`${rate.lss} USD`));
        tableBody.appendChild(row);
      }
    }

    if (requirementsText) {
      const specialRow = document.createElement("tr");
      const specialCell = document.createElement("td");
      specialCell.setAttribute("colspan", "10");
      specialCell.textContent = `Special Requirements: ${requirementsText}`;
      specialCell.style.cssText =
        "font-style: italic; background-color: #eef5ff; padding: 10px;";
      specialRow.appendChild(specialCell);
      tableBody.appendChild(specialRow);
    }
  }

  // Helpers

  function createCell(text) {
    const cell = document.createElement("td");
    cell.textContent = text;
    return cell;
  }

  function getCheckedValues(groupId) {
    return Array.from(
      document.querySelectorAll(`#${groupId} input[type='checkbox']:checked`)
    ).map((checkbox) => checkbox.value);
  }

  function clearCheckboxGroups() {
    document
      .querySelectorAll(".multi-checkbox-group input[type='checkbox']")
      .forEach((checkbox) => (checkbox.checked = false));
  }

  function getContainerType(containerId, containers) {
    const container = containers.find((c) => c.id === containerId);
    return container ? container.type : "unknown";
  }
});
