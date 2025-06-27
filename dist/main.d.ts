import { Entry } from "@zip.js/zip.js";
import { LevelKeyValue } from "./types.js";
/** Extracts all LevelDB keys from a zipped `.mcworld` file. Also accepts the zipped "db" folder. */
export declare function readMcworld(mcworld: Blob): Promise<Record<string, LevelKeyValue>>;
/** Converts an Entry from zip.js into a File. */
export declare function zipEntryToFile(entry: Entry): Promise<File>;
/** Finds the basename of an Entry from zip.js. */
export declare function zipEntryBasename(entry: Entry): string;
/** Finds the directory name of an Entry from zip.js. */
export declare function zipEntryDirname(entry: Entry): string;
/** Reads a LevelDB database from all its files and returns an object with all keys. */
export declare function readLevelDb(dbFiles: Array<File>): Promise<Record<string, LevelKeyValue>>;
/** Extracts structure files from a `.mcworld` file. */
export declare function extractStructureFilesFromMcworld(mcworld: Blob, removeDefaultNamespace?: boolean): Promise<Map<string, File>>;
