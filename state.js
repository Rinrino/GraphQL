export const appState = {
  // Raw data straight from GraphQL
  data: {
    transactions: [],
    projectTransactions: [],
  },
  
  // Data specifically formatted for D3
  charts: {
    lineData: null,
    barData: null,
    radarData: null,
    audit: {
      up: null,
      down: null
    }
  },

  // Active user selections
  filters: {
    skillType: 'Technical_skills',
    category: 'Go'
  },

  // Logged in user info
  user: {
    login: null
  }
};