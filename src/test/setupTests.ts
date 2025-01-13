import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { expect, afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost:3000',
  pretendToBeVisual: true,
  resources: 'usable'
});

global.window = dom.window;
global.document = dom.window.document;
global.navigator = {
  userAgent: 'node.js',
} as Navigator;

global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

global.window.matchMedia = vi.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

class MockIntersectionObserver {
  constructor() {
    // Constructor implementation
  }
  
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() { return []; }
  
  root = null;
  rootMargin = "0px";
  thresholds = [0];
}

global.IntersectionObserver = MockIntersectionObserver;

global.window.scrollTo = vi.fn();

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  localStorage.clear();
});