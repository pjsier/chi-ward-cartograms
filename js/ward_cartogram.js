// Pulled from cartograms/chi_ward_cartogram_layout.json
// Created with http://code.minnpost.com/aranger/ and Squaire WSJ library
var chi_ward_layout = [[0,0,"41"],[3,0,"50"],[4,0,"49"],[1,1,"45"],[2,1,"39"],[3,1,"40"],[4,1,"48"],[0,2,"38"],[1,2,"30"],[2,2,"35"],[3,2,"33"],[4,2,"47"],[5,2,"46"],[1,3,"29"],[2,3,"36"],[3,3,"31"],[4,3,"32"],[5,3,"44"],[2,4,"37"],[3,4,"26"],[4,4,"1"],[5,4,"2"],[6,4,"43"],[3,5,"24"],[4,5,"28"],[5,5,"27"],[6,5,"42"],[3,6,"22"],[4,6,"12"],[5,6,"25"],[6,6,"11"],[1,7,"23"],[2,7,"14"],[3,7,"16"],[4,7,"15"],[5,7,"20"],[6,7,"3"],[7,7,"4"],[2,8,"13"],[3,8,"18"],[4,8,"17"],[5,8,"21"],[6,8,"6"],[7,8,"5"],[4,9,"19"],[5,9,"34"],[6,9,"8"],[7,9,"7"],[6,10,"9"],[7,10,"10"]];
var chi_ward_data = {}
var chi_ward_labels = {};

chi_ward_layout.map(function(d) {
  chi_ward_labels[d[2]] = {"full": d[2], "short": d[2]};
});

var svg, width, height, projection, path, spinner, tooltip, cbColors;
var cbColors = "OrRd";

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
      .style("z-index", "10")
      .style("position", "absolute")
      .style("background-color", "lightgrey");

    var color = d3.scale.quantize()
        .domain([0, d3.max(json.features, function(d) {
          if (d.properties.wib_calls) {
            return d.properties.wib_calls;
          }
          return 0;
        })])
        .range(colorbrewer[cbColors][5]);

    svg.select("g.chicago")
      .selectAll("path")
        .data(json.features, function(d) {
          return d.properties.ward + "-" + d.properties.wib_calls;
        })
        .enter().append("path")
          .attr("d", path)
          .attr("fill-opacity", 0.8)
          .attr("stroke", "#6F7070")
          .attr("stroke-opacity", 0.8)
          .attr("stroke-width", 1)
          .attr("fill", function(d) { return color(d.properties.wib_calls);})
          .on("mouseover", function(d){
            return tooltip.style("visibility", "visible")
              .html("<b>Ward</b>: " + d.properties.ward + "<br><b>Count</b>: " + d.properties.wib_calls)
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

  projection = d3.geo.mercator().scale(1).translate([0,0]);
  path = d3.geo.path().projection(projection);
  handleGeoJson('data/chi_wards_wib_calls.geojson');

  d3.csv("data/wib_calls_311_ward_sum.csv", function(r){
    chi_ward_data[r.ward.toString()] = {value: r.wib_calls};
    return r;
  }, function(csv) {
    var map = new Squaire(chi_ward_data, {
      layout: chi_ward_layout,
      labels: chi_ward_labels,
      colors: d3.scale.quantize().domain([0,9678]).range(colorbrewer['OrRd'][5]),
      indexType: "string"
    });
  });
})()
