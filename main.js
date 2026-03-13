import { appState } from './state.js';
import { 
  generateAuditLine, 
  generateLineChart, 
  generateXPBarChart, 
  generateSkillsRadarChart,
} from './charts.js';
import { graphqlQuery,login,logout} from './api.js';
import { debounce } from './utils.js';
import { 
  displayDashboard, 
  displayUserInfo, 
  displayOnProgressInfo, 
  displayXPInfo, 
  displayAuditInfo, 
  displaySkillInfo, 
  displayXPLineChart, 
  displayXPBarChart,
  setupGridMouseMoveListener,
  showXPDetailOverlay,
  closeOverlay,   
  closeXPOverlay,
} from './ui.js';

document.addEventListener('DOMContentLoaded', function () {
  // 1. Remember Me logic
  const rememberedUsername = localStorage.getItem('username');
  if (rememberedUsername) {
    document.getElementById('username').value = rememberedUsername;
    document.getElementById('remember-me').checked = true;
  }

  // 2. JWT Check logic...
  const jwtToken = localStorage.getItem('jwt') || sessionStorage.getItem('jwt');
  
  if(jwtToken){
    displayDashboard();
    graphqlQuery(jwtToken)
      .then(data => {
  
        // --- Success:  save data for offline use and render ---
        localStorage.setItem('cachedDashboardData', JSON.stringify(data));
        processAndDisplayData(data);
      })
      .catch(error => {
        //--- Fail: Fallback to LocalStorage ---
        console.warn('API error or offline. Loading cached data...', error.message);
        const cachedData = localStorage.getItem('cachedDashboardData');
        if (cachedData) {
          processAndDisplayData(JSON.parse(cachedData));
        } else {
          document.getElementById('error').textContent = error.message || "No internet and no cached data found.";
        }
      });
  } else {
    document.getElementById('loginContainer').style.display = 'block';
  }
  
  // Attach debounced event listener for window resize (waits 250ms after resizing stops)
  window.addEventListener('resize', debounce(handleResize, 250));
  
  // Wire up buttons strictly within the module
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  const logoutBtn1 = document.getElementById('logout-btn');
  if (logoutBtn1) {
  logoutBtn1.addEventListener('click', () => {
      logout();
      location.reload();
    });
  }
  // Wire up the second logout button (Header)
  const logoutBtn2 = document.getElementById('logout-btn-header');
  if (logoutBtn2) {
    logoutBtn2.addEventListener('click', () => {
      logout();
      location.reload();
    });
  }
  document.getElementById('close-overlay-btn').addEventListener('click', closeOverlay);
  document.getElementById('close-xp-overlay-btn').addEventListener('click', closeXPOverlay);
  const moreLink = document.querySelector('.link-more');
  if (moreLink) {
    moreLink.addEventListener('click', (event) => {
      event.preventDefault();
      showXPDetailOverlay(appState.data.projectTransactions);
    });
  }
  
  setupGridMouseMoveListener();
  
  // Dropdown listeners - Keep them here for centralized control
  document.getElementById('categorySelected').addEventListener('change', () => {
    displayXPBarChart(appState.data.projectTransactions);
  });

  document.getElementById('skillTypeSelected').addEventListener('change', () => {
    displaySkillInfo(appState.data.projectTransactions, appState.data.transactions);
  });
});

async function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const rememberMe = document.getElementById('remember-me').checked;

  try {
    const token = await login(username, password); // Wait for api.js
    
    // 1. Save Token
    if (rememberMe) {
      localStorage.setItem('jwt', token);
      localStorage.setItem('username', username);
    } else {
      sessionStorage.setItem('jwt', token);
    }

    // 2. Clear errors and swap UI
    document.getElementById('error').innerHTML = '';
    displayDashboard(); // This works now because it's in the same file!

    // 3. Get Data
    const data = await graphqlQuery(token);
    localStorage.setItem('cachedDashboardData', JSON.stringify(data));
    processAndDisplayData(data);
    
  } catch (error) {
    document.getElementById('error').textContent = error.message;
  }
}

function processAndDisplayData(data) {
   if (!data) return;
   // Display all the user data
   appState.data.transactions = data.transaction;
    
   // Extract the transactions and filter them to only include "project" types
   appState.data.projectTransactions = data.transaction
     .filter(transaction => transaction.object.type === 'project');
   // debug print
   // console.log("Project Transactions:", projectTransactionsData);
    
    displayUserInfo(data.user);
    displayOnProgressInfo(data.user,data.progress);
    // debug print
    // displayOnProgressInfo(userTest,progress)
   displayXPInfo(appState.data.projectTransactions);
   displayAuditInfo(appState.data.projectTransactions);
   displaySkillInfo(appState.data.projectTransactions, appState.data.transactions);
   displayXPLineChart(appState.data.projectTransactions);
   displayXPBarChart(appState.data.projectTransactions);
};

function handleResize() {
  // Generate static SVGs
  generateAuditLine(appState.charts.audit.up,appState.charts.audit.down);
  generateLineChart(appState.charts.lineData);
 
  // Safely grab current dropdown values with fallbacks
  const currentSkillType = document.getElementById('skillTypeSelected').value || 'Technical_skills';
  const currentCategory = document.getElementById('categorySelected').value || 'Go';

  // Re-render using specifically scoped data
  generateSkillsRadarChart(appState.charts.radarData, currentSkillType);
  generateXPBarChart(appState.charts.barData, currentCategory);
}
