let type = "WebGL"
if(!PIXI.utils.isWebGLSupported()){
  type = "canvas"
}

PIXI.utils.sayHello(type)

//Aliases
let Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    Graphics = PIXI.Graphics,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Text = PIXI.Text,
    TextStyle = PIXI.TextStyle;

//Create a Pixi Application
let app = new Application({
    width: 758,
    height: 512,
    antialiasing: true,
    transparent: false,
    resolution: 1
  }
);

//Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

loader
  .add("images/pong_stuff.json")
  .load(setup);

let state, gameScene, sprite_ids, player1, player2, ball;

function setup() {
  console.log("settin' up");

  //Make the game scene and add it to the stage
  gameScene = new Container();
  app.stage.addChild(gameScene);

  //Make the sprites and add them to the `gameScene`
  //Create an alias for the texture atlas frame ids
  sprite_ids = resources["images/pong_stuff.json"].textures;

  //Court
  court = new Sprite(sprite_ids["court.png"]);
  gameScene.addChild(court);

  player1 = new Sprite(sprite_ids["paddle.png"]);
  player1.position.set(64, gameScene.height / 2 - player1.height / 2);
  player1.vx = 0;
  player1.vy = 0;
  gameScene.addChild(player1);

  player2 = new Sprite(sprite_ids["paddle.png"]);
  player2.position.set(gameScene.width - 80, gameScene.height / 2 - player2.height / 2);
  player2.vx = 0;
  player2.vy = 0;
  gameScene.addChild(player2);

  ball = new Sprite(sprite_ids["ball.png"]);
  ball.position.set(200, gameScene.height / 2 - ball.height/2);
  ball.vx = 5;
  ball.vy = 0;
  gameScene.addChild(ball);


  //Capture the keyboard arrow keys
  let up = keyboard(38),
      down = keyboard(40),
      w = keyboard(87),
      s = keyboard(83);

  //Up
  up.press = function() {
    player2.vy = -10;
    player2.vx = 0;
  };
  up.release = function() {
    if (!down.isDown && player2.vx === 0) {
      player2.vy = 0;
    }
  };
  //Up
  w.press = function() {
    player1.vy = -10;
    player1.vx = 0;
  };
  w.release = function() {
    if (!s.isDown && player1.vx === 0) {
      player1.vy = 0;
    }
  };

  //Down
  down.press = function() {
    player2.vy = 10;
    player2.vx = 0;
  };
  down.release = function() {
    if (!up.isDown && player2.vx === 0) {
      player2.vy = 0;
    }
  };
  //Down
  s.press = function() {
    player1.vy = 10;
    player1.vx = 0;
  };
  s.release = function() {
    if (!w.isDown && player1.vx === 0) {
      player1.vy = 0;
    }
  };

  //Set the game state
  state = play;

  //Start the game loop
  app.ticker.add(delta => gameLoop(delta));

}

function gameLoop(delta){

  //Update the current game state:
  state(delta);
}

function play(delta) {
  player1.y += player1.vy;
  player2.y += player2.vy;

  contain(player1, {x: 32, y: 32, width: gameScene.width - 32, height: gameScene.height - 32});
  contain(player2, {x: 32, y: 32, width: gameScene.width - 32, height: gameScene.height - 32});

  // The ball needs to move every frame.
  // it starts with a vx of 1, and a vy of 0.


  // if the ball makes contact with either player, it reverses
  // direction.
  // is the ball touching a player?

  if (hitTestRectangle(player1, ball)) {
    console.log("HIT player2");
    ball.vx *= -1;

    let max_y = 5;
    let p1_center_y = player1.y + player1.height/2;
    let ball_center_y = ball.y + ball.height/2;
    let dy = ball_center_y - p1_center_y;
    ball.vy = max_y * dy / player1.height;
  }

  if (hitTestRectangle(player2, ball)) {
    console.log("HIT player2");
    ball.vx *= -1;

    let max_y = 5;
    let p2_center_y = player2.y + player2.height/2;
    let ball_center_y = ball.y + ball.height/2;
    let dy = ball_center_y - p2_center_y;
    ball.vy = max_y * dy / player2.height;
  }

  // Is the ball touching a wall?
  let current_vy = ball.vy;
  let ballHitsWall = contain(ball, {x: 32, y: 32, width: gameScene.width - 32, height: gameScene.height - 32});

  if (ballHitsWall === "top" || ballHitsWall === "bottom") {
    ball.vy *= -1;
  }

  if (ballHitsWall === "left" || ballHitsWall === "right") {
    ball.vx *= -1;
  }

  ball.x += ball.vx;
  ball.y += ball.vy;

}














//The `keyboard` helper function
function keyboard(keyCode) {
  var key = {};
  key.code = keyCode;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
    }
    event.preventDefault();
  };

  //The `upHandler`
  key.upHandler = function(event) {
    if (event.keyCode === key.code) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
    }
    event.preventDefault();
  };

  //Attach event listeners
  window.addEventListener(
    "keydown", key.downHandler.bind(key), false
  );
  window.addEventListener(
    "keyup", key.upHandler.bind(key), false
  );
  return key;
}

//The `hitTestRectangle` function
function hitTestRectangle(r1, r2) {

  //Define the variables we'll need to calculate
  let hit, combinedHalfWidths, combinedHalfHeights, vx, vy;

  //hit will determine whether there's a collision
  hit = false;

  //Find the center points of each sprite
  r1.centerX = r1.x + r1.width / 2;
  r1.centerY = r1.y + r1.height / 2;
  r2.centerX = r2.x + r2.width / 2;
  r2.centerY = r2.y + r2.height / 2;

  //Find the half-widths and half-heights of each sprite
  r1.halfWidth = r1.width / 2;
  r1.halfHeight = r1.height / 2;
  r2.halfWidth = r2.width / 2;
  r2.halfHeight = r2.height / 2;

  //Calculate the distance vector between the sprites
  vx = r1.centerX - r2.centerX;
  vy = r1.centerY - r2.centerY;

  //Figure out the combined half-widths and half-heights
  combinedHalfWidths = r1.halfWidth + r2.halfWidth;
  combinedHalfHeights = r1.halfHeight + r2.halfHeight;

  //Check for a collision on the x axis
  if (Math.abs(vx) < combinedHalfWidths) {

    //A collision might be occuring. Check for a collision on the y axis
    if (Math.abs(vy) < combinedHalfHeights) {

      //There's definitely a collision happening
      hit = true;
    } else {

      //There's no collision on the y axis
      hit = false;
    }
  } else {

    //There's no collision on the x axis
    hit = false;
  }

  //`hit` will be either `true` or `false`
  return hit;
};

function contain(sprite, container) {

  let collision = undefined;

  //Left
  if (sprite.x < container.x) {
    sprite.x = container.x;
    collision = "left";
  }

  //Top
  if (sprite.y < container.y) {
    sprite.y = container.y;
    collision = "top";
  }

  //Right
  if (sprite.x + sprite.width > container.width) {
    sprite.x = container.width - sprite.width;
    collision = "right";
  }

  //Bottom
  if (sprite.y + sprite.height > container.height) {
    sprite.y = container.height - sprite.height;
    collision = "bottom";
  }

  //Return the `collision` value
  return collision;
}
