import React from 'react';
import * as d3 from 'd3';
import guide from './Guide.css';

class RadarChart extends React.Component {

    componentDidMount() {

        const data = this.props.data;
        const texts = this.props.emotionText;
        const colors = this.props.emotionColors;

        let obj = {};
        data.forEach((e,i)  => {
            obj[i] = 0;
            e.forEach(j => {
                obj[i] += j.value;
            });
            obj[i] = Math.round((obj[i] / texts.length) * 100);
        });

        this.props.valuesCallback(obj[1], obj[0]);

        const id = "#radarchart";

        var color = d3.scaleOrdinal().range(["#CC333F","#00A0B0"]);

        var margin = {top: 32, right: 32, bottom: 32, left: 32};

        var cfg = {
            w: d3.selectAll(id).node().getBoundingClientRect().width - margin.right - margin.left,
            h: 436,		
            margin: margin, 
            levels: 3,			
            maxValue: 1, 		
            labelFactor: 1.12, 
            wrapWidth: 60, 	
            opacityArea: 0.35, 
            dotRadius: 4,		
            opacityCircles: 0.1, 	
            strokeWidth: 2, 	
            roundStrokes: false,	
            color: color
        };
        
        // var maxValue = Math.max(cfg.maxValue, d3.max(data, function(i){return d3.max(i.map(function(o){return o.value;}))}));
            
        var allAxis = (data[0].map(function(i, j){return i.axis})),	
            total = allAxis.length,					
            radius = Math.min(cfg.w/2, cfg.h/2), 	
            Format = function(v) { return Math.round(v * 100) + "%"; },
            angleSlice = Math.PI * 2 / total;		
        
        //Scale for the radius
        var rScale = d3.scaleLinear()
            .range([0, radius])
            .domain([0, cfg.maxValue]);
            
        /////////////////////////////////////////////////////////
        //////////// Create the container SVG and g /////////////
        /////////////////////////////////////////////////////////
    
        //Remove whatever chart with the same id/class was present before
        d3.select(id).select("svg").remove();
        
        //Initiate the radar chart SVG
        var svg = d3.select(id).append("svg")
                .attr("width",  cfg.w + cfg.margin.left + cfg.margin.right)
                .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        //Append a g element		
        var g = svg.append("g")
                .attr("transform", "translate(" + (cfg.w/2 + cfg.margin.left) + "," + (cfg.h/2 + cfg.margin.top) + ")");
        
        /////////////////////////////////////////////////////////
        ////////// Glow filter for some extra pizzazz ///////////
        /////////////////////////////////////////////////////////
        
        //Filter for the outside glow
        var filter = g.append('defs').append('filter').attr('id','glow'),
            feGaussianBlur = filter.append('feGaussianBlur').attr('stdDeviation','2.5').attr('result','coloredBlur'),
            feMerge = filter.append('feMerge'),
            feMergeNode_1 = feMerge.append('feMergeNode').attr('in','coloredBlur'),
            feMergeNode_2 = feMerge.append('feMergeNode').attr('in','SourceGraphic');
    
        /////////////////////////////////////////////////////////
        /////////////// Draw the Circular grid //////////////////
        /////////////////////////////////////////////////////////
        
        //Wrapper for the grid & axes
        var axisGrid = g.append("g").attr("class", "axisWrapper");
        
        //Draw the background circles
        axisGrid.selectAll(".levels")
            .data(d3.range(1,(cfg.levels+1)).reverse())
            .enter()
            .append("circle")
            .attr("class", "gridCircle")
            .attr("r", function(d, i){return radius/cfg.levels*d;})
            .style("fill", "#ffffff")
            .style("stroke", "rgba(0, 0, 0, 0.2)")
            .style("fill-opacity", cfg.opacityCircles)
            .style("filter" , "url(#glow)");
    
        //Text indicating at what % each level is
        axisGrid.selectAll(".axisLabel")
            .data(d3.range(1,(cfg.levels+1)).reverse())
            .enter().append("text")
            .attr("class", "axisLabel")
            .attr("x", 4)
            .attr("y", function(d){return -d*radius/cfg.levels;})
            .attr("dy", "0.4em")
            .style("font-size", "10px")
            .attr("fill", "#000000")
            .text(function(d,i) { return Format(cfg.maxValue * d/cfg.levels); });
    
        /////////////////////////////////////////////////////////
        //////////////////// Draw the axes //////////////////////
        /////////////////////////////////////////////////////////
        
        //Create the straight lines radiating outward from the center
        var axis = axisGrid.selectAll(".axis")
            .data(allAxis)
            .enter()
            .append("g")
            .attr("class", "axis");
        //Append the lines
        axis.append("line")
            .attr("x1", 0)
            .attr("y1", 0)
            .attr("x2", function(d, i){ return rScale(cfg.maxValue*1.1) * Math.cos(angleSlice*i - Math.PI/2); })
            .attr("y2", function(d, i){ return rScale(cfg.maxValue*1.1) * Math.sin(angleSlice*i - Math.PI/2); })
            .attr("class", "line")
            .style("stroke", function(d){
                const idx = texts.findIndex(e => {
                    return e === d;
                });
                return colors[idx];
            })
            .style("stroke-width", "1px");
    
        //Append the labels at each axis
        axis.append("text")
            .attr("class", "legend")
            .style("font-size", "11px")
            .style("font-weight", "800")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .attr("x", function(d, i){ return rScale(cfg.maxValue * cfg.labelFactor) * Math.cos(angleSlice*i - Math.PI/2); })
            .attr("y", function(d, i){ return rScale(cfg.maxValue * cfg.labelFactor) * Math.sin(angleSlice*i - Math.PI/2); })
            .text(function(d){return d})
            .attr("fill", function(d) {
                const idx = texts.findIndex(e => {
                    return e === d;
                });
                return colors[idx];
            })
            .call(wrap, cfg.wrapWidth);
    
        /////////////////////////////////////////////////////////
        ///////////// Draw the radar chart blobs ////////////////
        /////////////////////////////////////////////////////////
        
        //The radial line function
        var radarLine = d3.lineRadial()
            //.interpolate("linear-closed")
            .radius(function(d) { return rScale(d.value); })
            .angle(function(d,i) {	return i*angleSlice; })
            .curve(d3.curveCardinalClosed);
            
        if(cfg.roundStrokes) {
            radarLine.interpolate("cardinal-closed");
        }
                    
        //Create a wrapper for the blobs	
        var blobWrapper = g.selectAll(".radarWrapper")
            .data(data)
            .enter().append("g")
            .attr("class", "radarWrapper");
                
        //Append the backgrounds	
        blobWrapper
            .append("path")
            .attr("class", "radarArea")
            .attr("d", function(d,i) { return radarLine(d); })
            .style("fill", function(d,i) { return cfg.color(i); })
            .style("fill-opacity", cfg.opacityArea)
            .on('mouseover', function (d,i){
                d3.selectAll(".radarArea")
                    .transition().duration(200)
                    .style("fill-opacity", 0.1); 
                //Bring back the hovered over blob
                d3.select(this)
                    .transition().duration(200)
                    .style("fill-opacity", 0.7);	
            })
            .on('mouseout', function(){
                //Bring back all blobs
                d3.selectAll(".radarArea")
                    .transition().duration(200)
                    .style("fill-opacity", cfg.opacityArea);
            });
            
        //Create the outlines	
        blobWrapper.append("path")
            .attr("class", "radarStroke")
            .attr("d", function(d,i) { return radarLine(d); })
            .style("stroke-width", cfg.strokeWidth + "px")
            .style("stroke", function(d,i) { return cfg.color(i); })
            .style("fill", "none")
            .style("filter" , "url(#glow)");		
        
        //Append the circles
        blobWrapper.selectAll(".radarCircle")
            .data(function(d,i) { return d; })
            .enter().append("circle")
            .attr("class", "radarCircle")
            .attr("r", cfg.dotRadius)
            .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
            .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
            .style("fill", function(d,i,j) { return cfg.color(j); })
            .style("fill-opacity", 0.8);
    
        /////////////////////////////////////////////////////////
        //////// Append invisible circles for tooltip ///////////
        /////////////////////////////////////////////////////////
        
        //Wrapper for the invisible circles on top
        var blobCircleWrapper = g.selectAll(".radarCircleWrapper")
            .data(data)
            .enter().append("g")
            .attr("class", "radarCircleWrapper");
            
        //Append a set of invisible circles on top for the mouseover pop-up
        blobCircleWrapper.selectAll(".radarInvisibleCircle")
            .data(function(d,i) { return d; })
            .enter().append("circle")
            .attr("class", "radarInvisibleCircle")
            .attr("r", cfg.dotRadius*1.5)
            .attr("cx", function(d,i){ return rScale(d.value) * Math.cos(angleSlice*i - Math.PI/2); })
            .attr("cy", function(d,i){ return rScale(d.value) * Math.sin(angleSlice*i - Math.PI/2); })
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", function(d,i) {
                let newX =  parseFloat(d3.select(this).attr('cx')) - 10;
                let newY =  parseFloat(d3.select(this).attr('cy')) - 10;
                        
                tooltip
                    .attr('x', newX)
                    .attr('y', newY)
                    .text(Format(d.value))
                    .transition().duration(200)
                    .style('opacity', 1);
            })
            .on("mouseout", function(){
                tooltip.transition().duration(200)
                    .style("opacity", 0);
            });
            
        //Set up the small tooltip for when you hover over a circle
        var tooltip = g.append("text")
            .attr("class", "tooltip")
            .style("opacity", 0);
        
        /////////////////////////////////////////////////////////
        /////////////////// Helper Function /////////////////////
        /////////////////////////////////////////////////////////
    
        function wrap(text, width) {
            text.each(function() {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.4, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");
                
            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
            });
        }
    }

    render () {

        return (
            <React.Fragment>
                <div id="radarchart"></div>
            </React.Fragment>
        );
    }
}

export default RadarChart;