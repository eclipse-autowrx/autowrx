const default_journey = `
#Step 1
Who: Driver
What: Wipers turned on manually
Customer TouchPoints: Windshield wiper switch
#Step 2
Who: User
What: User opens the car door/trunk and the open status of door/trunk is set to true
Customer TouchPoints: Door/trunk handle
#Step 3
Who: System
What: The wiping is immediately turned off by the software and user is notified
Customer TouchPoints: Notification on car dashboard and mobile app
`

export default default_journey
