(function() {
  var map = L.map('map');
  var layer = Tangram.leafletLayer({
      scene: 'data/isr.yaml',
      attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>'
  });
  layer.addTo(map);
  map.setView([41.8847,-87.7146], 11);

  // Resize map to window
  function resizeMap() {
      document.getElementById('map').style.width = window.innerWidth + 'px';
      document.getElementById('map').style.height = window.innerHeight + 'px';
      map.invalidateSize(false);
  };

  var scene = layer.scene;

  d3.csv("data/contact_cards.csv", function(cards) {
    // var projection = d3.geoMercator().scale(1).translate([0,0]);
    // var path = d3.geoPath().projection(projection);
    var bbox = [[-87.9395, 41.6446], [-87.5245, 42.0229]];
    cards = cards.filter(function(d) { return d.lon !== "" && d.lat !== ""; });
    cards.forEach(function(d) { d[0] = +d.lon, d[1] = +d.lat; });

    var hexbin = d3.hexbin()
      .size([1,1])
      .radius(0.01);

    var hexbinData = hexbin(cards).sort(function(a, b) { return b.length - a.length; });
    var hexLoc = hexbin.hexagon(0.008,0.008);
    var useVal = {x: hexbinData[0].x, y: hexbinData[0].y};
    var geom = [];
    var hexSplit = hexLoc.substr(1, hexLoc.length-2).split("l");
    var movement = [];
    hexSplit.forEach(function(d) {
      var item = d.split(",");
      movement.push([+item[0], +item[1]]);
    });

    var geoJ = {"type": "FeatureCollection", "features": []};
    hexbinData.forEach(function(d) {
      var dVal = {x: d.x, y: d.y};
      var geom = [];
      movement.forEach(function(m) {
        dVal = {x: dVal.x+m[0], y: dVal.y+m[1]};
        geom.push([dVal.x, dVal.y]);
      });
      geom.push(geom[0]);

      geoJ.features.push({
        type: "Feature",
        properties: {cards: d.length},
        geometry: {type: "Polygon", coordinates: [geom]}
      });
    });
    scene.setDataSource('hexbin', { type: 'GeoJSON', data: geoJ }); });
})()
