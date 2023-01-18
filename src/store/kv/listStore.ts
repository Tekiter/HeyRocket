export interface ListStore<T> {
  getById(id: string): Promise<T | null>;
  setById(id: string, data: T): Promise<void>;
  commit(): Promise<void>;
  setExpiration(time: Date): Promise<void>;
}

interface Entry<T> {
  id: string;
  data: T;
}

interface DataFrame<T> {
  expire?: number;
  data: T;
}

export function createListStore<T>(kv: KVNamespace, key: string) {
  let entries: Entry<T>[] = [];
  let isLoaded = false;
  let expire: undefined | number = undefined;

  async function load() {
    if (isLoaded) {
      return;
    }
    const frame = await kv.get<DataFrame<Entry<T>[]>>(key, "json");
    entries = frame?.data ?? [];
    expire = frame?.expire ?? undefined;
    isLoaded = true;
  }

  return {
    async getById(id: string) {
      await load();

      const found = entries.find((entry) => entry.id === id);
      if (!found) {
        return null;
      }
      return found.data;
    },
    async setById(id: string, data: T) {
      await load();

      const found = entries.find((entry) => entry.id === id);
      if (!found) {
        entries.push({
          id,
          data,
        });
        return;
      }
    },
    async commit() {
      const newData: DataFrame<Entry<T>[]> = {
        expire,
        data: entries,
      };
      await kv.put(key, JSON.stringify(newData), {
        expiration: expire ?? undefined,
      });
    },
    async setExpiration(time: Date) {
      expire = Math.floor(time.valueOf() / 1000);
    },
  };
}
