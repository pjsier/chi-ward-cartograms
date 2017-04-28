// Non-contiguous cartogram
// https://bl.ocks.org/mbostock/4055908
var svg, width, height, projection, path, tooltip;

var cbColors = "OrRd";

function randomInterval(min, max) {
  return Math.floor(Math.random()*(max-min+1)+min);
}

function handleGeoJson(geoPath) {
  d3.json(geoPath, function(json) {
    var bounds = path.bounds(json);
    var s = 0.95 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
    var t = [(width - s * (bounds[1][0] + bounds[0][0])) / 2, (height - s * (bounds[1][1] + bounds[0][1])) / 2];
    projection.scale(s).translate(t);
    tooltip = d3.select("body")
      .append("div")
      .style("visibility", "hidden")
      .style("font-size", "16px")
      .style("padding", "10px")
      .style("z-index", "10")
      .style("position", "absolute")
      .style("background-color", "lightgrey");

    json.features.forEach(function(d) {
      d.properties.ci_count = randomInterval(1, 5);
    });

    svg.select("g.chicago")
      .selectAll("path")
        .data(json.features, function(d) {
          return d.properties.zip + "-" + d.properties.ci_count;
        })
        .enter().append("path")
          .attr("d", path)
          .attr("fill-opacity", 0.8)
          .attr("stroke", "#6F7070")
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", 1)
          .attr("transform", function(d) {
            var centroid = path.centroid(d),
                x = centroid[0],
                y = centroid[1];
            return "translate(" + x + "," + y + ")"
                + "scale(" + Math.sqrt(d.properties.ci_count / 5 || 0) + ")"
                + "translate(" + -x + "," + -y + ")";
          })
          // .attr("fill", function(d) { return color(d.properties.ci_count);})
          .attr("fill", "red")
          .on("mouseover", function(d){
            return tooltip.style("visibility", "visible")
              .html("<b>Zip</b>: " + d.properties.zip + "<br><b>Count</b>: " + d.properties.ci_count)
          })
	        .on("mousemove", function(){return tooltip.style("top", (event.pageY-10)+"px").style("left",(event.pageX+10)+"px");})
	        .on("mouseout", function(){return tooltip.style("visibility", "hidden");});;
  });
}

(function() {
  bbox = document.getElementsByTagName("svg")[0].getBoundingClientRect();
  width = bbox.width;
  height = bbox.height;
  svg = d3.select("svg");

  svg.append("g").attr("class", "chicago");

  projection = d3.geoMercator().scale(1).translate([0,0]);
  path = d3.geoPath().projection(projection);
  handleGeoJson('data/chi_zips.geojson');
})()
