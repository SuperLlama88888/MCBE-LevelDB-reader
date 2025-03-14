/**
 * Represents a .mcstructure file.
 */
export interface Structure {
	/** Format version, should be always set to 1. */
	format_version: Number;
	/** Size of the structure in blocks. */
	size: [Number, Number, Number];
	structure: {
		/** Block indices for the structure. */
		block_indices: [Number[], Number[]];
		/** List of entities stored as NBT. */
		entities: EntityNBTCompound[];
		palette: {
			default: {
				/** List of ordered block entries that the indices refer to. */
				block_palette: Block[];
				/** Additional data for individual blocks in the structure. */
				block_position_data?: Record<number, BlockPositionData>;
			};
		};
	};
	/** The original world position where the structure was saved. */
	structure_world_origin: [Number, Number, Number];
}

/** Represents an entity NBT compound structure (placeholder). */
export type EntityNBTCompound = Record<string, any>;

/** Represents a block. */
export interface Block {
	/** Block identifier (e.g., "minecraft:planks"). */
	name: string;
	/** Block states as key-value pairs. */
	states: Record<string, string | Number>;
	/** 4-byte version number for the block. E.g., 17879555 is hex 01 10 D2 03, meaning 1.16.210.03. */
	version: Number;
}
/** Additional data for individual blocks. */
export interface BlockPositionData {
	/** Block entity data. */
	block_entity_data?: EntityNBTCompound;
	/** Scheduled tick information for blocks that need updates. */
	tick_queue_data?: TickQueueData[];
}
/** Represents a scheduled pending tick update. Used in observers. */
export interface TickQueueData {
	/** Number of ticks remaining before update. */
	tick_delay: Number;
}