import React from 'react';
import * as d3 from 'd3';
import guide from './Guide.css';

class RadialStackedBarChart extends React.Component {

    componentDidMount() {

        const user = this.props.data.uid;
        // const ptt1 = this.props.personal_tooltip_1;
        // const ptt2 = this.props.personal_tooltip_2;
        // const tt1 = this.props.tooltip_1;
        // const tt2 = this.props.tooltip_2;
        const tmean = this.props.mean;
        const emotions = this.props.emotionNames;
        const texts = this.props.emotionText;
        const colors = this.props.emotionColors;
        const data = [];
        const speakperid = [];
        let userindex = -1;
        let sum = 0;
        let refid = -1;
        let obj = {};
        this.props.data.values.forEach(e => {
            if (e.id !== refid) {
                const keys = Object.keys(obj);
                if (keys.length > 0) {
                    this.props.emotionNames.forEach(en => {
                        if (!keys.includes(en)) {
                            obj[en] = 0;
                        }
                    });
                    data.push({...obj});
                    speakperid.push(sum);
                }
                sum = 0;
                obj = {}
                refid = e.id;
                obj['id'] = e.id;
                if (e.id === user) {
                    userindex = data.length;
                }
            }
            obj[e.emotion] = parseInt(e.value);
            sum += parseInt(e.value);
        });

        const userperformance = userindex !== -1 ? speakperid[userindex] : 0;
        let betterthan = 0;
        speakperid.forEach((e,i) => {
            if (i !== userindex) {
                if (e < userperformance) {
                    betterthan += 1;
                }
            } else {
                betterthan += 1;
            }
        });
        const percbetterperf = Math.round((betterthan / speakperid.length) * 100);
        data.sort((a,b) => {
            let suma = 0;
            let sumb = 0;
            emotions.forEach(e => {
                suma += a[e];
                sumb += b[e];
            });
            if (suma === sumb) {
                if (a.id === user) return -1;
                else if (b.id === user) return 1;
                else return -1;
            } else {
                return suma >= sumb ? -1 : 1;
            }
        });
        console.log(data)

        
        
        var width = d3.selectAll("#radialstackedbarchart").node().getBoundingClientRect().width,
        height = 500,
        innerRadius = 80,
        outerRadius = Math.min(width, height) / 2;
        
        var svg = d3.select('#radialstackedbarchart')
        .append("svg")
        .attr("width", width/* + margin.left + margin.right*/)
        .attr("height", height/* + margin.top + margin.bottom*/)
        .style("transform", "rotate(-80deg)")
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + ( height / 2 )+ ")")
        
        
        var x = d3.scaleBand()
        .range([0, 2 * Math.PI])
        .align(0);
        
        var y = d3.scaleLinear()
        .range([innerRadius, outerRadius]);
        
        var z = d3.scaleOrdinal()
        .range(colors);
        
        var zClasses = texts;
        
        var keys = emotions;
        var meanSpeak = d3.mean(data, function(d) { return d3.sum(keys, function(key) { return d[key]; }); })
        this.props.valuesCallback(userperformance, percbetterperf, meanSpeak);

        var maxY = d3.max(data, function(d) { 
            let m = 0;
            emotions.forEach(e => {
                m += d[e];
            }); 
            return m;
        });


        var Tooltip = d3.select("body").append("div")
            .attr("class", guide.Tooltip)
            .style("opacity", 0)
            .style("font-size", "15px")
            .style("padding", "8px")
            .style("max-width", "128px")
            .style("text-align", "center");

        var mover = function(d) {
            let total = 0;
            [...Object.keys(d.data)].forEach(e => {
                if (e !== 'id') total += d.data[e];
            });
            Tooltip.transition()
                .duration(200)
                .style("opacity", 1);
            Tooltip.html(user === d.data.id ? 
                            ptt1 + total + ptt2
                            :
                            d.data.id + tt1 + total + tt2)
                .style("left", (d3.event.pageX + 16) + "px")
                .style("top", (d3.event.pageY - 24) + "px");
        } 

        var mmove = function(d) {
            let total = 0;
            [...Object.keys(d.data)].forEach(e => {
                if (e !== 'id') total += d.data[e];
            });
            Tooltip
                .html(user === d.data.id ? 
                        'Hai effettuato ' + total + ' registrazioni!'
                        :
                        d.data.id + ' ha effettuato ' + total + ' registrazioni!')
                .style("left", (d3.event.pageX + 16) + "px")
                .style("top", (d3.event.pageY - 24) + "px")
        }

        var mleave = function(d) {
            Tooltip.transition()
                .duration(500)
                .style("opacity", 0);
        }


        x.domain(data.map(function(d) { return d.id; }));
        y.domain([0, maxY]);
        z.domain(keys);
        
        // Accidents
        svg.append('g')
            .selectAll("g")
            .data(d3.stack().keys(keys)(data))
            .enter().append("g")
            .attr("fill", function(d) { return z(d.key); })
            .selectAll("path")
            .data(function(d) { return d; })
            .enter().append("path")
            .style("opacity", function(d){
                if (d.data.id === user) return 1;
                else return 0.6;
            })
            .attr("d", d3.arc()
                .innerRadius(function(d) { return y(d[0]); })
                .outerRadius(function(d) { return y(d[1]); })
                .startAngle(function(d) { return x(d.data.id); })
                .endAngle(function(d) { return x(d.data.id) + x.bandwidth(); })
                .padAngle(0.05)
                .padRadius(innerRadius))
            .on("mouseover", mover) 
            .on("mousemove", mmove)
            .on("mouseout", mleave)

        var yAxis = svg.append("g")
            .attr("text-anchor", "middle");

        var yTicksValues = d3.ticks(0, maxY, 4);

        var yMeanTick = yAxis
            .append("g")
            .datum([meanSpeak]);

        yMeanTick.append("circle")
            .attr("fill", "none")
            .attr("stroke", "rgba(0, 0, 0, 0.3)")
            .attr("stroke-dasharray", "8 3")
            .attr("r", y)
            .on("mouseover", function(d){
                Tooltip.transition()
                    .duration(200)
                    .style("opacity", 1);
                Tooltip.html(tmean + parseFloat(meanSpeak).toFixed(2))
                    .style("left", (d3.event.pageX + 16) + "px")
                    .style("top", (d3.event.pageY - 24) + "px")
            })
            .on("mouseout", function(d){
                Tooltip.transition()
                    .duration(500)
                    .style("opacity", 0);
            })

    }

    render () {

        return (
            <React.Fragment>
                <div id="radialstackedbarchart"></div>
            </React.Fragment>
        );
    }
}

export default RadialStackedBarChart;