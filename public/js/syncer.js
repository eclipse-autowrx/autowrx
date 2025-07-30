// Local Syncer.js - Replaces external syncer.js
// This provides the getApiValue and setApiValue functions for widgets

// Mock API data store
let apiDataStore = {};

// Function to get API value
function getApiValue(apiName) {
    // Return mock data for local development
    if (!apiDataStore[apiName]) {
        // Generate some realistic mock data based on API name
        if (apiName.includes('Speed')) {
            apiDataStore[apiName] = { value: Math.floor(Math.random() * 120) };
        } else if (apiName.includes('Temperature')) {
            apiDataStore[apiName] = { value: Math.floor(Math.random() * 40) + 10 };
        } else if (apiName.includes('Fuel')) {
            apiDataStore[apiName] = { value: Math.floor(Math.random() * 100) };
        } else if (apiName.includes('RPM')) {
            apiDataStore[apiName] = { value: Math.floor(Math.random() * 8000) };
        } else if (apiName.includes('On') || apiName.includes('Off')) {
            apiDataStore[apiName] = { value: Math.random() > 0.5 ? 'ON' : 'OFF' };
        } else if (apiName.includes('Mode')) {
            const modes = ['OFF', 'LOW', 'MEDIUM', 'HIGH'];
            apiDataStore[apiName] = { value: modes[Math.floor(Math.random() * modes.length)] };
        } else {
            apiDataStore[apiName] = { value: Math.floor(Math.random() * 100) };
        }
    }
    
    // Update the value slightly for simulation
    if (typeof apiDataStore[apiName].value === 'number') {
        apiDataStore[apiName].value += (Math.random() - 0.5) * 2;
        apiDataStore[apiName].value = Math.max(0, Math.min(100, apiDataStore[apiName].value));
    }
    
    return apiDataStore[apiName];
}

// Function to set API value
function setApiValue(apiName, value) {
    apiDataStore[apiName] = { value: value };
    console.log(`Set ${apiName} to ${value}`);
}

// Function to get all API values
function getAllApiValues() {
    return apiDataStore;
}

// Function to reset all API values
function resetApiValues() {
    apiDataStore = {};
}

// Export functions for use in widgets
window.getApiValue = getApiValue;
window.setApiValue = setApiValue;
window.getAllApiValues = getAllApiValues;
window.resetApiValues = resetApiValues;

console.log('Local syncer.js loaded - providing mock API functions'); 