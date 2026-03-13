
import { appState } from './state.js';
import { 
  formatNumber, 
  capitalized, 
  formattedDateStringFrom, 
  formattedTimeStringFrom, 
  shorten 
} from './utils.js';
import { 
  generateAuditLine, 
  generateLineChart, 
  generateXPBarChart, 
  generateSkillsRadarChart 
} from './charts.js';

export function displayDashboard() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContainer').style.display = 'grid';
}

export function displayUserInfo(data) {
  const user = data[0]
  appState.user.login = user.login;

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

export function displayOnProgressInfo(user, progress) {
  // Filter projects where the user is in a group with status "working"
  const allCurrentWorkingProjects = progress.filter(prog =>
      prog.object.groups.some(group =>
          group.status === "working" && group.members.some(member => member.userLogin === appState.user.login)
      )
  );
  // debug print
  // console.log("All working projects", allCurrentWorkingProjects);

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
        // debug print
        // console.log("all working group:",workingGroups);
        const finishedGroups = prog.object.groups.filter(group => group.status === "finished");
        // debug print
        // console.log("all finished group:",finishedGroups);

        const workingGroupsCount = workingGroups.length;
        const finishedGroupsCount = finishedGroups.length;

        // Filter groups where the logged-in user is a member and group status is "working"
        const groupData = prog.object.groups.filter(group =>
            group.status === "working" && group.members.some(member => member.userLogin === appState.user.login)
        );

        // Extract and flatten the members array
        const members = groupData.flatMap(group => group.members);

        // Exclude the logged-in user
        const membersExcludingUser = members.filter(member => member.userLogin !== appState.user.login);

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
        
        const workingCountElem = projectItem.querySelector('.working-count');
        const finishedCountElem = projectItem.querySelector('.finished-count');
        
        // Add event listeners conditionally
        setupGroupDetailsClickListener(workingCountElem, workingGroupsCount, workingGroups, currentProject);
        setupGroupDetailsClickListener(finishedCountElem, finishedGroupsCount, finishedGroups,currentProject);

    });
  }
}

export function setupGroupDetailsClickListener(element, count, groups, projectName) {
  if (count > 0) {
    element.addEventListener('click', () => showGroupDetails(projectName, groups));
  } else {
    element.classList.add('disabled'); 
    element.removeEventListener('click', () => showGroupDetails(projectName, groups)); 
  }
}

 // Function to show the overlay with group details
export function showGroupDetails(projectName, groups) {
  
  // Check if groups is defined and is an array, and not 0
 if (!Array.isArray(groups) || groups.length === 0) {
   console.warn('No groups available or invalid groups data');
   return;
 }
 
 // Debug print
 // console.log("projectName:", projectName);
 // console.log("groups data passed:", groups);
 
 const dataType = groups[0].status;
 

 // Get the overlay and content elements
 const overlay = document.getElementById('groupDetailsOverlay');
 const content = document.getElementById('groupDetailsContent');

 // 1. Clear existing content safely
  content.innerHTML = '';

  // 2. Create Header
  const header = document.createElement('h2');
  header.className = 'f-ms14';
  header.textContent = projectName;
  content.appendChild(header);
 
  // 3. Create Status Line
  // Safe to use innerHTML here because length and dataType are system-controlled integers/strings
  const status = document.createElement('p');
  status.className = 'f-cw2';
  status.innerHTML = `All <span class="f-cpp">${groups.length}</span> ${dataType} ${groups.length === 1 ? ' group' : ' groups'}`;
  content.appendChild(status);

 // 4. Create List and safely inject user data
  const ul = document.createElement('ul');
  groups.forEach(group => {
    const li = document.createElement('li');
    li.className = 'f-cw2';
    li.textContent = 'Captain: ';

    const span = document.createElement('span');
    span.className = 'f-cb';
    // SAFE: textContent strictly prevents HTML execution
    span.textContent = group.captainLogin; 

    li.appendChild(span);
    ul.appendChild(li);
  });
  
  content.appendChild(ul);

  // 5. Show the overlay
  overlay.style.display = 'block';
}

export function closeOverlay() {
  document.getElementById('groupDetailsOverlay').style.display = 'none';
}


export function displayXPInfo(transactions){
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

export function showXPDetailOverlay(transactions) {
  const dashboardContainer = document.getElementById('dashboardContainer');
  const xpDetailOverlay = document.getElementById('xpDetailOverlay');
  const allProjectList = document.getElementById('allProjectList');
  const baseUrl = 'https://learn.01founders.co/intra';
  const repoBaseUrl ='https://learn.01founders.co/git'
  
  // Clear existing list
  allProjectList.innerHTML = '';
  
  // Filter and display all projects with type 'xp'
  transactions
    .filter((transaction) => transaction.type === 'xp')
    
    .forEach((project) => {
      const projectName = project.object.name;
      
      // get the groups
      const workingGroups = project.object.groups.filter(group => group.status === 'working');
      const finishedGroups = project.object.groups.filter(group => group.status === "finished");

      const workingGroupsCount = workingGroups.length;
      const finishedGroupsCount = finishedGroups.length;
  
      const projectItem = document.createElement('li');
      
      projectItem.className='bb-01 project-list';
      const finishedDate = new Date(project.createdAt);
      const formattedDate = formattedDateStringFrom(finishedDate);
      const formattedTime = formattedTimeStringFrom(finishedDate);
     
      const projectPath = `${baseUrl}${encodeURI(project.path)}`;
      const repoPath = `${repoBaseUrl}/${encodeURI(appState.user.login)}/${encodeURI(project.object.name)}`;
      
      
      
      projectItem.innerHTML = `
        <div class="project-name">${projectName} - ${formatNumber(project.amount)}</div>
        <div class="finished-date">
          Finished date: <span class="break-on-small"> <br> </span>${formattedDate} at ${formattedTime}
        </div>
        <div class="group-count">
          <span class="f-cg3 working-count">${workingGroupsCount}</span>
          <span class="f-cw2 f-ms12">${workingGroupsCount === 1 ? ' group' : ' groups'} working</span>
        </div>
        <div class="group-count">
          <span class="f-cg3 finished-count">${finishedGroupsCount}</span>
          <span class="f-cw2 f-ms12">${finishedGroupsCount === 1 ? ' group' : ' groups'} finished</span><br>
        <div>
        <div style="text-align:end";>
          <a href="${projectPath}" class="project-repo-link" target="_blank">
            PROJECT <i class="fa-solid fa-angle-right"></i>
          </a>
          <a href="${repoPath}" class="project-repo-link" target="_blank">
            REPOSITORY <i class="fa-solid fa-angle-right"></i>
          </a>
        </div>
        <div>
          
        </div>
       
      `;
      
      allProjectList.appendChild(projectItem);
      
      const workingCountElem = projectItem.querySelector('.working-count');
      const finishedCountElem = projectItem.querySelector('.finished-count');
      
       // Add event listeners
        setupGroupDetailsClickListener(workingCountElem, workingGroupsCount, workingGroups, projectName);
        setupGroupDetailsClickListener(finishedCountElem, finishedGroupsCount, finishedGroups,projectName); 
    });

  // Show the overlay
  dashboardContainer.style.display = 'none';
  xpDetailOverlay.style.display = 'flex';
}

export function closeXPOverlay() {
  document.getElementById('xpDetailOverlay').style.display = 'none';
  document.getElementById('dashboardContainer').style.display = 'grid';
}

export function displayAuditInfo(transactions){
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
  
  appState.charts.audit.up = totalUp;
  appState.charts.audit.down = totalDown;
  generateAuditLine(appState.charts.audit.up,appState.charts.audit.down);
}

export function displaySkillInfo(projectTransactionsData,transactions) {
  
  // get current level
  const levelData = projectTransactionsData
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
  
   // Dynamically derive the skills from the transactions
   const skills = [...new Set(transactions
    .map(transaction => transaction.type)
    .filter(type => !excludeTypes.includes(type))
  )];

  // Debug print
  // console.log('all skills:', skills);
  
    // Filter the transactions to exclude the specified types
  const filteredSkillsTransactions = transactions.filter(transaction => !excludeTypes.includes(transaction.type));
   
  // debug print
   console.log('all filtered skills transactions====>',filteredSkillsTransactions);
  
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
  const skillsRadarData = highestAmountBySkill;
  
    // debug print
  // console.log("skillsRadarData:",skillsRadarData);
  
  // display result
  document.getElementById('level').textContent = currentLevel;
  
  // Get the selected type of skill from the dropdown
  const selectedTypeOfSkills = document.getElementById('skillTypeSelected').value;
  // debug print
  //console.log("selected skill type:",selectedTypeOfSkills);
  
  // Update the <h1> element to reflect the selected skill type
  const skillTypeTitle = document.getElementById('skillTypeTitle');
  // Determine what text to display
  let titleText = "";
  if (selectedTypeOfSkills === 'Technical_skills') {
    titleText = "Technical skills";
  } else if (selectedTypeOfSkills === 'Technologies') {
    titleText = "Technologies";
  } else {
    titleText = "Skills";
  }
  skillTypeTitle.textContent = titleText;
  
  // Filter data based on the selected language
  appState.charts.radarData = filterDataBySkills(skillsRadarData, selectedTypeOfSkills);
  
  // debug print
  // console.log("selected data:", radarChartSelectedData);
      
  generateSkillsRadarChart(appState.charts.radarData, selectedTypeOfSkills);
}

export function displayXPLineChart(transactions) {
  // Extracting data for the line chart
  appState.charts.lineData = transactions
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
    generateLineChart(appState.charts.lineData);
}

export function displayXPBarChart(transactions){
  // debug print
  // console.log("all bar chart data:",transactions)
  
  const barChartData = transactions
  .filter((transaction) => transaction.type === 'xp')
  .map((transaction) => ({
    project: transaction.object.name,
    xp: transaction.amount,
    path: transaction.path
  }));
  
   // Get the selected language from the dropdown
   const selectedCategory = document.getElementById('categorySelected').value;
   // debug print
   // console.log("selected Language:",selectedLanguage);
   
   //console.log("Bar Chart Data before filtering:", barChartData); // Debug statement
   // Filter data based on the selected language
    appState.charts.barData = filterDataByCategory(barChartData,  selectedCategory);
    
    // debug print
   //console.log("Selected Data after filtering:", selectedData);
 
   generateXPBarChart(appState.charts.barData,selectedCategory);
}

export function setupGridMouseMoveListener() {
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

// Helper functions
// Function to filter data based on the selected type of skills
function filterDataBySkills(skillsRadarData, skill) {

  // debug print
  // console.log("skillsRadarDat", skillsRadarData);

  const technical_skills = [
    /* for example skill_prog */
    "prog",  
    "back-end",
    "front-end",
    "algo",
    "game",
    "sys-admin",
    "stats",
    "ai",
    "tcp",
    "cybersecurity",
    /* assume other skills' name should like this*/
    "mobile-dev",
    "blockchain",
  ];
  
  // Initialize an empty object for the filtered data
  let filteredData = {};

  // Filter based on the selected skill type
  if (skill === 'Technical_skills') {
    filteredData = Object.keys(skillsRadarData)
      .filter(key => technical_skills.includes(key))
      .reduce((obj, key) => {
        obj[key] = skillsRadarData[key];
        return obj;
      }, {});
  } else if (skill === 'Technologies') {
    filteredData = Object.keys(skillsRadarData)
      .filter(key => !technical_skills.includes(key))
      .reduce((obj, key) => {
        obj[key] = skillsRadarData[key];
        return obj;
      }, {});
  } else {
    // If no specific skill type is selected, return all skills
    filteredData = skillsRadarData;
  }

  return filteredData;
}



// Function to filter data based on the selected language
function filterDataByCategory(data,category) {
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
  const cyberProjectsName = [
    "passive",
    "inspector-image",
    "active",
    "local",
    "web-hack",
    "injector",
    "hole-in-bin",
    "mal-track",
    "evasion",
    "obfuscator",
    "malware",
  ];
  
  /* debug */
 /*  const jsProjects = barChartData
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

 if (category === 'Js') {
    return data.filter(item => item.path?.includes('div-01') && jsProjectsName.includes(item.project));
  } 
  
  if (category === 'Rust') {
    return data.filter(item => item.path?.includes('div-01') && rustProjectsName.includes(item.project));
  } 

  if (category === 'Cyber') {
    return data.filter(item => item.path?.includes('div-01') && cyberProjectsName.includes(item.project));
  }

  if (category === 'AI') {
    return data.filter(item => item.path?.includes('ai-starter'));
  }

  if (category === 'Go') {
    // GO is the "Main" track: path is div-01 but NOT in the special lists
    return data.filter(item => 
      item.path?.includes('div-01') && 
      !jsProjectsName.includes(item.project) && 
      !rustProjectsName.includes(item.project) &&
      !cyberProjectsName.includes(item.project)
    );
  }

  return data;
}