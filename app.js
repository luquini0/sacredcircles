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

const keyLight = new THREE.DirectionalLight(0xffffff,1.2)
keyLight.position.set(3,3,3)
scene.add(keyLight)

const fillLight = new THREE.DirectionalLight(0xffffff,0.5)
fillLight.position.set(-3,1,-2)
scene.add(fillLight)

const ambient = new THREE.AmbientLight(0xffffff,0.7)
scene.add(ambient)



/* CONTROLS */

const controls = new THREE.OrbitControls(camera,renderer.domElement)

controls.enablePan=false
controls.enableZoom=false

controls.enableDamping=true
controls.dampingFactor=0.08



/* MODEL */

let model

const loader = new THREE.GLTFLoader()

loader.load(

"models/product.glb",

function(gltf){

model = gltf.scene

model.scale.set(0.9,0.9,0.9)

scene.add(model)

document.getElementById("loader").style.display="none"

animate()

},

undefined,

function(error){

console.error(error)

}

)



/* RENDER */

function animate(){

requestAnimationFrame(animate)

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