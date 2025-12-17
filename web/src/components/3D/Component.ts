import GameObject from "./GameObject"

class Component {
  gameObject:GameObject;
  constructor(gameObject:GameObject) {
    this.gameObject = gameObject;
  }
  update() {
  }
}

export default Component;