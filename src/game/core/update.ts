import { applyPlantAttacks } from './combat';
import { stepSunIncome } from './plants';
import { stepExistingProjectiles } from './projectiles';
import type { WorldState, WorldStepEvents } from './types';
import { stepWaves } from './waves';
import { stepExistingZombies } from './zombies';

const NO_STEP_EVENTS: WorldStepEvents = { projectileHitCount: 0 };

export function stepWorld(world: WorldState, dt: number): WorldStepEvents {
	if (world.gameStatus !== 'playing') return NO_STEP_EVENTS;

	stepSunIncome(world, dt);
	stepExistingZombies(world, dt);

	world.plants = world.plants.filter((plant) => plant.hp > 0);

	if (world.zombies.some((zombie) => zombie.reachedEnd)) {
		world.gameStatus = 'game-over';
		world.projectiles = [];
		return NO_STEP_EVENTS;
	}

	const { expiredIds, hitCount } = stepExistingProjectiles(world, dt);

	world.zombies = world.zombies.filter((zombie) => zombie.hp > 0);
	world.projectiles = world.projectiles.filter((projectile) => !expiredIds.has(projectile.id));

	applyPlantAttacks(world, dt);
	stepWaves(world, dt);

	return { projectileHitCount: hitCount };
}
