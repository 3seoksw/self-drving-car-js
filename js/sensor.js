class Sensor {
    constructor(car) {
        this.car = car
        this.rayCount = 5
        this.rayLength = 150
        this.raySpread = Math.PI / 2

        this.rays = []
        this.readings = []

        this.front = []
    }

    #castRays() {
        this.rays = []

        for (let i = 0; i < this.rayCount; i++) {
            const rayAngle = lerp(
                this.raySpread / 2, 
                -this.raySpread / 2, 
                this.rayCount == 1 ? 0.5 : i / (this.rayCount - 1)
            ) + this.car.angle
            const start = {x: this.car.x, y: this.car.y}
            const end = {
                x: this.car.x - Math.sin(rayAngle) * this.rayLength,
                y: this.car.y - Math.cos(rayAngle) * this.rayLength
            }
            this.rays.push([start, end])
        }
    }
    
    #getReading(ray, roadBorders, traffic) {
        let touches = []

        for (let i = 0; i < roadBorders.length; i++) {
            const touch = getIntersection(
                ray[0], // ray.start
                ray[1], // ray.end
                roadBorders[i][0], // border.start
                roadBorders[i][1] // border.end
            )

            if (touch) {
                touches.push(touch)
            }
        }

        for (let i = 0; i < traffic.length; i++) {
            for (let j = 0; j < traffic[i].polygon.length; j++) {
                const touch = getIntersection(
                    ray[0],
                    ray[1],
                    traffic[i].polygon[j],
                    traffic[i].polygon[(j + 1) % traffic[i].polygon.length]
                )

                if (touch) {
                    touches.push(touch)
                }
            }
        }

        if (touches.length == 0) {
            return null
        }
        else { 
            const offsets = touches.map(e => e.offset) // array of "touches.offset"
            const minOffset = Math.min(...offsets)
            return touches.find(e => e.offset == minOffset)
        } // TODO: Try to understand the above code
    }

    #readFront() {
        this.front = []

        const rad = Math.hypot(this.car.width, this.car.height) / 2
        const theta = Math.atan2(this.car.width, this.car.height)

        const start = [
            this.car.x - Math.sin(this.car.angle + theta) * rad,
            this.car.y - Math.cos(this.car.angle + theta)* rad
        ]

        const end = [
            this.car.x - Math.sin(this.car.angle - theta) * rad,
            this.car.y - Math.cos(this.car.angle - theta)* rad
        ]

        this.front = [start, end]
    }

    #detectLanes(lanes) {
        let violates = []

        for (let i = 0; i < lanes.length; i++) {
            const violate = getIntersection(
                this.front[0],
                this.front[1],
                lanes[i][0],
                lanes[i][1]
            )

            if (violate) {
                violates.push(violate)
            }
        }
    }

    update(roadBorders, traffic, lanes = 3) {
        this.#castRays()
        this.readings = []
        this.#readFront()
        this.detecting = []

        for (let i = 0; i < this.rays.length; i++) {
            this.readings.push(this.#getReading(this.rays[i], roadBorders, traffic))
        }

        this.detecting.push(this.#detectLanes(lanes))
    }

    draw(ctx) {
        for (let i = 0; i < this.rayCount; i++) {
            let end = this.rays[i][1]
            if (this.readings[i]) {
                end = this.readings[i]
            }

            ctx.beginPath() 
            ctx.lineWidth = 2
            ctx.strokeStyle = "yellow"
            ctx.moveTo(this.rays[i][0].x, this.rays[i][0].y)
            ctx.lineTo(end.x, end.y)
            ctx.stroke()

            ctx.beginPath() 
            ctx.lineWidth = 2
            ctx.strokeStyle = "black"
            ctx.moveTo(this.rays[i][1].x, this.rays[i][1].y)
            ctx.lineTo(end.x, end.y)
            ctx.stroke()
        }
            
        // Front Sensor
        ctx.beginPath()
        ctx.lineWidth = 3
        ctx.strokeStyle = "red"
        ctx.moveTo(this.front[0][0], this.front[0][1])
        ctx.lineTo(this.front[1][0], this.front[1][1])
        ctx.stroke()

        // Violating Lane Point
        ctx.beginPath()
        ctx.fillStyle = "black"
        ctx.fillRect(this.detecting[0], this.detecting[1], 0, 2 * Math.PI)
        ctx.fill()
    }
}
