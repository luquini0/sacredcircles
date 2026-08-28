const canvas = document.querySelector("#webgl")

const scene = new THREE.Scene()



const camera = new THREE.PerspectiveCamera(
45,
canvas.clientWidth / canvas.clientHeight,
0.1,
100
)

camera.position.set(0,0,5)



const renderer = new THREE.WebGLRenderer({
canvas:canvas,
alpha:true,
antialias:true
})

renderer.setSize(canvas.clientWidth,canvas.clientHeight)

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



/* CONTROLS */

const controls = new THREE.OrbitControls(camera,renderer.domElement)

controls.enablePan=false
controls.enableZoom=false

controls.enableDamping=true
controls.dampingFactor=0.08



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

model.scale.set(1,1,1)
scene.add(model)

document.getElementById("loader").style.display="none"

const clock = new THREE.Clock()

animate()



/* RENDER */

function animate(){

requestAnimationFrame(animate)

const t = clock.getElapsedTime()

model.rotation.y = t * 0.18
core.rotation.y = -t * 0.4
core.rotation.x = t * 0.15
halo.rotation.y = -t * 0.25
halo.rotation.x = t * 0.1

rings.forEach((ring,i)=>{
ring.rotation.z += 0.0009 * (i % 2 === 0 ? 1 : -1)
})

controls.update()

renderer.render(scene,camera)

}



/* RESPONSIVE */

window.addEventListener("resize",()=>{

const width = canvas.clientWidth
const height = canvas.clientHeight

camera.aspect = width/height
camera.updateProjectionMatrix()

renderer.setSize(width,height)

})



/* BACKGROUND PARALLAX */

const background = document.querySelector(".background-layer")

document.addEventListener("mousemove", (e)=>{

const x = (e.clientX / window.innerWidth - 0.5)
const y = (e.clientY / window.innerHeight - 0.5)

const moveX = x * 40
const moveY = y * 40

background.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.05)`

})
