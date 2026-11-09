export {};

declare global {
  interface Window {
    /** Do src/engine/index.js gắn lên window sau khi nạp. */
    openSubsystemModal?: () => void;
  }
}
