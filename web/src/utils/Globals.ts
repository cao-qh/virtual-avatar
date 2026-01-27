import * as THREE from "three"
import Avatar from "@/components/3D/Avatar"


type GLOBALS = {
  time: number;
  deltaTime: number;
  avatar: Avatar|null;
  fans:Array<THREE.Mesh>
}

const Globals: GLOBALS = {
  time: 0,
  deltaTime: 0,
  avatar: null,
  fans:[]
}

export default Globals
