var svg, width, height, projection, path, ward_data, ward_points;
var transitionTime = 2000;
var cbColors = "OrRd";


// Pulled from Mike Bostock example here: https://bl.ocks.org/mbostock/3916621
// Example without continuous update: http://bl.ocks.org/sarahob/707cb381d48f57abba57
function pathTween(d1, precision) {
  return function() {
    var path0 = this,
        path1 = path0.cloneNode(),
        n0 = path0.getTotalLength(),
        n1 = (path1.setAttribute("d", d1), path1).getTotalLength();

    // Uniform sampling of distance based on specified precision.
    var distances = [0], i = 0, dt = precision / Math.max(n0, n1);
    while ((i += dt) < 1) distances.push(i);
    distances.push(1);

    // Compute point-interpolators at each distance.
    var points = distances.map(function(t) {
      var p0 = path0.getPointAtLength(t * n0),
          p1 = path1.getPointAtLength(t * n1);
      return d3.interpolate([p0.x, p0.y], [p1.x, p1.y]);
    });

    return function(t) {
      return t < 1 ? "M" + points.map(function(p) { return p(t); }).join("L") : d1;
    };
  };
}

function transitionShapes(el, tween){
	 d3.select(el)
		.transition()
		.duration(transitionTime)
    .attr("fill-opacity", 0.8)
    .ease(d3.easeCubic)
		.attrTween('d', pathTween(tween, 7));
}

function explodeShape() {
  svg.select("g.points").selectAll("path.points")
    .each(function(d) { transitionShapes(this, path(d)); });
}

function handlePointGeoJson(json) {
  var bounds = path.bounds(ward_data);
  var s = 0.95 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
  var t = [(width - s * (bounds[1][0] + bounds[0][0])) / 2, (height - s * (bounds[1][1] + bounds[0][1])) / 2];
  projection.scale(s).translate(t);


  var g = svg.select("g.chicago");
  var clip = g.append("clipPath")
      .attr("id", "ward-clip")
    .append("path")
      .attr("d", function() { return path(ward_data.features[0]); });

  var dPath = d3.path();
  dPath.arc(width/2, height/2, height/2, 0, Math.PI*2);
  // Create separate path function with larger points
  var hidePath =  d3.geoPath().projection(projection).pointRadius(function(d) { return 40; });
  g.append("g")
    .attr("class", "points")
    .selectAll("path.points")
      .data(json.features, function(d, i) {return i;})
      .enter().append("path")
        .attr("class", "points")
        .attr("clip-path", "url(#ward-clip)")
        .attr("d", hidePath)
        .attr("fill", "#b30000");
}

(function() {
  bbox = document.getElementsByTagName("svg")[0].getBoundingClientRect();
  width = bbox.width;
  height = bbox.height;
  svg = d3.select("svg");

  svg.append("g").attr("class", "chicago");
  projection = d3.geoMercator().scale(1).translate([0,0]);
  path = d3.geoPath().projection(projection);

  d3.queue()
    .defer(d3.json, "data/chi_single_ward.geojson")
    .defer(d3.json, "data/ward_46_pts.geojson")
    .await(function(error, ward, points) {
      ward_data = ward;
      ward_points = points;
      ward_points['features'] = ward_points['features'].slice(0, 200);
      handlePointGeoJson(ward_points);
    });
})()
