
var width = 960,
    height = 750;

var threshold = 50; 
var initCharge = -25


function initializeSliders() {
	$( "#CorrSlider" ).slider({max: 100, min: 40, animate: "slow", 
                      value: threshold,
                      change: function(event, ui) {
                      threshold = ui.value;
                      console.log(threshold)
                      filt_links = data.links.filter(function(element){ 
                                      var sourceindex = 0
                                      var targetindex = 0
                                      if (typeof element.source=="number") {sourceindex = element.source}
                                      else {sourceindex = element.source.name}
                                      if (typeof element.target=="number") {targetindex = element.target}
                                      else {targetindex = element.target.name}
                                      return(element.value >= threshold && 
                                              node_dict[sourceindex] == 1 &&
                                              node_dict[targetindex] == 1)})
                      console.log("filt_links", filt_links.length)  
                      RedrawGraph()
                    }
                  });

	$( "#RepulsionSlider" ).slider({max: 200, min: 5, animate: "slow", 
	                      value: -initCharge,
	                      change: function(event, ui) {
	                        force.charge(-ui.value);
	                        RedrawGraph()
	                       }
	                  });



	// $( "#LevelSlider" ).slider({min: 0, animate: "slow", step: 1,
	//                       value: 0,
	//                       change: function(event, ui) {
	//                         force.charge(-ui.value);
	//                         RedrawGraph()
	//                        }
	//                   });

	$( "#LevelSlider" ).slider({min: 0, animate: "slow",
	                            step: 1, value: 0, 
	                            change: function(event, ui) {
	                                level = ui.value;
	                                console.log("level", level)
	                                console.log("nodes.length", data.nodes.length)
	                                for(var i=0; i < data.nodes.length; i++) {
	                                  if (data.nodes[i]['group'] == level) {
	                                    node_dict[i] = 1
	                                  } else {
	                                      node_dict[i] = 0
	                                  }
	                                  
	                                }
	                                FilterNodesAndLinks()
	                                RedrawGraph() 
	                           } 
	                          });

}

$(function() {
	initializeSliders();
	console.log('inside matrix.js')

	var color = d3.scale.category10();

	var force = d3.layout.force()
	    .charge(initCharge)
	    .linkDistance(30)
	    .size([width, height]);

	var svg = d3.select("#graphPlot").append("svg")
	    .attr("width", width)
	    .attr("height", height);

	var data  = 0
	d3.json("nodelinks.json", function(error, graph) {
	  data = graph
	  node_dict = {}
	  for(var i = 0; i < graph.nodes.length; i++)
	  {
	    if(graph.nodes[i].group == 0) {
	      node_dict[graph.nodes[i].name] = 1;
	    } else {
	      node_dict[graph.nodes[i].name] = 0;
	    }
	  }
	  console.log("node_dict", node_dict)

	  force
	      .nodes(data.nodes)
	      .links(data.links)
	      .start();

	  FilterNodesAndLinks(data)

	  console.log(filt_nodes)
	  $( "#LevelSlider" ).slider( "option", "max", data.nodes[data.nodes.length - 1]['group'] );

	  RedrawGraph(force, svg, color)  
	});
});


function FilterNodesAndLinks(data)
{
  filt_nodes = data.nodes.filter(function(element) {
          return(node_dict[element.name] == 1)});
  filt_links = data.links.filter(function(element){
          var sourceindex = 0
          var targetindex = 0
          if (typeof element.source=="number" || typeof element.source=="string") {sourceindex = element.source}
          else {sourceindex = element.source.name}
          if (typeof element.target=="number" || typeof element.source=="string") {targetindex = element.target}
          else {targetindex = element.target.name}
          return(element.value >= threshold && 
                  node_dict[sourceindex] == 1 &&
                  node_dict[targetindex] == 1)});
  console.log("filt_nodes", filt_nodes.length, filt_nodes)
}

function RedrawGraph(force, svg, color)
{
  force
      .nodes(filt_nodes)
      .links(filt_links)
      .start();

      var node = svg.selectAll("circle.node")
          .data(filt_nodes)

      node.enter().append("circle")
        .attr("class", "node")
        .attr("cx", function(d) {console.log("parent", d.children[0].x); return d.parent.x})
        .attr("cy", function(d) {return d.parent.y})
        .attr("r", function(d) {console.log("size", d.size); return (d.size+ 3)/5 + 4})
        //.style("fill", function(d) { if (node_dict[d.name] == 0) {return #fff} else {return color(d.group) })
        .style("fill", function(d) { return color(d.group) } )
        .on("click", click)
        .call(force.drag);

      node.append("title")
        .text(function(d) { return d.name; });

      node.transition()
        .attr("class", "node")
        .attr("r", function(d) {return (d.size + 3)/5 + 4})
        .style("fill", function(d) { return color(d.group); });

      node.exit().transition()
        .remove()

      var link = svg.selectAll("line.link")
          .data(filt_links);

      link.enter().insert("line", "circle.node")
          .attr("class", "link")
          .style("stroke-width", function(d) { if (d.value < threshold) { return 0 } else { return Math.sqrt(d.value/100) }})
          .transition()
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
      
      link.exit().transition()
          .style("stroke-width", 0)
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
          .remove();

      force.on("tick", function() {
          link.attr("x1", function(d) { return d.source.x; })
              .attr("y1", function(d) { return d.source.y; })
              .attr("x2", function(d) { return d.target.x; })
              .attr("y2", function(d) { return d.target.y; });

          node.attr("cx", function(d) { return d.x; })
            .attr("cy", function(d) { return d.y; });
      });


}


function max(a, b)
{
  if (a > b) {return a}
  else {return b}

}

function RemoveChildren(node_dict, children, name)
{
  if (children[0] == name) {return}
  for (var i = 0; i<children.length; i++) {
    node_dict[children[i]] = 0
    RemoveChildren(node_dict, data.nodes[children[i]].children, data.nodes[children[i]].name)
  } 
  return
}

function AddChildren(node_dict, children)
{
  for (var i=0; i<children.length; i++) {
    node_dict[children[i]] = 1
  }

}

function click(d)
{
  if (d3.event.shiftKey) {

    console.log("parent", d.parent)
    RemoveChildren(node_dict, data.nodes[d.parent].children, data.nodes[d.parent].name)
    node_dict[d.parent] = 1

    FilterNodesAndLinks()
    console.log(node_dict)
    RedrawGraph();
  } else {
  //TO DO - NEED TO IMPLEMENT EXPANSION OF A CLUSTER   
    console.log("name rclick", d.name)
    node_dict[d.name] = 0 
    AddChildren(node_dict, data.nodes[d.name].children)
    FilterNodesAndLinks()
    RedrawGraph();
  }
}
