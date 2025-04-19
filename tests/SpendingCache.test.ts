import { SpendingCache } from "../src/core/analytics/SpendingCache";
import { IndexedDBMock } from "./IndexedDBMock";

jest.useFakeTimers();

beforeEach(() => {
  jest.setSystemTime(new Date("2023-01-01T00:00:00.000Z"));
});

afterEach(() => {
  jest.useRealTimers();
});

describe("SpendingCache", () => {
  it("returns undefined for expired entries", async () => {
    const cache = new SpendingCache(1000);
    await cache.set("abc", 42);
    jest.setSystemTime(new Date("2023-01-01T00:00:01.500Z"));
    const result = await cache.get("abc");
    expect(result).toBeUndefined();
  });

  it("returns cached value if not expired", async () => {
    const cache = new SpendingCache(5000);
    await cache.set("xyz", 88);
    jest.setSystemTime(new Date("2023-01-01T00:00:03.000Z"));
    const result = await cache.get("xyz");
    expect(result).toBe(88);
  });

  it("clears entries by prefix", async () => {
    const cache = new SpendingCache();
    await cache.set("card-123", 10);
    await cache.set("card-456", 20);
    await cache.set("other-789", 30);
    await cache.clearByPrefix("card");
    const val1 = await cache.get("card-123");
    const val2 = await cache.get("card-456");
    const val3 = await cache.get("other-789");
    expect(val1).toBeUndefined();
    expect(val2).toBeUndefined();
    expect(val3).toBe(30);
  });

  it("uses persistent fallback when memory expired", async () => {
    const mockStore = new IndexedDBMock();
    const cache = new SpendingCache(1000, mockStore);
    jest.setSystemTime(new Date("2023-01-01T00:00:00.000Z"));
    await cache.set("foo", 10);
    jest.setSystemTime(new Date("2023-01-01T00:00:01.500Z"));
    const result = await cache.get("foo");
    expect(result).toBe(10); // fallback hit
  });

  it("writes to both memory and persistent layer", async () => {
    const mockStore = new IndexedDBMock();
    const cache = new SpendingCache(1000, mockStore);
    await cache.set("bar", 20);
    const mem = await cache.get("bar");
    const persist = await mockStore.get("bar");
    expect(mem).toBe(20);
    expect(persist).toBe(20);
  });
});
