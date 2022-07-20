const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')
const gameOverDOM = document.querySelector('#game-over')
const heartsDOM = document.querySelector('#hearts')
const coinsDOM = document.querySelector('#coins')

canvas.width = 1280
canvas.height = 768

c.fillStyle = 'white'
c.fillRect(0, 0, canvas.width, canvas.height)

const gameMapImage = new Image()
gameMapImage.src = 'img/gameMap.png'

gameMapImage.onload = () => {
  animate()
}

const placementTilesData2D = []

for (let i = 0; i < placementTilesData.length; i += 20) {
  placementTilesData2D.push(placementTilesData.slice(i, i + 20))
}

const placementTiles = []

placementTilesData2D.forEach((row, y) => {
  row.forEach((symbol, x) => {
    if (symbol === 14)
      // add building placement tile here
      placementTiles.push(new PlacementTile({
        position: {
          x: x * 64,
          y: y * 64
        }
      }))
  })
})


const enemies = []

function spawnEnemies(spawnCount) {
  for (let i = 1; i < spawnCount + 1; i++) {
    const xOffset = i * 150
    enemies.push(
      new Enemy({
        position: {
          x: waypoints[0].x - xOffset,
          y: waypoints[0].y
        }
      })
    )
  }
}

function updateCoins(newValue) {
  coins += newValue
  coinsDOM.innerHTML = coins
}

// ------------------------
const buildings = []
let activeTile = undefined
let hearts = 10
let coins = 100
let numberOfEnemies = 3
const explosions = []
spawnEnemies(numberOfEnemies)

function animate() {
  const animationId = requestAnimationFrame(animate)

  c.drawImage(gameMapImage, 0, 0)

  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i]
    enemy.update()

    if(enemy.position.x > canvas.width) {
      hearts -= 1
      heartsDOM.innerHTML = hearts
      enemies.splice(i, 1)

      if(hearts === 0) {
        cancelAnimationFrame(animationId)
        gameOverDOM.style.display = 'flex'
      }
    }
  }

  for(let i = explosions.length - 1; i >= 0; i--) {
    const explosion = explosions[i]

    explosion.draw()
    explosion.update()

    if(explosion.frames.current >= explosion.frames.max -1) {
      explosions.splice(i, 1)
    }
  }

  // tracking total amount of enemies
  if (enemies.length === 0) {
    numberOfEnemies += 2
    spawnEnemies(numberOfEnemies)
  }

  placementTiles.forEach(tile => {
    tile.update(mouse)
  })

  buildings.forEach(building => {
    building.update()
    building.target = null

    const validEnemies = enemies.filter(enemy => {
      const xDistance = enemy.center.x - building.center.x
      const yDistance = enemy.center.y - building.center.y
      const distance = Math.hypot(xDistance, yDistance)

      return distance < enemy.radius + building.radius
    })
    building.target = validEnemies[0]

    for (let i = building.projectiles.length - 1; i >= 0; i--) {
      const projectile = building.projectiles[i]

      projectile.update()

      const xDistance = projectile.enemy.center.x - projectile.position.x
      const yDistance = projectile.enemy.center.y - projectile.position.y
      const distance = Math.hypot(xDistance, yDistance)

      if (distance < projectile.enemy.radius + projectile.radius) {
        // enemy health & enemy removal
        projectile.enemy.health -= 20
        if (projectile.enemy.health <= 0) {
          const enemyIndex = enemies.findIndex((enemy) => {
            return projectile.enemy == enemy
          })

          if (enemyIndex > -1){
            enemies.splice(enemyIndex, 1)
            // get coins by killing enemy
            updateCoins(25)
          }
        }

        // add explosion on projectile collision with enemy
        explosions.push(new Sprite({
          position: {
            x: projectile.position.x,
            y: projectile.position.y 
          },
          imageSrc: './img/explosion.png',
          frames: {
            max: 4,
          },
          offset: {
            x: 0,
            y: 0
          }
        }))
        building.projectiles.splice(i, 1)
      }
    }
  })
}

const mouse = {
  x: undefined,
  y: undefined
}

canvas.addEventListener('click', event => {
  if (activeTile && !activeTile.occupied && coins - 50 >= 0) {
    // lose coins to build tower
    updateCoins(-50)
    buildings.push(
      new Building({
        position: {
          x: activeTile.position.x,
          y: activeTile.position.y
        }
      })
    )

    activeTile.occupied = true

    // sorting buildings by y axis -> no overlaping when creating new building on tile above
    buildings.sort((a, b) => {
      return a.position.y - b.position.y
    })
  }
})

addEventListener('mousemove', event => {
  mouse.x = event.clientX
  mouse.y = event.clientY

  activeTile = null

  for (let i = 0; i < placementTiles.length; i++) {
    const tile = placementTiles[i]
    if (
      mouse.x > tile.position.x &&
      mouse.x < tile.position.x + tile.size &&
      mouse.y > tile.position.y &&
      mouse.y < tile.position.y + tile.size
    ) {
      activeTile = tile
      break
    }
  }
})