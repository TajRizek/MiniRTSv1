export default class Bridge {
    constructor(scene) {
        this.scene = scene;
        this.currentBridgePath = null;
        this.currentBridgeTile = 0;
        this.builders = [];
        
        // Create a map of valid bridge connections
        this.bridgeConnections = {
            0: [{ target: 1, orientation: 'horizontal' }, { target: 3, orientation: 'vertical' }],
            1: [{ target: 0, orientation: 'horizontal' }, { target: 2, orientation: 'horizontal' }, { target: 4, orientation: 'vertical' }],
            2: [{ target: 1, orientation: 'horizontal' }, { target: 5, orientation: 'vertical' }],
            3: [{ target: 0, orientation: 'vertical' }, { target: 4, orientation: 'horizontal' }, { target: 6, orientation: 'vertical' }],
            4: [{ target: 1, orientation: 'vertical' }, { target: 3, orientation: 'horizontal' }, { target: 5, orientation: 'horizontal' }, { target: 7, orientation: 'vertical' }],
            5: [{ target: 2, orientation: 'vertical' }, { target: 4, orientation: 'horizontal' }, { target: 8, orientation: 'vertical' }],
            6: [{ target: 3, orientation: 'vertical' }, { target: 7, orientation: 'horizontal' }],
            7: [{ target: 4, orientation: 'vertical' }, { target: 6, orientation: 'horizontal' }, { target: 8, orientation: 'horizontal' }],
            8: [{ target: 5, orientation: 'vertical' }, { target: 7, orientation: 'horizontal' }]
        };
    }

    isValidBridgeTarget(sourceIsland, targetIsland) {
        const sourceIndex = this.scene.placedIslands.indexOf(sourceIsland);
        const targetIndex = this.scene.placedIslands.indexOf(targetIsland);
        
        if (sourceIndex === -1 || targetIndex === -1) return false;

        const validConnections = this.bridgeConnections[sourceIndex];
        const isValid = validConnections.some(conn => conn.target === targetIndex);

        console.log('Bridge validation:', {
            sourceIndex,
            targetIndex,
            isValid,
            validConnections
        });

        return isValid;
    }

    getBridgeOrientation(sourceIsland, targetIsland) {
        const sourceIndex = this.scene.placedIslands.indexOf(sourceIsland);
        const targetIndex = this.scene.placedIslands.indexOf(targetIsland);
        
        const connection = this.bridgeConnections[sourceIndex]
            .find(conn => conn.target === targetIndex);
            
        return connection ? connection.orientation : null;
    }

    calculateBridgePath(sourceIsland, targetIsland) {
        const orientation = this.getBridgeOrientation(sourceIsland, targetIsland);
        if (!orientation) return [];

        const path = [];
        const horizontalTileWidth = 32;  // Doubled from 16 to match scale
        const horizontalTileHeight = 64;  // Doubled from 32 to match scale
        const verticalTileWidth = 64;    // Doubled from 32 to match scale
        const verticalTileHeight = 32;    // Doubled from 16 to match scale
        
        let currentX = sourceIsland.centerX;
        let currentY = sourceIsland.centerY;
        const islandSize = 256;
        const edgeOffset = islandSize / 2;
        
        if (orientation === 'horizontal') {
            // Move to edge of source island
            currentX += (targetIsland.centerX > sourceIsland.centerX) ? edgeOffset : -edgeOffset;
            
            // Calculate number of bridge segments needed
            const distance = Math.abs(targetIsland.centerX - sourceIsland.centerX) - islandSize;
            const numSegments = Math.ceil(distance / horizontalTileWidth) + 1; // Added +1 for extra tile
            
            // Add bridge segments
            for (let i = 0; i < numSegments; i++) {
                const isFirst = i === 0;
                const isLast = i === numSegments - 1;
                const direction = targetIsland.centerX > sourceIsland.centerX ? 'east' : 'west';
                
                let tileType;
                if (isFirst) {
                    tileType = `bridge_horizontal_end_${direction === 'east' ? 'west' : 'east'}_water`;
                } else if (isLast) {
                    tileType = `bridge_horizontal_end_${direction}_water`;
                } else {
                    tileType = 'bridge_horizontal';
                }
                
                path.push({
                    x: currentX,
                    y: currentY,
                    type: tileType,
                    width: horizontalTileWidth,
                    height: horizontalTileHeight
                });
                
                currentX += (direction === 'east' ? horizontalTileWidth : -horizontalTileWidth);
            }
        } else {
            // Move to edge of source island
            currentY += (targetIsland.centerY > sourceIsland.centerY) ? edgeOffset : -edgeOffset;
            
            // Calculate number of bridge segments needed
            const distance = Math.abs(targetIsland.centerY - sourceIsland.centerY) - islandSize;
            const numSegments = Math.ceil(distance / verticalTileHeight) + 1; // Added +1 for extra tile
            
            // Add bridge segments
            for (let i = 0; i < numSegments; i++) {
                const isFirst = i === 0;
                const isLast = i === numSegments - 1;
                const direction = targetIsland.centerY > sourceIsland.centerY ? 'south' : 'north';
                
                let tileType;
                if (isFirst) {
                    tileType = `bridge_vertical_end_${direction === 'south' ? 'north' : 'south'}_water`;
                } else if (isLast) {
                    tileType = `bridge_vertical_end_${direction}_water`;
                } else {
                    tileType = 'bridge_vertical';
                }
                
                path.push({
                    x: currentX,
                    y: currentY,
                    type: tileType,
                    width: verticalTileWidth,
                    height: verticalTileHeight
                });
                
                currentY += (direction === 'south' ? verticalTileHeight : -verticalTileHeight);
            }
        }
        
        return path;
    }

    addBuilder(human) {
        this.builders.push(human);
    }

    removeBuilder(human) {
        const index = this.builders.indexOf(human);
        if (index !== -1) {
            this.builders.splice(index, 1);
        }
    }

    startConstruction(sourceIsland, targetIsland) {
        if (!this.isValidBridgeTarget(sourceIsland, targetIsland)) {
            console.log('Invalid bridge target');
            return;
        }

        this.currentBridgePath = this.calculateBridgePath(sourceIsland, targetIsland);
        this.currentBridgeTile = 0;
        
        if (!this.currentBridgePath || this.currentBridgePath.length === 0) {
            console.log('No valid bridge path calculated');
            return;
        }
        
        console.log('Starting bridge construction with path:', this.currentBridgePath);
        
        // Start the builders working
        this.builders.forEach(builder => {
            builder.startBuildingBridge(this.currentBridgePath, targetIsland);
        });
    }

    stopConstruction() {
        this.builders.forEach(builder => {
            builder.stopBuildingBridge();
            
            // Find the UI scene and remove builder from assigned list
            const uiScene = builder.scene.islandUI;
            if (uiScene && uiScene.assignedHumans.bridge) {
                const index = uiScene.assignedHumans.bridge.indexOf(builder);
                if (index !== -1) {
                    uiScene.assignedHumans.bridge.splice(index, 1);
                    // Force an immediate UI update
                    uiScene.updateAssignmentIndicators();
                }
            }
        });
        this.builders = [];
        this.currentBridgePath = null;
        this.currentBridgeTile = 0;
    }
}
