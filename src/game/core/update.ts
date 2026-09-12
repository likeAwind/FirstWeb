import { applyPlantAttacks } from './combat';
import { stepCardCooldowns, stepPlantProduction, stepSunIncome } from './plants';
import { stepExistingProjectiles } from './projectiles';
import type { WorldState, WorldStepEvents } from './types';
import { stepWaves } from './waves';
import { stepExistingZombies } from './zombies';

function emptyStepEvents(): WorldStepEvents {
	return {
		projectileHitCount: 0,
		sunProducedPlantIds: [],
		plantDamagedIds: [],
	};
}

export function stepWorld(world: WorldState, dt: number): WorldStepEvents {
	if (world.gameStatus !== 'playing') return emptyStepEvents();

	world.runElapsed += dt;
	stepSunIncome(world, dt);
	const plantDamagedIds = stepExistingZombies(world, dt);

	world.plants = world.plants.filter((plant) => plant.hp > 0);

	if (world.zombies.some((zombie) => zombie.reachedEnd)) {
		world.gameStatus = 'game-over';
		world.projectiles = [];
		return emptyStepEvents();
	}

	const { expiredIds, hitCount } = stepExistingProjectiles(world, dt);

	world.zombies = world.zombies.filter((zombie) => zombie.hp > 0);
	world.projectiles = world.projectiles.filter((projectile) => !expiredIds.has(projectile.id));

	const sunProducedPlantIds = stepPlantProduction(world, dt);
	applyPlantAttacks(world, dt);
	stepCardCooldowns(world, dt);
	stepWaves(world, dt);

	return {
		projectileHitCount: hitCount,
		sunProducedPlantIds,
		plantDamagedIds,
	};
}
