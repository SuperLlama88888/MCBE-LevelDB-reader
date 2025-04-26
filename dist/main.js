var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import LevelDb from "./LevelDb.js";
import * as NBT from "nbtify";
import { BlobReader, ZipReader, Uint8ArrayWriter } from "@zip.js/zip.js";
/** Extracts all LevelDB keys from a zipped `.mcworld` file. Also accepts the zipped "db" folder. */
export function readMcworld(mcworld) {
    return __awaiter(this, void 0, void 0, function* () {
        let folder = new ZipReader(new BlobReader(mcworld));
        let fileEntries = yield folder.getEntries();
        folder.close();
        let currentEntry = fileEntries.find(entry => zipEntryBasename(entry) == "CURRENT");
        if (!currentEntry) {
            throw new Error("Cannot find LevelDB files!");
        }
        let dbRootPath = zipEntryDirname(currentEntry);
        let dbEntries = fileEntries.filter(entry => !entry.directory && entry.filename.startsWith(dbRootPath));
        let dbFiles = yield Promise.all(dbEntries.map(entry => zipEntryToFile(entry)));
        return yield readLevelDb(dbFiles);
    });
}
/** Converts an Entry from zip.js into a File. */
export function zipEntryToFile(entry) {
    return __awaiter(this, void 0, void 0, function* () {
        return new File([yield entry.getData(new Uint8ArrayWriter())], zipEntryBasename(entry));
    });
}
/** Finds the basename of an Entry from zip.js. */
export function zipEntryBasename(entry) {
    return entry.filename.slice(entry.filename.lastIndexOf("/") + 1);
}
/** Finds the directory name of an Entry from zip.js. */
export function zipEntryDirname(entry) {
    return entry.filename.includes("/") ? entry.filename.slice(0, entry.filename.lastIndexOf("/") + 1) : "";
}
/** Reads a LevelDB database from all its files and returns an object with all keys. */
export function readLevelDb(dbFiles) {
    return __awaiter(this, void 0, void 0, function* () {
        let files = yield Promise.all(dbFiles.map((file) => __awaiter(this, void 0, void 0, function* () {
            let iFile = {
                content: yield file.bytes(),
                loadContent: () => new Date(),
                name: file.name,
                storageRelativePath: file.name,
                fullPath: file.name
            };
            return iFile;
            // return new Proxy(iFile, {
            // 	get(target, prop, receiver) {
            // 		console.log(`Property accessed: ${String(prop)}`);
            // 		props.add(prop);
            // 		return Reflect.get(target, prop, receiver);
            // 	}
            // });
        })));
        let ldbFileArr = [];
        let logFileArr = [];
        let manifestFileArr = [];
        files.forEach(file => {
            if (file.name.startsWith("MANIFEST")) {
                manifestFileArr.push(file);
            }
            else if (file.name.endsWith("ldb")) {
                ldbFileArr.push(file);
            }
            else if (file.name.endsWith("log")) {
                logFileArr.push(file);
            }
        });
        let levelDb = new LevelDb(ldbFileArr, logFileArr, manifestFileArr, "LlamaStructureReader");
        yield levelDb.init(message => {
            console.debug(`LevelDB: ${message}`);
        });
        return levelDb.keys;
    });
}
/** Extracts structure files from a `.mcworld` file. */
export function extractStructureFilesFromMcworld(mcworld_1) {
    return __awaiter(this, arguments, void 0, function* (mcworld, removeDefaultNamespace = true) {
        let levelDbKeys = yield readMcworld(mcworld);
        let structures = new Map();
        const structureKeyPrefix = "structuretemplate_";
        const defaultNamespace = "mystructure:";
        Object.entries(levelDbKeys).forEach(([key, value]) => {
            let strKey = key.toString();
            if (strKey.startsWith(structureKeyPrefix)) {
                let namespacedStructureName = strKey.slice(structureKeyPrefix.length);
                let structureName = removeDefaultNamespace && namespacedStructureName.startsWith(defaultNamespace) ? namespacedStructureName.replace(defaultNamespace, "") : namespacedStructureName;
                structures.set(structureName, new File([value.value], structureName.replaceAll(":", "_") + ".mcstructure"));
            }
        });
        return structures;
    });
}
/** Extracts structures from a `.mcworld` file. */
export function extractStructuresFromMcworld(mcworld_1) {
    return __awaiter(this, arguments, void 0, function* (mcworld, removeDefaultNamespace = true) {
        let structureFiles = yield extractStructureFilesFromMcworld(mcworld, removeDefaultNamespace);
        let structures = new Map();
        yield Promise.all([...structureFiles].map((_a) => __awaiter(this, [_a], void 0, function* ([structureName, structureFile]) {
            try {
                let structure = (yield NBT.read(structureFile)).data;
                structures.set(structureName, structure);
            }
            catch (e) {
                console.error(`Failed reading structure NBT for ${structureName}: ${e}`);
            }
        })));
        return structures;
    });
}
//# sourceMappingURL=main.js.map