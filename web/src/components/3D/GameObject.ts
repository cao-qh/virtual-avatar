import * as THREE from 'three';
import Component from '@/components/3D/Component';

function removeArrayElement<T>(array:Array<T>, element:T) {
  const ndx = array.indexOf(element);
  if (ndx >= 0) {
    array.splice(ndx, 1);
  }
}
 
class GameObject {
  name:string;
  components:Array<Component>;
  transform:THREE.Object3D;

  constructor(parent:THREE.Object3D, name:string) {
    this.name = name;
    this.components = [];
    this.transform = new THREE.Object3D();
    parent.add(this.transform);
  }
  addComponent(ComponentType:any, ...args:any):any {
    const component = new ComponentType(this, ...args);
    this.components.push(component);
    return component;
  }
  removeComponent(component:Component) {
    removeArrayElement(this.components, component);
  }
  getComponent(ComponentType:any) {
    return this.components.find(c => c instanceof ComponentType);
  }
  update() {
    for (const component of this.components) {
      component.update();
    }
  }
}

export default GameObject;