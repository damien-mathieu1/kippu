import { runMigrations, insertDLQError, getDLQErrors, updateDLQErrorStatus, closeDatabase, type DLQError, type DLQErrorInput, type DLQErrorFilters } from "@kippu/shared";

export { insertDLQError, getDLQErrors, updateDLQErrorStatus, closeDatabase };
export type { DLQError, DLQErrorInput, DLQErrorFilters };

export async function initDatabase(): Promise<void> {
  await runMigrations();
}
