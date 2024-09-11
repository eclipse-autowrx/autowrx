const templates = [
  {
    name: 'General 3D Car Dashboard',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/d47l1KiTHR1f/demo.jpg',
    config: `{
  "autorun": false,
  "widgets": [
      {
        "plugin": "Builtin",
        "widget": "Embedded-Widget",
        "options": {
          "VEHICLE_PAINT": "#005072",
          "PROXIMITY_API": "Vehicle.Proximity",
          "VIEWPOINT": 4,
          "ROW1_LEFT_DOOR_API": "Vehicle.Cabin.Door.Row1.Left.IsOpen",
          "ROW1_RIGHT_DOOR_API": "Vehicle.Cabin.Door.Row1.Right.IsOpen",
          "ROW1_LEFT_SEAT_POSITION_API": "Vehicle.Cabin.Seat.Row1.Pos1.Position",
          "ROW1_RIGHT_SEAT_POSITION_API": "Vehicle.Cabin.Seat.Row1.Pos2.Position",
          "TRUNK_API": "Vehicle.Body.Trunk.Rear.IsOpen",
          "url": "https://bewebstudio.digitalauto.tech/data/projects/d47l1KiTHR1f/index.html",
          "iconURL": "https://upload.digitalauto.tech/data/store-be/1a9c4725-577a-455f-a975-1d4785f61235.jpg"
        },
        "boxes": [
          1,
          2,
          3,
          4,
          5,
          6,
          7,
          8,
          9,
          10
        ],
        "path": ""
      }
  ]
}`,
  },
]

export default templates
