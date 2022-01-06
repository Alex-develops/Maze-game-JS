const { Engine, Render, Runner, World, Bodies, Body, Events} = Matter;

const cellsHorizontal = 7; //number of columns, inner array
const cellsVertical = 9; // number of rows, outer array
const width = window.innerWidth;
const height = window.innerHeight;

const unitLenghtX = width /cellsHorizontal;
const unitLenghtY = height/cellsVertical;
//Boiler plate 
const engine = Engine.create();
engine.world.gravity.y = 0;  //disable gravity
const {world} = engine; 
const render = Render.create({
    element: document.body,
    engine: engine,
    options :{
        wireframes: false, // making the shapes solid
        width: width,
        height: height
    }
});
Render.run(render);
Runner.run(Runner.create(), engine);


//Walls
const walls= [
    Bodies.rectangle(width/2, 0, width, 2, {isStatic:true}), //top
    Bodies.rectangle(width/2, height, width, 2, {isStatic:true}), //bottom
    Bodies.rectangle(0, height/2, 2, height, {isStatic:true}), //left
    Bodies.rectangle(width, height/2, 2, height, {isStatic:true}) // right
];
World.add(world, walls);

//Maze generation 

const shuffle = (arr) => {
   let counter = arr.length;

   while (counter > 0) {
       const index = Math.floor(Math.random()* counter);

       counter --;
       const temp = arr[counter];
       arr[counter] = arr[index];
       arr[index] = temp;
   }
   return arr;
};

const grid = Array(cellsVertical) // the outer array has the number of rows
.fill(null)
.map(() => Array(cellsHorizontal).fill(false)); // the inner array has the number of columns 

const verticals = Array(cellsVertical)
.fill(null)
.map(() => Array(cellsHorizontal- 1).fill(false));

const horizontals = Array(cellsVertical-1)
.fill(null)
.map(() => Array(cellsHorizontal).fill(false));

const startRow = Math.floor(Math.random() * cellsVertical);
const startColumn = Math.floor(Math.random() * cellsHorizontal);

const stepThroughCell = (row, column) => {
// If we have visited a cell at [row][column], then return
if (grid[row][column]){
    return;
}
//Mark this cell as being visited
grid[row][column] = true;
//Assemble randomly-ordered list of neighbours
const neighbours = shuffle ([
     [row -1, column, 'up'],
     [row, column+1, 'right'],
     [row+1, column, 'down'],
     [row, column - 1, 'left']
]); 


//For each neighbour... iteration 
for (let neighbour of neighbours) {
    const [nextRow, nextColumn, direction] = neighbour;

//Check corner cells, see if the neighbour is our of bounds
 
 if (nextRow < 0 ||nextRow >= cellsVertical ||nextColumn < 0 ||nextColumn >= cellsHorizontal) {
    continue;
  }
//If we have visited that neighbour , continue to next neighbour
 if (grid[nextRow][nextColumn]){
    continue;
 }

//Remove a wall from either horizontals or verticals, ei update array, if we go up or down, we 
//cross horizontal lines and we need to update horizontals array, if left and right- update verticals
 if (direction ==='left'){
    verticals[row][column - 1] = true;
 } else if (direction ==='right'){
    verticals[row][column] = true;
 } else if (direction ==='up'){
     horizontals[row-1][column] = true;
 } else if(direction==='down') {
     horizontals[row][column] = true;
 }
//recursion 
 stepThroughCell(nextRow, nextColumn);
}

//Visit that next cell
};


stepThroughCell(startRow, startColumn);
//Iterate through all horizontals and verticals and draw a line for each line that is false. 
horizontals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) =>{
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
            columnIndex * unitLenghtX + unitLenghtX/2, 
            rowIndex * unitLenghtY +unitLenghtY,
            unitLenghtX,
            5,
            {
                label: 'wall',
                isStatic: true,
                render: {
                    fillStyle: 'red'
                }
            }
        );
        World.add(world, wall);
    });
});

verticals.forEach((row, rowIndex) => {
    row.forEach((open, columnIndex) => {
        if (open) {
            return;
        }

        const wall = Bodies.rectangle(
           columnIndex * unitLenghtX + unitLenghtX,
           rowIndex * unitLenghtY + unitLenghtY/2,
           5,
           unitLenghtY, 
           { 
               label: 'wall',
               isStatic:true,
               render: {
                fillStyle: 'red'
            }
           }
        );
        World.add(world,wall);
    });
});
//Goal 

const goal = Bodies.rectangle(
    width -unitLenghtX/2,
    height -unitLenghtY/2,
    unitLenghtX * 0.7, //size of the goal scales according to the cell size/unit lenght
    unitLenghtY * 0.7, 
    { 
        label: 'goal',
        isStatic: true,
        render: {
            fillStyle: 'green'
        }
    }
);
World.add(world, goal);

//Ball 

const ballRadius = Math.min(unitLenghtX, unitLenghtY) /4;
const ball = Bodies.circle(
    unitLenghtX/2,
    unitLenghtY/2,
    ballRadius,
    {
        label: 'ball',
        render: {
            fillStyle: 'blue'
        }
    }
);
World.add(world, ball);

document.addEventListener('keydown', event => {
    const {x, y} = ball.velocity;
    
     if (event.keyCode ===38){
          Body.setVelocity(ball, {x, y: y - 5}); //negative velocity, as we want the ball to move up
      }
    if (event.keyCode === 39) {
        Body.setVelocity(ball, {x: x + 5, y}); //right
    }
     if (event.keyCode === 40) {
        Body.setVelocity(ball, {x, y: y + 5}); // down
     }

    if (event.keyCode === 37) {
        Body.setVelocity(ball, {x: x - 5, y}); // left
   }


 });

 // Win condition -detect a collision between 2 objects

 Events.on(engine, 'collisionStart', event => {
    event.pairs.forEach(collision => {
      const labels = ['ball', 'goal'];
  
      if (
        labels.includes(collision.bodyA.label) &&
        labels.includes(collision.bodyB.label)
      ) {
        document.querySelector('.winner').classList.remove('hidden');
        world.gravity.y = 1;
        world.bodies.forEach(body => {
          if (body.label === 'wall') {
            Body.setStatic(body, false);
          }
        });
      }
    });
  });