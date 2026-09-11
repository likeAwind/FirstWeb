import { ZOMBIE_CONFIG, ZOMBIE_START_X } from './constants';
import type { LaneId, WorldState, ZombieKind } from './types';

export interface ZombieSpawnDefinition {
	at: number;
	lane: LaneId;
	kind: ZombieKind;
}

export interface WaveDefinition {
	spawns: ZombieSpawnDefinition[];
}

export const WAVES: WaveDefinition[] = [
	{
		spawns: [
			{ at: 0, lane: 0, kind: 'basic' },
			{ at: 1.5, lane: 1, kind: 'basic' },
			{ at: 3, lane: 2, kind: 'basic' },
		],
	},
	{
		spawns: [
			{ at: 0, lane: 0, kind: 'basic' },
			{ at: 0.3, lane: 1, kind: 'basic' },
			{ at: 0.6, lane: 2, kind: 'basic' },
			{ at: 3, lane: 0, kind: 'basic' },
			{ at: 3.3, lane: 1, kind: 'basic' },
			{ at: 3.6, lane: 2, kind: 'basic' },
		],
	},
	{
		spawns: [
			{ at: 0, lane: 1, kind: 'fat' },
			{ at: 1, lane: 0, kind: 'basic' },
			{ at: 2, lane: 2, kind: 'basic' },
			{ at: 5, lane: 1, kind: 'basic' },
			{ at: 6, lane: 0, kind: 'basic' },
			{ at: 7, lane: 2, kind: 'basic' },
		],
	},
	{
		spawns: [
			{ at: 0, lane: 0, kind: 'fat' },
			{ at: 0.4, lane: 2, kind: 'fat' },
			{ at: 1.5, lane: 1, kind: 'basic' },
			{ at: 2.5, lane: 1, kind: 'basic' },
			{ at: 4.0, lane: 1, kind: 'fat' },
			{ at: 5.0, lane: 0, kind: 'basic' },
			{ at: 5.5, lane: 2, kind: 'basic' },
			{ at: 7.0, lane: 0, kind: 'basic' },
			{ at: 7.5, lane: 2, kind: 'basic' },
		],
	},
];

export const WAVE_COUNT = WAVES.length;

function spawnZombie(world: WorldState, lane: LaneId, kind: ZombieKind): void {
	const config = ZOMBIE_CONFIG[kind];
	world.zombies.push({
		id: `zombie-${world.nextZombieId++}`,
		kind,
		lane,
		x: ZOMBIE_START_X,
		hp: config.hp,
		speed: config.speed,
		attackDamage: config.attackDamage,
		attackInterval: config.attackInterval,
		attackCooldown: 0,
		reachedEnd: false,
		slowRemaining: 0,
	});
}

export function stepWaves(world: WorldState, dt: number): void {
	world.waveElapsed += dt;

	const wave = WAVES[world.waveIndex];
	if (!wave) return;

	while (world.nextSpawnIndex < wave.spawns.length) {
		const spawn = wave.spawns[world.nextSpawnIndex];
		if (spawn.at > world.waveElapsed) break;
		spawnZombie(world, spawn.lane, spawn.kind);
		world.nextSpawnIndex += 1;
	}

	if (world.nextSpawnIndex < wave.spawns.length) return;
	if (world.zombies.length > 0) return;

	if (world.waveIndex + 1 < WAVES.length) {
		world.waveIndex += 1;
		world.waveElapsed = 0;
		world.nextSpawnIndex = 0;
		return;
	}

	world.gameStatus = 'victory';
	world.projectiles = [];
}
