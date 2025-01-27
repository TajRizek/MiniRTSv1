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

    static startReproductionCycle(scene, island, humans) {
        // Clean up any existing progress elements
        if (this.reproductionProgress) {
            this.reproductionProgress.destroy();
        }
        if (this.progressBg) {
            this.progressBg.destroy();
        }
        if (this.reproductionTween) {
            this.reproductionTween.stop();
        }

        // Create progress bar
        const barWidth = 100;
        const barHeight = 10;
        const barX = island.centerX - barWidth / 2;
        const barY = island.centerY - 50;

        // Background
        this.progressBg = scene.add.rectangle(
            barX, barY, barWidth, barHeight, 0x000000
        ).setOrigin(0).setDepth(100);

        // Progress fill
        this.reproductionProgress = scene.add.rectangle(
            barX, barY, 0, barHeight, 0x00ff00
        ).setOrigin(0).setDepth(101);

        // Animate progress bar
        this.reproductionTween = scene.tweens.add({
            targets: this.reproductionProgress,
            width: barWidth,
            duration: 10000, // 10 seconds
            onComplete: () => {
                if (!island || humans.length === 0) {
                    // If reproduction was cancelled, just clean up
                    this.cleanupReproduction(scene, humans);
                    return;
                }

                // Create new human
                this.createNewHuman(
                    scene,
                    island,
                    island.centerX,
                    island.centerY
                );

                // Clean up current progress bar
                this.cleanupProgressBar();
                
                // Start next cycle if still reproducing
                if (humans.length > 0) {
                    this.startReproductionCycle(scene, island, humans);
                }
            }
        });
    }

    static cleanupProgressBar() {
        if (this.progressBg) {
            this.progressBg.destroy();
            this.progressBg = null;
        }
        if (this.reproductionProgress) {
            this.reproductionProgress.destroy();
            this.reproductionProgress = null;
        }
        if (this.reproductionTween) {
            this.reproductionTween.stop();
            this.reproductionTween = null;
        }
    }

    static cleanupReproduction(scene, humans) {
        this.cleanupProgressBar();
        // Make sure to properly stop reproduction for the humans
        humans.forEach(human => {
            if (human.currentMoveTween) {
                human.currentMoveTween.stop();
            }
            human.stopCurrentTask();
            this.stopReproducing(human);
        });
    }
}
