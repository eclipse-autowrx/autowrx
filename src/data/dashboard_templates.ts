// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const templates = [
  {
    name: 'General 3D Car Dashboard',
    image:
      'https://bewebstudio.digitalauto.tech/data/projects/d47l1KiTHR1f/demo.jpg',
    config: `{"autorun":false,"widgets":[{"plugin":"Builtin","widget":"Embedded-Widget","options":{"VEHICLE_PAINT":"#005072","PROXIMITY_API":"Vehicle.Proximity","VIEWPOINT":4,"ROW1_LEFT_DOOR_API":"Vehicle.Cabin.Door.Row1.Left.IsOpen","ROW1_RIGHT_DOOR_API":"Vehicle.Cabin.Door.Row1.Right.IsOpen","ROW1_LEFT_SEAT_POSITION_API":"Vehicle.Cabin.Seat.Row1.Pos1.Position","ROW1_RIGHT_SEAT_POSITION_API":"Vehicle.Cabin.Seat.Row1.Pos2.Position","TRUNK_API":"Vehicle.Body.Trunk.Rear.IsOpen","url":"https://bewebstudio.digitalauto.tech/data/projects/d47l1KiTHR1f/index.html","iconURL":"https://upload.digitalauto.tech/data/store-be/1a9c4725-577a-455f-a975-1d4785f61235.jpg"},"boxes":[1,2,3,6,7,8],"path":""},{"plugin":"Builtin","widget":"Embedded-Widget","options":{"url":"https://store-be.digitalauto.tech/data/store-be/Terminal/latest/terminal/index.html","iconURL":"https://upload.digitalauto.tech/data/store-be/e991ea29-5fbf-42e9-9d3d-cceae23600f0.png"},"boxes":[4,5],"path":""},{"plugin":"Builtin","widget":"Embedded-Widget","options":{"apis":[""],"vss_json": "https://bewebstudio.digitalauto.tech/data/projects/sHQtNwric0H7/vss.json","url":"https://bewebstudio.digitalauto.tech/data/projects/sHQtNwric0H7/index.html","iconURL":"https://upload.digitalauto.tech/data/store-be/dccabc84-2128-4e5d-9e68-bc20333441c4.png"},"boxes":[9,10],"path":""}]}
`,
  },
]

export default templates
