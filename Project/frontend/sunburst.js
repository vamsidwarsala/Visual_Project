const plot_sunburst_map = {
    fullNames: {
        dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    colors: [
        {
            name: "Categorical",
            init: function () {
                var color = d3.scaleOrdinal(d3.schemeCategory10);
                return color;
            }
        }
    ],
    init: function (width, height) {

        const that = this;
        var totalCollisionsByYearAndDay = {};
        //loading dataset
        d3.csv("../nyc_data.csv").then(function (data) {
            totalCollisionsByYearAndDay = that.prepareData(data);
            var yearDropdown = d3.select("#years");
            totalCollisionsByYearAndDay.forEach(element => {
                yearDropdown.append("option")
                    .attr("value", element.year)
                    .text(element.year);
            })
            var findYearAndPlot = function () {
                totalCollisionsByYearAndDay.forEach(element => {
                    if (element.year == document.getElementById("years").value) {
                        collisionsData = element.collisionsData;
                        that.sunburstPlot(collisionsData, width, height);
                    }
                })
            };
            findYearAndPlot();
            yearDropdown.on('change', findYearAndPlot);
        });
    },
    prepareData: function (data) {
        var dateData = [];

        var days = this.fullNames.dayNames;
        data.forEach(element => {
            var date = new Date(element.DATE);
            var hour = parseInt(element.TIME.split(":")[0]);
            dateData.push([date.getFullYear(), element["BOROUGH"].trim(), days[date.getDay()], hour]);
        });

        // calculate number of collisions per region,day and hour
        // counting in JSON form is fast and simple than array
        var totalCollisionsByYearAndDay = dateData.reduce(function (prev, curr) {
            //consider only data that has BOROUGH 
            if (curr[1] != "") {
                // check if year is already in data, if not then create one
                if (prev[curr[0]]) {
                    // check if data for the year has BOROUGH already in data, if not then create one
                    if (prev[curr[0]][curr[1]]) {
                        // check if there is already data for the day of the year and BOROUGH, if not create one
                        if (prev[curr[0]][curr[1]][curr[2]]) {
                            // check if there is already data for the hour of the day, year and BOROUGH, if not create one
                            if (prev[curr[0]][curr[1]][curr[2]][curr[3]]) {
                                // increase the count
                                prev[curr[0]][curr[1]][curr[2]][curr[3]] += 1;
                            } else {
                                prev[curr[0]][curr[1]][curr[2]][curr[3]] = 1;
                            }
                        } else {
                            prev[curr[0]][curr[1]][curr[2]] = {}
                            prev[curr[0]][curr[1]][curr[2]][curr[3]] = 1;
                        }
                    } else {
                        prev[curr[0]][curr[1]] = {}
                        prev[curr[0]][curr[1]][curr[2]] = {}
                        prev[curr[0]][curr[1]][curr[2]][curr[3]] = 1;
                    }
                } else {
                    var day = {};
                    day[curr[1]] = {}
                    day[curr[1]][curr[2]] = {}
                    day[curr[1]][curr[2]][curr[3]] = 1;
                    prev[curr[0]] = day;
                }
            }
            return prev;
        }, {});

        var collisionsData = [];
        //converting the data into parent and child format to use for sun burst
        Object.keys(totalCollisionsByYearAndDay).forEach(year => {
            var collisionsDataBorough = [];
            Object.keys(totalCollisionsByYearAndDay[year]).forEach(borough => {
                var collisionsDataDay = [];
                Object.keys(totalCollisionsByYearAndDay[year][borough]).forEach(day => {
                    var collisionsDataHour = [];
                    Object.keys(totalCollisionsByYearAndDay[year][borough][day]).forEach(hour => {
                        var collisions = totalCollisionsByYearAndDay[year][borough][day][hour]
                        collisionsDataHour.push({ "name": hour, "size": collisions })
                    });
                    collisionsDataDay.push({ "name": day, "children": collisionsDataHour })
                });
                collisionsDataBorough.push({ "name": borough, "children": collisionsDataDay })
            });
            var collisionsDataYear = { "name": "Borough", "children": collisionsDataBorough };
            collisionsData.push({ year: year, collisionsData: collisionsDataYear })
        });
        return collisionsData
    },
    sunburstPlot: function (data, width, height) {
        const that = this;
        var color = that.colors[0].init();
        // to conver the numbers into human readble format i.e instead of 1450 we will show 1,450
        var format = d3.format(",d");

        // create hierarchy data based on size and sorting in descending order in clockwise direction
        var root = d3.hierarchy(data)
            .sum(d => d.size)
            .sort((a, b) => b.value - a.value);

        //data partition
        d3.partition()
            .size([2 * Math.PI, root.height + 1])(root);

        var radius = Math.min(width, height) / 9;   
        //arc for each path
        var arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius * 1.5)
            .innerRadius(d => d.y0 * radius)
            .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))

        root.each(d => d.current = d);

        d3.select("svg").select("g").remove();
        var svg = d3.select("svg")
            .style("width", width)
            .style("height", height)
            .style("font", "10px sans-serif")

        var g = svg.append("g")
            .attr("transform", `translate(${width / 2.2},${height / 2.2})`);

        var path = g.append("g")
            .selectAll("path")
            .data(root.descendants())
            .enter().append("path")
            // to show  last child and parent in same color
            .style("fill", function (d) {
                return color((d.children ? d : d.parent).data.name);
            })
            .attr("fill-opacity", 1)
            .attr("d", d => arc(d.current))
            .style("cursor", "pointer")
            .on("click", clicked);

        path.append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

        var boroughs = [{ "STATEN ISLAND": "SI" }]
        var label = g.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .style("user-select", "none")
            .selectAll("text")
            .data(root.descendants())
            .enter().append("text")
            .attr("dy", "0.35em")
            .attr("fill-opacity", d => labelOpacity(d.current))
            .attr("transform", d => labelPosition(d.current))
            .style("fill", "white")
            .style("font", d => labelFont(d))
            .text(d => d.data.name);

        //center circle
        var center = g.append("g").selectAll("circle")
            .data(root.descendants())
            .enter().append("circle")
            .attr("r", radius)
            .attr("fill", "none")
            .attr("pointer-events", "all")
            .on("click", clicked);

        // zoom function is referenced from https://jsfiddle.net/qo1vwL6k/1/
        function clicked(p) {
            center.datum(p.parent || root);

            // re calculate the traget co-ordinates
            root.each(d => d.target = {
                x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
                y0: Math.max(0, d.y0 - p.depth),
                y1: Math.max(0, d.y1 - p.depth)
            });

            // for smooth tranisition
            const t = g.transition().duration(850);
            // re shaping the arcs with updated center
            path.transition(t)
                .tween("data", d => {
                    const i = d3.interpolate(d.current, d.target);
                    return t => d.current = i(t);
                })
                .attrTween("d", d => () => arc(d.current));

            label.transition(t)
                .attr("fill-opacity", d => labelOpacity(d.target))
                .attrTween("transform", d => () => labelPosition(d.current));
        }

        // decerease font size based on the content
        function labelFont(d) {
            var font = "10px sans-serif"
            boroughs.forEach(element => {
                if (d.data.name == Object.keys(element)) {
                    font = "7px sans-serif"
                }
            })
            return font;
        }

        // to disable labels for the arc that are too small to show labels
        function labelOpacity(d) {
            return ((d.y1 - d.y0) * (d.x1 - d.x0) > 0.05) ? 1 : 0;
        }

        // positions of labels on the arc
        function labelPosition(d) {
            var x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
            var y = (d.y0 + d.y1) / 2 * radius;
            //to center the text of the parent label(in-line)
            if (d.y0 == 0) {
                x = 270
                y = 0;
            }
            return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
        }
    }
}


document.addEventListener("DOMContentLoaded", function () {
    plot_sunburst_map.init(1000, 650);
});