import LevelDb from "./LevelDb.js";
import * as NBT from "nbtify";
import { BlobReader, ZipReader, Uint8ArrayWriter, Entry } from "@zip.js/zip.js";
import { Structure } from "./types.js";

/** Extracts all LevelDB keys from a zipped `.mcworld` file. Also accepts the zipped "db" folder. */
export async function readMcworld(mcworld: Blob): Promise<Record<string, any>> {
	let folder = new ZipReader(new BlobReader(mcworld));
	let fileEntries = await folder.getEntries();
	folder.close();
	let inWorldFolder = fileEntries.some(entry => entry.filename == "levelname.txt");
	let dbEntries = inWorldFolder? fileEntries.filter(entry => entry.filename.startsWith("db/")) : fileEntries;
	let dbFiles = await Promise.all(dbEntries.map(entry => zipEntryToFile(entry)));
	return await readLevelDb(dbFiles);
}

/** Converts an Entry from zip.js into a File. */
export async function zipEntryToFile(entry: Entry): Promise<File> {
	return new File([await entry.getData(new Uint8ArrayWriter())], entry.filename.slice(entry.filename.lastIndexOf("/") + 1));
}

/** Reads a LevelDB database from all its files and returns an object with all keys. */
export async function readLevelDb(dbFiles: Array<File>): Promise<Record<string, any>> {
	let files = await Promise.all(dbFiles.map(async file => {
		let iFile = {
			content: await file.bytes(),
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
export async function extractStructureFilesFromMcworld(mcworld: Blob): Promise<Map<String, Structure>> {
	let levelDbKeys = await readMcworld(mcworld);
	let structures = new Map();
	await Promise.all(Object.entries(levelDbKeys).map(async ([key, value]) => {
		let strKey = key.toString();
		if(strKey.startsWith("structuretemplate_")) {
			let structureName = strKey.replace(/^structuretemplate_/, "");
			try {
				let structure = (await NBT.read(value.value)).data;
				structures.set(structureName, structure);
			} catch(e) {
				console.error(`Failed reading structure NBT for ${structureName}: ${e}`);
			}
		}
	}));
	return structures;
}