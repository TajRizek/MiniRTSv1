export default class Human {
    constructor(scene, island, spawnX, spawnY, tint = 0xFFFFFF) {
        this.scene = scene;
        this.island = island;

        // Use provided spawn position or default to island center
        this.spawnX = spawnX || island.centerX;
        this.spawnY = spawnY || island.centerY;

        // Create the human sprite with tint
        this.human = scene.add.sprite(this.spawnX, this.spawnY, "HumanIdle")
            .setOrigin(0.5)
            .setScale(3)
            .setTint(tint);

        // Create upgrade effect
        this.upgradeEffect = scene.add.sprite(this.spawnX, this.spawnY, "UpgradeEffect").setOrigin(0.5).setScale(1);

        // Define the upgrade animation if it doesn't exist
        if (!this.scene.anims.exists('upgrade')) {
            this.scene.anims.create({
                key: 'upgrade',
                frames: this.scene.anims.generateFrameNumbers('UpgradeEffect', { start: 0, end: 3 }),
                frameRate: 10,
                repeat: 0
            });
        }

        // Define other animations
        this.defineAnimations();

        // Play the upgrade animation
        this.upgradeEffect.play("upgrade");

        // Once the upgrade animation is done, play idle
        this.upgradeEffect.on("animationcomplete", () => {
            if (!this.human || !this.scene) return; // Safety check
            this.upgradeEffect.destroy();
            this.upgradeEffect = null;
            this.human.play("idle-down-right"); // Default idle animation
        });

        // Cleanup when the scene is destroyed
        this.scene.events.once("shutdown", this.destroy, this);
        this.scene.events.once("destroy", this.destroy, this);

        // Initialize movement variables
        this.isMoving = false;
        this.targetX = this.spawnX;
        this.targetY = this.spawnY;
        
        //console.log('Human spawned at:', this.spawnX, this.spawnY);

        // Set up random movement timer with a random initial delay for each human
        this.scene.time.delayedCall(
            Phaser.Math.Between(500, 2000), // Different initial delay for each human
            () => {
                if (this.human && this.scene) {
                    this.startRandomMovement();
                }
            }
        );

        this.state = 'idle';
        this.task = null;
        this.house = { x: island.centerX, y: island.centerY };
        this.moveSpeed = 100; // pixels per second
        this.isReproducing = false;
        this.reproductionPartner = null;
    }

    defineAnimations() {
        // Define idle animations for each direction
        if (!this.scene.anims.exists('idle-down-right')) {
            this.scene.anims.create({
                key: 'idle-down-right',
                frames: this.scene.anims.generateFrameNumbers('HumanIdle', { start: 0, end: 15, first: 0 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.scene.anims.exists('idle-down-left')) {
            this.scene.anims.create({
                key: 'idle-down-left',
                frames: this.scene.anims.generateFrameNumbers('HumanIdle', { start: 16, end: 31 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.scene.anims.exists('idle-up-right')) {
            this.scene.anims.create({
                key: 'idle-up-right',
                frames: this.scene.anims.generateFrameNumbers('HumanIdle', { start: 32, end: 47 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.scene.anims.exists('idle-up-left')) {
            this.scene.anims.create({
                key: 'idle-up-left',
                frames: this.scene.anims.generateFrameNumbers('HumanIdle', { start: 48, end: 63 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // Define walk animations for each direction
        if (!this.scene.anims.exists('walk-down-right')) {
            this.scene.anims.create({
                key: 'walk-down-right',
                frames: this.scene.anims.generateFrameNumbers('HumanWalk', { start: 0, end: 3 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.scene.anims.exists('walk-down-left')) {
            this.scene.anims.create({
                key: 'walk-down-left',
                frames: this.scene.anims.generateFrameNumbers('HumanWalk', { start: 4, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.scene.anims.exists('walk-up-right')) {
            this.scene.anims.create({
                key: 'walk-up-right',
                frames: this.scene.anims.generateFrameNumbers('HumanWalk', { start: 8, end: 11 }),
                frameRate: 8,
                repeat: -1
            });
        }
        if (!this.scene.anims.exists('walk-up-left')) {
            this.scene.anims.create({
                key: 'walk-up-left',
                frames: this.scene.anims.generateFrameNumbers('HumanWalk', { start: 12, end: 15 }),
                frameRate: 8,
                repeat: -1
            });
        }
    }

    startRandomMovement() {
        if (this.isReproducing) return;
        if (this.isMoving) return;

        // Define 8 possible directions (in radians)
        const directions = [
            0, Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4,
            Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4
        ];

        // Try up to 8 times to find a valid direction
        let validMove = false;
        let attempts = 0;
        let targetX, targetY, randomDirection;

        while (!validMove && attempts < 8) {
            randomDirection = directions[Phaser.Math.Between(0, directions.length - 1)];
            // Reduced walk distance to stay more likely on terrain
            const walkDistance = 20;

            // Calculate potential target position
            targetX = this.human.x + Math.cos(randomDirection) * walkDistance;
            targetY = this.human.y + Math.sin(randomDirection) * walkDistance;

            //console.log('Trying position:', targetX, targetY);
            if (this.isValidPosition(targetX, targetY)) {
                validMove = true;
                //console.log('Found valid terrain at:', targetX, targetY);
            }
            attempts++;
        }

        // If no valid position found, stay idle
        if (!validMove) {
            //console.log('No valid terrain found after', attempts, 'attempts');
            this.scheduleNextMovement();
            return;
        }

        // Set sprite direction once before movement starts
        if (Math.cos(randomDirection) < 0) {
            this.human.setFlipX(true); // Facing left
        } else {
            this.human.setFlipX(false); // Facing right
        }

        // Play walk animation
        this.human.play('walk-down-right');
        //console.log('Starting walk to terrain at:', targetX, targetY);

        // Set isMoving to true and create the tween for movement
        this.isMoving = true;

        this.scene.tweens.add({
            targets: this.human,
            x: targetX,
            y: targetY,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                this.isMoving = false;
                //console.log('Completed walk, returning to idle');
                this.human.play('idle-down-right');
                this.scheduleNextMovement();
            }
        });
    }

    scheduleNextMovement() {
        this.scene.time.delayedCall(
            Phaser.Math.Between(2000, 5000),
            () => {
                if (this.human && this.scene) {
                    this.startRandomMovement();
                }
            }
        );
    }

    isValidPosition(x, y) {
        // Basic check using island center
        if (!this.island || !this.island.centerX || !this.island.centerY) {
            //console.log('Invalid island properties');
            return false;
        }

        // Get the tile at this position from the scene
        const tile = this.scene.children.list.find(child => {
            if (child.texture && child.texture.key === 'terrain') {
                const bounds = child.getBounds();
                return x >= bounds.left && x <= bounds.right && 
                       y >= bounds.top && y <= bounds.bottom;
            }
            return false;
        });

        //console.log('Found tile:', tile ? 'yes' : 'no', 'at position:', x, y);
        return !!tile;
    }

    startGatheringFood() {
        if (this.state !== 'idle') {
            this.stopCurrentTask();
        }
        if (this.isReproducing) return; // Don't interrupt reproduction
        
        // Find berries on the island
        const berries = this.findBerriesOnIsland();
        if (!berries) {
            console.log('No berries found on this island!');
            return;
        }

        this.state = 'moving_to_berries';
        this.task = 'gathering_food';

        // Move to berries
        this.moveToPosition(berries.x, berries.y, () => {
            this.state = 'gathering';
            
            // Gather for 2 seconds
            this.scene.time.delayedCall(2000, () => {
                this.state = 'moving_to_house';
                
                // Move back to house
                this.moveToPosition(this.house.x, this.house.y, () => {
                    // Update food counter
                    this.scene.scene.get('UIScene').updateResourceDisplay({
                        food: this.scene.scene.get('UIScene').resources.food + 1
                    });
                    
                    // Create floating strawberry effect
                    const strawberry = this.scene.add.image(
                        this.house.x,
                        this.house.y - 20, // Start slightly above house
                        'strawberry'
                    ).setScale(2).setDepth(200);

                    // Create tween for floating and fading effect
                    this.scene.tweens.add({
                        targets: strawberry,
                        y: this.house.y - 40, // Float up by 20 pixels
                        alpha: 0,
                        duration: 1000,
                        ease: 'Power1',
                        onComplete: () => {
                            strawberry.destroy();
                        }
                    });
                    
                    // Reset state and start again
                    this.state = 'idle';
                    if (this.task === 'gathering_food') {
                        this.startGatheringFood();
                    }
                });
            });
        });
    }

    startGatheringWood() {
        if (this.state !== 'idle') {
            this.stopCurrentTask();
        }
        if (this.isReproducing) return; // Don't interrupt reproduction
        
        // Find trees on the island
        const tree = this.findTreeOnIsland();
        if (!tree) {
            console.log('No trees found on this island!');
            return;
        }

        this.state = 'moving_to_tree';
        this.task = 'gathering_wood';

        // Move to tree
        this.moveToPosition(tree.x, tree.y, () => {
            this.state = 'harvesting';
            
            // Harvest for 2 seconds
            this.scene.time.delayedCall(2000, () => {
                this.state = 'moving_to_house';
                
                // Move back to house
                this.moveToPosition(this.house.x, this.house.y, () => {
                    // Update lumber counter
                    this.scene.scene.get('UIScene').updateResourceDisplay({
                        lumber: this.scene.scene.get('UIScene').resources.lumber + 1
                    });
                    
                    // Create floating wood effect
                    const wood = this.scene.add.image(
                        this.house.x,
                        this.house.y - 20, // Start slightly above house
                        'wood1'
                    ).setScale(2).setDepth(200);

                    // Create tween for floating and fading effect
                    this.scene.tweens.add({
                        targets: wood,
                        y: this.house.y - 40, // Float up by 20 pixels
                        alpha: 0,
                        duration: 1000,
                        ease: 'Power1',
                        onComplete: () => {
                            wood.destroy();
                        }
                    });
                    
                    // Reset state and start again
                    this.state = 'idle';
                    if (this.task === 'gathering_wood') {
                        this.startGatheringWood();
                    }
                });
            });
        });
    }

    moveToPosition(targetX, targetY, onComplete) {
        // Store the current task's onComplete callback
        this.currentTaskCallback = onComplete;
        
        // Calculate distance and duration
        const distance = Phaser.Math.Distance.Between(
            this.human.x, this.human.y,
            targetX, targetY
        );
        const duration = (distance / this.moveSpeed) * 1000;

        // Determine direction for animation
        const direction = targetX > this.human.x ? 'down-right' : 'up-left';
        this.human.play(`walk-${direction}`);

        // Create movement tween
        this.currentMoveTween = this.scene.tweens.add({
            targets: this.human,
            x: targetX,
            y: targetY,
            duration: duration,
            ease: 'Linear',
            onComplete: () => {
                this.human.play(`idle-${direction}`);
                this.currentMoveTween = null;
                // Only call the callback if we're still in the same task
                if (onComplete && this.currentTaskCallback === onComplete) {
                    onComplete();
                }
            }
        });
    }

    findBerriesOnIsland() {
        // Find all berry bushes in the scene
        const berryBushes = this.scene.children.list.filter(child => 
            child.texture && child.texture.key === 'berries1'
        );
        
        // Find the berry bush that's closest to this island's center
        const islandBerries = berryBushes.find(bush => {
            // Calculate distance from bush to island center
            const distanceToIslandCenter = Phaser.Math.Distance.Between(
                bush.x, bush.y,
                this.island.centerX, this.island.centerY
            );
            
            // Consider the bush to be on this island if it's within a reasonable radius
            // Adjust this value based on your island size
            const maxDistance = 150; // pixels
            return distanceToIslandCenter < maxDistance;
        });
        
        return islandBerries ? { x: islandBerries.x, y: islandBerries.y } : null;
    }

    findTreeOnIsland() {
        // Find all trees in the scene
        const trees = this.scene.children.list.filter(child => 
            child.texture && child.texture.key.startsWith('tree_')
        );
        
        // Find the tree that's closest to this island's center
        const islandTree = trees.find(tree => {
            // Calculate distance from tree to island center
            const distanceToIslandCenter = Phaser.Math.Distance.Between(
                tree.x, tree.y,
                this.island.centerX, this.island.centerY
            );
            
            // Consider the tree to be on this island if it's within a reasonable radius
            const maxDistance = 150; // pixels
            return distanceToIslandCenter < maxDistance;
        });
        
        return islandTree ? { x: islandTree.x, y: islandTree.y } : null;
    }

    stopCurrentTask() {
        if (this.moveTimer) {
            this.moveTimer.remove();
            this.moveTimer = null;
        }
        
        // Stop any ongoing tweens
        if (this.scene && this.scene.tweens) {
            this.scene.tweens.killTweensOf(this.human);
        }

        // Clear any pending delayed calls
        if (this.scene && this.scene.time) {
            this.scene.time.removeAllEvents(this);
        }
        
        // Reset all states
        this.isReproducing = false;
        this.reproductionPartner = null;
        this.task = null;
        this.state = 'idle';
        
        // Stop any current animation and play idle
        if (this.human && this.human.anims) {
            this.human.play('idle-down-right');
        }
        
        // Resume random movement
        this.startRandomMovement();
    }

    startReproducing(partner) {
        if (this.state !== 'idle' || this.isReproducing) return;
        
        this.isReproducing = true;
        this.reproductionPartner = partner;
        this.state = 'moving_to_house';

        // Move exactly to the house position with a small offset
        const offset = 10; // Smaller offset
        const targetX = this.house.x + (this === partner ? offset : -offset);
        const targetY = this.house.y;

        // Move to reproduction position
        this.moveToPosition(targetX, targetY, () => {
            this.state = 'reproducing';
            // Stop any random movement once in position
            if (this.moveTimer) {
                this.moveTimer.remove();
                this.moveTimer = null;
            }
        });
    }

    stopReproducing() {
        if (!this.isReproducing) return;
        
        this.isReproducing = false;
        this.reproductionPartner = null;
        this.state = 'idle';
        // Resume random movement
        this.startRandomMovement();
    }

    startBuildingBridge(bridgePath, targetIsland) {
        if (this.state !== 'idle') {
            this.stopCurrentTask();
        }
        
        this.state = 'building_bridge';
        this.bridgePath = bridgePath;
        this.currentBridgeTile = 0;
        this.targetIsland = targetIsland;
        
        // Start building the first bridge tile
        this.buildNextBridgeTile();
    }

    buildNextBridgeTile() {
        if (!this.bridgePath || this.currentBridgeTile >= this.bridgePath.length) {
            this.stopBuildingBridge();
            return;
        }

        const tile = this.bridgePath[this.currentBridgeTile];
        const previousTile = this.currentBridgeTile > 0 
            ? this.bridgePath[this.currentBridgeTile - 1] 
            : { x: this.human.x, y: this.human.y };

        // Determine direction based on bridge orientation
        const isHorizontal = tile.type.includes('horizontal');
        const direction = isHorizontal ? 
            (tile.x > previousTile.x ? 'right' : 'left') :
            (tile.y > previousTile.y ? 'down' : 'up');
        
        // Set appropriate animation based on direction
        const animationKey = `walk-${direction === 'down' || direction === 'right' ? 'down-right' : 'up-left'}`;
        this.human.play(animationKey);
        
        // Calculate builder position (one tile back from current construction)
        const builderPosition = {
            x: previousTile.x,
            y: previousTile.y
        };

        // Set appropriate depth for builders (below UI elements)
        this.human.setDepth(75); // Above bridges (50) but below UI (100)
        
        // Move builder to position with tween
        if (!this.currentMoveTween) {
            this.currentMoveTween = this.scene.tweens.add({
                targets: this.human,
                x: builderPosition.x,
                y: builderPosition.y,
                duration: 1000,
                ease: 'Linear',
                onComplete: () => {
                    this.currentMoveTween = null;
                    // Keep facing the direction of construction
                    const idleAnimKey = `idle-${direction === 'down' || direction === 'right' ? 'down-right' : 'up-left'}`;
                    this.human.play(idleAnimKey);
                    this.startBuildingCurrentTile(tile);
                }
            });
        } else {
            this.startBuildingCurrentTile(tile);
        }
    }

    startBuildingCurrentTile(tile) {
        // Create progress bar
        const progressBarWidth = tile.width * 2;
        const progressBar = this.scene.add.rectangle(
            tile.x - (progressBarWidth / 2),
            tile.y - 20,
            0,
            5,
            0x00FF00
        ).setOrigin(0, 0.5)
         .setDepth(100);

        const progressBg = this.scene.add.rectangle(
            tile.x - (progressBarWidth / 2),
            tile.y - 20,
            progressBarWidth,
            5,
            0x000000
        ).setOrigin(0, 0.5)
         .setDepth(99);

        this.currentProgressBar = progressBar;
        this.currentProgressBg = progressBg;

        // Animate progress bar
        this.currentBuildTween = this.scene.tweens.add({
            targets: progressBar,
            width: progressBarWidth,
            duration: 2000, // 2 seconds per tile
            ease: 'Linear',
            onComplete: () => {
                // Clean up progress bars
                if (progressBar) progressBar.destroy();
                if (progressBg) progressBg.destroy();
                this.currentProgressBar = null;
                this.currentProgressBg = null;
                this.currentBuildTween = null;

                // Place bridge tile
                const bridgeTile = this.scene.add.image(tile.x, tile.y, tile.type)
                    .setScale(2)
                    .setDepth(50);

                // Deduct wood cost
                this.scene.scene.get('UIScene').updateResourceDisplay({
                    lumber: this.scene.scene.get('UIScene').resources.lumber - 2
                });

                // Move to next tile
                this.currentBridgeTile++;
                this.buildNextBridgeTile();
            }
        });
    }

    stopBuildingBridge() {
        // Clean up any existing progress bars
        if (this.currentProgressBar) {
            this.currentProgressBar.destroy();
            this.currentProgressBar = null;
        }
        if (this.currentProgressBg) {
            this.currentProgressBg.destroy();
            this.currentProgressBg = null;
        }
        if (this.currentBuildTween) {
            this.currentBuildTween.stop();
            this.currentBuildTween = null;
        }
        if (this.currentMoveTween) {
            this.currentMoveTween.stop();
            this.currentMoveTween = null;
        }

        // Clear all states and tasks
        this.bridgePath = null;
        this.currentBridgeTile = 0;
        this.targetIsland = null;
        this.state = 'idle';
        this.task = null;
        
        // Return to house and start random movement
        if (this.scene && this.house) {
            this.moveToPosition(this.house.x, this.house.y, () => {
                if (this.human) {
                    this.human.play('idle-down-right');
                    this.startRandomMovement();
                }
            });
        }
    }

    destroy() {
        if (this.moveTimer) {
            this.moveTimer.destroy();
            this.moveTimer = null;
        }
        
        // Clean up the human sprite and upgrade effect
        if (this.human) {
            this.human.destroy();
            this.human = null;
        }

        if (this.upgradeEffect) {
            this.upgradeEffect.destroy();
            this.upgradeEffect = null;
        }

        this.scene = null;
        this.island = null;
    }
}
