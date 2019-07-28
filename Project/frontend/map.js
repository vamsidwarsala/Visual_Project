const plot_nyc_map = {
    init: function (width, height) {

        //The code is referenced from https://stackoverflow.com/questions/35972269/creating-a-d3-map-of-nyc-boroughs-using-js-and-a-geojson-file
        //and http://bl.ocks.org/jhubley/64623ba08c2ee33ca43c

        //Creating the map mercator with center [-73.94, 40.70] which is the center for the new york map
        //The scale helps to position the map
        var nyc_map_projection = d3.geo.mercator()
            .center([-73.94, 40.70])
            .scale(55000)
            .translate([(width) / 2, (height) / 2]);

        var svg = d3.select(".columncenter").append("svg")
            .attr("width", width)
            .attr("height", height);

        //The nyc_data.csv 
        d3.csv("../nyc_data.csv", function (error, collisions) {
            d3.selectAll(".option").on("change", update);
            update();
            //Function update() to add number of injuries or fatalities that have occurred to cyclists, mototrists and pedestrians 
            //when the filter changes
            function update() {
                var choices = [];
                d3.selectAll(".option").each(function (d) {
                    cb = d3.select(this);
                    if (cb.property("checked")) {
                        choices.push(cb.property("value"));
                    }
                });
                var collisions_choices = []
                if (choices.includes('CI')) {
                    for (var i = 0; i < collisions.length; i++) {
                        if (collisions[i]['NUMBER OF CYCLIST INJURED'] > 0) {
                            collisions_choices.push(collisions[i])
                            var cyclist_injured_value = collisions_choices.length
                            document.getElementById("cyclist_injured").innerHTML = cyclist_injured_value;
                        }
                    }
                } else if (choices.includes('CD')) {
                    for (var i = 0; i < collisions.length; i++) {
                        if (collisions[i]['NUMBER OF CYCLIST KILLED'] > 0) {
                            collisions_choices.push(collisions[i])
                            var cyclist_injured_value = collisions_choices.length
                            document.getElementById("cyclist_killed").innerHTML = cyclist_injured_value;
                        }
                    }
                } else if (choices.includes('MI')) {
                    for (var i = 0; i < collisions.length; i++) {
                        if (collisions[i]['NUMBER OF MOTORIST INJURED'] > 0) {
                            collisions_choices.push(collisions[i])
                            var cyclist_injured_value = collisions_choices.length
                            document.getElementById("motorist_injured").innerHTML = cyclist_injured_value;
                        }
                    }
                } else if (choices.includes('MD')) {
                    for (var i = 0; i < collisions.length; i++) {
                        if (collisions[i]['NUMBER OF MOTORIST KILLED'] > 0) {
                            collisions_choices.push(collisions[i])
                            var cyclist_injured_value = collisions_choices.length
                            document.getElementById("motorist_killed").innerHTML = cyclist_injured_value;
                        }
                    }
                }
                else if (choices.includes('PI')) {
                    for (var i = 0; i < collisions.length; i++) {
                        if (collisions[i]['NUMBER OF PEDESTRIANS INJURED'] > 0) {
                            collisions_choices.push(collisions[i])
                            var cyclist_injured_value = collisions_choices.length
                            document.getElementById("pedestrian_injured").innerHTML = cyclist_injured_value;
                        }
                    }
                }
                else if (choices.includes('PD')) {
                    for (var i = 0; i < collisions.length; i++) {
                        if (collisions[i]['NUMBER OF PEDESTRIANS KILLED'] > 0) {
                            collisions_choices.push(collisions[i])
                            var cyclist_injured_value = collisions_choices.length
                            document.getElementById("pedestrian_killed").innerHTML = cyclist_injured_value;
                        }
                    }
                }
                else {
                    for (var i = 0; i < collisions.length; i++) {
                        if (collisions[i]['NUMBER OF PERSONS INJURED'] > 0 || collisions[i]['NUMBER OF PERSONS KILLED'] > 0) {
                            collisions_choices.push(collisions[i])
                            var cyclist_injured_value = collisions_choices.length
                            document.getElementById("people_injured").innerHTML = cyclist_injured_value;
                        }
                    }
                }
                plot_map(collisions_choices)
            }

            //NYC_mapcoordinates.json is taken from http://data.beta.nyc//dataset/3bf5fb73-edb5-4b05-bb29-7c95f4a727fc/resource/6df127b1-6d04-4bb7-b983-07402a2c3f90/download/f4129d9aa6dd4281bc98d0f701629b76nyczipcodetabulationareas.geojson.
            //These coorddinates are used to plot the new york map dataForNewYorkMap
            //The code is referenced from https://stackoverflow.com/questions/35972269/creating-a-d3-map-of-nyc-boroughs-using-js-and-a-geojson-file
            //and http://bl.ocks.org/jhubley/64623ba08c2ee33ca43c
            function plot_map(data) {
                d3.json("../NYC_mapcoordinates.json", function (error, dataForNewYorkMap) {
                    
                    var nycMapCenter = d3.geo.centroid(dataForNewYorkMap);
                    nyc_map_projection.center(nycMapCenter);
                    
                    var path = d3.geo.path().projection(nyc_map_projection);
                    var tooltip = d3.select("body")
                        .append("div")
                        .attr("class", "tooltip_map")
                    var mouse_over = function (element) {
                        tooltip.style("opacity", 1)
                            .html("<table bgcolor='FFFFFF'style='border: 1px solid black'><tr><td>" + "<b>Date</b>" + "<td>" + element.DATE + "</td></tr>" +
                                "<tr><td>" + "<b>Time</b>" + "<td>" + element.TIME + "</td></tr>" +
                                "<tr><td>" + "<b>Location</b>" + "<td>" + '(' + element.LATITUDE + ',' + element.LONGITUDE + ')' + "</td></tr>" +
                                "<tr><td>" + "<b>Streetname</b>" + "<td>" + element['ON STREET NAME'] + "</td></tr>" +
                                "<tr><td>" + "<b>Collision reason</b>" + "<td>" + element['CONTRIBUTING FACTOR VEHICLE 1'] + "</td></tr>" +
                                "<tr><td>" + "<b>Vehicle Involved</b>" + "<td>" + element['VEHICLE TYPE CODE 1'] + "</td></tr>")
                            .style("right", "10px")
                            .style("top", "300px")
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
                    svg.selectAll("path")
                        .data(dataForNewYorkMap.features)
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
                            return nyc_map_projection([d.LONGITUDE, d.LATITUDE])[0]
                        })
                        .attr("cy", function (d) {
                            return nyc_map_projection([d.LONGITUDE, d.LATITUDE])[1]
                        })
                        .attr("r", "1.5px")
                        .attr("fill", "orange")

                    svg.selectAll("circle")
                        .data(data)
                        .exit().remove()
                });
            }

        });
    },
}
document.addEventListener("DOMContentLoaded", function () {
    plot_nyc_map.init(710, 700);
});

