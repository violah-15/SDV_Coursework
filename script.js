document.addEventListener("DOMContentLoaded", function () {
    const mapWidth = 900, mapHeight = 600;
    let currentYear = "1997";  // Default year to start with
    let currentMetric = 'AffordabilityRatio';  // Default metric

    const colorScales = {
        'AffordabilityRatio': d3.scaleQuantize().domain([0, 15]).range(["#FFF3E3", "#FEDBC7", "#F7A482","#D85F4C", "#B31629"]),
        'MedianWorkplaceEarnings': d3.scaleQuantize().domain([20000, 100000]).range(["#FFF3E3", "#FEDBC7", "#F7A482","#D85F4C", "#B31629"]),
        'MedianHousePrice': d3.scaleQuantize().domain([100000, 1000000]).range(["#FFF3E3", "#FEDBC7", "#F7A482","#D85F4C", "#B31629"])
    };

    const svg = d3.select("#map-container").append("svg")
        .attr("width", mapWidth)
        .attr("height", mapHeight);

    const tooltip = d3.select("#map-container").append("div")
        .attr("class", "tooltip")
        .style("position", "absolute")
        .style("visibility", "hidden")
        .style("background", "#fff")
        .style("border", "1px solid #333")
        .style("padding", "5px")
        .style("pointer-events", "none");

    const colorScaleGroup = svg.append("g")
        .attr("transform", "translate(30, 50)");

    const mapTitle = svg.append("text")
        .attr("x", mapWidth / 2)
        .attr("y", 30)
        .attr("text-anchor", "middle")
        .attr("style", "font-size: 18px; font-weight: bold;")
        .text(`Graph showing ${currentMetric.replace(/([A-Z])/g, ' $1')} in London, ${currentYear}`);

    const boroughNameDisplay = svg.append("text")
        .attr("x", mapWidth - 10)
        .attr("y", mapHeight - 10)
        .attr("text-anchor", "end")
        .attr("style", "font-size: 14px;")
        .text("Click map to choose borough");

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
                    return boroughData ? colorScales[currentMetric](boroughData[currentMetric]) : "#ccc";
                })
                .style("stroke", "#333")
                .style("stroke-width", 1)
                .on("click", function (event, d) {
                    updateLineGraphs(d.id, data[d.id]);
                    boroughNameDisplay.text(`Borough chosen: ${d.id}`);
                })
                .on("mouseover", function (event, d) {
                d3.select(this).style("stroke-width", 3); // Highlight the border
                const boroughData = data[d.id] ? data[d.id][currentYear] : null;
                const tooltipData = `Borough: ${d.id}<br>${currentMetric.replace(/([A-Z])/g, ' $1')}: ${boroughData ? boroughData[currentMetric] : 'N/A'}`;
                tooltip.style("visibility", "visible")
                    .html(tooltipData)
                    // Place the tooltip right next to the cursor
                    .style("top", (event.pageY - 10) + "px")  // Slight vertical offset
                    .style("middle", (event.pageX) + "px");  // Slight horizontal offset
                })
                .on("mouseout", function () {
                    d3.select(this).style("stroke-width", 1); // Reset the border
                    tooltip.style("visibility", "hidden");
                });

            const slider = document.getElementById("year-slider");
            const playButton = document.getElementById("play-button");
            const yearDisplay = document.getElementById("year-display");
            yearDisplay.textContent = currentYear;

            setupButtons(boroughs, data);
            updateColorScale(currentMetric);

            slider.oninput = function() {
                currentYear = this.value;
                yearDisplay.textContent = currentYear;
                updateVisualization(boroughs, data, currentYear);
            };

            let playing = false;
            let interval;
            playButton.onclick = function() {
                if (!playing) {
                    playing = true;
                    playButton.textContent = "Pause";
                    interval = setInterval(function() {
                        let year = parseInt(slider.value, 10) + 1;  // Increment the year
                        if (year > parseInt(slider.max, 10)) {
                            year = parseInt(slider.max, 10);  // Set year to max to prevent overflow
                            slider.value = year;
                            clearInterval(interval);  // Stop the interval when max year is reached
                            playButton.textContent = "Play";
                            playing = false;
                        } else {
                            slider.value = year;
                        }
                        currentYear = year.toString();
                        yearDisplay.textContent = currentYear;
                        updateVisualization(boroughs, data, currentYear);
                    }, 1000); // Update every second
                } else {
                    clearInterval(interval);
                    playButton.textContent = "Play";
                    playing = false;
                }
            };
        });
    });

    function setupButtons(boroughs, data) {
        document.querySelectorAll('.button').forEach(button => {
            button.addEventListener('click', function () {
                const metricMapping = {
                    'affordability': 'AffordabilityRatio',
                    'earnings': 'MedianWorkplaceEarnings',
                    'house-prices': 'MedianHousePrice'
                };
                currentMetric = metricMapping[this.id];
                updateMap(boroughs, data, currentMetric);
                updateActiveButton(this);
                updateColorScale(currentMetric);
                mapTitle.text(`Graph showing ${currentMetric.replace(/([A-Z])/g, ' $1')} in London`);
            });
        });

        updateActiveButton(document.querySelector('.button'));
    }

    function updateColorScale(metric) {
        const colorScale = colorScales[metric];
        const colors = colorScale.range();
        const domain = colorScale.domain();
        const step = (domain[1] - domain[0]) / colors.length;

        colorScaleGroup.selectAll("*").remove();

        colorScaleGroup.selectAll("rect")
            .data(colors)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 10)
            .attr("height", 20)
            .attr("fill", d => d);

        colorScaleGroup.selectAll("text")
            .data(colors)
            .enter().append("text")
            .attr("x", 15)
            .attr("y", (d, i) => i * 20 + 10)
            .text((d, i) => Math.round(domain[0] + step * i).toLocaleString())
            .attr("alignment-baseline", "middle");
    }

    function updateMap(boroughs, data, metric) {
        boroughs.style("fill", d => {
            const boroughData = data[d.id] ? data[d.id][currentYear] : null;
            return boroughData ? colorScales[metric](boroughData[metric]) : "#ccc";
        });
    }

    function updateActiveButton(activeButton) {
        document.querySelectorAll('.button').forEach(button => button.classList.remove('active'));
        activeButton.classList.add('active');
    }

    function updateLineGraphs(boroughName, boroughData) {
        console.log("Update line graphs for:", boroughName, boroughData);
    }

    function updateVisualization(boroughs, data, year) {
        boroughs.style("fill", d => {
            const boroughData = data[d.id] ? data[d.id][year] : null;
            return boroughData ? colorScales[currentMetric](boroughData[currentMetric]) : "#ccc";
        });
        mapTitle.text(`Graph showing ${currentMetric.replace(/([A-Z])/g, ' $1')} in London, ${year}`);
    }
});
