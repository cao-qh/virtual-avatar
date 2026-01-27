import * as THREE from "three"

const scene = new THREE.Scene()
const loader = new THREE.CubeTextureLoader().setPath( 'textures/skybox/' );
export const environmentMap = await loader.loadAsync( [
	'px.webp', 'nx.webp', 'py.webp', 'ny.webp', 'pz.webp', 'nz.webp'
] );
scene.background = environmentMap;

export default scene
