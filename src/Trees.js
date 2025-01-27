export default class Trees {
    static startGathering(human) {
        if (human.state !== 'idle') {
            human.stopCurrentTask();
        }
        if (human.isReproducing) return; // Don't interrupt reproduction
        
        // Find trees on the island
        const tree = this.findTreeOnIsland(human);
        if (!tree) {
            console.log('No trees found on this island!');
            return;
        }

        human.state = 'moving_to_tree';
        human.task = 'gathering_wood';

        // Move to tree
        human.moveToPosition(tree.x, tree.y, () => {
            human.state = 'harvesting';
            
            // Harvest for 2 seconds
            human.scene.time.delayedCall(2000, () => {
                human.state = 'moving_to_house';
                
                // Move back to house
                human.moveToPosition(human.house.x, human.house.y, () => {
                    // Update lumber counter
                    human.scene.scene.get('UIScene').updateResourceDisplay({
                        lumber: human.scene.scene.get('UIScene').resources.lumber + 1
                    });
                    
                    // Create floating wood effect
                    const wood = human.scene.add.image(
                        human.house.x,
                        human.house.y - 20,
                        'wood1'
                    ).setScale(2).setDepth(200);

                    // Create tween for floating and fading effect
                    human.scene.tweens.add({
                        targets: wood,
                        y: human.house.y - 40,
                        alpha: 0,
                        duration: 1000,
                        ease: 'Power1',
                        onComplete: () => {
                            wood.destroy();
                        }
                    });
                    
                    // Reset state and start again
                    human.state = 'idle';
                    if (human.task === 'gathering_wood') {
                        this.startGathering(human);
                    }
                });
            });
        });
    }

    static findTreeOnIsland(human) {
        // Find all trees in the scene
        const trees = human.scene.children.list.filter(child => 
            child.texture && child.texture.key.startsWith('tree_')
        );
        
        // Find the tree that's closest to this island's center
        const islandTree = trees.find(tree => {
            // Calculate distance from tree to island center
            const distanceToIslandCenter = Phaser.Math.Distance.Between(
                tree.x, tree.y,
                human.island.centerX, human.island.centerY
            );
            
            // Consider the tree to be on this island if it's within a reasonable radius
            const maxDistance = 150; // pixels
            return distanceToIslandCenter < maxDistance;
        });
        
        return islandTree ? { x: islandTree.x, y: islandTree.y } : null;
    }
}
