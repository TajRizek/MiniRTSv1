export default class Berries {
    static startGathering(human) {
        if (human.state !== 'idle') {
            human.stopCurrentTask();
        }
        if (human.isReproducing) return; // Don't interrupt reproduction
        
        // Find berries on the island
        const berries = this.findBerriesOnIsland(human);
        if (!berries) {
            console.log('No berries found on this island!');
            return;
        }

        human.state = 'moving_to_berries';
        human.task = 'gathering_food';

        // Move to berries
        human.moveToPosition(berries.x, berries.y, () => {
            human.state = 'gathering';
            
            // Gather for 2 seconds
            human.scene.time.delayedCall(2000, () => {
                human.state = 'moving_to_house';
                
                // Move back to house
                human.moveToPosition(human.house.x, human.house.y, () => {
                    // Update food counter
                    human.scene.scene.get('UIScene').updateResourceDisplay({
                        food: human.scene.scene.get('UIScene').resources.food + 1
                    });
                    
                    // Create floating strawberry effect
                    const strawberry = human.scene.add.image(
                        human.house.x,
                        human.house.y - 20,
                        'strawberry'
                    ).setScale(2).setDepth(200);

                    // Create tween for floating and fading effect
                    human.scene.tweens.add({
                        targets: strawberry,
                        y: human.house.y - 40,
                        alpha: 0,
                        duration: 1000,
                        ease: 'Power1',
                        onComplete: () => {
                            strawberry.destroy();
                        }
                    });
                    
                    // Reset state and start again
                    human.state = 'idle';
                    if (human.task === 'gathering_food') {
                        this.startGathering(human);
                    }
                });
            });
        });
    }

    static findBerriesOnIsland(human) {
        // Find all berry bushes in the scene
        const berryBushes = human.scene.children.list.filter(child => 
            child.texture && child.texture.key === 'berries1'
        );
        
        // Find the berry bush that's closest to this island's center
        const islandBerries = berryBushes.find(bush => {
            // Calculate distance from bush to island center
            const distanceToIslandCenter = Phaser.Math.Distance.Between(
                bush.x, bush.y,
                human.island.centerX, human.island.centerY
            );
            
            // Consider the bush to be on this island if it's within a reasonable radius
            const maxDistance = 150; // pixels
            return distanceToIslandCenter < maxDistance;
        });
        
        return islandBerries ? { x: islandBerries.x, y: islandBerries.y } : null;
    }
}
