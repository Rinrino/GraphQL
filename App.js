
document.addEventListener('DOMContentLoaded', function () {
  const jwtToken = localStorage.getItem('jwt');
  
  if(jwtToken){
    graphqlQuery(jwtToken)
    displayDashboard();
  }
  
});

/* let xpTimeChartData;
let xpProjectChartData; */

function displayDashboard() {
    // Show dashboard and hide login form
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'flex';
  }
  
  
function graphqlQuery(token) {
  
  console.log("graphqlQuery got called!!")
  // Replace 'YOUR_GRAPHQL_ENDPOINT' with your actual GraphQL endpoint
  const graphqlEndpoint = 'https://learn.01founders.co/api/graphql-engine/v1/graphql';

    // Replace 'YOUR_GRAPHQL_QUERY' with your actual GraphQL query
  const graphqlQuery = `
  {
    user {
      id
      login
      createdAt
      campus
      attrs
    }

     progress(
         where: {
          object: {type: { _eq: "project" }}
        }
        order_by: {createdAt: desc}
      ){
        id
        userId
        createdAt
        grade
        path
         object {
          id
          name
          type
          groups{
            id
            status
            captainLogin
            members{
              userLogin
            }
          }
        }
      }
        
    transaction(
      where: {
        object: {type: { _eq: "project" }}
      }
      order_by: {createdAt: desc}
    ) {
      amount
      path
      event {
        createdAt
      }
      createdAt
      type
      object {
        id
        name
        type
      }
    }
  }
`;

  fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query: graphqlQuery }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error('Failed to fetch GraphQL data');
    }
    return response.json();
  })
  .then(result => {
    
    
    console.log("GraphQL result:", result);
  
    // Display the GraphQL data in text format below the dashboard sections
    displayUserInfo(result.data.user);
    displayOnPrgressInfo(result.data.progress)
    displayXPInfo(result.data.transaction)
    displayAuditInfo(result.data.transaction)
    displayXPLineChart(result.data.transaction)
    displayXPBarChart(result.data.transaction)
    
    // Call the function with the fetched transactions
    // debug print
    printTransactionTypes(result.data.transaction);
    
    // Attach event listener for window resize
    // window.addEventListener('resize', handleResize);
  })
  .catch(error => {
    console.error(error);
  });
}


function displayUserInfo(data) {
  const user = data[0]

  //document.getElementById('firstName').textContent = user.attrs.firstName;
  document.getElementById('userLoginName').textContent = user.login;
  document.getElementById('userId').textContent = user.id;
  document.getElementById('stdId').textContent = user.attrs.studentId;
  document.getElementById('login').textContent = user.login;
  document.getElementById('createdAt').textContent = formattedDateStringFrom(user.createdAt);
  document.getElementById('campus').textContent = capitalized(user.campus);
  document.getElementById('fullName').textContent = user.attrs.firstName + " " + user.attrs.lastName;

}

function  displayOnPrgressInfo(progress){
  const currentProject = progress[0].object.name;
  const groupData = progress[0].object.groups
  .filter(group => group.captainLogin === 'rinrino');
 // Extract and flatten the members array
  const members = groupData.flatMap(group => group.members);
  
  // Exclude the last member
  const membersExcludingLastTwo = members.slice(0, -2);

  const memberNames = membersExcludingLastTwo.map(member => `<span style="color: #007bff;">${member.userLogin}</span>`).join(', ');
  
  console.log("all members name",membersExcludingLastTwo)
  // new last member
  const lastMemberName = membersExcludingLastTwo.length > 0 ? `<span style="color: #007bff;">${ members[ members.length - 2].userLogin}</span>` : '';

  console.log("last member:",lastMemberName)
  // debug print
/*   members.forEach(member => {
    console.log(member.userLogin);
  }); */

  //console.log(currentProject)
  document.getElementById('latest_Project').textContent = currentProject;
 // Get project start time
  const projectStartAt = new Date(progress[0].createdAt);
  console.log("Project started at:", projectStartAt);
  
  // Calculate the duration
  const now = new Date();
  const durationMillis = now - projectStartAt;
  const durationSecs = Math.floor(durationMillis / 1000);
  
  const weeks = Math.floor(durationSecs / (7 * 24 * 60 * 60));
  const days = Math.floor((durationSecs % (7 * 24 * 60 * 60)) / (24 * 60 * 60));
  const hours = Math.floor((durationSecs % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((durationSecs % (60 * 60)) / 60);
  const seconds = durationSecs % 60;
   // Create the duration string
   const durationString = `${weeks}w ${days}d ${hours}h ${minutes}m ${seconds}s`;

   // Display the information
   document.getElementById('duration').textContent = ` ${durationString}`;
   
   // Update members span to include all members except the last one
   document.getElementById('members').innerHTML = membersExcludingLastTwo.length > 0 ? ` with ${memberNames}` : '';
    if (lastMemberName) {
      document.getElementById('members').innerHTML += `, and ${lastMemberName}`;
    }
   console.log("Duration:", durationString);
}

function displayXPInfo(transactions){
  const totalXp = transactions
  .filter((transaction) => transaction.type === 'xp')
  .reduce((sum, transaction) => sum + transaction.amount, 0);

  document.getElementById('totalXp').textContent = formatNumber(totalXp);

  const projectsList = document.getElementById('xp-info');
  transactions
    .filter((transaction) => transaction.type === 'xp')
    .slice(0, 3).forEach((project) => {
      const projectItem = document.createElement('li');
      projectItem.textContent = 'Project' + ': ' +  `${project.object.name} - ${formatNumber(project.amount)}`;
      projectsList.appendChild(projectItem);
  });
}

function displayAuditInfo(transactions){
  // get totalUp 
  const totalUp = transactions
  .filter((transaction) => transaction.type === 'up')
  .reduce((sum, transaction) => sum + transaction.amount, 0);
  
const totalDown = transactions
  .filter((transaction) => transaction.type === 'down')
  .reduce((sum, transaction) => sum + transaction.amount, 0);
    
  const auditRatio = totalUp / totalDown;  
  
  document.getElementById('auditRatio').textContent = auditRatio.toFixed(1); // Display as float with 1 decimal places
  document.getElementById('totalUp').textContent =  formatNumber(totalUp);
  document.getElementById('totalDown').textContent = formatNumber(totalDown);
  generateAuditLine(totalUp,totalDown);
}

function generateAuditLine(totalUp, totalDown) {
  const parentDiv = document.getElementById('audit-left');

  // Set the width for the SVG containers
  const svgWidth = parentDiv.clientWidth;
  const svgHeight = 10; 
  
    // Define the D3 scale
    const xScale = d3.scaleLinear()
   .domain([0, Math.max(totalUp, totalDown)]) // Domain is the range of data values
   .range([0, svgWidth]); // Range is the range of the SVG container width

  // Calculate the length of the lines using the scale
  const doneLineLength = xScale(totalUp);
  const receivedLineLength = xScale(totalDown);  

 /*   // Calculate the maximum line length for proportional scaling
  const maxTotal = Math.max(totalUp, totalDown);
  
  // Calculate the length of the lines based on totalUp and totalDown
  const doneLineLength = (totalUp / maxTotal) * (svgWidth - 20); // Leave some padding
  const receivedLineLength = (totalDown / maxTotal) * (svgWidth - 20);  */ 
  
  // Clear previous lines
  d3.select("#done-svg").selectAll("*").remove();
  d3.select("#received-svg").selectAll("*").remove();
  
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

function displayXPLineChart(transactions) {
  // Extracting data for the line chart
  const lineChartData = transactions
  /*TODO:CHECK MORE FILTER XP OR NOT*/
   .filter((transaction) => transaction.type === 'xp')  
    .map((transaction) => ({
      date: new Date(transaction.createdAt),
      xp: transaction.amount,
      projectName:transaction.object.name,
      type:transaction.type,
    }));
    
    console.log("linechat data=>",lineChartData)
  
    generateLineChart(lineChartData);
}

function generateLineChart(data) {
  
  // Clear existing SVG content
  d3.select("#lineChart").selectAll("*").remove();

  // Sort the data based on date
  data.sort((a, b) => a.date - b.date);

  // Set up margins and dimensions
  const parentDiv = document.getElementById('xp-progress-chart')
  const margin = { top: 20, right: 50, bottom: 30, left: 50 };
  const width = parentDiv.clientWidth - margin.left - margin.right;
  const height = 300 - margin.top - margin.bottom;

  const cumulativeData = data.map((d, i) => ({
    date: d.date,
    projectName:d.projectName,
    xp: data.slice(0, i + 1).reduce((sum, item) => sum + item.xp, 0),
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
    d3.select(this).attr("fill", "royalblue"); // Change color on hover

    tooltipLine1.text(d.projectName)
      .attr("x", xScale(d.date)-70) // move left
      .attr("y", yScale(d.xp) + 50); // move down

    tooltipLine2.text(formatNumber(d.xp))
      .attr("x", xScale(d.date)-70)  // move left
      .attr("y", yScale(d.xp) + 70) ; // move down

    tooltipLine3.text("finished at: "+ formattedDateStringFrom(d.date))
    .attr("x", xScale(d.date)-70)  // move left
    .attr("y", yScale(d.xp) + 70) ; // move down
        
    tooltip.style("opacity", 1); // Show the tooltip
  })
  .on("mouseout", function() {
    d3.select(this).attr("fill", "white"); // Revert color on mouse out
    tooltip.style("opacity", 0); // Hide the tooltip
  });

  // Append x and y axes
  svg.append("g")
  .attr("transform", `translate(0,${height})`)
  .call(d3.axisBottom(xScale));

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
  .text(`Current XP: ${finalXpLabel}`);

  xScale.range([0, width]);
  yScale.range([height, 0]);

}

function displayXPBarChart(transactions){
  const barChartData = transactions
  .filter((transaction) => transaction.type === 'xp')
  .map((transaction) => ({
    project: transaction.object.name,
    xp: transaction.amount,
  }));

  generateXPBarChart(barChartData)
}

function generateXPBarChart(data) {
  // Clear existing SVG content
  d3.select("#barChart").selectAll("*").remove();

  // Set up scales with dynamic dimensions based on parent div
  const parentDiv = document.getElementById('barChartContainer');
  const margin = { top: 20, right: 20, bottom: 60, left: 40};
  const width = parentDiv.clientWidth - margin.left - margin.right;
  const height = 300; // Set an initial height or adjust as needed

  // Group data by project name and calculate total XP for each project
  const projectsData = d3.group(data, d => d.project);
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
    .padding(0.1);

  const yScale = d3.scaleLinear()
    .domain([0, d3.max(projectXpData, d => d.totalXp)])
    .range([height, 0]);

  // Draw the bars
  svg.selectAll("rect")
    .data(projectXpData)
    .enter().append("rect")
    .attr("class", "rect")
    .attr("x", d => xScale(d.projectName))
    .attr("y", d => yScale(d.totalXp))
    .attr("width", xScale.bandwidth())
    .attr("height", d => height - yScale(d.totalXp))
    .attr("fill", "royalblue")
    .on("mouseover", function (event, d) {  /* only show the lebel when hover over the bar*/ 
      d3.select(this)
      
    // add a label on top of each bar, when hover over the bar 
    svg.append("text")
      .attr("class", "hover-label")
      .attr("x", xScale(d.projectName) + xScale.bandwidth() / 2)
      .attr("y", yScale(d.totalXp) - 5)
      .attr("dy", ".75em")
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
    .style("text-anchor", "end");

  svg.append("g")
    .call(d3.axisLeft(yScale));
    
}

// Function to extract and print transaction types
function printTransactionTypes(transactions) {
  const types = transactions.map(transaction => transaction.type);
  
 /*  console.log("Transaction Types:");
  types.forEach(type => {
    console.log(type);
  }); */
  console.log("all transation types:",types)
}

function formattedDateStringFrom(dateString) {
  var date = new Date(dateString);

  // Define options for the date formatting
  var options = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  var formattedDate = date.toLocaleDateString('en-GB', options);
  return formattedDate
}

function capitalized(text) {
  return text[0].toUpperCase() + text.slice(1).toLowerCase()
}

function formatNumber(value) {
  const number = parseFloat(value)
  if (isNaN(number)) {
    return "NaN";
  }

  if (number < 1000) {
      return number;
  } else if (number < 1000000) {
      return (number / 1000).toFixed(0) + " kB";
  } else {
      return (number / 1000000).toFixed(2) + " MB";
  }
}

function login(){
    
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  const credentials = btoa(`${username}:${password}`);
  const authEnpoint =  'https://learn.01founders.co/api/auth/signin';
  
  fetch(authEnpoint,{
    method:'POST',
    headers:{
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  })
  .then(response =>{
    if (!response.ok){
      throw new Error('Invalid credentails');
    }
    return response.json();
  })
  
  .then(token => {
    if (!token) {
      throw new Error('Token not found in the response');
    }
    document.getElementById('error').innerHTML = '';

    // Save the token in localStorage or cookie
    localStorage.setItem('jwt', token);
    
    // fetch data
    graphqlQuery(localStorage.getItem('jwt'));
    // Show logout button and hide login form
    displayDashboard()
  })
  .catch(error => {
    document.getElementById('error').textContent = error.message;
  });
}

function logout() {
  // Remove the token from localStorage or cookie
  localStorage.removeItem('jwt');

  // Show login form and hide dashboard
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('dashboardContainer').style.display = 'none';
  document.getElementById('error').innerHTML = '';
}


window.addEventListener('resize', function() {

});
