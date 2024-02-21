export const vehicleClasses = [
    {
        name: "Passenger cars",
        description:
            "All sedans, coupes, and station wagons manufactured primarily for the purpose of carrying passengers and including those passenger cars pulling recreational or other light trailers.",
        classIncludes: ["All cars", "Cars with one-axle trailers", "Cars with two-axle trailers"],
        numberOfAxles: "2, 3 or 4",
    },
    {
        name: "Other two-axle four-tire single-unit vehicles",
        description:
            "All two-axle, four-tire, vehicles, other than passenger cars. Included in this classification are pickups, panels, vans, and other vehicles such as campers, motor homes, ambulances, hearses, carryalls, and minibuses. Other two-axle, four-tire single-unit vehicles pulling recreational or other light trailers are included in this classification. Because automatic vehicle classifiers have difficulty distinguishing class 3 from class 2, these two classes may be combined into class 2.",
        classIncludes: ["Pick-ups and vans", "Pick-ups and vans with one- and two- axle trailers"],
        numberOfAxles: "2 or 3",
    },
    {
        name: "Buses",
        description:
            "All vehicles manufactured as traditional passenger-carrying buses with two axles and six tires or three or more axles. This category includes only traditional buses (including school buses) functioning as passenger-carrying vehicles. Modified buses should be considered to be a truck and should be appropriately classified.",
        classIncludes: ["Two- and three-axle buses"],
        numberOfAxles: "2 or 3",
    },
    {
        name: "Two-axle, six-tire, single-unit trucks",
        description:
            "All vehicles on a single frame including trucks, camping and recreational vehicles, motor homes, etc., with two axles and dual rear wheels.",
        classIncludes: ["Two-axle trucks"],
        numberOfAxles: "2",
    },
    {
        name: "Three-axle single-unit trucks",
        description:
            "All vehicles on a single frame including trucks, camping and recreational vehicles, motor homes, etc., with three axles.",
        classIncludes: ["Three-axle trucks", "Three-axle tractors without trailers"],
        numberOfAxles: "3",
    },
    {
        name: "Four or more axle single-unit trucks",
        description: "All trucks on a single frame with four or more axles",
        classIncludes: ["Four-, five-, six- and seven-axle single-unit trucks"],
        numberOfAxles: "4 or more",
    },
    {
        name: "Four or fewer axle single-trailer trucks",
        description:
            "All vehicles with four or fewer axles consisting of two units, one of which is a tractor or straight truck power unit.",
        classIncludes: [
            "Two-axle trucks pulling one- and two-axle trailers",
            "Two-axle tractors pulling one- and two-axle trailers",
            "Three-axle tractors pulling one-axle trailers",
        ],
        numberOfAxles: "3 or 4",
    },
    {
        name: "Five-axle single-trailer trucks",
        description:
            "All five-axle vehicles consisting of two units, one of which is a tractor or straight truck power unit",
        classIncludes: [
            "Two-axle tractors pulling three-axle trailers",
            "Three-axle tractors pulling two-axle trailers",
            "Three-axle trucks pulling two-axle trailers",
        ],
        numberOfAxles: "5",
    },
    {
        name: "Six or more axle single-trailer trucks",
        description:
            "All vehicles with six or more axles consisting of two units, one of which is a tractor or straight truck power unit.",
        classIncludes: ["Multiple configurations"],
        numberOfAxles: "6 or more",
    },
    {
        name: "Five or fewer axle multi-trailer trucks",
        description:
            "All vehicles with five or fewer axles consisting of three or more units, one of which is a tractor or straight truck power unit.",
        classIncludes: ["Multiple configurations"],
        numberOfAxles: "4 or 5",
    },
    {
        name: "Six-axle multi-trailer trucks",
        description:
            "All six-axle vehicles consisting of three or more units, one of which is a tractor or straight truck power unit",
        classIncludes: ["Multiple configurations"],
        numberOfAxles: "6",
    },
    {
        name: "Seven or more axle multi-trailer trucks",
        description:
            "All vehicles with seven or more axles consisting of three or more units, one of which is a tractor or straight truck power unit.",
        classIncludes: ["Multiple configurations"],
        numberOfAxles: "7 or more",
    },
];
