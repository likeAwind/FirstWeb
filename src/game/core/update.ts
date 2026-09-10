import { applyPlantAttacks } from './combat';
import { stepExistingProjectiles } from './projectiles';
import type { WorldState } from './types';
import { stepWaves } from './waves';
import { stepExistingZombies } from './zombies';

export function stepWorld(world: WorldState, dt: number): void {
	if (world.gameStatus !== 'playing') return;

	stepExistingZombies(world, dt);

	world.plants = world.plants.filter((plant) => plant.hp > 0);

	if (world.zombies.some((zombie) => zombie.reachedEnd)) {
		world.gameStatus = 'game-over';
		world.projectiles = [];
		return;
	}

	const expiredProjectileIds = stepExistingProjectiles(world, dt);

	world.zombies = world.zombies.filter((zombie) => zombie.hp > 0);
	world.projectiles = world.projectiles.filter((projectile) => !expiredProjectileIds.has(projectile.id));

	applyPlantAttacks(world, dt);
	stepWaves(world, dt);
}
