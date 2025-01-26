import Human from './Human.js';

export default class IslandUI {
    constructor(scene) {
        this.scene = scene;
        this.visible = false;
        this.elements = null;
        this.selectedIsland = null;
        this.reproductionProgress = null;
        this.reproducingHumans = [];
        this.reproducingIsland = null;
        this.progressBg = null;
        this.reproductionTween = null;
    }

    show(island) {
        if (this.visible) return;
        
        this.selectedIsland = island;
        const { width, height } = this.scene.cameras.main;
        
        // Create main panel
        const panelWidth = 400;
        const panelHeight = 300;
        
        // Position panel directly over the island
        const panelX = this.selectedIsland.centerX;
        const panelY = this.selectedIsland.centerY;
        
        const panel = this.scene.add.rectangle(
            panelX,
            panelY,
            panelWidth,
            panelHeight,
            0x000000,
            0.7
        ).setOrigin(0.5).setDepth(100);

        // Create three buttons
        const buttonWidth = 120;
        const buttonHeight = 40;
        const buttonSpacing = 20;
        const buttons = [];
        
        const buttonConfig = {
            width: buttonWidth,
            height: buttonHeight,
            color: 0x333333,
            labels: ['Gather Food', 'Harvest Lumber', 'Reproduce']
        };

        // Position buttons relative to panel center
        for (let i = 0; i < 3; i++) {
            const button = this.createButton(
                panelX - buttonWidth / 2,
                panelY - buttonHeight + (i * (buttonHeight + buttonSpacing)),
                buttonConfig,
                i,
                i === 0 ? () => this.startGatheringFood() :
                i === 1 ? () => this.startGatheringWood() :
                () => this.toggleReproduction()
            );
            buttons.push(button);
        }

        // Keep panel within screen bounds
        this.keepInBounds(panel, buttons);

        this.elements = {
            panel,
            buttons
        };

        this.visible = true;
    }

    keepInBounds(panel, buttons) {
        const { width, height } = this.scene.cameras.main;
        const panelBounds = panel.getBounds();
        
        // Check top boundary
        if (panelBounds.top < 0) {
            const offset = -panelBounds.top;
            panel.y += offset;
            buttons.forEach(button => button.y += offset);
        }
        
        // Check left boundary
        if (panelBounds.left < 0) {
            const offset = -panelBounds.left;
            panel.x += offset;
            buttons.forEach(button => button.x += offset);
        }
        
        // Check right boundary
        if (panelBounds.right > width) {
            const offset = width - panelBounds.right;
            panel.x += offset;
            buttons.forEach(button => button.x += offset);
        }
        
        // Check bottom boundary
        if (panelBounds.bottom > height) {
            const offset = height - panelBounds.bottom;
            panel.y += offset;
            buttons.forEach(button => button.y += offset);
        }
    }

    createButton(x, y, config, index, onClick) {
        const container = this.scene.add.container(x, y).setDepth(100);
        
        // Button background
        const bg = this.scene.add.rectangle(
            0,
            0,
            config.width,
            config.height,
            config.color,
            1
        ).setOrigin(0);

        // Button text
        const text = this.scene.add.text(
            config.width / 2,
            config.height / 2,
            config.labels[index],
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // Make button interactive
        bg.setInteractive()
            .on('pointerover', () => bg.setFillStyle(0x444444))
            .on('pointerout', () => bg.setFillStyle(config.color))
            .on('pointerdown', onClick);

        container.add([bg, text]);
        return container;
    }

    hide() {
        if (!this.visible) return;
        
        if (this.elements) {
            this.elements.panel.destroy();
            this.elements.buttons.forEach(button => button.destroy());
            this.elements = null;
        }
        
        this.visible = false;
        if (!this.reproducingHumans.length) {
            this.selectedIsland = null;
        }
    }

    startGatheringFood() {
        // Find all humans on this island
        const humanGroup = this.scene.humanGroup;
        if (humanGroup && humanGroup.island === this.selectedIsland) {
            humanGroup.humans.forEach(human => {
                human.stopCurrentTask();
                human.startGatheringFood();
            });
        }

        // Close the UI
        this.hide();
    }

    startGatheringWood() {
        // Find all humans on this island
        const humanGroup = this.scene.humanGroup;
        if (humanGroup && humanGroup.island === this.selectedIsland) {
            humanGroup.humans.forEach(human => {
                human.stopCurrentTask();
                human.startGatheringWood();
            });
        }

        // Close the UI
        this.hide();
    }

    toggleReproduction() {
        const humanGroup = this.scene.humanGroup;
        if (!humanGroup || humanGroup.island !== this.selectedIsland) return;

        if (this.reproducingHumans.length > 0) {
            // Stop reproduction
            this.reproducingHumans.forEach(human => human.stopReproducing());
            this.reproducingHumans = [];
            
            // Clean up progress bar and background
            if (this.reproductionProgress) {
                this.reproductionProgress.destroy();
                this.reproductionProgress = null;
            }
            if (this.progressBg) {
                this.progressBg.destroy();
                this.progressBg = null;
            }
            if (this.reproductionTween) {
                this.reproductionTween.stop();
                this.reproductionTween = null;
            }
            
            this.reproducingIsland = null;
        } else {
            // Start reproduction if we have at least 2 available humans
            const availableHumans = humanGroup.humans.filter(
                human => !human.isReproducing && human.state === 'idle'
            );

            if (availableHumans.length >= 2) {
                this.reproducingIsland = this.selectedIsland;
                const [human1, human2] = availableHumans;
                this.reproducingHumans = [human1, human2];
                human1.startReproducing(human2);
                human2.startReproducing(human1);

                this.startReproductionCycle();
            }
        }

        this.hide();
    }

    startReproductionCycle() {
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
        const barX = this.reproducingIsland.centerX - barWidth / 2;
        const barY = this.reproducingIsland.centerY - 50;

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
                if (!this.reproducingIsland || this.reproducingHumans.length === 0) {
                    // If reproduction was cancelled, just clean up
                    this.cleanupReproduction();
                    return;
                }

                // Create new human
                const newHuman = new Human(
                    this.scene,
                    this.reproducingIsland,
                    this.reproducingIsland.centerX,
                    this.reproducingIsland.centerY
                );
                this.scene.humanGroup.humans.push(newHuman);

                // Update UI counter
                this.scene.scene.get('UIScene').updateResourceDisplay({
                    islanders: this.scene.scene.get('UIScene').resources.islanders + 1
                });

                // Clean up current progress bar and start next cycle
                this.cleanupProgressBar();
                
                // Start next cycle if still reproducing
                if (this.reproducingHumans.length > 0) {
                    this.startReproductionCycle();
                }
            }
        });
    }

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
        this.reproducingHumans = [];
        this.reproducingIsland = null;
    }
}
