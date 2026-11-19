import { LocalStorageRepository } from "./local-repository";
import type { CommunityRepository } from "./repository";

/**
 * Punto único de inyección del repositorio.
 * Para usar una base de datos real, sustituir por p. ej. `new ApiRepository()`.
 */
export const repository: CommunityRepository = new LocalStorageRepository();

export type { CommunityRepository } from "./repository";
