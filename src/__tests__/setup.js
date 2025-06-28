// Configuration globale pour les tests
require('dotenv').config({ path: '.env.test' });

// Mock de console.log pour les tests
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Timeout global pour les tests
jest.setTimeout(10000); 