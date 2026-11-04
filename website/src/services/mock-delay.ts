/** Simulates network latency so loading states are visible while the UI runs on mock data. */
export function mockDelay(ms = 700): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
