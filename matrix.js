
var width = 960,
    height = 750;

var threshold = 50; 
var initCharge = -25
var hierarchyLevel = 4
var maxTimeChunks = 8
var globalTimeIndex = 1
var globalClusterMetric = 0.8
var force, data, svg, color;
//Treat 'data' as a global variable so that it
// can be accessed everywhere. We may change this
// to account for using multiple datasets (or time periods)
// at the same time
var timeSeriesNodes = {}

$(function() {
	console.log('inside matrix.js')

  color = d3.scale.category10();

  force = d3.layout.force()
	    //.charge(function(d) {return d.group*initCharge;)
	    .linkDistance(30)
	    .size([width, height]);

  svg = d3.select("#graphPlot").append("svg")
	    .attr("width", width)
	    .attr("height", height);

  data  = 0

  LoadData()
  initializeSliders(force, svg, color);
  $("UndoButton").button("enable");
});

function LoadData() {
  var timeIndex = globalTimeIndex
  filename = timeIndex.toString() + "_nodelinks.json"
  d3.json(filename, function(error, graph) {
    console.log("New graph!")
    data = graph
    node_dict = {}
    prev_node_dict = {}
    var maxHierarchyLevel = graph.nodes[graph.nodes.length-1].group
    if (hierarchyLevel > maxHierarchyLevel) {
      console.log("Exceeded maxHierarchyLevel")
      hierarchyLevel = maxHierarchyLevel
      $( "#LevelSlider" ).slider( "value", hierarchyLevel );

    }
    for(var i = 0; i < graph.nodes.length; i++)
    {
      if(graph.nodes[i].group == hierarchyLevel || 
        graph.nodes[i].group == hierarchyLevel + 2 ||
        graph.nodes[i].group == hierarchyLevel + 4 ||
        graph.nodes[i].group == hierarchyLevel + 6 ||
        graph.nodes[i].group == hierarchyLevel + 8 ||
        graph.nodes[i].group == hierarchyLevel + 10 ||
        i == graph.nodes.length - 1) {
        console.log(graph.nodes[i].group)
        node_dict[graph.nodes[i].name] = 1;
      } else {
        node_dict[graph.nodes[i].name] = 0;
      }
    }

    prev_node_dict = CopyDict(node_dict)

    force
        .nodes(data.nodes)
        .links(data.links)
        .charge(function(d) {return (d.group + 1)*initCharge})
        .start();
    // initializeSliders(data, force, svg, color); //Changed this so that the sliders
    //now access the global data variable instead of just the data variable passed at initialization
    // Because of this, can also initialize after the LoadData function
    //  initializeSliders(force, svg, color);


    FilterNodesAndLinks()

    //console.log(filt_nodes)
    $( "#LevelSlider" ).slider( "option", "max", data.nodes[data.nodes.length - 1]['group'] );

    RedrawGraph()  
    console.log('data.nodes.length', data.nodes.length)
  });
}

function ReLoadData() {
  var timeIndex = globalTimeIndex
  filename = timeIndex.toString() + "_nodelinks.json"
  d3.json(filename, function(error, graph) {
    console.log("New graph!")
    data = graph
    node_dict = {}
    var maxHierarchyLevel = graph.nodes[graph.nodes.length-1].group
    if (hierarchyLevel > maxHierarchyLevel) {
      console.log("Exceeded maxHierarchyLevel")
      hierarchyLevel = maxHierarchyLevel
      $( "#LevelSlider" ).slider( "value", hierarchyLevel );
    }
    for(var i = 0; i < graph.nodes.length; i++)
    {
      if(graph.nodes[i].group == hierarchyLevel || 
        graph.nodes[i].group == hierarchyLevel + 2 ||
        graph.nodes[i].group == hierarchyLevel + 4 ||
         graph.nodes[i].group == hierarchyLevel + 6 ||
          graph.nodes[i].group == hierarchyLevel + 8 ||
          graph.nodes[i].group == hierarchyLevel + 10 ||
          i == graph.nodes.length - 1) {
        console.log("group", graph.nodes[i].group)
        node_dict[graph.nodes[i].name] = 1;
      } else {
        node_dict[graph.nodes[i].name] = 0;
      }
    }
    prev_node_dict = {}
    force
        .nodes(data.nodes)
        .links(data.links)
        .start();

    FilterNodesAndLinks()
    $( "#LevelSlider" ).slider( "option", "max", data.nodes[data.nodes.length - 1]['group'] );

    RedrawGraph()  
  });
}





function FilterNodesAndLinksOnExpandClick(childNodes, parentCoords) {
  var child_nodes = []
  var delta = 3;
  for(var i = 0; i < childNodes.length; i++) {
    var curr = data.nodes[childNodes[i]]
    curr.x = parentCoords.x + i*delta
    curr.y = parentCoords.y + i*delta
    curr.px = parentCoords.x + i*delta
    curr.py = parentCoords.y + i*delta
   // curr.fixed = true;
    child_nodes.push(curr)
  }

  // filt_nodes = data.nodes.filter(function(element) {
  //   if(childNodes.indexOf(element.name) >= 0) return false;
  //     return(node_dict[element.name] == 1)
  //   })
  // for(var i=0; i < filt_nodes.length; i++) {
  //   var curr = filt_nodes[i]
  //   curr.px = curr.x
  //   curr.py = curr.y
  // }
  //.concat(child_nodes)
  // var lastElem = filt_nodes.pop()
  // filt_nodes.splice(parentCoords.index, 0, lastElem);

  filt_nodes = filt_nodes.concat(child_nodes)
  var lastElem = filt_nodes.pop()
  filt_nodes.splice(parentCoords.index, 1, lastElem)


  // child nodes are now appended at the end
  console.log("here are the expandclick filt nodes:")
  console.log(filt_nodes)
  filterLinks();
}

function Bound(index) {
  return Math.min(data.nodes.length -2, index)
}

function ValidLink(sourceindex, targetindex)
{    return (//element.value >= threshold && 
              node_dict[sourceindex] == 1 &&
              node_dict[targetindex] == 1
              && (data.nodes[Bound(data.nodes[Bound(sourceindex)]['parent'])]['parent'] == targetindex
              || data.nodes[Bound(data.nodes[Bound(targetindex)]['parent'])]['parent'] == sourceindex))
}

function filterLinks() {
    filt_links = data.links.filter(function(element){
          var sourceindex = 0
          var targetindex = 0
          if (typeof element.source=="number" || typeof element.source=="string") {sourceindex = element.source}
          else {sourceindex = element.source.name}
          if (typeof element.target=="number" || typeof element.source=="string") {targetindex = element.target}
          else {targetindex = element.target.name}
          
          return ValidLink(sourceindex, targetindex)})
  }


function FilterNodesAndLinks()
{
  filt_nodes = data.nodes.filter(function(element) {
          return(node_dict[element.name] == 1)});
  filterLinks();

  
}

function ChildrenDisplayed(d) 
{
  for (var i=0; i<d.children.length; i++) {
    if(node_dict[data.nodes[d.children[i]].children[0]] == 1) {
      return true
    }
  }
  return false
}

// `parentCoords` is an optional parameter used on expand-click 
// to position the expanded nodes at the original position
// of the parent
function RedrawGraph()  
{
  	force
      .nodes(filt_nodes)
      .links(filt_links)
     //  .start();

      var node = svg.selectAll("circle.node")
          .data(filt_nodes)

      node.enter().append("circle")
        .attr("class", "node")
<<<<<<< HEAD
        .attr("r", function(d) { return (d.size+ 3)/5 + 4})
=======
        // .attr("cx", function(d) { 
        //   if(parentCoords) {                      
        //     console.log("node "+d.name+" will have x of "+parentCoords.x)
        //     return parentCoords.x
        //   }
        //   return undefined
        // })
        // .attr("cy", function(d) {
        //   if(parentCoords) return parentCoords.y
        //   return undefined
        // })
        .attr("r", 5)//function(d) { return (d.size+ 3)/5 + 4})
>>>>>>> 7b87668eb9ee697cfe62f5ee7183f2ad456eb999
        //.style("fill", function(d) { if (node_dict[d.name] == 0) {return #fff} else {return color(d.group) })
        .style("fill", function(d) { console.log(node_dict); if(d.name == data.nodes.length - 1) {return "blue"} else if (d.children[0] == d.name 
                                                            || !ChildrenDisplayed(d)) {return "orange" } 
                                      else { return "lightblue" }})
                                        //color(d.group) } )
        .on("click", click)
        .call(force.drag);

      node.select("title").remove();  // remove the old title
      node.append("title")
        .text(function(d) { return d.name; });

      node.transition()
        .attr("class", "node")
<<<<<<< HEAD
        .duration(0)
        .attr("r", function(d) {return (d.size + 3)/5 + 4})
        .style("fill", function(d) { return color(d.group); });
=======
        .attr("r", 5)//function(d) {return (d.size + 3)/5 + 4})
        .style("fill", function(d) {if(d.name == data.nodes.length - 1) {return "blue"} else if (d.children[0] == d.name || 
                                    !ChildrenDisplayed(d)) {return "orange" } 
                                     else { return "lightblue" }})
          //return color(d.group); });
>>>>>>> 7b87668eb9ee697cfe62f5ee7183f2ad456eb999

      node.exit().transition()
        .remove()

      var link = svg.selectAll("line.link")
          .data(filt_links);

      link.enter().insert("line", "circle.node")
          .attr("class", "link")
          .style("stroke-width", function(d) { if (d.value < threshold) { return 1 } else { return Math.sqrt(d.value/100) }})
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
      force.start()
}


function max(a, b)
{
  if (a > b) {return a}
  else {return b}

}

function CopyDict(from_dict)
{
  to_dict = {}
  for(var i in from_dict) {
    to_dict[i] = from_dict[i];
  }
  console.log("to", to_dict)
  console.log("from", from_dict)
  return to_dict
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

    prev_node_dict = CopyDict(node_dict)
    console.log("prev_node_dict", prev_node_dict)
    console.log("parent", d.parent)
//    RemoveChildren(node_dict, data.nodes[d.parent].children, data.nodes[d.parent].name, data)
//    node_dict[d.parent] = 1
    RemoveChildren(node_dict, d.children, d.name, data)
    node_dict[d.name] = 1

    FilterNodesAndLinks()
    console.log("node_dict", node_dict)
    RedrawGraph();
  } else if (d3.event.altKey) {
    if(d.name in timeSeriesNodes) {
      delete timeSeriesNodes[d.name]
    } else {
      timeSeriesNodes[d.name] = true;
    }
    DrawLineGraph(timeSeriesNodes)

  } else {
  //TO DO - NEED TO IMPLEMENT EXPANSION OF A CLUSTER   
    prev_node_dict = CopyDict(node_dict)
    console.log("name rclick", d.name)
    var parentIndex = filt_nodes.indexOf(data.nodes[d.name])
    var coords = { x: d.x, y: d.y, name: d.name, index: parentIndex }
    console.log("had coords "+JSON.stringify(coords))
    node_dict[d.name] = 1 
//    AddChildren(node_dict, data.nodes[d.name].children)
//    FilterNodesAndLinksOnExpandClick(data.nodes[d.name].children, coords)

    for(var i=0; i<d.children.length; i++) {
      AddChildren(node_dict, data.nodes[d.children[i]].children)
     // FilterNodesAndLinksOnExpandClick(data.nodes[d.children[i]].children, coords)
     FilterNodesAndLinks()
    }
    
    RedrawGraph(coords);
  }
}

// var h_ts = 300
// var w_ts = 400
// var svg_ts
// function DrawLineGraph(tsNodes) {
//   if(!svg_ts) {
//     svg_ts
//   }
// }


//function initializeSliders(data, force, svg, color) {
function initializeSliders(force, svg, color) {
  console.log('data,')
  console.log(data)
	$( "#CorrSlider" ).slider({max: 100, min: 0, animate: "slow", 
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
                                      return ValidLink(sourceindex, targetindex)})
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
	                            step: 2, value: hierarchyLevel, 
	                            change: function(event, ui) {
	                                level = ui.value;
                                  hierarchyLevel = level
	                                console.log("level", level)
                                  console.log("hierarchyLevel", hierarchyLevel)
	                                console.log("nodes.length", data.nodes.length)
	                                for(var i=0; i < data.nodes.length; i++) {
	                                  if (data.nodes[i]['group'] == hierarchyLevel || 
                                        data.nodes[i]['group'] == hierarchyLevel + 2 ||
                                        data.nodes[i]['group'] == hierarchyLevel + 4 ||
                                        data.nodes[i]['group'] == hierarchyLevel + 6 ||
                                        data.nodes[i]['group'] == hierarchyLevel + 8 ||
                                         data.nodes[i]['group'] == hierarchyLevel + 10 ||
                                         i == data.nodes.length - 1) {
	                                       
                                         node_dict[i] = 1
	                                  } else {
	                                      node_dict[i] = 0
	                                  }
	                                  
	                                }
	                                FilterNodesAndLinks()
	                                RedrawGraph() 
	                           } 
	                          });

  $( "#TimeSlider" ).slider({min: 0, max: maxTimeChunks, animate: "fast",
                              step: 1, value: globalTimeIndex, 
                              change: function(event, ui) {
                                  var index = ui.value;
                                  if(index != globalTimeIndex) {
                                    globalTimeIndex = index
                                    console.log("timeslider: nodes.length", data.nodes.length)
                                    var nodePositions = saveNodePositions();
                                    LoadData(nodePositions)
                                  }                                  
                                  //FilterNodesAndLinks()
                                  //RedrawGraph() 
                             } 
                            });
}

function saveNodePositions() {
  var nodePosMap = {}
  for(var i=0; i < filt_nodes.length; i++) {
    var curr = filt_nodes[i]
    nodePosMap[curr.name]= { x: curr.x, y: curr.y }
  }
  return nodePosMap
}

$( "#ClusterMetricSlider" ).slider({min: 0, max: 1, animate: "fast",
                          step: 0.01, value: globalClusterMetric, 
                          change: function(event, ui) {
                              prev_node_dict = CopyDict(node_dict)
                              globalClusterMetric = ui.value;
                              console.log('globalClusterMetric', globalClusterMetric)
                              for(var i=0; i < data.nodes.length; i++) {
                                    console.log(i, data.nodes[i].metric)
                                    if (data.nodes[i].metric >  globalClusterMetric ) {
                                          node_dict[i] = 0
                                    } else {
                                      if (data.nodes[i].group % 2 == 0 || data.nodes[i].group == data.nodes.length - 1) {
                                          node_dict[i] = 1
                                        } else {
                                          node_dict[i] = 0
                                        }
                                    }
                                  }                                
                              FilterNodesAndLinks()
                              RedrawGraph() 
                         } 
                        });

$( "#UndoButton" ).button({ label: "Undo" });

$("#UndoButton").click(function() {
    node_dict = CopyDict(prev_node_dict)
    FilterNodesAndLinks()
    RedrawGraph()
})

