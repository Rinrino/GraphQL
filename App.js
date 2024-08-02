// data for resizing 
let lineChartData, transactions,selectedData  ,upLineData,downLineData,skillsRadarData;

document.addEventListener('DOMContentLoaded', function () {
  const jwtToken = localStorage.getItem('jwt');
  
  if(jwtToken){
    graphqlQuery(jwtToken)
    displayDashboard();
  }else{
    // Show login form
    document.getElementById('loginContainer').style.display = 'block';
  }
  
  // Attach event listener for window resize
  window.addEventListener('resize', handleResize);
  
});


function displayDashboard() {
    // Show dashboard and hide login form
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'grid';
  }
  
  
function graphqlQuery(token) {
  
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
    
    // debug print
    // console.log("GraphQL result:", result);
  
    /*test data*/
  /*   const userTest = [{ login: "testUser" }];
    const progress = [
      { 
        object: { 
          name: "Project 1", 
          groups: [
            { status: "finished", members: [{ userLogin: "testUser" }] }
          ] 
        } 
      }
    ]; */
    // Display all the user data
    
    transactions = result.data.transaction;
    
    displayUserInfo(result.data.user);
    displayOnProgressInfo(result.data.user,result.data.progress)
    // debug print
    // displayOnProgressInfo(userTest,progress)
    displayXPInfo(result.data.transaction)
    displayAuditInfo(result.data.transaction)
    displaySkillInfo(result.data.transaction)
    displayXPLineChart(result.data.transaction)
    displayXPBarChart(result.data.transaction)
    
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
  document.getElementById('email').textContent =  user.attrs.email;
  document.getElementById('fullName').textContent = user.attrs.firstName + " " + user.attrs.lastName;
  document.getElementById('userImage').src = user.attrs.image; 

}

function displayOnProgressInfo(user, progress) {
  const userLogin = user[0].login;

  // Filter projects where the user is in a group with status "working"
  const allCurrentWorkingProjects = progress.filter(prog =>
      prog.object.groups.some(group =>
          group.status === "working" && group.members.some(member => member.userLogin === userLogin)
      )
  );
  // debug print
   console.log("All working projects", allCurrentWorkingProjects);

  // Clear existing project info in the DOM
  const projectsContainer = document.getElementById('workingProjectsList');
  projectsContainer.innerHTML = '';

  // Track processed projects to avoid duplicates
  const processedProjects = new Set();

    // Check all current projects and display one by one
  if (allCurrentWorkingProjects.length === 0) {
    // Display a message if there are no working projects
    const noProjectsItem = document.createElement('li');
    noProjectsItem.classList.add('no-projects-item'); // Apply class for styling if needed
    noProjectsItem.innerHTML = `
      <span class="f-ms14 f-cw">No ongoing projects</span><br>
      <p class="f-cpp"><em>Keep checking for new opportunities!<em></p>
    `;
    projectsContainer.appendChild(noProjectsItem);
  } else {
    

    
    // Check all current projects and display one by one, also check how many group also working on that project
    allCurrentWorkingProjects.forEach(prog => {
        const currentProject = prog.object.name;
        
        // Skip this project if it's already been processed
        if (processedProjects.has(currentProject)) {
            return;
        }
        
        // Add project to the processed set
        processedProjects.add(currentProject);
        
        // Filter groups
        const workingGroups = prog.object.groups.filter(group => group.status === "working");
        console.log("all working group:",workingGroups);
        const finishedGroups = prog.object.groups.filter(group => group.status === "finished");
        console.log("all finished group:",finishedGroups);

        const workingGroupsCount = workingGroups.length;
        const finishedGroupsCount = finishedGroups.length;

        // Filter groups where the logged-in user is a member and group status is "working"
        const groupData = prog.object.groups.filter(group =>
            group.status === "working" && group.members.some(member => member.userLogin === userLogin)
        );

        // Extract and flatten the members array
        const members = groupData.flatMap(group => group.members);

        // Exclude the logged-in user
        const membersExcludingUser = members.filter(member => member.userLogin !== userLogin);

        // Handle members
        let memberNames = '';
        if (membersExcludingUser.length > 1) {
            // More than one member: Exclude the last one for the 'and' statement
            const memberNamesExcludingLast = membersExcludingUser.slice(0, -1)
                .map(member => `<span class="f-cb";">${member.userLogin}</span>`)
                .join(', ');
            const lastMember = membersExcludingUser.slice(-1)[0];
            const lastMemberName = `<span class="f-cb">${lastMember.userLogin}</span>`;
            memberNames = `${memberNamesExcludingLast}${memberNamesExcludingLast ? ', and ' : ''}${lastMemberName}`;
        } else if (membersExcludingUser.length === 1) {
            // Only one other member
            const lastMember = membersExcludingUser[0];
            memberNames = `<span class="f-cb">${lastMember.userLogin}</span>`;
        }


        // Get project start time
        const projectStartAt = new Date(prog.createdAt);

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

        // Create project item
        const projectItem = document.createElement('li');
        projectItem.classList.add('project-item'); // Apply class for styling
        
        // Only add "with" and memberNames if there are other members
        projectItem.innerHTML = `
            <span class="f-ms14 f-cw">${currentProject}</span> 
            <span class="f-cg3 working-count">${workingGroupsCount}</span>
            <span class="f-cw2 f-ms12">${workingGroupsCount === 1 ? ' group' : ' groups'} working,</span>
            <span class="f-cg3 finished-count">${finishedGroupsCount}</span>
            <span class="f-cw2 f-ms12">${finishedGroupsCount === 1 ? ' group' : ' groups'} finished)</span><br>
            ${membersExcludingUser.length > 0 ? `<span style="margin-top: 10px; display: inline-block;">with ${memberNames}</span><br>` : ''}
            <p>&#160;&#160;since <span class="f-ms12 f-cpp">${durationString}</span>,  <em>keep going!</em></p>
        `;

        // Append the project item to the list
        projectsContainer.appendChild(projectItem);
        
        // Add event listeners
        projectItem.querySelector('.working-count').addEventListener('click', () =>  showGroupDetails(currentProject, workingGroups));
        projectItem.querySelector('.finished-count').addEventListener('click', () =>  showGroupDetails(currentProject, finishedGroups));
        projectItem.querySelector('.finished-count').addEventListener('click', () =>  showGroupDetails(currentProject, finishedGroups));

    });
  }
  
   // Function to show the overlay with group details
   function showGroupDetails(projectName, groups) {
    
     // Check if groups is defined and is an array, and not 0
     if (!Array.isArray(groups) || groups.length === 0) {
      console.warn('No groups available or invalid groups data');
      return;
    }
    
    // Debugging: Log the groups data
    console.log("projectName:", projectName);
    console.log("groups data passed:", groups);
    
    const dataType = groups[0].status;
    
   
    // Get the overlay and content elements
    const overlay = document.getElementById('groupDetailsOverlay');
    const content = document.getElementById('groupDetailsContent');

    // Set the project name
    let contentHTML = `<h2>${projectName}</h2>`;
    
    // Add the group status line
    contentHTML += `<p class="f-cw2">All <span class="f-cpp">${groups.length}</span> ${dataType} ${groups.length === 1 ? ' group' : ' groups'}</p>`;
  

    // List each group's captain username
    contentHTML += '<ul>';
    groups.forEach(group => {
      contentHTML += `<li class="f-cw2">Captain: <span class="f-cg2"> ${group.captainLogin}</span></li>`;
    });
    contentHTML += '</ul>';

    // Set the inner HTML of the content container
    content.innerHTML = contentHTML;

    // Show the overlay
    overlay.style.display = 'block';
  }
  
}

  function closeOverlay() {
    document.getElementById('groupDetailsOverlay').style.display = 'none';
  }


function displayXPInfo(transactions){
  const totalXp = transactions
  .filter((transaction) => transaction.type === 'xp')
  .reduce((sum, transaction) => sum + transaction.amount, 0);

  document.getElementById('totalXp').textContent = formatNumber(totalXp);

  const projectsList = document.getElementById('project-list');
  
  // Clear the existing list items
  projectsList.innerHTML = '';
  
  transactions
    .filter((transaction) => transaction.type === 'xp')
    .slice(0, 5).forEach((project) => {
      const projectItem = document.createElement('li');
      projectItem.textContent =`${project.object.name} - ${formatNumber(project.amount)}`;
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
  let status 
  if (auditRatio >= 1.5){
    status ="Best ratio ever!"
  } else if (1.3 < auditRatio < 1.5){
      status ="You can do better!"
  } else {
      status ="Be careful!"
  }
  
  document.getElementById('auditRatio').textContent = auditRatio.toFixed(1); // Display as float with 1 decimal places
  document.getElementById('totalUp').textContent =  formatNumber(totalUp);
  document.getElementById('totalDown').textContent = formatNumber(totalDown);
  document.getElementById('status').textContent = status;
  
  upLineData = totalUp;
  downLineData = totalDown;
  generateAuditLine(upLineData,downLineData);
}

function generateAuditLine(upLineData,downLineData) {
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

function displayXPLineChart(transactions) {
  // Extracting data for the line chart
  lineChartData = transactions
  /*TODO:CHECK MORE FILTER XP OR NOT*/
   .filter((transaction) => transaction.type === 'xp')  
    .map((transaction) => ({
      date: new Date(transaction.createdAt),
      xp: transaction.amount,
      projectName:transaction.object.name,
      type:transaction.type,
    }));
    
    // debug print
    //console.log("linechat data=>",lineChartData)
    //xpTimeChartData =lineChartData
    generateLineChart(lineChartData);
}

function generateLineChart(lineChartData ) {
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

// Function to filter data based on the selected language
function filterDataByLanguage(data, language) {
  const jsProjectsName = [
    "make-your-game",
    "make-your-game-score-handling",
    "make-your-game-history",
    "make-your-game-different-maps",
    "real-time-forum",
    "real-time-forum-typing in progress",
    "graphql",
    "social-network",
    "social-network-cross-platform-appimage",
    "mini-framework",
    "bomberman-dom",
  ];
  const rustProjectsName = [
    "smart-road",
    "filler",
    "multiplayer-fps",
    "rt",
    "0-SHELL",
    "0-SHELL-job-control",
    "0-SHELL-scripting",
  ];
  
  /* debug */
/*   const jsProjects = barChartData
  .filter(data => jsProjectsName.includes(data.project))
  .map((data) => ({
    project: data.project,
    xp: data.xp,
  }));
  
  // seperate the barChartData to jsProjects and goProjects
  const goProjects = barChartData
  .filter(data => !jsProjectsName.includes(data.project))
  .map((data) => ({
    project: data.project,
    xp: data.xp,
  }));
  
  console.log("all js projects:",jsProjects)
  console.log("all go projects:",goProjects) */

  if (language === 'Js') {
    return data.filter(item => jsProjectsName.includes(item.project));
  } else if (language === 'Rust') {
    return data.filter(item => rustProjectsName.includes(item.project));
  } else if (language === 'Go') {
    return data.filter(item =>
      !jsProjectsName.includes(item.project) && !rustProjectsName.includes(item.project)
    );
  }
  return data; // In case of any other selection, return all data
}

function displayXPBarChart(transactions){
  // debug print
  // console.log("all transaction data:",transactions)
  
  barChartData = transactions
  .filter((transaction) => transaction.type === 'xp')
  .map((transaction) => ({
    project: transaction.object.name,
    xp: transaction.amount,
  }));
  
   // Get the selected language from the dropdown
   const selectedLanguage = document.getElementById('languageSelected').value;
   // debug print
   // console.log("selected Language:",selectedLanguage);
   
   // Filter data based on the selected language
    selectedData = filterDataByLanguage(barChartData, selectedLanguage);
 
   generateXPBarChart(selectedData,selectedLanguage);
}

function generateXPBarChart(selectedData,selectedLanguage ) {
  console.log("selected data for bar chart:",selectedData );
  // Clear existing SVG content
  d3.select("#barChart").selectAll("*").remove();
  // Clear any existing no-data message
  const noDataMessage = barChartContainer.querySelector('.no-data-message');
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
      <p>No projects available for the selected language: ${selectedLanguage}</p>
    `;
    barChartContainer.appendChild(noDataMessage);
    return; // Exit the function as there's no data to display
  }
    // Show the SVG if there is data
  barChartSvg.style.display = 'block';
  
  // Set up scales with dynamic dimensions based on parent div
  const parentDiv = document.getElementById('barChartContainer');
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

// Event listener for language selection change
document.getElementById('languageSelected').addEventListener('change', () => {
  // Re-display the bar chart with the newly selected language
  displayXPBarChart(transactions); // Ensure `transactions` data is available in the scope
});

function displaySkillInfo(transactions) {
  
  // get current level
  const levelData =  transactions
  .filter((transaction) => transaction.type === 'level')
  .map((transaction) => ({
    project: transaction.object.name,
    level: transaction.amount,
  }));
  
  // debug print 
  // console.log("all level data:",levelData)
  
  const maxLevel = Math.max(...levelData.map((data) => data.level));
  // currentLevel is the highest amount 
  let currentLevel = levelData.filter((data) => data.level === maxLevel)[0].level;
    
  // debug print 
  // console.log("current level :",currentLevel)

   // Define the types to exclude
   const excludeTypes = ["up", "down", "level","xp"];
  
   // Extract the xp values
   const xpData = {};
    
   // store xp into a map
   transactions
     .filter(transaction => transaction.type === 'xp')
     .forEach(transaction => {
       xpData[transaction.object.name] = transaction.amount;
     });
  
  // Filter the transactions to exclude the specified types
  const filteredSkillsTransactions = transactions.filter(transaction => !excludeTypes.includes(transaction.type));
  
  const skills =["skill_go","skill_js","skill_html","skill_css","skill_sql","skill_docker","skill_c","skill_back-end","skill_front-end","skill_sys-admin","skill_algo","skill_stats","skill_game"]
 
  // debug print
  // console.log('all filtered skills transactions====>',filteredSkillsTransactions);
  
  // Create a map to store project skill information
  const projectSkills = {};

  filteredSkillsTransactions.forEach(transaction => {
    if (skills.includes(transaction.type)) {
      const projectName = transaction.object.name;
      const skillType = shorten(transaction.type);
      const amount = transaction.amount;
      
      // Initialize project entry if it doesn't exist
      if (!projectSkills[projectName]) {
        projectSkills[projectName] = {
          name: projectName,
          xp:  xpData[projectName],
          skills: {}
        };
      }
      
      // Initialize skill entry if it doesn't exist
      if (!projectSkills[projectName].skills[skillType]) {
        projectSkills[projectName].skills[skillType] = 0;
      }
      
      // Add the transaction amount to the skill amount
      projectSkills[projectName].skills[skillType] += amount;
    }
  });
  // debug print
  // console.log("all project skills===========>",projectSkills)
  
  // Aggregate the highest skill amounts from all projects
  
  let highestAmountBySkill = {};
    
  Object.values(projectSkills).forEach(project => {
    Object.entries(project.skills).forEach(([skillType, amount]) => {
      if (!highestAmountBySkill[skillType]) {
        highestAmountBySkill[skillType] = 0;
      }
      highestAmountBySkill[skillType] = Math.max(highestAmountBySkill[skillType], amount);
    });
  });

  // Debug print
  // console.log("highest amount by skill =======>", highestAmountBySkill);
  skillsRadarData = highestAmountBySkill;
  
  // display result
  document.getElementById('level').textContent = currentLevel;
  generateSkillsRadarChart(skillsRadarData)
}
   
function generateSkillsRadarChart(skillsRadarData) {
  // Clear existing SVG content
  d3.select("#radarChart").selectAll("*").remove();

  // Set up scales with dynamic dimensions based on parent div
  const parentDiv = document.getElementById('radarChartContainer');
  const width = parentDiv.clientWidth;
  const height = width;
  const margin = 100;
  const radius = Math.min(width, height) / 2 - margin;

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

function formattedDateStringFrom(dateString) {
  var date = new Date(dateString);

  // Define options for the date formatting
  var options = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  var formattedDate = date.toLocaleDateString('en-GB', options);
  return formattedDate
}

// Custom date formatting function for x-axis labels
function formatMonth(dateString) {
  var date = new Date(dateString);

  // Define options to get only the short month name
  var options = { month: 'short' };

  var formattedMonth = date.toLocaleDateString('en-GB', options);
  return formattedMonth;
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

// only only extract go from "skill_go" for example
function shorten(text){
  return text.split("_")[1]
}

function login(){
    
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember-me').checked;
  
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
    if (rememberMe) {
      localStorage.setItem('jwt', token);
      localStorage.setItem('username', username);
    } else {
      sessionStorage.setItem('jwt', token);
    }
    
     // fetch data
    graphqlQuery(localStorage.getItem('jwt') || sessionStorage.getItem('jwt'));
    // Show logout button and hide login form
    displayDashboard();

  })
  .catch(error => {
    document.getElementById('error').textContent = error.message;
  });
}

// Optional: Automatically fill the username if 'Remember Me' was previously selected
window.onload = () => {
  const rememberedUsername = localStorage.getItem('username');
  if (rememberedUsername) {
    document.getElementById('username').value = rememberedUsername;
    document.getElementById('remember-me').checked = true;
  }
};

function logout() {
  // Remove the token and username from localStorage or sessionStorage
  localStorage.removeItem('jwt');
  localStorage.removeItem('username');
  sessionStorage.removeItem('jwt');

  // Show login form and hide dashboard
  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('dashboardContainer').style.display = 'none';
  document.getElementById('error').innerHTML = '';
}

function handleResize() {
 //generate those svg again after resize
 generateAuditLine(upLineData,downLineData);
 generateSkillsRadarChart(skillsRadarData);
 generateLineChart(lineChartData);
 generateXPBarChart(selectedData);
}


function setupGridMouseMoveListener() {
  document.addEventListener('DOMContentLoaded', () => {
      const grids = document.querySelectorAll('.grid');
          grids.forEach(grid => {
              document.addEventListener("mousemove", (e) => {
                  grid.style.setProperty('--x', e.x + 'px');
                  grid.style.setProperty('--y', e.y + 'px');
          });
      });
  });
}

setupGridMouseMoveListener();