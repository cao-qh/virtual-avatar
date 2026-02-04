import * as THREE from "three"
import SafeArray from "@/utils/SafeArray"
import GameObject from "./GameObject"

class GameObjectManager {
  gameObjects: SafeArray<GameObject>
  constructor() {
    this.gameObjects = new SafeArray()
  }
  createGameObject(parent: THREE.Object3D, name: string) {
    const gameObject = new GameObject(parent, name)
    this.gameObjects.add(gameObject)
    return gameObject
  }
  removeGameObject(gameObject: GameObject) {
    this.gameObjects.remove(gameObject)
  }
  update() {
    this.gameObjects.forEach((gameObject: GameObject) => gameObject.update())
  }
}

export default  GameObjectManager
