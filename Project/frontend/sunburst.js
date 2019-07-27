const plot_nyc_map = {
    fullNames: {
        dayNames: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    },
    colors: [
        {
            name: "Categorical",
            init: function (data) {
                var color = d3.scaleOrdinal(d3.schemeCategory10).domain(data.map(d => d.streetName));
                return color;
            }
        }
    ],
    init: function (width, height) {
        this.width = width;
        this.height = height;

        const that = this;
        var totalCollisionsByYearAndDay = {};
        //loading dataset
        d3.csv("../nyc_data.csv").then(function (data) {
            totalCollisionsByYearAndDay = that.prepareData(data);
           // console.log(totalCollisionsByYearAndDay);
            var year = 2019;
            var collisionsData = [];
            totalCollisionsByYearAndDay.forEach(element => {
                if (element.year == year) {
                    collisionsData = element.collisionsData;
                }
            })
            that.scatterPlot(collisionsData, year, width, height);

        });
    },

    prepareData: function (data) {

        var dateData = [];
        data.forEach(element => {
            var date = new Date(element.DATE);
            var hour = parseInt(element.TIME.split(":")[0]);
            dateData.push([date.getFullYear(), element["BOROUGH"].trim(), date.getDay(), hour]);
        });
        var days = this.fullNames.dayNames;

        var totalCollisionsByYearAndDay = dateData.reduce(function (prev, curr) {
            if (curr[1] != "") {
                if (prev[curr[0]]) {
                    if (prev[curr[0]][curr[1]]) {
                        if (prev[curr[0]][curr[1]][days[curr[2]]]) {
                            if (prev[curr[0]][curr[1]][days[curr[2]]][curr[3]]) {
                                prev[curr[0]][curr[1]][days[curr[2]]][curr[3]] += 1;
                            } else {
                                prev[curr[0]][curr[1]][days[curr[2]]][curr[3]] = 1;
                            }
                        } else {
                            prev[curr[0]][curr[1]][days[curr[2]]] = {}
                            prev[curr[0]][curr[1]][days[curr[2]]][curr[3]] = 1;
                        }
                    } else {
                        prev[curr[0]][curr[1]] = {}
                        prev[curr[0]][curr[1]][days[curr[2]]] = {}
                        prev[curr[0]][curr[1]][days[curr[2]]][curr[3]] = 1;
                    }
                } else {
                    var day = {};
                    day[curr[1]] = {}
                    day[curr[1]][days[curr[2]]] = {}
                    day[curr[1]][days[curr[2]]][curr[3]] = 1;
                    prev[curr[0]] = day;
                }
            }
            return prev;
        }, {});

        var collisionsData = [];
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
    scatterPlot: function (data, year, width, height) {
        //console.log(data);
        //console.log("In Plot");
        //var margin = { top: 20, right: 20, bottom: 30, left: 40 };
        var radius = Math.min(width, height) / 2;
        var color = d3.scaleOrdinal(d3.schemeCategory10);

        // Create primary <g> element
        var svg = d3.select('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', 'translate(' + width / 2 + ',' + height / 2 + ')')
            .style("font", "10px sans-serif");

        // Data strucure
        var partition = d3.partition()
            .size([2 * Math.PI, radius]);

        // Find data root
        var root = d3.hierarchy(data)
            .sum(function (d) { return d.size });

        var boroughs = [{ "STATEN ISLAND": "SI" }]
        // Size arcs
        partition(root);
        format = d3.format(",d")
        var arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
            .padRadius(radius / 2)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1 - 1)

        svg.selectAll('path')
            .data(root.descendants().filter(d => d.depth))
            .enter().append("path")
            .attr("d", arc)
            .style('stroke', '#fff')
            .style("fill", function (d) { return color((d.children ? d : d.parent).data.name); })
            .append("title")
            .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);

        svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(root.descendants().slice(1))
            .enter().append("text")
            .attr("transform", function (d) {
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = (d.y0 + d.y1) / 2;
                return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            })
            .attr("dy", "0.35em")
            .style("font", function (d) {
                var font = "10px sans-serif"
                boroughs.forEach(element => {
                    if (d.data.name == Object.keys(element)) {
                        font = "7px sans-serif"
                    }
                })
                if (d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) < 10) {
                    //console.log((d.y0 + d.y1) / 2 * (d.x1 - d.x0), d.data.name, "check");
                    fontsize = Math.floor((d.y0 + d.y1) / 2 * (d.x1 - d.x0))
                    font = fontsize + "px sans-serif"
                }
                return font
            })
            .text(d => d.data.name);
      
    }
}



document.addEventListener("DOMContentLoaded", function (radVizEvent) {
    plot_nyc_map.init(1000, 550);
});