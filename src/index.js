import Phaser from "phaser";
let gameScene = new Phaser.Scene('Game');

var config = {
    type: Phaser.AUTO,
    width: 1000,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: {y: 1500},
            debug: false
        }
    },
    scene: gameScene 
};

var game = new Phaser.Game(config);

var getCoin;
var map;
var coins;
var player;
var cursors;
var groundLayer;
var text;
let winText;
var score = 0;
let bombs;
let bombDropped = false;
let timer = 0;
let chest;
let chests;

setInterval(function() {
    timer++;
}, 1000)

gameScene.preload = function() {
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', 'assets/map3.json');
    // tiles in spritesheet 
    this.load.spritesheet('tiles', 'assets/tiles.png', {frameWidth: 70, frameHeight: 70});

    this.load.image('coin', 'assets/coinGold.png');

    this.load.image('background', 'assets/tonys_assets/castleBackground.jpg')
    // player animations
    this.load.atlas('player', 'assets/useKnight.png', 'assets/player.json');
    this.load.image('bomb', '../assets/bomb.png');
    this.load.image('chest', '../assets/chest.png');
}

gameScene.create = function() {
    // load the map 
    map = this.make.tilemap({key: 'map'});
    // add a background image //
    let background = this.add.sprite(0, 0, 'background');

    background.setOrigin(0,0).setScale(3.75);
    // tiles for the ground layer
    var groundTiles = map.addTilesetImage('tiles');
    // create the ground layer
    groundLayer = map.createDynamicLayer('Tile Layer 1', groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

    // create the player sprite    
    player = this.physics.add.sprite(200, 200, 'player');
    player.tint = Math.random() * 0xffffff;
    player.setCollideWorldBounds(true); // don't go out of the map    

    // small fix to our player images, we resize the physics body object slightly
    player.body.setSize(player.width-35, player.height-8);
    
    // player will collide with the level tiles 
    this.physics.add.collider(groundLayer, player);

       // player walk animation
       this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 1, end: 3, zeroPad: 2}),
        frameRate: 10,
        repeat: -1
    });
    // idle with only one frame, so repeat is not neaded
    this.anims.create({
        key: 'idle',
        frames: [{key: 'player', frame: 'p1_stand'}],
        frameRate: 10,
    });
    // swings sword when down arrow is held
    this.anims.create({
        key: 'swing',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_swing', start: 1, end: 5, zeroPad: 1}),
        frameRate: 10,
    });
    
    //jump animation
    this.anims.create({
        key: 'jump',
        frames: this.anims.generateFrameNames('player',  {prefix: 'p1_jump', start: 1, end: 4, zeroPad: 0}),
        frameRate: 10,
        repeat: -1
    
    });

    cursors = this.input.keyboard.createCursorKeys();

    coins = this.physics.add.group({
        key: 'coin',
        repeat: 150, 
        setXY: {x: 151, y: 0, stepX: 125}
    });

    // coins.enableBody = true();
    // getCoin = coins.create(Math.floor((Math.random() * 100 + 1)* 7 ), 0, 'coin');


    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(player);

    // set background color, so the sky is not black    
    this.cameras.main.setBackgroundColor('#ccccff');

    // this text will show the score
    text = this.add.text(20, 570, '0', {
        fontSize: '20px',
        fill: '#ffffff'
    });
    // fix the text to the camera
    text.setScrollFactor(0);

    // scoreText = this.add.text(1, 575, 'score: 0', { fontSize: '16px', fill: '#000'});

    //Bombs
    bombs = this.physics.add.group();
    this.physics.add.collider(bombs, groundLayer);
    this.physics.add.collider(player, bombs, hitBomb, null, this);

    //chest
    chests = this.physics.add.group();
    chest = chests.create(6350, 800, 'chest');
    chest.body.setSize(100,100);

    this.physics.add.collider(player, chest, winLevel, null, this);
    this.physics.add.collider(chest, groundLayer);

    this.physics.add.overlap(player, coins, collectCoin, null, this);
    this.physics.add.collider(groundLayer, coins);
}

function hitBomb (player, bomb) {
    this.physics.pause();
    player.setTint(0xff0000);
    player.anims.play('turn')
    this.gameOver();
}

function collectCoin (player, coin){
    coin.disableBody(true, true);

    score += 1;
    text.setText('Score: ' + score);

    if (coins.countActive(true) === 0){
        coins.children.iterate(function(child){
            child.enableBody(true, child.x, 0, true, true)
        });
    }
}

function winLevel(player, chest) {
    this.physics.pause();
    player.setTint(0xffd700);
    winText = this.add.text(400, 300, 'YOU WON!!!!', {
        fontSize: '50px',
        fill: '#ff0000',
    });
    winText.setScrollFactor(0);
}

gameScene.update = function(time, delta) {
    // if (timer % 2 === 0 && timer % 1 === 0 && bombDropped == false){
    //     player.tint = Math.random() * 0xffffff;
    // }
    if (cursors.left.isDown)
    {
        player.body.setVelocityX(-500);
        player.anims.play('walk', true); // walk left
        player.flipX = true; // flip the sprite to the left
    }  else if (cursors.down.isDown)
    {
        player.anims.play('swing', true);
    } else if (cursors.right.isDown)
    {
        player.body.setVelocityX(500);
        player.anims.play('walk', true);
        player.flipX = false; // use the original sprite looking to the right
    } else {
        player.body.setVelocityX(0);
        player.anims.play('idle', true);
    } 
    // jump 
    if (cursors.up.isDown && player.body.onFloor())
    {
        player.body.setVelocityY(-820); 
    }
    if(timer % 5 === 0 && bombDropped === false) {
        var x = (Math.random() * player.x + 400) + player.x - 400;
        var y = player.y-300;

        // var particles = this.add.particles('bomb');
        // var e = particles.createEmitter();
        // e.setPosition(x,y);
        // e.setSpeed(100);
        // e.setBlendMode(Phaser.BlendModes.ADD); 

        var bomb = bombs.create(x, y, 'bomb');
        bomb.setBounce(1);
        bomb.setCollideWorldBounds(true);
        bomb.setVelocity(Phaser.Math.Between(-200, 200), 20);  
        bombDropped = true;
    }
    if(bombDropped === true && timer % 6 === 0 && timer % 5 !== 0) {
        bombDropped = false;
    }
}
gameScene.gameOver = function() {
    this.cameras.main.shake(500);
    this.time.delayedCall(250, function() {
        this.cameras.main.fade(250);
    }, [], this);

    this.time.delayedCall(500, function() {
        this.scene.restart();
    }, [], this);
}

export function resetGame () {
    reset = function() {
        game.scene.restart();
    }
}