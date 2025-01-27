import Human from './Human.js';
import Reproduce from './Reproduce.js';

export default class HumanStateManager {
    constructor(scene) {
        this.scene = scene;
        this.assignedHumans = {
            food: [],
            lumber: [],
            reproduce: [],
            bridge: []
        };
    }

    // Check if a human is assigned to any task
    isHumanAssigned(human) {
        return Object.values(this.assignedHumans).some(
            assigned => assigned.includes(human)
        );
    }

    // Get all available (unassigned) humans from a group
    getAvailableHumans(humanGroup) {
        if (!humanGroup) return [];
        return humanGroup.humans.filter(human => 
            !this.isHumanAssigned(human) && human.state === 'idle'
        );
    }

    // Assign a human to a task
    assignHuman(human, task) {
        if (this.isHumanAssigned(human)) {
            this.unassignHuman(human);
        }

        // Ensure human is in clean state
        human.stopCurrentTask();
        human.state = 'idle';

        // Add to assigned list
        this.assignedHumans[task].push(human);

        // Start the specific task
        switch (task) {
            case 'food':
                human.startGatheringFood();
                break;
            case 'lumber':
                human.startGatheringWood();
                break;
            case 'reproduce':
                // Find a partner for reproduction
                const availableHumans = this.getAvailableHumans(this.scene.humanGroup);
                if (availableHumans.length > 0) {
                    const partner = availableHumans[0];
                    this.assignedHumans.reproduce.push(partner);
                    human.startReproducing(partner);
                    partner.startReproducing(human);
                    // Use Reproduce class to handle the cycle
                    Reproduce.startReproductionCycle(this.scene, human.island, [human, partner]);
                }
                break;
            case 'bridge':
                // Bridge building is handled separately through the bridge system
                break;
        }

        return true;
    }

    // Unassign a human from their current task
    unassignHuman(human) {
        // Find which task the human is assigned to
        for (const [task, humans] of Object.entries(this.assignedHumans)) {
            const index = humans.indexOf(human);
            if (index !== -1) {
                // Remove from assigned list
                humans.splice(index, 1);

                // Special handling for reproduction
                if (task === 'reproduce') {
                    this.cleanupReproduction();
                }

                // Stop current task and reset state
                if (human.currentMoveTween) {
                    human.currentMoveTween.stop();
                }
                human.stopCurrentTask();
                human.task = null;
                human.state = 'idle';
                human.startRandomMovement();

                break;
            }
        }
    }

    // Handle reproduction cycle
    startReproductionCycle(island, humans) {
        // Clean up any existing progress elements
        this.cleanupProgressBar();

        // Create progress bar
        const barWidth = 100;
        const barHeight = 10;
        const barX = island.centerX - barWidth / 2;
        const barY = island.centerY - 50;

        // Background
        this.progressBg = this.scene.add.rectangle(
            barX, barY, barWidth, barHeight, 0x000000
        ).setOrigin(0).setDepth(100);

        // Progress fill
        this.reproductionProgress = this.scene.add.rectangle(
            barX, barY, 0, barHeight, 0x00ff00
        ).setOrigin(0).setDepth(101);

        // Animate progress bar
        this.reproductionTween = this.scene.tweens.add({
            targets: this.reproductionProgress,
            width: barWidth,
            duration: 10000, // 10 seconds
            onComplete: () => {
                if (!island || humans.length === 0) {
                    this.cleanupReproduction();
                    return;
                }

                // Create new human
                const newHuman = this.createNewHuman(island);

                // Clean up current progress bar
                this.cleanupProgressBar();
                
                // Start next cycle if still reproducing
                if (this.assignedHumans.reproduce.length >= 2) {
                    this.startReproductionCycle(island, humans);
                }
            }
        });
    }

    // Helper methods for reproduction
    cleanupProgressBar() {
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

    cleanupReproduction() {
        this.cleanupProgressBar();
        // Stop reproduction for all assigned humans
        this.assignedHumans.reproduce.forEach(human => {
            if (human.currentMoveTween) {
                human.currentMoveTween.stop();
            }
            human.stopCurrentTask();
            human.stopReproducing();
        });
        this.assignedHumans.reproduce = [];
    }

    createNewHuman(island) {
        const newHuman = new Human(
            this.scene,
            island,
            island.centerX,
            island.centerY
        );
        this.scene.humanGroup.humans.push(newHuman);

        // Update UI counter
        this.scene.scene.get('UIScene').updateResourceDisplay({
            islanders: this.scene.scene.get('UIScene').resources.islanders + 1
        });

        return newHuman;
    }

    // Get counts of assigned humans
    getAssignmentCount(task) {
        return this.assignedHumans[task].length;
    }

    // Clean up when scene is destroyed
    destroy() {
        this.cleanupReproduction();
        this.assignedHumans = {
            food: [],
            lumber: [],
            reproduce: [],
            bridge: []
        };
        this.scene = null;
    }
}
