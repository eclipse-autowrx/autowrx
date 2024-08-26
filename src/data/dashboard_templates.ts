const templates = [
  {
    name: 'General 3D Car Dashboard',
    image: '/imgs/dashboard-templates/dashboard-1.png',
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
        "ROW1_LEFT_DOOR_API": "Vehicle.Cabin.Door.Row1.DriverSide.IsOpen",
        "ROW1_RIGHT_DOOR_API": "Vehicle.Cabin.Door.Row1.PassengerSide.IsOpen",
        "ROW1_LEFT_SEAT_POSITION_API": "Vehicle.Cabin.Seat.Row1.DriverSide.Position",
        "ROW1_RIGHT_SEAT_POSITION_API": "Vehicle.Cabin.Door.Row1.PassengerSide.Position",
        "TRUNK_API": "Vehicle.Body.Trunk.Rear.IsOpen",
        "url": "https://store-be.digitalauto.tech/data/store-be/General%203D%20Car%20Model/latest/new/new/3DCar.html",
        "iconURL": "https://upload.digitalauto.tech/data/store-be/3b26fb53-158b-48ec-b004-d35175032667.png"
      },
      "boxes": [
        1,
        2,
        3,
        6,
        7,
        8
      ],
      "path": ""
    }
  ]
}`,
  },
]

export default templates
