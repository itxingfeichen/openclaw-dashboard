import '@testing-library/jest-dom'

// Mock window.matchMedia for Ant Design responsive observer
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
})

// Mock window.location (only if not already mocked)
if (!window.location.reload) {
  window.location = {
    ...window.location,
    reload: jest.fn(),
    href: ''
  }
}

// Mock fetch
global.fetch = jest.fn()

// Mock console.error to reduce noise in tests (but still show real errors)
const originalConsoleError = console.error
console.error = (...args) => {
  if (
    args[0]?.includes?.('Warning:') ||
    args[0]?.includes?.('matchMedia') ||
    args[0]?.includes?.('getComputedStyle') ||
    args[0]?.includes?.('Error: Uncaught')
  ) {
    return
  }
  originalConsoleError.apply(console, args)
}
