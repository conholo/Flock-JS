import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import { GUI } from './vendor/dat.gui.module.js';
import Stats from './vendor/stats.module.js'

let controls, camera, scene, renderer, group, clock, stats;
let particleSimulationElement;

const behaviorParameters = {
    alignmentWeight: 1,
    avoidanceWeight: 0.5,
    cohesionWeight: 0.5,
    stayInRadiusWeight: 3
}

const generalParameters = {
    maxSpeed: 5,
    neighborRadius: 50,
    maxForce: 1,
    flyRadius: 850,
    defaultColor: new THREE.Color('cyan'),
    neighborHeavyColor: new THREE.Color('red')
}

const particleCount = 600;
const cubeScale = 1500;

let flock;

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

class Agent extends THREE.Mesh {
    constructor(perceptionRadius, maxSpeed, maxForce, flyRadius) {
        super(new THREE.SphereGeometry(7, 32, 32),
            new THREE.PointsMaterial(
                {
                    color: 0xffffff,
                    blending: THREE.AdditiveBlending,
                    transparent: true
                }));
        this.velocity = this.getRandomVelocity(randomIntFromInterval(2, 4));
        this.acceleration = new THREE.Vector3();
        this.perceptionRadius = perceptionRadius;
        this.maxSpeed = maxSpeed;
        this.maxForce = maxForce;
        this.flyRadius = flyRadius;
        this.neighborCount = 0;
    }

    getRandomVelocity(magnitude) {
        let randomTheta = randomIntFromInterval(0, 360);

        return new THREE.Vector3(magnitude * Math.cos(randomTheta), magnitude * Math.sin(randomTheta), magnitude * Math.cos(randomTheta));
    }

    calculateFlock(agents, alignWeight, cohesionWeight, separationWeight, radiusWeight) {

        this.neighborCount = 0;
        let alignment = this.alignment(agents).multiplyScalar(alignWeight);
        let cohesion = this.cohesion(agents).multiplyScalar(cohesionWeight);
        let separation = this.separation(agents).multiplyScalar(separationWeight);
        let stayInRadius = this.stayInRadius().multiplyScalar(radiusWeight);

        this.acceleration.add(alignment);
        this.acceleration.add(cohesion);
        this.acceleration.add(separation);
        this.acceleration.add(stayInRadius);

        let average = this.neighborCount / 3;
        let percent = average / 6;
        let color = new THREE.Color();
        color = color.lerpColors(generalParameters.defaultColor, generalParameters.neighborHeavyColor, percent);
        this.material.color = color;
    }

    move() {
        this.position.add(this.velocity);
        this.velocity.add(this.acceleration);
        this.velocity.clampScalar(-this.maxSpeed, this.maxSpeed);
        this.acceleration.multiplyScalar(0);
    }

    setMaxSpeed(value) {
        this.maxSpeed = value;
    }

    setNeighborRadius(value) {
        this.perceptionRadius = value;
    }

    setMaxForce(value) {
        this.maxForce = value;
    }

    setFlyRadius(value) {
        this.flyRadius = value;
    }

    alignment(agents) {

        let steering = new THREE.Vector3();
        let total = 0;

        for (let agent of agents) {
            if (agent === this)
                continue;

            let distance = this.position.distanceTo(agent.position);

            if (distance > this.perceptionRadius) continue;

            this.neighborCount++;
            steering.add(agent.velocity);
            total++;
        }

        if (total <= 0) return steering;

        steering.divideScalar(total);
        steering.setLength(this.maxSpeed);
        steering.sub(this.velocity);
        steering.clampScalar(-this.maxForce, this.maxForce);

        return steering;
    }

    separation(agents) {

        let steering = new THREE.Vector3();
        let total = 0;

        for (let agent of agents) {

            if (agent === this) continue;

            let distance = this.position.distanceTo(agent.position);

            if (distance > this.perceptionRadius) continue;

            this.neighborCount++;
            let difference = new THREE.Vector3();
            difference.subVectors(this.position, agent.position);

            difference.divideScalar(distance * distance);
            steering.add(difference);
            total++;
        }

        if(total <= 0) return steering;

        steering.divideScalar(total);
        steering.setLength(this.maxSpeed);
        steering.sub(this.velocity);
        steering.clampScalar(-this.maxForce, this.maxForce);

        return steering;
    }

    cohesion(agents) {

        let steering = new THREE.Vector3();
        let total = 0;

        for (let agent of agents) {
            if (agent === this) continue;

            let distance = this.position.distanceTo(agent.position);

            if (distance > this.perceptionRadius) continue;

            this.neighborCount++;
            steering.add(agent.position);
            total++;
        }

        if(total <= 0) return steering;

        steering.divideScalar(total);
        steering.sub(this.position);
        steering.setLength(this.maxSpeed);
        steering.sub(this.velocity);
        steering.clampScalar(-this.maxForce, this.maxForce);

        return steering;
    }

    stayInRadius() {
        let centerOffset = new THREE.Vector3(-1, -1, -1);
        centerOffset.multiply(this.position);

        let percent = centerOffset.length() / this.flyRadius;

        if(percent < 0.9)
            return new THREE.Vector3();

        return centerOffset.multiplyScalar(percent * percent).normalize();
    }
}


class Flock {
    constructor(agentCount, maxSpeed, neighborRadius, maxForce, flyRadius) {
        this.agentCount = agentCount;
        this.maxSpeed = maxSpeed;
        this.neighborRadius = neighborRadius;
        this.maxForce = maxForce;
        this.flyRadius = flyRadius;

        this.agents = [];
    }

    constructAgents(boundsScale) {
        for(let i = 0; i < this.agentCount; i++) {
            const x = Math.random() * boundsScale - boundsScale / 2;
            const y = Math.random() * boundsScale - boundsScale / 2;
            const z = Math.random() * boundsScale - boundsScale / 2;

            let position = new THREE.Vector3(x, y, z);

            const agent = new Agent(generalParameters.neighborRadius, this.maxSpeed, this.maxForce, this.flyRadius);
            agent.translateX(position.x);
            agent.translateY(position.y);
            agent.translateZ(position.z);

            this.agents.push(agent);
        }

    }

    updateBoids(alignmentValue, cohesionValue, separationValue, radiusWeight) {
        for(let boid of this.agents) {

            boid.calculateFlock(this.agents, alignmentValue, cohesionValue, separationValue, radiusWeight);
            boid.move();
        }
    }

    setMaxSpeed(value) {
        this.maxspeed = value;
        for(let boid of this.agents) {
            boid.setMaxSpeed(value);
        }
    }

    setNeighborRadius(value) {
        this.neighborRadius = value;
        for(let boid of this.agents) {
            boid.setNeighborRadius(value);
        }
    }

    setMaxForce(value) {
        this.maxForce = value;
        for(let boid of this.agents) {
            boid.setMaxForce(value);
        }
    }

    setFlyRadius(value) {
        this.flyRadius = value;
        for(let boid of this.agents) {
            boid.setFlyRadius(value);
        }
    }
}
class ColorGUIHelper {
    constructor(object, prop) {
        this.object = object;
        this.prop = prop;
    }
    get value() {
        return `#${this.object[this.prop].getHexString()}`;
    }
    set value(hexString) {
        this.object[this.prop].set(hexString);
    }
}



initialize();
animate();

function initialize(){
    clock = new THREE.Clock();
    const aspect = (window.innerWidth ) / (window.innerHeight - 100);
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 8000);
    camera.position.z = 3000;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    group = new THREE.Group();
    scene.add(group);


    const transparentCube = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(cubeScale, cubeScale, cubeScale)));
    transparentCube.material.color.setHex(0x101010);
    transparentCube.material.blending = THREE.AdditiveBlending;
    transparentCube.material.transparent = true;
    group.add(transparentCube);

    flock = new Flock(particleCount, generalParameters.maxSpeed, generalParameters.neighborRadius, generalParameters.maxForce, generalParameters.flyRadius);

    flock.constructAgents(cubeScale);

    for(let i = 0; i < flock.agents.length; i++) {
        group.add(flock.agents[i]);
    }

    particleSimulationElement = document.getElementById("flock-sim-parent");

    renderer = new THREE.WebGLRenderer( {antialias: true} );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight - 100);
    renderer.outputEncoding = THREE.sRGBEncoding;


    particleSimulationElement.appendChild(renderer.domElement);

    window.addEventListener('resize', onWindowResize);
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    initGui();
    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '10%';
    stats.domElement.style.left = '80%';
    particleSimulationElement.appendChild(stats.dom);
}

function initGui() {
    const gui = new GUI({autoPlace: false});
    gui.domElement.id = 'gui';
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '20%';
    gui.domElement.style.left = '80%';
    particleSimulationElement.appendChild(gui.domElement);

    let behaviorControlsFolder = gui.addFolder("Behavior Controls");
    let generalParametersFolder = gui.addFolder("General Parameters");


    behaviorControlsFolder.add(behaviorParameters, "alignmentWeight", 0, 1)
        .name("Alignment Weight")
        .onChange(function(value) {
            behaviorParameters["alignmentWeight"] = value;
        });
    behaviorControlsFolder.add(behaviorParameters, "avoidanceWeight", 0, 1)
        .name("Avoidance Weight")
        .onChange(function(value) {
            behaviorParameters["avoidanceWeight"] = value;
        });
    behaviorControlsFolder.add(behaviorParameters, "cohesionWeight", 0, 1)
        .name("Cohesion Weight")
        .onChange(function(value) {
            behaviorParameters["cohesionWeight"] = value;
        });
    behaviorControlsFolder.add(behaviorParameters, "stayInRadiusWeight", 0, 5)
        .name("Stay in Radius Weight")
        .onChange(function(value) {
            behaviorParameters["stayInRadiusWeight"] = value;
        });


    generalParametersFolder.add(generalParameters, "neighborRadius", 10, 100)
        .name("Neighbor Radius")
        .onChange(function(value){
            flock.setNeighborRadius(value);
        });

    generalParametersFolder.add(generalParameters, "maxSpeed", 1, 100)
        .name("Max Speed")
        .onChange(function(value) {
            flock.setMaxSpeed(value);
        });
    generalParametersFolder.add(generalParameters, "maxForce", 1, 5)
        .name("Max Force")
        .onChange(function(value) {
            flock.setMaxForce(value);
        });
    generalParametersFolder.add(generalParameters, "flyRadius", 5, 1000)
        .name("Fly Radius")
        .onChange(function(value) {
            flock.setFlyRadius(value);
        });


    generalParametersFolder.addColor(new ColorGUIHelper(generalParameters,'defaultColor'),'value')
        .name("Scattered Color");

    generalParametersFolder.addColor(new ColorGUIHelper(generalParameters,'neighborHeavyColor'),'value')
        .name("Dense Color");
}

function onWindowResize() {
    camera.aspect = (window.innerWidth) / (window.innerHeight - 100);
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight - 100 );
}

function animate() {

    flock.updateBoids(behaviorParameters.alignmentWeight, behaviorParameters.cohesionWeight, behaviorParameters.avoidanceWeight, behaviorParameters.stayInRadiusWeight)

    requestAnimationFrame(animate);
    controls.update();
    render();
    stats.update();
}

function render(){
    renderer.render(scene, camera);
}

