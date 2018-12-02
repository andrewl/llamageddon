var game = new Phaser.Game(1024, 768, Phaser.AUTO, '');

// All of these will change how the game works
var max_maize_count = 32;
var maize_count = max_maize_count;
var llama;
var score = 0;
var llama_speed = 0;
var min_llama_speed = 100;
var max_llama_speed = 2000;
var things_group;
var things_to_avoid_register = [];
var exit_points_group;
var max_things_to_avoid = 50;
var max_exit_points = 6;
var maize_text = false;
var maize_loss_seconds = 3;
var number_of_things = 4;

var height_of_temple =  128;
var height_of_maize = 64;
var size_of_avoider = 64;

var intro_text = "You are deep in the highlands of central America - and you are responsible for your villages maize supply!\n\nYou must use your pointer to lead llamas to the temple to appease the gods!\n\nDon't bump into the stones!\n\nDon't take your time!\n\nSome llamas move faster than others!\n\nSACRIFICES MUST BE MADE!\n\nPress 'S' to start!";


for (i = 1; i < number_of_things+1; i++) {
  name = 'thing' + i;

  things_to_avoid_register.push({
    name: name,
    sprite: name
  });
}

function random_range(min,max) { return Math.floor(Math.random()*(max-min+1)+min); }

var loadState = {

  preload: function() {
    game.load.atlasJSONHash('llama', 'assets/llama.png', 'assets/llama.json');
    game.load.atlasJSONHash('exit_point', 'assets/priest.png', 'assets/priest.json');

    for(i = 0; i < things_to_avoid_register.length; i++) {
      game.load.atlasJSONHash(
        things_to_avoid_register[i].name,
        'assets/' + things_to_avoid_register[i].sprite + '.png',
        'assets/' + things_to_avoid_register[i].sprite + '.json'
      );
    }

    game.load.audio('boom', ['assets/boom.ogg']);
    game.load.audio('llamageddon', ['assets/llamageddon.ogg']);
    game.load.image('stone', 'assets/mayanstone.png');
  },

  create: function() {
    game.state.start('menu');
  }

};

var menuState = {

  create: function() {

    text = game.add.text(game.world.centerX, game.world.centerY, intro_text);
    text.anchor.setTo(0.5);

    text.font = 'Arial';
    text.fontSize = 20;

    //  x0, y0 - x1, y1
    grd = text.context.createLinearGradient(0, 0, 0, text.canvas.height);
    grd.addColorStop(0, '#8ED6FF');   
    grd.addColorStop(1, '#004CB3');
    text.fill = grd;

    text.align = 'center';
    text.stroke = '#000000';
    text.strokeThickness = 2;
    text.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);

    var skey = game.input.keyboard.addKey(Phaser.Keyboard.S);
    skey.onDown.addOnce(this.start, this);

  },

  start: function() {
    game.state.start('play');
  },

};

var playState = {

  update: function() {

    if (maize_count < 1) {
      game.state.start('end');
    }

    //llama.rotation = game.physics.arcade.moveToPointer(llama, 60, game.input.activePointer, 500);
    rotation = game.physics.arcade.moveToPointer(llama, 600, game.input.activePointer, llama_speed);

    if (rotation > 2) {
      llama.rotation = 3;
    }
    else {
      llama.rotation = 0;
    }

    game.physics.arcade.overlap(llama, exit_points_group, this.llama_hit_exit_point, null, this);

    game.physics.arcade.overlap(llama, things_group, this.llama_hit_thing, null, this);
  },

  complete_level: function() {

    //kill the llama
    llama.destroy();

    //add some maize
    this.add_maize();

    //destroy all timer events
    game.time.events.removeAll();

    //remove the things
    for(i = 0; i < things_group.children.length; i++) {
      things_group.children[i].destroy();
    }

    //add some score
    score++;

    this.start_next_level();
  },

  start_next_level: function() {

    //remove the exit points
    exit_points_group.destroy();
    exit_points_group = game.add.group();
    exit_points_group.enableBody = true;

    //@todo - start the llama in the bottom right or left with a bit of a time lag

    number_of_things_to_avoid = Math.min((score+1) * 3, max_things_to_avoid);

    for (i = 0; i < number_of_things_to_avoid; i++) {
      pos_x = random_range(size_of_avoider,1024-size_of_avoider);
      pos_y = random_range(size_of_avoider+height_of_maize,800-size_of_avoider-height_of_temple);
      thing = things_to_avoid_register[random_range(0,things_to_avoid_register.length-1)];
      things_group.create(pos_x,pos_y,thing.name);
    }

    number_of_exit_points = random_range(1, max_exit_points);

    for (i = 0; i < number_of_exit_points; i++) {
      pos_x = (1024/(number_of_exit_points+1)) * (i+1);
      exit_points_group.create(pos_x,0,'exit_point');
    }

    llama = game.add.sprite(32, 800 - height_of_maize - 32 ,'llama');



    llama_speed = random_range(min_llama_speed, max_llama_speed);
    game.physics.arcade.enable(llama);
    game.time.events.add(Phaser.Timer.SECOND * maize_loss_seconds, this.lose_some_maize_because_of_time, this);
    this.draw_maize();

  },

  lose_some_maize_because_of_time: function() {
    this.remove_maize(1);
    game.time.events.add(Phaser.Timer.SECOND * maize_loss_seconds, this.lose_some_maize_because_of_time, this);
  },

  llama_hit_exit_point: function(llama, exit_point) {
    this.complete_level();
  },

  llama_hit_thing: function(llama, thing) {
    game.sound.play('boom');
    this.remove_maize(4);
    thing.destroy();
  },

  remove_maize: function(amount_to_remove) {
    maize_count = Math.max(maize_count - amount_to_remove, 0);
    this.draw_maize();
  },

  add_maize: function() {
    maize_count = Math.min(maize_count+2, max_maize_count);
    this.draw_maize();
    game.state.start('endState');
  },

  draw_maize: function() {
    var bar = game.add.graphics();
    bar.beginFill(0x000000, 0.2);
    bar.drawRect(0, 800 - height_of_maize, 1024, height_of_maize);

    if (maize_text) {
      maize_text.destroy();
    }

    style = { font: '32px Arial', fill: '#ff6600', align: 'left' };
    maize_text_string = '🌽';
    maize_text_string = maize_text_string.repeat(maize_count);
    maize_text = game.add.text(0, 800 - height_of_maize,maize_text_string,style);
  },

  create: function () {

    score = 0;
    maize_count = max_maize_count;
    game.stage.backgroundColor = '#308e13';
    game.world.setBounds(0,0,1024,768);
    game.physics.startSystem(Phaser.Physics.ARCADE);
    things_group = game.add.group();
    things_group.enableBody = true;
    exit_points_group = game.add.group();
    exit_points_group.enableBody = true;
    music = new Phaser.Sound(game,'llamageddon',0.75,true);
    music.play();
    for (i = 0; i < 1024; i = i + 128) {
      game.add.image(i, 0, 'stone');
    }

    this.start_next_level();
  },

};

var endState = {

  create: function() {

    adjectives = ["an amazing", "a stunning", "a poor", "a terrible", "a pathetic", "a paltry", "a superb", "a wonderful"];
    adjective = adjectives[Math.floor((Math.random() * adjectives.length))];

    text = game.add.text(game.world.centerX, game.world.centerY, "Congratulations!\nYou scored " + adjective + " " + score + " points\n\nPress 'S' to restart");
    text.anchor.setTo(0.5);

    text.font = 'Arial';
    text.fontSize = 20;

    //  x0, y0 - x1, y1
    grd = text.context.createLinearGradient(0, 0, 0, text.canvas.height);
    grd.addColorStop(0, '#8ED6FF');   
    grd.addColorStop(1, '#004CB3');
    text.fill = grd;

    text.align = 'center';
    text.stroke = '#000000';
    text.strokeThickness = 2;
    text.setShadow(5, 5, 'rgba(0,0,0,0.5)', 5);

    var skey = game.input.keyboard.addKey(Phaser.Keyboard.S);
    skey.onDown.addOnce(this.start, this);

  },

  start: function() {
    game.state.start('menu');
  },

};

window.onload = function() {
  //Finally add the game states
  game.state.add('load', loadState);
  game.state.add('menu', menuState);
  game.state.add('play', playState);
  game.state.add('end', endState);
  game.state.start('load');
};

/**
 *
 * https://opengameart.org/content/mayan-stone-ornament : Marscaleb
 * https://opengameart.org/content/lpc-style-farm-animals : daneeklu
 *
 * */
