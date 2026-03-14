import { formatNumber, formattedDateStringFrom } from './utils.js';

export function generateAuditLine(upLineData,downLineData) {
  // Clear previous lines
  d3.select("#done-svg").selectAll("*").remove();
  d3.select("#received-svg").selectAll("*").remove();
   
  
  const parentDiv = document.getElementById('done-container');

  // Set the width for the SVG containers
  const svgWidth = parentDiv.clientWidth-10;
  const svgHeight = 10; 
  
    // Define the D3 scale
    const xScale = d3.scaleLinear()
   .domain([0, Math.max(upLineData, downLineData)]) // Domain is the range of data values
   .range([0, svgWidth]); // Range is the range of the SVG container width

  // Calculate the length of the lines using the scale
  const doneLineLength = xScale(upLineData);
  const receivedLineLength = xScale(downLineData);  

 /*   // Calculate the maximum line length for proportional scaling
  const maxTotal = Math.max(totalUp, totalDown);
  
  // Calculate the length of the lines based on totalUp and totalDown
  const doneLineLength = (totalUp / maxTotal) * (svgWidth - 20); // Leave some padding
  const receivedLineLength = (totalDown / maxTotal) * (svgWidth - 20);  */ 
  
  // Create lines
  const doneLineSection = d3.select("#done-svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  
  const receivedLineSection = d3.select("#received-svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight);
  
  // Define the data for the lines
  const doneLineData = [
    { x1: 0, y1: svgHeight / 2, x2:  doneLineLength, y2: svgHeight / 2, stroke: "#16B3C9", 'stroke-width': 6 }
  ];

  const receivedLineData = [
    { x1: 0, y1: svgHeight / 2, x2:  receivedLineLength, y2: svgHeight / 2, stroke: "white", 'stroke-width': 6 }
  ];

  // Create lines for 'done'
  doneLineSection.selectAll("line")
    .data(doneLineData)
    .enter()
    .append("line")
    .attr("x1", d => d.x1)
    .attr("y1", d => d.y1)
    .attr("x2", d => d.x2)
    .attr("y2", d => d.y2)
    .attr("stroke", d => d.stroke)
    .attr("class","done-line")
    .attr("stroke-width", d => d['stroke-width']);

  // Create lines for 'received'
  receivedLineSection.selectAll("line")
    .data(receivedLineData)
    .enter()
    .append("line")
    .attr("x1", d => d.x1)
    .attr("y1", d => d.y1)
    .attr("x2", d => d.x2)
    .attr("y2", d => d.y2)
    .attr("stroke", d => d.stroke)
    .attr("class","received-line")
    .attr("stroke-width", d => d['stroke-width']);
}

export function generateLineChart(lineChartData ) {
  // STRICT PROTECTION: If data is null or empty, stop here
  if (!lineChartData || lineChartData.length === 0) return;
  
  // Clear existing SVG content
  d3.select("#lineChart").selectAll("*").remove();

  // Sort the data based on date
  lineChartData.sort((a, b) => a.date - b.date);

  // Set up margins and dimensions
  const parentDiv = document.getElementById('xp-progress-chart')
  const margin = { top: 20, right: 50, bottom: 20, left: 50 };
  const width = parentDiv.clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const cumulativeData = lineChartData.map((d, i) => ({
    date: d.date,
    projectName:d.projectName,
    xp: lineChartData.slice(0, i + 1).reduce((sum, item) => sum + item.xp, 0),
  }));
  // Create an SVG container
  const svg = d3.select("#lineChart")
  .attr("width", width + margin.left + margin.right)
  .attr("height", height + margin.top + margin.bottom)
  .append("g")
  .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales
  const xScale = d3.scaleTime()
  .domain(d3.extent(cumulativeData, d => d.date))  // [new Date('2023-01-01'), new Date('2023-01-04')]
  .range([0, width]); // [0, 500] if width = 500

  // convert data values into visual representation coordinates.
  const yScale = d3.scaleLinear()
  .domain([0, d3.max(cumulativeData, d => d.xp)])  // [0, 50] the rnage of the xp
  .range([height, 0]); // [300, 0]  if height = 300

  // Define the line function
  const line = d3.line()
  .x(d => xScale(d.date))
  .y(d => yScale(d.xp));

  // line     
  // Output: "M0,240L166.67,180L333.33,120L500,0"

  // Append the line to the SVG
  svg.append("path")
    .datum(cumulativeData)
    .attr("class", "line")
    .attr("d", line);

  // Add circles for each data point
 const circles = svg.selectAll(".dot")
    .data(cumulativeData)
    .enter().append("circle")
    .attr("class", "dot")
    .attr("cx", d => xScale(d.date))
    .attr("cy", d => yScale(d.xp))
    .attr("r", 6) // Size of the circle
    .attr("stroke", "#444") // Outline's color
    .attr("stroke-width", 3) // Outline width
    .attr("fill", "white") // Color of the circle
    
  // Add tooltip text elements
  const tooltip = svg.append("g")
    .attr("class", "tooltip")
    .style("opacity", 0)
    .style("pointer-events", "none");

  // project name
  const tooltipLine1 = tooltip.append("text")
    .attr("class", "tooltip-line1")
    .attr("font-size", "1.5rem")
    .attr("fill", "rgb(243, 239, 148)");
  
  // xp
  const tooltipLine2 = tooltip.append("text")
    .attr("class", "tooltip-line2")
    .attr("font-size", "1.7rem")
    .attr("font-weight", "bold")
    .attr("fill", "rgb(210, 44, 194)")
    .attr("dy", "0.5em"); // Position this line below the first line
  
  // date
  const tooltipLine3 = tooltip.append("text")
  .attr("class", "tooltip-line3")
  .attr("font-size", "1.5rem")
  .attr("fill", "lightgreen")
  .attr("dy", "1.8em"); // Position this line below the first line

  // Show and position the tooltip on hover
  circles.on("mouseover", function(event, d) {
    d3.select(this).transition().duration(200).attr("fill", "royalblue"); // Change color on hover with transition

    tooltip.transition().duration(200).style("opacity", 1); // Show the tooltip with transition

    tooltipLine1.transition().duration(200)
      .attr("x", xScale(d.date) - 70) // move left
      .attr("y", yScale(d.xp) + 50) // move down
      .text(d.projectName);

    tooltipLine2.transition().duration(200)
      .attr("x", xScale(d.date) - 70)  // move left
      .attr("y", yScale(d.xp) + 70) // move down
      .text(formatNumber(d.xp));

    tooltipLine3.transition().duration(200)
      .attr("x", xScale(d.date) - 70)  // move left
      .attr("y", yScale(d.xp) + 70) // move down
      .text(formattedDateStringFrom(d.date));
  })
  .on("mouseout", function() {
    d3.select(this).transition().duration(200).attr("fill", "white"); // Revert color on mouse out with transition
    tooltip.transition().duration(200).style("opacity", 0); // Hide the tooltip with transition
  });
  
  
  // Custom function to display month and year
  let previousYear = null;

  const tickFormat = (date) => {
    const formatMonth = d3.timeFormat("%b"); // Format: Jan, Feb, Mar, etc.
    const formatYear = d3.timeFormat("%Y"); // Format: 2024, 2025, etc.

    const currentYear = d3.timeFormat("%Y")(date);

    // Show both year and month if year changes
    if (currentYear !== previousYear) {
      previousYear = currentYear;
      return `${formatMonth(date)}\n${formatYear(date)}`;
    } else {
      return formatMonth(date);
    }
  };

  // Append x and y axes
  svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .style("font-size", "16px")
  .call(d3.axisBottom(xScale).tickFormat(tickFormat))
  .selectAll(".tick text")
  .each(function(d, i) {
    const text = d3.select(this);
    const lines = text.text().split('\n');
    text.text(''); // Clear existing text
    lines.forEach((line, index) => {
      text.append("tspan")
        .text(line)
        .attr("x", 0)
        .attr("dy", index === 0 ? 0 : "1.2em");
    });
  });
  svg.append("g")
  .call(d3.axisLeft(yScale));

  // Update SVG and scales with new dimensions
  svg.attr("width", width)
  .attr("height", height);

  const finalXpLabel = formatNumber(cumulativeData[cumulativeData.length - 1].xp);
  svg.append("text")
  .attr("fill", "#ddd")
  .attr("x", width - 10)
  .attr("y", yScale(finalXpLabel))
  .attr("text-anchor", "end")
  .attr("alignment-baseline", "middle")
  .style("font-size", "20px")
  .text(`Current XP: ${finalXpLabel}`);

  xScale.range([0, width]);
  yScale.range([height, 0]);

}

export function generateXPBarChart(selectedData,selectedCategory ) {
  if (!selectedData || selectedData.length === 0) return;
  
  console.log("Data passed to generateXPBarChart:", selectedData);
  
  const parentDiv = document.getElementById('barChartContainer');
  // Clear existing SVG content
  d3.select("#barChart").selectAll("*").remove();
  // Clear any existing no-data message
  const noDataMessage = parentDiv.querySelector('.no-data-message');
  if (noDataMessage) {
    noDataMessage.remove();
  }
 
   const barChartSvg = document.getElementById('barChart');
  
   // Display a message if there are no projects for the selected language
   if (selectedData.length === 0) {
    // Hide the SVG
    barChartSvg.style.display = 'none';
    const noDataMessage = document.createElement('div');
    noDataMessage.style.marginBottom = '20px'; 
    noDataMessage.className = 'no-data-message';
    noDataMessage.innerHTML = `
      <p>No projects available for the selected language: ${selectedCategory}</p>
    `;
    parentDiv.appendChild(noDataMessage);
    return; // Exit the function as there's no data to display
  }
    // Show the SVG if there is data
  barChartSvg.style.display = 'block';
  
  // Set up scales with dynamic dimensions based on parent div
  const margin = { top: 40, right: 60, bottom: 20, left: 60};
  const width = parentDiv.clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom; // Set an initial height or adjust as needed

  // Group data by project name and calculate total XP for each project
  const projectsData = d3.group(selectedData, d => d.project);
  const projectXpData = Array.from(projectsData, ([projectName, projectData]) => ({
    projectName,
    totalXp: d3.sum(projectData, d => d.xp),
  }));

  // Create SVG container for the bar chart
  const svg = d3.select("#barChart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Set up scales for the bar chart
  const xScale = d3.scaleBand()
    .domain(projectXpData.map(d => d.projectName))
    .range([0, width])
    .padding(0.1)
    
  // Define a maximum bar width, to avoid if the data only few then become too big
  const maxBarWidth = 50; 
  
  const yScale = d3.scaleLinear()
    .domain([0, d3.max(projectXpData, d => d.totalXp)])
    .range([height, 0]);

     // Draw the bars
    svg.selectAll("rect")
    .data(projectXpData)
    .enter().append("rect")
    .attr("class", "rect")
    .attr("x", d => xScale(d.projectName) + (xScale.bandwidth() - Math.min(xScale.bandwidth(), maxBarWidth)) / 2)  /* let the bar on top of it*/
    .attr("y", d => yScale(d.totalXp))
    .attr("width", d => Math.min(xScale.bandwidth(), maxBarWidth))
    .attr("height", d => height - yScale(d.totalXp))
    .attr("fill", "royalblue")
    .on("mouseover", function (event, d) {
      d3.select(this);
      
    // Add a label on top of each bar when hovering
    svg.append("text")
      .attr("class", "hover-label")
      .attr("x", xScale(d.projectName) + (xScale.bandwidth() - Math.min(xScale.bandwidth() , maxBarWidth)) / 2 + 15)   
      .attr("y", yScale(d.totalXp) - 10)
      .attr("dy", ".75em")
      .attr("font-size", "25px")
      .attr("text-anchor", "middle")
      .attr("fill", "#ddd") // Change text color 
      .text(formatNumber(d.totalXp));
    })
    .on("mouseout", function () {
      d3.select(this)
        .attr("fill", "royalblue");

      svg.selectAll(".hover-label").remove();
    });
    
    // Draw x and y axes
    svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xScale))
    .selectAll("text")
    .attr("transform", "rotate(-45)")
    .style("text-anchor", "end")
    .style("font-size", "18px");

  svg.append("g")
    .call(d3.axisLeft(yScale));
    
}

export function generateSkillsRadarChart(skillsRadarData,selectedTypeOfSkills) {
  if (!skillsRadarData || skillsRadarData.length === 0) return;
  // debug print
  // console.log("skill data:",skillsRadarData)
  // console.log("selected skill:",selectedTypeOfSkills)
  
   // Set up scales with dynamic dimensions based on parent div
   const parentDiv = document.getElementById('radarChartContainer');
   const width = parentDiv.clientWidth || 400; 
   const height = width;
   const margin = 50; 
   const radius = Math.max(0, (Math.min(width, height) / 2) - margin);
  
  
  // Clear existing SVG content
  d3.select("#radarChart").selectAll("*").remove();
  const noDataMessage = parentDiv.querySelector('.no-data-message');
  if (noDataMessage) {
    noDataMessage.remove();
  }
  
   const radarChartSvg = document.getElementById('radarChart');
    // Show the SVG if there is data
    radarChartSvg.style.display = 'block';

   // Display a message if there are no projects for the selected language
   if (skillsRadarData.length === 0) {
    // Hide the SVG
    radarChartSvg.style.display = 'none';
    const noDataMessage = document.createElement('div');
    noDataMessage.style.marginBottom = '20px'; 
    noDataMessage.className = 'no-data-message';
    noDataMessage.innerHTML = `
      <p>No skills available for the selected type: ${selectedTypeOfSkills}</p>
    `;
    parentDiv.appendChild(noDataMessage);
    return; // Exit the function as there's no data to display
  }

  const svg = d3.select("#radarChart")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

  const angleSlice = Math.PI * 2 / Object.keys(skillsRadarData).length;

  const rScale = d3.scaleLinear()
    .domain([0, 100]) // Assuming percentages
    .range([0, radius]);

  const radarLine = d3.lineRadial()
    .radius(d => rScale(d.value))
    .angle((d, i) => i * angleSlice)
    .curve(d3.curveLinearClosed);

  // Data for radar chart
  const data = Object.entries(skillsRadarData).map(([key, value]) => ({ key, value }));

  // Draw radar chart background
  const gridLevels = 5;
  svg.selectAll(".gridCircle")
    .data(d3.range(1, gridLevels + 1).reverse())
    .enter().append("circle")
    .attr("class", "gridCircle")
    .attr("r", d => radius / gridLevels * d)
    .style("fill", "#CDCDCD")
    .style("stroke", "#CDCDCD")
    .style("fill-opacity", 0.1);

  // Add the outer circle
  svg.append("circle")
    .attr("r", radius)
    .style("fill", "none")
    .style("stroke", "#CDCDCD");

  // Draw radar chart lines
  svg.append("path")
    .datum(data)
    .attr("class", "radarLine")
    .attr("d", radarLine)
    .style("fill", "#69b3a2")
    .style("stroke", "#69b3a2")
    .style("fill-opacity", 0.5);

  // Draw axis lines
  const axisGrid = svg.selectAll(".axis")
    .data(data)
    .enter().append("g")
    .attr("class", "axis");

  axisGrid.append("line")
    .attr("x1", 0)
    .attr("y1", 0)
    .attr("x2", (d, i) => rScale(100) * Math.sin(i * angleSlice))
    .attr("y2", (d, i) => -rScale(100) * Math.cos(i * angleSlice))
    .style("stroke", "#CDCDCD")
    .style("stroke-width", "2px");

  // Draw axis labels
  axisGrid.append("text")
    .attr("class", "axisLabel")
    .attr("x", (d, i) => (rScale(100) + 25) * Math.sin(i * angleSlice)) // Increase offset
    .attr("y", (d, i) => -(rScale(100) + 25) * Math.cos(i * angleSlice)) // Increase offset
    .attr("dy", "0.35em")
    .style("font-size", "1.8rem")
    .style("fill", "rgba(255,255,255,0.4)")
    .style("text-anchor", "middle")
    .text(d => d.key);

  // Draw radar chart circles
  svg.selectAll(".radarCircle")
    .data(data)
    .enter().append("circle")
    .attr("class", "radarCircle")
    .attr("r", 8)
    .attr("cx", (d, i) => rScale(d.value) * Math.sin(i * angleSlice))
    .attr("cy", (d, i) => -rScale(d.value) * Math.cos(i * angleSlice))
    .style("fill", "#69b3a2")
    .style("fill-opacity", 0.8)
    .on("mouseover", function(event, d) {
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`${d.value}%`)
        .style("left", (event.pageX + 5) )
        .style("top", (event.pageY - 28) );
        
      d3.select(this)   /*make circle bigger,when hover it*/
        .transition().duration(200)
        .attr("r", 6)
        .style("fill", "white")
        .style("fill-opacity", 1);

      d3.selectAll(".axisLabel") /* select corespond label and make it bigger*/
        .filter(function(label) { return label === d; })
        .transition().duration(200)
        .style("font-size", "2.8rem")
        .style("fill", "white")
        .style("fill-opacity", 1);
    })
    .on("mousemove", function(event) {
      tooltip.style("left", (event.pageX -25 ) + "px") // change the tootip text position
        .style("top", (event.pageY - 55) + "px"); // change the tootip text position
    })
    .on("mouseout", function(event, d) {
      tooltip.transition().duration(200).style("opacity", 0);

      d3.select(this)
        .transition().duration(200)
        .attr("r", 8)
        .style("fill", "#69b3a2")
        .style("fill-opacity", 0.8);

      d3.selectAll(".axisLabel")
        .filter(function(label) { return label === d; })
        .transition().duration(200)
        .style("font-size", "1.8rem")
        .style("fill-opacity", 0.4);
    });

  // Tooltip element
  const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip")
  .style("opacity", 0)
  .style("position", "absolute")
  .style("text-align", "center")
  .style("padding", "8px")
  .style("font-size", "1.8rem")
  .style("color", "#fff")  // Tooltip text color
  .style("background", "none") // No background
  .style("border", "none") // No border
  .style("pointer-events", "none");
}
