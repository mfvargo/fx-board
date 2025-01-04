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

  public getItems(): Item[] {
    try {
      const items = this.storage.getItems();
      if (!isValidItems(items)) {
        throw new Error('Invalid items');
      }

      return items;
    } catch (error: unknown) {
      this.logError(error);
      return [];
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
