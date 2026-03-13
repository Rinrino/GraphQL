
export function formattedDateStringFrom(dateString) {
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

export function formattedTimeStringFrom(dateString) {
  var date = new Date(dateString);

  // Define options for the date formatting
  const options = { 
    hour: 'numeric',
    minute: 'numeric',
    hour12: true 
  };
  
  var formattedTime = date.toLocaleTimeString('en-GB', options);
  return formattedTime
}

// Custom date formatting function for x-axis labels
export function formatMonth(dateString) {
  var date = new Date(dateString);

  // Define options to get only the short month name
  var options = { month: 'short' };

  var formattedMonth = date.toLocaleDateString('en-GB', options);
  return formattedMonth;
}
  
export function capitalized(text) {
  return text[0].toUpperCase() + text.slice(1).toLowerCase()
}

export function formatNumber(value) {
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
export function shorten(text){
  return text.split("_")[1]
}

// To limit how often a function can run
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
