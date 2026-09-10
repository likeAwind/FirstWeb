import { LANE_COUNT } from '../core';
import type { LaneId, ZombieKind } from '../core';

export const GAME_HEIGHT = 480;

export const PLANT_VIEW_WIDTH = 64;
export const PLANT_VIEW_HEIGHT = 64;

export const ZOMBIE_VIEW_WIDTH = 64;
export const ZOMBIE_VIEW_HEIGHT = 64;

export const FAT_ZOMBIE_VIEW_WIDTH = 80;
export const FAT_ZOMBIE_VIEW_HEIGHT = 80;

export const PEA_VIEW_WIDTH = 24;
export const PEA_VIEW_HEIGHT = 12;

export const PLANT_IDLE_SHEET_KEY = 'pea-shooter-idle-sheet';
export const PLANT_IDLE_ANIM_KEY = 'pea-shooter-idle';
export const PLANT_IDLE_SHEET_URL = '/game/plants/pea-shooter/idle.png';

export const PLANT_ATTACK_SHEET_KEY = 'pea-shooter-attack-sheet';
export const PLANT_ATTACK_ANIM_KEY = 'pea-shooter-attack';
export const PLANT_ATTACK_SHEET_URL = '/game/plants/pea-shooter/attack.png';

export const PLANT_DEATH_SHEET_KEY = 'pea-shooter-die-sheet';
export const PLANT_DEATH_ANIM_KEY = 'pea-shooter-die';
export const PLANT_DEATH_SHEET_URL = '/game/plants/pea-shooter/die.png';

export const PLANT_FRAME_WIDTH = 48;
export const PLANT_FRAME_HEIGHT = 48;
export const PLANT_IDLE_FRAME_RATE = 10;
export const PLANT_ATTACK_FRAME_RATE = 10;
export const PLANT_DEATH_FRAME_RATE = 10;

export const PEA_SHEET_KEY = 'pea-fly-sheet';
export const PEA_FLY_ANIM_KEY = 'pea-fly';
export const PEA_SHEET_URL = '/game/projectiles/pea-fly.png';
export const PEA_FRAME_WIDTH = 24;
export const PEA_FRAME_HEIGHT = 12;
export const PEA_FLY_FRAME_RATE = 12;

export const ZOMBIE_SHEET_KEY = 'zombie-walk-sheet';
export const ZOMBIE_WALK_ANIM_KEY = 'zombie-walk';
export const ZOMBIE_SHEET_URL = '/game/zombie/basic/walk.png';

export const ZOMBIE_DEATH_SHEET_KEY = 'zombie-die-sheet';
export const ZOMBIE_DEATH_ANIM_KEY = 'zombie-die';
export const ZOMBIE_DEATH_SHEET_URL = '/game/zombie/basic/die.png';

export const ZOMBIE_FRAME_WIDTH = 48;
export const ZOMBIE_FRAME_HEIGHT = 48;
export const ZOMBIE_WALK_FRAME_RATE = 10;
export const ZOMBIE_DEATH_FRAME_RATE = 10;

export const COLOR_PLANT = 0x3ddc84;
export const COLOR_ZOMBIE = 0x9b59b6;
export const COLOR_LANE_LINE = 0x4b5563;
export const COLOR_HP = '#ffffff';
export const COLOR_UI = '#ffffff';

export const HP_LABEL_OFFSET_Y = 40;

export const WAVE_TEXT_X = 12;
export const WAVE_TEXT_Y = 10;
export const STATUS_TEXT_SIZE = '36px';

export function zombieViewSize(kind: ZombieKind): { width: number; height: number } {
	if (kind === 'fat') {
		return { width: FAT_ZOMBIE_VIEW_WIDTH, height: FAT_ZOMBIE_VIEW_HEIGHT };
	}
	return { width: ZOMBIE_VIEW_WIDTH, height: ZOMBIE_VIEW_HEIGHT };
}

export function laneToY(lane: LaneId, gameHeight: number = GAME_HEIGHT, laneCount: number = LANE_COUNT): number {
	const band = gameHeight / laneCount;
	return band * lane + band / 2;
}
