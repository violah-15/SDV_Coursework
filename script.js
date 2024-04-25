document.addEventListener("DOMContentLoaded", function () {
    const mapWidth = 900, mapHeight = 600;
    let currentYear = "1997"; // Default year to start with
    let currentMetric = 'AffordabilityRatio'; // Default metric

    const colorScale = d3.scaleQuantize()
        .domain([0, 10]) // Adjust based on actual data range
        .range(["#EAEDB3", "#A9D992", "#00A7BB", "#004DA7", "#000452"]);

    const svg = d3.select("#map-container").append("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight);

    const tooltip = d3.select("#tooltip");

    // Create the map title within the SVG
    const mapTitle = svg.append("text")
        .attr("id", "map-title")
        .attr("x", mapWidth / 2)
        .attr("y", 30) // Position at the top of the SVG
        .attr("text-anchor", "middle")
        .attr("style", "font-size: 18px; font-weight: bold;")
        .text("Graph showing Housing Affordability Ratio in London"); // Default title

    const boroughNameDisplay = svg.append("text")
        .attr("id", "chosen-borough")
        .attr("x", mapWidth - 10)
        .attr("y", mapHeight - 10)
        .attr("text-anchor", "end")
        .attr("style", "font-size: 14px;")
        .text("Borough chosen: None");

    const tooltipGroup = svg.append("g")
        .attr("id", "tooltip-group")
        .style("visibility", "hidden");

    // Add a rectangle background for the tooltip
    tooltipGroup.append("rect")
        .attr("id", "tooltip-bg")
        .attr("width", 200)
        .attr("height", 60)
        .attr("fill", "white")
        .attr("stroke", "#333");

    // Add text for the tooltip
    const tooltipText = tooltipGroup.append("text")
        .attr("id", "tooltip-text")
        .attr("x", 10)
        .attr("y", 20)
        .attr("style", "font-size: 12px;");

    const projection = d3.geoMercator().center([-0.09, 51.50]).scale(35000)
        .translate([mapWidth / 2, mapHeight / 2]);

    const path = d3.geoPath().projection(projection);

    d3.json('https://vega.github.io/vega-datasets/data/londonBoroughs.json').then(function (topology) {
        const geojson = topojson.feature(topology, topology.objects.boroughs);

        d3.json('processed_data.json').then(function (data) {
            const boroughs = svg.selectAll(".borough")
                .data(geojson.features)
                .enter().append("path")
                .attr("class", "borough")
                .attr("d", path)
                .style("fill", d => {
                    const boroughData = data[d.id] ? data[d.id][currentYear] : null;
                    return boroughData ? colorScale(boroughData[currentMetric]) : "#ccc";
                })
                .style("stroke", "#333")
                .on("click", function (event, d) {
                    // Update the line graphs for the selected borough
                    updateLineGraphs(d.id, data[d.id]);
                    // Update the borough name display
                    boroughNameDisplay.text(`Borough chosen: ${d.id}`);
                })
                .on("mouseover", function (event, d) {
                    // Get the data for the hovered borough
                    const boroughData = data[d.id] ? data[d.id][currentYear] : null;
                    // Position the tooltip
                    const [x, y] = d3.pointer(event);
                    tooltipGroup.attr("transform", `translate(${x}, ${y - 60})`);
                    // Set the tooltip text
                    tooltipText.html(`Borough: ${d.id}<br>${currentMetric}: ${boroughData ? boroughData[currentMetric] : 'N/A'}`);
                    tooltipGroup.style("visibility", "visible");
                })
                .on("mouseout", function () {
                    tooltipGroup.style("visibility", "hidden");
                });

            setupButtons(boroughs, data); // Setup buttons and interactions
        });
    });

    function setupButtons(boroughs, data) {
        document.querySelectorAll('.button').forEach(button => {
            button.addEventListener('click', function () {
                // Map the button ID to the data key
                const metricMapping = {
                    'affordability': 'AffordabilityRatio',
                    'earnings': 'MedianWorkplaceEarnings',
                    'house-prices': 'MedianHousePrice'
                };

                currentMetric = metricMapping[this.id];
                updateMap(boroughs, data, currentMetric);
                updateActiveButton(this);

                // Update the SVG title based on the current metric
                const metricText = {
                    'AffordabilityRatio': 'Housing Affordability Ratio',
                    'MedianWorkplaceEarnings': 'Workplace Earnings',
                    'MedianHousePrice': 'House Price'
                };
                mapTitle.text(`Graph showing ${metricText[currentMetric]} in London`);
            });
        });

        updateActiveButton(document.querySelector('.button')); // Set initial active button
    }

    function updateMap(boroughs, data, metric) {
        boroughs.style("fill", d => {
            const boroughData = data[d.id] ? data[d.id][currentYear] : null;
            return boroughData ? colorScale(boroughData[metric]) : "#ccc"; // Use '#ccc' as fallback color
        });
    }

    function updateActiveButton(activeButton) {
        document.querySelectorAll('.button').forEach(button => {
            button.classList.remove('active');
        });
        activeButton.classList.add('active');
    }

    function updateLineGraphs(boroughName, boroughData) {
        console.log("Update line graphs for:", boroughName, boroughData);
        // This function would handle updating or creating line graphs based on the selected borough and its data.
        // Populate the data into line charts here.
    }
});
