import { SavedBoard as Item } from '../models/UnitModel';
import { CustomStorage } from './custom-storage';
import { isValidItems, isValidItemFields } from '../utils/validation';

const STORAGE_ITEMS_KEY = 'pedalboards';

export class ItemsStorage {
  private static instance: ItemsStorage;
  private storage: CustomStorage<Item>;

  constructor() {
    console.log("constructing boardStorage");
    this.storage = new CustomStorage<Item>(STORAGE_ITEMS_KEY);
  }

  public static getInstance(): ItemsStorage {
    return this.instance ?? (this.instance = new ItemsStorage());
  }

  public getItems(): Item[] | null {
    try {
      const items = this.storage.getItems();
      if (!isValidItems(items)) {
        throw new Error('Invalid items');
      }

      return items;
    } catch (error: unknown) {
      this.logError(error);
      return null;
    }
  }

  public setItem(item: Item): void {
    console.log(item);
    try {
      if (!isValidItemFields(item)) {
        throw new Error('Invalid item fields');
      }

      let currentItems = this.storage.getItems();
      if (!isValidItems(currentItems)) {
        throw new Error('Invalid items');
      }
      const idx = currentItems.findIndex(i => i.name === item.name);
      if (idx >= 0) {
        currentItems.splice(idx, 1, item);
      } else {
        currentItems.push(item);
      }
      this.storage.setItems(currentItems);
    } catch (error: unknown) {
      this.logError(error);
    }
  }

  public clearItems(): void {
    try {
      this.storage.clearItems();
    } catch (error: unknown) {
      this.logError(error);
    }
  }

  private logError(error: unknown): void {
    let errorMessage = 'An error occurred in ItemsStorage';
    if (error instanceof Error) {
      errorMessage += `: ${error.message}`;
    }
    console.error(errorMessage);
  }
}

// export const itemsStorage = ItemsStorage.getInstance();


const books = [
  { id: 0, name: "You don't know JS" },
  { id: 1, name: 'Eloquent JavaScript' },
  { id: 2, name: 'JavaScript: The Good Parts' },
];

const lastBookIndex = books.findIndex(book => book.name === 'JavaScript: The Good Parts');
if (lastBookIndex !== -1) {
  books.splice(lastBookIndex, 1, { id: 2, name: 'JavaScript: The Definitive Guide' });
}
console.log(books);
// Output: [{ id: 0, name: "You don't know JS" }, { id: 1, name: "Eloquent JavaScript" }, { id: 2, name: "JavaScript: The Definitive Guide" }]

