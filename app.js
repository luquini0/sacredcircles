const canvas = document.querySelector("#webgl")

const scene = new THREE.Scene()



const camera = new THREE.PerspectiveCamera(
50,
window.innerWidth / window.innerHeight,
0.1,
100
)

camera.position.set(0,0,7)



const renderer = new THREE.WebGLRenderer({
canvas:canvas,
alpha:true,
antialias:true
})

renderer.setSize(window.innerWidth, window.innerHeight)

renderer.setPixelRatio(Math.min(window.devicePixelRatio,2))

renderer.outputEncoding = THREE.sRGBEncoding



/* LIGHTING */

const keyLight = new THREE.DirectionalLight(0xffffff,1.4)
keyLight.position.set(3,3,3)
scene.add(keyLight)

const fillLight = new THREE.DirectionalLight(0xd3ac6e,0.6)
fillLight.position.set(-3,1,-2)
scene.add(fillLight)

const rimLight = new THREE.DirectionalLight(0xf3ede0,0.5)
rimLight.position.set(0,-2,-3)
scene.add(rimLight)

const ambient = new THREE.AmbientLight(0xffffff,0.55)
scene.add(ambient)



/* SACRED CIRCLES MODEL — armillary of interlocking gold rings around a faceted core */

const model = new THREE.Group()

const goldMaterial = new THREE.MeshStandardMaterial({
color:0xd3ac6e,
metalness:0.85,
roughness:0.28,
emissive:0x3a2a12,
emissiveIntensity:0.15
})

const deepGoldMaterial = new THREE.MeshStandardMaterial({
color:0xa9824c,
metalness:0.9,
roughness:0.32
})

const ringDefs = [
{ radius:1.35, tube:0.028, rotX:0,               rotY:0,              rotZ:0.15 },
{ radius:1.2,  tube:0.024, rotX:Math.PI/2.4,     rotY:0.3,            rotZ:0 },
{ radius:1.05, tube:0.02,  rotX:Math.PI/1.7,     rotY:-0.5,           rotZ:0.4 },
{ radius:0.9,  tube:0.018, rotX:Math.PI/3.1,     rotY:1.1,            rotZ:-0.3 },
]

const rings = []

ringDefs.forEach((def)=>{

const geo = new THREE.TorusGeometry(def.radius, def.tube, 24, 96)
const ring = new THREE.Mesh(geo, goldMaterial)

ring.rotation.x = def.rotX
ring.rotation.y = def.rotY
ring.rotation.z = def.rotZ

model.add(ring)
rings.push(ring)

})

/* faceted core gem */

const coreGeo = new THREE.IcosahedronGeometry(0.46, 0)
const core = new THREE.Mesh(coreGeo, deepGoldMaterial)
model.add(core)

/* fine wireframe halo just outside the core, echoes mandala linework */

const haloGeo = new THREE.IcosahedronGeometry(0.62, 1)
const haloMat = new THREE.MeshBasicMaterial({
color:0xf3ede0,
wireframe:true,
transparent:true,
opacity:0.22
})
const halo = new THREE.Mesh(haloGeo, haloMat)
model.add(halo)

scene.add(model)



/* DISTANT BACKGROUND RINGS — big, faint, slow — pure atmosphere/depth */

const farRingMat = new THREE.MeshBasicMaterial({
color:0xd3ac6e,
transparent:true,
opacity:0.09
})

const farRing1 = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.012, 8, 128), farRingMat)
farRing1.rotation.x = Math.PI/2.6
farRing1.position.z = -3.5
scene.add(farRing1)

const farRing2 = new THREE.Mesh(new THREE.TorusGeometry(5.6, 0.008, 8, 128), farRingMat)
farRing2.rotation.x = Math.PI/1.8
farRing2.rotation.y = 0.6
farRing2.position.z = -4.5
scene.add(farRing2)

const farRing3 = new THREE.Mesh(new THREE.TorusGeometry(3.2, 0.01, 8, 128), farRingMat)
farRing3.rotation.x = Math.PI/2
farRing3.rotation.y = -0.8
farRing3.position.z = -2.6
scene.add(farRing3)



/* PARTICLE FIELD — slow-drifting gold dust for depth */

const particleCount = 420
const particlePositions = new Float32Array(particleCount * 3)

for(let i=0;i<particleCount;i++){

const radius = 3.5 + Math.random() * 9
const theta = Math.random() * Math.PI * 2
const phi = Math.acos((Math.random() * 2) - 1)

particlePositions[i*3]   = radius * Math.sin(phi) * Math.cos(theta)
particlePositions[i*3+1] = radius * Math.sin(phi) * Math.sin(theta)
particlePositions[i*3+2] = (radius * Math.cos(phi)) - 3

}

const particleGeo = new THREE.BufferGeometry()
particleGeo.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3))

const particleMat = new THREE.PointsMaterial({
color:0xd3ac6e,
size:0.028,
transparent:true,
opacity:0.55,
depthWrite:false,
blending:THREE.AdditiveBlending
})

const particles = new THREE.Points(particleGeo, particleMat)
scene.add(particles)



/* LOADER OUT */

document.getElementById("loader").style.display = "none"



/* INTERACTION
   — moving the mouse over open background: the camera drifts slightly (parallax), automatic.
   — click-dragging near the object: rotates the object itself, like before.
   — everything else (particles, far rings, core/halo detail spin, background drift) keeps
     animating on its own regardless of what the user does. */

let mouseTargetX = 0
let mouseTargetY = 0

let isDraggingModel = false
let dragLastX = 0
let dragLastY = 0

let autoRotY = 0
let manualRotY = 0
let manualRotX = 0

const HIT_RADIUS = 230

function projectToScreen(vec3){

const v = vec3.clone()
v.project(camera)

return {
x: (v.x * 0.5 + 0.5) * window.innerWidth,
y: (-v.y * 0.5 + 0.5) * window.innerHeight
}

}

const modelOrigin = new THREE.Vector3(0,0,0)

window.addEventListener("mousemove", (e)=>{

mouseTargetX = (e.clientX / window.innerWidth - 0.5)
mouseTargetY = (e.clientY / window.innerHeight - 0.5)

})

window.addEventListener("pointerdown", (e)=>{

const screenPos = projectToScreen(modelOrigin)
const dist = Math.hypot(e.clientX - screenPos.x, e.clientY - screenPos.y)

if(dist <= HIT_RADIUS){
isDraggingModel = true
dragLastX = e.clientX
dragLastY = e.clientY
}

})

window.addEventListener("pointermove", (e)=>{

if(!isDraggingModel) return

const deltaX = e.clientX - dragLastX
const deltaY = e.clientY - dragLastY

dragLastX = e.clientX
dragLastY = e.clientY

manualRotY += deltaX * 0.006
manualRotX += deltaY * 0.006

manualRotX = Math.max(-0.8, Math.min(0.8, manualRotX))

})

window.addEventListener("pointerup", ()=>{ isDraggingModel = false })
window.addEventListener("pointercancel", ()=>{ isDraggingModel = false })
window.addEventListener("pointerleave", ()=>{ isDraggingModel = false })



/* RENDER */

const clock = new THREE.Clock()

let lastFrameTime = clock.getElapsedTime()

function animate(){

requestAnimationFrame(animate)

const t = clock.getElapsedTime()
const dt = t - lastFrameTime
lastFrameTime = t

if(!isDraggingModel){
autoRotY += dt * 0.18
}

model.rotation.y = autoRotY + manualRotY
model.rotation.x = manualRotX

core.rotation.y = -t * 0.4
core.rotation.x = t * 0.15
halo.rotation.y = -t * 0.25
halo.rotation.x = t * 0.1

rings.forEach((ring,i)=>{
ring.rotation.z += 0.0009 * (i % 2 === 0 ? 1 : -1)
})

farRing1.rotation.z = t * 0.03
farRing2.rotation.z = -t * 0.02
farRing3.rotation.z = t * 0.025

particles.rotation.y = t * 0.015
particles.rotation.x = Math.sin(t * 0.1) * 0.05

if(!isDraggingModel){

const targetCamX = mouseTargetX * 1.1
const targetCamY = -mouseTargetY * 0.7

camera.position.x += (targetCamX - camera.position.x) * 0.03
camera.position.y += (targetCamY - camera.position.y) * 0.03
camera.lookAt(0,0,0)

}

renderer.render(scene,camera)

}

animate()



/* RESPONSIVE */

window.addEventListener("resize",()=>{

const width = window.innerWidth
const height = window.innerHeight

camera.aspect = width/height
camera.updateProjectionMatrix()

renderer.setSize(width,height)

})
