import Phaser from "phaser";
import { preload } from "./Preload.js";
import { createAndPlaceIslands } from "./Island.js";
import Human from "./Human.js";
import HumanGroup from "./HumanGroup.js";
import HumanGroup2 from "./HumanGroup2.js";
import UIScene from './UI.js';
import IslandUI from './IslandUI.js';

class LoadingScene extends Phaser.Scene {
    constructor() {
        super({ key: 'LoadingScene' });
    }

    preload() {
        // Create loading bar
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        // Loading bar background
        this.progressBox = this.add.graphics();
        this.progressBox.fillStyle(0x222222, 0.8);
        this.progressBox.fillRect(width/2 - 160, height/2 - 25, 320, 50);
        
        // Loading text
        this.loadingText = this.add.text(width/2, height/2 - 50, 'Loading...', {
            font: '20px monospace',
            fill: '#ffffff'
        });
        this.loadingText.setOrigin(0.5, 0.5);
        
        // Percentage text
        this.percentText = this.add.text(width/2, height/2, '0%', {
            font: '18px monospace',
            fill: '#ffffff'
        });
        this.percentText.setOrigin(0.5, 0.5);
        
        // Progress bar
        this.progressBar = this.add.graphics();
        
        // Asset loading progress
        this.load.on('progress', (value) => {
            this.updateProgress(value * 0.3); // Asset loading is 30%
        });

        // Load all game assets
        preload(this);
    }

    updateProgress(value) {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        this.progressBar.clear();
        this.progressBar.fillStyle(0xffffff, 1);
        this.progressBar.fillRect(width/2 - 150, height/2 - 15, 300 * value, 30);
        this.percentText.setText(parseInt(value * 100) + '%');
    }

    create() {
        this.scene.launch('GameScene', { loadingScene: this });
    }
}

class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: "GameScene" });
        this.islandUI = null;
    }

    create(data) {
        this.loadingScene = data.loadingScene;
        console.log("[GameScene] Starting creation...");
        const startTime = performance.now();
        
        // Define all steps with their weights
        this.steps = [
            { name: 'UI Scene Start', weight: 0.05 },
            { name: 'Ocean Background', weight: 0.05 },
            { name: 'Island Placement Start', weight: 0.05 },
            ...Array(9).fill().map((_, i) => ({ 
                name: `Island ${i + 1}`, 
                weight: 0.6 / 9
            })),
            { name: 'Island Creation Complete', weight: 0.05 },
            { name: 'Human Groups', weight: 0.2 }
        ];
        
        this.currentStepIndex = 0;
        this.islandsCreated = 0;
        this.placedIslands = [];
        
        // Start the creation sequence
        this.startCreationSequence();

        // Initialize IslandUI
        this.islandUI = new IslandUI(this);

        // Set up click handling for islands
        this.input.on('pointerdown', (pointer) => {
            if (pointer.button === 0) { // Left click
                const clickedIsland = this.checkIslandClick(pointer.x, pointer.y);
                if (clickedIsland) {
                    this.islandUI.show(clickedIsland);
                } else if (this.islandUI.visible) {
                    this.islandUI.hide();
                }
            }
        });

        // Update resource display (example values)
        this.scene.get('UIScene').updateResourceDisplay({
            islanders: 5,
            lumber: 0,
            food: 0
        });
    }

    updateProgress() {
        const completedWeight = this.steps
            .slice(0, this.currentStepIndex + 1)
            .reduce((sum, step) => sum + step.weight, 0);
        this.loadingScene.updateProgress(0.3 + (completedWeight * 0.7));
        this.currentStepIndex++;
    }

    startCreationSequence() {
        // Start UI Scene
        console.log("[GameScene] Starting UI Scene...");
        this.scene.run('UIScene');
        this.updateProgress();

        // Create ocean background
        console.log("[GameScene] Creating ocean background...");
        this.oceanTile = this.add
            .tileSprite(0, 0, this.cameras.main.width, this.cameras.main.height, "ocean")
            .setOrigin(0)
            .setDepth(0);
        this.updateProgress();

        // Start island creation
        console.log("[GameScene] Starting island creation...");
        this.createNextIsland();
    }

    createNextIsland() {
        if (this.islandsCreated < 9) {
            const startTime = performance.now();
            const island = createAndPlaceIslands(this, this.islandsCreated);
            this.placedIslands.push(island);
            
            console.log(`[GameScene] Island ${this.islandsCreated + 1}/9 created in ${performance.now() - startTime}ms`);
            this.islandsCreated++;
            this.updateProgress();

            // Schedule next island creation on next frame
            this.time.delayedCall(10, () => this.createNextIsland());
        } else {
            this.finishCreation();
        }
    }

    finishCreation() {
        // Create human groups with fixed positions
        console.log("[GameScene] Creating human groups...");
        const humanStartTime = performance.now();
        
        // Pass the full islands array instead of a random island
        this.humanGroup = new HumanGroup(this, this.placedIslands);
        this.humanGroup2 = new HumanGroup2(this, this.placedIslands);
        
        console.log(`[GameScene] Human groups created in ${performance.now() - humanStartTime}ms`);
        this.updateProgress();

        // Clean up loading scene
        this.loadingScene.progressBar.destroy();
        this.loadingScene.progressBox.destroy();
        this.loadingScene.loadingText.destroy();
        this.loadingScene.percentText.destroy();
        this.scene.stop('LoadingScene');
    }

    addAnimatedTile(x, y, baseKey) {
        const tile = this.add.sprite(x, y, `${baseKey}_f1`).setOrigin(0);

        if (!this.anims.exists(baseKey)) {
            this.anims.create({
                key: baseKey,
                frames: [
                    { key: `${baseKey}_f1` },
                    { key: `${baseKey}_f2` },
                    { key: `${baseKey}_f3` },
                    { key: `${baseKey}_f2` },
                ],
                frameRate: 2.5,
                repeat: -1,
            });
        }

        tile.play(baseKey);
    }

    checkIslandClick(x, y) {
        // This is a placeholder - implement proper island detection based on your game's needs
        return this.placedIslands.find(island => {
            const bounds = {
                left: island.centerX - 100,
                right: island.centerX + 100,
                top: island.centerY - 100,
                bottom: island.centerY + 100
            };
            return x >= bounds.left && x <= bounds.right && y >= bounds.top && y <= bounds.bottom;
        });
    }
}

const config = {
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    scene: [LoadingScene, GameScene, UIScene],
};

if (!window.game) {
    window.game = new Phaser.Game(config);
}

export default GameScene;
