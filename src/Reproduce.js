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
        console.log('Starting reproduction cycle'); // Debug log

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

        // Create progress bar with even smaller dimensions
        const barWidth = 50;  // Reduced further from 50
        const barHeight = 5;  // Reduced further from 6
        const barX = island.centerX - barWidth / 2;
        const barY = island.centerY - 20;  // Moved even closer to center

        console.log('Creating progress bar at:', barX, barY); // Debug log

        // Background
        this.progressBg = scene.add.rectangle(
            barX, barY, barWidth, barHeight, 0x000000
        ).setOrigin(0).setDepth(100);

        // Progress fill
        this.reproductionProgress = scene.add.rectangle(
            barX, barY, 0, barHeight, 0x00ff00
        ).setOrigin(0).setDepth(101);

        console.log('Starting reproduction tween'); // Debug log
        this.reproductionTween = scene.tweens.add({
            targets: this.reproductionProgress,
            width: barWidth,
            duration: 10000,
            onUpdate: () => {
                //console.log('Tween progress:', this.reproductionProgress.width); // Debug log
            },
            onComplete: () => {
                //console.log('Tween completed!'); // Debug log
                
                if (!island || humans.length === 0) {
                    console.log('No island or humans, cleaning up'); // Debug log
                    this.cleanupReproduction(scene, humans);
                    return;
                }

                console.log('Creating heart animation'); // Debug log
                const heart = scene.add.image(
                    island.centerX,
                    island.centerY - 20,
                    'heart_C'
                ).setDepth(102);

                heart.setScale(1);
                heart.setAlpha(1);

                scene.tweens.add({
                    targets: heart,
                    y: '-=30',
                    alpha: 0,
                    duration: 1000,
                    onComplete: () => {
                        console.log('Heart animation completed'); // Debug log
                        heart.destroy();
                    }
                });

                this.createNewHuman(
                    scene,
                    island,
                    island.centerX,
                    island.centerY
                );

                this.cleanupProgressBar();
                
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
