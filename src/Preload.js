export function preload(scene) {
    console.log("Preloading...");

    // Load terrain center tiles
    scene.load.image("terrain", "assets/terrain_center.png");

    // Load terrain corners explicitly
    ["northeast", "northwest", "southeast", "southwest"].forEach((corner) => {
        for (let i = 1; i <= 3; i++) {
            scene.load.image(
                `terrain_corner_${corner}_f${i}`,
                `assets/pieces/terrain/terrain_corner_${corner}_f${i}.png`
            );
        }
    });

    // Load terrain edges explicitly
    ["north", "south", "east", "west"].forEach((edge) => {
        for (let i = 1; i <= 3; i++) {
            scene.load.image(
                `terrain_edge_${edge}_A_f${i}`,
                `assets/pieces/terrain/terrain_edge_${edge}_A_f${i}.png`
            );
        }
    });

    // Load ocean
    scene.load.image("ocean", "assets/pieces/ocean.png");

    // Load animations
    scene.load.spritesheet("HumanIdle", "assets/Human/HumanIdle.png", {
        frameWidth: 32,
        frameHeight: 32,
    });

    scene.load.spritesheet("HumanWalk", "assets/Human/HumanWalk.png", {
        frameWidth: 32,
        frameHeight: 32,
    });

    scene.load.spritesheet("UpgradeEffect", "assets/UpgradeEffect.png", {
        frameWidth: 32,
        frameHeight: 32,
    });

    // Load inner corners
    const directions = ['northeast', 'northwest', 'southeast', 'southwest'];
    directions.forEach(dir => {
        for(let frame = 1; frame <= 3; frame++) {
            scene.load.image(
                `terrain_corner_inner_${dir}_f${frame}`,
                `assets/pieces/terrain/terrain_corner_inner_${dir}_f${frame}.png`
            );
        }
    });

    // Load tree variations
    ['A', 'B', 'C', 'D'].forEach(variant => {
        scene.load.image(
            `tree_${variant}`,
            `assets/resources/trees/tree_${variant}.png`
        );
    });
    scene.load.image("wood1", "assets/resources/trees/wood1.png");

    // Load berries
    scene.load.image("berries1", "assets/resources/berries/berries1.png");
    scene.load.image("strawberry", "assets/resources/berries/strawberry.png");

    // Load town house
    scene.load.image("house_A", "assets/house/house1.png");
    scene.load.image("heart_C", "assets/house/heart_C.png");

    // Load bridge variations
    scene.load.image("bridge_horizontal", "assets/bridge/bridge_horizontal.png");
    scene.load.image("bridge_horizontal_end_east", "assets/bridge/bridge_horizontal_end_east.png");
    scene.load.image("bridge_horizontal_end_east_water", "assets/bridge/bridge_horizontal_end_east_water.png");
    scene.load.image("bridge_horizontal_end_west", "assets/bridge/bridge_horizontal_end_west.png");
    scene.load.image("bridge_horizontal_end_west_water", "assets/bridge/bridge_horizontal_end_west_water.png");
    scene.load.image("bridge_vertical", "assets/bridge/bridge_vertical.png");
    scene.load.image("bridge_vertical_end_north", "assets/bridge/bridge_vertical_end_north.png");
    scene.load.image("bridge_vertical_end_north_water", "assets/bridge/bridge_vertical_end_north_water.png");
    scene.load.image("bridge_vertical_end_south", "assets/bridge/bridge_vertical_end_south.png");
    scene.load.image("bridge_vertical_end_south_water", "assets/bridge/bridge_vertical_end_south_water.png");
}
