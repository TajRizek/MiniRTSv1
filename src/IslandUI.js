import Human from './Human.js';
import Bridge from './Bridge.js';
import Reproduce from './Reproduce.js';
import HumanStateManager from './HumanStateManager.js';

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
        
        // Replace the direct assignment tracking with state manager
        this.stateManager = new HumanStateManager(scene);

        this.bridgeSystem = new Bridge(scene);
    }

    show(island) {
        if (this.visible) return;
        
        this.selectedIsland = island;
        console.log('Selected island:', {
            x: this.selectedIsland.centerX,
            y: this.selectedIsland.centerY
        });
        
        // Create main panel
        const panelWidth = 400;
        const panelHeight = 300;
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

        // Create buttons with assignment indicators
        const buttonWidth = 120;
        const buttonHeight = 40;
        const buttonSpacing = 20;
        const buttons = [];
        
        const buttonConfigs = [
            { label: 'Gather Food', task: 'food' },
            { label: 'Harvest Lumber', task: 'lumber' },
            { label: 'Reproduce', task: 'reproduce' },
            { label: 'Build Bridge', task: 'bridge' }
        ];

        // Position buttons relative to panel top
        const startY = panelY - panelHeight/2 + buttonHeight; // Start from top of panel
        for (let i = 0; i < buttonConfigs.length; i++) {
            const config = buttonConfigs[i];
            const button = this.createTaskButton(
                panelX - buttonWidth / 2,
                startY + (i * (buttonHeight + buttonSpacing)),
                {
                    width: buttonWidth,
                    height: buttonHeight,
                    color: 0x333333,
                    label: config.label,
                    task: config.task
                }
            );
            buttons.push(button);
        }

        this.elements = {
            panel,
            buttons
        };

        this.visible = true;
    }

    createTaskButton(x, y, config) {
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
            config.label,
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);

        // Assignment indicator area
        const indicatorWidth = 60;
        const indicatorBg = this.scene.add.rectangle(
            config.width + 5,
            0,
            indicatorWidth,
            config.height,
            0x222222,
            0.5
        ).setOrigin(0);

        // Assignment text
        const assignmentText = this.scene.add.text(
            config.width + 10,
            config.height / 2,
            this.getAssignmentText(config.task),
            {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff'
            }
        ).setOrigin(0, 0.5);

        // Make button interactive
        bg.setInteractive()
            .on('pointerover', () => bg.setFillStyle(0x444444))
            .on('pointerout', () => bg.setFillStyle(config.color))
            .on('pointerdown', () => this.handleTaskAssignment(config.task));

        // Make indicator area interactive
        indicatorBg.setInteractive()
            .on('pointerover', () => indicatorBg.setFillStyle(0x333333))
            .on('pointerout', () => indicatorBg.setFillStyle(0x222222))
            .on('pointerdown', () => this.handleTaskUnassignment(config.task));

        container.add([bg, text, indicatorBg, assignmentText]);
        
        // Store reference to assignment text for updates
        container.assignmentText = assignmentText;
        container.task = config.task;
        
        return container;
    }

    getAssignmentText(task) {
        const count = this.stateManager.getAssignmentCount(task);
        return 'I'.repeat(count);
    }

    updateAssignmentIndicators() {
        if (!this.elements) return;
        
        this.elements.buttons.forEach(button => {
            if (button.assignmentText) {
                button.assignmentText.setText(this.getAssignmentText(button.task));
            }
        });
    }

    handleTaskAssignment(task) {
        if (task === 'bridge') {
            this.startBridgeBuilding();
            return;
        }
        
        const humanGroup = this.scene.humanGroup;
        if (!humanGroup || humanGroup.island !== this.selectedIsland) return;

        const availableHumans = this.stateManager.getAvailableHumans(humanGroup);
        if (availableHumans.length === 0) return;

        const human = availableHumans[0];
        this.stateManager.assignHuman(human, task);
        this.updateAssignmentIndicators();
    }

    handleTaskUnassignment(task) {
        const assigned = this.stateManager.assignedHumans[task];
        if (assigned.length > 0) {
            const human = assigned[0];
            this.stateManager.unassignHuman(human);
            this.updateAssignmentIndicators();
        }
    }

    hide() {
        if (!this.visible) return;
        
        if (this.elements) {
            this.elements.panel.destroy();
            this.elements.buttons.forEach(button => button.destroy());
            this.elements = null;
        }
        
        this.visible = false;
        if (this.reproducingHumans.length === 0) {
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
            console.log('Stopping reproduction');
            // Stop reproduction
            this.reproducingHumans.forEach(human => {
                human.stopCurrentTask();
                human.stopReproducing();
            });
            this.reproducingHumans = [];
            this.reproducingIsland = null;
        } else {
            console.log('Starting reproduction');
            // Start reproduction if we have at least 2 available humans
            const availableHumans = humanGroup.humans.filter(
                human => !human.isReproducing && human.state === 'idle'
            );

            console.log('Available humans:', availableHumans.length);

            if (availableHumans.length >= 2) {
                this.reproducingIsland = this.selectedIsland;
                const [human1, human2] = availableHumans;
                
                // Make sure humans are in a clean state before starting
                human1.stopCurrentTask();
                human2.stopCurrentTask();
                
                this.reproducingHumans = [human1, human2];
                human1.startReproducing(human2);
                human2.startReproducing(human1);

                // Use Reproduce class to handle the cycle
                Reproduce.startReproductionCycle(this.scene, this.selectedIsland, [human1, human2]);
            }
        }

        this.hide();
    }

    startBridgeBuilding() {
        console.log('Starting bridge building mode...');
        
        const currentIsland = this.selectedIsland;
        
        const clickHandler = (pointer) => {
            const humanGroup = this.scene.humanGroup;
            if (!humanGroup) return;

            const currentIsland = humanGroup.island;
            if (!currentIsland) return;

            // Find the closest valid target island
            let closestDistance = Infinity;
            let targetIsland = null;

            const validConnections = this.bridgeSystem.bridgeConnections[
                this.scene.placedIslands.indexOf(currentIsland)
            ] || [];

            validConnections.forEach(connection => {
                const possibleTarget = this.scene.placedIslands[connection.target];
                if (!possibleTarget) return;
                
                const distance = Phaser.Math.Distance.Between(
                    pointer.x, pointer.y,
                    possibleTarget.centerX, possibleTarget.centerY
                );
                
                if (distance < closestDistance) {
                    closestDistance = distance;
                    targetIsland = possibleTarget;
                }
            });

            if (targetIsland) {
                // Stop any existing bridge construction
                this.bridgeSystem.stopConstruction();
                
                // Start new construction
                const availableHumans = this.getAvailableHumans();
                if (availableHumans.length > 0) {
                    const human = availableHumans[0];
                    this.stateManager.assignHuman(human, 'bridge');
                    this.bridgeSystem.addBuilder(human);
                    this.bridgeSystem.startConstruction(currentIsland, targetIsland);
                    this.updateAssignmentIndicators();
                }
            }
        };

        this.scene.input.once('pointerdown', clickHandler);
        
    }

    toggleAssignment(type) {
        if (type === 'bridge') {
            this.startBridgeBuilding();
            return; // Don't hide UI
        }

        const currentCount = this.stateManager.assignedHumans[type].length;
        const availableHumans = this.getAvailableHumans();
        console.log('Available humans:', availableHumans.length);

        if (availableHumans.length > 0) {
            const human = availableHumans[0];
            
            // Clear any existing tasks
            if (human.task) {
                human.stopCurrentTask();
            }
            
            // Ensure human is in idle state before assigning new task
            human.state = 'idle';
            
            // Assign new task
            this.stateManager.assignHuman(human, type);
            
            this.updateAssignmentIndicators();
        }
        // Don't hide UI
    }

    getAvailableHumans() {
        const humanGroup = this.scene.humanGroup;
        if (!humanGroup) return [];

        // Get humans that aren't assigned to any task
        return humanGroup.humans.filter(human => 
            !this.stateManager.isHumanAssigned(human) && human.state === 'idle'
        );
    }
}
