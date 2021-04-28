import * as THREE from './vendor/three.module.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import { GUI } from './vendor/dat.gui.module.js';
import Stats from './vendor/stats.module.js'

let controls, camera, scene, renderer, group, clock, stats;
let particleSimulationElement;

const behaviorParameters = {
    alignmentWeight: 1,
    avoidanceWeight: 1,
    cohesionWeight: 0.5,
    stayInRadiusWeight: 1
}

const generalParameters = {
    maxSpeed: 20,
    avoidanceMultiplier: 0.5,
    neighborRadius: 50,
    driveFactor: 1,
    particleSpeed: 75,
    defaultColor: new THREE.Color('white'),
    neighborHeavyColor: new THREE.Color('red')
}

const particleCount = 1000;
const cubeScale = 1500;
const behaviors = [];

let flock;

class Agent extends THREE.Mesh{
    constructor(flock){
        super(new THREE.SphereGeometry(5, 32, 32),
            new THREE.PointsMaterial(
                {
                    color: 0xffffff,
                    blending: THREE.AdditiveBlending,
                    transparent: true
                }));
        this.flock = flock;
    }

    move(velocity, deltaTime) {
        this.up = velocity.normalize();
        let scaledVelocity = velocity.multiplyScalar(generalParameters.particleSpeed * deltaTime);
        this.position.add(scaledVelocity);
    }
}


class Flock {
    constructor(agentCount, driveFactor, maxSpeed, neighborRadius, avoidanceRadiusMultiplier) {
        this.agentCount = agentCount;
        this.driveFactor = driveFactor;
        this.maxSpeed = maxSpeed;
        this.neighborRadius = neighborRadius;
        this.avoidanceRadiusMultiplier = avoidanceRadiusMultiplier;

        this.squareMaxSpeed = this.maxSpeed * this.maxSpeed;
        this.squareNeighborRadius = this.neighborRadius * this.neighborRadius;
        this.squareAvoidanceRadius = this.squareNeighborRadius * this.avoidanceRadiusMultiplier * this.avoidanceRadiusMultiplier;
        this.agents = [];
    }

    constructAgents(boundsScale) {
        for(let i = 0; i < this.agentCount; i++) {
            const x = Math.random() * boundsScale - boundsScale / 2;
            const y = Math.random() * boundsScale - boundsScale / 2;
            const z = Math.random() * boundsScale - boundsScale / 2;

            let position = new THREE.Vector3(x, y, z);

            let randomX = Math.floor(Math.random() * (1 - -1 + 1)) + -1;
            let randomY = Math.floor(Math.random() * (1 - -1 + 1)) + -1;
            let randomZ = Math.floor(Math.random() * (1 - -1 + 1)) + -1;


            const agent = new Agent(this);
            agent.up = new THREE.Vector3(randomX,randomY,randomZ);
            agent.translateX(position.x);
            agent.translateY(position.y);
            agent.translateZ(position.z);


            this.agents.push(agent);
        }
    }

    setMaxSpeed(value) {
        this.maxspeed = value;
        this.squareMaxSpeed = this.maxspeed * this.maxspeed;
    }

    setNeighborRadius(value) {
        this.neighborRadius = value;
        this.squareNeighborRadius = this.neighborRadius * this.neighborRadius;
    }

    setDriveFactor(value) {
        this.driveFactor = value;
    }

    setAvoidanceRadiusMultiplier(value) {
        this.avoidanceRadiusMultiplier = value;
        this.squareAvoidanceRadius = this.squareNeighborRadius * this.avoidanceRadiusMultiplier * this.avoidanceRadiusMultiplier;
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

function alignmentBehavior(agent, flock, context) {
    if(context.length === 0){
        return agent.up;
    }

    let alignmentMove = new THREE.Vector3();

    for(let i = 0; i < context.length; i++){
        alignmentMove.add(agent.up);
    }

    alignmentMove.divideScalar(context.length);

    return alignmentMove;
}

function avoidanceBehavior(agent, flock, context) {
    if(context.length === 0)
        return new THREE.Vector3();

    let avoidanceMove = new THREE.Vector3();
    let avoidCount = 0;

    for(let i = 0; i < context.length; i++){

        let difference = new THREE.Vector3();
        difference.subVectors(agent.position, context[i].position);

        if(difference.lengthSq() < flock.squareAvoidanceRadius){
            avoidanceMove.add(difference);
            avoidCount++;
        }

    }

    if(avoidCount > 0)
        avoidanceMove.divideScalar(avoidCount);

    return avoidanceMove;
}

function cohesionBehavior(agent, flock, context){
    if(context.length === 0)
        return new THREE.Vector3();

    let cohesionMove = new THREE.Vector3();

    for(let i = 0; i < context.length; i++){
        cohesionMove.add(context[i].position);
    }

    cohesionMove.divideScalar(context.length);

    cohesionMove.sub(agent.position);
    return cohesionMove;
}

function stayInRadiusBehavior(agent, flock, context) {
    let center = new THREE.Vector3();
    let centerOffset = center.subVectors(center, agent.position);
    let squared = centerOffset.length();
    let t = squared / (cubeScale / 2);

    if ( t < 0.9){
        return new THREE.Vector3();
    }

    return centerOffset.multiplyScalar(t * t);
}

function combineBehaviors(behaviors, weights, agent, context, flock) {

    if(weights.length !== behaviors.length)
        return new THREE.Vector3();

    let moveVector = new THREE.Vector3();

    for(let i = 0; i < behaviors.length; i++){
        let behaviorMove = behaviors[i](agent, flock, context).multiplyScalar(weights[i]);

        if(behaviorMove === new THREE.Vector3()) continue;

        if(behaviorMove.lengthSq() > weights[i] * weights[i]){
            behaviorMove.normalize();
            behaviorMove.multiplyScalar(weights[i]);
        }

        moveVector.add(behaviorMove);
    }

    return moveVector;
}


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

    flock = new Flock(particleCount, generalParameters.driveFactor, generalParameters.maxSpeed, generalParameters.neighborRadius, generalParameters.avoidanceMultiplier);

    flock.constructAgents(cubeScale);

    for(let i = 0; i < flock.agents.length; i++) {
        group.add(flock.agents[i]);
    }

    behaviors.push(alignmentBehavior);
    behaviors.push(avoidanceBehavior);
    behaviors.push(cohesionBehavior);
    behaviors.push(stayInRadiusBehavior);

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


    behaviorControlsFolder.add(behaviorParameters, "alignmentWeight", 0, 10)
        .name("Alignment Weight")
        .onChange(function(value) {
            behaviorParameters["alignmentWeight"] = value;
        });
    behaviorControlsFolder.add(behaviorParameters, "avoidanceWeight", 0, 2)
        .name("Avoidance Weight")
        .onChange(function(value) {
            behaviorParameters["avoidanceWeight"] = value;
        });
    behaviorControlsFolder.add(behaviorParameters, "cohesionWeight", 0, 2)
        .name("Cohesion Weight")
        .onChange(function(value) {
            behaviorParameters["cohesionWeight"] = value;
        });
    behaviorControlsFolder.add(behaviorParameters, "stayInRadiusWeight", 0, 2)
        .name("Stay in Radius Weight")
        .onChange(function(value) {
            behaviorParameters["stayInRadiusWeight"] = value;
        });


    generalParametersFolder.add(generalParameters, "driveFactor", .1, 10)
        .name("Drive Factor")
        .onChange(function(value){
            flock.setDriveFactor(value);
        });
    generalParametersFolder.add(generalParameters, "avoidanceMultiplier", 0, 2)
        .name("Avoidance Multiplier")
        .onChange(function(value){
            flock.setAvoidanceRadiusMultiplier(value);
        });
    generalParametersFolder.add(generalParameters, "neighborRadius", 10, 100)
        .name("Neighbor Radius")
        .onChange(function(value){
            flock.setNeighborRadius(value);
        });

    generalParametersFolder.add(generalParameters, "particleSpeed", 10, 300)
        .name("Particle Speed");


    generalParametersFolder.addColor(new ColorGUIHelper(generalParameters,'defaultColor'),'value')
        .name("Start Color");

    generalParametersFolder.addColor(new ColorGUIHelper(generalParameters,'neighborHeavyColor'),'value')
        .name("Neighbor Dense Color");
}

function onWindowResize() {
    camera.aspect = (window.innerWidth) / (window.innerHeight - 100);
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight - 100 );
}

function getNearbyAgents(agent) {
    let center = agent.position;
    let neighbors = [];

    for(let i = 0; i < particleCount; i++) {
        if(agent === flock.agents[i]) continue;

        let otherPosition = flock.agents[i].position;

        let distance =
            ((otherPosition.x - center.x) * (otherPosition.x - center.x) +
            (otherPosition.y - center.y) * (otherPosition.y - center.y) +
            (otherPosition.z - center.z) * (otherPosition.z - center.z));

        if (distance < flock.neighborRadius * flock.neighborRadius)
            neighbors.push(flock.agents[i]);
    }

    return neighbors;
}

function animate() {

    const deltaTime = Math.min(0.1, clock.getDelta());

    for(let i = 0; i < flock.agents.length; i++) {
        let neighbors = getNearbyAgents(flock.agents[i]);
        let weights = Object.values(behaviorParameters);
        let moveVector = combineBehaviors(behaviors, weights, flock.agents[i], neighbors, flock);

        let percent = neighbors.length / 20;
        let color = new THREE.Color();
        color = color.lerpColors(generalParameters.defaultColor, generalParameters.neighborHeavyColor, percent);
        flock.agents[i].material.color = color;
        moveVector.multiplyScalar(flock.driveFactor);

        if(moveVector.lengthSq() > flock.squareMaxSpeed){
            moveVector.normalize();
            moveVector.multiplyScalar(flock.maxSpeed);
        }

        flock.agents[i].move(moveVector, deltaTime);
    }


    requestAnimationFrame(animate);
    controls.update();
    render();
    stats.update();
}

function render(){
    renderer.render(scene, camera);
}

