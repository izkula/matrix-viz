
var width = 960,
    height = 750;

var threshold = 50; 
var initCharge = -25
var hierarchyLevel = 4
var maxTimeChunks = 8
var globalTimeIndex = 1
var globalClusterMetric = 0.8
var force, data, svg, color;
var globalID_dict = {}
var node_dict = {}

var filt_links, filt_nodes;
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

function CheckNode(group, hierarchyLevel, i, length) {

    return(group == hierarchyLevel ||
           group == hierarchyLevel + 2 ||
           group == hierarchyLevel + 4 ||
           group == hierarchyLevel + 6 ||
           group == hierarchyLevel + 8 ||
           group == hierarchyLevel + 10 ||
           group == hierarchyLevel + 12 ||
           i == length - 1)
}

function CheckMaxHierarchyLevel(data, hierarchyLevel) {
    var maxHierarchyLevel = data.nodes[data.nodes.length-1].group
    if (hierarchyLevel > maxHierarchyLevel) {
      hierarchyLevel = maxHierarchyLevel
      $( "#LevelSlider" ).slider( "value", hierarchyLevel );
    }
}

function FilterNodeDict(data, hierarchyLevel) 
{
    for(var i = 0; i < data.nodes.length; i++)
    {
      if(CheckNode(data.nodes[i].group, hierarchyLevel, i, data.nodes.length)) {
        node_dict[data.nodes[i].name] = 1;
      } else {
        node_dict[data.nodes[i].name] = 0;
      }
    }
}

function LoadData() {
  var timeIndex = globalTimeIndex
  filename = timeIndex.toString() + "_nodelinks.json"
  d3.json(filename, function(error, graph) {
    console.log("New graph!")
    data = graph
    node_dict = {}
    prev_node_dict = {}
    CheckMaxHierarchyLevel(data, hierarchyLevel)
    FilterNodeDict(data, hierarchyLevel, node_dict)
    prev_node_dict = CopyDict(node_dict)

    force
        .nodes(data.nodes)
        .links(data.links)
        .charge(function(d) { globalID_dict[d.globalID] = d; return (d.group + 1)*initCharge})
       // .linkDistance(function(d){ return d.group + 1})
        //.friction(0.98)
        .start();
    // initializeSliders(data, force, svg, color); //Changed this so that the sliders
    //now access the global data variable instead of just the data variable passed at initialization
    // Because of this, can also initialize after the LoadData function
    //  initializeSliders(force, svg, color);

    FilterNodesAndLinks()
    $( "#LevelSlider" ).slider( "option", "max", data.nodes[data.nodes.length - 1]['group'] );

    RedrawGraph(data)  
    console.log('data.nodes.length', data.nodes.length)
  });
}

function DictMax(currDict)
{
  var maxKey = 0
  for(var key in currDict) {
    if(currDict.hasOwnProperty(key)) {
      if(key > maxKey) {
        maxKey = parseInt(key)
      }
    }
  }
  return maxKey
}

function PositionNewNodes(data, node_dict) {
  var new_nodes = []
  //    var delta = 3;
  var delta = 0;

  var max_globalID = DictMax(globalID_dict)
  console.log('max_globalID', max_globalID)


  for(var i = 0; i<data.nodes.length; i++) {
      var curr = data.nodes[i]
      var globalID = curr.globalID
      console.log("curr", curr)
      console.log('max_globalID', max_globalID)
      console.log('globalID_dict', globalID_dict)

    

      if(typeof globalID_dict[globalID] != "undefined" || globalID >= max_globalID) {
       
        if(globalID >= max_globalID) {
          node_dict[i] = 1
          var lastD = globalID_dict[max_globalID - 1]
          console.log('lastD', lastD)
          curr.x = lastD.x + i*delta
          curr.y = lastD.y + i*delta
          curr.px = lastD.x + i*delta
          curr.py = lastD.y + i*delta
          new_nodes.push(curr)

        } else if(prev_node_dict[globalID_dict[globalID].name] == 1 ) {
          //console.log("globalID_dict[globalID].name", globalID_dict[globalID].name)
          //console.log("prev_node_dict[globalID_dict[globalID].name]", prev_node_dict[globalID_dict[globalID].name])

          node_dict[i] = 1
          curr.x = globalID_dict[globalID].x + i*delta
          curr.y = globalID_dict[globalID].y + i*delta
          curr.px = globalID_dict[globalID].x + i*delta
          curr.py = globalID_dict[globalID].y + i*delta
          console.log('globalID_dict[globalID]', globalID_dict[globalID])
          new_nodes.push(curr)

        } else {
          node_dict[i] = 0
          curr.x = 0
          curr.y = 0
          curr.px = 0
          curr.py = 0
        }

      } else {
        node_dict[i] = 0
        curr.x = 0
        curr.y = 0
        curr.px = 0
        curr.py = 0
      }
  }
  return new_nodes
}

function UpdateGlobalID_dict(data) 
{
  console.log("TO DO TO DO TO DO TO DO UpdateGlobalID_dict")
  for(var i = 0; i<data.nodes.length; i++) {
    var globalID = data.nodes[i].globalID
    globalID_dict['globalID'] = data.nodes[i]
  }

//  return new_globalID_dict
}


function TimeStepGraph(globalTimeIndex, prevIndex, nodeDict) {
  prev_data = data
  console.log("globalTimeIndex", globalTimeIndex)
  filename = globalTimeIndex.toString() + "_nodelinks.json"

  d3.json(filename, function(error, graph) {
    console.log("New graph!")
    data = graph
    curr_data = data
    console.log("graph", graph)

    console.log("data", data)
    console.log("curr_data", curr_data)
    prev_node_dict = {}
    prev_node_dict = CopyDict(node_dict)
    node_dict = {}

    CheckMaxHierarchyLevel(curr_data, hierarchyLevel)


  //  FilterNodeDict(data, hierarchyLevel, node_dict)

//    var new_globalID_dict = {}

    console.log('data.nodes in timestep', data.nodes)

    var new_nodes = PositionNewNodes(data, node_dict)
    console.log('post PositionNewNodes node_dict', node_dict)
    console.log('post PositionNewNodes new_nodes', new_nodes)
    filt_nodes = new_nodes


    //NEED TO UPDATE globalID_dict
    UpdateGlobalID_dict(data)
   
    //THIS IS OLD (Thursday 11pm)
    //    for(var i = 0; i<data.nodes.length; i++) {
//      var d = data.nodes[i]
//      console.log('new_globalID_dict[d.globalID]', new_globalID_dict[d.globalID])
//      new_globalID_dict[d.globalID] = d
//    }
    
    filterLinks(data);
    console.log("here are the timestep filt links:")
    console.log(filt_links)
    for (var i=0; i<filt_links.length; i++) {
      filt_links[i].target = data.nodes[filt_links[i].target]
      filt_links[i].source = data.nodes[filt_links[i].source]
    }

    RedrawGraph(data)  
  });

}


// function TimeStepGraph(data, globalTimeIndex, prevIndex, nodeDict) {
//   prev_data = data
//   console.log("globalTimeIndex", globalTimeIndex)
//   filename = globalTimeIndex.toString() + "_nodelinks.json"

//   d3.json(filename, function(error, graph) {
//     console.log("New graph!")
//     data = graph
//     prev_node_dict = {}
//     prev_node_dict = CopyDict(node_dict)
//     node_dict = {}

//     CheckMaxHierarchyLevel(data, hierarchyLevel)
//     FilterNodeDict(data, hierarchyLevel, node_dict)

//     var new_nodes = []
//     var delta = 3;

//     var new_globalID_dict = {}

//     console.log('data.nodes in timestep', data.nodes)
//     for(var i = 0; i<data.nodes.length; i++) {
//       var d = data.nodes[i]
//       console.log('new_globalID_dict[d.globalID]', new_globalID_dict[d.globalID])
//       new_globalID_dict[d.globalID] = d
//     }

//     for(var i = 0; i<data.nodes.length; i++) {
//         var curr = data.nodes[i]
//         var globalID = curr.globalID
//         console.log("curr", curr)
        
//         if(typeof  globalID_dict[globalID] != "undefined") {
//           console.log("globalID_dict[globalID].name", globalID_dict[globalID].name)
//           console.log("prev_node_dict[globalID_dict[globalID].name]", prev_node_dict[globalID_dict[globalID].name])
//           if(prev_node_dict[globalID_dict[globalID].name] == 1) {
//             node_dict[new_globalID_dict[globalID].name] = 1
//             curr.x = globalID_dict[globalID].x + i*delta
//             curr.y = globalID_dict[globalID].y + i*delta
//             curr.px = globalID_dict[globalID].x + i*delta
//             curr.py = globalID_dict[globalID].y + i*delta
//             console.log('globalID_dict[globalID]', globalID_dict[globalID])

//             new_nodes.push(curr)
//           }
//         } else {
//           globalID_dict[globalID] = curr
//           curr.x = 0
//           curr.y = 0
//           curr.px = 0
//           curr.py = 0
//           console.log('globalID doesnt exist yet', globalID)
//           new_nodes.push(curr)
//         }
//     }

//     filt_nodes = new_nodes
//     console.log("node_dict", node_dict)


//     console.log("here are the timestep filt nodes:")
//     console.log(filt_nodes)
    
//     filterLinks(data);
//     console.log("here are the timestep filt links:")
//     console.log(filt_links)

//     RedrawGraph(data)  
//   });

// }


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
  filterLinks(data);
}

function Bound(index) {
  return Math.min(data.nodes.length -2, index)
}

function ValidLink(sourceindex, targetindex, node_dict, data)
{    
      return (//element.value >= threshold && 
              node_dict[sourceindex] == 1 &&
              node_dict[targetindex] == 1 && 
              (data.nodes[Bound(data.nodes[Bound(sourceindex)]['parent'])]['parent'] == targetindex
              || data.nodes[Bound(data.nodes[Bound(targetindex)]['parent'])]['parent'] == sourceindex))
}

function filterLinks(data) {
   //* console.log("filterLinks data", data)
     //* console.log("filterLinks node_dict", node_dict)

    filt_links = data.links.filter(function(element){
          if(element.source == 1178 && element.target == 1176) {
            console.log("1178")
          }
           var sourceindex = 0
          var targetindex = 0
          if (typeof element.source=="number" || typeof element.source=="string") {sourceindex = element.source}
          else {sourceindex = element.source.name}
          if (typeof element.target=="number" || typeof element.source=="string") {targetindex = element.target}
          else {targetindex = element.target.name}
          
          return ValidLink(sourceindex, targetindex, node_dict, data)
      })
  //*    console.log("filt_linkes", filt_links)
  }


function FilterNodesAndLinks()
{
  filt_nodes = data.nodes.filter(function(element) {
          return(node_dict[element.name] == 1)});
  filterLinks(data);
}

function ChildrenDisplayed(d, data) 
{
  //console.log("data.nodes", data.nodes)
  for (var i=0; i<d.children.length; i++) {
    var firstLayer = data.nodes[d.children[i]]
    for (var j=0; j<firstLayer.children.length; j++) {
      if(node_dict[firstLayer.children[j]] == 1) {
        return true
      }
    }
  }
  return false
}


function ChooseFill(d, data) {
  //console.log(node_dict); 
  if(d.name == data.nodes.length - 1) {return "blue"} 
  else if (d.children[0] == d.name || !ChildrenDisplayed(d, data)) {return "orange" } 
  else { return "lightblue" }
       // return color(d.group)
}

// `parentCoords` is an optional parameter used on expand-click 
// to position the expanded nodes at the original position
// of the parent
function RedrawGraph(data, clicked, parentCoords)  
{
   // console.log("Redraw filt_nodes", filt_nodes)
   // console.log("Redraw filt_links", filt_links)
   // console.log("Redraw data", data)


  	force
      .nodes(filt_nodes)
      .links(filt_links)
      //.friction(0.98)

     //  .start();

      var node = svg.selectAll("circle.node")
          .data(filt_nodes)

      node.enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)//function(d) { return (d.size+ 3)/5 + 4})
        //.style("fill", function(d) { if (node_dict[d.name] == 0) {return #fff} else {return color(d.group) })
        .style("fill", function(d) { //console.log("d", d); console.log('globalID_dict', globalID_dict);
                                     globalID_dict[d.globalID] = d;
                                     return ChooseFill(d, data); })
        .style("opacity", 1.0)  
        .style("stroke-width", 1.0)  
        .style("stroke", "white")                     
                   
        .on("click", click)
        .call(force.drag);

      node.select("title").remove();  // remove the old title
      node.append("title")
        .text(function(d) { return d.name; });

      node.transition()
        .duration(1)

        .attr("class", "node")
        .attr("r", 5)//function(d) {return (d.size + 3)/5 + 4})
        .style("opacity", 1.0)
        .style("stroke-width", 1.0)   
        .style("stroke", "white")                     
                  

        .style("fill", function(d) { globalID_dict[d.globalID] = d; 
                                     return ChooseFill(d, data); })
       


      node.exit().transition()
        .duration(1)
        .style("opacity", function(d) { globalID_dict[d.globalID] = d; return 0})
        .style("stroke-width", 0)
        .remove()

      var link = svg.selectAll("line.link")
          .data(filt_links);

      link.enter().insert("line", "circle.node")
          .attr("class", "link")
          //.style("stroke-width", function(d) { if (d.value < threshold) { return 1 } else { return Math.sqrt(d.value) }})
          .style("stroke", "black")
          .style("stroke-opacity", function(d) { return (d.value+5)/100 })
          .transition()
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; });
      
      link.exit().transition()
          .style("stroke-width", 0)
          .style("stroke-opacity", 0)
          .duration(1)
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
          .remove();

      force.on("tick", function() {
          //if((force.alpha() < 0.03 || force.alpha > 0.09)) {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
          //}
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
    RedrawGraph(data, true);
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
    
    RedrawGraph(data, true, coords);
  }
}

function EnsureParentsAreVisible()
{
  for(var i =0; i<DictMax(node_dict); i++) {
    if (node_dict[i] == 1) {
      var node = data.nodes[i]
      while(node.parent != -1) {
        node_dict[node.parent] = 1
        node = data.nodes[node.parent]
      }
    }
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
                      RedrawGraph(data)
                    }
                  });

	$( "#RepulsionSlider" ).slider({max: 1000, min: 5, animate: "slow", 
	                      value: -initCharge,
	                      change: function(event, ui) {
	                        force.charge(function(d) {return -(d.group+1)*ui.value});
	                        RedrawGraph(data)
	                       }
	                  });


	$( "#LevelSlider" ).slider({min: 0, animate: "slow",
	                            step: 2, value: hierarchyLevel, 
	                            change: function(event, ui) {
	                                level = ui.value;
                                  hierarchyLevel = level
	                                console.log("level", level)
                                  console.log("hierarchyLevel", hierarchyLevel)
	                                console.log("nodes.length", data.nodes.length)
	                                for(var i=0; i < data.nodes.length; i++) {

	                                  if (CheckNode(data.nodes[i]['group'], hierarchyLevel, i, data.nodes.length)) {
                                         node_dict[i] = 1
	                                  } else {
	                                      node_dict[i] = 0
	                                  }
	                                  
	                                }
	                                FilterNodesAndLinks()
	                                RedrawGraph(data) 
	                           } 
	                          });

  $( "#TimeSlider" ).slider({min: 0, max: maxTimeChunks, animate: "fast",
                              step: 1, value: globalTimeIndex, 
                              change: function(event, ui) {
                                  var index = ui.value;
                                  if(index != globalTimeIndex) {
                                    prevIndex = globalTimeIndex
                                    globalTimeIndex = index

                                    console.log("timeslider: nodes.length", data.nodes.length)
                                    var nodePositions = saveNodePositions();
                                    LoadData(nodePositions)

                                  }                                  
                                  //FilterNodesAndLinks()
                                  //RedrawGraph() 
                             } 
                            });

$( "#ClusterMetricSlider" ).slider({min: 0, max: 1, animate: "fast", //THIS IS BUGGY

                          step: 0.01, value: globalClusterMetric, 
                          change: function(event, ui) {
                              prev_node_dict = CopyDict(node_dict)
                              globalClusterMetric = ui.value;
                              console.log('globalClusterMetric', globalClusterMetric)
                              for(var i=0; i < data.nodes.length; i++) {
                                  //  console.log(i, data.nodes[i].metric)
                                    if (data.nodes[i].metric >  globalClusterMetric ) {
                                          node_dict[i] = 0
                                    } else {
                                      if (data.nodes[i].group % 2 == 0 || i == data.nodes.length - 1) {
                                          node_dict[i] = 1
                                        } else {
                                          node_dict[i] = 0
                                        }
                                    }
                                  }          
                              EnsureParentsAreVisible()                      
                              FilterNodesAndLinks()
                              RedrawGraph(data) 
                         } 
                        });

$( "#UndoButton" ).button({ label: "Undo" });

$("#UndoButton").click(function() {
    node_dict = CopyDict(prev_node_dict)
    FilterNodesAndLinks()
    RedrawGraph(data)
})
}



function saveNodePositions() {
  var nodePosMap = {}
  for(var i=0; i < filt_nodes.length; i++) {
    var curr = filt_nodes[i]
    nodePosMap[curr.name]= { x: curr.x, y: curr.y }
  }
  return nodePosMap
}

