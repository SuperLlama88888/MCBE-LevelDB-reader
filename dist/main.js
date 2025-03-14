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
        let inWorldFolder = fileEntries.some(entry => entry.filename == "levelname.txt");
        let dbEntries = inWorldFolder ? fileEntries.filter(entry => entry.filename.startsWith("db/")) : fileEntries;
        let dbFiles = yield Promise.all(dbEntries.map(entry => zipEntryToFile(entry)));
        return yield readLevelDb(dbFiles);
    });
}
/** Converts an Entry from zip.js into a File. */
export function zipEntryToFile(entry) {
    return __awaiter(this, void 0, void 0, function* () {
        return new File([yield entry.getData(new Uint8ArrayWriter())], entry.filename.slice(entry.filename.lastIndexOf("/") + 1));
    });
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
export function extractStructureFilesFromMcworld(mcworld) {
    return __awaiter(this, void 0, void 0, function* () {
        let levelDbKeys = yield readMcworld(mcworld);
        let structures = new Map();
        yield Promise.all(Object.entries(levelDbKeys).map((_a) => __awaiter(this, [_a], void 0, function* ([key, value]) {
            let strKey = key.toString();
            if (strKey.startsWith("structuretemplate_")) {
                let structureName = strKey.replace(/^structuretemplate_/, "");
                try {
                    let structure = (yield NBT.read(value.value)).data;
                    structures.set(structureName, structure);
                }
                catch (e) {
                    console.error(`Failed reading structure NBT for ${structureName}: ${e}`);
                }
            }
        })));
        return structures;
    });
}
//# sourceMappingURL=main.js.map