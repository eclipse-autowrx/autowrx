const promptTemplates = [
  {
    title: 'Easy trunk loading',
    prompt: `Create the Velocitas app "Easy Trunk Loading Assistant".
 
When the rear trunk is opened, the vehicle's height should automatically lower to its lowest position, and the ambient lighting should gradually fade to a dark turquoise color. When the rear trunk is closed, the vehicle's height should return to its normal position (50% of maximum height), and the ambient lighting should turn off completely.
 
Ensure that all operations occur smoothly and sequentially. Add valuable logging information.`,
  },
  {
    title: 'Front collision warning',
    prompt: `The Collision Guard vehicle app shall execute the following actions when a front proximity warning is detected:
 
- The vehicle's low beam lights blinks 3 times
- The interior light fade in red
- Front wipers set to fast mode for a duration of 3 seconds
 
After 3 seconds executing the proximity warning actions, all activated responses should be automatically turned off`,
  },
  {
    title: 'Welcome scenario',
    prompt: `The "Welcome Assistant" vehicle app reacts on the state of the driver’s door.
 
When the driver door is opened, the app will: 
- fade in the interior light to blue 
- move the driver’s seat to the backmost position (value 1000)
- lower the vehicle's height to a low position (value 100) via the hydraulic system
 
When the driver door closes, the app will: 
- Move the driver’s seat to the middle position (value 500)
- Raise the vehicle's height to a high position (value 800) via the hydraulic system
- Turn off the interior light 2 seconds after the driver’s door is closed`,
  },
  {
    title: 'NBA notification',
    prompt: `Use sportsdata.io with key ffd6ad207dac4c879437eb1b35dc72f9 to identify whether there is an NBA game in progress. When the driver door is opened and there is an NBA game in progress the interior lights should fade in red otherwise the interior lights should fade in green. Turn off the interior light when driver door is closed. Add useful logging and use urllib for requests. Please also add valuable logging information.`,
  },
  {
    title: "Welcome Passenger",
    prompt: `The "Welcome Passenger" vehicle app reacts on the state of the driver’s door.
    When the driver door is opened: 
    - fade in the interior light to blue 
    - move the driver’s seat to the backmost position (value 1000)
    When the driver door is closed: 
    - Move the driver’s seat to the front position (value 0)
    - Turn off the interior light 2 seconds after the driver’s door is closed`
  }
]

export default promptTemplates
