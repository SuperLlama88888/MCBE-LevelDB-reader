import LevelDb from "./LevelDb.js";
import * as NBT from "nbtify";
import { BlobReader, ZipReader, Uint8ArrayWriter, Entry } from "@zip.js/zip.js";
import { Structure, LevelKeyValue } from "./types.js";

/** Extracts all LevelDB keys from a zipped `.mcworld` file. Also accepts the zipped "db" folder. */
export async function readMcworld(mcworld: Blob): Promise<Record<string, LevelKeyValue>> {
	let folder = new ZipReader(new BlobReader(mcworld));
	let fileEntries = await folder.getEntries();
	folder.close();
	let currentEntry = fileEntries.find(entry => zipEntryBasename(entry) == "CURRENT");
	if(!currentEntry) {
		throw new Error("Cannot find LevelDB files!");
	}
	let dbRootPath = zipEntryDirname(currentEntry);
	let dbEntries = fileEntries.filter(entry => !entry.directory && entry.filename.startsWith(dbRootPath));
	let dbFiles = await Promise.all(dbEntries.map(entry => zipEntryToFile(entry)));
	return await readLevelDb(dbFiles);
}

/** Converts an Entry from zip.js into a File. */
export async function zipEntryToFile(entry: Entry): Promise<File> {
	return new File([await entry.getData(new Uint8ArrayWriter())], zipEntryBasename(entry));
}
/** Finds the basename of an Entry from zip.js. */
export function zipEntryBasename(entry: Entry): string {
	return entry.filename.slice(entry.filename.lastIndexOf("/") + 1);
}
/** Finds the directory name of an Entry from zip.js. */
export function zipEntryDirname(entry: Entry): string {
	return entry.filename.includes("/")? entry.filename.slice(0, entry.filename.lastIndexOf("/") + 1) : "";
}

/** Reads a LevelDB database from all its files and returns an object with all keys. */
export async function readLevelDb(dbFiles: Array<File>): Promise<Record<string, LevelKeyValue>> {
	let files = await Promise.all(dbFiles.map(async file => {
		let iFile = {
			content: new Uint8Array(await file.arrayBuffer()),
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
	}));
	
	let ldbFileArr = [];
	let logFileArr = [];
	let manifestFileArr = [];
	files.forEach(file => {
		if(file.name.startsWith("MANIFEST")) {
			manifestFileArr.push(file);
		} else if(file.name.endsWith("ldb")) {
			ldbFileArr.push(file);
		} else if(file.name.endsWith("log")) {
			logFileArr.push(file);
		}
	});

	let levelDb = new LevelDb(ldbFileArr, logFileArr, manifestFileArr, "LlamaStructureReader");
	await levelDb.init(message => {
		console.debug(`LevelDB: ${message}`);
	});
	return levelDb.keys;
}
/** Extracts structure files from a `.mcworld` file. */
export async function extractStructureFilesFromMcworld(mcworld: Blob, removeDefaultNamespace: boolean = true): Promise<Map<string, File>> {
	let levelDbKeys = await readMcworld(mcworld);
	let structures = new Map();
	const structureKeyPrefix = "structuretemplate_";
	const defaultNamespace = "mystructure:";
	Object.entries(levelDbKeys).forEach(([key, value]) => {
		let strKey = key.toString();
		if(strKey.startsWith(structureKeyPrefix)) {
			let namespacedStructureName = strKey.slice(structureKeyPrefix.length);
			let structureName = removeDefaultNamespace && namespacedStructureName.startsWith(defaultNamespace)? namespacedStructureName.replace(defaultNamespace, "") : namespacedStructureName;
			structures.set(structureName, new File([value.value], structureName.replaceAll(":", "_") + ".mcstructure"));
		}
	});
	return structures;
}
/** Extracts structures from a `.mcworld` file. */
export async function extractStructuresFromMcworld(mcworld: Blob, removeDefaultNamespace: boolean = true): Promise<Map<string, Structure>> {
	let structureFiles = await extractStructureFilesFromMcworld(mcworld, removeDefaultNamespace);
	let structures = new Map();
	await Promise.all([...structureFiles].map(async ([structureName, structureFile]) => {
		try {
			let structure = (await NBT.read(structureFile)).data;
			structures.set(structureName, structure);
		} catch(e) {
			console.error(`Failed reading structure NBT for ${structureName}: ${e}`);
		}
	}));
	return structures;
}