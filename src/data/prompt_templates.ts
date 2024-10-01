const promptTemplates = [
  {
    title: 'Easy trunk loading',
    prompt: `Create the Velocitas app "Easy Trunk Loading Assistant".
 
When the rear trunk is opened, the vehicle's height should automatically lower to its lowest position, and the ambient lighting should gradually fade to a dark turquoise color. When the rear trunk is closed, the vehicle's height should return to its normal position (50% of maximum height), and the ambient lighting should turn off completely.
 
Ensure that all operations occur smoothly and sequentially. Add valuable logging information.`,
  },
  {
    title: 'Front collision warning',
    prompt: `Create the Velocitas app "Collision Guard".
 
If a front proximity warning is detected, the vehicle's low beam lights and the red interior light shall blink 3 times, and the front wipers shall be set to fast mode for 3 seconds. After the proximity warning, all actuators should be turned off.
 
Ensure that all operations occur smoothly and sequentially. Add valuable logging information.`,
  },
  {
    title: 'Welcome scenario',
    prompt: `Create the Velocitas app "Welcome Assistent" that performs the following sequence of actions in a vehicle based on the state of the driver’s door. When the driver opens the door, the system should:
 
- Move the driver’s seat to the backmost position (value 1000)
- Open the rear trunk
- Blink the vehicle's front low beam lights twice
- The interior light should set to a blue color with mode FADE-IN
- Set the front wipers to mode 'fast' for 2 seconds
- Lower the vehicle's height to a low position (value 100) via the hydraulic system
 
When the driver closes the door, the app should:
 
- Move the driver’s seat to the middle position (value 500)
- Close the rear trunk
- The interior light should set to a red color with mode FADE-IN
- Turn off the interior light 3 seconds after fading to red
- Raise the vehicle's height to a high position (value 800) via the hydraulic system
 
Design your solution to ensure that all actions happen sequentially and seamlessly, and specify any necessary timing, delays, or dependencies between the actions.`,
  },
  {
    title: 'NBA notification',
    prompt: `Use sportsdata.io with key ffd6ad207dac4c879437eb1b35dc72f9 to identify whether there is an NBA game in progress. When the driver door is opened and there is an NBA game in progress the interior lights should fade in red otherwise the interior lights should fade in green. Turn off the interior light when driver door is closed. Add useful logging and use urllib for requests. Please also add valuable logging information.`,
  },
]

export default promptTemplates
