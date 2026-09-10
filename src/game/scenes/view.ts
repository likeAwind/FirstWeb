import { LANE_COUNT } from '../core';
import type { LaneId } from '../core';

export const GAME_HEIGHT = 480;

export const PLANT_VIEW_WIDTH = 36;
export const PLANT_VIEW_HEIGHT = 36;

export const ZOMBIE_VIEW_WIDTH = 64;
export const ZOMBIE_VIEW_HEIGHT = 64;

export const ZOMBIE_SHEET_KEY = 'zombie-walk-sheet';
export const ZOMBIE_WALK_ANIM_KEY = 'zombie-walk';
export const ZOMBIE_SHEET_URL = '/game/zombie/walk.png';

export const ZOMBIE_DEATH_SHEET_KEY = 'zombie-die-sheet';
export const ZOMBIE_DEATH_ANIM_KEY = 'zombie-die';
export const ZOMBIE_DEATH_SHEET_URL = '/game/zombie/die.png';

export const ZOMBIE_FRAME_WIDTH = 48;
export const ZOMBIE_FRAME_HEIGHT = 48;
export const ZOMBIE_WALK_FRAME_RATE = 10;
export const ZOMBIE_DEATH_FRAME_RATE = 10;

export const COLOR_PLANT = 0x3ddc84;
export const COLOR_ZOMBIE = 0x9b59b6;
export const COLOR_LANE_LINE = 0x4b5563;
export const COLOR_HP = '#ffffff';

export const HP_LABEL_OFFSET_Y = 40;

export function laneToY(lane: LaneId, gameHeight: number = GAME_HEIGHT, laneCount: number = LANE_COUNT): number {
	const band = gameHeight / laneCount;
	return band * lane + band / 2;
}
