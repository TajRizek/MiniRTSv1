import Human from './Human.js';

export default class Reproduce {
    static startReproducing(human, partner) {
        if (human.state !== 'idle' || human.isReproducing) return;
        
        human.isReproducing = true;
        human.reproductionPartner = partner;
        human.state = 'moving_to_house';

        // Move exactly to the house position with a small offset
        const offset = 10; // Smaller offset
        const targetX = human.house.x + (human === partner ? offset : -offset);
        const targetY = human.house.y;

        // Move to reproduction position
        human.moveToPosition(targetX, targetY, () => {
            human.state = 'reproducing';
            // Stop any random movement once in position
            if (human.moveTimer) {
                human.moveTimer.remove();
                human.moveTimer = null;
            }
        });
    }

    static stopReproducing(human) {
        if (!human.isReproducing) return;
        
        human.isReproducing = false;
        human.reproductionPartner = null;
        human.state = 'idle';
        // Resume random movement
        human.startRandomMovement();
    }

    static createNewHuman(scene, island, centerX, centerY) {
        const newHuman = new Human(
            scene,
            island,
            centerX,
            centerY
        );
        scene.humanGroup.humans.push(newHuman);

        // Update UI counter
        scene.scene.get('UIScene').updateResourceDisplay({
            islanders: scene.scene.get('UIScene').resources.islanders + 1
        });

        return newHuman;
    }
}
