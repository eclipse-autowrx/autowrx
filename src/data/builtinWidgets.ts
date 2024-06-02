const BUILT_IN_WIDGETS = [
    {
        id: "Single-API-Widget",
        plugin: "Builtin",
        widget: "Single-API-Widget",
        icon: "/imgs/widget_one_api.png",
        options: {
            label: "Low Beam Light",
            api: "Vehicle.Body.Lights.IsLowBeamOn",
            labelStyle: "color:black;font-size:20px",
            valueStyle: "color:teal;font-size:30px;",
            boxStyle: "background-color:white;",
        },
    },
    {
        id: "Table-APIs-Widget",
        plugin: "Builtin",
        widget: "Table-APIs-Widget",
        icon: "/imgs/widget_api_table.png",
        options: {
            apis: ["Vehicle.Body.Lights.IsLowBeamOn", "Vehicle.ADAS.ABS.IsEnabled"],
        },
    },
    {
        id: "Chart-APIs-Widget",
        plugin: "Builtin",
        widget: "Chart-APIs-Widget",
        icon: "/imgs/widget_chart_apis.png",
        options: {
            chartType: "line",
            num_of_keep_item: 30,
            chart_tick: 500,
            signals: [
                {
                    api: "Vehicle.Body.Lights.IsLowBeamOn",
                    color: "#FF00FF",
                },
            ],
        },
    },
    {
        id: "Image-By-VSS-Value",
        plugin: "Builtin",
        widget: "Image-By-VSS-Value",
        icon: "/imgs/widget_images.png",
        options: {
            api: "Vehicle.Body.Lights.IsLowBeamOn",
            valueMaps: [
                { value: false, img: "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_off.png" },
                { value: true, img: "https://bestudio.digitalauto.tech/project/Ml2Sc9TYoOHc/light_on.png" },
            ],
        },
    },
    {
        id: "Fan-Widget",
        plugin: "Builtin",
        widget: "Fan-Widget",
        icon: "/imgs/fan.png",
        options: {
            api: "",
        },
    },
    {
        id: "HVAC-Dreampack",
        plugin: "Builtin",
        widget: "HVAC-Dreampack",
        icon: "/imgs/hvac.png",
        options: {
            api_led_1: "Vehicle.Body.Lights.IsBrakeOn",
            api_led_2: "Vehicle.Body.Lights.IsLowBeamOn",
            api_led_3: "Vehicle.Body.Lights.IsHazardOn",
            api_seat_pos: "Vehicle.Cabin.Seat.Row1.Pos1.Position",
            api_fan_left: "Vehicle.Cabin.HVAC.Station.Row1.Left.FanSpeed",
            api_fan_right: "Vehicle.Cabin.HVAC.Station.Row1.Right.FanSpeed",
        },
    },
    {
        id: "Wiper-Simulator",
        plugin: "Builtin",
        widget: "Wiper-Simulator",
        icon: "/imgs/wiper.png",
        options: {
            fixed_api: "Vehicle.Body.Windshield.Front.Wiping.Mode",
        },
    },
    {
        id: "GoogleMap-Directions",
        plugin: "Builtin",
        widget: "GoogleMap-Directions",
        icon: "/imgs/widget_maps_direction_alt.jpeg",
        options: {
            directions: [
                { lat: 48.149497, lng: 11.523194 },
                { lat: 50.445168, lng: 11.020569 },
            ],
            icon: "",
        },
    },
    {
        id: "Gauge",
        plugin: "Builtin",
        widget: "Gauge",
        icon: "/imgs/gauge.jpeg",
        options: {
            api: "",
            label: "Label",
            minValue: 0,
            maxValue: 100,
        },
    },
    {
        id: "Drowsiness-Level",
        plugin: "Builtin",
        widget: "Drowsiness-Level",
        icon: "/imgs/drowsiness.png",
        options: {
            draw_boundary: true,
            set_to_api: "Vehicle.Driver.FatigueLevel",
        },
    },
    {
        id: "Driver-Distraction",
        plugin: "Builtin",
        widget: "Driver-Distraction",
        icon: "/imgs/driver-phone.png",
        options: {
            draw_boundary: true,
            set_to_api: "Vehicle.Driver.DistractionLevel",
        },
    },
    {
        id: "Embedded-Widget",
        plugin: "Builtin",
        widget: "Embedded-Widget",
        icon: "/imgs/widget_iframe.png",
        options: {
            url: "https://www.youtube.com/embed/ypR2cpdh6JA?si=IGhp44n5dTTbBD_p",
        },
    },
];

export default BUILT_IN_WIDGETS;
