
var width = 760,
    height = 550;

var threshold = 50; 
var initCharge = -25
var hierarchyLevel = 4
var maxTimeChunks = 8
var globalTimeIndex = 0
var forcesIndex = 0

var globalClusterMetric = 0.8
//var force; 
var data, svg, color;
var globalID_dict = {}
var node_dict = {}
var mousedown = false
var forces = {}
var filt_links_arr = {}
var filt_nodes_arr = {}
var data_arr = {}

//var filt_links, filt_nodes;

//Treat 'data_arr[forcesIndex]' as a global variable so that it
// can be accessed everywhere. We may change this
// to account for using multiple data_arr[forcesIndex]sets (or time periods)
// at the same time


$(function() {
	console.log('inside matrix.js')
  color = d3.scale.category20();
  
/*  force = d3.layout.force()
	    //.charge(function(d) {return d.group*initCharge;)
	    .linkDistance(30)
	    .size([width, height]);*/

  svg = d3.select("#graphPlot").append("svg")
	    .attr("width", width)
	    .attr("height", height);

  data_arr[forcesIndex]  = 0

  LoadData()
 // initializeSliders(force, svg, color);
  initializeSliders(svg, color);
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

function CheckMaxHierarchyLevel(hierarchyLevel) {
    var maxHierarchyLevel = data_arr[forcesIndex].nodes[data_arr[forcesIndex].nodes.length-1].group
    if (hierarchyLevel > maxHierarchyLevel) {
      hierarchyLevel = maxHierarchyLevel
      $( "#LevelSlider" ).slider( "value", hierarchyLevel );
    }
}

function FilterNodeDict(hierarchyLevel) 
{
    for(var i = 0; i < data_arr[forcesIndex].nodes.length; i++)
    {
      if(CheckNode(data_arr[forcesIndex].nodes[i].group, hierarchyLevel, i, data_arr[forcesIndex].nodes.length)) {
        node_dict[data_arr[forcesIndex].nodes[i].name] = 1;
      } else {
        node_dict[data_arr[forcesIndex].nodes[i].name] = 0;
      }
    }
}

function LoadData() {
  var force = d3.layout.force()
      //.charge(function(d) {return d.group*initCharge;)
      .linkDistance(30)
      .size([width, height]);
  
  forces[globalTimeIndex] = force

  filename = globalTimeIndex.toString() + "_nodelinks.json"
  d3.json(filename, function(error, graph) {
    console.log("New graph!")
    console.log("graph!", graph)

    data_arr[forcesIndex] = graph
    node_dict = {}
    prev_node_dict = {}
    prev2_node_dict = {}
    prev3_node_dict = {}
    prev4_node_dict = {}
    prev5_node_dict = {}
    CheckMaxHierarchyLevel(hierarchyLevel)
    FilterNodeDict(hierarchyLevel, node_dict)
    CopyUndoDicts()


    forces[forcesIndex]
        .nodes(data_arr[forcesIndex].nodes)
        .links(data_arr[forcesIndex].links)
        .charge(function(d) { globalID_dict[d.globalID] = d; return (d.group + 1)*initCharge})
       // .linkDistance(function(d){ return d.group + 1})
        //.friction(0.98)
        .start();
    // initializeSliders(data_arr[forcesIndex], force, svg, color); //Changed this so that the sliders
    //now access the global data_arr[forcesIndex] variable instead of just the data_arr[forcesIndex] variable passed at initialization
    // Because of this, can also initialize after the LoadData function
    //  initializeSliders(force, svg, color);

    FilterNodesAndLinks()
    $( "#LevelSlider" ).slider( "option", "max", data_arr[forcesIndex].nodes[data_arr[forcesIndex].nodes.length - 1]['group'] );

    //RedrawGraphNoShow()  
    RedrawGraph()  
    console.log("forces", forces)
    console.log("filt_nodes_arr", filt_nodes_arr)
    console.log("filt_links_arr", filt_links_arr)
    console.log('data_arr[forcesIndex].nodes.length', data_arr[forcesIndex].nodes.length)

  });
}

function TimeStepGraph() {
  var force = d3.layout.force()
      //.charge(function(d) {return d.group*initCharge;)
      .linkDistance(30)
      .size([width, height]);
  
  forces[globalTimeIndex] = force
 
  console.log("globalTimeIndex", globalTimeIndex)
  filename = globalTimeIndex.toString() + "_nodelinks.json"
  d3.json(filename, function(error, newgraph) {
    console.log("New graph!")
    console.log("newgraph", newgraph)

    data_arr[forcesIndex] = newgraph
    curr_data = data_arr[forcesIndex]

    console.log("data", data_arr[forcesIndex])
    console.log("curr_data", curr_data)
    prev_node_dict = {}
    CopyUndoDicts()

    node_dict = {}

    CheckMaxHierarchyLevel(curr_data, hierarchyLevel)
  //  FilterNodeDict(data, hierarchyLevel, node_dict)

    forces[forcesIndex]
      .nodes(data_arr[forcesIndex].nodes)
      .links(data_arr[forcesIndex].links)
      .charge(function(d) { globalID_dict[d.globalID] = d; return (d.group + 1)*initCharge})
     // .linkDistance(function(d){ return d.group + 1})
      //.friction(0.98)
      .start();

    console.log('data.nodes in timestep', data_arr[forcesIndex].nodes)
    console.log('data.links in timestep', data_arr[forcesIndex].links)


    var new_nodes = PositionNewNodes(node_dict)
    EnsureParentsAreVisible()

    console.log('post PositionNewNodes node_dict', node_dict)
    console.log('post PositionNewNodes new_nodes', new_nodes)
 //   filt_nodes_arr[forcesIndex] = new_nodes
    FilterNodesAndLinks()

    UpdateGlobalID_dict() //I think this is finished
    
//    filterLinks();
    console.log("here are the timestep filt links:")
    console.log(filt_links_arr[forcesIndex])
    for (var i=0; i<filt_links_arr[forcesIndex].length; i++) {
      filt_links_arr[forcesIndex][i].target = data_arr[forcesIndex].nodes[filt_links_arr[forcesIndex][i].target]
      filt_links_arr[forcesIndex][i].source = data_arr[forcesIndex].nodes[filt_links_arr[forcesIndex][i].source]
    }
    console.log("filled links with their node objects")
    console.log(filt_links_arr[forcesIndex])


    RedrawGraphNoShow()  
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

function PositionNewNodes(node_dict) {
  var new_nodes = []
  //    var delta = 3;
  var delta = 0;

  var max_globalID = DictMax(globalID_dict)
  console.log('max_globalID', max_globalID)


  for(var i = 0; i<data_arr[forcesIndex].nodes.length; i++) {
      var curr = data_arr[forcesIndex].nodes[i]
      var globalID = curr.globalID
     // console.log("curr", curr)
     // console.log('max_globalID', max_globalID)
     // console.log('globalID_dict', globalID_dict)

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
        //  console.log('globalID_dict[globalID]', globalID_dict[globalID])
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

function UpdateGlobalID_dict() 
{
  console.log("TO DO TO DO TO DO TO DO UpdateGlobalID_dict")
  for(var i = 0; i<data_arr[forcesIndex].nodes.length; i++) {
    var globalID = data_arr[forcesIndex].nodes[i].globalID
    globalID_dict['globalID'] = data_arr[forcesIndex].nodes[i]
  }

//  return new_globalID_dict
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
    var curr = data_arr[forcesIndex].nodes[childNodes[i]]
    curr.x = parentCoords.x + i*delta
    curr.y = parentCoords.y + i*delta
    curr.px = parentCoords.x + i*delta
    curr.py = parentCoords.y + i*delta
   // curr.fixed = true;
    child_nodes.push(curr)
  }

  // filt_nodes = data_arr[forcesIndex].nodes.filter(function(element) {
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

  filt_nodes_arr[forcesIndex] = filt_nodes.concat(child_nodes)
  var lastElem = filt_nodes_arr[forcesIndex].pop()
  filt_nodes_arr[forcesIndex].splice(parentCoords.index, 1, lastElem)


  // child nodes are now appended at the end
  console.log("here are the expandclick filt nodes:")
  console.log(filt_nodes_arr[forcesIndex])
  filterLink();
}

function Bound(index) {
  return Math.min(data_arr[forcesIndex].nodes.length -2, index)
}

function ValidLink(sourceindex, targetindex, node_dict)
{    
      return (//element.value >= threshold && 
              node_dict[sourceindex] == 1 &&
              node_dict[targetindex] == 1 && 
              (data_arr[forcesIndex].nodes[Bound(data_arr[forcesIndex].nodes[Bound(sourceindex)]['parent'])]['parent'] == targetindex
              || data_arr[forcesIndex].nodes[Bound(data_arr[forcesIndex].nodes[Bound(targetindex)]['parent'])]['parent'] == sourceindex))
}

function filterLinks() {
    console.log("filterLinks data_arr[forcesIndex]", data_arr[forcesIndex])
    console.log("filterLinks node_dict", node_dict)
    console.log("filterLinks filt_links_arr", data_arr[forcesIndex].links)
   
    filt_links_arr[forcesIndex] = data_arr[forcesIndex].links.filter(function(element){
          if(element.source == 1178 && element.target == 1176) {
            console.log("1178")
          }
          var sourceindex = 0
          var targetindex = 0
          console.log(element.source)

          if(element.source=="undefined" || element.target =="undefined") { console.log("undefined"); return false}
          if (typeof element.source=="number" || typeof element.source=="string") {sourceindex = element.source}
          else {sourceindex = element.source.name}
          if (typeof element.target=="number" || typeof element.target=="string") {targetindex = element.target}
          else {targetindex = element.target.name}
          
          return ValidLink(sourceindex, targetindex, node_dict)
      })
      console.log("filt_linkes", filt_links_arr[forcesIndex])
  }


function FilterNodesAndLinks()
{
  filt_nodes_arr[forcesIndex] = data_arr[forcesIndex].nodes.filter(function(element) {
          return(node_dict[element.name] == 1)});
  filterLinks();
}

function ChildrenDisplayed(d) 
{
  //console.log("data.nodes", data.nodes)
  for (var i=0; i<d.children.length; i++) {
    var firstLayer = data_arr[forcesIndex].nodes[d.children[i]]
    for (var j=0; j<firstLayer.children.length; j++) {
      if(node_dict[firstLayer.children[j]] == 1) {
        return true
      }
    }
  }
  return false
}


function ChooseFill(d) {
  //console.log(node_dict); 
  if(d.name == data_arr[forcesIndex].nodes.length - 1) {return "blue"} 
  else if (d.children[0] == d.name || !ChildrenDisplayed(d)) 
    {return "orange"} 
  else { return "lightblue" }
       // return color(d.group)
}

/*var node_drag = d3.behavior.drag()
        .on("dragstart", function() {mousedown = true})
        .on("drag", function() {force.tick(); mousedown = true})
        .on("dragend", function() {mousedown = false});
        */

function DrawForce()
{
  var node = svg.selectAll("circle.node")
          .data(filt_nodes_arr[forcesIndex]);

  var link = svg.selectAll("line.link")
          .data(filt_links_arr[forcesIndex]);

      node.enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)//function(d) { return (d.size+ 3)/5 + 4})                     
        .on("click", click)
        .call(forces[forcesIndex].drag);
        
      node.select("title").remove();  // remove the old title
      node.append("title")
        .text(function(d) { return d.name; });

 
      link.enter().insert("line", "circle.node")
          .attr("class", "link")
          //.style("stroke-width", function(d) { if (d.value < threshold) { return 1 } else { return Math.sqrt(d.value) }})
          .transition();


      link.attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
          .style("stroke", "black")
          .style("stroke-opacity", function(d) { return (d.value+5)/100 });

      link.exit().transition()
          .duration(1)
          .style("stroke-width", 0)
          .style("stroke-opacity", 0)
          //  .duration(1)
          .remove();

      node.attr("cx", function(d) { return d.x; })
          .attr("cy", function(d) { return d.y; })
          .style("opacity", 1.0)
          .style("stroke-width", 1.0)   
          .style("stroke", "white")                     
          .style("fill", function(d) { globalID_dict[d.globalID] = d; 
                               return ChooseFill(d); })
          .on("click", click)
          .call(    forces[forcesIndex].drag);
         //.call(node_drag);


      node.exit().transition()
          .duration(1)
          .style("opacity", function(d) { globalID_dict[d.globalID] = d; return 0})
          .style("stroke-width", 0)
          .remove()

}


function RedrawGraphNoShow(parentCoords)  
{
   // console.log("Redraw filt_nodes", filt_nodes)
   // console.log("Redraw filt_links", filt_links)
   // console.log("Redraw data", data)

    console.log("redraw noshow")

    forces[forcesIndex]
      .nodes(filt_nodes_arr[forcesIndex])
      .links(filt_links_arr[forcesIndex])
      //.friction(0.98)
     //  .start();

      var node = svg.selectAll("circle.node")
          .data(filt_nodes_arr[forcesIndex])

      node.enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)//function(d) { return (d.size+ 3)/5 + 4})                     
        .on("click", click)
        .call(forces[forcesIndex].drag);

      node.select("title").remove();  // remove the old title
      node.append("title")
        .text(function(d) { return d.name; });

      node.transition()
       // .duration(1)
        .attr("class", "node")
        .attr("r", 5)//function(d) {return (d.size + 3)/5 + 4})
       

      var link = svg.selectAll("line.link")
          .data(filt_links_arr[forcesIndex]);

      link.enter().insert("line", "circle.node")
          .attr("class", "link")
          //.style("stroke-width", function(d) { if (d.value < threshold) { return 1 } else { return Math.sqrt(d.value) }})
          .transition();

          forces[forcesIndex].on("tick", function() {
            //alpha < 0.006
          if(  forces[forcesIndex].alpha() < 0.006 || mousedown == true || forcesIndex == 0) {
            console.log(    forces[forcesIndex].alpha())
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; })
                .style("stroke", "black")
                .style("stroke-opacity", function(d) { return (d.value+5)/100 });

            link.exit().transition()
                .duration(1)
                .style("stroke-width", 0)
                .style("stroke-opacity", 0)
                //  .duration(1)
                .remove();

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; })
                .style("opacity", 1.0)
                .style("stroke-width", 1.0)   
                .style("stroke", "white")                     
                .style("fill", function(d) { globalID_dict[d.globalID] = d; 
                                     return ChooseFill(d); })
                .on("click", click)
                .call(    forces[forcesIndex].drag);
               //.call(node_drag);


            node.exit().transition()
                .duration(1)
                .style("opacity", function(d) { globalID_dict[d.globalID] = d; return 0})
                .style("stroke-width", 0)
                .remove()
          }
          if(    forces[forcesIndex].alpha() < 0.0059 ) {//0) {
            RedrawGraph()
          }
          if (forces[forcesIndex].alpha() < 0.0052) {
            if(globalTimeIndex < maxTimeChunks) {
           //   globalTimeIndex += 1
           //   forcesIndex = globalTimeIndex
           //   console.log("loading next time")
             // TimeStepGraph()
             // LoadData()
            }
          }
      });
      forces[forcesIndex].start()

      HighlightSelectedNodes(timeSeriesNodes)
}





// `parentCoords` is an optional parameter used on expand-click 
// to position the expanded nodes at the original position
// of the parent
function RedrawGraph()  
{
  console.log("redraw normal")
   // console.log("Redraw filt_nodes", filt_nodes)
   // console.log("Redraw filt_links", filt_links)
   // console.log("Redraw data", data)


    forces[forcesIndex]
      .nodes(filt_nodes_arr[forcesIndex])
      .links(filt_links_arr[forcesIndex])
      //.friction(0.98)

     //  .start();

      var node = svg.selectAll("circle.node")
          .data(filt_nodes_arr[forcesIndex])

      node.enter().append("circle")
        .attr("class", "node")
        .attr("r", 5)//function(d) { return (d.size+ 3)/5 + 4})
        //.style("fill", function(d) { if (node_dict[d.name] == 0) {return #fff} else {return color(d.group) })
        .style("fill", function(d) { //console.log("d", d); console.log('globalID_dict', globalID_dict);
                                     globalID_dict[d.globalID] = d;
                                     return ChooseFill(d); })
        .style("opacity", 1.0)  
        .style("stroke-width", 1.0)  
        .style("stroke", "white")                     
                   
        .on("click", click)
        .call(    forces[forcesIndex].drag);

      node.select("title").remove();  // remove the old title
      node.append("title")
        .text(function(d) { return d.name; });

      node.transition()
       // .duration(1)

        .attr("class", "node")
        .attr("r", 5)//function(d) {return (d.size + 3)/5 + 4})
        .style("opacity", 1.0)
       // .style("stroke-width", 1.0)   
        .style("stroke-width", function(d) {
          if(parseInt(d.name) in timeSeriesNodes) {
            return highlightWidth
          } 
          return 1.0
        })
        //.style("stroke", "white")
        .style("stroke", function(d) {
          if(parseInt(d.name) in timeSeriesNodes) {
            return highlightColor
          }
          return "white"
        })                     
                  

        .style("fill", function(d) { globalID_dict[d.globalID] = d; 
                                     return ChooseFill(d); })
       


      node.exit().transition()
       // .duration(1)
        .style("opacity", function(d) { globalID_dict[d.globalID] = d; return 0})
        .style("stroke-width", 0)
        .remove()

      var link = svg.selectAll("line.link")
          .data(filt_links_arr[forcesIndex]);

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
        //  .duration(1)
          .attr("x1", function(d) { return d.source.x; })
          .attr("y1", function(d) { return d.source.y; })
          .attr("x2", function(d) { return d.target.x; })
          .attr("y2", function(d) { return d.target.y; })
          .remove();

          forces[forcesIndex].on("tick", function() {
          //if((force.alpha() < 0.03 || force.alpha > 0.09)) {
            link.attr("x1", function(d) { return d.source.x; })
                .attr("y1", function(d) { return d.source.y; })
                .attr("x2", function(d) { return d.target.x; })
                .attr("y2", function(d) { return d.target.y; });

            node.attr("cx", function(d) { return d.x; })
                .attr("cy", function(d) { return d.y; });
          //}
      });
          forces[forcesIndex].start()
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
//  console.log("to", to_dict)
//  console.log("from", from_dict)
  return to_dict
}

function RemoveChildren(node_dict, children, name)
{
  if (children[0] == name) {return}
  for (var i = 0; i<children.length; i++) {
    node_dict[children[i]] = 0
    RemoveChildren(node_dict, data_arr[forcesIndex].nodes[children[i]].children, data_arr[forcesIndex].nodes[children[i]].name)
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
    CopyUndoDicts()
    console.log("prev_node_dict", prev_node_dict)
    console.log("parent", d.parent)
//    RemoveChildren(node_dict, data.nodes[d.parent].children, data.nodes[d.parent].name, data)
//    node_dict[d.parent] = 1
    RemoveChildren(node_dict, d.children, d.name)
    node_dict[d.name] = 1

    FilterNodesAndLinks()
    console.log("node_dict", node_dict)

    RedrawGraph();

  } else if (d3.event.altKey) {
    console.log("AlT!")
    console.log(d)
    if(d.name in timeSeriesNodes) {
      RemoveHighlight(d.name)
      delete timeSeriesNodes[d.name]
    } else {
      timeSeriesNodes[d.name] = true;
    }
    DrawAllLineGraphs(timeSeriesNodes)

  } else {
  //TO DO - NEED TO IMPLEMENT EXPANSION OF A CLUSTER 
    CopyUndoDicts()

    console.log("name rclick", d.name)
    var parentIndex = filt_nodes_arr[forcesIndex].indexOf(data_arr[forcesIndex].nodes[d.name])
    var coords = { x: d.x, y: d.y, name: d.name, index: parentIndex }
    console.log("had coords "+JSON.stringify(coords))
    node_dict[d.name] = 1 
    //AddChildren(node_dict, data_arr[forcesIndex].nodes[d.name].children)
  //  FilterNodesAndLinksOnExpandClick(data_arr[forcesIndex].nodes[d.name].children, coords)
//      FilterNodesAndLinks()


    for(var i=0; i<d.children.length; i++) {
      AddChildren(node_dict, data_arr[forcesIndex].nodes[d.children[i]].children)
     // FilterNodesAndLinksOnExpandClick(data_arr[forcesIndex].nodes[d.children[i]].children, coords)
      FilterNodesAndLinks()
    }
    
    RedrawGraph(coords);
  }
}

function EnsureParentsAreVisible()
{
  for(var i =0; i<DictMax(node_dict); i++) {
    if (node_dict[i] == 1) {
      var node = data_arr[forcesIndex].nodes[i]
      while(node.parent != -1 && data_arr[forcesIndex].nodes[node.parent] != -1) {
        node_dict[data_arr[forcesIndex].nodes[node.parent]] = 1
        console.log(data_arr[forcesIndex].nodes[node.parent])
        node = data_arr[forcesIndex].nodes[data_arr[forcesIndex].nodes[node.parent].name]
      }
    }
  }
}

function formatTimeSeriesForRickshaw(tsArray) {
  var x = 0;
  var coords = []
  for(var i = 0; i < tsArray.length; i++) {
    coords[i] = { x: i, y: tsArray[i] }
  }
  return coords
}

function getTimeSeries(tsNodes) {
  var seriesData = []
  for(node in tsNodes) {
    var currNode = data_arr[forcesIndex].nodes[node]

    var currTimeSeries = formatTimeSeriesForRickshaw(currNode['timeseries'])

    var currRSdatum = {}
    currRSdatum['data'] = currTimeSeries
    currRSdatum['color'] = 'steelblue'
    currRSdatum['name'] = currNode['name']
    seriesData.push(currRSdatum)
  }
  return seriesData
}

function RemoveHighlight(nodeNum) {
  $('.node:contains("'+nodeNum+'")').filter(function() {
      return $(this).text() == nodeNum
    }).css({
     'stroke-width': '1px',
      stroke: 'white'
  }) 
}

function HighlightSelectedNodes(tsNodes) {
  for(var node in tsNodes) {
    $('.node:contains("'+node+'")').filter(function() {
      return $(this).text() == node
    }).css({
      'stroke-width': highlightWidth,
      stroke: highlightColor
    }) 
  }
}


var h_ts = 400
var w_ts = 500
var timeSeriesNodes = {}
var tsGraph
var tsData = {}
var highlightColor = "salmon"
var highlightWidth = '3px'
function DrawAllLineGraphs(tsNodes) {
  HighlightSelectedNodes(tsNodes)
  var tsData = getTimeSeries(tsNodes)  
  var numGraphs = Object.keys(tsNodes).length;
  var graphHeight = (height - 40*numGraphs) / numGraphs 
  // $('#timeSeries').html('')
  // for(var i=0; i < numGraphs; i++) {
  //   var graphId = "ts-chunk-"+i;
  //   $('#timeSeries').append("<div id=\'"+graphId+"\'><div class='y-axis'></div><div class='tsChart'></div></div>")
  //   DrawLineGraph(tsData[i], graphId, graphHeight)
  // }  
  $('#timeSeries').fadeOut('fast', function() {
    $('#timeSeries').html('')
    for(var i=0; i < numGraphs; i++) {
    var graphId = "ts-chunk-"+i;
      $('#timeSeries').append("<div class='tsChunk' id=\'"+graphId+"\'><div class='graphName'></div><a href='#' class='removeButton'>x</a><div class='y-axis'></div><div class='tsChart'></div></div>")
      DrawLineGraph(tsData[i], graphId, graphHeight)
    }  
    $('#timeSeries').fadeIn('fast', function() {
    })


    $('.removeButton').click(function() {
      var nodeToRemove = parseInt($(this).parent().find('.graphName').text())
      delete timeSeriesNodes[nodeToRemove];
      RemoveHighlight(nodeToRemove)
      DrawAllLineGraphs(timeSeriesNodes)
    })
  })
}

function DrawLineGraph(lineGraphData, divId, ht) {
  var graphSelector = $('#'+divId)
  $('.graphName', graphSelector).html(lineGraphData['name'])
  var graphElem = $('.tsChart', graphSelector)[0]
  var axisElem = $('.y-axis', graphSelector)[0]

  var graph = new Rickshaw.Graph({
      element: graphElem,
      renderer: 'line',
      width: w_ts,
      height: ht,
      series: [lineGraphData],
      min: 'auto'
  });

  var yAxis = new Rickshaw.Graph.Axis.Y({
    graph: graph,
    element: axisElem,
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
    orientation: 'left'
  });

  // var hoverDetail = new Rickshaw.Graph.HoverDetail( {
  //   graph: graph,
  //   formatter: function(series, x, y) {
  //     // var date = '<span class="date">' + new Date(x * 1000).toUTCString() + '</span>';
  //     // var swatch = '<span class="detail_swatch" style="background-color: ' + series.color + '"></span>';
  //     var content = "(" + parseInt(x) + ", " + parseInt(y) + ")"
  //     return content;
  //   }
//} );

  var x_axis = new Rickshaw.Graph.Axis.Time( { graph: graph } );

  graph.render();
}

// function DrawLineGraph(tsNodes) {
//   var tsData = getTimeSeries(tsNodes)

//   $('#tsChart').html('')
//   $('#y-axis').html('')

//   tsGraph = new Rickshaw.Graph({
//       element: document.querySelector("#tsChart"),
//       renderer: 'line',
//       width: w_ts,
//       height: h_ts,
//       series: tsData,
//       min: 'auto'
//   });

//   var yAxis = new Rickshaw.Graph.Axis.Y({
//     graph: tsGraph,
//     element: document.getElementById('y-axis'),
//     tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
//     orientation: 'left'
//   });

//   var x_axis = new Rickshaw.Graph.Axis.Time( { graph: tsGraph } );

//   tsGraph.render();
// }

function CopyUndoDicts()
{
    prev5_node_dict = CopyDict(prev4_node_dict)
    prev4_node_dict = CopyDict(prev3_node_dict)
    prev3_node_dict = CopyDict(prev2_node_dict)
    prev2_node_dict = CopyDict(prev_node_dict)
    prev_node_dict = CopyDict(node_dict)
}


//function initializeSliders(data, force, svg, color) {
//function initializeSliders(force, svg, color) {
  function initializeSliders(svg, color) {
  console.log('data,')
  console.log(data_arr[forcesIndex])
	$( "#CorrSlider" ).slider({max: 100, min: 0, animate: "slow", 
                      value: threshold,
                      change: function(event, ui) {
                      threshold = ui.value;
                      console.log(threshold)
                      filt_links_arr[forcesIndex] = data_arr[forcesIndex].links.filter(function(element){ 
                                      var sourceindex = 0
                                      var targetindex = 0
                                      if (typeof element.source=="number") {sourceindex = element.source}
                                      else {sourceindex = element.source.name}
                                      if (typeof element.target=="number") {targetindex = element.target}
                                      else {targetindex = element.target.name}
                                      return ValidLink(sourceindex, targetindex)})
                      console.log("filt_links", filt_links_arr[forcesIndex].length)  
                      RedrawGraph()
                    }
                  });

	$( "#RepulsionSlider" ).slider({max: 100, min: 5, animate: "slow", 
	                      value: -initCharge,
	                      change: function(event, ui) {
	                            forces[forcesIndex].charge(function(d) {return -(d.group+1)*ui.value});
	                           RedrawGraph()
	                       }
	                  });


	$( "#LevelSlider" ).slider({min: 0, animate: "slow",
	                            step: 2, value: hierarchyLevel, 
	                            change: function(event, ui) {
	                                level = ui.value;
                                  hierarchyLevel = level
	                                console.log("level", level)
                                  console.log("hierarchyLevel", hierarchyLevel)
	                                console.log("nodes.length", data_arr[forcesIndex].nodes.length)
	                                for(var i=0; i < data_arr[forcesIndex].nodes.length; i++) {

	                                  if (CheckNode(data_arr[forcesIndex].nodes[i]['group'], hierarchyLevel, i, data_arr[forcesIndex].nodes.length)) {
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
                                    prevIndex = globalTimeIndex
                                    globalTimeIndex = index

                                    console.log("timeslider: nodes.length", data_arr[forcesIndex].nodes.length)
                                   // TimeStepGraph(globalTimeIndex, prevIndex)
                                    forcesIndex = globalTimeIndex
                                    if(forces.hasOwnProperty(globalTimeIndex)) {
                                   //    DrawForce()
                                       LoadData()
                                    } else {
                                      LoadData()
                                    }
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
                              CopyUndoDicts()
                              globalClusterMetric = ui.value;
                              console.log('globalClusterMetric', globalClusterMetric)
                              for(var i=0; i < data_arr[forcesIndex].nodes.length; i++) {
                                    if (data_arr[forcesIndex].nodes[i].metric >  globalClusterMetric ) {
                                          node_dict[i] = 0
                                    } else {
                                      if (CheckNode(data_arr[forcesIndex].nodes[i].group, 0, i, data_arr[forcesIndex].nodes.length)) {
                                          node_dict[i] = 1
                                        } else {
                                          node_dict[i] = 0
                                        }
                                    }
                                  }          
                              EnsureParentsAreVisible()                      
                              FilterNodesAndLinks()
                              RedrawGraph() 
                         } 
                        });

$( "#UndoButton" ).button({label: "undo" });

$("#UndoButton").click(function() {
    console.log("undo")
    node_dict = CopyDict(prev_node_dict)
    prev_node_dict = CopyDict(prev2_node_dict)
    prev2_node_dict = CopyDict(prev3_node_dict)
    prev3_node_dict = CopyDict(prev4_node_dict)
    prev4_node_dict = CopyDict(prev5_node_dict)
    FilterNodesAndLinks()
    RedrawGraph()
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

