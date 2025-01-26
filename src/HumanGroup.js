import Human from './Human.js';

export default class HumanGroup {
    constructor(scene, islands) {
        this.scene = scene;
        
        // Select bottom middle island (index 7 in the 3x3 grid)
        this.island = islands[7];
        
        this.humans = [];

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
        const progressPerHuman = 0.1 / numHumans;

        // Adjust spawn radius to account for house size
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

        // Create humans at each position
        positions.forEach((pos, index) => {
            const human = new Human(
                scene, 
                this.island,
                this.island.centerX + pos.x,
                this.island.centerY + pos.y
            );
            this.humans.push(human);
            scene.game.events.emit('initialization-progress', 0.4 + progressPerHuman * (index + 1));
        });
    }

    destroy() {
        this.humans.forEach(human => human.destroy());
        this.humans = [];
        this.scene = null;
        this.island = null;
    }
} 