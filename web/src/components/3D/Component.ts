import GameObject from "@/components/3D/GameObject"

class Component {
  gameObject:GameObject;
  constructor(gameObject:GameObject) {
    this.gameObject = gameObject;
  }
  update() {
  }
}

export default Component;