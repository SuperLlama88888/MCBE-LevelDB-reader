import { Entry } from "@zip.js/zip.js";
import { Structure } from "./types.js";
/** Extracts all LevelDB keys from a zipped `.mcworld` file. Also accepts the zipped "db" folder. */
export declare function readMcworld(mcworld: Blob): Promise<Record<string, any>>;
/** Converts an Entry from zip.js into a File. */
export declare function zipEntryToFile(entry: Entry): Promise<File>;
/** Reads a LevelDB database from all its files and returns an object with all keys. */
export declare function readLevelDb(dbFiles: Array<File>): Promise<Record<string, any>>;
/** Extracts structure files from a `.mcworld` file. */
export declare function extractStructureFilesFromMcworld(mcworld: Blob): Promise<Map<String, Structure>>;
