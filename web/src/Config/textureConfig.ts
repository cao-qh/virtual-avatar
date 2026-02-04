export type TexturesConfig = Record<string, Record<string, string>|string>

const baseUrl = import.meta.env.BASE_URL

const texturesConfig: TexturesConfig = {
  Home: {
    Wrapper: baseUrl + "textures/room/Wrapper Baking.webp",
    Wall: baseUrl + "textures/room/Wall Baking.webp",
    TableCabinet: baseUrl + "textures/room/Table Cabinet Baking.webp",
    OnWall: baseUrl + "textures/room/On Wall Baking.webp",
    GroundObject: baseUrl + "textures/room/Ground Obj Baking.webp",
    Photo: baseUrl + "textures/room/Photo.webp",
  },
  Avatar: baseUrl + "textures/avatar/Avatar_Baking.webp",
}

export default texturesConfig