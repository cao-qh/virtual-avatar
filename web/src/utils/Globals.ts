import * as THREE from "three"
import Avatar from "@/components/3D/Avatar"


type GLOBALS = {
  time: number;
  deltaTime: number;
  avatar: Avatar|null;
}

const Globals: GLOBALS = {
  time: 0,
  deltaTime: 0,
  avatar: null,
}

export default Globals
