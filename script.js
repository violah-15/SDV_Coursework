document.addEventListener("DOMContentLoaded", function () {
    // Adjust these dimensions as needed
    const overallWidth = 900;
    const overallHeight = 600;

    // Append the SVG to the map container
    const svg = d3.select("#map-container").append("svg")
        .attr("width", overallWidth)
        .attr("height", overallHeight)
        .style("border", "1px solid #333");

    // Define the projection and path generator for the map
    const projection = d3.geoMercator()
        .center([-0.09, 51.50]) // Approximate center of London
        .scale(35000) // Scale for zooming to the London area
        .translate([overallWidth / 2, overallHeight / 2]);

    const path = d3.geoPath()
        .projection(projection);

    // Load the GeoJSON data
    d3.json("london-boroughs_1179.geojson").then(function(geojson) {
        // Draw the boroughs
        const boroughs = svg.selectAll(".borough")
            .data(geojson.features)
            .enter().append("path")
            .attr("class", "borough")
            .attr("d", path)
            .style("fill", "none")
            .style("stroke", "#333") // Use a darker stroke color that differs from the background
            .style("stroke-width", 1);

        // Mouseover event handler
        let mouseOver = function(event, d) {
            d3.select(this)
                .style("fill", "grey"); // Change fill to grey on mouseover

            svg.append("text")
                .attr("class", "hover-text")
                .attr("x", event.pageX - svg.node().getBoundingClientRect().left + 10)
                .attr("y", event.pageY - svg.node().getBoundingClientRect().top + 10)
                .text(d.properties.name)
                .style("pointer-events", "none") // Make sure the text does not interfere with mouse events
                .style("font-size", "12px")
                .style("font-weight", "bold");
        }

        // Mouseleave event handler
        let mouseLeave = function(event, d) {
            d3.select(this)
                .style("fill", "none"); // Remove fill color

            d3.select(".hover-text").remove(); // Remove the hover text
        }

        boroughs.on("mouseover", mouseOver)
            .on("mouseleave", mouseLeave)
            .on("click", function(event, d) {
                // Handle click event for the borough
                document.getElementById("borough-name").textContent = d.properties.name;
                // Implement the update to line graphs if needed
            });
    });

    // Add additional visualization elements (color scale, slider, etc.) here as needed
});
