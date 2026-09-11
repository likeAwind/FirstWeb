import { LANE_COUNT, WORLD_WIDTH } from '../core';
import type { LaneId, ZombieKind } from '../core';

export const HUD_HEIGHT = 96;
export const PLAYFIELD_HEIGHT = 480;
export const PLAYFIELD_TOP = HUD_HEIGHT;
export const GAME_HEIGHT = HUD_HEIGHT + PLAYFIELD_HEIGHT;
export const PLAYFIELD_CENTER_Y = PLAYFIELD_TOP + PLAYFIELD_HEIGHT / 2;

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

export const SUNFLOWER_IDLE_SHEET_KEY = 'sunflower-idle-sheet';
export const SUNFLOWER_PRODUCE_SHEET_KEY = 'sunflower-produce-sheet';
export const SUNFLOWER_HURT_SHEET_KEY = 'sunflower-hurt-sheet';
export const SUNFLOWER_DIE_SHEET_KEY = 'sunflower-die-sheet';
export const SUN_GAIN_FX_SHEET_KEY = 'sun-gain-fx-sheet';

export const SUNFLOWER_IDLE_SHEET_URL = '/game/plants/sunflower/sunflower-idle.png';
export const SUNFLOWER_PRODUCE_SHEET_URL = '/game/plants/sunflower/sunflower-produce.png';
export const SUNFLOWER_HURT_SHEET_URL = '/game/plants/sunflower/sunflower-hurt.png';
export const SUNFLOWER_DIE_SHEET_URL = '/game/plants/sunflower/sunflower-die.png';
export const SUN_GAIN_FX_SHEET_URL = '/game/plants/sunflower/sun-gain-fx.png';

export const SUNFLOWER_IDLE_ANIM_KEY = 'sunflower-idle';
export const SUNFLOWER_PRODUCE_ANIM_KEY = 'sunflower-produce';
export const SUNFLOWER_HURT_ANIM_KEY = 'sunflower-hurt';
export const SUNFLOWER_DIE_ANIM_KEY = 'sunflower-die';
export const SUN_GAIN_FX_ANIM_KEY = 'sun-gain-fx';

export const SUNFLOWER_FRAME_WIDTH = 64;
export const SUNFLOWER_FRAME_HEIGHT = 64;
export const SUNFLOWER_IDLE_FRAME_RATE = 8;
export const SUNFLOWER_PRODUCE_FRAME_RATE = 10;
export const SUNFLOWER_HURT_FRAME_RATE = 12;
export const SUNFLOWER_DIE_FRAME_RATE = 10;
export const SUN_GAIN_FX_FRAME_RATE = 12;

export const SUN_GAIN_FX_VIEW_WIDTH = 64;
export const SUN_GAIN_FX_VIEW_HEIGHT = 64;
export const SUN_GAIN_FX_OFFSET_Y = 34;

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
export const WAVE_TEXT_Y = 8;
export const SUN_TEXT_X = 12;
export const SUN_TEXT_Y = 32;
export const HINT_TEXT_X = 12;
export const HINT_TEXT_Y = 56;
export const HINT_WRAP_WIDTH = 220;
export const STATUS_TEXT_SIZE = '36px';

export const HUD_BG_COLOR = 0x111827;
export const HUD_CARD_START_X = 248;
export const HUD_CARD_Y = HUD_HEIGHT / 2;
export const HUD_CARD_WIDTH = 80;
export const HUD_CARD_HEIGHT = 72;
export const HUD_CARD_GAP = 8;
export const HUD_START_X = WORLD_WIDTH - 86;
export const HUD_START_Y = HUD_HEIGHT / 2;

export const CARD_DISABLED_ALPHA = 0.45;
export const SNOW_PEA_PROJECTILE_TINT = 0x7dd3fc;
export const ZOMBIE_SLOW_TINT = 0x7dd3fc;

export const BGM_MAIN_KEY = 'bgm-main';
export const BGM_MAIN_URLS = [
	'/game/audio/bgm/tower-defense-bgm-loop.ogg',
	'/game/audio/bgm/tower-defense-bgm-loop.mp3',
];
export const BGM_MAIN_VOLUME = 0.35;

export const SFX_PEA_SHOOT_KEY = 'sfx-pea-shoot';
export const SFX_PEA_HIT_KEY = 'sfx-pea-hit';
export const SFX_ZOMBIE_DEATH_KEY = 'sfx-zombie-death';
export const SFX_PLANT_PLACE_KEY = 'sfx-plant-place';
export const SFX_PLANT_DEATH_KEY = 'sfx-plant-death';
export const SFX_BUTTON_CLICK_KEY = 'sfx-button-click';
export const SFX_VICTORY_KEY = 'sfx-victory';
export const SFX_GAME_OVER_KEY = 'sfx-game-over';

export const SFX_PEA_SHOOT_VOLUME = 0.2;
export const SFX_PEA_HIT_VOLUME = 0.18;
export const SFX_ZOMBIE_DEATH_VOLUME = 0.28;
export const SFX_PLANT_PLACE_VOLUME = 0.28;
export const SFX_PLANT_DEATH_VOLUME = 0.3;
export const SFX_BUTTON_CLICK_VOLUME = 0.18;
export const SFX_VICTORY_VOLUME = 0.55;
export const SFX_GAME_OVER_VOLUME = 0.55;

export const SFX_FILES: ReadonlyArray<{ key: string; url: string }> = [
	{ key: SFX_PEA_SHOOT_KEY, url: '/game/audio/sfx/pea-shoot.mp3' },
	{ key: SFX_PEA_HIT_KEY, url: '/game/audio/sfx/pea-hit.mp3' },
	{ key: SFX_ZOMBIE_DEATH_KEY, url: '/game/audio/sfx/zombie-death.mp3' },
	{ key: SFX_PLANT_PLACE_KEY, url: '/game/audio/sfx/plant-place.mp3' },
	{ key: SFX_PLANT_DEATH_KEY, url: '/game/audio/sfx/plant-death.mp3' },
	{ key: SFX_BUTTON_CLICK_KEY, url: '/game/audio/sfx/button-click.mp3' },
	{ key: SFX_VICTORY_KEY, url: '/game/audio/sfx/victory.mp3' },
	{ key: SFX_GAME_OVER_KEY, url: '/game/audio/sfx/game-over.mp3' },
];

export const GRID_CELL_WIDTH = 56;
export const GRID_CELL_HEIGHT = 100;
export const GRID_FILL_COLOR = 0x334155;
export const GRID_FILL_ALPHA = 0.22;
export const GRID_STROKE_COLOR = 0x94a3b8;
export const HOVER_VALID_COLOR = 0x22c55e;
export const HOVER_INVALID_COLOR = 0xef4444;
export const CARD_FILL_COLOR = 0x1e293b;
export const CARD_SELECTED_COLOR = 0x2563eb;
export const BUTTON_FILL_COLOR = 0x1e293b;

export const DEPTH_GRID = 1;
export const DEPTH_SPRITE = 10;
export const DEPTH_HP = 20;
export const DEPTH_FX = 30;
export const DEPTH_HUD_BG = 900;
export const DEPTH_UI = 1000;
export const DEPTH_STATUS = 1100;

export function zombieViewSize(kind: ZombieKind): { width: number; height: number } {
	if (kind === 'fat') {
		return { width: FAT_ZOMBIE_VIEW_WIDTH, height: FAT_ZOMBIE_VIEW_HEIGHT };
	}
	return { width: ZOMBIE_VIEW_WIDTH, height: ZOMBIE_VIEW_HEIGHT };
}

export function laneToY(lane: LaneId, playfieldHeight: number = PLAYFIELD_HEIGHT, laneCount: number = LANE_COUNT): number {
	const band = playfieldHeight / laneCount;
	return PLAYFIELD_TOP + band * lane + band / 2;
}
