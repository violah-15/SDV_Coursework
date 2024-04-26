document.addEventListener("DOMContentLoaded", function () {
    const mapWidth = 800, mapHeight = 600;
    let currentYear = "1997";  // Default year to start with
    let currentMetric = 'AffordabilityRatio';  // Default metric
    let londonOverallData = null;

    const colorScales = {
        'AffordabilityRatio': d3.scaleThreshold()
            .domain([5, 8, 12, 24, 44])
            .range(["#FFF3E3", "#FEDBC7", "#F7A482", "#D85F4C", "#B31629"]),
        'MedianWorkplaceEarnings': d3.scaleThreshold()
            .domain([20000, 25000, 30000, 38000, 63000])
            .range(["#FFF3E3", "#FEDBC7", "#F7A482", "#D85F4C", "#B31629"]),
        'MedianHousePrice': d3.scaleThreshold()
            .domain([125000, 220000, 360000, 680000, 1452000])
            .range(["#FFF3E3", "#FEDBC7", "#F7A482", "#D85F4C", "#B31629"])
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
                    document.getElementById('borough-message').textContent = `Borough chosen: ${d.id}`;
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
    d3.json('london_data.json').then(function(rawData) {
        londonOverallData = reformatData(rawData);
        initializeGraphs();  // Call to initialize the graph with formatted data

    });
    function initializeGraphs() {
        const svgWidth = 800, svgHeight = 400;
        const margin = {top: 20, right: 50, bottom: 30, left: 50};
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        // Initialize SVG for Affordability Ratio Graph
        const svg = d3.select("#affordability-ratio-graph").append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Define scales based on the London overall data
        const xScale = d3.scaleLinear()
            .domain(d3.extent(londonOverallData, d => d.year))
            .range([0, width]);

        const yScaleLeft = d3.scaleLinear()
            .domain([0, Math.max(d3.max(londonOverallData, d => d.AffordabilityRatio))])
            .range([height, 0]);

        const yScaleRight = d3.scaleLinear()
            .domain([0, Math.max(d3.max(londonOverallData, d => d.AffordabilityRatio))])
            .range([height, 0]);

        // Add x-axis
        svg.append("g")
            .attr("transform", `translate(0,${height})`)
            .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

        // Add y-axis with a class for easy selection and updates
        svg.append("g")
            .attr("class", "y-axis-left")
            .call(d3.axisLeft(yScaleLeft));

        svg.append("g")
            .attr("class", "y-axis-right")
            .attr("transform", `translate(${width},0)`)  // Position this axis on the right
            .call(d3.axisRight(yScaleRight));

        svg.append("text")
            .attr("text-anchor", "end")  // Centers the text
            .attr("x", margin.left + width / 2)  // Centers the label across the width of the graph
            .attr("y", height + margin.top + 10)  // Position below the x-axis
            .text("Year")
            .style("font-size", "16px");

        // Add Y-Axis label for Affordability Ratio
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("y", -margin.left + 20)
            .attr("x", -margin.top - height/2 + 20)
            .text("Affordability Ratio")
            .style("font-size", "16px");

        // Add Y-Axis label for Sales
        svg.append("text")
            .attr("text-anchor", "end")
            .attr("transform", "rotate(-90)")
            .attr("transform", `translate(${width + margin.left - 13}, ${margin.top + height / 2}) rotate(90)`) // Adjust this translation and rotation
            .text("Sales")
            .style("font-size", "16px");

        const legend = svg.append("g")
            .attr("font-family", "Arial")
            .attr("font-size", 12)
            .attr("text-anchor", "start")
            .attr("transform", "translate(0,-25)") // Shifts the entire legend up by 10 pixels
            .selectAll("g")
            .data([
                {name: "London Affordability Ratio", color: "#BBBBBB"},
                {name: "Borough Affordability Ratio", color: "#228733"},
                {name: "Borough Sales", color: "#4576AA"}
            ])
            .enter().append("g")
            .attr("transform", (d, i) => `translate(0,${i * 20})`);

        legend.append("rect")
            .attr("x", 0)
            .attr("width", 19)
            .attr("height", 19)
            .attr("fill", d => d.color);

        legend.append("text")
            .attr("x", 24)
            .attr("y", 9.5)
            .attr("dy", "0.32em")
            .text(d => d.name);
    }

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
                mapTitle.text(`Graph showing ${currentMetric.replace(/([A-Z])/g, ' $1')} in London, ${currentYear}`);
            });
        });

        updateActiveButton(document.querySelector('.button'));
    }

    function updateColorScale(metric) {
        const colorScale = colorScales[metric];
        const colors = colorScale.range();
        const thresholds = colorScale.domain();

        colorScaleGroup.selectAll("*").remove(); // Clear previous elements

        colorScaleGroup.selectAll("rect")
            .data(colors)
            .enter().append("rect")
            .attr("x", 0)
            .attr("y", (d, i) => i * 20)
            .attr("width", 10)
            .attr("height", 20)
            .attr("fill", d => d);

        // Create labels for each color, adjusting for thresholds
        colorScaleGroup.selectAll("text")
            .data(colors)
            .enter().append("text")
            .attr("x", 15)
            .attr("y", (d, i) => i * 20 + 10)
            .text((d, i) => {
                // Display the range of values for each color
                const lower = i === 0 ? 0 : thresholds[i - 1];
                const upper = i === colors.length - 1 ? "+" : thresholds[i];
                return `${lower} - ${upper}`;
            })
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
        const svg = d3.select("#affordability-ratio-graph svg g");
        const svgWidth = 800, svgHeight = 400;
        const margin = {top: 20, right: 50, bottom: 30, left: 50};
        const width = svgWidth - margin.left - margin.right;
        const height = svgHeight - margin.top - margin.bottom;

        // Reformat borough data
        const reformattedBoroughData = Object.keys(boroughData)
            .filter(key => !isNaN(+key))
            .map(year => ({
                year: +year,
                AffordabilityRatio: +boroughData[year].AffordabilityRatio,
                Sales: +boroughData[year].Sales  // Ensure sales data is included
            }));

        const yScaleRight = d3.scaleLinear()
            .domain([0, d3.max(reformattedBoroughData, d => d.Sales)])  // Update for sales
            .range([height, 0])

        svg.select(".y-axis-right").transition().duration(1000).call(d3.axisRight(yScaleRight));

        // Ensure both datasets are considered for scaling
        const combinedData = reformattedBoroughData.concat(londonOverallData);

        // Update scales to consider both datasets
        const xScale = d3.scaleLinear()
            .domain(d3.extent(londonOverallData, d => d.year))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, Math.max(d3.max(combinedData, d => d.AffordabilityRatio))])
            .range([height, 0]);

        // Update y-axis
        svg.select(".y-axis-left").transition().duration(1000).call(d3.axisLeft(yScale));

        // Define the line generator for both datasets
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.AffordabilityRatio));

        // Update the London overall line
        let londonLine = svg.selectAll(".london-overall-line").data([londonOverallData]);
        londonLine.enter().append("path")
            .attr("class", "london-overall-line")
            .merge(londonLine)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "#BBBBBB")
            .attr("stroke-width", 2);

        // Update or append new path for the borough
        let boroughLine = svg.selectAll(".borough-line").data([reformattedBoroughData]);
        boroughLine.enter().append("path")
            .attr("class", "borough-line")
            .merge(boroughLine)
            .attr("d", line)
            .attr("fill", "none")
            .attr("stroke", "#228733")
            .attr("stroke-width", 2);

        const salesLine = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScaleRight(d.Sales));

        let salesPath = svg.selectAll(".sales-line").data([reformattedBoroughData]);
        salesPath.enter().append("path")
            .attr("class", "sales-line")
            .merge(salesPath)
            .attr("d", salesLine)
            .attr("fill", "none")
            .attr("stroke", "#4576AA")  // Different color for sales
            .attr("stroke-width", 2);

        salesPath.exit().remove();
        boroughLine.exit().remove();
        londonLine.exit().remove();
    }

    function updateVisualization(boroughs, data, year) {
        boroughs.style("fill", d => {
            const boroughData = data[d.id] ? data[d.id][year] : null;
            return boroughData ? colorScales[currentMetric](boroughData[currentMetric]) : "#ccc";
        });
        mapTitle.text(`Graph showing ${currentMetric.replace(/([A-Z])/g, ' $1')} in London, ${year}`);
    }

    function reformatData(rawData) {
        const data = [];
        const entry = rawData[0];  // Assuming there's only one object for London

        Object.keys(entry).forEach(key => {
            if (!isNaN(+key)) {  // Check if the key is a year (numeric)
                data.push({
                    year: +key,  // Convert the key to a number
                    AffordabilityRatio: entry[key]
                });
            }
        });

        return data;
    }
});
