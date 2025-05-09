// config.js
const fs = require('fs');
const path = require('path');
const electron = require('electron');

// Get the app's user data directory (persists across app restarts and updates)
const userDataPath = (electron.app || electron.remote.app).getPath('userData');
const configPath = path.join(userDataPath, 'config.json');

// Default configuration
const defaultConfig = {
  serverNames: ["5984"],
  checkInterval: 60, // in seconds
  notifications: {
    sound: true,
    visual: true
  }
};

class Config {
  constructor() {
    this.config = null;
    this.load();
  }

  // Load config from disk
  load() {
    try {
      if (fs.existsSync(configPath)) {
        const data = fs.readFileSync(configPath, 'utf8');
        this.config = JSON.parse(data);
        console.log('Configuration loaded:', this.config);
      } else {
        console.log('No config file found, using defaults');
        this.config = defaultConfig;
        this.save(); // Create the default config file
      }
    } catch (error) {
      console.error('Error loading config:', error);
      this.config = defaultConfig;
      this.save(); // Attempt to create a new default config
    }
  }

  // Save config to disk
  save() {
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2), 'utf8');
      console.log('Configuration saved');
    } catch (error) {
      console.error('Error saving config:', error);
    }
  }

  // Get a config value
  get(key) {
    return this.config[key];
  }

  // Set a config value and save
  set(key, value) {
    this.config[key] = value;
    this.save();
  }

  // Get the full config object
  getAll() {
    return this.config;
  }

  // Set multiple config values at once
  setAll(newConfig) {
    this.config = { ...this.config, ...newConfig };
    this.save();
  }
}

module.exports = new Config();