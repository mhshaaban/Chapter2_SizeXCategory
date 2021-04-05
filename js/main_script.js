///////////////////////////////////////////////
/////////////// set up SVG ////////////////////
///////////////////////////////////////////////

var margin = {top: 20, right: 10, bottom: 20, left: 250};

var width = 1050,
    height = 625;

var svg = d3.select("body").append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)


///////////////////////////////////////////////
////////////// set up scales //////////////////
///////////////////////////////////////////////

// x-axis will be time, circle radius, circle color, and y-scale for positioning

var sizeScale = d3.scaleLinear()
           .domain([10, 7000])
           .range([0, width - margin.left]);
    
var rScale = d3.scaleSqrt()
    .domain([10, 500, 1000, 2000, 4000, 20000])
    .range([1, 1.25, 2.5, 5, 10, 50]);

var colorScale = d3.scaleLinear()
    .domain([1, 2, 3, 4, 5])
    .range(["#164f3e", "#a1def0", "#d4554c", "#93bf6d", "#440583"]);

var yScale = d3.scaleLinear()
    .domain([1, 5])
    .range([45, 450]);

///////////////////////////////////////////////
/////////////// set up axes ///////////////////
///////////////////////////////////////////////

// set up x-axis
svg.append("g")
    .attr("class", "xaxis")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(d3.axisTop(sizeScale).ticks(4, "f"))
    // get rid of ugpy horizontal line (just want ticks)
    .call(g => g.select(".domain").remove()); 

// set the labels to be used for y-axis
var yLabels = ["Ayyubid",
               "Qalawunid Sultans", 
               "Non-Qalawunid Sultans", 
               "Amir", 
               "Qalawunid Family"];

var yAxis = d3.axisLeft()
              .scale(yScale)
              // manually override for category text
              .tickFormat(function (d) { return yLabels[d-1];})
              // and hide ticks (will use grid lines)
              .tickSize(0);

svg.append("g")
   .attr("class", "yaxis")
   .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
   .call(yAxis)
   // get ride of vertical line
   .call(g => g.select(".domain").remove())
      .selectAll(".tick text")
   

  // add Y gridlines
  svg.append("g") 
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")")    
      .attr("class", "grid")
      .call(d3.axisLeft().scale(yScale).tickSize(-width).tickFormat(""))
      .call(g => g.select(".domain").remove());

///////////////////////////////////////////////
///////// set up force simulations ////////////
///////////////////////////////////////////////

var attractForce = d3.forceManyBody()
                     .strength(100)
                     .distanceMax(35)
                     .distanceMin(2000);

var collisionForce = d3.forceCollide(function(d){ return rScale(d.Ibra + 200);})
                       .strength(.3)
                       .iterations(5);

var simulation = d3.forceSimulation(nodeData)
                   .alphaDecay(0.1)
                   .force("attractForce", attractForce)
                   .force("collisionForce", collisionForce)
                   .force("x", d3.forceX(function(d) { return sizeScale(d.Feddans); }).strength(2))
                   .force("y", d3.forceY(function (d) { return yScale(d.Type); }).strength(1));

// plug in the data
var node = svg.selectAll("circle").data(nodeData)
          .enter().append("circle")
            .attr("class", "main_viz")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
            .attr("r",function(d){ return rScale(d.Ibra);})
            .attr("cx",function(d){ return sizeScale(d.Feddans);})
            .attr("cy", 100)
            .attr("fill",function(d){ return colorScale(d.Type);}).attr("opacity", 0.9)
            .on("mouseover", mouseoverBubble)
            .on("mouseout", mouseoutBubble);


// functions for advancing the force simulation
function ticked(){
     node.attr("cx", function(d){ return d.Feddans;})
         .attr("cy", 100)
 }

simulation.on("tick",ticked);


///////////////////////////////////////////////
/////////////// create legend /////////////////
///////////////////////////////////////////////

var sizeLegend = svg.append("g")
    .attr("class", "size-legend")
    .attr("transform", "translate(" + width/2.5 + "," + (height - margin.top*2.4) + ")");

  sizeLegend.append("text")
    .attr("class", "legend-title")
    .attr("x", 0)
    .attr("y", -35)
    .text("Number of patients in clinical trial(s) supporting approval:");

  var sizeDistance = [-1000, 60, 120, 200, 300]; //moving first one off the viewport on purpose
  sizeLegend.selectAll(".approval-size")
    .data(rScale.range())
    .enter().append("circle")
    .attr("class", "approval-size")
    .attr("cx", function(d,i) { return sizeDistance[i]; })
    .attr("r", function(d) { return d; });

  //Add numbers below
  var sizeFont = [10, 11, 12, 13, 14];
  sizeLegend.selectAll(".approval-legend-value")
    .data(rScale.domain())
    .enter().append("text")
    .attr("class", "approval-legend-value")
    .attr("x", function(d,i) { return sizeDistance[i] ; })
    .attr("y", 45)
    .style("font-size", function(d,i) { return sizeFont[i]; })
    .text(function(d) { return d; })

///////////////////////////////////////////////
/////////////// extra functions ///////////////
///////////////////////////////////////////////

//Returns an event handler for fading non-hovered circles
function fade(opacity) {
  return function(d,i) {
    svg.selectAll("circle.main_viz")
        .filter(function(d) { return d.index != i; })
    .transition()
        .style("opacity", 0.6);
  };
}//fade

//Highlight hovered over bubble
function mouseoverBubble(d,i) {

  svg.selectAll("circle.main_viz")
    .transition().duration(200)
    .style("opacity", 0.45);
  
  d3.select(this)
    .transition().duration(200)
        .style("opacity", 1);

    d3.select("#tooltip")
      .style("left", (d3.event.pageX - 20) + "px")   
      .style("top", (d3.event.pageY + 20) + "px")
      .html('<p class= "tooltip-drugname">' + d.VillageEN + "</p>" +  
        '<p class= "tooltip-description">' + d.Feddans + "</p>" + 
        '<p class= "tooltip-top">' + "Founder " + d.Founder + " | " + d.FoundationYear + "</p>");
    d3.select("#tooltip").classed("hidden", false);

}

function mouseoutBubble(d) {
  
  svg.selectAll("circle")
    .transition()
    .style("opacity", 1);

  d3.select("#tooltip").classed("hidden", true);
}
