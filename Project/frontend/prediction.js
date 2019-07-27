const plot_nyc_map = {

    init: function (width, height) {

        
        var projection = d3.geo.mercator()
            .center([-73.94, 40.70])
            .scale(55000)
            .translate([(width) / 2, (height) / 2]);

        var path = d3.geo.path()
            .projection(projection);



        var svg = d3.select(".columncenter").append("svg")
            .attr("width", width)
            .attr("height", height);
    
        d3.csv("../nyc_data.csv", function (collisions) {
            boroughs = []
            for(i=0;i<collisions.length;i++){
                boroughs.push(collisions[i]['BOROUGH'])
            }
            var unique_burrows = boroughs.filter(function (element, index) {
                return boroughs.indexOf(element) == index;
            })
            var burrowDropdown = d3.select("#borough");

            unique_burrows.forEach(element => {
                burrowDropdown.append("option")
                    .attr("value", element)
                    .text(element);
            })
        });


            function plot(data) {

                d3.json("csvjson.json", function ( NYC_MapInfo) {

                    // after loading geojson, use d3.geo.centroid to find out 
                    // where you need to center your map
                    var center = d3.geo.centroid(NYC_MapInfo);
                    projection.center(center);

                    // now you can create new path function with 
                    // correctly centered projection
                    var path = d3.geo.path().projection(projection);


                    var tooltip = d3.select("body")
                        .append("div")
                        //calling tooltip class in css
                        .attr("class", "tooltip")
                    var mouse_over = function (element) {
                        tooltip.style("opacity", 1)
                            .html("<table bgcolor='FFFFFF'style='border: 1px solid black'><tr><td>" + "<b>Date</b>" + "<td>" + element.DATE + "</td></tr>" +
                                "<tr><td>" + "<b>Time</b>" + "<td>" + element.TIME + "</td></tr>" +
                                "<tr><td>" + "<b>Location</b>" + "<td>" +'('+ element.LATITUDE+','+element.LONGITUDE + ')'+ "</td></tr>" + 
                                "<tr><td>" + "<b>Streetname</b>" + "<td>" +element['ON STREET NAME']+ "</td></tr>" +
                                "<tr><td>" + "<b>Collision reason</b>" + "<td>" +element['CONTRIBUTING FACTOR VEHICLE 1']+ "</td></tr>" +
                                "<tr><td>" + "<b>Vehicle Involved</b>" + "<td>" +element['VEHICLE TYPE CODE 1']+ "</td></tr>")                          

                            // .html("<b>Fault</b> " + element.data.id + "<br>" + 
                            // "Fault type " + element.data.data.parentId + "<br>" +
                            // "Count " + element.data.data.count + "<br>")
                            .style("right", "10px")
                            .style("top", "300px")
                        //.style("background-color", color.transform(element['quality']))
                        d3.select(this)
                            .style("stroke", "black")
                            .style("opacity", 1)
                    }

                    var mouse_leave = function (element) {
                        tooltip.style("opacity", 0)
                        d3.select(this)
                            .style("stroke", "none")
                            .style("opacity", 0.8)
                    }


                    // and finally draw the actual polygons
                    svg.selectAll("path")
                        .data(NYC_MapInfo.features)
                        .enter()
                        .append("path")
                        .attr("d", path)
                        .attr("fill", "gray");

                    svg.selectAll("circle")
                        .data(data).enter()
                        .append("circle")
                        .on("mouseover", mouse_over)
                        .on("mouseleave", mouse_leave)
                        .attr("cx", function (d) {
                            return projection([d.LONGITUDE, d.LATITUDE])[0]
                        })
                        .attr("cy", function (d) {
                            return projection([d.LONGITUDE, d.LATITUDE])[1]
                        })
                        .attr("r", "1.5px")
                        .attr("fill", "orange")
                    
                        svg.selectAll("circle")
                        .data(data)
                        .exit().remove()
                });
            }

      //  });



    },


}
document.addEventListener("DOMContentLoaded", function (radVizEvent) {
    plot_nyc_map.init(800, 700);
});

