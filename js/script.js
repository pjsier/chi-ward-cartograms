// Pulled from cartograms/chi_ward_cartogram_layout.json
// Created with http://code.minnpost.com/aranger/ and Squaire WSJ library
var chi_ward_layout = [[0,0,"41"],[3,0,"50"],[4,0,"49"],[1,1,"45"],[2,1,"39"],[3,1,"40"],[4,1,"48"],[0,2,"38"],[1,2,"30"],[2,2,"35"],[3,2,"33"],[4,2,"47"],[5,2,"46"],[1,3,"29"],[2,3,"36"],[3,3,"31"],[4,3,"32"],[5,3,"44"],[2,4,"37"],[3,4,"26"],[4,4,"1"],[5,4,"2"],[6,4,"43"],[3,5,"24"],[4,5,"28"],[5,5,"27"],[6,5,"42"],[3,6,"22"],[4,6,"12"],[5,6,"25"],[6,6,"11"],[1,7,"23"],[2,7,"14"],[3,7,"16"],[4,7,"15"],[5,7,"20"],[6,7,"3"],[7,7,"4"],[2,8,"13"],[3,8,"18"],[4,8,"17"],[5,8,"21"],[6,8,"6"],[7,8,"5"],[4,9,"19"],[5,9,"34"],[6,9,"8"],[7,9,"7"],[6,10,"9"],[7,10,"10"]];
var SQ_SIZE = 50;
var ease = d3.easeQuadInOut;
var transitionTime = 500;
var transitionDelay = 15;
var projection, path, geoData, centered, maxData, svg;
var active = d3.select(null);

// Margin convention from https://bl.ocks.org/mbostock/3019563
var margin = {top: 20, right: 10, bottom: 20, left: 10};
var width = 550 - margin.left - margin.right;
var height = 650 - margin.top - margin.bottom;
var svg = d3.select("#map-container")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

function convertRectPath(x, y, w, h) {
  return "M" + [[x,y], [x+w,y], [x+w, y+h], [x, y+h], [x,y]].join("L");
}

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

// Zoom to ward on click, pulled from https://bl.ocks.org/mbostock/4699541
function reset() {
  active.classed("active", false);
  active = d3.select(null);

  svg.transition()
    .duration(transitionTime)
    .style("stroke-width", "1.5px")
    .attr("transform", "");
}

function clicked(d) {
  if (active.node() === this) return reset();
  active.classed("active", false);
  active = d3.select(this).classed("active", true);

  var bounds = path.bounds(d),
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .9 / Math.max(dx / width, dy / height),
      translate = [width / 2 - scale * x, height / 2 - scale * y];

  svg.transition()
    .duration(transitionTime)
    .style("stroke-width", 1.5 / scale + "px")
    .attr("transform", "translate(" + translate + ")scale(" + scale + ")");
}

function transitionShapes(el, idx, tween){
	 d3.select(el)
		.transition()
    .delay(idx*transitionDelay)
		.duration(transitionTime)
    .ease(ease)
		.attrTween('d', pathTween(tween, 5));
}

function drawCartogram(el, data, w, h){
  var color = d3.scaleQuantize().domain([0,maxData]).range(colorbrewer['OrRd'][5]);
  var g = el.append("g");
    g.selectAll("path")
      .data(data)
      .enter().append("path")
        .attr("d", function(d){return convertRectPath(d.x*w, d.y*h, w, h);})
        .attr("fill", function(d){return color(d.val);});

  var textG = el.append("g");
  textG.selectAll("text")
    .data(data)
    .enter().append("text")
    .attr("x", function(d) { return (d.x*w)+(w/2); })
    .attr("y", function(d) { return (d.y*h)+(h/2); })
    .text(function(d){ return d.properties.ward; });
};

function toWards() {
  if (centered) {
    clicked();
  }

  svg.selectAll("g path")
    .style("opacity", "1")
    .each(function(d, i) { transitionShapes(this, i, path(d)); })
    .on("click", clicked);

  svg.selectAll("g text")
    .transition()
    .delay(function(d, i) { return i*transitionDelay; })
    .duration(transitionTime)
    .ease(ease)
    .attr("x", function(d) { return path.centroid(d)[0]; })
    .attr("y", function(d) { return path.centroid(d)[1]; });
}

function toSquares() {
  if (centered) {
    clicked();
  }

  svg.selectAll("g path")
    .each(function(d, i) { transitionShapes(this, i, convertRectPath(d.x*SQ_SIZE, d.y*SQ_SIZE, SQ_SIZE, SQ_SIZE)); })
    .on("click", null);

  svg.selectAll("g text")
    .transition()
    .delay(function(d, i) { return i*transitionDelay; })
    .duration(transitionTime)
    .ease(ease)
    .attr("x", function(d) { return (d.x*SQ_SIZE)+25; })
    .attr("y", function(d) { return (d.y*SQ_SIZE)+25; });
}

function toBars() {
  if (centered) {
    clicked();
  }

  var y = d3.scaleLinear().range([width-50, 0]);
  var x = d3.scaleBand().rangeRound([0, height], .1);
  y.domain([0, maxData]);
  x.domain(geoData.map(function(d) { return d.properties.ward; }));

  svg.selectAll("g path")
    .each(function(d, i) {
      transitionShapes(this, i, convertRectPath(25, x(d.properties.ward), width-y(d.val), x.bandwidth()));
    })
    .on("click", null);

  svg.selectAll("g text")
    .transition()
    .delay(function(d, i) { return i*transitionDelay; })
    .duration(transitionTime)
    .ease(ease)
    .attr("x", 10)
    .attr("y", function(d) { return x(d.properties.ward)+(x.bandwidth()/2); });
}

(function() {
  projection = d3.geoMercator().scale(1).translate([0,0]);
  path = d3.geoPath().projection(projection);

  d3.queue()
    .defer(d3.json, "data/chi_wards_wib_calls.geojson")
    .await(function(error, json) {
      var bounds = path.bounds(json);
      var s = 0.95 / Math.max((bounds[1][0] - bounds[0][0]) / width, (bounds[1][1] - bounds[0][1]) / height);
      var t = [(width - s * (bounds[1][0] + bounds[0][0])) / 2, (height - s * (bounds[1][1] + bounds[0][1])) / 2];
      projection.scale(s).translate(t);

      maxData = d3.max(json.features, function(d) { return d.properties.wib_calls; });
      geoData = json.features.map(function(d) {
        var wardRow = chi_ward_layout.filter(function(w) { return w[2] === d.properties.ward; });
        if (wardRow.length) {
          d.x = wardRow[0][0];
          d.y = wardRow[0][1];
          d.val = d.properties.wib_calls;
        }
        return d;
      });
      // Sort on ward strings
      geoData = geoData.sort(function(a, b) {
        a = parseInt(a.properties.ward);
        b = parseInt(b.properties.ward);
        if (a < b) {
          return -1;
        }
        else if (a > b) {
          return 1;
        }
        return 0;
      });

      drawCartogram(svg, geoData, SQ_SIZE, SQ_SIZE);
    });
})()
