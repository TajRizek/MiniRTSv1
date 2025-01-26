export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene' });
        this.timeElapsed = 0; // Time in seconds
        this.resources = {
            islanders: 0,
            lumber: 0,
            food: 0
        };
        this.lastFoodConsumption = 0; // Track last consumption time in seconds
    }

    create() {
        console.log('UIScene created'); // Debug log

        // Set this scene to be above the game scene
        this.scene.bringToTop();
        
        // Create resource panel
        this.createResourcePanel();
        
        // Create timer
        this.createTimer();

        // Start the timer
        this.time.addEvent({
            delay: 1000, // 1 second
            callback: this.updateTimer,
            callbackScope: this,
            loop: true
        });
    }

    createResourcePanel() {
        // Create black rectangle background
        const padding = 10;
        const panelWidth = 200;
        const panelHeight = 120;
        
        this.resourcePanel = this.add.rectangle(
            padding, 
            padding, 
            panelWidth, 
            panelHeight, 
            0x000000, 
            0.7
        ).setOrigin(0);

        // Create resource texts
        const textConfig = {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff'
        };

        const textX = padding * 2;
        this.resourceTexts = {
            islanders: this.add.text(textX, padding * 2, 'Islanders: 0', textConfig),
            lumber: this.add.text(textX, padding * 4, 'Lumber: 0', textConfig),
            food: this.add.text(textX, padding * 6, 'Food: 0', textConfig)
        };

        // Initialize with default values
        this.updateResourceDisplay(this.resources);
    }

    createTimer() {
        this.timerText = this.add.text(
            this.cameras.main.width / 2,
            20,
            '00:00',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5, 0).setDepth(10);
    }

    updateTimer() {
        this.timeElapsed += 1;
        const minutes = Math.floor(this.timeElapsed / 60);
        const seconds = this.timeElapsed % 60;
        this.timerText.setText(
            `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );

        // Check for food consumption every minute
        if (this.timeElapsed > 0 && this.timeElapsed % 60 === 0) {
            this.consumeFood();
        }
    }

    consumeFood() {
        const totalIslanders = this.resources.islanders;
        const availableFood = this.resources.food;
        
        // Calculate how many islanders can eat
        const fedIslanders = Math.min(totalIslanders, availableFood);
        const unfedIslanders = totalIslanders - fedIslanders;
        
        // Consume food
        this.updateResourceDisplay({
            food: Math.max(0, this.resources.food - fedIslanders)
        });

        // Log results
        if (unfedIslanders > 0) {
            console.log(`Not enough food! ${unfedIslanders} islanders didn't eat.`);
        } else if (totalIslanders > 0) {
            console.log(`All ${totalIslanders} islanders have eaten.`);
        }
    }

    updateResourceDisplay(resources) {
        // Merge provided resources with defaults
        this.resources = {
            ...this.resources,
            ...resources
        };

        // Update text displays if they exist
        if (this.resourceTexts) {
            this.resourceTexts.islanders.setText(`Islanders: ${this.resources.islanders}`);
            this.resourceTexts.lumber.setText(`Lumber: ${this.resources.lumber}`);
            this.resourceTexts.food.setText(`Food: ${this.resources.food}`);
        }
    }
}
