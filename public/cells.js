
function Cell(r, p, v, colour) {
  this.radius = r
  this.point = p
  this.vector = v
  this.maxVec = 0.2
  this.path = new Path.Circle(this.point, this.radius)
  this.path.fillColor = colour;
  this.path.strokeColor = '#ffffff';
  this.path.stroke = 3;
  if(showVectors){
    this.line = new Path([this.point, this.point]);
    this.line.strokeColor = 'white';
  }
  this.birthdate = Date.now()
  this.isDead = false;
}

Cell.prototype = {
  update: function () {
    // limit velocity
    if (this.vector.length > this.maxVec) this.vector.length = this.maxVec

    // make cells drift to centre
    var distFromCenter = this.point.getDistance(view.center)
    if(distFromCenter > 100) {
      var direc = (this.point - view.center).normalize(0.1)
      this.vector -= direc
    }

    // add vector to point and update path's position accordingly
    this.point += this.vector
    this.path.position = this.point

    // draw vector 'vanes' if showVectors is set
    if(showVectors) {
      this.line.removeSegment(1)
      this.line.addSegment(this.point+this.vector*50)
      this.line.removeSegment(0)
      this.line.addSegment(this.point)
    }

    // when the object gets too old, shrink it and mark it as dead
    if(this.birthdate < Date.now() - 80*1000){
      this.path.scale(0.98)
    }
    if(this.birthdate < Date.now() - 82*1000){
      if(showVectors) this.line.remove();
      this.path.remove();
      this.isDead = true;
    }
  },

  // makes the cells avoid their neighbours
  react: function (b) {
    var dist = this.point.getDistance(b.point)
    if (dist < this.radius + b.radius && dist != 0) {
      var overlap = this.radius + b.radius - dist
      var direction = (this.point - b.point).normalize(overlap * 0.03)
      this.vector += direction
      b.vector -= direction
    }
  },
}

/* main */

var cells = []
var showVectors = true;

var lastTick = 0

function onFrame() {
  for (var i = 0; i < cells.length - 1; i++) {
    for (var j = i + 1; j < cells.length; j++) {
      cells[i].react(cells[j])
    }
  }
  for (var i = 0, l = cells.length; i < l; i++) {
    cells[i].update()
  }

  // code that runs every second
  if (lastTick < Date.now() - 1000) {
    // dead objects from the array
    cells = cells.filter(function (cell) {
      return !cell.isDead
    })

    lastTick = Date.now()
  }
}

// connect to socket and create cells on each transaction event
var socket = io();
socket.on('transaction', function (data) {
  var position = Point.random() * view.size
  var vector = new Point({
    angle: 360 * Math.random(),
    length: Math.random() * 10
  })
  var radius = Math.random() * 50 + 10
  var colour = data.failed ? 'tomato' : 'powderblue';
  cells.push(new Cell(radius, position, vector, colour))
});