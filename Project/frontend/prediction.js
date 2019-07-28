

const getPrediction = (date, time, latitude, longitude, borough) => {
    const params = new URLSearchParams();
    params.append('date', date)
    params.append('time', time)
    params.append('latitude', latitude)
    params.append('longitude', longitude)
    params.append('borough', borough)
    return fetch('http://127.0.0.1:5000/predict?' + params.toString(), {
        method: 'POST',
    });
}

const plot_nyc_map = {

    init: function (width, height) {
        const that = this;
        d3.csv("../nyc_data.csv", function (collisions) {
            //finding unique boroughs in the dataset
            boroughs = []
            for (i = 0; i < collisions.length; i++) {
                boroughs.push(collisions[i]['BOROUGH'])
            }
            var unique_boroughs = boroughs.filter(function (element, index) {
                return boroughs.indexOf(element) == index;
            })
            unique_boroughs = unique_boroughs.sort();
            that.plotMap(unique_boroughs, width, height);
        });
    },

    plotMap: function (unique_boroughs, width, height) {

        d3.json("../NYC_mapcoordinates.json", function (NYC_MapInfo) {

            var projection = d3.geo.mercator()
                .center([-73.94, 40.70])
                .scale(55000)
                .translate([(width) / 2, (height) / 2]);

            // after loading geojson, use d3.geo.centroid to find out 
            // where you need to center your map
            var center = d3.geo.centroid(NYC_MapInfo);
            projection.center(center);

            // now you can create new path function with 
            // correctly centered projection
            var path = d3.geo.path().projection(projection);

            var svg = d3.select(".prediction_map").append("svg")
                .attr("width", width)
                .attr("height", height);
            // and finally draw the actual polygons
            svg.selectAll("path")
                .data(NYC_MapInfo.features)
                .enter()
                .append("path")
                .attr("d", path)
                .attr("fill", "gray")
                .attr("pointer-events", "all")
                .attr("class", "default")
                .on("click", p => clicked(p));

            function clicked(p) {
                svg.select("circle").remove();
                //finding lat,long from x,y
                var latLong=projection.invert(d3.mouse(svg.node()))
                latitude = latLong[1];
                longitude = latLong[0];
                // check if value is entered properly in the date and time field, if not send alert message
                if (document.getElementById('date').value != "") {
                    // changing the cursor to loading animation
                    svg.selectAll("path").attr("class", "loading")
                    var dateTime = document.getElementById('date').value.split("T")
                    var date = dateTime[0];
                    var time = dateTime[1];
                    var selectedBorough = p.properties.borough
                    var binaryBorough = [];
                    //normalising the borough values
                    unique_boroughs.forEach(borough => {
                        if (borough.toLowerCase() == selectedBorough.toLowerCase()) {
                            binaryBorough.push("1")
                        } else {
                            binaryBorough.push("0")
                        }
                    })
                    // calling the backend to get the predicted values from the model
                    getPrediction(date, time, latitude, longitude, binaryBorough).then((response) => response.json().then(function (data) {
                        collision_predction_percentage = Math.round(parseFloat(data.collision_predction_percentage) * 100)
                        //changing the cursor to default
                        svg.selectAll("path").attr("class", "default")
                        var tooltip = d3.select("body")
                            .append("div")
                            //calling tooltip class in css
                            .attr("class", "tooltip")
                        svg.append("circle")
                            .on("mouseover", function () {
                                tooltip.style("opacity", 1)
                                    .html("<table bgcolor='FFFFFF' style='border: 1px solid black'>" +
                                        "<tr><td>" + "<b>Borough : </b>" + "<td>" + selectedBorough + "</td></tr>" +
                                        "<tr><td>" + "<b>Postal : </b>" + "<td>" + p.properties.postalCode + "</td></tr>" +
                                        "<tr><td>" +
                                        "<b>Collision Prediction Percentage : </b>" + "<td>" + collision_predction_percentage + "% </td></tr>"
                                    )
                                    .style("right", "220px")
                                    .style("top", "400px")
                                //.style("background-color", color.transform(element['quality']))
                                d3.select(this)
                                    .style("stroke", "black")
                                    .style("opacity", 1)
                            })
                            .on("mouseleave", function () {
                                tooltip.style("opacity", 0)
                                d3.select(this)
                                    .style("stroke", "none")
                                    .style("opacity", 0.8)
                            })
                            .attr("cx", function (d) {
                                return projection([longitude, latitude])[0]
                            })
                            .attr("cy", function (d) {
                                return projection([longitude, latitude])[1]
                            })
                            .attr("r", 10)
                            .attr("fill", "orange");
                    }))
                } else {
                    alert("Please Enter Date and Time");
                }
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", function () {

    // disabling the past dates
    var today = new Date();
    var month = today.getMonth() + 1;
    var day = today.getDate();
    var year = today.getFullYear();
    month = (month < 10) ? '0' + month.toString() : month;
    day = (day < 10) ? '0' + day.toString() : day;
    var minDate = year + '-' + month + '-' + day + 'T00:00';
    document.getElementById("date").min = minDate;

    plot_nyc_map.init(800, 700);
});

