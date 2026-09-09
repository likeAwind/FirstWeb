import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
	constructor() {
		super('BootScene');
	}

	create(): void {
		const { width, height } = this.scale;
		this.add.rectangle(width / 2, height / 2, 160, 100, 0x3ddc84);
	}
}
