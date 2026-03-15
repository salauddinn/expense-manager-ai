import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock-url';
}
if (!URL.revokeObjectURL) {
  URL.revokeObjectURL = () => {};
}
