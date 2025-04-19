// __tests__/IndexedDBMock.ts
export class IndexedDBMock {
  private db = new Map<string, number>();

  async get(key: string): Promise<number | undefined> {
    return this.db.get(key);
  }

  async set(key: string, value: number): Promise<void> {
    this.db.set(key, value);
  }

  async delete(key: string): Promise<void> {
    this.db.delete(key);
  }

  async clear(): Promise<void> {
    this.db.clear();
  }
}
