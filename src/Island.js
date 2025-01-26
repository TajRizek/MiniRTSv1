export function generateRandomIsland(centerX, centerY, minSize, maxSize) {
    const TILE_SIZE = 16;

    // Randomize width and height within the specified range
    const width = Phaser.Math.Between(minSize, maxSize);
    const height = Phaser.Math.Between(minSize, maxSize);

    const tiles = [];

    // Generate the center tiles
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const tileX = centerX + (x - width / 2) * TILE_SIZE;
            const tileY = centerY + (y - height / 2) * TILE_SIZE;
            tiles.push({ x: tileX, y: tileY });
        }
    }

    return { centerX, centerY, width, height, tiles };
}

export function renderIsland(scene, island) {
    const startTime = performance.now();
    
    const { centerX, centerY, width, height, tiles } = island;
    const TILE_SIZE = 16;

    // Define corner positions, but moved one tile inward diagonally
    const corners = [
        { // Northwest (moved 1 right, 1 down)
            x: centerX - (width * TILE_SIZE) / 2 + TILE_SIZE,
            y: centerY - (height * TILE_SIZE) / 2 + TILE_SIZE
        },
        { // Northeast (moved 1 left, 1 down)
            x: centerX + (width * TILE_SIZE) / 2 - 2 * TILE_SIZE,
            y: centerY - (height * TILE_SIZE) / 2 + TILE_SIZE
        },
        { // Southwest (moved 1 right, 1 up)
            x: centerX - (width * TILE_SIZE) / 2 + TILE_SIZE,
            y: centerY + (height * TILE_SIZE) / 2 - 2 * TILE_SIZE
        },
        { // Southeast (moved 1 left, 1 up)
            x: centerX + (width * TILE_SIZE) / 2 - 2 * TILE_SIZE,
            y: centerY + (height * TILE_SIZE) / 2 - 2 * TILE_SIZE
        }
    ];

    // Render corners
    scene.addAnimatedTile(
        centerX - (width * TILE_SIZE) / 2 - 2 * TILE_SIZE,
        centerY - (height * TILE_SIZE) / 2 - TILE_SIZE,
        "terrain_corner_northwest"
    );
    scene.addAnimatedTile(
        centerX + (width * TILE_SIZE) / 2 - TILE_SIZE,
        centerY - (height * TILE_SIZE) / 2 - TILE_SIZE,
        "terrain_corner_northeast"
    );
    scene.addAnimatedTile(
        centerX - (width * TILE_SIZE) / 2 - 2 * TILE_SIZE,
        centerY + (height * TILE_SIZE) / 2 - TILE_SIZE,
        "terrain_corner_southwest"
    );
    scene.addAnimatedTile(
        centerX + (width * TILE_SIZE) / 2 - TILE_SIZE,
        centerY + (height * TILE_SIZE) / 2 - TILE_SIZE,
        "terrain_corner_southeast"
    );

    // Render edges
    for (let x = 1; x < width - 1; x++) {
        const tileX = centerX + (x - width / 2) * TILE_SIZE;

        // Ensure the north edge is slightly moved to cover any gaps
        scene.addAnimatedTile(
            tileX,
            centerY - (height * TILE_SIZE) / 2 - TILE_SIZE + 1, // Adjusted Y position
            "terrain_edge_north_A"
        );
        scene.addAnimatedTile(
            tileX,
            centerY + (height * TILE_SIZE) / 2 - TILE_SIZE,
            "terrain_edge_south_A"
        );
    }


    for (let y = 1; y < height - 1; y++) {
        const tileY = centerY + (y - height / 2) * TILE_SIZE;

        scene.addAnimatedTile(
            centerX - (width * TILE_SIZE) / 2 - 2 * TILE_SIZE,
            tileY,
            "terrain_edge_west_A"
        );
        scene.addAnimatedTile(
            centerX + (width * TILE_SIZE) / 2 - TILE_SIZE,
            tileY,
            "terrain_edge_east_A"
        );
    }

    // Render center tiles
    tiles.forEach((tile) => {
        scene.add.image(tile.x, tile.y, "terrain").setOrigin(0);
    });

    // After rendering the island, add a tree and berries to different random corners
    const availableCorners = [...corners];
    
    // Place tree
    const treeCornerIndex = Phaser.Math.Between(0, availableCorners.length - 1);
    const treeCorner = availableCorners[treeCornerIndex];
    const treeVariants = ['C', 'D'];
    const treeVariant = Phaser.Utils.Array.GetRandom(treeVariants);
    scene.add.image(treeCorner.x, treeCorner.y, `tree_${treeVariant}`)
        .setOrigin(0)
        .setDepth(0.5)
        .setScale(3);
    
    // Remove used corner and place berries
    availableCorners.splice(treeCornerIndex, 1);
    const berryCorner = Phaser.Utils.Array.GetRandom(availableCorners);
    scene.add.image(berryCorner.x, berryCorner.y, 'berries1')
        .setOrigin(0)
        .setDepth(0.5)
        .setScale(1.5);

    console.log(`[Islands] Single island render time: ${performance.now() - startTime}ms`);
}

export function createAndPlaceIslands(scene, currentIslandIndex = 0) {
    console.log("[Islands] Starting island placement...");
    
    const TILE_SIZE = 16;
    const ISLAND_WIDTH = 15;
    const ISLAND_HEIGHT = 15;
    
    // Adjust padding for left/right edges
    const PADDING_HORIZONTAL = 300; // Increased center padding
    const PADDING_VERTICAL = 200;   // Keep vertical padding the same
    
    // Calculate grid positions with adjusted spacing
    const gridSize = 3;
    
    // Adjust spacing for left/right columns to be closer to center
    let x;
    if (currentIslandIndex % 3 === 0) {        // Left column
        x = PADDING_HORIZONTAL;
    } else if (currentIslandIndex % 3 === 2) { // Right column
        x = scene.cameras.main.width - PADDING_HORIZONTAL;
    } else {                                   // Center column
        x = scene.cameras.main.width / 2;
    }
    
    // Calculate y position normally
    const row = Math.floor(currentIslandIndex / gridSize);
    const y = PADDING_VERTICAL + (row * ((scene.cameras.main.height - (2 * PADDING_VERTICAL)) / 2));
    
    console.log(`[Islands] Creating island ${currentIslandIndex + 1} at position (${x}, ${y})`);
    
    // Generate island at grid position with fixed size
    const island = generateRandomIsland(x, y, ISLAND_WIDTH, ISLAND_WIDTH);
    
    // Render the island
    const startTime = performance.now();
    renderIsland(scene, island);
    console.log(`[Islands] Single island render time: ${performance.now() - startTime}ms`);
    
    return island;
}

export default class Island {
    constructor(scene, x, y, width, height) {
        this.scene = scene;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.tileSize = 32;
        this.centerX = x + (width * this.tileSize) / 2;
        this.centerY = y + (height * this.tileSize) / 2;
        
        this.generateIslandShape();
    }

    generateIslandShape() {
        // Create base grid representation
        this.grid = Array(this.height).fill().map(() => Array(this.width).fill('center'));
        
        // Mark edges and corners
        this.markBasicTiles();
        
        // Create the actual tiles
        this.createTiles();
    }

    markBasicTiles() {
        // Mark edges
        for(let x = 0; x < this.width; x++) {
            this.grid[0][x] = 'edge_north';
            this.grid[this.height-1][x] = 'edge_south';
        }
        for(let y = 0; y < this.height; y++) {
            this.grid[y][0] = 'edge_west';
            this.grid[y][this.width-1] = 'edge_east';
        }

        // Mark corners
        this.grid[0][0] = 'corner_northwest';
        this.grid[0][this.width-1] = 'corner_northeast';
        this.grid[this.height-1][0] = 'corner_southwest';
        this.grid[this.height-1][this.width-1] = 'corner_southeast';
    }

    createTiles() {
        for(let y = 0; y < this.height; y++) {
            for(let x = 0; x < this.width; x++) {
                const tileType = this.grid[y][x];
                const worldX = this.x + (x * this.tileSize) + this.tileSize/2;
                const worldY = this.y + (y * this.tileSize) + this.tileSize/2;
                this.createRegularTile(worldX, worldY, tileType);
            }
        }
    }

    createRegularTile(worldX, worldY, tileType) {
        let spriteName;
        
        switch(tileType) {
            case 'center':
                spriteName = 'terrain';
                break;
            case 'edge_north':
                spriteName = 'terrain_edge_north';
                break;
            case 'edge_south':
                spriteName = 'terrain_edge_south';
                break;
            case 'edge_east':
                spriteName = 'terrain_edge_east';
                break;
            case 'edge_west':
                spriteName = 'terrain_edge_west';
                break;
            case 'corner_northwest':
                spriteName = 'terrain_corner_northwest';
                break;
            case 'corner_northeast':
                spriteName = 'terrain_corner_northeast';
                break;
            case 'corner_southwest':
                spriteName = 'terrain_corner_southwest';
                break;
            case 'corner_southeast':
                spriteName = 'terrain_corner_southeast';
                break;
        }

        if(spriteName) {
            const sprite = this.scene.add.image(worldX, worldY, spriteName);
            sprite.setOrigin(0.5, 0.5);
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width * this.tileSize,
            top: this.y,
            bottom: this.y + this.height * this.tileSize,
            width: this.width * this.tileSize,
            height: this.height * this.tileSize
        };
    }

    isPositionOnIsland(x, y) {
        // Convert world coordinates to grid coordinates
        const gridX = Math.floor((x - this.x) / this.tileSize);
        const gridY = Math.floor((y - this.y) / this.tileSize);

        // Check if the coordinates are within the grid bounds
        if (gridX < 0 || gridX >= this.width || gridY < 0 || gridY >= this.height) {
            return false;
        }

        // Check if the tile at this position is a center tile
        return this.grid[gridY][gridX] === 'center';
    }
}
