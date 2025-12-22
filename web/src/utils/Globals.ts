import Player from "@/components/3D/Player"

type GLOBALS = {
  time: number;
  deltaTime: number;
  player: Player|null;
}

const Globals: GLOBALS = {
  time: 0,
  deltaTime: 0,
  player: null,
}

export default Globals
