import Human from './Human.js';

export default class HumanGroup2 {
    constructor(scene, islands) {
        this.scene = scene;
        this.humans = [];

        // Select top middle island (index 1 in the 3x3 grid)
        this.island = islands[1];

        // Add house at the island center
        const house = this.scene.add.image(
            this.island.centerX,
            this.island.centerY,
            'house_A'
        )
        .setOrigin(0.5)
        .setDepth(0.75)  // Between terrain (0) and humans (1)
        .setScale(4);

        // Number of humans to spawn
        const numHumans = 5;
        const spawnRadius = 50;

        // Calculate positions in a circle around the house
        const positions = [];
        for (let i = 0; i < numHumans; i++) {
            const angle = (i * 2 * Math.PI) / numHumans;
            positions.push({
                x: Math.cos(angle) * spawnRadius,
                y: Math.sin(angle) * spawnRadius
            });
        }

        // Create humans at each position with brown tint
        positions.forEach(pos => {
            const human = new Human(
                scene,
                this.island,
                this.island.centerX + pos.x,
                this.island.centerY + pos.y,
                0xC4A484  // Brown tint
            );
            this.humans.push(human);
        });
    }

    destroy() {
        this.humans.forEach(human => human.destroy());
        this.humans = [];
        this.scene = null;
        this.island = null;
    }
}
