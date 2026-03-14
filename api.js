import { appState } from './state.js';

export function graphqlQuery(token) {
  
  const graphqlEndpoint = 'https://learn.01founders.co/api/graphql-engine/v1/graphql';
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
        
    transaction(order_by: {createdAt: desc}) {
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
  }
`;

return fetch(graphqlEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query: graphqlQuery }),
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }
    return response.json();
  })
  .then(result => {
    
    // --- Strict GraphQL Error Checking ---
    if (result.errors) {
      // Log the full error array for debugging
      console.error("GraphQL Errors:", result.errors);
      // Throw the specific GraphQL message to trigger the catch block
      const errorMessage = result.errors[0]?.message || "GraphQL query failed";
      throw new Error(errorMessage);
    }
    // handle success/fail in main
   return result.data;
  });
}

export function login(username, password) {
  const credentials = btoa(`${username}:${password}`);
  const authEndpoint = 'https://learn.01founders.co/api/auth/signin';
  
  return fetch(authEndpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json',
    },
  })
  .then(response => {
    if (!response.ok) throw new Error('Invalid credentials');
    return response.json();
  });
}

export function logout() {
  localStorage.removeItem('jwt');
  localStorage.removeItem('cachedDashboardData');
  sessionStorage.clear(); 

  document.getElementById('loginContainer').style.display = 'block';
  document.getElementById('dashboardContainer').style.display = 'none';
  document.getElementById('error').innerHTML = '';
}