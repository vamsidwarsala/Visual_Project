const plot_nyc_treemap = {

    init: function (width, height) {
        this.width = width;
        this.height = height;
        var margin = { top: 10, right: 10, bottom: 10, left: 10 },
            width = width - margin.left - margin.right,
            height = height - margin.top - margin.bottom;
        // Prepare our physical space
        var svg = d3.select(".treemap")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)

        var g = svg.append('g');
        // Get the data from our CSV file
        d3.csv('../contributing_factor_vehicle_count.csv', function (error, dataset) {
            if (error) throw error;
            data = d3.stratify()(dataset);
            var total_collisions=0;
            dataset.forEach(element => {
                if(element.count !="" && !isNaN(element.count)){
                 total_collisions+=parseInt(element.count)
                }
            });
            draw_treemap(data,total_collisions);
        });

        function draw_treemap(data,total_collisions) {

            // Declare d3 layout
            var layout = d3.treemap().size([width, height]).paddingInner(2).paddingOuter(4);
            var root = d3.hierarchy(data).sum(function (d) { return d.data.count; });
            var tooltip = d3.select("body")
                .append("div")
                //calling tooltip class in css
                .attr("class", "tooltip")
            var mouse_over = function (element) {
                tooltip.style("opacity", 1)
                    .html("<table bgcolor='FFFFFF'style='border: 1px solid black'><tr><td>" + "<b>Collision Reason</b>" + "<td>" + element.data.id + "</td></tr>" +
                        "<tr><td>" + "<b>Fault type</b>" + "<td>" + element.data.data.parentId + "</td></tr>" +
                        "<tr><td>" + "<b>No of Collisions</b>" + "<td>" + element.data.data.count + "</td></tr>" +
                        "<tr><td>" + "<b>Percentage</b>" + "<td>" + ((Math.round((element.data.data.count / total_collisions) * 10000)) / 100) + '%' + "</td></tr>")
                    .style("left", d3.mouse(this)[0] + 10 + "px")
                    .style("top", d3.mouse(this)[1] + "px")
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
            var nodes = root.leaves();
            var i = -1;
            var node = function (data) {
                i++;
                list = nodes[i].data.id.split(' ');
                var str = ''
                for (var j = 0; j < list.length; j++) {
                    str = str + list[j][0]
                }
                return str
            }
            layout(root);
            g.selectAll('rect').data(nodes).enter().append('rect')
                .on("mouseover", mouse_over)
                .on("mouseleave", mouse_leave)
                .attr('x', function (d) { return d.x0; })
                .attr('y', function (d) { return d.y0; })
                .attr('width', function (d) { return d.x1 - d.x0; })
                .attr('height', function (d) { return d.y1 - d.y0; })
                .style("fill", function (d) {
                    if (d.parent.data.id == "Driver's Fault") {
                        return "green"
                    }
                    else {
                        return "#FF4C33"
                    }
                })
                .style('opacity', 0.8)
            g.selectAll("text")
                .data(nodes)
                .enter()
                .append("text")
                .attr("x", function (d) { return d.x0 + (d.x1 - d.x0) / 2 })
                .attr("y", function (d) { return d.y0 + (d.y1 - d.y0) / 2 })
                .text(node)
                .attr("font-size", function (d) { return (d.x1 - d.x0) / 7 })
                .attr("font-weight", "bold")
                .attr("fill", "white")
                .attr("text-anchor", "middle")
                .style("dominant-baseline", "middle")
        }
    },
}
document.addEventListener("DOMContentLoaded", function (radVizEvent) {
    plot_nyc_treemap.init(1150, 550);
});