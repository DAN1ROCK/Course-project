'use strict';

const cvs = document.getElementById('canvas');
const ctx = cvs.getContext('2d');

cvs.width = window.innerWidth;
cvs.height = window.innerHeight - 4;

const canvas = {
  width: cvs.width,
  height: cvs.height,
};

const background = new Image();
const player = new Image();
const bullet = new Image();
const particles = new Image();
const greyParticles = new Image();
const spawner = new Image();
const redParticles = new Image();

const frequency = {
  hz60: 1000 / 60,
  hz144: 1000 / 144,
};

const currentHz = frequency.hz60;
const hzCoef = currentHz / 7;
let timeCoef = 1;

let xPos = canvas.width / 2;
let yPos = canvas.height / 2;
let playerSpeed = 0.5;
let playerIsAlive = true;
const bullets = [];
const allParticles = [];
const enemies = [];
let enemyMaxSpawnTimer = 3000;

background.src = 'Textures/Floor.png';
player.src = 'Textures/Character.png';
bullet.src = 'Textures/bullet.png';
particles.src = 'Textures/WhiteParticles.png';
greyParticles.src = 'Textures/GreyParticles.png';
spawner.src = 'Textures/spawner.png';
redParticles.src = 'Textures/RedParticles.png';

const key = {
  up: false,
  down: false,
  left: false,
  right: false,
};

const mousePos = {
  X: -1,
  Y: -1,
};

const getCenterX = (x, img, scale) => x + (img.width * scale) / 2;
const getCenterY = (y, img, scale) => y + (img.height * scale) / 2;

const toRadians = (angle) => angle * (Math.PI / 180);

const calculateAngle = (x1, y1, x2, y2, cursor = true) => {
  const centerX1 = getCenterX(x1, player, 0.4);
  const centerY1 = getCenterY(y1, player, 0.4);
  const centerX2 = cursor ? x2 : getCenterX(x2, player, 0.4);
  const centerY2 = cursor ? y2 : getCenterY(y2, player, 0.4);
  const pi = centerY1 - centerY2 >= 0 ? Math.PI : 0;
  return -Math.atan((centerX1 - centerX2) / (centerY1 - centerY2)) + pi;
};

document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

const shoot = () => {
  if (playerIsAlive)
    bullets.push(
      new Bullet(
        calculateAngle(xPos, yPos, mousePos.X, mousePos.Y) + toRadians(90),
        getCenterX(xPos, player, 0.4),
        getCenterY(yPos, player, 0.4),
        2,
        bullets.length
      )
    );
};

const resetPlayerSpeed = () => {
  playerSpeed = 0.5;
};

function keyDown(event) {
  if (event.code === 'KeyW') key.up = true;
  if (event.code === 'KeyS') key.down = true;
  if (event.code === 'KeyA') key.left = true;
  if (event.code === 'KeyD') key.right = true;
  if (event.code === 'KeyE') shoot();
  if (event.code === 'KeyQ') {
    playerSpeed *= 5;
    setTimeout(resetPlayerSpeed, 50 / timeCoef);
  }
}

function keyUp(event) {
  if (event.code === 'KeyW') key.up = false;
  if (event.code === 'KeyS') key.down = false;
  if (event.code === 'KeyA') key.left = false;
  if (event.code === 'KeyD') key.right = false;
}

const drawImage = (
  ctx,
  img,
  x,
  y,
  angle = 0,
  scale = 1,
  absoluteCenter = false
) => {
  const xCenterShear = absoluteCenter ? (img.width * scale) / 2 : 0;
  const yCenterShear = absoluteCenter ? (img.height * scale) / 2 : 0;
  ctx.save();
  ctx.translate(
    x + (img.width * scale) / 2 - xCenterShear,
    y + (img.height * scale) / 2 - yCenterShear
  );
  ctx.rotate(angle);
  ctx.translate(
    -x - (img.width * scale) / 2 + xCenterShear,
    -y - (img.height * scale) / 2 + yCenterShear
  );
  ctx.drawImage(
    img,
    x - xCenterShear,
    y - yCenterShear,
    img.width * scale,
    img.height * scale
  );
  ctx.restore();
};

document.onmousemove = function(event) {
  mousePos.X = event.pageX;
  mousePos.Y = event.pageY;
};

const objectDestroyed = (index, objectArray) => {
  for (let i = index; i < objectArray.length; ++i) objectArray[i].index -= 1;
};

const spawnEnemy = () => {
  if (enemies.length < 20)
    enemies.push(
      new Enemy(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        0.2,
        enemies.length
      )
    );

  setTimeout(spawnEnemy, Math.random() * enemyMaxSpawnTimer);
};

const explosion = (
  x,
  y,
  radius,
  maxScale,
  particleCount,
  particleType = greyParticles
) => {
  for (let i = 0; i < particleCount; ++i) {
    const spawnX = x + Math.random() * radius * 2 - radius;
    const spawnY = y + Math.random() * radius * 2 - radius;
    allParticles.push(
      new Particles(
        spawnX,
        spawnY,
        Math.random() * (maxScale / 2) + maxScale / 2,
        allParticles.length,
        particleType,
        calculateAngle(x, y, spawnX, spawnY, false) + toRadians(90),
        Math.random() * 0.2,
        0
      )
    );
  }
};

const detectCollision = () => {
  for (let i = 0; i < bullets.length; ++i) {
    const centerX = getCenterX(xPos, player, 0.4);
    const centerY = getCenterY(yPos, player, 0.4);
    if (
      Math.sqrt(
        Math.pow(bullets[i].x - centerX, 2) +
          Math.pow(bullets[i].y - centerY, 2)
      ) < 20 &&
      bullets[i].isEnemy
    ) {
      explosion(centerX, centerY, 15, 0.7, 20, redParticles);
      playerIsAlive = false;
    }
  }
};

const main = () => {
  for (let x = 0; x < canvas.width; x += 150) {
    for (let y = 0; y < canvas.height; y += 150) {
      ctx.drawImage(background, x, y, 150, 150);
    }
  }

  if (playerIsAlive) {
    if (key.up && yPos > 0) yPos -= playerSpeed * hzCoef * timeCoef;
    if (key.down && yPos < canvas.height - 40)
      yPos += playerSpeed * hzCoef * timeCoef;
    if (key.left && xPos > 0) xPos -= playerSpeed * hzCoef * timeCoef;
    if (key.right && xPos < canvas.width - 40)
      xPos += playerSpeed * hzCoef * timeCoef;
  }

  if (key.up || key.down || key.right || key.left) {
    if (timeCoef < 1) timeCoef += 0.02 * hzCoef * timeCoef;
  } else if (timeCoef > 0.2) timeCoef -= 0.02 * hzCoef * timeCoef;

  if (timeCoef > 1 || !playerIsAlive) timeCoef = 1;
  if (timeCoef < 0.2) timeCoef = 0.2;

  for (let i = 0; i < allParticles.length; ++i) allParticles[i].particlesMain();
  for (let i = 0; i < bullets.length; ++i) bullets[i].bulletMain();
  for (let i = 0; i < enemies.length; ++i) enemies[i].enemyMain();

  if (playerIsAlive) {
    drawImage(
      ctx,
      player,
      xPos,
      yPos,
      calculateAngle(xPos, yPos, mousePos.X, mousePos.Y) + toRadians(90),
      0.4
    );
    detectCollision();
  }
};

setInterval(main, currentHz);
setTimeout(spawnEnemy, 2000);
