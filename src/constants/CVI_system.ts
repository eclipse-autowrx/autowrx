export const CVI_system = `{
    "Vehicle": {
        "children": {
            "S2S": {
                "description": "COVESA VSS, Signal to Service API",
                "type": "branch",
                "uuid": "746a5f19a7c941abb4c420dac7fd3b3e",
                "children": {
                    "ADAS": {
                        "children": {
                            "ABS": {
                                "children": {
                                    "IsEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates if ABS is enabled. True = Enabled. False = Disabled.",
                                        "type": "actuator",
                                        "uuid": "cad374fbfdc65df9b777508f04d5b073"
                                    },
                                    "IsEngaged": {
                                        "datatype": "boolean",
                                        "description": "Indicates if ABS is currently regulating brake pressure. True = Engaged. False = Not Engaged.",
                                        "type": "sensor",
                                        "uuid": "6dd21979a2225e31940dc2ece1aa9a04"
                                    },
                                    "IsError": {
                                        "datatype": "boolean",
                                        "description": "Indicates if ABS incurred an error condition. True = Error. False = No Error.",
                                        "type": "sensor",
                                        "uuid": "13cfabb3122254128234f9a696f14678"
                                    }
                                },
                                "description": "Antilock Braking System signals.",
                                "type": "branch",
                                "uuid": "219270ef27c4531f874bbda63743b330"
                            },
                            "ActiveAutonomyLevel": {
                                "allowed": [
                                    "SAE_0",
                                    "SAE_1",
                                    "SAE_2_DISENGAGING",
                                    "SAE_2",
                                    "SAE_3_DISENGAGING",
                                    "SAE_3",
                                    "SAE_4_DISENGAGING",
                                    "SAE_4",
                                    "SAE_5"
                                ],
                                "comment": "Follows https://www.sae.org/news/2019/01/sae-updates-j3016-automated-driving-graphic taxonomy. For SAE levels 3 and 4 the system is required to alert the driver before it will disengage. Level 4 systems are required to reach a safe state even if a driver does not take over. Only level 5 systems are required to not rely on a driver at all. While level 2 systems require the driver to be monitoring the system at all times, many level 2 systems, often termed \\"level 2.5\\" systems, do warn the driver shortly before reaching their operational limits, therefore we also support the DISENGAGING state for SAE_2.",
                                "datatype": "string",
                                "description": "Indicates the currently active level of autonomy according to SAE J3016 taxonomy.",
                                "type": "sensor",
                                "uuid": "b101c6928fc55948b1cc485e568ecd8d"
                            },
                            "CruiseControl": {
                                "children": {
                                    "IsActive": {
                                        "datatype": "boolean",
                                        "description": "Indicates if cruise control system is active (i.e. actively controls speed). True = Active. False = Inactive.",
                                        "type": "actuator",
                                        "uuid": "78ab5ce923dc5aa1a6622bcb948e1561"
                                    },
                                    "IsEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates if cruise control system is enabled (e.g. ready to receive configurations and settings) True = Enabled. False = Disabled.",
                                        "type": "actuator",
                                        "uuid": "018417f6c8535315895d0f54d209035a"
                                    },
                                    "IsError": {
                                        "datatype": "boolean",
                                        "description": "Indicates if cruise control system incurred an error condition. True = Error. False = No Error.",
                                        "type": "sensor",
                                        "uuid": "22923d4a36bc5192a08e40fe9e5ed458"
                                    },
                                    "SpeedSet": {
                                        "datatype": "float",
                                        "description": "Set cruise control speed in kilometers per hour.",
                                        "type": "actuator",
                                        "unit": "km/h",
                                        "uuid": "b3f3a53ccd825e4da5cb1226f94dc005"
                                    }
                                },
                                "description": "Signals from Cruise Control system.",
                                "type": "branch",
                                "uuid": "c4d751cf74f9576dbba3cc820991c1fb"
                            },
                            "EBA": {
                                "children": {
                                    "IsEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates if EBA is enabled. True = Enabled. False = Disabled.",
                                        "type": "actuator",
                                        "uuid": "3ae9171b69555fb08855054ab38e9b17"
                                    },
                                    "IsEngaged": {
                                        "datatype": "boolean",
                                        "description": "Indicates if EBA is currently regulating brake pressure. True = Engaged. False = Not Engaged.",
                                        "type": "sensor",
                                        "uuid": "86360c44ead354d18af7ff14176151f6"
                                    },
                                    "IsError": {
                                        "datatype": "boolean",
                                        "description": "Indicates if EBA incurred an error condition. True = Error. False = No Error.",
                                        "type": "sensor",
                                        "uuid": "bae0fe856398502ba4a09283867c6c81"
                                    }
                                },
                                "description": "Emergency Brake Assist (EBA) System signals.",
                                "type": "branch",
                                "uuid": "51ec0930d0af5b91b84a0775c6e87a97"
                            },
                            "EBD": {
                                "children": {
                                    "IsEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates if EBD is enabled. True = Enabled. False = Disabled.",
                                        "type": "actuator",
                                        "uuid": "30f88d3e68575b67853b14ce5f7a08e5"
                                    },
                                    "IsEngaged": {
                                        "datatype": "boolean",
                                        "description": "Indicates if EBD is currently regulating vehicle brakeforce distribution. True = Engaged. False = Not Engaged.",
                                        "type": "sensor",
                                        "uuid": "67aa2a598f635edda6eb944af99b06db"
                                    },
                                    "IsError": {
                                        "datatype": "boolean",
                                        "description": "Indicates if EBD incurred an error condition. True = Error. False = No Error.",
                                        "type": "sensor",
                                        "uuid": "918157073be95015ae38913cd7a9796a"
                                    }
                                },
                                "description": "Electronic Brakeforce Distribution (EBD) System signals.",
                                "type": "branch",
                                "uuid": "3f4c74a588735b10ac9fe918d305cd5a"
                            },
                            "ESC": {
                                "children": {
                                    "IsEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates if ESC is enabled. True = Enabled. False = Disabled.",
                                        "type": "actuator",
                                        "uuid": "3f4f39b8d8c05c97a6de685282ba74b7"
                                    },
                                    "IsEngaged": {
                                        "datatype": "boolean",
                                        "description": "Indicates if ESC is currently regulating vehicle stability. True = Engaged. False = Not Engaged.",
                                        "type": "sensor",
                                        "uuid": "2088953a28385353a9d46b3a3dc11cac"
                                    },
                                    "IsError": {
                                        "datatype": "boolean",
                                        "description": "Indicates if ESC incurred an error condition. True = Error. False = No Error.",
                                        "type": "sensor",
                                        "uuid": "6c237535654b5bc7a70f6a70c760b9d4"
                                    },
                                    "IsStrongCrossWindDetected": {
                                        "datatype": "boolean",
                                        "description": "Indicates if the ESC system is detecting strong cross winds. True = Strong cross winds detected. False = No strong cross winds detected.",
                                        "type": "sensor",
                                        "uuid": "ebfd609531345c37914b89e553df80cb"
                                    },
                                    "RoadFriction": {
                                        "children": {
                                            "LowerBound": {
                                                "datatype": "float",
                                                "description": "Lower bound road friction, as calculated by the ESC system. 5% possibility that road friction is below this value. 0 = no friction, 100 = maximum friction.",
                                                "max": 100,
                                                "min": 0,
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "634289f58b5d511ea9979f04a9d0f2ab"
                                            },
                                            "MostProbable": {
                                                "datatype": "float",
                                                "description": "Most probable road friction, as calculated by the ESC system. Exact meaning of most probable is implementation specific. 0 = no friction, 100 = maximum friction.",
                                                "max": 100,
                                                "min": 0,
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "b0eb72430cd95bfbba0d187fcb6e2a62"
                                            },
                                            "UpperBound": {
                                                "datatype": "float",
                                                "description": "Upper bound road friction, as calculated by the ESC system. 95% possibility that road friction is below this value. 0 = no friction, 100 = maximum friction.",
                                                "max": 100,
                                                "min": 0,
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "ad0415a799575fcd8d1f49bed9a2baeb"
                                            }
                                        },
                                        "description": "Road friction values reported by the ESC system.",
                                        "type": "branch",
                                        "uuid": "71a32e4eb131532c82195508d93807ed"
                                    }
                                },
                                "description": "Electronic Stability Control System signals.",
                                "type": "branch",
                                "uuid": "636b4586ce7854b4b270a2f3b6c0af4f"
                            },
                            "LaneDepartureDetection": {
                                "children": {
                                    "IsEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates if lane departure detection system is enabled. True = Enabled. False = Disabled.",
                                        "type": "actuator",
                                        "uuid": "c099ae97260f5c418977cd14631e95be"
                                    },
                                    "IsError": {
                                        "datatype": "boolean",
                                        "description": "Indicates if lane departure system incurred an error condition. True = Error. False = No Error.",
                                        "type": "sensor",
                                        "uuid": "73b2fc4f6a4952e4b7886671450e7798"
                                    },
                                    "IsWarning": {
                                        "datatype": "boolean",
                                        "description": "Indicates if lane departure detection registered a lane departure.",
                                        "type": "sensor",
                                        "uuid": "c32fcd1d56035cb08acfd380be224c6a"
                                    }
                                },
                                "description": "Signals from Lane Departure Detection System.",
                                "type": "branch",
                                "uuid": "e45f33fdcf245f11981b2f201ee8281a"
                            },
                            "ObstacleDetection": {
                                "children": {
                                    "IsEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates if obstacle sensor system is enabled (i.e. monitoring for obstacles). True = Enabled. False = Disabled.",
                                        "type": "actuator",
                                        "uuid": "cc0cd497285e5034a1cccb25f02e9db9"
                                    },
                                    "IsError": {
                                        "datatype": "boolean",
                                        "description": "Indicates if obstacle sensor system incurred an error condition. True = Error. False = No Error.",
                                        "type": "sensor",
                                        "uuid": "368b74e2468d5217925a478ed6e34f9f"
                                    },
                                    "IsWarning": {
                                        "datatype": "boolean",
                                        "description": "Indicates if obstacle sensor system registered an obstacle.",
                                        "type": "sensor",
                                        "uuid": "b0b1eab51f135ffcb2a17a7603415fec"
                                    }
                                },
                                "description": "Signals form Obstacle Sensor System.",
                                "type": "branch",
                                "uuid": "e7b6d81631cc5ac584d027d4c1a66cb5"
                            },
                            "SupportedAutonomyLevel": {
                                "allowed": [
                                    "SAE_0",
                                    "SAE_1",
                                    "SAE_2",
                                    "SAE_3",
                                    "SAE_4",
                                    "SAE_5"
                                ],
                                "datatype": "string",
                                "description": "Indicates the highest level of autonomy according to SAE J3016 taxonomy the vehicle is capable of.",
                                "type": "attribute",
                                "uuid": "020410189ab4517cb85ceda268b40f51"
                            },
                            "TCS": {
                                "children": {
                                    "IsEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates if TCS is enabled. True = Enabled. False = Disabled.",
                                        "type": "actuator",
                                        "uuid": "1d2dda19b11758a19ba7c1d5cd2d7956"
                                    },
                                    "IsEngaged": {
                                        "datatype": "boolean",
                                        "description": "Indicates if TCS is currently regulating traction. True = Engaged. False = Not Engaged.",
                                        "type": "sensor",
                                        "uuid": "b33d70009ad5589fbffe17fa7e827242"
                                    },
                                    "IsError": {
                                        "datatype": "boolean",
                                        "description": "Indicates if TCS incurred an error condition. True = Error. False = No Error.",
                                        "type": "sensor",
                                        "uuid": "08f88723ba63558b8c804b8fe8e3f149"
                                    }
                                },
                                "description": "Traction Control System signals.",
                                "type": "branch",
                                "uuid": "0572e9f6b1aa5fb5b2f68086aff05073"
                            }
                        },
                        "description": "All Advanced Driver Assist Systems data.",
                        "type": "branch",
                        "uuid": "14c2b2e1297b513197d320a5ce58f42e"
                    },
                    "Acceleration": {
                        "children": {
                            "Lateral": {
                                "datatype": "float",
                                "description": "Vehicle acceleration in Y (lateral acceleration).",
                                "type": "sensor",
                                "unit": "m/s^2",
                                "uuid": "7522c5d6b7665b16a099643b2700e93c"
                            },
                            "Longitudinal": {
                                "datatype": "float",
                                "description": "Vehicle acceleration in X (longitudinal acceleration).",
                                "type": "sensor",
                                "unit": "m/s^2",
                                "uuid": "3d511fe7232b5841be311b37f322de5a"
                            },
                            "Vertical": {
                                "datatype": "float",
                                "description": "Vehicle acceleration in Z (vertical acceleration).",
                                "type": "sensor",
                                "unit": "m/s^2",
                                "uuid": "a4a8a7c4ac5b52deb0b3ee4ed8787c59"
                            }
                        },
                        "description": "Spatial acceleration. Axis definitions according to ISO 8855.",
                        "type": "branch",
                        "uuid": "6c490e6a798c5abc8f0178ed6deae0a8"
                    },
                    "AngularVelocity": {
                        "children": {
                            "Pitch": {
                                "datatype": "float",
                                "description": "Vehicle rotation rate along Y (lateral).",
                                "type": "sensor",
                                "unit": "degrees/s",
                                "uuid": "42236f4a01f45313a97fdd9b6848ce4f"
                            },
                            "Roll": {
                                "datatype": "float",
                                "description": "Vehicle rotation rate along X (longitudinal).",
                                "type": "sensor",
                                "unit": "degrees/s",
                                "uuid": "221e6b93881e5771bcbd03e0849e0075"
                            },
                            "Yaw": {
                                "datatype": "float",
                                "description": "Vehicle rotation rate along Z (vertical).",
                                "type": "sensor",
                                "unit": "degrees/s",
                                "uuid": "4114c41552565c1f9035670cabe2a611"
                            }
                        },
                        "description": "Spatial rotation. Axis definitions according to ISO 8855.",
                        "type": "branch",
                        "uuid": "1eef530a43de56aab665d2766483cde2"
                    },
                    "AverageSpeed": {
                        "datatype": "float",
                        "description": "Average speed for the current trip.",
                        "type": "sensor",
                        "unit": "km/h",
                        "uuid": "43a489636a665c3abb99b63174eb552b"
                    },
                    "Body": {
                        "children": {
                            "BodyType": {
                                "datatype": "string",
                                "description": "Body type code as defined by ISO 3779.",
                                "type": "attribute",
                                "uuid": "6253412513105deea63b1d424117fd88"
                            },
                            "Hood": {
                                "children": {
                                    "IsOpen": {
                                        "datatype": "boolean",
                                        "description": "Hood open or closed. True = Open. False = Closed.",
                                        "type": "actuator",
                                        "uuid": "890aa3359e1a579288af1cf8e6b5b71f"
                                    }
                                },
                                "description": "Hood status.",
                                "type": "branch",
                                "uuid": "84510652bf915bbe8bf5f477aab2b44a"
                            },
                            "Horn": {
                                "children": {
                                    "IsActive": {
                                        "datatype": "boolean",
                                        "description": "Horn active or inactive. True = Active. False = Inactive.",
                                        "type": "actuator",
                                        "uuid": "ba20deed9314525bb9d552a2b787fb20"
                                    }
                                },
                                "description": "Horn signals.",
                                "type": "branch",
                                "uuid": "09c76633887f52268b960740eb969c89"
                            },
                            "Lights": {
                                "children": {
                                    "IsBackupOn": {
                                        "datatype": "boolean",
                                        "description": "Is backup (reverse) light on?",
                                        "type": "actuator",
                                        "uuid": "48c0a466b59555f6bf0c01fcf7a3c42c"
                                    },
                                    "IsBrakeOn": {
                                        "datatype": "boolean",
                                        "description": "Is brake light on?",
                                        "type": "actuator",
                                        "uuid": "7b8b136ec8aa59cb8773aa3c455611a4"
                                    },
                                    "IsFrontFogOn": {
                                        "datatype": "boolean",
                                        "description": "Is front fog light on?",
                                        "type": "actuator",
                                        "uuid": "9ad70db68408503a8506d09c7c92a13f"
                                    },
                                    "IsHazardOn": {
                                        "datatype": "boolean",
                                        "description": "Are hazards on?",
                                        "type": "actuator",
                                        "uuid": "148eee65b2de53fab88fc261246d6639"
                                    },
                                    "IsHighBeamOn": {
                                        "datatype": "boolean",
                                        "description": "Is high beam on?",
                                        "type": "actuator",
                                        "uuid": "80a627e5b81356dabe557ff4102f634f"
                                    },
                                    "IsLeftIndicatorOn": {
                                        "datatype": "boolean",
                                        "description": "Is left indicator flashing?",
                                        "type": "actuator",
                                        "uuid": "98c6f3d400d65a6da5fef8e22c16133a"
                                    },
                                    "IsLowBeamOn": {
                                        "datatype": "boolean",
                                        "description": "Is low beam on?",
                                        "type": "actuator",
                                        "uuid": "917d51175b675ad89cf86e07e33b44ec"
                                    },
                                    "IsParkingOn": {
                                        "datatype": "boolean",
                                        "description": "Is parking light on?",
                                        "type": "actuator",
                                        "uuid": "510402bd9355529dbddc2b9724db6957"
                                    },
                                    "IsRearFogOn": {
                                        "datatype": "boolean",
                                        "description": "Is rear fog light on?",
                                        "type": "actuator",
                                        "uuid": "54818024ac4853d49003e8e10bd8f4f6"
                                    },
                                    "IsRightIndicatorOn": {
                                        "datatype": "boolean",
                                        "description": "Is right indicator flashing?",
                                        "type": "actuator",
                                        "uuid": "df301b25233e5f20b039bc9304c148d2"
                                    },
                                    "IsRunningOn": {
                                        "datatype": "boolean",
                                        "description": "Are running lights on?",
                                        "type": "actuator",
                                        "uuid": "cd28479b1a5c5088a52e8d9cd7f22dcf"
                                    }
                                },
                                "description": "All lights.",
                                "type": "branch",
                                "uuid": "399d1ec14d6f55bb825e078a801bde55"
                            },
                            "Mirrors": {
                                "children": {
                                    "Left": {
                                        "children": {
                                            "IsHeatingOn": {
                                                "datatype": "boolean",
                                                "description": "Mirror Heater on or off. True = Heater On. False = Heater Off.",
                                                "type": "actuator",
                                                "uuid": "b8591c0592d8525e91e1a04495b6995d"
                                            },
                                            "Pan": {
                                                "datatype": "int8",
                                                "description": "Mirror pan as a percent. 0 = Center Position. 100 = Fully Left Position. -100 = Fully Right Position.",
                                                "max": 100,
                                                "min": -100,
                                                "type": "actuator",
                                                "unit": "percent",
                                                "uuid": "9dae4bc33a28531199fce500e0562f82"
                                            },
                                            "Tilt": {
                                                "datatype": "int8",
                                                "description": "Mirror tilt as a percent. 0 = Center Position. 100 = Fully Upward Position. -100 = Fully Downward Position.",
                                                "max": 100,
                                                "min": -100,
                                                "type": "actuator",
                                                "unit": "percent",
                                                "uuid": "698fee82cc115f3cba54825a298b46ab"
                                            }
                                        },
                                        "description": "All mirrors.",
                                        "type": "branch",
                                        "uuid": "22609e45a09d58fc85cb77959a686abc"
                                    },
                                    "Right": {
                                        "children": {
                                            "IsHeatingOn": {
                                                "datatype": "boolean",
                                                "description": "Mirror Heater on or off. True = Heater On. False = Heater Off.",
                                                "type": "actuator",
                                                "uuid": "9a57455f48ea5fdbb7a998905dda318c"
                                            },
                                            "Pan": {
                                                "datatype": "int8",
                                                "description": "Mirror pan as a percent. 0 = Center Position. 100 = Fully Left Position. -100 = Fully Right Position.",
                                                "max": 100,
                                                "min": -100,
                                                "type": "actuator",
                                                "unit": "percent",
                                                "uuid": "26088f96804d5d7e811ba50bfb1113eb"
                                            },
                                            "Tilt": {
                                                "datatype": "int8",
                                                "description": "Mirror tilt as a percent. 0 = Center Position. 100 = Fully Upward Position. -100 = Fully Downward Position.",
                                                "max": 100,
                                                "min": -100,
                                                "type": "actuator",
                                                "unit": "percent",
                                                "uuid": "9a28a6ec824c57408881b916a1a0e32b"
                                            }
                                        },
                                        "description": "All mirrors.",
                                        "type": "branch",
                                        "uuid": "64291c99f7e752c2b035262c17dc85dd"
                                    }
                                },
                                "description": "All mirrors.",
                                "type": "branch",
                                "uuid": "a4ea618914885a239ef5fa62c671a800"
                            },
                            "Raindetection": {
                                "children": {
                                    "Intensity": {
                                        "datatype": "uint8",
                                        "description": "Rain intensity. 0 = Dry, No Rain. 100 = Covered.",
                                        "max": 100,
                                        "type": "sensor",
                                        "unit": "percent",
                                        "uuid": "1ee0a2f22e8257d299425a4ff2652555"
                                    }
                                },
                                "description": "Rainsensor signals.",
                                "type": "branch",
                                "uuid": "f16759f3dcfb5be4832e962da29ebd6c"
                            },
                            "RearMainSpoilerPosition": {
                                "datatype": "float",
                                "description": "Rear spoiler position, 0% = Spoiler fully stowed. 100% = Spoiler fully exposed.",
                                "max": 100,
                                "min": 0,
                                "type": "actuator",
                                "unit": "percent",
                                "uuid": "6209a82390585b869cc3d00d069eade2"
                            },
                            "RefuelPosition": {
                                "allowed": [
                                    "FRONT_LEFT",
                                    "FRONT_RIGHT",
                                    "MIDDLE_LEFT",
                                    "MIDDLE_RIGHT",
                                    "REAR_LEFT",
                                    "REAR_RIGHT"
                                ],
                                "datatype": "string",
                                "description": "Location of the fuel cap or charge port.",
                                "type": "attribute",
                                "uuid": "53ef90a851fa57f0810d50238e852f02"
                            },
                            "Trunk": {
                                "children": {
                                    "Front": {
                                        "children": {
                                            "IsLocked": {
                                                "datatype": "boolean",
                                                "description": "Is trunk locked or unlocked. True = Locked. False = Unlocked.",
                                                "type": "actuator",
                                                "uuid": "e0eabc210f07505fa1b66b67729d681b"
                                            },
                                            "IsOpen": {
                                                "datatype": "boolean",
                                                "description": "Trunk open or closed. True = Open. False = Closed.",
                                                "type": "actuator",
                                                "uuid": "2047de0896a352fcaf02baa06819a023"
                                            }
                                        },
                                        "description": "Trunk status.",
                                        "type": "branch",
                                        "uuid": "a455aca5bae55c22b7949fd31a765a6c"
                                    },
                                    "Rear": {
                                        "children": {
                                            "IsLocked": {
                                                "datatype": "boolean",
                                                "description": "Is trunk locked or unlocked. True = Locked. False = Unlocked.",
                                                "type": "actuator",
                                                "uuid": "8f9b55b002ed59d3ac2ef0b014abf4aa"
                                            },
                                            "IsOpen": {
                                                "datatype": "boolean",
                                                "description": "Trunk open or closed. True = Open. False = Closed.",
                                                "type": "actuator",
                                                "uuid": "3d3249e59306594698367b839b12c938"
                                            }
                                        },
                                        "description": "Trunk status.",
                                        "type": "branch",
                                        "uuid": "a6170ff5e4325f38b5d57402e1d95e5a"
                                    }
                                },
                                "description": "Trunk status.",
                                "type": "branch",
                                "uuid": "a584c6a5aa235cb88ac686f8d72a1dff"
                            },
                            "Windshield": {
                                "children": {
                                    "Front": {
                                        "children": {
                                            "IsHeatingOn": {
                                                "datatype": "boolean",
                                                "description": "Windshield heater status. False - off, True - on.",
                                                "type": "actuator",
                                                "uuid": "26e6a3b7e9bb58bebba29258faa6e300"
                                            },
                                            "WasherFluid": {
                                                "children": {
                                                    "IsLevelLow": {
                                                        "datatype": "boolean",
                                                        "description": "Low level indication for washer fluid. True = Level Low. False = Level OK.",
                                                        "type": "sensor",
                                                        "uuid": "8ca54695ad115f9bb6f56d7c450781a7"
                                                    },
                                                    "Level": {
                                                        "datatype": "uint8",
                                                        "description": "Washer fluid level as a percent. 0 = Empty. 100 = Full.",
                                                        "max": 100,
                                                        "type": "sensor",
                                                        "unit": "percent",
                                                        "uuid": "a36dfb91414f5792bd01d193dceff1f4"
                                                    }
                                                },
                                                "description": "Windshield washer fluid signals",
                                                "type": "branch",
                                                "uuid": "2de24016515353289953de5ea81efd3c"
                                            },
                                            "Wiping": {
                                                "children": {
                                                    "Intensity": {
                                                        "datatype": "uint8",
                                                        "description": "Relative intensity/sensitivity for interval and rain sensor mode as requested by user/driver. Has no significance if Windshield.Wiping.Mode is OFF/SLOW/MEDIUM/FAST 0 - wipers inactive. 1 - minimum intensity (lowest frequency/sensitivity, longest interval). 2/3/4/... - higher intensity (higher frequency/sensitivity, shorter interval). Maximum value supported is vehicle specific.",
                                                        "type": "actuator",
                                                        "uuid": "7cdd36d1cc8f5f9a9f079f663190b588"
                                                    },
                                                    "IsWipersWorn": {
                                                        "datatype": "boolean",
                                                        "description": "Wiper wear status. True = Worn, Replacement recommended or required. False = Not Worn.",
                                                        "type": "sensor",
                                                        "uuid": "b04ccc7daedb559c9bcdda6b00332be5"
                                                    },
                                                    "Mode": {
                                                        "allowed": [
                                                            "OFF",
                                                            "SLOW",
                                                            "MEDIUM",
                                                            "FAST",
                                                            "INTERVAL",
                                                            "RAIN_SENSOR"
                                                        ],
                                                        "datatype": "string",
                                                        "description": "Wiper mode requested by user/driver. INTERVAL indicates intermittent wiping, with fixed time interval between each wipe. RAIN_SENSOR indicates intermittent wiping based on rain intensity.",
                                                        "type": "actuator",
                                                        "uuid": "3ee6552c96e551c5b06b79ad30226767"
                                                    },
                                                    "System": {
                                                        "children": {
                                                            "ActualPosition": {
                                                                "comment": "Default parking position might be used as reference position.",
                                                                "datatype": "float",
                                                                "description": "Actual position of main wiper blade for the wiper system relative to reference position. Location of reference position (0 degrees) and direction of positive/negative degrees is vehicle specific.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "026307b591465a8a99ffc0ebf262b393"
                                                            },
                                                            "DriveCurrent": {
                                                                "comment": "May be negative in special situations.",
                                                                "datatype": "float",
                                                                "description": "Actual current used by wiper drive.",
                                                                "type": "sensor",
                                                                "unit": "A",
                                                                "uuid": "251e695821b758e7b7d459d5e2ab6ca4"
                                                            },
                                                            "Frequency": {
                                                                "comment": "Examples - 0 = Wipers stopped, 80 = Wipers doing 80 cycles per minute (in WIPE mode).",
                                                                "datatype": "uint8",
                                                                "description": "Wiping frequency/speed, measured in cycles per minute. The signal concerns the actual speed of the wiper blades when moving. Intervals/pauses are excluded, i.e. the value corresponds to the number of cycles that would be completed in 1 minute if wiping permanently over default range.",
                                                                "type": "actuator",
                                                                "uuid": "7394c8b8d20d52638881161ec1b41fc0"
                                                            },
                                                            "IsBlocked": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates if wiper movement is blocked. True = Movement blocked. False = Movement not blocked.",
                                                                "type": "sensor",
                                                                "uuid": "4b526a2c781e56e386c82df226061f9e"
                                                            },
                                                            "IsEndingWipeCycle": {
                                                                "comment": "In continuous wiping between A and B this sensor can be used a trigger to update TargetPosition.",
                                                                "datatype": "boolean",
                                                                "description": "Indicates if current wipe movement is completed or near completion. True = Movement is completed or near completion. Changes to RequestedPosition will be executed first after reaching previous RequestedPosition, if it has not already been reached. False = Movement is not near completion. Any change to RequestedPosition will be executed immediately. Change of direction may not be allowed.",
                                                                "type": "sensor",
                                                                "uuid": "5000f7f0c39e5fed9a95413ae4166482"
                                                            },
                                                            "IsOverheated": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates if wiper system is overheated. True = Wiper system overheated. False = Wiper system not overheated.",
                                                                "type": "sensor",
                                                                "uuid": "e05d376ec2525ba2b61039d55f93760f"
                                                            },
                                                            "IsPositionReached": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates if a requested position has been reached. IsPositionReached refers to the previous position in case the TargetPosition is updated while IsEndingWipeCycle=True. True = Current or Previous TargetPosition reached. False = Position not (yet) reached, or wipers have moved away from the reached position.",
                                                                "type": "sensor",
                                                                "uuid": "d42149fa8982593991aa5cd13a1cdee9"
                                                            },
                                                            "IsWiperError": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates system failure. True if wiping is disabled due to system failure.",
                                                                "type": "sensor",
                                                                "uuid": "5276055d973f57998e1b8d6e536de735"
                                                            },
                                                            "IsWiping": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates wiper movement. True if wiper blades are moving. Change of direction shall be considered as IsWiping if wipers will continue to move directly after the change of direction.",
                                                                "type": "sensor",
                                                                "uuid": "2015a4610d7a5fbdbb63b260640838e6"
                                                            },
                                                            "Mode": {
                                                                "allowed": [
                                                                    "STOP_HOLD",
                                                                    "WIPE",
                                                                    "PLANT_MODE",
                                                                    "EMERGENCY_STOP"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Requested mode of wiper system. STOP_HOLD means that the wipers shall move to position given by TargetPosition and then hold the position. WIPE means that wipers shall move to the position given by TargetPosition and then hold the position if no new TargetPosition is requested. PLANT_MODE means that wiping is disabled. Exact behavior is vehicle specific. EMERGENCY_STOP means that wiping shall be immediately stopped without holding the position.",
                                                                "type": "actuator",
                                                                "uuid": "d15518f5d1bc54a38718f43ef749dd34"
                                                            },
                                                            "TargetPosition": {
                                                                "comment": "Default parking position might be used as reference position.",
                                                                "datatype": "float",
                                                                "description": "Requested position of main wiper blade for the wiper system relative to reference position. Location of reference position (0 degrees) and direction of positive/negative degrees is vehicle specific. System behavior when receiving TargetPosition depends on Mode and IsEndingWipeCycle. Supported values are vehicle specific and might be dynamically corrected. If IsEndingWipeCycle=True then wipers will complete current movement before actuating new TargetPosition. If IsEndingWipeCycle=False then wipers will directly change destination if the TargetPosition is changed.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "7a4a3fdd2947596dbada6980c142f090"
                                                            }
                                                        },
                                                        "comment": "These signals are typically not directly available to the user/driver of the vehicle. The overlay in overlays/extensions/dual_wiper_systems.vspec can be used to modify this branch to support two instances; Primary and Secondary.",
                                                        "description": "Signals to control behavior of wipers in detail. By default VSS expects only one instance.",
                                                        "type": "branch",
                                                        "uuid": "9002ff76166950e0aa3b7c9df3b53468"
                                                    },
                                                    "WiperWear": {
                                                        "datatype": "uint8",
                                                        "description": "Wiper wear as percent. 0 = No Wear. 100 = Worn. Replacement required. Method for calculating or estimating wiper wear is vehicle specific. For windshields with multiple wipers the wear reported shall correspond to the most worn wiper.",
                                                        "max": 100,
                                                        "type": "sensor",
                                                        "uuid": "92c879c11bc65e6da30d582a3928caac"
                                                    }
                                                },
                                                "description": "Windshield wiper signals.",
                                                "type": "branch",
                                                "uuid": "2cffeccdc19a587cbe2264f426c6881a"
                                            }
                                        },
                                        "description": "Windshield signals.",
                                        "type": "branch",
                                        "uuid": "8f0c61e4e4f557d98729210fc3c74f72"
                                    },
                                    "Rear": {
                                        "children": {
                                            "IsHeatingOn": {
                                                "datatype": "boolean",
                                                "description": "Windshield heater status. False - off, True - on.",
                                                "type": "actuator",
                                                "uuid": "76d811b4c4c356f4898dd6383e28bc6f"
                                            },
                                            "WasherFluid": {
                                                "children": {
                                                    "IsLevelLow": {
                                                        "datatype": "boolean",
                                                        "description": "Low level indication for washer fluid. True = Level Low. False = Level OK.",
                                                        "type": "sensor",
                                                        "uuid": "8ca0356548ae54e8af3aeace49e5ed71"
                                                    },
                                                    "Level": {
                                                        "datatype": "uint8",
                                                        "description": "Washer fluid level as a percent. 0 = Empty. 100 = Full.",
                                                        "max": 100,
                                                        "type": "sensor",
                                                        "unit": "percent",
                                                        "uuid": "c167e5b265895c108da1b9582de2dd91"
                                                    }
                                                },
                                                "description": "Windshield washer fluid signals",
                                                "type": "branch",
                                                "uuid": "1ea4ac2370e1567b9b812c1e3020ddfb"
                                            },
                                            "Wiping": {
                                                "children": {
                                                    "Intensity": {
                                                        "datatype": "uint8",
                                                        "description": "Relative intensity/sensitivity for interval and rain sensor mode as requested by user/driver. Has no significance if Windshield.Wiping.Mode is OFF/SLOW/MEDIUM/FAST 0 - wipers inactive. 1 - minimum intensity (lowest frequency/sensitivity, longest interval). 2/3/4/... - higher intensity (higher frequency/sensitivity, shorter interval). Maximum value supported is vehicle specific.",
                                                        "type": "actuator",
                                                        "uuid": "f18b13b9d96b51c492c031d3d86d22da"
                                                    },
                                                    "IsWipersWorn": {
                                                        "datatype": "boolean",
                                                        "description": "Wiper wear status. True = Worn, Replacement recommended or required. False = Not Worn.",
                                                        "type": "sensor",
                                                        "uuid": "0e8d5f7cb6295b908be3a03e8792cca8"
                                                    },
                                                    "Mode": {
                                                        "allowed": [
                                                            "OFF",
                                                            "SLOW",
                                                            "MEDIUM",
                                                            "FAST",
                                                            "INTERVAL",
                                                            "RAIN_SENSOR"
                                                        ],
                                                        "datatype": "string",
                                                        "description": "Wiper mode requested by user/driver. INTERVAL indicates intermittent wiping, with fixed time interval between each wipe. RAIN_SENSOR indicates intermittent wiping based on rain intensity.",
                                                        "type": "actuator",
                                                        "uuid": "8cc0b88ac8b45f5fa30bb7755ce22648"
                                                    },
                                                    "System": {
                                                        "children": {
                                                            "ActualPosition": {
                                                                "comment": "Default parking position might be used as reference position.",
                                                                "datatype": "float",
                                                                "description": "Actual position of main wiper blade for the wiper system relative to reference position. Location of reference position (0 degrees) and direction of positive/negative degrees is vehicle specific.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "eddee2607a135582bbcf3d3afc845892"
                                                            },
                                                            "DriveCurrent": {
                                                                "comment": "May be negative in special situations.",
                                                                "datatype": "float",
                                                                "description": "Actual current used by wiper drive.",
                                                                "type": "sensor",
                                                                "unit": "A",
                                                                "uuid": "7a254692329055dfb4089e2dcc1d4ef3"
                                                            },
                                                            "Frequency": {
                                                                "comment": "Examples - 0 = Wipers stopped, 80 = Wipers doing 80 cycles per minute (in WIPE mode).",
                                                                "datatype": "uint8",
                                                                "description": "Wiping frequency/speed, measured in cycles per minute. The signal concerns the actual speed of the wiper blades when moving. Intervals/pauses are excluded, i.e. the value corresponds to the number of cycles that would be completed in 1 minute if wiping permanently over default range.",
                                                                "type": "actuator",
                                                                "uuid": "371171d971995c999585b028e19be461"
                                                            },
                                                            "IsBlocked": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates if wiper movement is blocked. True = Movement blocked. False = Movement not blocked.",
                                                                "type": "sensor",
                                                                "uuid": "046e818b4dd9595a8301503e9afe028b"
                                                            },
                                                            "IsEndingWipeCycle": {
                                                                "comment": "In continuous wiping between A and B this sensor can be used a trigger to update TargetPosition.",
                                                                "datatype": "boolean",
                                                                "description": "Indicates if current wipe movement is completed or near completion. True = Movement is completed or near completion. Changes to RequestedPosition will be executed first after reaching previous RequestedPosition, if it has not already been reached. False = Movement is not near completion. Any change to RequestedPosition will be executed immediately. Change of direction may not be allowed.",
                                                                "type": "sensor",
                                                                "uuid": "c1357156d87c58f49d4c43c2a6e97c03"
                                                            },
                                                            "IsOverheated": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates if wiper system is overheated. True = Wiper system overheated. False = Wiper system not overheated.",
                                                                "type": "sensor",
                                                                "uuid": "d30bc6f33b995ef491c252980a559ee2"
                                                            },
                                                            "IsPositionReached": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates if a requested position has been reached. IsPositionReached refers to the previous position in case the TargetPosition is updated while IsEndingWipeCycle=True. True = Current or Previous TargetPosition reached. False = Position not (yet) reached, or wipers have moved away from the reached position.",
                                                                "type": "sensor",
                                                                "uuid": "ad35e8d17cd95273b1091dcef2104ea1"
                                                            },
                                                            "IsWiperError": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates system failure. True if wiping is disabled due to system failure.",
                                                                "type": "sensor",
                                                                "uuid": "ac5983deacbe59d7ba1312d44bfd9cd4"
                                                            },
                                                            "IsWiping": {
                                                                "datatype": "boolean",
                                                                "description": "Indicates wiper movement. True if wiper blades are moving. Change of direction shall be considered as IsWiping if wipers will continue to move directly after the change of direction.",
                                                                "type": "sensor",
                                                                "uuid": "4e001bf679e85c9aa7319bafc3a86e75"
                                                            },
                                                            "Mode": {
                                                                "allowed": [
                                                                    "STOP_HOLD",
                                                                    "WIPE",
                                                                    "PLANT_MODE",
                                                                    "EMERGENCY_STOP"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Requested mode of wiper system. STOP_HOLD means that the wipers shall move to position given by TargetPosition and then hold the position. WIPE means that wipers shall move to the position given by TargetPosition and then hold the position if no new TargetPosition is requested. PLANT_MODE means that wiping is disabled. Exact behavior is vehicle specific. EMERGENCY_STOP means that wiping shall be immediately stopped without holding the position.",
                                                                "type": "actuator",
                                                                "uuid": "f2f47522466d570baa7618fac5b0359c"
                                                            },
                                                            "TargetPosition": {
                                                                "comment": "Default parking position might be used as reference position.",
                                                                "datatype": "float",
                                                                "description": "Requested position of main wiper blade for the wiper system relative to reference position. Location of reference position (0 degrees) and direction of positive/negative degrees is vehicle specific. System behavior when receiving TargetPosition depends on Mode and IsEndingWipeCycle. Supported values are vehicle specific and might be dynamically corrected. If IsEndingWipeCycle=True then wipers will complete current movement before actuating new TargetPosition. If IsEndingWipeCycle=False then wipers will directly change destination if the TargetPosition is changed.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "c39bef0760185555904a92a305392080"
                                                            }
                                                        },
                                                        "comment": "These signals are typically not directly available to the user/driver of the vehicle. The overlay in overlays/extensions/dual_wiper_systems.vspec can be used to modify this branch to support two instances; Primary and Secondary.",
                                                        "description": "Signals to control behavior of wipers in detail. By default VSS expects only one instance.",
                                                        "type": "branch",
                                                        "uuid": "a00826f6ecc25c3fae7ad164361bdb33"
                                                    },
                                                    "WiperWear": {
                                                        "datatype": "uint8",
                                                        "description": "Wiper wear as percent. 0 = No Wear. 100 = Worn. Replacement required. Method for calculating or estimating wiper wear is vehicle specific. For windshields with multiple wipers the wear reported shall correspond to the most worn wiper.",
                                                        "max": 100,
                                                        "type": "sensor",
                                                        "uuid": "afd6a352230f5eeaa8ac5f1f188bfd33"
                                                    }
                                                },
                                                "description": "Windshield wiper signals.",
                                                "type": "branch",
                                                "uuid": "f56e80a50fd75dbca48581aea4f012b7"
                                            }
                                        },
                                        "description": "Windshield signals.",
                                        "type": "branch",
                                        "uuid": "095ff58459b854aaa742e56447fe7a93"
                                    }
                                },
                                "description": "Windshield signals.",
                                "type": "branch",
                                "uuid": "73efba535dcb5032b9edc43406b050b8"
                            }
                        },
                        "description": "All body components.",
                        "type": "branch",
                        "uuid": "bd2854e6a9165c5698ce8dd9f0438ecc"
                    },
                    "Cabin": {
                        "children": {
                            "Convertible": {
                                "children": {
                                    "Status": {
                                        "allowed": [
                                            "UNDEFINED",
                                            "CLOSED",
                                            "OPEN",
                                            "CLOSING",
                                            "OPENING",
                                            "STALLED"
                                        ],
                                        "datatype": "string",
                                        "description": "Roof status on convertible vehicles.",
                                        "type": "sensor",
                                        "uuid": "c8812698198a56d7a1adcc8bbe87845f"
                                    }
                                },
                                "description": "Convertible roof.",
                                "type": "branch",
                                "uuid": "2aece85d39d6569e93cf842387a645d9"
                            },
                            "Door": {
                                "children": {
                                    "Row1": {
                                        "children": {
                                            "Left": {
                                                "children": {
                                                    "IsChildLockActive": {
                                                        "datatype": "boolean",
                                                        "description": "Is door child lock engaged. True = Engaged. False = Disengaged.",
                                                        "type": "sensor",
                                                        "uuid": "194a1dd29e245ff8a19dee7e022bad02"
                                                    },
                                                    "IsLocked": {
                                                        "datatype": "boolean",
                                                        "description": "Is door locked or unlocked. True = Locked. False = Unlocked.",
                                                        "type": "actuator",
                                                        "uuid": "859b44ab75de5d67a8beedff883a72d0"
                                                    },
                                                    "IsOpen": {
                                                        "datatype": "boolean",
                                                        "description": "Is door open or closed",
                                                        "type": "actuator",
                                                        "uuid": "a5560fa546985678be670c13a0467545"
                                                    },
                                                    "Shade": {
                                                        "children": {
                                                            "Position": {
                                                                "datatype": "uint8",
                                                                "description": "Position of window blind. 0 = Fully retracted. 100 = Fully deployed.",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "a4c73477293156999f74416245d4f858"
                                                            },
                                                            "Switch": {
                                                                "allowed": [
                                                                    "INACTIVE",
                                                                    "CLOSE",
                                                                    "OPEN",
                                                                    "ONE_SHOT_CLOSE",
                                                                    "ONE_SHOT_OPEN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                                                "type": "actuator",
                                                                "uuid": "15c012ed31a054ecb2b9b2b1cf57e825"
                                                            }
                                                        },
                                                        "description": "Side window shade",
                                                        "type": "branch",
                                                        "uuid": "f1a8db725cfd54c5b22594c456bcb05a"
                                                    },
                                                    "Window": {
                                                        "children": {
                                                            "IsChildLockEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Is window child lock engaged. True = Engaged. False = Disengaged.",
                                                                "type": "sensor",
                                                                "uuid": "618fe1eb106857faaf83f24236ed1819"
                                                            },
                                                            "IsOpen": {
                                                                "datatype": "boolean",
                                                                "description": "Is window open or closed?",
                                                                "type": "sensor",
                                                                "uuid": "e7a98f3520825732922e41eb5b88ac49"
                                                            },
                                                            "Position": {
                                                                "datatype": "uint8",
                                                                "description": "Window position. 0 = Fully closed 100 = Fully opened.",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "sensor",
                                                                "unit": "percent",
                                                                "uuid": "63137367f94856acbb900a0dcdc7e495"
                                                            },
                                                            "Switch": {
                                                                "allowed": [
                                                                    "INACTIVE",
                                                                    "CLOSE",
                                                                    "OPEN",
                                                                    "ONE_SHOT_CLOSE",
                                                                    "ONE_SHOT_OPEN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                                                "type": "actuator",
                                                                "uuid": "e276bf971dae507f99b463f7fe574969"
                                                            }
                                                        },
                                                        "description": "Door window status",
                                                        "type": "branch",
                                                        "uuid": "abbf75f4e6b9581db4aacda0f1e2789c"
                                                    }
                                                },
                                                "description": "All doors, including windows and switches.",
                                                "type": "branch",
                                                "uuid": "ee74ca8275485ea89f70931d3b3e4bed"
                                            },
                                            "Right": {
                                                "children": {
                                                    "IsChildLockActive": {
                                                        "datatype": "boolean",
                                                        "description": "Is door child lock engaged. True = Engaged. False = Disengaged.",
                                                        "type": "sensor",
                                                        "uuid": "2eedf9e01c225ff39ee62a7c11395d6c"
                                                    },
                                                    "IsLocked": {
                                                        "datatype": "boolean",
                                                        "description": "Is door locked or unlocked. True = Locked. False = Unlocked.",
                                                        "type": "actuator",
                                                        "uuid": "7e5cf60543505205922b714cee2a3246"
                                                    },
                                                    "IsOpen": {
                                                        "datatype": "boolean",
                                                        "description": "Is door open or closed",
                                                        "type": "actuator",
                                                        "uuid": "055c01ebe86f507b97d15cfba82482a9"
                                                    },
                                                    "Shade": {
                                                        "children": {
                                                            "Position": {
                                                                "datatype": "uint8",
                                                                "description": "Position of window blind. 0 = Fully retracted. 100 = Fully deployed.",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "22944f205eb45c6f804e481b8dd783c5"
                                                            },
                                                            "Switch": {
                                                                "allowed": [
                                                                    "INACTIVE",
                                                                    "CLOSE",
                                                                    "OPEN",
                                                                    "ONE_SHOT_CLOSE",
                                                                    "ONE_SHOT_OPEN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                                                "type": "actuator",
                                                                "uuid": "763aea099a515fc998fde10d936b0b38"
                                                            }
                                                        },
                                                        "description": "Side window shade",
                                                        "type": "branch",
                                                        "uuid": "f8f91480eb7c59d6ad697f2f9b2f46f1"
                                                    },
                                                    "Window": {
                                                        "children": {
                                                            "IsChildLockEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Is window child lock engaged. True = Engaged. False = Disengaged.",
                                                                "type": "sensor",
                                                                "uuid": "6a65a16ba60c5c41b550a7b5f8b313dd"
                                                            },
                                                            "IsOpen": {
                                                                "datatype": "boolean",
                                                                "description": "Is window open or closed?",
                                                                "type": "sensor",
                                                                "uuid": "90d0fdeaef075b78abab0b710c760393"
                                                            },
                                                            "Position": {
                                                                "datatype": "uint8",
                                                                "description": "Window position. 0 = Fully closed 100 = Fully opened.",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "sensor",
                                                                "unit": "percent",
                                                                "uuid": "e7ef528471eb585a937664abab9fbc68"
                                                            },
                                                            "Switch": {
                                                                "allowed": [
                                                                    "INACTIVE",
                                                                    "CLOSE",
                                                                    "OPEN",
                                                                    "ONE_SHOT_CLOSE",
                                                                    "ONE_SHOT_OPEN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                                                "type": "actuator",
                                                                "uuid": "fcb9ede77f065479a10740324c0efdc6"
                                                            }
                                                        },
                                                        "description": "Door window status",
                                                        "type": "branch",
                                                        "uuid": "12e8cf5eb1c65954bb92f5144e2b22f9"
                                                    }
                                                },
                                                "description": "All doors, including windows and switches.",
                                                "type": "branch",
                                                "uuid": "f1140cf0720157a1a2ffb62745a82916"
                                            }
                                        },
                                        "description": "All doors, including windows and switches.",
                                        "type": "branch",
                                        "uuid": "fd3fcb481cb953dc9a853125c6ca0453"
                                    },
                                    "Row2": {
                                        "children": {
                                            "Left": {
                                                "children": {
                                                    "IsChildLockActive": {
                                                        "datatype": "boolean",
                                                        "description": "Is door child lock engaged. True = Engaged. False = Disengaged.",
                                                        "type": "sensor",
                                                        "uuid": "1c08760700ca5814a62bac4e64628f8e"
                                                    },
                                                    "IsLocked": {
                                                        "datatype": "boolean",
                                                        "description": "Is door locked or unlocked. True = Locked. False = Unlocked.",
                                                        "type": "actuator",
                                                        "uuid": "5fb9d9707cd85925ab6658d90f044b45"
                                                    },
                                                    "IsOpen": {
                                                        "datatype": "boolean",
                                                        "description": "Is door open or closed",
                                                        "type": "actuator",
                                                        "uuid": "0143c6028c355f29ae5b3ee2d31869a8"
                                                    },
                                                    "Shade": {
                                                        "children": {
                                                            "Position": {
                                                                "datatype": "uint8",
                                                                "description": "Position of window blind. 0 = Fully retracted. 100 = Fully deployed.",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "33d7bdce5c915c3ea9633851f4f79cfb"
                                                            },
                                                            "Switch": {
                                                                "allowed": [
                                                                    "INACTIVE",
                                                                    "CLOSE",
                                                                    "OPEN",
                                                                    "ONE_SHOT_CLOSE",
                                                                    "ONE_SHOT_OPEN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                                                "type": "actuator",
                                                                "uuid": "41f6f14bbb595dcf8e51d1696e877114"
                                                            }
                                                        },
                                                        "description": "Side window shade",
                                                        "type": "branch",
                                                        "uuid": "beed1cdec4fb502390041087feaaa1bd"
                                                    },
                                                    "Window": {
                                                        "children": {
                                                            "IsChildLockEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Is window child lock engaged. True = Engaged. False = Disengaged.",
                                                                "type": "sensor",
                                                                "uuid": "f41454131c6d502da452e1b1436e20c1"
                                                            },
                                                            "IsOpen": {
                                                                "datatype": "boolean",
                                                                "description": "Is window open or closed?",
                                                                "type": "sensor",
                                                                "uuid": "6abd32926e7a5b6b9767033063baaf4c"
                                                            },
                                                            "Position": {
                                                                "datatype": "uint8",
                                                                "description": "Window position. 0 = Fully closed 100 = Fully opened.",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "sensor",
                                                                "unit": "percent",
                                                                "uuid": "6eeda05cd5d357958a0b0649b1b406f8"
                                                            },
                                                            "Switch": {
                                                                "allowed": [
                                                                    "INACTIVE",
                                                                    "CLOSE",
                                                                    "OPEN",
                                                                    "ONE_SHOT_CLOSE",
                                                                    "ONE_SHOT_OPEN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                                                "type": "actuator",
                                                                "uuid": "1a5d1c57f46e576a8a94853e2a44d3f8"
                                                            }
                                                        },
                                                        "description": "Door window status",
                                                        "type": "branch",
                                                        "uuid": "424d04d0ae8351af8c7115b131f1fe2e"
                                                    }
                                                },
                                                "description": "All doors, including windows and switches.",
                                                "type": "branch",
                                                "uuid": "20c6ae3bdb9b5fc8b8098d87f06c9069"
                                            },
                                            "Right": {
                                                "children": {
                                                    "IsChildLockActive": {
                                                        "datatype": "boolean",
                                                        "description": "Is door child lock engaged. True = Engaged. False = Disengaged.",
                                                        "type": "sensor",
                                                        "uuid": "c3747fdce0835d9abf8030917f3a6d3c"
                                                    },
                                                    "IsLocked": {
                                                        "datatype": "boolean",
                                                        "description": "Is door locked or unlocked. True = Locked. False = Unlocked.",
                                                        "type": "actuator",
                                                        "uuid": "51e82637cc1a5c6994e1928402a29419"
                                                    },
                                                    "IsOpen": {
                                                        "datatype": "boolean",
                                                        "description": "Is door open or closed",
                                                        "type": "actuator",
                                                        "uuid": "06f3b61e354f5db7b5b0e7f551fac582"
                                                    },
                                                    "Shade": {
                                                        "children": {
                                                            "Position": {
                                                                "datatype": "uint8",
                                                                "description": "Position of window blind. 0 = Fully retracted. 100 = Fully deployed.",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "fa705739512a54e9a103ff356be14df7"
                                                            },
                                                            "Switch": {
                                                                "allowed": [
                                                                    "INACTIVE",
                                                                    "CLOSE",
                                                                    "OPEN",
                                                                    "ONE_SHOT_CLOSE",
                                                                    "ONE_SHOT_OPEN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                                                "type": "actuator",
                                                                "uuid": "5b94a0c4e30a575c93942f0566be8be7"
                                                            }
                                                        },
                                                        "description": "Side window shade",
                                                        "type": "branch",
                                                        "uuid": "092479bc8da55730827f3365828c89b2"
                                                    },
                                                    "Window": {
                                                        "children": {
                                                            "IsChildLockEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Is window child lock engaged. True = Engaged. False = Disengaged.",
                                                                "type": "sensor",
                                                                "uuid": "6f018766950a5b5284ac1e8824fdacb0"
                                                            },
                                                            "IsOpen": {
                                                                "datatype": "boolean",
                                                                "description": "Is window open or closed?",
                                                                "type": "sensor",
                                                                "uuid": "793b5c94b89f5e11bc71cc8a6de8ec34"
                                                            },
                                                            "Position": {
                                                                "datatype": "uint8",
                                                                "description": "Window position. 0 = Fully closed 100 = Fully opened.",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "sensor",
                                                                "unit": "percent",
                                                                "uuid": "f6323b78eecc58e5a9bc5d66f2548ce3"
                                                            },
                                                            "Switch": {
                                                                "allowed": [
                                                                    "INACTIVE",
                                                                    "CLOSE",
                                                                    "OPEN",
                                                                    "ONE_SHOT_CLOSE",
                                                                    "ONE_SHOT_OPEN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                                                "type": "actuator",
                                                                "uuid": "364c0a712fa854b4b1b332eae1be179b"
                                                            }
                                                        },
                                                        "description": "Door window status",
                                                        "type": "branch",
                                                        "uuid": "18950f3ff3a1598585a603c4224ad7bd"
                                                    }
                                                },
                                                "description": "All doors, including windows and switches.",
                                                "type": "branch",
                                                "uuid": "e40a30e4838f5aaa970888d2865bc19e"
                                            }
                                        },
                                        "description": "All doors, including windows and switches.",
                                        "type": "branch",
                                        "uuid": "74c8a76ad2545ceba474a85ae84eec8e"
                                    }
                                },
                                "description": "All doors, including windows and switches.",
                                "type": "branch",
                                "uuid": "fd7f4d16f8965419a9a69fd66b40c1d7"
                            },
                            "DoorCount": {
                                "datatype": "uint8",
                                "default": 4,
                                "description": "Number of doors in vehicle.",
                                "type": "attribute",
                                "uuid": "c293fbef75725c57a9918dd5a34055c4"
                            },
                            "DriverPosition": {
                                "comment": "Default value is position 1, i.e. a typical LHD vehicle.",
                                "datatype": "uint8",
                                "default": 1,
                                "description": "The position of the driver seat in row 1.",
                                "type": "attribute",
                                "uuid": "bca9ccd50358584d8d20865694b0d15f"
                            },
                            "HVAC": {
                                "children": {
                                    "AmbientAirTemperature": {
                                        "datatype": "float",
                                        "description": "Ambient air temperature inside the vehicle.",
                                        "type": "sensor",
                                        "unit": "celsius",
                                        "uuid": "611868a24bc25eb9a837208c235e9491"
                                    },
                                    "IsAirConditioningActive": {
                                        "datatype": "boolean",
                                        "description": "Is Air conditioning active.",
                                        "type": "actuator",
                                        "uuid": "dc4f79e4211c54a6b4eed0236aae84a6"
                                    },
                                    "IsFrontDefrosterActive": {
                                        "datatype": "boolean",
                                        "description": "Is front defroster active.",
                                        "type": "actuator",
                                        "uuid": "afa678c87182544bb6ab81fa6a770791"
                                    },
                                    "IsRearDefrosterActive": {
                                        "datatype": "boolean",
                                        "description": "Is rear defroster active.",
                                        "type": "actuator",
                                        "uuid": "d342a7939f2e5adeaeb5e68e3a314445"
                                    },
                                    "IsRecirculationActive": {
                                        "datatype": "boolean",
                                        "description": "Is recirculation active.",
                                        "type": "actuator",
                                        "uuid": "7b80c41c63b35c9299a410166cd33c81"
                                    },
                                    "Station": {
                                        "children": {
                                            "Row1": {
                                                "children": {
                                                    "Left": {
                                                        "children": {
                                                            "AirDistribution": {
                                                                "allowed": [
                                                                    "UP",
                                                                    "MIDDLE",
                                                                    "DOWN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Direction of airstream",
                                                                "type": "actuator",
                                                                "uuid": "33ca2e1ed1b1533b8e1309320074c07b"
                                                            },
                                                            "FanSpeed": {
                                                                "datatype": "uint8",
                                                                "description": "Fan Speed, 0 = off. 100 = max",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "483bcf787a715f10a1c936464fcb18a2"
                                                            },
                                                            "Temperature": {
                                                                "datatype": "int8",
                                                                "description": "Temperature",
                                                                "type": "actuator",
                                                                "unit": "celsius",
                                                                "uuid": "347c13ff2a735d54a5f011d4573694cd"
                                                            }
                                                        },
                                                        "description": "HVAC for single station in the vehicle",
                                                        "type": "branch",
                                                        "uuid": "7cc0977f55f15f2c884e19a25d07a8b4"
                                                    },
                                                    "Right": {
                                                        "children": {
                                                            "AirDistribution": {
                                                                "allowed": [
                                                                    "UP",
                                                                    "MIDDLE",
                                                                    "DOWN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Direction of airstream",
                                                                "type": "actuator",
                                                                "uuid": "00e25d807a755c4cb978a40ebfc0e8d0"
                                                            },
                                                            "FanSpeed": {
                                                                "datatype": "uint8",
                                                                "description": "Fan Speed, 0 = off. 100 = max",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "4b15871631c35ca583a1fc64524676ef"
                                                            },
                                                            "Temperature": {
                                                                "datatype": "int8",
                                                                "description": "Temperature",
                                                                "type": "actuator",
                                                                "unit": "celsius",
                                                                "uuid": "592dc63c45145f739edbc5677196eb85"
                                                            }
                                                        },
                                                        "description": "HVAC for single station in the vehicle",
                                                        "type": "branch",
                                                        "uuid": "84b84df901075e8a8ac4837fe4af6a8e"
                                                    }
                                                },
                                                "description": "HVAC for single station in the vehicle",
                                                "type": "branch",
                                                "uuid": "80860491fba75babaf3c439d1d471a6d"
                                            },
                                            "Row2": {
                                                "children": {
                                                    "Left": {
                                                        "children": {
                                                            "AirDistribution": {
                                                                "allowed": [
                                                                    "UP",
                                                                    "MIDDLE",
                                                                    "DOWN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Direction of airstream",
                                                                "type": "actuator",
                                                                "uuid": "3c22cd8ac56b59978927fc815ee79104"
                                                            },
                                                            "FanSpeed": {
                                                                "datatype": "uint8",
                                                                "description": "Fan Speed, 0 = off. 100 = max",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "3eb6e8979cb25efe9f33bc89c6b9e364"
                                                            },
                                                            "Temperature": {
                                                                "datatype": "int8",
                                                                "description": "Temperature",
                                                                "type": "actuator",
                                                                "unit": "celsius",
                                                                "uuid": "7185fb43728f53f3960e1284b89a6f66"
                                                            }
                                                        },
                                                        "description": "HVAC for single station in the vehicle",
                                                        "type": "branch",
                                                        "uuid": "48fcecce8d925121b116ed3ecc3157bb"
                                                    },
                                                    "Right": {
                                                        "children": {
                                                            "AirDistribution": {
                                                                "allowed": [
                                                                    "UP",
                                                                    "MIDDLE",
                                                                    "DOWN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Direction of airstream",
                                                                "type": "actuator",
                                                                "uuid": "10d42dd4337450e2af1c0dd2c9dcb3a7"
                                                            },
                                                            "FanSpeed": {
                                                                "datatype": "uint8",
                                                                "description": "Fan Speed, 0 = off. 100 = max",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "b83d6d979cbc5507b1c43e988024c0af"
                                                            },
                                                            "Temperature": {
                                                                "datatype": "int8",
                                                                "description": "Temperature",
                                                                "type": "actuator",
                                                                "unit": "celsius",
                                                                "uuid": "c6822e4c0eae59cab832057bac327c67"
                                                            }
                                                        },
                                                        "description": "HVAC for single station in the vehicle",
                                                        "type": "branch",
                                                        "uuid": "028e4f674c725c009af8eaf77a79d9e7"
                                                    }
                                                },
                                                "description": "HVAC for single station in the vehicle",
                                                "type": "branch",
                                                "uuid": "d98e8f5f94da5acfbf428c635a8bcc0c"
                                            },
                                            "Row3": {
                                                "children": {
                                                    "Left": {
                                                        "children": {
                                                            "AirDistribution": {
                                                                "allowed": [
                                                                    "UP",
                                                                    "MIDDLE",
                                                                    "DOWN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Direction of airstream",
                                                                "type": "actuator",
                                                                "uuid": "f1e2dc36082b5980920c5fe3ee875659"
                                                            },
                                                            "FanSpeed": {
                                                                "datatype": "uint8",
                                                                "description": "Fan Speed, 0 = off. 100 = max",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "13170d23934e5a4ab97174ddee4dc180"
                                                            },
                                                            "Temperature": {
                                                                "datatype": "int8",
                                                                "description": "Temperature",
                                                                "type": "actuator",
                                                                "unit": "celsius",
                                                                "uuid": "b12b9565bd4e5c8e974ac0ff97223af4"
                                                            }
                                                        },
                                                        "description": "HVAC for single station in the vehicle",
                                                        "type": "branch",
                                                        "uuid": "e4d100e0bcb75fedb4ab0761d92bcf0e"
                                                    },
                                                    "Right": {
                                                        "children": {
                                                            "AirDistribution": {
                                                                "allowed": [
                                                                    "UP",
                                                                    "MIDDLE",
                                                                    "DOWN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Direction of airstream",
                                                                "type": "actuator",
                                                                "uuid": "1b6c21042e3b5ac9ae351f807722795a"
                                                            },
                                                            "FanSpeed": {
                                                                "datatype": "uint8",
                                                                "description": "Fan Speed, 0 = off. 100 = max",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "9d5312c0ccc15f578b2c5e5512d34cb3"
                                                            },
                                                            "Temperature": {
                                                                "datatype": "int8",
                                                                "description": "Temperature",
                                                                "type": "actuator",
                                                                "unit": "celsius",
                                                                "uuid": "a76ea2c628df5099b0dca839aac84e63"
                                                            }
                                                        },
                                                        "description": "HVAC for single station in the vehicle",
                                                        "type": "branch",
                                                        "uuid": "a14449b5c1345feb90c2e4fbefd4ecef"
                                                    }
                                                },
                                                "description": "HVAC for single station in the vehicle",
                                                "type": "branch",
                                                "uuid": "6eb8d63b66c859d5b36ef52d264aed2b"
                                            },
                                            "Row4": {
                                                "children": {
                                                    "Left": {
                                                        "children": {
                                                            "AirDistribution": {
                                                                "allowed": [
                                                                    "UP",
                                                                    "MIDDLE",
                                                                    "DOWN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Direction of airstream",
                                                                "type": "actuator",
                                                                "uuid": "ee591723296a580ea4ce9fc6ddbb5cf5"
                                                            },
                                                            "FanSpeed": {
                                                                "datatype": "uint8",
                                                                "description": "Fan Speed, 0 = off. 100 = max",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "afd89e90044e5d5fa99e9c627742adb0"
                                                            },
                                                            "Temperature": {
                                                                "datatype": "int8",
                                                                "description": "Temperature",
                                                                "type": "actuator",
                                                                "unit": "celsius",
                                                                "uuid": "accc4bb43c775735843e87b545af08b2"
                                                            }
                                                        },
                                                        "description": "HVAC for single station in the vehicle",
                                                        "type": "branch",
                                                        "uuid": "4adb4059a21757bdabd902998ffb7da5"
                                                    },
                                                    "Right": {
                                                        "children": {
                                                            "AirDistribution": {
                                                                "allowed": [
                                                                    "UP",
                                                                    "MIDDLE",
                                                                    "DOWN"
                                                                ],
                                                                "datatype": "string",
                                                                "description": "Direction of airstream",
                                                                "type": "actuator",
                                                                "uuid": "7d8b7cbfe68156d4a190a0a7525ee26c"
                                                            },
                                                            "FanSpeed": {
                                                                "datatype": "uint8",
                                                                "description": "Fan Speed, 0 = off. 100 = max",
                                                                "max": 100,
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "percent",
                                                                "uuid": "b3cc73b02e5c5254b691373caacd7d21"
                                                            },
                                                            "Temperature": {
                                                                "datatype": "int8",
                                                                "description": "Temperature",
                                                                "type": "actuator",
                                                                "unit": "celsius",
                                                                "uuid": "49c59496aa7356cf86c275a0eb93ba28"
                                                            }
                                                        },
                                                        "description": "HVAC for single station in the vehicle",
                                                        "type": "branch",
                                                        "uuid": "b4bf2c99c2af580cbb92e0bbd0a40730"
                                                    }
                                                },
                                                "description": "HVAC for single station in the vehicle",
                                                "type": "branch",
                                                "uuid": "ff0c0fa26de7508dbe92a83bc087dff6"
                                            }
                                        },
                                        "description": "HVAC for single station in the vehicle",
                                        "type": "branch",
                                        "uuid": "253e683e6f135b83b6302a30b6c0ec8d"
                                    }
                                },
                                "description": "Climate control",
                                "type": "branch",
                                "uuid": "f8ff34337cdf568e91ab406a365c3249"
                            },
                            "Infotainment": {
                                "children": {
                                    "HMI": {
                                        "children": {
                                            "CurrentLanguage": {
                                                "datatype": "string",
                                                "description": "ISO 639-1 standard language code for the current HMI",
                                                "type": "sensor",
                                                "uuid": "dc29ee5b7f7154b4ab05a9771fe930b3"
                                            },
                                            "DateFormat": {
                                                "allowed": [
                                                    "YYYY_MM_DD",
                                                    "DD_MM_YYYY",
                                                    "MM_DD_YYYY",
                                                    "YY_MM_DD",
                                                    "DD_MM_YY",
                                                    "MM_DD_YY"
                                                ],
                                                "datatype": "string",
                                                "description": "Date format used in the current HMI",
                                                "type": "actuator",
                                                "uuid": "0f03c3955fe953e9893a1f52e964919e"
                                            },
                                            "DayNightMode": {
                                                "allowed": [
                                                    "DAY",
                                                    "NIGHT"
                                                ],
                                                "datatype": "string",
                                                "description": "Current display theme",
                                                "type": "actuator",
                                                "uuid": "a892039ba136588fa26b2670f839c0cc"
                                            },
                                            "DistanceUnit": {
                                                "allowed": [
                                                    "MILES",
                                                    "KILOMETERS"
                                                ],
                                                "datatype": "string",
                                                "description": "Distance unit used in the current HMI",
                                                "type": "actuator",
                                                "uuid": "4b40e8bdb1a053ee9ee35338d8804e7b"
                                            },
                                            "EVEconomyUnits": {
                                                "allowed": [
                                                    "MILES_PER_KILOWATT_HOUR",
                                                    "KILOMETERS_PER_KILOWATT_HOUR",
                                                    "KILOWATT_HOURS_PER_100_MILES",
                                                    "KILOWATT_HOURS_PER_100_KILOMETERS",
                                                    "WATT_HOURS_PER_MILE",
                                                    "WATT_HOURS_PER_KILOMETER"
                                                ],
                                                "datatype": "string",
                                                "description": "EV fuel economy unit used in the current HMI",
                                                "type": "actuator",
                                                "uuid": "914846f6804757ba81ca6bcfac8d2c48"
                                            },
                                            "FuelEconomyUnits": {
                                                "allowed": [
                                                    "MPG_UK",
                                                    "MPG_US",
                                                    "MILES_PER_LITER",
                                                    "KILOMETERS_PER_LITER",
                                                    "LITERS_PER_100_KILOMETERS"
                                                ],
                                                "datatype": "string",
                                                "description": "Fuel economy unit used in the current HMI",
                                                "type": "actuator",
                                                "uuid": "0e6a43ce1aa45243b753545ffa1f0f8c"
                                            },
                                            "TemperatureUnit": {
                                                "allowed": [
                                                    "C",
                                                    "F"
                                                ],
                                                "datatype": "string",
                                                "description": "Temperature unit used in the current HMI",
                                                "type": "actuator",
                                                "uuid": "a7d1533490bb52b6b4f650280e72543d"
                                            },
                                            "TimeFormat": {
                                                "allowed": [
                                                    "HR_12",
                                                    "HR_24"
                                                ],
                                                "datatype": "string",
                                                "description": "Time format used in the current HMI",
                                                "type": "actuator",
                                                "uuid": "73083b87a4e25c02aee672ea32e40005"
                                            }
                                        },
                                        "description": "HMI related signals",
                                        "type": "branch",
                                        "uuid": "271e3d9202825f37bd054820e5ea8141"
                                    },
                                    "Media": {
                                        "children": {
                                            "Action": {
                                                "allowed": [
                                                    "UNKNOWN",
                                                    "STOP",
                                                    "PLAY",
                                                    "FAST_FORWARD",
                                                    "FAST_BACKWARD",
                                                    "SKIP_FORWARD",
                                                    "SKIP_BACKWARD"
                                                ],
                                                "datatype": "string",
                                                "description": "Tells if the media was",
                                                "type": "actuator",
                                                "uuid": "0357aea525bf505981a14e4fc720094e"
                                            },
                                            "DeclinedURI": {
                                                "datatype": "string",
                                                "description": "URI of suggested media that was declined",
                                                "type": "sensor",
                                                "uuid": "51b0d6227db55b92bc35eedd8277f4c4"
                                            },
                                            "Played": {
                                                "children": {
                                                    "Album": {
                                                        "datatype": "string",
                                                        "description": "Name of album being played",
                                                        "type": "sensor",
                                                        "uuid": "1d80b1e2c1085def92b3548b5db2786e"
                                                    },
                                                    "Artist": {
                                                        "datatype": "string",
                                                        "description": "Name of artist being played",
                                                        "type": "sensor",
                                                        "uuid": "076af7ad8aff5110ab5a64d1f58ccdcb"
                                                    },
                                                    "Source": {
                                                        "allowed": [
                                                            "UNKNOWN",
                                                            "SIRIUS_XM",
                                                            "AM",
                                                            "FM",
                                                            "DAB",
                                                            "TV",
                                                            "CD",
                                                            "DVD",
                                                            "AUX",
                                                            "USB",
                                                            "DISK",
                                                            "BLUETOOTH",
                                                            "INTERNET",
                                                            "VOICE",
                                                            "BEEP"
                                                        ],
                                                        "datatype": "string",
                                                        "description": "Media selected for playback",
                                                        "type": "actuator",
                                                        "uuid": "54fb88a7d7cf5e3aab63e8f52415c187"
                                                    },
                                                    "Track": {
                                                        "datatype": "string",
                                                        "description": "Name of track being played",
                                                        "type": "sensor",
                                                        "uuid": "ee800d62a40351e6934649ca75927d69"
                                                    },
                                                    "URI": {
                                                        "datatype": "string",
                                                        "description": "User Resource associated with the media",
                                                        "type": "sensor",
                                                        "uuid": "1ed22b9925c3502d8d1389c8e02d0f07"
                                                    }
                                                },
                                                "description": "Collection of signals updated in concert when a new media is played",
                                                "type": "branch",
                                                "uuid": "6585e9d3b6ff596da72a5f8c98d2d47a"
                                            },
                                            "SelectedURI": {
                                                "datatype": "string",
                                                "description": "URI of suggested media that was selected",
                                                "type": "actuator",
                                                "uuid": "4820f7a961c25e91af12d3417a145d32"
                                            },
                                            "Volume": {
                                                "datatype": "uint8",
                                                "description": "Current Media Volume",
                                                "max": 100,
                                                "min": 0,
                                                "type": "actuator",
                                                "uuid": "8b344688816f5844ae5812bb136c8006"
                                            }
                                        },
                                        "description": "All Media actions",
                                        "type": "branch",
                                        "uuid": "3f324d13873e501a84daf2cfade24d0f"
                                    },
                                    "Navigation": {
                                        "children": {
                                            "DestinationSet": {
                                                "children": {
                                                    "Latitude": {
                                                        "datatype": "double",
                                                        "description": "Latitude of destination in WGS 84 geodetic coordinates.",
                                                        "max": 90,
                                                        "min": -90,
                                                        "type": "actuator",
                                                        "unit": "degrees",
                                                        "uuid": "3e33f3252934565d86de5409c761262b"
                                                    },
                                                    "Longitude": {
                                                        "datatype": "double",
                                                        "description": "Longitude of destination in WGS 84 geodetic coordinates.",
                                                        "max": 180,
                                                        "min": -180,
                                                        "type": "actuator",
                                                        "unit": "degrees",
                                                        "uuid": "e9bd511146ca51639c8d42c0702e22ee"
                                                    }
                                                },
                                                "description": "A navigation has been selected.",
                                                "type": "branch",
                                                "uuid": "f51ce253dc5b58168ecca99297139455"
                                            }
                                        },
                                        "description": "All navigation actions",
                                        "type": "branch",
                                        "uuid": "79bb0cc4acae5d1eb34fb214352d7863"
                                    }
                                },
                                "description": "Infotainment system.",
                                "type": "branch",
                                "uuid": "d88f92fbdda35012a2443b5e130d5eff"
                            },
                            "Lights": {
                                "children": {
                                    "AmbientLight": {
                                        "datatype": "uint8",
                                        "description": "How much ambient light is detected in cabin. 0 = No ambient light. 100 = Full brightness",
                                        "max": 100,
                                        "min": 0,
                                        "type": "sensor",
                                        "unit": "percent",
                                        "uuid": "cf7bf6bc25c2564383e72ef840e4b47d"
                                    },
                                    "IsDomeOn": {
                                        "datatype": "boolean",
                                        "description": "Is central dome light light on",
                                        "type": "actuator",
                                        "uuid": "cc100f4cd2ff5e0593a557a74ebf5d9a"
                                    },
                                    "IsGloveBoxOn": {
                                        "datatype": "boolean",
                                        "description": "Is glove box light on",
                                        "type": "actuator",
                                        "uuid": "f7281175fbc85b4a937b2606e4300f9a"
                                    },
                                    "IsTrunkOn": {
                                        "datatype": "boolean",
                                        "description": "Is trunk light light on",
                                        "type": "actuator",
                                        "uuid": "3697df4cddc751df847fac74bd32390f"
                                    },
                                    "LightIntensity": {
                                        "datatype": "uint8",
                                        "description": "Intensity of the interior lights. 0 = Off. 100 = Full brightness.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "sensor",
                                        "unit": "percent",
                                        "uuid": "a66eba0bae225a56babf3f9ceb65fc76"
                                    },
                                    "Spotlight": {
                                        "children": {
                                            "Row1": {
                                                "children": {
                                                    "IsLeftOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is light on the left side switched on",
                                                        "type": "actuator",
                                                        "uuid": "c6a9c6b14d725113a087ce7e58a9c90b"
                                                    },
                                                    "IsRightOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is light on the right side switched on",
                                                        "type": "actuator",
                                                        "uuid": "7c08ddd9067f5905855cec9f30546fc9"
                                                    },
                                                    "IsSharedOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is a shared light across a specific row on",
                                                        "type": "sensor",
                                                        "uuid": "99614d03c27f50a6a32b99b68814e6d7"
                                                    }
                                                },
                                                "description": "Spotlight for a specific area in the vehicle.",
                                                "type": "branch",
                                                "uuid": "ea2b102268735567b3d7d6c36b34e480"
                                            },
                                            "Row2": {
                                                "children": {
                                                    "IsLeftOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is light on the left side switched on",
                                                        "type": "actuator",
                                                        "uuid": "15534d254ce851509a8dfae763a9d709"
                                                    },
                                                    "IsRightOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is light on the right side switched on",
                                                        "type": "actuator",
                                                        "uuid": "06e866363b5c589db5b446eca0b68c8b"
                                                    },
                                                    "IsSharedOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is a shared light across a specific row on",
                                                        "type": "sensor",
                                                        "uuid": "087dd02860965a61a5cba8c66f8dbd36"
                                                    }
                                                },
                                                "description": "Spotlight for a specific area in the vehicle.",
                                                "type": "branch",
                                                "uuid": "504e514166d255439fd3f61acd3d412b"
                                            },
                                            "Row3": {
                                                "children": {
                                                    "IsLeftOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is light on the left side switched on",
                                                        "type": "actuator",
                                                        "uuid": "f32530172b1a535cba376e660a3a630a"
                                                    },
                                                    "IsRightOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is light on the right side switched on",
                                                        "type": "actuator",
                                                        "uuid": "20424c00cf1d5e49b4287efe186cd263"
                                                    },
                                                    "IsSharedOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is a shared light across a specific row on",
                                                        "type": "sensor",
                                                        "uuid": "87f00a029ec854d39702ef86e030c00c"
                                                    }
                                                },
                                                "description": "Spotlight for a specific area in the vehicle.",
                                                "type": "branch",
                                                "uuid": "c0352a193354597692626b6f0b6d9537"
                                            },
                                            "Row4": {
                                                "children": {
                                                    "IsLeftOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is light on the left side switched on",
                                                        "type": "actuator",
                                                        "uuid": "643c07780d2453e98b5091a39516f7ec"
                                                    },
                                                    "IsRightOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is light on the right side switched on",
                                                        "type": "actuator",
                                                        "uuid": "f012d37429aa53d1bf8648d686a804ef"
                                                    },
                                                    "IsSharedOn": {
                                                        "datatype": "boolean",
                                                        "description": "Is a shared light across a specific row on",
                                                        "type": "sensor",
                                                        "uuid": "8f8de6d5b18f5cc69c9ecd556ce6b6ed"
                                                    }
                                                },
                                                "description": "Spotlight for a specific area in the vehicle.",
                                                "type": "branch",
                                                "uuid": "42c09d108927563293adcb93738895a0"
                                            }
                                        },
                                        "description": "Spotlight for a specific area in the vehicle.",
                                        "type": "branch",
                                        "uuid": "8528c64a4c775da3ab01617bbff2e3c9"
                                    }
                                },
                                "description": "Interior lights signals and sensors.",
                                "type": "branch",
                                "uuid": "8b5cd8c4d1e752b38c65a5966c870ccb"
                            },
                            "RearShade": {
                                "children": {
                                    "Position": {
                                        "datatype": "uint8",
                                        "description": "Position of window blind. 0 = Fully retracted. 100 = Fully deployed.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "actuator",
                                        "unit": "percent",
                                        "uuid": "9e16fc53f2ec575dbf66c79f969949a9"
                                    },
                                    "Switch": {
                                        "allowed": [
                                            "INACTIVE",
                                            "CLOSE",
                                            "OPEN",
                                            "ONE_SHOT_CLOSE",
                                            "ONE_SHOT_OPEN"
                                        ],
                                        "datatype": "string",
                                        "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                        "type": "actuator",
                                        "uuid": "da9f01e9baf35544842f1a7674c5172a"
                                    }
                                },
                                "description": "Rear window shade.",
                                "type": "branch",
                                "uuid": "8a0c86f4fc6f5ea8ac8cf8f327969dcc"
                            },
                            "RearviewMirror": {
                                "children": {
                                    "DimmingLevel": {
                                        "datatype": "uint8",
                                        "description": "Dimming level of rearview mirror. 0 = undimmed. 100 = fully dimmed.",
                                        "max": 100,
                                        "type": "actuator",
                                        "unit": "percent",
                                        "uuid": "4e2bcbaa6dc1586d8282324b475e5dee"
                                    }
                                },
                                "description": "Rearview mirror.",
                                "type": "branch",
                                "uuid": "e655b654ab9f55bbb04952a99755efae"
                            },
                            "Seat": {
                                "children": {
                                    "Row1": {
                                        "children": {
                                            "Pos1": {
                                                "children": {
                                                    "Airbag": {
                                                        "children": {
                                                            "IsDeployed": {
                                                                "datatype": "boolean",
                                                                "description": "Airbag deployment status. True = Airbag deployed. False = Airbag not deployed.",
                                                                "type": "sensor",
                                                                "uuid": "49cc2754a4385ef8bdd8ba4e81ae91f6"
                                                            }
                                                        },
                                                        "description": "Airbag signals.",
                                                        "type": "branch",
                                                        "uuid": "51c12c552b745ead85e10392cd42791f"
                                                    },
                                                    "Backrest": {
                                                        "children": {
                                                            "Lumbar": {
                                                                "children": {
                                                                    "Height": {
                                                                        "datatype": "uint8",
                                                                        "description": "Height of lumbar support. Position is relative within available movable range of the lumbar support. 0 = Lowermost position supported.",
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "mm",
                                                                        "uuid": "2093f65ca1085a8fab20837e00218461"
                                                                    },
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Lumbar support (in/out position). 0 = Innermost position. 100 = Outermost position.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "c072a2f72b9554b2b45d81a352bc48ad"
                                                                    }
                                                                },
                                                                "description": "Adjustable lumbar support mechanisms in seats allow the user to change the seat back shape.",
                                                                "type": "branch",
                                                                "uuid": "58ce084f42255af281ba9827af2f69de"
                                                            },
                                                            "Recline": {
                                                                "comment": "Seat z-axis depends on seat tilt. This means that movement of backrest due to seat tilting will not affect Backrest.Recline as long as the angle between Seating and Backrest are constant. Absolute recline relative to vehicle z-axis can be calculated as Tilt + Backrest.Recline.",
                                                                "datatype": "float",
                                                                "description": "Backrest recline compared to seat z-axis (seat vertical axis). 0 degrees = Upright/Vertical backrest. Negative degrees for forward recline. Positive degrees for backward recline.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "b1d538f0eb1658639e64f024e1a42831"
                                                            },
                                                            "SideBolster": {
                                                                "children": {
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Side bolster support. 0 = Minimum support (widest side bolster setting). 100 = Maximum support.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "b9a59ddb83995d6381d38ebdd19fb4b9"
                                                                    }
                                                                },
                                                                "description": "Backrest side bolster (lumbar side support) settings.",
                                                                "type": "branch",
                                                                "uuid": "dc92cbf22f7a54bca076ca9e64dde9e6"
                                                            }
                                                        },
                                                        "description": "Describes signals related to the backrest of the seat.",
                                                        "type": "branch",
                                                        "uuid": "b088e24466215c55b4e3b1ca84321fb9"
                                                    },
                                                    "Headrest": {
                                                        "children": {
                                                            "Angle": {
                                                                "datatype": "float",
                                                                "description": "Headrest angle, relative to backrest, 0 degrees if parallel to backrest, Positive degrees = tilted forward.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "a438c09436955cdd859b08848642464e"
                                                            },
                                                            "Height": {
                                                                "datatype": "uint8",
                                                                "description": "Position of headrest relative to movable range of the head rest. 0 = Bottommost position supported.",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "04fbc8b58fb1507ca46e133f502212a8"
                                                            }
                                                        },
                                                        "description": "Headrest settings.",
                                                        "type": "branch",
                                                        "uuid": "1b08f767214753648ce939fc23e7d530"
                                                    },
                                                    "Heating": {
                                                        "datatype": "int8",
                                                        "description": "Seat cooling / heating. 0 = off. -100 = max cold. +100 = max heat.",
                                                        "max": 100,
                                                        "min": -100,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "6055f646e52c58959fe7c89e7e5e77df"
                                                    },
                                                    "Height": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle z-axis. Position is relative within available movable range of the seating. 0 = Lowermost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "a28e02777f0652c09282c639b2ab0a63"
                                                    },
                                                    "IsBelted": {
                                                        "datatype": "boolean",
                                                        "description": "Is the belt engaged.",
                                                        "type": "sensor",
                                                        "uuid": "6bd16a2258d152919db77e9592ac837a"
                                                    },
                                                    "IsOccupied": {
                                                        "datatype": "boolean",
                                                        "description": "Does the seat have a passenger in it.",
                                                        "type": "sensor",
                                                        "uuid": "4e85e2b0ec45582f90f2a17b3636ccc0"
                                                    },
                                                    "Massage": {
                                                        "datatype": "uint8",
                                                        "description": "Seat massage level. 0 = off. 100 = max massage.",
                                                        "max": 100,
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "0e668142a0855c31845050e3535ff1b3"
                                                    },
                                                    "Occupant": {
                                                        "children": {
                                                            "Identifier": {
                                                                "children": {
                                                                    "Issuer": {
                                                                        "datatype": "string",
                                                                        "description": "Unique Issuer for the authentication of the occupant. E.g. https://accounts.funcorp.com.",
                                                                        "type": "sensor",
                                                                        "uuid": "c631b08751b851ec9b12ade8332ba5e6"
                                                                    },
                                                                    "Subject": {
                                                                        "datatype": "string",
                                                                        "description": "Subject for the authentication of the occupant. E.g. UserID 7331677.",
                                                                        "type": "sensor",
                                                                        "uuid": "8df99b3fedff5a219eacf254fb299ffb"
                                                                    }
                                                                },
                                                                "description": "Identifier attributes based on OAuth 2.0.",
                                                                "type": "branch",
                                                                "uuid": "473c3f152df7564589d0e09947ae428f"
                                                            }
                                                        },
                                                        "description": "Occupant data.",
                                                        "type": "branch",
                                                        "uuid": "e2303f18abb35b25932e97165858fa2e"
                                                    },
                                                    "Position": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle x-axis. Position is relative to the frontmost position supported by the seat. 0 = Frontmost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "78283eb5efee58f8bce8b5fa3760df54"
                                                    },
                                                    "Seating": {
                                                        "children": {
                                                            "Length": {
                                                                "datatype": "uint16",
                                                                "description": "Length adjustment of seating. 0 = Adjustable part of seating in rearmost position (Shortest length of seating).",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "365425c0104757ae9d14c29c0cc61f78"
                                                            }
                                                        },
                                                        "comment": "Seating is here considered as the part of the seat that supports the thighs. Additional cushions (if any) for support of lower legs is not covered by this branch.",
                                                        "description": "Describes signals related to the seating/base of the seat.",
                                                        "type": "branch",
                                                        "uuid": "0cfad6a333b651f4b3adc589a19bd8c2"
                                                    },
                                                    "Switch": {
                                                        "children": {
                                                            "Backrest": {
                                                                "children": {
                                                                    "IsReclineBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline backward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "d21af34f33955fdf8a35b2909f1db5ae"
                                                                    },
                                                                    "IsReclineForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline forward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "fd1e56d716d2594b84e1c46b00ab47a5"
                                                                    },
                                                                    "Lumbar": {
                                                                        "children": {
                                                                            "IsDownEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar down switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "01644b70287d5d1ba9a2f0c9770dadb8"
                                                                            },
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "757b1f58b4c558429b1d3f11f1a89e6f"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "3542721cf4cc5d8c86e9f8e4a3f36736"
                                                                            },
                                                                            "IsUpEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar up switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "ceceff9c973453d3bec25db6a56be86c"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.Lumbar.",
                                                                        "type": "branch",
                                                                        "uuid": "61bb2068d2355dad9ab5ef35709ce97a"
                                                                    },
                                                                    "SideBolster": {
                                                                        "children": {
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "cc76940524925bf3883918b8ee30d702"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "515bd1ca932a5747b8f8523aa5e26466"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.SideBolster.",
                                                                        "type": "branch",
                                                                        "uuid": "b49b7c0aa3135e209bb7888e143a6823"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the backrest of the seat.",
                                                                "type": "branch",
                                                                "uuid": "b45a8ec5ab9251689f42d58d2d954c4e"
                                                            },
                                                            "Headrest": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest backward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "6ec4a46af3db57cc9d4c45923996923c"
                                                                    },
                                                                    "IsDownEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest down switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "0d844cc3591453b48177a3ed45880e21"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest forward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "ca96e4f18b1753faab74e2d4c452d8df"
                                                                    },
                                                                    "IsUpEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest up switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "a603834c5eae54a78222d20515bd64df"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Headrest.",
                                                                "type": "branch",
                                                                "uuid": "e3d3659aed435d7c9bb58bad03590d3a"
                                                            },
                                                            "IsBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat backward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "6a28f8e404f05a5b9339b3a40b8c0275"
                                                            },
                                                            "IsCoolerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Cooler switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "abab10f2fc1753fc9276f4571d24b3ac"
                                                            },
                                                            "IsDownEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat down switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "2f758e9b09dc518693db398d31551eeb"
                                                            },
                                                            "IsForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat forward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "849766f5f3885f9ba0c4cd817290b6a1"
                                                            },
                                                            "IsTiltBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt backward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "810dfaf2b68950e7b695efbfdd80f58a"
                                                            },
                                                            "IsTiltForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt forward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "ee55f014fe5c59c8a3808f64b0c51f9e"
                                                            },
                                                            "IsUpEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat up switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "efb6bf4955d45232b8443c3428ec91c2"
                                                            },
                                                            "IsWarmerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Warmer switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "f60421d441985b5bb8f68fabae1e937a"
                                                            },
                                                            "Massage": {
                                                                "children": {
                                                                    "IsDecreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Decrease massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "c6209e1fd41e5efbbe3b70910068533b"
                                                                    },
                                                                    "IsIncreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Increase massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "3500d7caafe458e19dac56fcff1ada61"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Massage.",
                                                                "type": "branch",
                                                                "uuid": "46a23e294875537d9ce222d748dd43ef"
                                                            },
                                                            "Seating": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to decrease seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "b623d9fd81d658c7a4872550065a26f0"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to increase seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "8ef4c44f8e42567f89c1ff54dd337e91"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the seating of the seat.",
                                                                "type": "branch",
                                                                "uuid": "250088210ce059c7a262331242ef1408"
                                                            }
                                                        },
                                                        "description": "Seat switch signals",
                                                        "type": "branch",
                                                        "uuid": "6aeff0a2d48f5f28995f83cc5ada057d"
                                                    },
                                                    "Tilt": {
                                                        "datatype": "float",
                                                        "description": "Tilting of seat relative to vehicle z-axis. 0 = seating is flat, seat and vehicle z-axis are parallel. Positive degrees = seat tilted backwards, seat z-axis is tilted backward.",
                                                        "type": "actuator",
                                                        "unit": "degrees",
                                                        "uuid": "20630968a82f53bc89aed9797e0b9c59"
                                                    }
                                                },
                                                "description": "All seats.",
                                                "type": "branch",
                                                "uuid": "9f570421f00a53f19f3741bd4e53303b"
                                            },
                                            "Pos2": {
                                                "children": {
                                                    "Airbag": {
                                                        "children": {
                                                            "IsDeployed": {
                                                                "datatype": "boolean",
                                                                "description": "Airbag deployment status. True = Airbag deployed. False = Airbag not deployed.",
                                                                "type": "sensor",
                                                                "uuid": "d65c423837db53ebbfd462ead6c92687"
                                                            }
                                                        },
                                                        "description": "Airbag signals.",
                                                        "type": "branch",
                                                        "uuid": "8150bc56e95453f4be691ee05241fa1a"
                                                    },
                                                    "Backrest": {
                                                        "children": {
                                                            "Lumbar": {
                                                                "children": {
                                                                    "Height": {
                                                                        "datatype": "uint8",
                                                                        "description": "Height of lumbar support. Position is relative within available movable range of the lumbar support. 0 = Lowermost position supported.",
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "mm",
                                                                        "uuid": "3c282a3edb5c504e83f32ba674c3d0fc"
                                                                    },
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Lumbar support (in/out position). 0 = Innermost position. 100 = Outermost position.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "049baabba96d52a5b1936acc45cb6e2c"
                                                                    }
                                                                },
                                                                "description": "Adjustable lumbar support mechanisms in seats allow the user to change the seat back shape.",
                                                                "type": "branch",
                                                                "uuid": "26c099ebe82b5131abd9dd9af4ae9eeb"
                                                            },
                                                            "Recline": {
                                                                "comment": "Seat z-axis depends on seat tilt. This means that movement of backrest due to seat tilting will not affect Backrest.Recline as long as the angle between Seating and Backrest are constant. Absolute recline relative to vehicle z-axis can be calculated as Tilt + Backrest.Recline.",
                                                                "datatype": "float",
                                                                "description": "Backrest recline compared to seat z-axis (seat vertical axis). 0 degrees = Upright/Vertical backrest. Negative degrees for forward recline. Positive degrees for backward recline.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "a30da9db6ae45d4d80fbd81952d94479"
                                                            },
                                                            "SideBolster": {
                                                                "children": {
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Side bolster support. 0 = Minimum support (widest side bolster setting). 100 = Maximum support.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "63d6501d545350d7bd98d377bf43c45d"
                                                                    }
                                                                },
                                                                "description": "Backrest side bolster (lumbar side support) settings.",
                                                                "type": "branch",
                                                                "uuid": "2435afb459d85aa49907dcfcf0adc3f5"
                                                            }
                                                        },
                                                        "description": "Describes signals related to the backrest of the seat.",
                                                        "type": "branch",
                                                        "uuid": "a53f27317a3e5a7c8a0ed7df44c4e0b0"
                                                    },
                                                    "Headrest": {
                                                        "children": {
                                                            "Angle": {
                                                                "datatype": "float",
                                                                "description": "Headrest angle, relative to backrest, 0 degrees if parallel to backrest, Positive degrees = tilted forward.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "73491bcc68d850849cd6cbb7c2d4fdb1"
                                                            },
                                                            "Height": {
                                                                "datatype": "uint8",
                                                                "description": "Position of headrest relative to movable range of the head rest. 0 = Bottommost position supported.",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "2d8573879aaa5b28bcdf425c82bc6aa2"
                                                            }
                                                        },
                                                        "description": "Headrest settings.",
                                                        "type": "branch",
                                                        "uuid": "8a6f8868590653b7adce26541a66e531"
                                                    },
                                                    "Heating": {
                                                        "datatype": "int8",
                                                        "description": "Seat cooling / heating. 0 = off. -100 = max cold. +100 = max heat.",
                                                        "max": 100,
                                                        "min": -100,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "eae672cc71dc5046bf1bdef59b8cd980"
                                                    },
                                                    "Height": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle z-axis. Position is relative within available movable range of the seating. 0 = Lowermost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "fc3b3498a15c5417aadbbce4f758a6d5"
                                                    },
                                                    "IsBelted": {
                                                        "datatype": "boolean",
                                                        "description": "Is the belt engaged.",
                                                        "type": "sensor",
                                                        "uuid": "ee2919e0ffdd5a939a1b86b570c14112"
                                                    },
                                                    "IsOccupied": {
                                                        "datatype": "boolean",
                                                        "description": "Does the seat have a passenger in it.",
                                                        "type": "sensor",
                                                        "uuid": "4d0cdff266e45dd2a8a878b572d34b7e"
                                                    },
                                                    "Massage": {
                                                        "datatype": "uint8",
                                                        "description": "Seat massage level. 0 = off. 100 = max massage.",
                                                        "max": 100,
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "c1935863d503574fb5d20b703974399c"
                                                    },
                                                    "Occupant": {
                                                        "children": {
                                                            "Identifier": {
                                                                "children": {
                                                                    "Issuer": {
                                                                        "datatype": "string",
                                                                        "description": "Unique Issuer for the authentication of the occupant. E.g. https://accounts.funcorp.com.",
                                                                        "type": "sensor",
                                                                        "uuid": "f88bffa4714d57f8b61b1034c57190ff"
                                                                    },
                                                                    "Subject": {
                                                                        "datatype": "string",
                                                                        "description": "Subject for the authentication of the occupant. E.g. UserID 7331677.",
                                                                        "type": "sensor",
                                                                        "uuid": "f8f67096b9e35197a3e199e9171c4872"
                                                                    }
                                                                },
                                                                "description": "Identifier attributes based on OAuth 2.0.",
                                                                "type": "branch",
                                                                "uuid": "ac22e6c5d43053b383f14c6b712b0698"
                                                            }
                                                        },
                                                        "description": "Occupant data.",
                                                        "type": "branch",
                                                        "uuid": "d85baab0f292585b912fd8ba8eae234f"
                                                    },
                                                    "Position": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle x-axis. Position is relative to the frontmost position supported by the seat. 0 = Frontmost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "f14a3e9eaaf35012a8be3782b6a53f55"
                                                    },
                                                    "Seating": {
                                                        "children": {
                                                            "Length": {
                                                                "datatype": "uint16",
                                                                "description": "Length adjustment of seating. 0 = Adjustable part of seating in rearmost position (Shortest length of seating).",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "cef5936e042158fd9259018d9895b860"
                                                            }
                                                        },
                                                        "comment": "Seating is here considered as the part of the seat that supports the thighs. Additional cushions (if any) for support of lower legs is not covered by this branch.",
                                                        "description": "Describes signals related to the seating/base of the seat.",
                                                        "type": "branch",
                                                        "uuid": "ce6a7323a8b45ef8aef48bfce9704dec"
                                                    },
                                                    "Switch": {
                                                        "children": {
                                                            "Backrest": {
                                                                "children": {
                                                                    "IsReclineBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline backward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "524f91af31e150b8aca5de230369be7f"
                                                                    },
                                                                    "IsReclineForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline forward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "e5bd5743807c5b899098d22e6cc3a4bc"
                                                                    },
                                                                    "Lumbar": {
                                                                        "children": {
                                                                            "IsDownEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar down switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "3491b91384f95975851e64636514f52f"
                                                                            },
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "af092a25f40a5003b7354f5f580b0e11"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "1ae05b08ed295d4f8305abc26088cca2"
                                                                            },
                                                                            "IsUpEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar up switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "da6a3f596a5c5db2b5984356087278d4"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.Lumbar.",
                                                                        "type": "branch",
                                                                        "uuid": "b05d8f4aa67c5e28af3a6dc957786834"
                                                                    },
                                                                    "SideBolster": {
                                                                        "children": {
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "5e6fa87ef4fd563d97299bc2d88300d1"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "33b758ca51f15403a398ef3072dcaae2"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.SideBolster.",
                                                                        "type": "branch",
                                                                        "uuid": "07ff192c99275f8e88451c79ceb7aa03"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the backrest of the seat.",
                                                                "type": "branch",
                                                                "uuid": "79b1c57ac9245a5ca426a8b5e21717a6"
                                                            },
                                                            "Headrest": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest backward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "556de341eb5052489018ae6ff95310e2"
                                                                    },
                                                                    "IsDownEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest down switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "2245feeb2eeb54e3b9303bc2dc232de6"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest forward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "39e5e43777ab5af9ba972a6da265a4f1"
                                                                    },
                                                                    "IsUpEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest up switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "f182830bd5955b85b8e755895d578b03"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Headrest.",
                                                                "type": "branch",
                                                                "uuid": "250bfde61cbe52659913655dd521fa0f"
                                                            },
                                                            "IsBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat backward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "861eca7954cb554e9fb8a21568126e10"
                                                            },
                                                            "IsCoolerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Cooler switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "d3e2606f6cdc57759850f19e1ce8c4f2"
                                                            },
                                                            "IsDownEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat down switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "7da73beabcbc5f338bc68e9b5e3daf06"
                                                            },
                                                            "IsForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat forward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "28ff94d05f795705928644e5a0101e8b"
                                                            },
                                                            "IsTiltBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt backward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "0482452fd1a3501d96e06ee7c5dba6dd"
                                                            },
                                                            "IsTiltForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt forward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "d0433b6d2d965fecb9384ac5205de397"
                                                            },
                                                            "IsUpEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat up switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "3906c493560e5c5686c69f0d2aa65e91"
                                                            },
                                                            "IsWarmerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Warmer switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "61eb1ede01d45ff2a6a4eec903741a08"
                                                            },
                                                            "Massage": {
                                                                "children": {
                                                                    "IsDecreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Decrease massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "b655bf7a99015d638a6d7177aa6d89e9"
                                                                    },
                                                                    "IsIncreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Increase massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "8d81938f575756199e1c604f6a51677e"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Massage.",
                                                                "type": "branch",
                                                                "uuid": "82f1b4ee3b9c58998115117f6e8c39a7"
                                                            },
                                                            "Seating": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to decrease seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "e6d761d8e77651dab939076cdc8bd529"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to increase seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "4081bab44a1d5da1b70a5dc158f2ae39"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the seating of the seat.",
                                                                "type": "branch",
                                                                "uuid": "de12f83c5e425b6b9a9ef9e90b030fda"
                                                            }
                                                        },
                                                        "description": "Seat switch signals",
                                                        "type": "branch",
                                                        "uuid": "dd54a1a61c7c5d79a420edb7b1755aa1"
                                                    },
                                                    "Tilt": {
                                                        "datatype": "float",
                                                        "description": "Tilting of seat relative to vehicle z-axis. 0 = seating is flat, seat and vehicle z-axis are parallel. Positive degrees = seat tilted backwards, seat z-axis is tilted backward.",
                                                        "type": "actuator",
                                                        "unit": "degrees",
                                                        "uuid": "6156f12b768e56929c7d325c4bbe1d78"
                                                    }
                                                },
                                                "description": "All seats.",
                                                "type": "branch",
                                                "uuid": "614cecf6380d5c23989d2c8bf20bd8c3"
                                            },
                                            "Pos3": {
                                                "children": {
                                                    "Airbag": {
                                                        "children": {
                                                            "IsDeployed": {
                                                                "datatype": "boolean",
                                                                "description": "Airbag deployment status. True = Airbag deployed. False = Airbag not deployed.",
                                                                "type": "sensor",
                                                                "uuid": "c4e9b66d938d5e188ac577094daaf37e"
                                                            }
                                                        },
                                                        "description": "Airbag signals.",
                                                        "type": "branch",
                                                        "uuid": "243d103c16055180abef52fef071ad22"
                                                    },
                                                    "Backrest": {
                                                        "children": {
                                                            "Lumbar": {
                                                                "children": {
                                                                    "Height": {
                                                                        "datatype": "uint8",
                                                                        "description": "Height of lumbar support. Position is relative within available movable range of the lumbar support. 0 = Lowermost position supported.",
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "mm",
                                                                        "uuid": "4a529381905750be9c09a1bfec05eabd"
                                                                    },
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Lumbar support (in/out position). 0 = Innermost position. 100 = Outermost position.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "127744c26ebe5c729d69a95bfe96b00e"
                                                                    }
                                                                },
                                                                "description": "Adjustable lumbar support mechanisms in seats allow the user to change the seat back shape.",
                                                                "type": "branch",
                                                                "uuid": "678e3d997c295575ba6337464fe2a912"
                                                            },
                                                            "Recline": {
                                                                "comment": "Seat z-axis depends on seat tilt. This means that movement of backrest due to seat tilting will not affect Backrest.Recline as long as the angle between Seating and Backrest are constant. Absolute recline relative to vehicle z-axis can be calculated as Tilt + Backrest.Recline.",
                                                                "datatype": "float",
                                                                "description": "Backrest recline compared to seat z-axis (seat vertical axis). 0 degrees = Upright/Vertical backrest. Negative degrees for forward recline. Positive degrees for backward recline.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "dc901384498f5de6b93b2a5b3850fb87"
                                                            },
                                                            "SideBolster": {
                                                                "children": {
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Side bolster support. 0 = Minimum support (widest side bolster setting). 100 = Maximum support.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "dba595a898b75345bf1d013a45261681"
                                                                    }
                                                                },
                                                                "description": "Backrest side bolster (lumbar side support) settings.",
                                                                "type": "branch",
                                                                "uuid": "605ae18d7b4e5613ac7252ee35df58c1"
                                                            }
                                                        },
                                                        "description": "Describes signals related to the backrest of the seat.",
                                                        "type": "branch",
                                                        "uuid": "ce7b00453a0a53d3b6e6cbc395bd5c78"
                                                    },
                                                    "Headrest": {
                                                        "children": {
                                                            "Angle": {
                                                                "datatype": "float",
                                                                "description": "Headrest angle, relative to backrest, 0 degrees if parallel to backrest, Positive degrees = tilted forward.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "b4d77cf7a7f55768b3910435e79027f2"
                                                            },
                                                            "Height": {
                                                                "datatype": "uint8",
                                                                "description": "Position of headrest relative to movable range of the head rest. 0 = Bottommost position supported.",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "420eaf9bc7ac5560a26ad018afe27e1b"
                                                            }
                                                        },
                                                        "description": "Headrest settings.",
                                                        "type": "branch",
                                                        "uuid": "1714ccbc269f59ee807a51c7f1a6103b"
                                                    },
                                                    "Heating": {
                                                        "datatype": "int8",
                                                        "description": "Seat cooling / heating. 0 = off. -100 = max cold. +100 = max heat.",
                                                        "max": 100,
                                                        "min": -100,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "4af67468dd7a55a58195d9b61997d077"
                                                    },
                                                    "Height": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle z-axis. Position is relative within available movable range of the seating. 0 = Lowermost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "d19199de59a153f782b8d61788c510a7"
                                                    },
                                                    "IsBelted": {
                                                        "datatype": "boolean",
                                                        "description": "Is the belt engaged.",
                                                        "type": "sensor",
                                                        "uuid": "975fe66f9fa05d8ca7fb9d334641bb97"
                                                    },
                                                    "IsOccupied": {
                                                        "datatype": "boolean",
                                                        "description": "Does the seat have a passenger in it.",
                                                        "type": "sensor",
                                                        "uuid": "1540906a83bd5f70af4859910aafd890"
                                                    },
                                                    "Massage": {
                                                        "datatype": "uint8",
                                                        "description": "Seat massage level. 0 = off. 100 = max massage.",
                                                        "max": 100,
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "d63d68381ec65f50a8dd6dfbc0bd751d"
                                                    },
                                                    "Occupant": {
                                                        "children": {
                                                            "Identifier": {
                                                                "children": {
                                                                    "Issuer": {
                                                                        "datatype": "string",
                                                                        "description": "Unique Issuer for the authentication of the occupant. E.g. https://accounts.funcorp.com.",
                                                                        "type": "sensor",
                                                                        "uuid": "0d29fa2a1b97563c8e1ba31b8571f328"
                                                                    },
                                                                    "Subject": {
                                                                        "datatype": "string",
                                                                        "description": "Subject for the authentication of the occupant. E.g. UserID 7331677.",
                                                                        "type": "sensor",
                                                                        "uuid": "a7306a24de2155f2a1de070bc8f1bd60"
                                                                    }
                                                                },
                                                                "description": "Identifier attributes based on OAuth 2.0.",
                                                                "type": "branch",
                                                                "uuid": "f59d9531974256cab958e5e31588565d"
                                                            }
                                                        },
                                                        "description": "Occupant data.",
                                                        "type": "branch",
                                                        "uuid": "4e68d3feef825f6f99c44cec9f7c1217"
                                                    },
                                                    "Position": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle x-axis. Position is relative to the frontmost position supported by the seat. 0 = Frontmost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "2a2ba0e42dcc563cba80cc491b66c45f"
                                                    },
                                                    "Seating": {
                                                        "children": {
                                                            "Length": {
                                                                "datatype": "uint16",
                                                                "description": "Length adjustment of seating. 0 = Adjustable part of seating in rearmost position (Shortest length of seating).",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "c44b283345dd5a428bd099ed1153d4a4"
                                                            }
                                                        },
                                                        "comment": "Seating is here considered as the part of the seat that supports the thighs. Additional cushions (if any) for support of lower legs is not covered by this branch.",
                                                        "description": "Describes signals related to the seating/base of the seat.",
                                                        "type": "branch",
                                                        "uuid": "4c98bb65b4095480bdc7262b902a767a"
                                                    },
                                                    "Switch": {
                                                        "children": {
                                                            "Backrest": {
                                                                "children": {
                                                                    "IsReclineBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline backward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "1861981891f959dc896e00f4e369c86d"
                                                                    },
                                                                    "IsReclineForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline forward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "2a8cc40fb0b3556da210b7dfce7c0c6d"
                                                                    },
                                                                    "Lumbar": {
                                                                        "children": {
                                                                            "IsDownEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar down switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "9a3655967c5b5f058e01c0b3770ba0d3"
                                                                            },
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "0f0708693e605289af83c3a1ecfd3159"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "6d590f0db798515b8d8e6f0bf1abfd67"
                                                                            },
                                                                            "IsUpEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar up switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "663dca40a7645e66adfa00d64223dbbe"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.Lumbar.",
                                                                        "type": "branch",
                                                                        "uuid": "08b8112168d1584ab6fa8f594016745f"
                                                                    },
                                                                    "SideBolster": {
                                                                        "children": {
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "53a56a868fb3593fb21378b2d4dbbc7c"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "05b0ef6b02e55bb2814bcd95d9b77bd9"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.SideBolster.",
                                                                        "type": "branch",
                                                                        "uuid": "46c9fbf2750b517f8d1c09fee21fdd06"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the backrest of the seat.",
                                                                "type": "branch",
                                                                "uuid": "ad180dd9d2de56cf911dfc35d47c46fb"
                                                            },
                                                            "Headrest": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest backward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "cc633d8a000a5da3b0efe50e520e21fa"
                                                                    },
                                                                    "IsDownEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest down switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "4ed2d91060bf5e578746b4b2f5a3e671"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest forward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "6ad93c92d96a59838e4810f0425f1fb0"
                                                                    },
                                                                    "IsUpEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest up switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "89b2444c58c457bd936ecef543e7cc96"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Headrest.",
                                                                "type": "branch",
                                                                "uuid": "e04ee2c9d0f852c983136186bb15be4c"
                                                            },
                                                            "IsBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat backward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "52d8da88ec95586a93952ea3d59023ad"
                                                            },
                                                            "IsCoolerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Cooler switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "f5ed89b2972e5461abb6966e30a906ff"
                                                            },
                                                            "IsDownEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat down switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "66e1d88d56ba572db7b97a5e20cc724c"
                                                            },
                                                            "IsForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat forward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "a3661e29e11957ed9cc12bb385b896bf"
                                                            },
                                                            "IsTiltBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt backward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "ed590c68f1085a3c9889fc571ace2176"
                                                            },
                                                            "IsTiltForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt forward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "8eeefcb4a08e5d9f8eae76e92826e56e"
                                                            },
                                                            "IsUpEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat up switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "1240dc083504580b97ba1cfadb9da659"
                                                            },
                                                            "IsWarmerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Warmer switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "0d7eed9ccb24537fb7f97f0163a4fdd8"
                                                            },
                                                            "Massage": {
                                                                "children": {
                                                                    "IsDecreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Decrease massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "329dfaaab56f55a39ca9c132ee4bf533"
                                                                    },
                                                                    "IsIncreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Increase massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "6d09e331ceb55a2691f120a6f1205cbb"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Massage.",
                                                                "type": "branch",
                                                                "uuid": "a2c4a3a39758594d9e89a635bab499cb"
                                                            },
                                                            "Seating": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to decrease seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "b9829f44a76857e0bc9deeb036ecd311"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to increase seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "c8ab873dd8fb51dd9493fb00f33e01d6"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the seating of the seat.",
                                                                "type": "branch",
                                                                "uuid": "b1ff7876dbab59f2bf7358c932a7e1fb"
                                                            }
                                                        },
                                                        "description": "Seat switch signals",
                                                        "type": "branch",
                                                        "uuid": "1eda245135ce5788bfcbc75b082af947"
                                                    },
                                                    "Tilt": {
                                                        "datatype": "float",
                                                        "description": "Tilting of seat relative to vehicle z-axis. 0 = seating is flat, seat and vehicle z-axis are parallel. Positive degrees = seat tilted backwards, seat z-axis is tilted backward.",
                                                        "type": "actuator",
                                                        "unit": "degrees",
                                                        "uuid": "9fb74b71b3ce54f4af6e5e472f159949"
                                                    }
                                                },
                                                "description": "All seats.",
                                                "type": "branch",
                                                "uuid": "add6f181ffd35d03b57d9833e7e22f4f"
                                            }
                                        },
                                        "description": "All seats.",
                                        "type": "branch",
                                        "uuid": "7a420ddeac6f538eb3939bb4a242d136"
                                    },
                                    "Row2": {
                                        "children": {
                                            "Pos1": {
                                                "children": {
                                                    "Airbag": {
                                                        "children": {
                                                            "IsDeployed": {
                                                                "datatype": "boolean",
                                                                "description": "Airbag deployment status. True = Airbag deployed. False = Airbag not deployed.",
                                                                "type": "sensor",
                                                                "uuid": "fea5a0ef57385df68e486ece13546bdf"
                                                            }
                                                        },
                                                        "description": "Airbag signals.",
                                                        "type": "branch",
                                                        "uuid": "ccfadedface05d54bcc00b30082b30d6"
                                                    },
                                                    "Backrest": {
                                                        "children": {
                                                            "Lumbar": {
                                                                "children": {
                                                                    "Height": {
                                                                        "datatype": "uint8",
                                                                        "description": "Height of lumbar support. Position is relative within available movable range of the lumbar support. 0 = Lowermost position supported.",
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "mm",
                                                                        "uuid": "6cdd33ee68a65349bd478c3afbc515c4"
                                                                    },
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Lumbar support (in/out position). 0 = Innermost position. 100 = Outermost position.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "f8fd42a3227d5c6a96834becd1247f5e"
                                                                    }
                                                                },
                                                                "description": "Adjustable lumbar support mechanisms in seats allow the user to change the seat back shape.",
                                                                "type": "branch",
                                                                "uuid": "363835bd81535538a10acfe914f4c3cc"
                                                            },
                                                            "Recline": {
                                                                "comment": "Seat z-axis depends on seat tilt. This means that movement of backrest due to seat tilting will not affect Backrest.Recline as long as the angle between Seating and Backrest are constant. Absolute recline relative to vehicle z-axis can be calculated as Tilt + Backrest.Recline.",
                                                                "datatype": "float",
                                                                "description": "Backrest recline compared to seat z-axis (seat vertical axis). 0 degrees = Upright/Vertical backrest. Negative degrees for forward recline. Positive degrees for backward recline.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "4e793f7e663558b29130989024763680"
                                                            },
                                                            "SideBolster": {
                                                                "children": {
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Side bolster support. 0 = Minimum support (widest side bolster setting). 100 = Maximum support.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "87cedae0f6ba58a0940859642b89fdb0"
                                                                    }
                                                                },
                                                                "description": "Backrest side bolster (lumbar side support) settings.",
                                                                "type": "branch",
                                                                "uuid": "1484136aa6ec5a46b6f2449b9506a5dd"
                                                            }
                                                        },
                                                        "description": "Describes signals related to the backrest of the seat.",
                                                        "type": "branch",
                                                        "uuid": "9e8063f29cf05c1892c1b5606fd05329"
                                                    },
                                                    "Headrest": {
                                                        "children": {
                                                            "Angle": {
                                                                "datatype": "float",
                                                                "description": "Headrest angle, relative to backrest, 0 degrees if parallel to backrest, Positive degrees = tilted forward.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "7a720646e0d657c5b10979f1c403eb4b"
                                                            },
                                                            "Height": {
                                                                "datatype": "uint8",
                                                                "description": "Position of headrest relative to movable range of the head rest. 0 = Bottommost position supported.",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "12d45094d6c9545089e932a2462d5f68"
                                                            }
                                                        },
                                                        "description": "Headrest settings.",
                                                        "type": "branch",
                                                        "uuid": "d8486ab7d8195559a4e8e7baebb888ef"
                                                    },
                                                    "Heating": {
                                                        "datatype": "int8",
                                                        "description": "Seat cooling / heating. 0 = off. -100 = max cold. +100 = max heat.",
                                                        "max": 100,
                                                        "min": -100,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "0f61ef421bcd5c8dbe6a5b477cb10a49"
                                                    },
                                                    "Height": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle z-axis. Position is relative within available movable range of the seating. 0 = Lowermost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "6e6e7aadfd0d52d4ac877147d84540d0"
                                                    },
                                                    "IsBelted": {
                                                        "datatype": "boolean",
                                                        "description": "Is the belt engaged.",
                                                        "type": "sensor",
                                                        "uuid": "ad65078f81075a67babb66ecd2c902f7"
                                                    },
                                                    "IsOccupied": {
                                                        "datatype": "boolean",
                                                        "description": "Does the seat have a passenger in it.",
                                                        "type": "sensor",
                                                        "uuid": "e8c5a3df63b15e8a83f0b16b6a77092f"
                                                    },
                                                    "Massage": {
                                                        "datatype": "uint8",
                                                        "description": "Seat massage level. 0 = off. 100 = max massage.",
                                                        "max": 100,
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "406607948a235d829c5da212594813b1"
                                                    },
                                                    "Occupant": {
                                                        "children": {
                                                            "Identifier": {
                                                                "children": {
                                                                    "Issuer": {
                                                                        "datatype": "string",
                                                                        "description": "Unique Issuer for the authentication of the occupant. E.g. https://accounts.funcorp.com.",
                                                                        "type": "sensor",
                                                                        "uuid": "188458a15b30577d8fb01d0f15641a6e"
                                                                    },
                                                                    "Subject": {
                                                                        "datatype": "string",
                                                                        "description": "Subject for the authentication of the occupant. E.g. UserID 7331677.",
                                                                        "type": "sensor",
                                                                        "uuid": "159e7daad966588ca48997859b811b72"
                                                                    }
                                                                },
                                                                "description": "Identifier attributes based on OAuth 2.0.",
                                                                "type": "branch",
                                                                "uuid": "aba17bf3b5175e56bf047839f2a0f880"
                                                            }
                                                        },
                                                        "description": "Occupant data.",
                                                        "type": "branch",
                                                        "uuid": "e7ab950f55b45b1a985f1a9d132aad02"
                                                    },
                                                    "Position": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle x-axis. Position is relative to the frontmost position supported by the seat. 0 = Frontmost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "3dd247aae2555a1ebaf76ae4017f23bb"
                                                    },
                                                    "Seating": {
                                                        "children": {
                                                            "Length": {
                                                                "datatype": "uint16",
                                                                "description": "Length adjustment of seating. 0 = Adjustable part of seating in rearmost position (Shortest length of seating).",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "9eabbf5a69cd51c88de9e70eb9545750"
                                                            }
                                                        },
                                                        "comment": "Seating is here considered as the part of the seat that supports the thighs. Additional cushions (if any) for support of lower legs is not covered by this branch.",
                                                        "description": "Describes signals related to the seating/base of the seat.",
                                                        "type": "branch",
                                                        "uuid": "8fb01973fdad529d83ebf60514cad67c"
                                                    },
                                                    "Switch": {
                                                        "children": {
                                                            "Backrest": {
                                                                "children": {
                                                                    "IsReclineBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline backward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "0b5415702e0b5461afacea857c05a6fe"
                                                                    },
                                                                    "IsReclineForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline forward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "1e1bbfda10e25d228e01a632277d57c3"
                                                                    },
                                                                    "Lumbar": {
                                                                        "children": {
                                                                            "IsDownEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar down switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "09337347e2f557fe8649342548c7fe3c"
                                                                            },
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "12fe41df5ab8545e8a3e7b2411585243"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "73e6514d130e5bfb85d4cfb7c45d8138"
                                                                            },
                                                                            "IsUpEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar up switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "47f8690805455b8c927f2834942b2ded"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.Lumbar.",
                                                                        "type": "branch",
                                                                        "uuid": "4dc489e632e15d13afd6601188ed08b3"
                                                                    },
                                                                    "SideBolster": {
                                                                        "children": {
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "f5e3fae9d90954ad9a240b72fa0a5cb4"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "a7dc6c8941805c47b837334abfa7abee"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.SideBolster.",
                                                                        "type": "branch",
                                                                        "uuid": "184e9cc9d42e5ec993593da10b1b8299"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the backrest of the seat.",
                                                                "type": "branch",
                                                                "uuid": "4cc0b73f30e65456a6268f52ad7fee70"
                                                            },
                                                            "Headrest": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest backward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "9ed038b597665225a0f2dfd262cf59b5"
                                                                    },
                                                                    "IsDownEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest down switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "4d3d29ccfcde55f9bdf40eeeb7ecf5dc"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest forward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "ae9cdee6019a567ebac3e85a909fe7ca"
                                                                    },
                                                                    "IsUpEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest up switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "f929508b3527553a959952bcd227f70e"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Headrest.",
                                                                "type": "branch",
                                                                "uuid": "f803a25975405ed38684b3f065535a4a"
                                                            },
                                                            "IsBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat backward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "57d1ff9eaf4e5a7cbe683c13eed6e691"
                                                            },
                                                            "IsCoolerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Cooler switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "ac1a8efdbafb561bb11af807d48e8378"
                                                            },
                                                            "IsDownEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat down switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "fd41789d95035c2fa1e855d22eab80fa"
                                                            },
                                                            "IsForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat forward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "33ed964275af591d85773bc23d70bd68"
                                                            },
                                                            "IsTiltBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt backward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "22726fefa40d5805b46b2c87e43782ed"
                                                            },
                                                            "IsTiltForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt forward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "f557b6a2712f5307b56577d93b9e746f"
                                                            },
                                                            "IsUpEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat up switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "3dacf86cf185576f8a3916a315c69b1d"
                                                            },
                                                            "IsWarmerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Warmer switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "97a36b155294512f8c409a9bc82635bc"
                                                            },
                                                            "Massage": {
                                                                "children": {
                                                                    "IsDecreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Decrease massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "d1f9e86a98be5f2ca81ac11d05356bb6"
                                                                    },
                                                                    "IsIncreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Increase massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "7b656c6aa62c5156aab2d437a03bd074"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Massage.",
                                                                "type": "branch",
                                                                "uuid": "4857aac12637502da76202384a151715"
                                                            },
                                                            "Seating": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to decrease seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "c02ddbb0e2c1536081dae3cb23baf4b1"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to increase seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "f0ef5926752f573ea02dacb2a242c8a1"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the seating of the seat.",
                                                                "type": "branch",
                                                                "uuid": "1a3e7380e61852c98eda0f38e9f807aa"
                                                            }
                                                        },
                                                        "description": "Seat switch signals",
                                                        "type": "branch",
                                                        "uuid": "1c4b708222de55aabddb3697308253ee"
                                                    },
                                                    "Tilt": {
                                                        "datatype": "float",
                                                        "description": "Tilting of seat relative to vehicle z-axis. 0 = seating is flat, seat and vehicle z-axis are parallel. Positive degrees = seat tilted backwards, seat z-axis is tilted backward.",
                                                        "type": "actuator",
                                                        "unit": "degrees",
                                                        "uuid": "c61e74d2ae795b4da2e35325f8734005"
                                                    }
                                                },
                                                "description": "All seats.",
                                                "type": "branch",
                                                "uuid": "ba975a6536f15545851d27972ab1fffe"
                                            },
                                            "Pos2": {
                                                "children": {
                                                    "Airbag": {
                                                        "children": {
                                                            "IsDeployed": {
                                                                "datatype": "boolean",
                                                                "description": "Airbag deployment status. True = Airbag deployed. False = Airbag not deployed.",
                                                                "type": "sensor",
                                                                "uuid": "668f397bc95358989119fb1cfdfa8a01"
                                                            }
                                                        },
                                                        "description": "Airbag signals.",
                                                        "type": "branch",
                                                        "uuid": "07f9f55e33055cf7bebdc06e7d5a6a14"
                                                    },
                                                    "Backrest": {
                                                        "children": {
                                                            "Lumbar": {
                                                                "children": {
                                                                    "Height": {
                                                                        "datatype": "uint8",
                                                                        "description": "Height of lumbar support. Position is relative within available movable range of the lumbar support. 0 = Lowermost position supported.",
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "mm",
                                                                        "uuid": "6389ff80f23e5985b734207d97a4a58e"
                                                                    },
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Lumbar support (in/out position). 0 = Innermost position. 100 = Outermost position.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "fcbec0664f315476b901bd4f0b1df006"
                                                                    }
                                                                },
                                                                "description": "Adjustable lumbar support mechanisms in seats allow the user to change the seat back shape.",
                                                                "type": "branch",
                                                                "uuid": "b69532b796ca54a1a897b28270fe0e56"
                                                            },
                                                            "Recline": {
                                                                "comment": "Seat z-axis depends on seat tilt. This means that movement of backrest due to seat tilting will not affect Backrest.Recline as long as the angle between Seating and Backrest are constant. Absolute recline relative to vehicle z-axis can be calculated as Tilt + Backrest.Recline.",
                                                                "datatype": "float",
                                                                "description": "Backrest recline compared to seat z-axis (seat vertical axis). 0 degrees = Upright/Vertical backrest. Negative degrees for forward recline. Positive degrees for backward recline.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "b260c18880c75c92a635b9dc887fadca"
                                                            },
                                                            "SideBolster": {
                                                                "children": {
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Side bolster support. 0 = Minimum support (widest side bolster setting). 100 = Maximum support.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "5b7bbfe5ce975a79a029a839a91ebafb"
                                                                    }
                                                                },
                                                                "description": "Backrest side bolster (lumbar side support) settings.",
                                                                "type": "branch",
                                                                "uuid": "ff84905ea881586dafbdfa2268888ba4"
                                                            }
                                                        },
                                                        "description": "Describes signals related to the backrest of the seat.",
                                                        "type": "branch",
                                                        "uuid": "25a2e0b3833f55c1a0b8ad2589ad2a18"
                                                    },
                                                    "Headrest": {
                                                        "children": {
                                                            "Angle": {
                                                                "datatype": "float",
                                                                "description": "Headrest angle, relative to backrest, 0 degrees if parallel to backrest, Positive degrees = tilted forward.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "d3d4f0a7f5c15072b80f88c2743b77be"
                                                            },
                                                            "Height": {
                                                                "datatype": "uint8",
                                                                "description": "Position of headrest relative to movable range of the head rest. 0 = Bottommost position supported.",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "1e955420a3d6591e84aa2b6bbd2bed18"
                                                            }
                                                        },
                                                        "description": "Headrest settings.",
                                                        "type": "branch",
                                                        "uuid": "46dcaa7ca75d57c7a5301b7107538812"
                                                    },
                                                    "Heating": {
                                                        "datatype": "int8",
                                                        "description": "Seat cooling / heating. 0 = off. -100 = max cold. +100 = max heat.",
                                                        "max": 100,
                                                        "min": -100,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "c7eb6ca24426596dab519386d231a9d1"
                                                    },
                                                    "Height": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle z-axis. Position is relative within available movable range of the seating. 0 = Lowermost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "3cf2e042421b540da4aa047680dcdf84"
                                                    },
                                                    "IsBelted": {
                                                        "datatype": "boolean",
                                                        "description": "Is the belt engaged.",
                                                        "type": "sensor",
                                                        "uuid": "f2c9c2d624bb5cf4bf9aba5842eb96eb"
                                                    },
                                                    "IsOccupied": {
                                                        "datatype": "boolean",
                                                        "description": "Does the seat have a passenger in it.",
                                                        "type": "sensor",
                                                        "uuid": "dc1eaa7cab895c5198af0c7f5dea9d79"
                                                    },
                                                    "Massage": {
                                                        "datatype": "uint8",
                                                        "description": "Seat massage level. 0 = off. 100 = max massage.",
                                                        "max": 100,
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "77e8a4d481315520927fc0828158772e"
                                                    },
                                                    "Occupant": {
                                                        "children": {
                                                            "Identifier": {
                                                                "children": {
                                                                    "Issuer": {
                                                                        "datatype": "string",
                                                                        "description": "Unique Issuer for the authentication of the occupant. E.g. https://accounts.funcorp.com.",
                                                                        "type": "sensor",
                                                                        "uuid": "6f4e6a9f8008536eae03197601a6366a"
                                                                    },
                                                                    "Subject": {
                                                                        "datatype": "string",
                                                                        "description": "Subject for the authentication of the occupant. E.g. UserID 7331677.",
                                                                        "type": "sensor",
                                                                        "uuid": "ae49d70515d55aad9b4719d8162b43c9"
                                                                    }
                                                                },
                                                                "description": "Identifier attributes based on OAuth 2.0.",
                                                                "type": "branch",
                                                                "uuid": "24c23b9f5adb549483cb52acbd81a980"
                                                            }
                                                        },
                                                        "description": "Occupant data.",
                                                        "type": "branch",
                                                        "uuid": "30e72777238850ff8a01c3a8f85b663e"
                                                    },
                                                    "Position": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle x-axis. Position is relative to the frontmost position supported by the seat. 0 = Frontmost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "7c24fa880576550da14bae1e5eed26b9"
                                                    },
                                                    "Seating": {
                                                        "children": {
                                                            "Length": {
                                                                "datatype": "uint16",
                                                                "description": "Length adjustment of seating. 0 = Adjustable part of seating in rearmost position (Shortest length of seating).",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "fbdac9db983b5f52a900d24cf2d424c4"
                                                            }
                                                        },
                                                        "comment": "Seating is here considered as the part of the seat that supports the thighs. Additional cushions (if any) for support of lower legs is not covered by this branch.",
                                                        "description": "Describes signals related to the seating/base of the seat.",
                                                        "type": "branch",
                                                        "uuid": "899171a0b84a563daf6cea0542405031"
                                                    },
                                                    "Switch": {
                                                        "children": {
                                                            "Backrest": {
                                                                "children": {
                                                                    "IsReclineBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline backward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "366a8acb011b5997a07930a1b7e62e69"
                                                                    },
                                                                    "IsReclineForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline forward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "fd142d6b8b1353118a5c6e6afb635145"
                                                                    },
                                                                    "Lumbar": {
                                                                        "children": {
                                                                            "IsDownEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar down switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "1092743255ee5cb7a11b172f2d6a9f2e"
                                                                            },
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "7dc46ce3336f5c6ab31fe33e52a56cb5"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "475e608bc2aa50f8ad9eea738415d7e3"
                                                                            },
                                                                            "IsUpEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar up switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "5f6c6804d50955ec8a898a890120a126"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.Lumbar.",
                                                                        "type": "branch",
                                                                        "uuid": "ed202bc72cd75d5d940f8b7eedfce763"
                                                                    },
                                                                    "SideBolster": {
                                                                        "children": {
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "f9edf7174eda59a0a2403450939a4a00"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "4b8c68ce106155b78b40f09cc000dfdd"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.SideBolster.",
                                                                        "type": "branch",
                                                                        "uuid": "69625c26aabf50fda25c5389994ad485"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the backrest of the seat.",
                                                                "type": "branch",
                                                                "uuid": "1abd0c2387ea56479575b324795cdf2e"
                                                            },
                                                            "Headrest": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest backward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "5a6c05fe3aa854199b3a2d83a91ff07d"
                                                                    },
                                                                    "IsDownEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest down switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "a1bab160e2bf563b991b22c820ae17c4"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest forward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "aa43a5239e255308b617306b71723c5b"
                                                                    },
                                                                    "IsUpEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest up switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "5b096959633953a9b7c4c52af0c85fa9"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Headrest.",
                                                                "type": "branch",
                                                                "uuid": "077d7df6106f5d04884a5f44f917493a"
                                                            },
                                                            "IsBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat backward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "19c46bf9c19955a1a619fd3311b5236e"
                                                            },
                                                            "IsCoolerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Cooler switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "0d72a18529d55286be69d517c94cbb74"
                                                            },
                                                            "IsDownEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat down switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "3774266336e05ddbacadd2ef017568b1"
                                                            },
                                                            "IsForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat forward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "79d68b154c12508d91f28bedafb47a43"
                                                            },
                                                            "IsTiltBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt backward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "c587834e47e651e3b1556b6f7b4c738d"
                                                            },
                                                            "IsTiltForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt forward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "90cdb504ff1a5d0bb512fe7034c7bf07"
                                                            },
                                                            "IsUpEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat up switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "7b1f9f36a4f65e7a8aad6b94c186ec00"
                                                            },
                                                            "IsWarmerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Warmer switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "e0a9b4614dbb5c4fbd3e333a73edf8b0"
                                                            },
                                                            "Massage": {
                                                                "children": {
                                                                    "IsDecreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Decrease massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "20b139513267583e8a4a2374fcde2626"
                                                                    },
                                                                    "IsIncreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Increase massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "32fff40566d95d0cb36ed76100e515c3"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Massage.",
                                                                "type": "branch",
                                                                "uuid": "1fabf329e8715f28b90b72a8a5b6c3de"
                                                            },
                                                            "Seating": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to decrease seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "8f8492873cb05b9098e8eb564a43394a"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to increase seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "4f2b176b4f1657fe8395439df7376d12"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the seating of the seat.",
                                                                "type": "branch",
                                                                "uuid": "10ccb625321652e5a12470d14ff7ecd0"
                                                            }
                                                        },
                                                        "description": "Seat switch signals",
                                                        "type": "branch",
                                                        "uuid": "f3fdef2159cb5cda985cbc04220c3593"
                                                    },
                                                    "Tilt": {
                                                        "datatype": "float",
                                                        "description": "Tilting of seat relative to vehicle z-axis. 0 = seating is flat, seat and vehicle z-axis are parallel. Positive degrees = seat tilted backwards, seat z-axis is tilted backward.",
                                                        "type": "actuator",
                                                        "unit": "degrees",
                                                        "uuid": "9f95869d8b0f5d9886bef2cc664414aa"
                                                    }
                                                },
                                                "description": "All seats.",
                                                "type": "branch",
                                                "uuid": "e8afa112abe75fda9ce3e1f0d712713d"
                                            },
                                            "Pos3": {
                                                "children": {
                                                    "Airbag": {
                                                        "children": {
                                                            "IsDeployed": {
                                                                "datatype": "boolean",
                                                                "description": "Airbag deployment status. True = Airbag deployed. False = Airbag not deployed.",
                                                                "type": "sensor",
                                                                "uuid": "6802243fcb3155b196cca3a825c12bcb"
                                                            }
                                                        },
                                                        "description": "Airbag signals.",
                                                        "type": "branch",
                                                        "uuid": "e1d14ad055955eac914a47ee180a6e78"
                                                    },
                                                    "Backrest": {
                                                        "children": {
                                                            "Lumbar": {
                                                                "children": {
                                                                    "Height": {
                                                                        "datatype": "uint8",
                                                                        "description": "Height of lumbar support. Position is relative within available movable range of the lumbar support. 0 = Lowermost position supported.",
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "mm",
                                                                        "uuid": "38b30eb99fd35c5693c18361c566c6e9"
                                                                    },
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Lumbar support (in/out position). 0 = Innermost position. 100 = Outermost position.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "b227f493bab0503589b3a54c30ade03c"
                                                                    }
                                                                },
                                                                "description": "Adjustable lumbar support mechanisms in seats allow the user to change the seat back shape.",
                                                                "type": "branch",
                                                                "uuid": "2410df6d719c56a58617644a8afc7240"
                                                            },
                                                            "Recline": {
                                                                "comment": "Seat z-axis depends on seat tilt. This means that movement of backrest due to seat tilting will not affect Backrest.Recline as long as the angle between Seating and Backrest are constant. Absolute recline relative to vehicle z-axis can be calculated as Tilt + Backrest.Recline.",
                                                                "datatype": "float",
                                                                "description": "Backrest recline compared to seat z-axis (seat vertical axis). 0 degrees = Upright/Vertical backrest. Negative degrees for forward recline. Positive degrees for backward recline.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "867a9d4d4e685407906d561946921c24"
                                                            },
                                                            "SideBolster": {
                                                                "children": {
                                                                    "Support": {
                                                                        "datatype": "float",
                                                                        "description": "Side bolster support. 0 = Minimum support (widest side bolster setting). 100 = Maximum support.",
                                                                        "max": 100,
                                                                        "min": 0,
                                                                        "type": "actuator",
                                                                        "unit": "percent",
                                                                        "uuid": "b4cef1fd83d653aca5c941865bbf96b7"
                                                                    }
                                                                },
                                                                "description": "Backrest side bolster (lumbar side support) settings.",
                                                                "type": "branch",
                                                                "uuid": "d52ea54e1d725eb88fa1c061a07a3217"
                                                            }
                                                        },
                                                        "description": "Describes signals related to the backrest of the seat.",
                                                        "type": "branch",
                                                        "uuid": "561be9f8b4f9587bb0d139cc33071742"
                                                    },
                                                    "Headrest": {
                                                        "children": {
                                                            "Angle": {
                                                                "datatype": "float",
                                                                "description": "Headrest angle, relative to backrest, 0 degrees if parallel to backrest, Positive degrees = tilted forward.",
                                                                "type": "actuator",
                                                                "unit": "degrees",
                                                                "uuid": "bf6f63ab87e453af965c90f0495ea972"
                                                            },
                                                            "Height": {
                                                                "datatype": "uint8",
                                                                "description": "Position of headrest relative to movable range of the head rest. 0 = Bottommost position supported.",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "2ae8b66df4045f46a96acbcdd6d2d452"
                                                            }
                                                        },
                                                        "description": "Headrest settings.",
                                                        "type": "branch",
                                                        "uuid": "a14ecc5524645ca883e2838f666bce70"
                                                    },
                                                    "Heating": {
                                                        "datatype": "int8",
                                                        "description": "Seat cooling / heating. 0 = off. -100 = max cold. +100 = max heat.",
                                                        "max": 100,
                                                        "min": -100,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "2a175561eed05247b3048263c0122fa1"
                                                    },
                                                    "Height": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle z-axis. Position is relative within available movable range of the seating. 0 = Lowermost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "077a21fca4d857dd81debfd81119bc73"
                                                    },
                                                    "IsBelted": {
                                                        "datatype": "boolean",
                                                        "description": "Is the belt engaged.",
                                                        "type": "sensor",
                                                        "uuid": "815f9e1dc05b5078aaefc3868319b18b"
                                                    },
                                                    "IsOccupied": {
                                                        "datatype": "boolean",
                                                        "description": "Does the seat have a passenger in it.",
                                                        "type": "sensor",
                                                        "uuid": "018a7ef68dd75f0ea391c7d8191acd9d"
                                                    },
                                                    "Massage": {
                                                        "datatype": "uint8",
                                                        "description": "Seat massage level. 0 = off. 100 = max massage.",
                                                        "max": 100,
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "percent",
                                                        "uuid": "fffccf6ae6365b83ab093031f573e452"
                                                    },
                                                    "Occupant": {
                                                        "children": {
                                                            "Identifier": {
                                                                "children": {
                                                                    "Issuer": {
                                                                        "datatype": "string",
                                                                        "description": "Unique Issuer for the authentication of the occupant. E.g. https://accounts.funcorp.com.",
                                                                        "type": "sensor",
                                                                        "uuid": "d96b225635b959a1aea0d6febb955ae8"
                                                                    },
                                                                    "Subject": {
                                                                        "datatype": "string",
                                                                        "description": "Subject for the authentication of the occupant. E.g. UserID 7331677.",
                                                                        "type": "sensor",
                                                                        "uuid": "ea36896f5572580b9d8379a6256f61b5"
                                                                    }
                                                                },
                                                                "description": "Identifier attributes based on OAuth 2.0.",
                                                                "type": "branch",
                                                                "uuid": "296e51d414a65cea96e1eea27dc3e1dd"
                                                            }
                                                        },
                                                        "description": "Occupant data.",
                                                        "type": "branch",
                                                        "uuid": "a8df9afde2335f8ab7cf4b185148f20e"
                                                    },
                                                    "Position": {
                                                        "datatype": "uint16",
                                                        "description": "Seat position on vehicle x-axis. Position is relative to the frontmost position supported by the seat. 0 = Frontmost position supported.",
                                                        "min": 0,
                                                        "type": "actuator",
                                                        "unit": "mm",
                                                        "uuid": "64eb763cc10358b49968797fbf50c092"
                                                    },
                                                    "Seating": {
                                                        "children": {
                                                            "Length": {
                                                                "datatype": "uint16",
                                                                "description": "Length adjustment of seating. 0 = Adjustable part of seating in rearmost position (Shortest length of seating).",
                                                                "min": 0,
                                                                "type": "actuator",
                                                                "unit": "mm",
                                                                "uuid": "b188311a9fd95b9195b28ab7be00d68f"
                                                            }
                                                        },
                                                        "comment": "Seating is here considered as the part of the seat that supports the thighs. Additional cushions (if any) for support of lower legs is not covered by this branch.",
                                                        "description": "Describes signals related to the seating/base of the seat.",
                                                        "type": "branch",
                                                        "uuid": "1dcb55c75dd55fc0bf752fcf17ba79be"
                                                    },
                                                    "Switch": {
                                                        "children": {
                                                            "Backrest": {
                                                                "children": {
                                                                    "IsReclineBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline backward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "eed918c7f0b558a99bbe804582a31b64"
                                                                    },
                                                                    "IsReclineForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Backrest recline forward switch engaged (SingleSeat.Backrest.Recline).",
                                                                        "type": "actuator",
                                                                        "uuid": "0cc4f8336f0d585f93f4ab5c89e133d8"
                                                                    },
                                                                    "Lumbar": {
                                                                        "children": {
                                                                            "IsDownEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar down switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "dcd08d675e7e5f4eafe85311a3e40f1e"
                                                                            },
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "866f9a7d358e5eb5985c9c675b4f7eb4"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more lumbar support engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "cf9c077f2f4d5573a6022f5f08e807d3"
                                                                            },
                                                                            "IsUpEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Lumbar up switch engaged (SingleSeat.Backrest.Lumbar.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "f0fd5a54865452bcbf2939d8acd4273c"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.Lumbar.",
                                                                        "type": "branch",
                                                                        "uuid": "1d631b9c90a25a858a6caabe8ead1826"
                                                                    },
                                                                    "SideBolster": {
                                                                        "children": {
                                                                            "IsLessSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for less side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "e99b4f4b07af511b9d86454eec1c483c"
                                                                            },
                                                                            "IsMoreSupportEngaged": {
                                                                                "datatype": "boolean",
                                                                                "description": "Is switch for more side bolster support engaged (SingleSeat.Backrest.SideBolster.Support).",
                                                                                "type": "actuator",
                                                                                "uuid": "92341df5af725c8282f6f93644f1ec9f"
                                                                            }
                                                                        },
                                                                        "description": "Switches for SingleSeat.Backrest.SideBolster.",
                                                                        "type": "branch",
                                                                        "uuid": "79d8d65b4c1d54a4ab1306d56e839c49"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the backrest of the seat.",
                                                                "type": "branch",
                                                                "uuid": "583a22d4a1365db9bf386a96bcafd292"
                                                            },
                                                            "Headrest": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest backward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "04e14e79404b5ff7ac9067841f81bbc9"
                                                                    },
                                                                    "IsDownEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest down switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "61a58c7fa7ed5e08a17067193bb9c951"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest forward switch engaged (SingleSeat.Headrest.Angle).",
                                                                        "type": "actuator",
                                                                        "uuid": "3c94aab710ff5e8f8a48fdbf6dc7b989"
                                                                    },
                                                                    "IsUpEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Head rest up switch engaged (SingleSeat.Headrest.Height).",
                                                                        "type": "actuator",
                                                                        "uuid": "e40c92c141f6562382f4f29d783cfa26"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Headrest.",
                                                                "type": "branch",
                                                                "uuid": "dd4de742803250eaa1efeceaad116e1d"
                                                            },
                                                            "IsBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat backward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "267429a5f95d5f47ac47ec301755df32"
                                                            },
                                                            "IsCoolerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Cooler switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "ffff3283b2cf5f7292e241ec2ee27e77"
                                                            },
                                                            "IsDownEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat down switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "73d2e688696a507b826230d5b53c429f"
                                                            },
                                                            "IsForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat forward switch engaged (SingleSeat.Position).",
                                                                "type": "actuator",
                                                                "uuid": "397a8afd0dd1533b8899248596ae7566"
                                                            },
                                                            "IsTiltBackwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt backward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "4490bc9063715f238c00c1eea91fa964"
                                                            },
                                                            "IsTiltForwardEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Tilt forward switch engaged (SingleSeat.Tilt).",
                                                                "type": "actuator",
                                                                "uuid": "98d34a35ab82571e88e2d647b5a772f4"
                                                            },
                                                            "IsUpEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Seat up switch engaged (SingleSeat.Height).",
                                                                "type": "actuator",
                                                                "uuid": "26752cad0db150a2aa6737b825e96256"
                                                            },
                                                            "IsWarmerEngaged": {
                                                                "datatype": "boolean",
                                                                "description": "Warmer switch for Seat heater (SingleSeat.Heating).",
                                                                "type": "actuator",
                                                                "uuid": "820cc2c323b45ef989d5bcb8aac9527e"
                                                            },
                                                            "Massage": {
                                                                "children": {
                                                                    "IsDecreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Decrease massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "7226bc97842452099d5484baad0af620"
                                                                    },
                                                                    "IsIncreaseEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Increase massage level switch engaged (SingleSeat.Massage).",
                                                                        "type": "actuator",
                                                                        "uuid": "fb062e9f85fd568cbd774b36fbf5113f"
                                                                    }
                                                                },
                                                                "description": "Switches for SingleSeat.Massage.",
                                                                "type": "branch",
                                                                "uuid": "ac2bb22d6acf56988582353a1453cbe3"
                                                            },
                                                            "Seating": {
                                                                "children": {
                                                                    "IsBackwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to decrease seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "2999a262b18e5476ab621e0cba4045e8"
                                                                    },
                                                                    "IsForwardEngaged": {
                                                                        "datatype": "boolean",
                                                                        "description": "Is switch to increase seating length engaged (SingleSeat.Seating.Length).",
                                                                        "type": "actuator",
                                                                        "uuid": "d32a5d6d85ff5b64b0157ae215cee44e"
                                                                    }
                                                                },
                                                                "description": "Describes switches related to the seating of the seat.",
                                                                "type": "branch",
                                                                "uuid": "0ed3b90fe1b4581782fac8496bace4b8"
                                                            }
                                                        },
                                                        "description": "Seat switch signals",
                                                        "type": "branch",
                                                        "uuid": "e0cfa7aceac75980b33075ceef5c9125"
                                                    },
                                                    "Tilt": {
                                                        "datatype": "float",
                                                        "description": "Tilting of seat relative to vehicle z-axis. 0 = seating is flat, seat and vehicle z-axis are parallel. Positive degrees = seat tilted backwards, seat z-axis is tilted backward.",
                                                        "type": "actuator",
                                                        "unit": "degrees",
                                                        "uuid": "5702e9961d4353eea849901a12886cf1"
                                                    }
                                                },
                                                "description": "All seats.",
                                                "type": "branch",
                                                "uuid": "a40aa679981551e7a92b8438533911d4"
                                            }
                                        },
                                        "description": "All seats.",
                                        "type": "branch",
                                        "uuid": "8c3aaf015ef8595cb45d9461a9c1195f"
                                    }
                                },
                                "description": "All seats.",
                                "type": "branch",
                                "uuid": "b0b253106b2851e3bb5c71ae3b09f09d"
                            },
                            "SeatPosCount": {
                                "comment": "Default value corresponds to two seats in front row and 3 seats in second row.",
                                "datatype": "uint8[]",
                                "default": [
                                    2,
                                    3
                                ],
                                "description": "Number of seats across each row from the front to the rear.",
                                "type": "attribute",
                                "uuid": "8dd40ecd47ab51c79ed9c74ae4296d7e"
                            },
                            "SeatRowCount": {
                                "comment": "Default value corresponds to two rows of seats.",
                                "datatype": "uint8",
                                "default": 2,
                                "description": "Number of seat rows in vehicle.",
                                "type": "attribute",
                                "uuid": "1002a7a4a954581b9cbc72fa438c5292"
                            },
                            "Sunroof": {
                                "children": {
                                    "Position": {
                                        "datatype": "int8",
                                        "description": "Sunroof position. 0 = Fully closed 100 = Fully opened. -100 = Fully tilted.",
                                        "max": 100,
                                        "min": -100,
                                        "type": "sensor",
                                        "uuid": "ab598697f1c852eda4df9ed62a956d17"
                                    },
                                    "Shade": {
                                        "children": {
                                            "Position": {
                                                "datatype": "uint8",
                                                "description": "Position of window blind. 0 = Fully retracted. 100 = Fully deployed.",
                                                "max": 100,
                                                "min": 0,
                                                "type": "actuator",
                                                "unit": "percent",
                                                "uuid": "5f78c2a631b75abc88744f9bad277f5a"
                                            },
                                            "Switch": {
                                                "allowed": [
                                                    "INACTIVE",
                                                    "CLOSE",
                                                    "OPEN",
                                                    "ONE_SHOT_CLOSE",
                                                    "ONE_SHOT_OPEN"
                                                ],
                                                "datatype": "string",
                                                "description": "Switch controlling sliding action such as window, sunroof, or blind.",
                                                "type": "actuator",
                                                "uuid": "3836077128c65381b01e74a1a8be1c40"
                                            }
                                        },
                                        "description": "Sun roof shade status.",
                                        "type": "branch",
                                        "uuid": "eeaae5977adb5683b16f405993405b2e"
                                    },
                                    "Switch": {
                                        "allowed": [
                                            "INACTIVE",
                                            "CLOSE",
                                            "OPEN",
                                            "ONE_SHOT_CLOSE",
                                            "ONE_SHOT_OPEN",
                                            "TILT_UP",
                                            "TILT_DOWN"
                                        ],
                                        "datatype": "string",
                                        "description": "Switch controlling sliding action such as window, sunroof, or shade.",
                                        "type": "actuator",
                                        "uuid": "88c39afd45a25ea2b474ff581e1fb138"
                                    }
                                },
                                "description": "Sun roof status.",
                                "type": "branch",
                                "uuid": "8ff70db05c065e3eb530082a0b6983cf"
                            }
                        },
                        "description": "All in-cabin components, including doors.",
                        "type": "branch",
                        "uuid": "1a94457b237f5e8eb3c77c0532ac88d7"
                    },
                    "CargoVolume": {
                        "datatype": "float",
                        "description": "The available volume for cargo or luggage. For automobiles, this is usually the trunk volume.",
                        "min": 0,
                        "type": "attribute",
                        "unit": "l",
                        "uuid": "789feabca2e8560ea3c1852371b4096e"
                    },
                    "Chassis": {
                        "children": {
                            "Accelerator": {
                                "children": {
                                    "PedalPosition": {
                                        "datatype": "uint8",
                                        "description": "Accelerator pedal position as percent. 0 = Not depressed. 100 = Fully depressed.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "sensor",
                                        "unit": "percent",
                                        "uuid": "2fabd8b61db45f62b4e97e7a612b4a73"
                                    }
                                },
                                "description": "Accelerator signals",
                                "type": "branch",
                                "uuid": "3b2b562086a45eb29c55186f3b710621"
                            },
                            "Axle": {
                                "children": {
                                    "Row1": {
                                        "children": {
                                            "TireAspectRatio": {
                                                "datatype": "uint8",
                                                "description": "Aspect ratio between tire section height and tire section width, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "percent",
                                                "uuid": "716fec24167e5c36b2b97daaf091f911"
                                            },
                                            "TireDiameter": {
                                                "datatype": "float",
                                                "description": "Outer diameter of tires, in inches, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "inch",
                                                "uuid": "ed9f037c1b5d53c78c90b71179db1f4f"
                                            },
                                            "TireWidth": {
                                                "datatype": "uint16",
                                                "description": "Nominal section width of tires, in mm, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "mm",
                                                "uuid": "3444d8773c215cd7a076d688eb7f1afc"
                                            },
                                            "Wheel": {
                                                "children": {
                                                    "Left": {
                                                        "children": {
                                                            "Brake": {
                                                                "children": {
                                                                    "FluidLevel": {
                                                                        "datatype": "uint8",
                                                                        "description": "Brake fluid level as percent. 0 = Empty. 100 = Full.",
                                                                        "max": 100,
                                                                        "type": "sensor",
                                                                        "unit": "percent",
                                                                        "uuid": "63aa9c4973ef50b18bd7214c9f2634c5"
                                                                    },
                                                                    "IsBrakesWorn": {
                                                                        "datatype": "boolean",
                                                                        "description": "Brake pad wear status. True = Worn. False = Not Worn.",
                                                                        "type": "sensor",
                                                                        "uuid": "901771088eb35dec9e69b56a8cb3e8f5"
                                                                    },
                                                                    "IsFluidLevelLow": {
                                                                        "datatype": "boolean",
                                                                        "description": "Brake fluid level status. True = Brake fluid level low. False = Brake fluid level OK.",
                                                                        "type": "sensor",
                                                                        "uuid": "713da56818e55714ac441e10870b3753"
                                                                    },
                                                                    "PadWear": {
                                                                        "datatype": "uint8",
                                                                        "description": "Brake pad wear as percent. 0 = No Wear. 100 = Worn.",
                                                                        "max": 100,
                                                                        "type": "sensor",
                                                                        "unit": "percent",
                                                                        "uuid": "b4ed36f8143d512fadaca3e641739ee2"
                                                                    }
                                                                },
                                                                "description": "Brake signals for wheel",
                                                                "type": "branch",
                                                                "uuid": "162dab13d5815ec4bc22888b0bc59cbf"
                                                            },
                                                            "Speed": {
                                                                "datatype": "float",
                                                                "description": "Rotational speed of a vehicle's wheel.",
                                                                "type": "sensor",
                                                                "unit": "km/h",
                                                                "uuid": "47897f20b2745b6aa2d0f76f1ecf824a"
                                                            },
                                                            "Tire": {
                                                                "children": {
                                                                    "IsPressureLow": {
                                                                        "datatype": "boolean",
                                                                        "description": "Tire Pressure Status. True = Low tire pressure. False = Good tire pressure.",
                                                                        "type": "sensor",
                                                                        "uuid": "4088315cfaa05c28b51c3d3462c65339"
                                                                    },
                                                                    "Pressure": {
                                                                        "datatype": "uint16",
                                                                        "description": "Tire pressure in kilo-Pascal.",
                                                                        "type": "sensor",
                                                                        "unit": "kPa",
                                                                        "uuid": "9fa3f176fd975d28a68f70c7d72e370f"
                                                                    },
                                                                    "Temperature": {
                                                                        "datatype": "float",
                                                                        "description": "Tire temperature in Celsius.",
                                                                        "type": "sensor",
                                                                        "unit": "celsius",
                                                                        "uuid": "093d8fb119755f6bafa979e4eae201a0"
                                                                    }
                                                                },
                                                                "description": "Tire signals for wheel.",
                                                                "type": "branch",
                                                                "uuid": "17c60ec3c02054b4951c975156375d9a"
                                                            }
                                                        },
                                                        "description": "Wheel signals for axle",
                                                        "type": "branch",
                                                        "uuid": "0cd478c6e72b55c6be6d3d9df9624545"
                                                    },
                                                    "Right": {
                                                        "children": {
                                                            "Brake": {
                                                                "children": {
                                                                    "FluidLevel": {
                                                                        "datatype": "uint8",
                                                                        "description": "Brake fluid level as percent. 0 = Empty. 100 = Full.",
                                                                        "max": 100,
                                                                        "type": "sensor",
                                                                        "unit": "percent",
                                                                        "uuid": "386bfddee4605e419d59755a51835650"
                                                                    },
                                                                    "IsBrakesWorn": {
                                                                        "datatype": "boolean",
                                                                        "description": "Brake pad wear status. True = Worn. False = Not Worn.",
                                                                        "type": "sensor",
                                                                        "uuid": "4c669b71c91e57dd8fd804ee68174b9c"
                                                                    },
                                                                    "IsFluidLevelLow": {
                                                                        "datatype": "boolean",
                                                                        "description": "Brake fluid level status. True = Brake fluid level low. False = Brake fluid level OK.",
                                                                        "type": "sensor",
                                                                        "uuid": "bb2057bc31c25beda1da0610ca62bd51"
                                                                    },
                                                                    "PadWear": {
                                                                        "datatype": "uint8",
                                                                        "description": "Brake pad wear as percent. 0 = No Wear. 100 = Worn.",
                                                                        "max": 100,
                                                                        "type": "sensor",
                                                                        "unit": "percent",
                                                                        "uuid": "f3c53c8c5628527a8501e12778dae6c7"
                                                                    }
                                                                },
                                                                "description": "Brake signals for wheel",
                                                                "type": "branch",
                                                                "uuid": "f334a45b92215f86b4ecadbd82c8b249"
                                                            },
                                                            "Speed": {
                                                                "datatype": "float",
                                                                "description": "Rotational speed of a vehicle's wheel.",
                                                                "type": "sensor",
                                                                "unit": "km/h",
                                                                "uuid": "c288d064d56e53bfb94cef8670872587"
                                                            },
                                                            "Tire": {
                                                                "children": {
                                                                    "IsPressureLow": {
                                                                        "datatype": "boolean",
                                                                        "description": "Tire Pressure Status. True = Low tire pressure. False = Good tire pressure.",
                                                                        "type": "sensor",
                                                                        "uuid": "93fa1125894e53259af5b7e1d991c8da"
                                                                    },
                                                                    "Pressure": {
                                                                        "datatype": "uint16",
                                                                        "description": "Tire pressure in kilo-Pascal.",
                                                                        "type": "sensor",
                                                                        "unit": "kPa",
                                                                        "uuid": "ea8038b63e6650ffb1a20539e915064a"
                                                                    },
                                                                    "Temperature": {
                                                                        "datatype": "float",
                                                                        "description": "Tire temperature in Celsius.",
                                                                        "type": "sensor",
                                                                        "unit": "celsius",
                                                                        "uuid": "58d4cee188d353d7996e855d48bb92df"
                                                                    }
                                                                },
                                                                "description": "Tire signals for wheel.",
                                                                "type": "branch",
                                                                "uuid": "660f90ae8f14594cb6e97d000c1985a1"
                                                            }
                                                        },
                                                        "description": "Wheel signals for axle",
                                                        "type": "branch",
                                                        "uuid": "c7ae1f1787ec502d8aea41802dc9a203"
                                                    }
                                                },
                                                "description": "Wheel signals for axle",
                                                "type": "branch",
                                                "uuid": "8ed02c02eee0502ba6d94a5d5f1fb789"
                                            },
                                            "WheelCount": {
                                                "datatype": "uint8",
                                                "description": "Number of wheels on the axle",
                                                "type": "attribute",
                                                "uuid": "7232effafb7d5c908a9bafe1cef2ff3e"
                                            },
                                            "WheelDiameter": {
                                                "datatype": "float",
                                                "description": "Diameter of wheels (rims without tires), in inches, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "inch",
                                                "uuid": "60d4b948ae8a5485bd77c45e1f648c13"
                                            },
                                            "WheelWidth": {
                                                "datatype": "float",
                                                "description": "Width of wheels (rims without tires), in inches, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "inch",
                                                "uuid": "5b92bdab1e035ff4ba000330e20f826b"
                                            }
                                        },
                                        "description": "Axle signals",
                                        "type": "branch",
                                        "uuid": "d7e93a94af0752aaab36819f6be4f67a"
                                    },
                                    "Row2": {
                                        "children": {
                                            "TireAspectRatio": {
                                                "datatype": "uint8",
                                                "description": "Aspect ratio between tire section height and tire section width, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "percent",
                                                "uuid": "9b4515273bf1554dab746212db05d352"
                                            },
                                            "TireDiameter": {
                                                "datatype": "float",
                                                "description": "Outer diameter of tires, in inches, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "inch",
                                                "uuid": "4dc46ee7fe0a5240a6eb67f9bf43a1ea"
                                            },
                                            "TireWidth": {
                                                "datatype": "uint16",
                                                "description": "Nominal section width of tires, in mm, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "mm",
                                                "uuid": "76a9071697b25fb8ab42393dfb77f0ef"
                                            },
                                            "Wheel": {
                                                "children": {
                                                    "Left": {
                                                        "children": {
                                                            "Brake": {
                                                                "children": {
                                                                    "FluidLevel": {
                                                                        "datatype": "uint8",
                                                                        "description": "Brake fluid level as percent. 0 = Empty. 100 = Full.",
                                                                        "max": 100,
                                                                        "type": "sensor",
                                                                        "unit": "percent",
                                                                        "uuid": "4b0d4f80b8855973a55ffee80fdfc4ba"
                                                                    },
                                                                    "IsBrakesWorn": {
                                                                        "datatype": "boolean",
                                                                        "description": "Brake pad wear status. True = Worn. False = Not Worn.",
                                                                        "type": "sensor",
                                                                        "uuid": "3d9bae5bf0705de99789ecea26b99a5c"
                                                                    },
                                                                    "IsFluidLevelLow": {
                                                                        "datatype": "boolean",
                                                                        "description": "Brake fluid level status. True = Brake fluid level low. False = Brake fluid level OK.",
                                                                        "type": "sensor",
                                                                        "uuid": "01f57161b0bf539fad1d2bfa9d9a9fc4"
                                                                    },
                                                                    "PadWear": {
                                                                        "datatype": "uint8",
                                                                        "description": "Brake pad wear as percent. 0 = No Wear. 100 = Worn.",
                                                                        "max": 100,
                                                                        "type": "sensor",
                                                                        "unit": "percent",
                                                                        "uuid": "8eff72d583015e1e94eab98bf8f0497e"
                                                                    }
                                                                },
                                                                "description": "Brake signals for wheel",
                                                                "type": "branch",
                                                                "uuid": "774d0a5771d35975872870cf71ea1487"
                                                            },
                                                            "Speed": {
                                                                "datatype": "float",
                                                                "description": "Rotational speed of a vehicle's wheel.",
                                                                "type": "sensor",
                                                                "unit": "km/h",
                                                                "uuid": "427abdd04fc355769697d998a47d3f58"
                                                            },
                                                            "Tire": {
                                                                "children": {
                                                                    "IsPressureLow": {
                                                                        "datatype": "boolean",
                                                                        "description": "Tire Pressure Status. True = Low tire pressure. False = Good tire pressure.",
                                                                        "type": "sensor",
                                                                        "uuid": "d895b1e23a4f59ec92735fc317e44769"
                                                                    },
                                                                    "Pressure": {
                                                                        "datatype": "uint16",
                                                                        "description": "Tire pressure in kilo-Pascal.",
                                                                        "type": "sensor",
                                                                        "unit": "kPa",
                                                                        "uuid": "ea414012c36e54fc84ec1d421f370ddd"
                                                                    },
                                                                    "Temperature": {
                                                                        "datatype": "float",
                                                                        "description": "Tire temperature in Celsius.",
                                                                        "type": "sensor",
                                                                        "unit": "celsius",
                                                                        "uuid": "06ab6b3fe7bb5f7c9e2e104ee0e7cfd5"
                                                                    }
                                                                },
                                                                "description": "Tire signals for wheel.",
                                                                "type": "branch",
                                                                "uuid": "edfee87117dc5a6f9d970167f26ec090"
                                                            }
                                                        },
                                                        "description": "Wheel signals for axle",
                                                        "type": "branch",
                                                        "uuid": "4c32a1c722a45ea09a52c389e8a8a618"
                                                    },
                                                    "Right": {
                                                        "children": {
                                                            "Brake": {
                                                                "children": {
                                                                    "FluidLevel": {
                                                                        "datatype": "uint8",
                                                                        "description": "Brake fluid level as percent. 0 = Empty. 100 = Full.",
                                                                        "max": 100,
                                                                        "type": "sensor",
                                                                        "unit": "percent",
                                                                        "uuid": "83e5e261302d5ab38c9ee4dddc18c8ae"
                                                                    },
                                                                    "IsBrakesWorn": {
                                                                        "datatype": "boolean",
                                                                        "description": "Brake pad wear status. True = Worn. False = Not Worn.",
                                                                        "type": "sensor",
                                                                        "uuid": "9b5963e98a9c5b229a61df76ef5c86e0"
                                                                    },
                                                                    "IsFluidLevelLow": {
                                                                        "datatype": "boolean",
                                                                        "description": "Brake fluid level status. True = Brake fluid level low. False = Brake fluid level OK.",
                                                                        "type": "sensor",
                                                                        "uuid": "727823c7e0d551f48f26a5dd4f0578bd"
                                                                    },
                                                                    "PadWear": {
                                                                        "datatype": "uint8",
                                                                        "description": "Brake pad wear as percent. 0 = No Wear. 100 = Worn.",
                                                                        "max": 100,
                                                                        "type": "sensor",
                                                                        "unit": "percent",
                                                                        "uuid": "63a564bca18a5b1fabd7d3cff1af0e6d"
                                                                    }
                                                                },
                                                                "description": "Brake signals for wheel",
                                                                "type": "branch",
                                                                "uuid": "5c33ec4bd8a15d3590f59e7257bf4d25"
                                                            },
                                                            "Speed": {
                                                                "datatype": "float",
                                                                "description": "Rotational speed of a vehicle's wheel.",
                                                                "type": "sensor",
                                                                "unit": "km/h",
                                                                "uuid": "85b41a82f4775fcea57dcc6218fb6d7b"
                                                            },
                                                            "Tire": {
                                                                "children": {
                                                                    "IsPressureLow": {
                                                                        "datatype": "boolean",
                                                                        "description": "Tire Pressure Status. True = Low tire pressure. False = Good tire pressure.",
                                                                        "type": "sensor",
                                                                        "uuid": "da2f63312a455d92abd5edc405f01903"
                                                                    },
                                                                    "Pressure": {
                                                                        "datatype": "uint16",
                                                                        "description": "Tire pressure in kilo-Pascal.",
                                                                        "type": "sensor",
                                                                        "unit": "kPa",
                                                                        "uuid": "0cd3dd4be36c5fcda49d6360556ba7c8"
                                                                    },
                                                                    "Temperature": {
                                                                        "datatype": "float",
                                                                        "description": "Tire temperature in Celsius.",
                                                                        "type": "sensor",
                                                                        "unit": "celsius",
                                                                        "uuid": "7c08b5778bc05265bb8d4e08fdca29cf"
                                                                    }
                                                                },
                                                                "description": "Tire signals for wheel.",
                                                                "type": "branch",
                                                                "uuid": "d855fe9ffb4e52be83ebfc7967c1c3ee"
                                                            }
                                                        },
                                                        "description": "Wheel signals for axle",
                                                        "type": "branch",
                                                        "uuid": "f59f6ce66b1454498f5dc71be581732a"
                                                    }
                                                },
                                                "description": "Wheel signals for axle",
                                                "type": "branch",
                                                "uuid": "87b119ed6de254159877b24047fd3026"
                                            },
                                            "WheelCount": {
                                                "datatype": "uint8",
                                                "description": "Number of wheels on the axle",
                                                "type": "attribute",
                                                "uuid": "ac6fe103410153d382306426d14213ab"
                                            },
                                            "WheelDiameter": {
                                                "datatype": "float",
                                                "description": "Diameter of wheels (rims without tires), in inches, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "inch",
                                                "uuid": "af27b1d18a5455e593692a9929909bb9"
                                            },
                                            "WheelWidth": {
                                                "datatype": "float",
                                                "description": "Width of wheels (rims without tires), in inches, as per ETRTO / TRA standard.",
                                                "type": "attribute",
                                                "unit": "inch",
                                                "uuid": "889d279053c051979ebbe301bacac206"
                                            }
                                        },
                                        "description": "Axle signals",
                                        "type": "branch",
                                        "uuid": "8ef77768446659b6b5020a06c7b23c8b"
                                    }
                                },
                                "description": "Axle signals",
                                "type": "branch",
                                "uuid": "0a3ebde7efa85c04ac6c29b5676fec5d"
                            },
                            "AxleCount": {
                                "datatype": "uint8",
                                "default": 2,
                                "description": "Number of axles on the vehicle",
                                "type": "attribute",
                                "uuid": "86d084c9148d5f22b5402a030413ed79"
                            },
                            "Brake": {
                                "children": {
                                    "IsDriverEmergencyBrakingDetected": {
                                        "comment": "Detection of emergency braking can trigger Emergency Brake Assist (EBA) to engage.",
                                        "datatype": "boolean",
                                        "description": "Indicates if emergency braking initiated by driver is detected. True = Emergency braking detected. False = Emergency braking not detected.",
                                        "type": "sensor",
                                        "uuid": "0d462892aeac5062a62ee7d07306f6a6"
                                    },
                                    "PedalPosition": {
                                        "datatype": "uint8",
                                        "description": "Brake pedal position as percent. 0 = Not depressed. 100 = Fully depressed.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "sensor",
                                        "unit": "percent",
                                        "uuid": "0477d3a4a831564ea473976cf34374f2"
                                    }
                                },
                                "description": "Brake system signals",
                                "type": "branch",
                                "uuid": "38df972e5c6b558e93839a5e97238c5a"
                            },
                            "ParkingBrake": {
                                "children": {
                                    "IsEngaged": {
                                        "datatype": "boolean",
                                        "description": "Parking brake status. True = Parking Brake is Engaged. False = Parking Brake is not Engaged.",
                                        "type": "actuator",
                                        "uuid": "faa7f94e6a5555c6b2d62e3328520ce0"
                                    }
                                },
                                "description": "Parking brake signals",
                                "type": "branch",
                                "uuid": "3849d42292f4551590fa4bf716fc90f7"
                            },
                            "SteeringWheel": {
                                "children": {
                                    "Angle": {
                                        "datatype": "int16",
                                        "description": "Steering wheel angle. Positive = degrees to the left. Negative = degrees to the right.",
                                        "type": "sensor",
                                        "unit": "degrees",
                                        "uuid": "92cd3b3d37585b2291806fe5127d9393"
                                    },
                                    "Extension": {
                                        "datatype": "uint8",
                                        "description": "Steering wheel column extension from dashboard. 0 = Closest to dashboard. 100 = Furthest from dashboard.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "actuator",
                                        "unit": "percent",
                                        "uuid": "6a84cc3604fc5960a1fb384fe63fae72"
                                    },
                                    "Position": {
                                        "allowed": [
                                            "FRONT_LEFT",
                                            "FRONT_RIGHT"
                                        ],
                                        "datatype": "string",
                                        "default": "FRONT_LEFT",
                                        "description": "Position of the steering wheel on the left or right side of the vehicle.",
                                        "type": "attribute",
                                        "uuid": "314d6eeeba195098b36ae7f476d27824"
                                    },
                                    "Tilt": {
                                        "datatype": "uint8",
                                        "description": "Steering wheel column tilt. 0 = Lowest position. 100 = Highest position.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "actuator",
                                        "unit": "percent",
                                        "uuid": "33e979769f91521d8080384447d06c00"
                                    }
                                },
                                "description": "Steering wheel signals",
                                "type": "branch",
                                "uuid": "8c759072791e5986ac4efe9df0c2b751"
                            },
                            "Track": {
                                "datatype": "uint16",
                                "default": 0,
                                "description": "Overall wheel tracking, in mm.",
                                "type": "attribute",
                                "unit": "mm",
                                "uuid": "f66cc4e6d7cf5e1da0d58af902dbb36b"
                            },
                            "Wheelbase": {
                                "datatype": "uint16",
                                "default": 0,
                                "description": "Overall wheel base, in mm.",
                                "type": "attribute",
                                "unit": "mm",
                                "uuid": "11677e0433935dc7aa9c1806c96a8a6b"
                            }
                        },
                        "description": "All data concerning steering, suspension, wheels, and brakes.",
                        "type": "branch",
                        "uuid": "87d260d635425da0a4ebd62bc4e5c313"
                    },
                    "Connectivity": {
                        "children": {
                            "IsConnectivityAvailable": {
                                "comment": "This signal can be used by onboard vehicle services to decide what features that shall be offered to the driver, for example disable the 'check for update' button if vehicle does not have connectivity.",
                                "datatype": "boolean",
                                "description": "Indicates if connectivity between vehicle and cloud is available. True = Connectivity is available. False = Connectivity is not available.",
                                "type": "sensor",
                                "uuid": "b6d11be2a6565996b68ffb07a96595a7"
                            }
                        },
                        "description": "Connectivity data.",
                        "type": "branch",
                        "uuid": "89c267fccea35f3da9871cca2b4dc4df"
                    },
                    "CurbWeight": {
                        "datatype": "uint16",
                        "default": 0,
                        "description": "Vehicle curb weight, including all liquids and full tank of fuel, but no cargo or passengers.",
                        "type": "attribute",
                        "unit": "kg",
                        "uuid": "69ac6ca079de59d19737f75e4c5c4342"
                    },
                    "CurrentLocation": {
                        "children": {
                            "Altitude": {
                                "datatype": "double",
                                "description": "Current altitude relative to WGS 84 reference ellipsoid, as measured at the position of GNSS receiver antenna.",
                                "type": "sensor",
                                "unit": "m",
                                "uuid": "d3ead98ab0b751c1a5b5dd5bc0e5e216"
                            },
                            "GNSSReceiver": {
                                "children": {
                                    "FixType": {
                                        "allowed": [
                                            "NONE",
                                            "TWO_D",
                                            "TWO_D_SATELLITE_BASED_AUGMENTATION",
                                            "TWO_D_GROUND_BASED_AUGMENTATION",
                                            "TWO_D_SATELLITE_AND_GROUND_BASED_AUGMENTATION",
                                            "THREE_D",
                                            "THREE_D_SATELLITE_BASED_AUGMENTATION",
                                            "THREE_D_GROUND_BASED_AUGMENTATION",
                                            "THREE_D_SATELLITE_AND_GROUND_BASED_AUGMENTATION"
                                        ],
                                        "datatype": "string",
                                        "description": "Fix status of GNSS receiver.",
                                        "type": "sensor",
                                        "uuid": "52853b33d4605608bd0ae50595c69309"
                                    },
                                    "MountingPosition": {
                                        "children": {
                                            "X": {
                                                "datatype": "int16",
                                                "description": "Mounting position of GNSS receiver antenna relative to vehicle coordinate system. Axis definitions according to ISO 8855. Origin at center of (first) rear axle. Positive values = forward of rear axle. Negative values = backward of rear axle.",
                                                "type": "attribute",
                                                "unit": "mm",
                                                "uuid": "f23d40f3556b5676a0d1e3def037197f"
                                            },
                                            "Y": {
                                                "datatype": "int16",
                                                "description": "Mounting position of GNSS receiver antenna relative to vehicle coordinate system. Axis definitions according to ISO 8855. Origin at center of (first) rear axle. Positive values = left of origin. Negative values = right of origin. Left/Right is as seen from driver perspective, i.e. by a person looking forward.",
                                                "type": "attribute",
                                                "unit": "mm",
                                                "uuid": "16745ae827c0527ea2c48c20f0c146f1"
                                            },
                                            "Z": {
                                                "datatype": "int16",
                                                "description": "Mounting position of GNSS receiver on Z-axis. Axis definitions according to ISO 8855. Origin at center of (first) rear axle. Positive values = above center of rear axle. Negative values = below center of rear axle.",
                                                "type": "attribute",
                                                "unit": "mm",
                                                "uuid": "a4d04e86518e5c5ab60e5e4face35756"
                                            }
                                        },
                                        "description": "Mounting position of GNSS receiver antenna relative to vehicle coordinate system. Axis definitions according to ISO 8855. Origin at center of (first) rear axle.",
                                        "type": "branch",
                                        "uuid": "5c0887bce6fb5eb79402baaccb203e61"
                                    }
                                },
                                "description": "Information on the GNSS receiver used for determining current location.",
                                "type": "branch",
                                "uuid": "b1bea5d88662539a8cff6f8fe4974740"
                            },
                            "Heading": {
                                "datatype": "double",
                                "description": "Current heading relative to geographic north. 0 = North, 90 = East, 180 = South, 270 = West.",
                                "max": 360,
                                "min": 0,
                                "type": "sensor",
                                "unit": "degrees",
                                "uuid": "2a8f0afa2b315943aa001278875ce012"
                            },
                            "HorizontalAccuracy": {
                                "datatype": "double",
                                "description": "Accuracy of the latitude and longitude coordinates.",
                                "type": "sensor",
                                "unit": "m",
                                "uuid": "bf25ef243f0c5f839f7ef874f9c57fda"
                            },
                            "Latitude": {
                                "datatype": "double",
                                "description": "Current latitude of vehicle in WGS 84 geodetic coordinates, as measured at the position of GNSS receiver antenna.",
                                "max": 90,
                                "min": -90,
                                "type": "sensor",
                                "unit": "degrees",
                                "uuid": "08933c5a445055df80bea15fbfa07f1c"
                            },
                            "Longitude": {
                                "datatype": "double",
                                "description": "Current longitude of vehicle in WGS 84 geodetic coordinates, as measured at the position of GNSS receiver antenna.",
                                "max": 180,
                                "min": -180,
                                "type": "sensor",
                                "unit": "degrees",
                                "uuid": "5246f2ec5fea550cb1b36f110854cfbb"
                            },
                            "Timestamp": {
                                "datatype": "string",
                                "description": "Timestamp from GNSS system for current location, formatted according to ISO 8601 with UTC time zone.",
                                "type": "sensor",
                                "uuid": "094aeff73be05c08905690be0e82a438"
                            },
                            "VerticalAccuracy": {
                                "datatype": "double",
                                "description": "Accuracy of altitude.",
                                "type": "sensor",
                                "unit": "m",
                                "uuid": "8f54055bce9e5e8e97fb6051582707ab"
                            }
                        },
                        "description": "The current latitude and longitude of the vehicle.",
                        "type": "branch",
                        "uuid": "24777bd485f15fb69550ae0520c40ad5"
                    },
                    "CurrentOverallWeight": {
                        "datatype": "uint16",
                        "description": "Current overall Vehicle weight. Including passengers, cargo and other load inside the car.",
                        "type": "sensor",
                        "unit": "kg",
                        "uuid": "75599d7628bb5f35839055269d3ad205"
                    },
                    "Driver": {
                        "children": {
                            "AttentiveProbability": {
                                "datatype": "float",
                                "description": "Probability of attentiveness of the driver.",
                                "max": 100,
                                "min": 0,
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "fcd202467afb533fbbf9e7da89cc1cee"
                            },
                            "DistractionLevel": {
                                "datatype": "float",
                                "description": "Distraction level of the driver will be the level how much the driver is distracted, by multiple factors. E.g. Driving situation, acustical or optical signales inside the cockpit, phone calls.",
                                "max": 100,
                                "min": 0,
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "cb35ec0b924e58979e1469146d65c3fa"
                            },
                            "FatigueLevel": {
                                "datatype": "float",
                                "description": "Fatigueness level of driver. Evaluated by multiple factors like trip time, behaviour of steering, eye status.",
                                "max": 100,
                                "min": 0,
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "49b1626295705a79ae20d8a270c48b6b"
                            },
                            "HeartRate": {
                                "datatype": "uint16",
                                "description": "Heart rate of the driver.",
                                "type": "sensor",
                                "uuid": "d71516905f785c4da867a2f86e774d93"
                            },
                            "Identifier": {
                                "children": {
                                    "Issuer": {
                                        "datatype": "string",
                                        "description": "Unique Issuer for the authentication of the occupant. E.g. https://accounts.funcorp.com.",
                                        "type": "sensor",
                                        "uuid": "ee7988d26d7156d2a030ecc506ea97e7"
                                    },
                                    "Subject": {
                                        "datatype": "string",
                                        "description": "Subject for the authentication of the occupant. E.g. UserID 7331677.",
                                        "type": "sensor",
                                        "uuid": "b41ec688af265f10824bc9635989ac55"
                                    }
                                },
                                "description": "Identifier attributes based on OAuth 2.0.",
                                "type": "branch",
                                "uuid": "89705397069c5ec58d607318f2ff0ea8"
                            },
                            "IsEyesOnRoad": {
                                "datatype": "boolean",
                                "description": "Has driver the eyes on road or not?",
                                "type": "sensor",
                                "uuid": "625e5009f1145aa0b797ee6c335ca2fe"
                            }
                        },
                        "description": "Driver data.",
                        "type": "branch",
                        "uuid": "1cac57e7b7e756dc8a154eaacbce6426"
                    },
                    "EmissionsCO2": {
                        "datatype": "int16",
                        "description": "The CO2 emissions.",
                        "type": "attribute",
                        "unit": "g/km",
                        "uuid": "b73e8f1ed17d584fad3f088c666dc2a5"
                    },
                    "Exterior": {
                        "children": {
                            "AirTemperature": {
                                "datatype": "float",
                                "description": "Air temperature outside the vehicle.",
                                "type": "sensor",
                                "unit": "celsius",
                                "uuid": "a38d3f5dfeb35317aca8b90453dc1a75"
                            },
                            "Humidity": {
                                "datatype": "float",
                                "description": "Relative humidity outside the vehicle. 0 = Dry, 100 = Air fully saturated.",
                                "max": 100,
                                "min": 0,
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "6c785ec5d9a5534f98be7ce198d25d6b"
                            },
                            "LightIntensity": {
                                "comment": "Mapping to physical units and calculation method is sensor specific.",
                                "datatype": "float",
                                "description": "Light intensity outside the vehicle. 0 = No light detected, 100 = Fully lit.",
                                "max": 100,
                                "min": 0,
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "9b46b70490f853e891e1cc35dd08dddc"
                            }
                        },
                        "description": "Information about exterior measured by vehicle.",
                        "type": "branch",
                        "uuid": "06c5def549f3580e8cdaffa3e0f5d25c"
                    },
                    "GrossWeight": {
                        "datatype": "uint16",
                        "default": 0,
                        "description": "Curb weight of vehicle, including all liquids and full tank of fuel and full load of cargo and passengers.",
                        "type": "attribute",
                        "unit": "kg",
                        "uuid": "9671cb551dd8570fbe5d7cd797265e6a"
                    },
                    "Height": {
                        "datatype": "uint16",
                        "default": 0,
                        "description": "Overall vehicle height.",
                        "type": "attribute",
                        "unit": "mm",
                        "uuid": "9784d39f68b8541f90c355178ded7d7c"
                    },
                    "IsBrokenDown": {
                        "comment": "Actual criteria and method used to decide if a vehicle is broken down is implementation specific.",
                        "datatype": "boolean",
                        "description": "Vehicle breakdown or any similar event causing vehicle to stop on the road, that might pose a risk to other road users. True = Vehicle broken down on the road, due to e.g. engine problems, flat tire, out of gas, brake problems. False = Vehicle not broken down.",
                        "type": "sensor",
                        "uuid": "469ebd2a76b45e5b97b799262a085330"
                    },
                    "IsMoving": {
                        "datatype": "boolean",
                        "description": "Indicates whether the vehicle is stationary or moving.",
                        "type": "sensor",
                        "uuid": "db69549cc7375e919c2a2883b41cd19c"
                    },
                    "Length": {
                        "datatype": "uint16",
                        "default": 0,
                        "description": "Overall vehicle length.",
                        "type": "attribute",
                        "unit": "mm",
                        "uuid": "885f1be6842a513582e52a42edb3176f"
                    },
                    "LowVoltageSystemState": {
                        "allowed": [
                            "UNDEFINED",
                            "LOCK",
                            "OFF",
                            "ACC",
                            "ON",
                            "START"
                        ],
                        "datatype": "string",
                        "description": "State of the supply voltage of the control units (usually 12V).",
                        "type": "sensor",
                        "uuid": "d7391ceb132e5519b02d4c13d5513d99"
                    },
                    "MaxTowBallWeight": {
                        "datatype": "uint16",
                        "default": 0,
                        "description": "Maximum vertical weight on the tow ball of a trailer.",
                        "type": "attribute",
                        "unit": "kg",
                        "uuid": "fec550f2064750e8b65b54fbf1368d68"
                    },
                    "MaxTowWeight": {
                        "datatype": "uint16",
                        "default": 0,
                        "description": "Maximum weight of trailer.",
                        "type": "attribute",
                        "unit": "kg",
                        "uuid": "a1b8fd65897654aa8a418bccf443f1f3"
                    },
                    "OBD": {
                        "children": {
                            "AbsoluteLoad": {
                                "datatype": "float",
                                "description": "PID 43 - Absolute load value",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "b3dd889a42ce5de9a7904b7196ae325c"
                            },
                            "AcceleratorPositionD": {
                                "datatype": "float",
                                "description": "PID 49 - Accelerator pedal position D",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "7e63256081ac5a7b8a28a6fa3c2c2ff9"
                            },
                            "AcceleratorPositionE": {
                                "datatype": "float",
                                "description": "PID 4A - Accelerator pedal position E",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "4104e7fc25355e25b4522d233565d84b"
                            },
                            "AcceleratorPositionF": {
                                "datatype": "float",
                                "description": "PID 4B - Accelerator pedal position F",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "95f5c2a209a857ff930e2f8e32ac2d3f"
                            },
                            "AirStatus": {
                                "datatype": "string",
                                "description": "PID 12 - Secondary air status",
                                "type": "sensor",
                                "uuid": "548f65bf59ed505a86dfaa1c33342e4d"
                            },
                            "AmbientAirTemperature": {
                                "datatype": "float",
                                "description": "PID 46 - Ambient air temperature",
                                "type": "sensor",
                                "unit": "celsius",
                                "uuid": "220a90f183c5583ea8b8b6454d774517"
                            },
                            "BarometricPressure": {
                                "datatype": "float",
                                "description": "PID 33 - Barometric pressure",
                                "type": "sensor",
                                "unit": "kPa",
                                "uuid": "1966bfff4d235767bfd9a21afb445ac7"
                            },
                            "Catalyst": {
                                "children": {
                                    "Bank1": {
                                        "children": {
                                            "Temperature1": {
                                                "datatype": "float",
                                                "description": "PID 3C - Catalyst temperature from bank 1, sensor 1",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "5a770f13939e5d069682d408f160a895"
                                            },
                                            "Temperature2": {
                                                "datatype": "float",
                                                "description": "PID 3E - Catalyst temperature from bank 1, sensor 2",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "ca9419a5d23b5937af23b51d823722fa"
                                            }
                                        },
                                        "description": "Catalyst bank 1 signals",
                                        "type": "branch",
                                        "uuid": "0c3aaf014ba95b938b639d4202ef8b25"
                                    },
                                    "Bank2": {
                                        "children": {
                                            "Temperature1": {
                                                "datatype": "float",
                                                "description": "PID 3D - Catalyst temperature from bank 2, sensor 1",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "011658e4ee89502c9a33877c92dbf888"
                                            },
                                            "Temperature2": {
                                                "datatype": "float",
                                                "description": "PID 3F - Catalyst temperature from bank 2, sensor 2",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "f60c68f0ebca5fcf97086ce04e16d661"
                                            }
                                        },
                                        "description": "Catalyst bank 2 signals",
                                        "type": "branch",
                                        "uuid": "9a20459754755146a3b9608bf6384835"
                                    }
                                },
                                "description": "Catalyst signals",
                                "type": "branch",
                                "uuid": "4eb0b191d6445de081f3f3f759af31c2"
                            },
                            "CommandedEGR": {
                                "datatype": "float",
                                "description": "PID 2C - Commanded exhaust gas recirculation (EGR)",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "0265890a4a695ee6952c9b9f565ddaa5"
                            },
                            "CommandedEVAP": {
                                "datatype": "float",
                                "description": "PID 2E - Commanded evaporative purge (EVAP) valve",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "5e6295d04a9159b88f4698b561b86842"
                            },
                            "CommandedEquivalenceRatio": {
                                "datatype": "float",
                                "description": "PID 44 - Commanded equivalence ratio",
                                "type": "sensor",
                                "unit": "ratio",
                                "uuid": "104e39e816f65fa791d0afa24603292b"
                            },
                            "ControlModuleVoltage": {
                                "datatype": "float",
                                "description": "PID 42 - Control module voltage",
                                "type": "sensor",
                                "unit": "V",
                                "uuid": "59e072b932605ffc88a299c874d885c4"
                            },
                            "CoolantTemperature": {
                                "datatype": "float",
                                "description": "PID 05 - Coolant temperature",
                                "type": "sensor",
                                "unit": "celsius",
                                "uuid": "824892cdc72d5f92a38ef3136576edc8"
                            },
                            "DTCList": {
                                "datatype": "string[]",
                                "description": "List of currently active DTCs formatted according OBD II (SAE-J2012DA_201812) standard ([P|C|B|U]XXXXX )",
                                "type": "sensor",
                                "uuid": "eee1b64e69845d5ab5e793b74631f9dc"
                            },
                            "DistanceSinceDTCClear": {
                                "datatype": "float",
                                "description": "PID 31 - Distance traveled since codes cleared",
                                "type": "sensor",
                                "unit": "km",
                                "uuid": "0da628e2c69d561eb86216ddcb6e7b2a"
                            },
                            "DistanceWithMIL": {
                                "datatype": "float",
                                "description": "PID 21 - Distance traveled with MIL on",
                                "type": "sensor",
                                "unit": "km",
                                "uuid": "a9a522e343f25522b08f11e81bb91349"
                            },
                            "DriveCycleStatus": {
                                "children": {
                                    "DTCCount": {
                                        "datatype": "uint8",
                                        "description": "Number of sensor Trouble Codes (DTC)",
                                        "type": "sensor",
                                        "uuid": "312856f746ff560e8098c19196964d3b"
                                    },
                                    "IgnitionType": {
                                        "allowed": [
                                            "SPARK",
                                            "COMPRESSION"
                                        ],
                                        "datatype": "string",
                                        "description": "Type of the ignition for ICE - spark = spark plug ignition, compression = self-igniting (Diesel engines)",
                                        "type": "sensor",
                                        "uuid": "1aeb7b6d025f5a8693104824abaa1c49"
                                    },
                                    "IsMILOn": {
                                        "datatype": "boolean",
                                        "description": "Malfunction Indicator Light (MIL) - False = Off, True = On",
                                        "type": "sensor",
                                        "uuid": "e367394c9a075eef8fd66499e3d9cf14"
                                    }
                                },
                                "description": "PID 41 - OBD status for the current drive cycle",
                                "type": "branch",
                                "uuid": "5215e28062f75154822789b8a5f30630"
                            },
                            "EGRError": {
                                "datatype": "float",
                                "description": "PID 2D - Exhaust gas recirculation (EGR) error",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "80a7000c5c7b5444b5571a26264061e5"
                            },
                            "EVAPVaporPressure": {
                                "datatype": "float",
                                "description": "PID 32 - Evaporative purge (EVAP) system pressure",
                                "type": "sensor",
                                "unit": "Pa",
                                "uuid": "70b5dae2ffd0561eab73efed8ad2f0ad"
                            },
                            "EVAPVaporPressureAbsolute": {
                                "datatype": "float",
                                "description": "PID 53 - Absolute evaporative purge (EVAP) system pressure",
                                "type": "sensor",
                                "unit": "kPa",
                                "uuid": "ef188a1e1a1356f7bc425081e3e00805"
                            },
                            "EVAPVaporPressureAlternate": {
                                "datatype": "float",
                                "description": "PID 54 - Alternate evaporative purge (EVAP) system pressure",
                                "type": "sensor",
                                "unit": "Pa",
                                "uuid": "68eaba3c79975d61bc35b92cd3e5e8d0"
                            },
                            "EngineLoad": {
                                "datatype": "float",
                                "description": "PID 04 - Engine load in percent - 0 = no load, 100 = full load",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "a8fda8a1b4c6534aa49c447bafc1c700"
                            },
                            "EngineSpeed": {
                                "datatype": "float",
                                "description": "PID 0C - Engine speed measured as rotations per minute",
                                "type": "sensor",
                                "unit": "rpm",
                                "uuid": "b682eea93b3e5874ab3b52e95a1fad37"
                            },
                            "EthanolPercent": {
                                "datatype": "float",
                                "description": "PID 52 - Percentage of ethanol in the fuel",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "a207e7de17e1520c894b412af6f2522c"
                            },
                            "FreezeDTC": {
                                "datatype": "string",
                                "description": "PID 02 - DTC that triggered the freeze frame",
                                "type": "sensor",
                                "uuid": "5b87fae8dda4522aae209ae528960782"
                            },
                            "FuelInjectionTiming": {
                                "datatype": "float",
                                "description": "PID 5D - Fuel injection timing",
                                "type": "sensor",
                                "unit": "degrees",
                                "uuid": "ab4869446f5357d6936838983e1b8949"
                            },
                            "FuelLevel": {
                                "datatype": "float",
                                "description": "PID 2F - Fuel level in the fuel tank",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "fd39813424ee5cd08c44714b35697287"
                            },
                            "FuelPressure": {
                                "datatype": "float",
                                "description": "PID 0A - Fuel pressure",
                                "type": "sensor",
                                "unit": "kPa",
                                "uuid": "34e6b0689f025d7b9bfa1fc49bb30c0f"
                            },
                            "FuelRailPressureAbsolute": {
                                "datatype": "float",
                                "description": "PID 59 - Absolute fuel rail pressure",
                                "type": "sensor",
                                "unit": "kPa",
                                "uuid": "83c88b13d30153949eeca1b1180a9061"
                            },
                            "FuelRailPressureDirect": {
                                "datatype": "float",
                                "description": "PID 23 - Fuel rail pressure direct inject",
                                "type": "sensor",
                                "unit": "kPa",
                                "uuid": "039cb7bf1a8356a98d09eaf4fc029fe9"
                            },
                            "FuelRailPressureVac": {
                                "datatype": "float",
                                "description": "PID 22 - Fuel rail pressure relative to vacuum",
                                "type": "sensor",
                                "unit": "kPa",
                                "uuid": "b3b0adf44aa3572fa07e7434993e6458"
                            },
                            "FuelRate": {
                                "datatype": "float",
                                "description": "PID 5E - Engine fuel rate",
                                "type": "sensor",
                                "unit": "l/h",
                                "uuid": "4ab7c2b710f95ceb9c7d01d19dabac38"
                            },
                            "FuelStatus": {
                                "datatype": "string",
                                "description": "PID 03 - Fuel status",
                                "type": "sensor",
                                "uuid": "15fa2f3f667a5f5786eda5c83435ef16"
                            },
                            "FuelType": {
                                "datatype": "string",
                                "description": "PID 51 - Fuel type",
                                "type": "sensor",
                                "uuid": "aefb45bdd8035904b0c8f3ffcedc53a9"
                            },
                            "HybridBatteryRemaining": {
                                "datatype": "float",
                                "description": "PID 5B - Remaining life of hybrid battery",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "c9517b6243df5e8d8f3aa3e57f71ec37"
                            },
                            "IntakeTemp": {
                                "datatype": "float",
                                "description": "PID 0F - Intake temperature",
                                "type": "sensor",
                                "unit": "celsius",
                                "uuid": "7c108305178b5854b430a23e125588bd"
                            },
                            "IsPTOActive": {
                                "datatype": "boolean",
                                "description": "PID 1E - Auxiliary input status (power take off)",
                                "type": "sensor",
                                "uuid": "ce291dc40bba5a969e57b17f11ae23a9"
                            },
                            "LongTermFuelTrim1": {
                                "datatype": "float",
                                "description": "PID 07 - Long Term (learned) Fuel Trim - Bank 1 - negative percent leaner, positive percent richer",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "1c203b11667150f0b4ee1be26a60c084"
                            },
                            "LongTermFuelTrim2": {
                                "datatype": "float",
                                "description": "PID 09 - Long Term (learned) Fuel Trim - Bank 2 - negative percent leaner, positive percent richer",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "b02aff2efce05632b5694a256e5b9ec7"
                            },
                            "LongTermO2Trim1": {
                                "datatype": "float",
                                "description": "PID 56 (byte A) - Long term secondary O2 trim - Bank 1",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "9a9586e29a02567e9920cb9b0aa2e3f5"
                            },
                            "LongTermO2Trim2": {
                                "datatype": "float",
                                "description": "PID 58 (byte A) - Long term secondary O2 trim - Bank 2",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "e579f6c930605b389e8ce2d7edd92999"
                            },
                            "LongTermO2Trim3": {
                                "datatype": "float",
                                "description": "PID 56 (byte B) - Long term secondary O2 trim - Bank 3",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "50ea51ad343a5e59b1d214053e522a45"
                            },
                            "LongTermO2Trim4": {
                                "datatype": "float",
                                "description": "PID 58 (byte B) - Long term secondary O2 trim - Bank 4",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "f9c20edd12f456e5ace21581cea484bd"
                            },
                            "MAF": {
                                "datatype": "float",
                                "description": "PID 10 - Grams of air drawn into engine per second",
                                "type": "sensor",
                                "unit": "g/s",
                                "uuid": "f3acdf89fb865313883d5d3126f15518"
                            },
                            "MAP": {
                                "datatype": "float",
                                "description": "PID 0B - Intake manifold pressure",
                                "type": "sensor",
                                "unit": "kPa",
                                "uuid": "335991b1b53f56f097fea7b05d4db83b"
                            },
                            "MaxMAF": {
                                "datatype": "float",
                                "description": "PID 50 - Maximum flow for mass air flow sensor",
                                "type": "sensor",
                                "unit": "g/s",
                                "uuid": "e21826479f715ee7afe8dc485f109b11"
                            },
                            "O2": {
                                "children": {
                                    "Sensor1": {
                                        "children": {
                                            "ShortTermFuelTrim": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte B) - Short term fuel trim",
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "ee366d40132456c0bce8cac3a837f16a"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte A) - Sensor voltage",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "e95f4ea667265ee3a68ab57b86ecbf66"
                                            }
                                        },
                                        "description": "Oxygen sensors (PID 14 - PID 1B)",
                                        "type": "branch",
                                        "uuid": "3aa8859203d4545083196a9690d72627"
                                    },
                                    "Sensor2": {
                                        "children": {
                                            "ShortTermFuelTrim": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte B) - Short term fuel trim",
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "92e6e172777457a9866ca045d0d79853"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte A) - Sensor voltage",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "5f1781bde96b53ce9b810a5a56b7c8ed"
                                            }
                                        },
                                        "description": "Oxygen sensors (PID 14 - PID 1B)",
                                        "type": "branch",
                                        "uuid": "efcb337cf94056c8a724e76bcfee6765"
                                    },
                                    "Sensor3": {
                                        "children": {
                                            "ShortTermFuelTrim": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte B) - Short term fuel trim",
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "66c300d35eb85e7387dc42528cca48d9"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte A) - Sensor voltage",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "a86a1986f0fe5d25b6c438a00438ff60"
                                            }
                                        },
                                        "description": "Oxygen sensors (PID 14 - PID 1B)",
                                        "type": "branch",
                                        "uuid": "b8c145402b7a5cffaa2699ed61b056fa"
                                    },
                                    "Sensor4": {
                                        "children": {
                                            "ShortTermFuelTrim": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte B) - Short term fuel trim",
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "b71dcf9d850c5d5686f14ad46cd2cae3"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte A) - Sensor voltage",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "772cbfab91be59f7bbf3ec4140ffbcc4"
                                            }
                                        },
                                        "description": "Oxygen sensors (PID 14 - PID 1B)",
                                        "type": "branch",
                                        "uuid": "853945bce86c5c4f95081075ae32261c"
                                    },
                                    "Sensor5": {
                                        "children": {
                                            "ShortTermFuelTrim": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte B) - Short term fuel trim",
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "7604de26198b51e28a441f79b1d84242"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte A) - Sensor voltage",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "155a0816093b5aee8012ed2a8d532b7f"
                                            }
                                        },
                                        "description": "Oxygen sensors (PID 14 - PID 1B)",
                                        "type": "branch",
                                        "uuid": "f48c76c9c7ec5ddcb6838ced0bd7517b"
                                    },
                                    "Sensor6": {
                                        "children": {
                                            "ShortTermFuelTrim": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte B) - Short term fuel trim",
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "2fb034769cab5089986d90bf7f9000ca"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte A) - Sensor voltage",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "85430592fb795e848d7bb91e6b9f1e00"
                                            }
                                        },
                                        "description": "Oxygen sensors (PID 14 - PID 1B)",
                                        "type": "branch",
                                        "uuid": "5269c1877ded507b87d7d1d7bec10605"
                                    },
                                    "Sensor7": {
                                        "children": {
                                            "ShortTermFuelTrim": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte B) - Short term fuel trim",
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "81f34b16b5e05d1ab159de9474eaf5bc"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte A) - Sensor voltage",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "23984a68e63f532bab18679e1174130d"
                                            }
                                        },
                                        "description": "Oxygen sensors (PID 14 - PID 1B)",
                                        "type": "branch",
                                        "uuid": "4b565102e4a052aa8aa64f27dc678ce3"
                                    },
                                    "Sensor8": {
                                        "children": {
                                            "ShortTermFuelTrim": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte B) - Short term fuel trim",
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "1699eb2267615e258259e480be0fa606"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 1x (byte A) - Sensor voltage",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "23e057b3629a5136bb585638725fe0a2"
                                            }
                                        },
                                        "description": "Oxygen sensors (PID 14 - PID 1B)",
                                        "type": "branch",
                                        "uuid": "d5eef24c35f1561982127404b50ece11"
                                    }
                                },
                                "description": "Oxygen sensors (PID 14 - PID 1B)",
                                "type": "branch",
                                "uuid": "31f007df72af50f0925d2b4647682a4d"
                            },
                            "O2WR": {
                                "children": {
                                    "Sensor1": {
                                        "children": {
                                            "Current": {
                                                "datatype": "float",
                                                "description": "PID 3x (byte CD) - Current for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "A",
                                                "uuid": "bb4c70d9d2ae56c8a9a3be446db6f54c"
                                            },
                                            "Lambda": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte AB) and PID 3x (byte AB) - Lambda for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "uuid": "b809083454a5516f995477c59bf4d3c6"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte CD) - Voltage for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "396251cbfa5a57ffb1dd743298dfcdf9"
                                            }
                                        },
                                        "description": "Wide range/band oxygen sensors (PID 24 - 2B and PID 34 - 3B)",
                                        "type": "branch",
                                        "uuid": "496074cec04a5260b60fd39bb7ed1479"
                                    },
                                    "Sensor2": {
                                        "children": {
                                            "Current": {
                                                "datatype": "float",
                                                "description": "PID 3x (byte CD) - Current for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "A",
                                                "uuid": "442ab33180ca5028a37a487056ba4a51"
                                            },
                                            "Lambda": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte AB) and PID 3x (byte AB) - Lambda for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "uuid": "ce55aed0e8705a49970566db71ebcf90"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte CD) - Voltage for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "a784675c3b765d42ad023d8ee412be26"
                                            }
                                        },
                                        "description": "Wide range/band oxygen sensors (PID 24 - 2B and PID 34 - 3B)",
                                        "type": "branch",
                                        "uuid": "079f9960f75d5f399df7ff86fcea8f0c"
                                    },
                                    "Sensor3": {
                                        "children": {
                                            "Current": {
                                                "datatype": "float",
                                                "description": "PID 3x (byte CD) - Current for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "A",
                                                "uuid": "c942468e349e5aaebde4d90ee0bc3814"
                                            },
                                            "Lambda": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte AB) and PID 3x (byte AB) - Lambda for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "uuid": "f2ae7c781b0a5dcf8db91558e3cf4c13"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte CD) - Voltage for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "a78f7621a3f75df2adc1dc940219834a"
                                            }
                                        },
                                        "description": "Wide range/band oxygen sensors (PID 24 - 2B and PID 34 - 3B)",
                                        "type": "branch",
                                        "uuid": "a8a83d3e33f9584b824088e830bcbaec"
                                    },
                                    "Sensor4": {
                                        "children": {
                                            "Current": {
                                                "datatype": "float",
                                                "description": "PID 3x (byte CD) - Current for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "A",
                                                "uuid": "f16b31fde63a516db04cb44feaa7c27b"
                                            },
                                            "Lambda": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte AB) and PID 3x (byte AB) - Lambda for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "uuid": "be09013f423c588eae9c06da9ddf290f"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte CD) - Voltage for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "abeca90ba22d5c32a34ee907cedf3192"
                                            }
                                        },
                                        "description": "Wide range/band oxygen sensors (PID 24 - 2B and PID 34 - 3B)",
                                        "type": "branch",
                                        "uuid": "bb67047ddad158ba98876a6a87d02e97"
                                    },
                                    "Sensor5": {
                                        "children": {
                                            "Current": {
                                                "datatype": "float",
                                                "description": "PID 3x (byte CD) - Current for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "A",
                                                "uuid": "40494cb5826554929f5ecadd5b9173fd"
                                            },
                                            "Lambda": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte AB) and PID 3x (byte AB) - Lambda for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "uuid": "16a957200f5c51f89824bbb76a23b9c0"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte CD) - Voltage for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "699c4db2439f51af8465e823687018b8"
                                            }
                                        },
                                        "description": "Wide range/band oxygen sensors (PID 24 - 2B and PID 34 - 3B)",
                                        "type": "branch",
                                        "uuid": "01c4160d39af5db59c66db844646195e"
                                    },
                                    "Sensor6": {
                                        "children": {
                                            "Current": {
                                                "datatype": "float",
                                                "description": "PID 3x (byte CD) - Current for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "A",
                                                "uuid": "06a38b6b4784545bb637279e96d48eb5"
                                            },
                                            "Lambda": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte AB) and PID 3x (byte AB) - Lambda for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "uuid": "fdae9bb9a3a45b4680450f0347cf6d66"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte CD) - Voltage for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "304c181c76d55c3abe75382a935c7bde"
                                            }
                                        },
                                        "description": "Wide range/band oxygen sensors (PID 24 - 2B and PID 34 - 3B)",
                                        "type": "branch",
                                        "uuid": "cff12c30bde957798daaa3a91758b48b"
                                    },
                                    "Sensor7": {
                                        "children": {
                                            "Current": {
                                                "datatype": "float",
                                                "description": "PID 3x (byte CD) - Current for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "A",
                                                "uuid": "6ed46315325d540eb95c86ec61eef8e4"
                                            },
                                            "Lambda": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte AB) and PID 3x (byte AB) - Lambda for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "uuid": "9221a5289157538b9dcaa0d961c335fa"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte CD) - Voltage for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "0ad1d79dcce65c00ac48421b5b54ca0e"
                                            }
                                        },
                                        "description": "Wide range/band oxygen sensors (PID 24 - 2B and PID 34 - 3B)",
                                        "type": "branch",
                                        "uuid": "44459df1f25f5d43a07b00f2bad65ef5"
                                    },
                                    "Sensor8": {
                                        "children": {
                                            "Current": {
                                                "datatype": "float",
                                                "description": "PID 3x (byte CD) - Current for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "A",
                                                "uuid": "96de3c3b036c50c2978ab2aa490d4d9e"
                                            },
                                            "Lambda": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte AB) and PID 3x (byte AB) - Lambda for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "uuid": "c56db1195fa3519ab6718ab57d2cd543"
                                            },
                                            "Voltage": {
                                                "datatype": "float",
                                                "description": "PID 2x (byte CD) - Voltage for wide range/band oxygen sensor",
                                                "type": "sensor",
                                                "unit": "V",
                                                "uuid": "ab7d6c739f025782bba640e58123f0c8"
                                            }
                                        },
                                        "description": "Wide range/band oxygen sensors (PID 24 - 2B and PID 34 - 3B)",
                                        "type": "branch",
                                        "uuid": "b8865e72055d52a086f6935d5c188cc1"
                                    }
                                },
                                "description": "Wide range/band oxygen sensors (PID 24 - 2B and PID 34 - 3B)",
                                "type": "branch",
                                "uuid": "a439f2bc16575318afe20d0bc6a8cacf"
                            },
                            "OBDStandards": {
                                "datatype": "uint8",
                                "description": "PID 1C - OBD standards this vehicle conforms to",
                                "type": "attribute",
                                "uuid": "1aa8d7d055cf5a29a31b04a12124f673"
                            },
                            "OilTemperature": {
                                "datatype": "float",
                                "description": "PID 5C - Engine oil temperature",
                                "type": "sensor",
                                "unit": "celsius",
                                "uuid": "ef3dfc11085d5077b363b1a4e8e4a84e"
                            },
                            "OxygenSensorsIn2Banks": {
                                "datatype": "uint8",
                                "description": "PID 13 - Presence of oxygen sensors in 2 banks. [A0..A3] == Bank 1, Sensors 1-4. [A4..A7] == Bank 2, Sensors 1-4",
                                "type": "sensor",
                                "uuid": "0a9ba3f0a9b256d78bafd62ee8ce73cd"
                            },
                            "OxygenSensorsIn4Banks": {
                                "datatype": "uint8",
                                "description": "PID 1D - Presence of oxygen sensors in 4 banks. Similar to PID 13, but [A0..A7] == [B1S1, B1S2, B2S1, B2S2, B3S1, B3S2, B4S1, B4S2]",
                                "type": "sensor",
                                "uuid": "41d3377813d651aa9b9344ba9fd2f880"
                            },
                            "PidsA": {
                                "datatype": "uint32",
                                "description": "PID 00 - Bit array of the supported pids 01 to 20",
                                "type": "sensor",
                                "uuid": "ba1c1b9034955d2d97249c3b4516beef"
                            },
                            "PidsB": {
                                "datatype": "uint32",
                                "description": "PID 20 - Bit array of the supported pids 21 to 40",
                                "type": "sensor",
                                "uuid": "00193c560a0a5525baa45681e07b50f6"
                            },
                            "PidsC": {
                                "datatype": "uint32",
                                "description": "PID 40 - Bit array of the supported pids 41 to 60",
                                "type": "sensor",
                                "uuid": "7c3a3f0ecc5d593aa996892668afe4b0"
                            },
                            "RelativeAcceleratorPosition": {
                                "datatype": "float",
                                "description": "PID 5A - Relative accelerator pedal position",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "e25de9aacad3549285b4fb234f10be8f"
                            },
                            "RelativeThrottlePosition": {
                                "datatype": "float",
                                "description": "PID 45 - Relative throttle position",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "54ecf7dd671c5053aac4bc1bb061d64b"
                            },
                            "RunTime": {
                                "datatype": "float",
                                "description": "PID 1F - Engine run time",
                                "type": "sensor",
                                "unit": "s",
                                "uuid": "acf70773752256d1a227ab48257624b5"
                            },
                            "RunTimeMIL": {
                                "datatype": "float",
                                "description": "PID 4D - Run time with MIL on",
                                "type": "sensor",
                                "unit": "min",
                                "uuid": "555604a484535f60adf8894a6bd895b6"
                            },
                            "ShortTermFuelTrim1": {
                                "datatype": "float",
                                "description": "PID 06 - Short Term (immediate) Fuel Trim - Bank 1 - negative percent leaner, positive percent richer",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "569c983874335fb392d4e82a002654cb"
                            },
                            "ShortTermFuelTrim2": {
                                "datatype": "float",
                                "description": "PID 08 - Short Term (immediate) Fuel Trim - Bank 2 - negative percent leaner, positive percent richer",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "53a39620773a523a8182169027169ec2"
                            },
                            "ShortTermO2Trim1": {
                                "datatype": "float",
                                "description": "PID 55 (byte A) - Short term secondary O2 trim - Bank 1",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "be7ed33a854557ba802da0c51f9f4564"
                            },
                            "ShortTermO2Trim2": {
                                "datatype": "float",
                                "description": "PID 57 (byte A) - Short term secondary O2 trim - Bank 2",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "c8b962f8990e51d294621408ceaa21d9"
                            },
                            "ShortTermO2Trim3": {
                                "datatype": "float",
                                "description": "PID 55 (byte B) - Short term secondary O2 trim - Bank 3",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "af58212df970568b9edcc5e58fa36f8d"
                            },
                            "ShortTermO2Trim4": {
                                "datatype": "float",
                                "description": "PID 57 (byte B) - Short term secondary O2 trim - Bank 4",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "8ef0516c0c965fd6aecbacd6b9120a5b"
                            },
                            "Speed": {
                                "datatype": "float",
                                "description": "PID 0D - Vehicle speed",
                                "type": "sensor",
                                "unit": "km/h",
                                "uuid": "91ed0bb43eb054759813cd784b071764"
                            },
                            "Status": {
                                "children": {
                                    "DTCCount": {
                                        "datatype": "uint8",
                                        "description": "Number of sensor Trouble Codes (DTC)",
                                        "type": "sensor",
                                        "uuid": "4afdf65e788c5f69baf682597e69fb67"
                                    },
                                    "IgnitionType": {
                                        "allowed": [
                                            "SPARK",
                                            "COMPRESSION"
                                        ],
                                        "datatype": "string",
                                        "description": "Type of the ignition for ICE - spark = spark plug ignition, compression = self-igniting (Diesel engines)",
                                        "type": "sensor",
                                        "uuid": "7ffd71caac8e5bd18f93366afdfe534d"
                                    },
                                    "IsMILOn": {
                                        "datatype": "boolean",
                                        "description": "Malfunction Indicator Light (MIL) False = Off, True = On",
                                        "type": "sensor",
                                        "uuid": "8744bcb275205630932320b66185502c"
                                    }
                                },
                                "description": "PID 01 - OBD status",
                                "type": "branch",
                                "uuid": "474f58e593ee5bfebbb9c6ce4a453f96"
                            },
                            "ThrottleActuator": {
                                "datatype": "float",
                                "description": "PID 4C - Commanded throttle actuator",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "49a19905a1005ee3abe0c0a84d7112d1"
                            },
                            "ThrottlePosition": {
                                "datatype": "float",
                                "description": "PID 11 - Throttle position - 0 = closed throttle, 100 = open throttle",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "ec1d372020205bb4a846a014b33801e1"
                            },
                            "ThrottlePositionB": {
                                "datatype": "float",
                                "description": "PID 47 - Absolute throttle position B",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "701712a565ed5bf8b6630487a7152c87"
                            },
                            "ThrottlePositionC": {
                                "datatype": "float",
                                "description": "PID 48 - Absolute throttle position C",
                                "type": "sensor",
                                "unit": "percent",
                                "uuid": "06f162dc00a85f628f9d5d1bc952665c"
                            },
                            "TimeSinceDTCCleared": {
                                "datatype": "float",
                                "description": "PID 4E - Time since trouble codes cleared",
                                "type": "sensor",
                                "unit": "min",
                                "uuid": "66ea3984a2585dcdaaf6452eef835c0d"
                            },
                            "TimingAdvance": {
                                "datatype": "float",
                                "description": "PID 0E - Time advance",
                                "type": "sensor",
                                "unit": "degrees",
                                "uuid": "35533b7e327d5f839b17c932b630767c"
                            },
                            "WarmupsSinceDTCClear": {
                                "datatype": "uint8",
                                "description": "PID 30 - Number of warm-ups since codes cleared",
                                "type": "sensor",
                                "uuid": "a63ba60721785fc591e3dd067c4dc2ae"
                            }
                        },
                        "description": "OBD data.",
                        "type": "branch",
                        "uuid": "7ad7c512ed5d52c8b31944d2d47a4bc3"
                    },
                    "Powertrain": {
                        "children": {
                            "AccumulatedBrakingEnergy": {
                                "datatype": "float",
                                "description": "The accumulated energy from regenerative braking over lifetime.",
                                "type": "sensor",
                                "unit": "kWh",
                                "uuid": "0dd466d28d3d5ad094f2015adafb91a5"
                            },
                            "CombustionEngine": {
                                "children": {
                                    "AspirationType": {
                                        "allowed": [
                                            "UNKNOWN",
                                            "NATURAL",
                                            "SUPERCHARGER",
                                            "TURBOCHARGER"
                                        ],
                                        "datatype": "string",
                                        "default": "UNKNOWN",
                                        "description": "Type of aspiration (natural, turbocharger, supercharger etc).",
                                        "type": "attribute",
                                        "uuid": "3ca6a8ff30275c20a9d8d6d6829574eb"
                                    },
                                    "Bore": {
                                        "datatype": "float",
                                        "description": "Bore in millimetres.",
                                        "type": "attribute",
                                        "unit": "mm",
                                        "uuid": "1618fb16035b5464961570cc1afd934e"
                                    },
                                    "CompressionRatio": {
                                        "datatype": "string",
                                        "description": "Engine compression ratio, specified in the format 'X:1', e.g. '9.2:1'.",
                                        "type": "attribute",
                                        "uuid": "ead42922511051a0a0a1b634781f3c09"
                                    },
                                    "Configuration": {
                                        "allowed": [
                                            "UNKNOWN",
                                            "STRAIGHT",
                                            "V",
                                            "BOXER",
                                            "W",
                                            "ROTARY",
                                            "RADIAL",
                                            "SQUARE",
                                            "H",
                                            "U",
                                            "OPPOSED",
                                            "X"
                                        ],
                                        "datatype": "string",
                                        "default": "UNKNOWN",
                                        "description": "Engine configuration.",
                                        "type": "attribute",
                                        "uuid": "586be4567fe059ee9e6cf42901c2e773"
                                    },
                                    "DieselExhaustFluid": {
                                        "children": {
                                            "Capacity": {
                                                "datatype": "float",
                                                "description": "Capacity in liters of the Diesel Exhaust Fluid Tank.",
                                                "type": "attribute",
                                                "unit": "l",
                                                "uuid": "863c16ad452b5cf5b7a37f58bdda14c3"
                                            },
                                            "IsLevelLow": {
                                                "datatype": "boolean",
                                                "description": "Indicates if the Diesel Exhaust Fluid level is low. True if level is low. Definition of low is vehicle dependent.",
                                                "type": "sensor",
                                                "uuid": "811af3fe4f7f5270b4119bb66cff8759"
                                            },
                                            "Level": {
                                                "datatype": "uint8",
                                                "description": "Level of the Diesel Exhaust Fluid tank as percent of capacity. 0 = empty. 100 = full.",
                                                "max": 100,
                                                "min": 0,
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "f5b0269b58ff5a8e8399f6d96963a3b6"
                                            },
                                            "Range": {
                                                "datatype": "uint32",
                                                "description": "Remaining range in meters of the Diesel Exhaust Fluid present in the vehicle.",
                                                "type": "sensor",
                                                "unit": "m",
                                                "uuid": "124afbee975c5a67b316413f7b805eac"
                                            }
                                        },
                                        "comment": "In retail and marketing other names are typically used for the fluid.",
                                        "description": "Signals related to Diesel Exhaust Fluid (DEF). DEF is called AUS32 in ISO 22241.",
                                        "type": "branch",
                                        "uuid": "81d8eec46d9357a3b1064bfb5d070fa2"
                                    },
                                    "DieselParticulateFilter": {
                                        "children": {
                                            "DeltaPressure": {
                                                "datatype": "float",
                                                "description": "Delta Pressure of Diesel Particulate Filter.",
                                                "type": "sensor",
                                                "unit": "Pa",
                                                "uuid": "a6f476775c60531b93acb835e0bc6ab6"
                                            },
                                            "InletTemperature": {
                                                "datatype": "float",
                                                "description": "Inlet temperature of Diesel Particulate Filter.",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "70e90d202d3054bd967e67dce95c8ef2"
                                            },
                                            "OutletTemperature": {
                                                "datatype": "float",
                                                "description": "Outlet temperature of Diesel Particulate Filter.",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "e2b7f9d97bec5c0d94ade71a5e2f6518"
                                            }
                                        },
                                        "description": "Diesel Particulate Filter signals.",
                                        "type": "branch",
                                        "uuid": "eeddd99ad6475b1a92b9ec7bd7cefdbd"
                                    },
                                    "Displacement": {
                                        "datatype": "uint16",
                                        "description": "Displacement in cubic centimetres.",
                                        "type": "attribute",
                                        "unit": "cm^3",
                                        "uuid": "94dbd928847150ab842c00fa5caaf272"
                                    },
                                    "ECT": {
                                        "datatype": "int16",
                                        "description": "Engine coolant temperature.",
                                        "type": "sensor",
                                        "unit": "celsius",
                                        "uuid": "fff3cad23cac5b189a1a075c3ab562cd"
                                    },
                                    "EOP": {
                                        "datatype": "uint16",
                                        "description": "Engine oil pressure.",
                                        "type": "sensor",
                                        "unit": "kPa",
                                        "uuid": "76c7039dc7975ec3a003f0f4a04895ec"
                                    },
                                    "EOT": {
                                        "datatype": "int16",
                                        "description": "Engine oil temperature.",
                                        "type": "sensor",
                                        "unit": "celsius",
                                        "uuid": "eae6f5eae04f530e80f6b024f95b767d"
                                    },
                                    "EngineCode": {
                                        "comment": "For hybrid vehicles the engine code may refer to the combination of combustion and electric engine.",
                                        "datatype": "string",
                                        "description": "Engine code designation, as specified by vehicle manufacturer.",
                                        "type": "attribute",
                                        "uuid": "4ec845911b8e5b64b2cb1d34063184de"
                                    },
                                    "EngineCoolantCapacity": {
                                        "datatype": "float",
                                        "description": "Engine coolant capacity in liters.",
                                        "type": "attribute",
                                        "unit": "l",
                                        "uuid": "90b5b64808ea5f4fa2798d96143b0d60"
                                    },
                                    "EngineHours": {
                                        "datatype": "float",
                                        "description": "Accumulated time during engine lifetime with 'engine speed (rpm) > 0'.",
                                        "type": "sensor",
                                        "unit": "h",
                                        "uuid": "a23a62e24f58514d961890f53262e4e0"
                                    },
                                    "EngineOilCapacity": {
                                        "datatype": "float",
                                        "description": "Engine oil capacity in liters.",
                                        "type": "attribute",
                                        "unit": "l",
                                        "uuid": "2ca7af6facb55a13885989faa9bc6ca7"
                                    },
                                    "EngineOilLevel": {
                                        "allowed": [
                                            "CRITICALLY_LOW",
                                            "LOW",
                                            "NORMAL",
                                            "HIGH",
                                            "CRITICALLY_HIGH"
                                        ],
                                        "datatype": "string",
                                        "description": "Engine oil level.",
                                        "type": "sensor",
                                        "uuid": "e3813f59e94b509eb865fd97255a8a4f"
                                    },
                                    "IdleHours": {
                                        "comment": "Vehicles may calculate accumulated idle time for an engine. It might be based on engine speed (rpm) below a certain limit or any other mechanism.",
                                        "datatype": "float",
                                        "description": "Accumulated idling time during engine lifetime. Definition of idling is not standardized.",
                                        "type": "sensor",
                                        "unit": "h",
                                        "uuid": "6caa3d7e669c5cc6aecd4a6be9a302d4"
                                    },
                                    "IsRunning": {
                                        "datatype": "boolean",
                                        "description": "Engine Running. True if engine is rotating (Speed > 0).",
                                        "type": "sensor",
                                        "uuid": "57652c27679757398c44d56af7a044d3"
                                    },
                                    "MAF": {
                                        "datatype": "uint16",
                                        "description": "Grams of air drawn into engine per second.",
                                        "type": "sensor",
                                        "unit": "g/s",
                                        "uuid": "1e222ed8c48b5dcea60e43ac8af7d6df"
                                    },
                                    "MAP": {
                                        "datatype": "uint16",
                                        "description": "Manifold absolute pressure possibly boosted using forced induction.",
                                        "type": "sensor",
                                        "unit": "kPa",
                                        "uuid": "28d4354fa34056369acb857aa7cc76ac"
                                    },
                                    "MaxPower": {
                                        "datatype": "uint16",
                                        "default": 0,
                                        "description": "Peak power, in kilowatts, that engine can generate.",
                                        "type": "attribute",
                                        "unit": "kW",
                                        "uuid": "81fbdd5e90f557a38b96578a38dc137d"
                                    },
                                    "MaxTorque": {
                                        "datatype": "uint16",
                                        "default": 0,
                                        "description": "Peak torque, in newton meter, that the engine can generate.",
                                        "type": "attribute",
                                        "unit": "Nm",
                                        "uuid": "471cd478c1e8597f8e97c85b4e4ebe26"
                                    },
                                    "NumberOfCylinders": {
                                        "datatype": "uint16",
                                        "description": "Number of cylinders.",
                                        "type": "attribute",
                                        "uuid": "b2cd342c218257e88d214cdb511df82b"
                                    },
                                    "NumberOfValvesPerCylinder": {
                                        "datatype": "uint16",
                                        "description": "Number of valves per cylinder.",
                                        "type": "attribute",
                                        "uuid": "44633204726e561ca21beff31f3fef80"
                                    },
                                    "OilLifeRemaining": {
                                        "comment": "In addition to this a signal a vehicle can report remaining time to service (including e.g. oil change) by Vehicle.Service.TimeToService.",
                                        "datatype": "int32",
                                        "description": "Remaining engine oil life in seconds. Negative values can be used to indicate that lifetime has been exceeded.",
                                        "type": "sensor",
                                        "unit": "s",
                                        "uuid": "94303734c68c5353a02625f652103918"
                                    },
                                    "Power": {
                                        "datatype": "uint16",
                                        "description": "Current engine power output. Shall be reported as 0 during engine breaking.",
                                        "type": "sensor",
                                        "unit": "kW",
                                        "uuid": "20e8b5d2187758c2848ed421248c180d"
                                    },
                                    "Speed": {
                                        "datatype": "uint16",
                                        "description": "Engine speed measured as rotations per minute.",
                                        "type": "sensor",
                                        "unit": "rpm",
                                        "uuid": "557ce24c5a4d51cc825059c948ac9e29"
                                    },
                                    "StrokeLength": {
                                        "datatype": "float",
                                        "description": "Stroke length in millimetres.",
                                        "type": "attribute",
                                        "unit": "mm",
                                        "uuid": "1bdfdab7904d51ed93e101b84ea54ddf"
                                    },
                                    "TPS": {
                                        "datatype": "uint8",
                                        "description": "Current throttle position.",
                                        "max": 100,
                                        "type": "sensor",
                                        "unit": "percent",
                                        "uuid": "1ddb77860de558b4876ffb399a442bda"
                                    },
                                    "Torque": {
                                        "comment": "During engine breaking the engine delivers a negative torque to the transmission. This negative torque shall be ignored, instead 0 shall be reported.",
                                        "datatype": "uint16",
                                        "description": "Current engine torque. Shall be reported as 0 during engine breaking.",
                                        "type": "sensor",
                                        "unit": "Nm",
                                        "uuid": "b81f504bdb57513299ae6e9402ec7bcd"
                                    }
                                },
                                "description": "Engine-specific data, stopping at the bell housing.",
                                "type": "branch",
                                "uuid": "159e2e3e75f0590f95b4d2f6cfae54b5"
                            },
                            "ElectricMotor": {
                                "children": {
                                    "CoolantTemperature": {
                                        "datatype": "int16",
                                        "description": "Motor coolant temperature (if applicable).",
                                        "type": "sensor",
                                        "unit": "celsius",
                                        "uuid": "3c5ea8c7700956518f2ae7a2a0f34f1c"
                                    },
                                    "EngineCode": {
                                        "datatype": "string",
                                        "description": "Engine code designation, as specified by vehicle manufacturer.",
                                        "type": "attribute",
                                        "uuid": "e4102a5142ed501495e5edafd3d36dfb"
                                    },
                                    "MaxPower": {
                                        "datatype": "uint16",
                                        "default": 0,
                                        "description": "Peak power, in kilowatts, that motor(s) can generate.",
                                        "type": "attribute",
                                        "unit": "kW",
                                        "uuid": "825ec7911ee958abb199b9f7903df3a6"
                                    },
                                    "MaxRegenPower": {
                                        "datatype": "uint16",
                                        "default": 0,
                                        "description": "Peak regen/brake power, in kilowatts, that motor(s) can generate.",
                                        "type": "attribute",
                                        "unit": "kW",
                                        "uuid": "7f2cb2650ba95485b7156ffe76e27366"
                                    },
                                    "MaxRegenTorque": {
                                        "datatype": "uint16",
                                        "default": 0,
                                        "description": "Peak regen/brake torque, in newton meter, that the motor(s) can generate.",
                                        "type": "attribute",
                                        "unit": "Nm",
                                        "uuid": "0e5190c2517b55aa80fcb9bf698e02d6"
                                    },
                                    "MaxTorque": {
                                        "datatype": "uint16",
                                        "default": 0,
                                        "description": "Peak power, in newton meter, that the motor(s) can generate.",
                                        "type": "attribute",
                                        "unit": "Nm",
                                        "uuid": "cf31eabcde5151f589e9b0f7a6090512"
                                    },
                                    "Power": {
                                        "datatype": "int16",
                                        "description": "Current motor power output. Negative values indicate regen mode.",
                                        "type": "sensor",
                                        "unit": "kW",
                                        "uuid": "46b86286fba059349a733fed9a0e3232"
                                    },
                                    "Speed": {
                                        "datatype": "int32",
                                        "description": "Motor rotational speed measured as rotations per minute. Negative values indicate reverse driving mode.",
                                        "type": "sensor",
                                        "unit": "rpm",
                                        "uuid": "ca961aa6ca435095a89f9d404a5d849d"
                                    },
                                    "Temperature": {
                                        "datatype": "int16",
                                        "description": "Motor temperature.",
                                        "type": "sensor",
                                        "unit": "celsius",
                                        "uuid": "1b7c15e5341052139995bfacea2c05b2"
                                    },
                                    "Torque": {
                                        "datatype": "int16",
                                        "description": "Current motor torque. Negative values indicate regen mode.",
                                        "type": "sensor",
                                        "unit": "Nm",
                                        "uuid": "aceffe768ddf5b828fff0975349d2433"
                                    }
                                },
                                "description": "Electric Motor specific data.",
                                "type": "branch",
                                "uuid": "1ade64f6b0d05f6c9340e7a667555ae2"
                            },
                            "FuelSystem": {
                                "children": {
                                    "AverageConsumption": {
                                        "datatype": "float",
                                        "description": "Average consumption in liters per 100 km.",
                                        "min": 0,
                                        "type": "sensor",
                                        "unit": "l/100km",
                                        "uuid": "e2252108125a54dcab34e1bad0fe8bdc"
                                    },
                                    "ConsumptionSinceStart": {
                                        "datatype": "float",
                                        "description": "Fuel amount in liters consumed since start of current trip.",
                                        "type": "sensor",
                                        "unit": "l",
                                        "uuid": "adf0a40964ff556f92b10275ad918883"
                                    },
                                    "HybridType": {
                                        "allowed": [
                                            "UNKNOWN",
                                            "NOT_APPLICABLE",
                                            "STOP_START",
                                            "BELT_ISG",
                                            "CIMG",
                                            "PHEV"
                                        ],
                                        "datatype": "string",
                                        "default": "UNKNOWN",
                                        "description": "Defines the hybrid type of the vehicle.",
                                        "type": "attribute",
                                        "uuid": "f0f72012f5e453c1935ff8c3a5aff696"
                                    },
                                    "InstantConsumption": {
                                        "datatype": "float",
                                        "description": "Current consumption in liters per 100 km.",
                                        "min": 0,
                                        "type": "sensor",
                                        "unit": "l/100km",
                                        "uuid": "cf65767ec8ad56ffadfdccd831e4b562"
                                    },
                                    "IsEngineStopStartEnabled": {
                                        "datatype": "boolean",
                                        "description": "Indicates whether eco start stop is currently enabled.",
                                        "type": "sensor",
                                        "uuid": "176eed5bb0da582a9ee56f1c70e12075"
                                    },
                                    "IsFuelLevelLow": {
                                        "datatype": "boolean",
                                        "description": "Indicates that the fuel level is low (e.g. <50km range).",
                                        "type": "sensor",
                                        "uuid": "65f18ee3b04f5d4c8bb76083227dd9fe"
                                    },
                                    "Level": {
                                        "datatype": "uint8",
                                        "description": "Level in fuel tank as percent of capacity. 0 = empty. 100 = full.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "sensor",
                                        "unit": "percent",
                                        "uuid": "902bd295a662573088291e8b6a6b7943"
                                    },
                                    "Range": {
                                        "datatype": "uint32",
                                        "description": "Remaining range in meters using only liquid fuel.",
                                        "type": "sensor",
                                        "unit": "m",
                                        "uuid": "c5a0dbe5e754553897f0aed0069af57a"
                                    },
                                    "SupportedFuel": {
                                        "allowed": [
                                            "E5_95",
                                            "E5_98",
                                            "E10_95",
                                            "E10_98",
                                            "E85",
                                            "B7",
                                            "B10",
                                            "B20",
                                            "B30",
                                            "B100",
                                            "XTL",
                                            "LPG",
                                            "CNG",
                                            "LNG",
                                            "H2",
                                            "OTHER"
                                        ],
                                        "comment": "RON 95 is sometimes referred to as Super, RON 98 as Super Plus.",
                                        "datatype": "string[]",
                                        "description": "Detailed information on fuels supported by the vehicle. Identifiers originating from DIN EN 16942:2021-08, appendix B, with additional suffix for octane (RON) where relevant.",
                                        "type": "attribute",
                                        "uuid": "7fd3bf2ef0c650e69ff2037875ec59ee"
                                    },
                                    "SupportedFuelTypes": {
                                        "allowed": [
                                            "GASOLINE",
                                            "DIESEL",
                                            "E85",
                                            "LPG",
                                            "CNG",
                                            "LNG",
                                            "H2",
                                            "OTHER"
                                        ],
                                        "comment": "If a vehicle also has an electric drivetrain (e.g. hybrid) that will be obvious from the PowerTrain.Type signal.",
                                        "datatype": "string[]",
                                        "description": "High level information of fuel types supported",
                                        "type": "attribute",
                                        "uuid": "80edc3002aa25097aba6455fe459fa6c"
                                    },
                                    "TankCapacity": {
                                        "datatype": "float",
                                        "description": "Capacity of the fuel tank in liters.",
                                        "type": "attribute",
                                        "unit": "l",
                                        "uuid": "362643b866c55d5386fdbdf383464e90"
                                    },
                                    "TimeSinceStart": {
                                        "datatype": "uint32",
                                        "description": "Time in seconds elapsed since start of current trip.",
                                        "type": "sensor",
                                        "unit": "s",
                                        "uuid": "1a8dbc5107b3522fad852e63aa85aef9"
                                    }
                                },
                                "description": "Fuel system data.",
                                "type": "branch",
                                "uuid": "dbc194a7f97d5a56bc8942c17c2db22e"
                            },
                            "Range": {
                                "datatype": "uint32",
                                "description": "Remaining range in meters using all energy sources available in the vehicle.",
                                "type": "sensor",
                                "unit": "m",
                                "uuid": "ea4b6de772d65d20b1fa611f997aa7b8"
                            },
                            "TractionBattery": {
                                "children": {
                                    "AccumulatedChargedEnergy": {
                                        "datatype": "float",
                                        "description": "The accumulated energy delivered to the battery during charging over lifetime of the battery.",
                                        "type": "sensor",
                                        "unit": "kWh",
                                        "uuid": "739d06021d795da0877bc0ef3c107de1"
                                    },
                                    "AccumulatedChargedThroughput": {
                                        "datatype": "float",
                                        "description": "The accumulated charge throughput delivered to the battery during charging over lifetime of the battery.",
                                        "type": "sensor",
                                        "unit": "Ah",
                                        "uuid": "6d038ccc313351fba3a9104c1158a207"
                                    },
                                    "AccumulatedConsumedEnergy": {
                                        "datatype": "float",
                                        "description": "The accumulated energy leaving HV battery for propulsion and auxiliary loads over lifetime of the battery.",
                                        "type": "sensor",
                                        "unit": "kWh",
                                        "uuid": "b844cb96765f574d8d31edb09ccaef81"
                                    },
                                    "AccumulatedConsumedThroughput": {
                                        "datatype": "float",
                                        "description": "The accumulated charge throughput leaving HV battery for propulsion and auxiliary loads over lifetime of the battery.",
                                        "type": "sensor",
                                        "unit": "Ah",
                                        "uuid": "f3e2ca21f3b550288d494827c9a172dd"
                                    },
                                    "Charging": {
                                        "children": {
                                            "ChargeCurrent": {
                                                "children": {
                                                    "DC": {
                                                        "datatype": "float",
                                                        "description": "Current DC charging current at inlet. Negative if returning energy to grid.",
                                                        "type": "sensor",
                                                        "unit": "A",
                                                        "uuid": "44204d7ae6fd5f8e954d0670a739bdf2"
                                                    },
                                                    "Phase1": {
                                                        "datatype": "float",
                                                        "description": "Current AC charging current (rms) at inlet for Phase 1. Negative if returning energy to grid.",
                                                        "type": "sensor",
                                                        "unit": "A",
                                                        "uuid": "400dca50fcde52a6bb605d7e86f49776"
                                                    },
                                                    "Phase2": {
                                                        "datatype": "float",
                                                        "description": "Current AC charging current (rms) at inlet for Phase 2. Negative if returning energy to grid.",
                                                        "type": "sensor",
                                                        "unit": "A",
                                                        "uuid": "32cb24d1c495503a9087d6f55997cf57"
                                                    },
                                                    "Phase3": {
                                                        "datatype": "float",
                                                        "description": "Current AC charging current (rms) at inlet for Phase 3. Negative if returning energy to grid.",
                                                        "type": "sensor",
                                                        "unit": "A",
                                                        "uuid": "55fb7fb7ff4a5df9b6a3af435eac868e"
                                                    }
                                                },
                                                "description": "Current charging current.",
                                                "type": "branch",
                                                "uuid": "94739cf563735b438878ac0f85601f27"
                                            },
                                            "ChargeLimit": {
                                                "datatype": "uint8",
                                                "description": "Target charge limit (state of charge) for battery.",
                                                "max": 100,
                                                "min": 0,
                                                "type": "actuator",
                                                "unit": "percent",
                                                "uuid": "62360a4ed1095275a7052d65112aaef1"
                                            },
                                            "ChargePlugType": {
                                                "allowed": [
                                                    "IEC_TYPE_1_AC",
                                                    "IEC_TYPE_2_AC",
                                                    "IEC_TYPE_3_AC",
                                                    "IEC_TYPE_4_DC",
                                                    "IEC_TYPE_1_CCS_DC",
                                                    "IEC_TYPE_2_CCS_DC",
                                                    "TESLA_ROADSTER",
                                                    "TESLA_HPWC",
                                                    "TESLA_SUPERCHARGER",
                                                    "GBT_AC",
                                                    "GBT_DC",
                                                    "OTHER"
                                                ],
                                                "comment": "A vehicle may have multiple charging inlets. IEC_TYPE_1_AC refers to Type 1 as defined in IEC 62196-2. Also known as Yazaki or J1772 connector. IEC_TYPE_2_AC refers to Type 2 as defined in IEC 62196-2. Also known as Mennekes connector. IEC_TYPE_3_AC refers to Type 3 as defined in IEC 62196-2. Also known as Scame connector. IEC_TYPE_4_DC refers to AA configuration as defined in IEC 62196-3. Also known as Type 4 or CHAdeMO connector. IEC_TYPE_1_CCS_DC refers to EE Configuration as defined in IEC 62196-3. Also known as CCS1 or Combo1 connector. IEC_TYPE_2_CCS_DC refers to FF Configuration as defined in IEC 62196-3. Also known as CCS2 or Combo2 connector. TESLA_ROADSTER, TESLA_HPWC (High Power Wall Connector) and TESLA_SUPERCHARGER refer to non-standardized charging inlets/methods used by Tesla. GBT_AC refers to connector specified in GB/T 20234.2. GBT_DC refers to connector specified in GB/T 20234.3. Also specified as BB Configuration in IEC 62196-3. OTHER shall be used if the vehicle has a charging connector, but not one of the connectors listed above. For additional information see https://en.wikipedia.org/wiki/IEC_62196.",
                                                "datatype": "string[]",
                                                "description": "Type of charge plug (charging inlet) available on the vehicle. IEC types refer to IEC 62196,  GBT refers to  GB/T 20234.",
                                                "type": "attribute",
                                                "uuid": "4c56357a6f1d586395215a9beeb26d91"
                                            },
                                            "ChargePortFlap": {
                                                "allowed": [
                                                    "OPEN",
                                                    "CLOSED"
                                                ],
                                                "datatype": "string",
                                                "description": "Status of the charge port cover, can potentially be controlled manually.",
                                                "type": "actuator",
                                                "uuid": "71bdd2145bb55c3393df194bfc2e03e5"
                                            },
                                            "ChargeRate": {
                                                "datatype": "float",
                                                "description": "Current charging rate, as in kilometers of range added per hour.",
                                                "type": "sensor",
                                                "unit": "km/h",
                                                "uuid": "a287cea3fdaa533180c8e349343a7851"
                                            },
                                            "ChargeVoltage": {
                                                "children": {
                                                    "DC": {
                                                        "datatype": "float",
                                                        "description": "Current DC charging voltage at charging inlet.",
                                                        "type": "sensor",
                                                        "unit": "V",
                                                        "uuid": "701c21d1a4815b35ba061415789ec911"
                                                    },
                                                    "Phase1": {
                                                        "datatype": "float",
                                                        "description": "Current AC charging voltage (rms) at inlet for Phase 1.",
                                                        "type": "sensor",
                                                        "unit": "V",
                                                        "uuid": "15991c8316585816815d6f4fb6b06776"
                                                    },
                                                    "Phase2": {
                                                        "datatype": "float",
                                                        "description": "Current AC charging voltage (rms) at inlet for Phase 2.",
                                                        "type": "sensor",
                                                        "unit": "V",
                                                        "uuid": "6c0dcf98169d5a5190736a6dd81291a4"
                                                    },
                                                    "Phase3": {
                                                        "datatype": "float",
                                                        "description": "Current AC charging voltage (rms) at inlet for Phase 3.",
                                                        "type": "sensor",
                                                        "unit": "V",
                                                        "uuid": "1ab06b48231e54e2ac27e543508c84f0"
                                                    }
                                                },
                                                "description": "Current charging voltage, as measured at the charging inlet.",
                                                "type": "branch",
                                                "uuid": "7170151d653b52c6bb5e75cb0a14d1c5"
                                            },
                                            "IsCharging": {
                                                "datatype": "boolean",
                                                "description": "True if charging is ongoing. Charging is considered to be ongoing if energy is flowing from charger to vehicle.",
                                                "type": "sensor",
                                                "uuid": "d28244c9e3365899954bd3e38ef46bb9"
                                            },
                                            "IsChargingCableConnected": {
                                                "datatype": "boolean",
                                                "description": "Indicates if a charging cable is physically connected to the vehicle or not.",
                                                "type": "sensor",
                                                "uuid": "a1c8e2f662b95a54a9933a1b163fff84"
                                            },
                                            "IsChargingCableLocked": {
                                                "comment": "Locking of charging cable can be used to prevent unintentional removing during charging.",
                                                "datatype": "boolean",
                                                "description": "Is charging cable locked to prevent removal.",
                                                "type": "actuator",
                                                "uuid": "7fa81693f3b8587f8d71e7b1619c8e21"
                                            },
                                            "IsDischarging": {
                                                "datatype": "boolean",
                                                "description": "True if discharging (vehicle to grid) is ongoing. Discharging is considered to be ongoing if energy is flowing from vehicle to charger/grid.",
                                                "type": "sensor",
                                                "uuid": "534d884fb36652688535543b52419529"
                                            },
                                            "MaximumChargingCurrent": {
                                                "children": {
                                                    "DC": {
                                                        "datatype": "float",
                                                        "description": "Maximum DC charging current at inlet that can be accepted by the system.",
                                                        "type": "sensor",
                                                        "unit": "A",
                                                        "uuid": "5a70acfd3c8959898b43738151ab36e1"
                                                    },
                                                    "Phase1": {
                                                        "datatype": "float",
                                                        "description": "Maximum AC charging current (rms) at inlet for Phase 1 that can be accepted by the system.",
                                                        "type": "sensor",
                                                        "unit": "A",
                                                        "uuid": "e3c1034e89cc55968ff51b990906db43"
                                                    },
                                                    "Phase2": {
                                                        "datatype": "float",
                                                        "description": "Maximum AC charging current (rms) at inlet for Phase 2 that can be accepted by the system.",
                                                        "type": "sensor",
                                                        "unit": "A",
                                                        "uuid": "ab3514bc982e54f2b98698fb6c752368"
                                                    },
                                                    "Phase3": {
                                                        "datatype": "float",
                                                        "description": "Maximum AC charging current (rms) at inlet for Phase 3 that can be accepted by the system.",
                                                        "type": "sensor",
                                                        "unit": "A",
                                                        "uuid": "47dd5e99c30d562e9e2e1c58007846b6"
                                                    }
                                                },
                                                "description": "Maximum charging current that can be accepted by the system, as measured at the charging inlet.",
                                                "type": "branch",
                                                "uuid": "e3f2e57e7a395d9ca9931d429e540a34"
                                            },
                                            "Mode": {
                                                "allowed": [
                                                    "MANUAL",
                                                    "TIMER",
                                                    "GRID",
                                                    "PROFILE"
                                                ],
                                                "comment": "The mechanism to provide a profile to the vehicle is currently not covered by VSS.",
                                                "datatype": "string",
                                                "description": "Control of the charge process. MANUAL means manually initiated (plug-in event, companion app, etc). TIMER means timer-based. GRID means grid-controlled (eg ISO 15118). PROFILE means controlled by profile download to vehicle.",
                                                "type": "actuator",
                                                "uuid": "1e4be3280b265873945531f6f6d0ec6b"
                                            },
                                            "PowerLoss": {
                                                "datatype": "float",
                                                "description": "Electrical energy lost by power dissipation to heat inside the AC/DC converter.",
                                                "type": "sensor",
                                                "unit": "W",
                                                "uuid": "88f40bbeb80b5dfb97ceba13269665c5"
                                            },
                                            "StartStopCharging": {
                                                "allowed": [
                                                    "START",
                                                    "STOP"
                                                ],
                                                "datatype": "string",
                                                "description": "Start or stop the charging process.",
                                                "type": "actuator",
                                                "uuid": "80506d3e9a2557c2b52f74a50d89593f"
                                            },
                                            "Temperature": {
                                                "datatype": "float",
                                                "description": "Current temperature of AC/DC converter converting grid voltage to battery voltage.",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "c3c0ef3a41db5df1bab659803adbc7ba"
                                            },
                                            "TimeToComplete": {
                                                "comment": "Shall consider time set by Charging.Timer.Time. E.g. if charging shall start in 3 hours and 2 hours of charging is needed, then Charging.TimeToComplete shall report 5 hours.",
                                                "datatype": "uint32",
                                                "description": "The time needed for the current charging process to reach Charging.ChargeLimit. 0 if charging is complete or no charging process is active or planned.",
                                                "type": "sensor",
                                                "unit": "s",
                                                "uuid": "c6439c2e068652b08383b9654e2e784a"
                                            },
                                            "Timer": {
                                                "children": {
                                                    "Mode": {
                                                        "allowed": [
                                                            "INACTIVE",
                                                            "START_TIME",
                                                            "END_TIME"
                                                        ],
                                                        "datatype": "string",
                                                        "description": "Defines timer mode for charging: INACTIVE - no timer set, charging may start as soon as battery is connected to a charger. START_TIME - charging shall start at Charging.Timer.Time. END_TIME - charging shall be finished (reach Charging.ChargeLimit) at Charging.Timer.Time. When charging is completed the vehicle shall change mode to 'inactive' or set a new Charging.Timer.Time. Charging shall start immediately if mode is 'starttime' or 'endtime' and Charging.Timer.Time is a time in the past.",
                                                        "type": "actuator",
                                                        "uuid": "b09fb52261735977af275dda1904a7a1"
                                                    },
                                                    "Time": {
                                                        "datatype": "string",
                                                        "description": "Time for next charging-related action, formatted according to ISO 8601 with UTC time zone. Value has no significance if Charging.Timer.Mode is 'inactive'.",
                                                        "type": "actuator",
                                                        "uuid": "c08dcaeda02b5e26aacd7e2542f0fc90"
                                                    }
                                                },
                                                "description": "Properties related to timing of battery charging sessions.",
                                                "type": "branch",
                                                "uuid": "cd5b57ada627510e83f90832efed9d5a"
                                            }
                                        },
                                        "description": "Properties related to battery charging.",
                                        "type": "branch",
                                        "uuid": "49b9ef0c8b145a36afdf17d0cb44131b"
                                    },
                                    "CurrentCurrent": {
                                        "datatype": "float",
                                        "description": "Current current flowing in/out of battery. Positive = Current flowing in to battery, e.g. during charging. Negative = Current flowing out of battery, e.g. during driving.",
                                        "type": "sensor",
                                        "unit": "A",
                                        "uuid": "7a1488e0c83f50a6b69d8ea85c5bb592"
                                    },
                                    "CurrentPower": {
                                        "datatype": "float",
                                        "description": "Current electrical energy flowing in/out of battery. Positive = Energy flowing in to battery, e.g. during charging. Negative = Energy flowing out of battery, e.g. during driving.",
                                        "type": "sensor",
                                        "unit": "W",
                                        "uuid": "8859e1b0386a5eda880a9c30cd0dfa8e"
                                    },
                                    "CurrentVoltage": {
                                        "datatype": "float",
                                        "description": "Current Voltage of the battery.",
                                        "type": "sensor",
                                        "unit": "V",
                                        "uuid": "7b54ea22ee7d5f559da552aefcc07222"
                                    },
                                    "DCDC": {
                                        "children": {
                                            "PowerLoss": {
                                                "datatype": "float",
                                                "description": "Electrical energy lost by power dissipation to heat inside DC/DC converter.",
                                                "type": "sensor",
                                                "unit": "W",
                                                "uuid": "f29e37087cdf57ca998188c7b945a77b"
                                            },
                                            "Temperature": {
                                                "datatype": "float",
                                                "description": "Current temperature of DC/DC converter converting battery high voltage to vehicle low voltage (typically 12 Volts).",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "4e587c3af2aa5fbb9205e42a64fc8d77"
                                            }
                                        },
                                        "description": "Properties related to DC/DC converter converting high voltage (from high voltage battery) to vehicle low voltage (supply voltage, typically 12 Volts).",
                                        "type": "branch",
                                        "uuid": "01f4943795b55cbd8f94e1bca137fc0a"
                                    },
                                    "GrossCapacity": {
                                        "datatype": "uint16",
                                        "description": "Gross capacity of the battery.",
                                        "type": "attribute",
                                        "unit": "kWh",
                                        "uuid": "5460530488435dc8bfa1298bf47a993d"
                                    },
                                    "Id": {
                                        "comment": "This could be serial number, part number plus serial number, UUID, or any other identifier that the OEM want to use to uniquely identify the battery individual.",
                                        "datatype": "string",
                                        "description": "Battery Identification Number as assigned by OEM.",
                                        "type": "attribute",
                                        "uuid": "c8279874660c55b38c7ac64a8503a519"
                                    },
                                    "IsGroundConnected": {
                                        "comment": "It might be possible to disconnect the traction battery used by an electric powertrain. This is achieved by connectors, typically one for plus and one for minus.",
                                        "datatype": "boolean",
                                        "description": "Indicating if the ground (negative terminator) of the traction battery is connected to the powertrain.",
                                        "type": "sensor",
                                        "uuid": "dd38d1c7ee12530aac03f49ad01d5c04"
                                    },
                                    "IsPowerConnected": {
                                        "comment": "It might be possible to disconnect the traction battery used by an electric powertrain. This is achieved by connectors, typically one for plus and one for minus.",
                                        "datatype": "boolean",
                                        "description": "Indicating if the power (positive terminator) of the traction battery is connected to the powertrain.",
                                        "type": "sensor",
                                        "uuid": "e30ef59fc2a25f6b8990248e19a5cdf9"
                                    },
                                    "MaxVoltage": {
                                        "datatype": "uint16",
                                        "description": "Max allowed voltage of the battery, e.g. during charging.",
                                        "type": "attribute",
                                        "unit": "V",
                                        "uuid": "a81264a0ef0c55d288671cfc62c4add5"
                                    },
                                    "NetCapacity": {
                                        "datatype": "uint16",
                                        "description": "Total net capacity of the battery considering aging.",
                                        "type": "sensor",
                                        "unit": "kWh",
                                        "uuid": "9c68fe42cb81501eb6349f8c9b0b6899"
                                    },
                                    "NominalVoltage": {
                                        "comment": "Nominal voltage typically refers to voltage of fully charged battery when delivering rated capacity.",
                                        "datatype": "uint16",
                                        "description": "Nominal Voltage of the battery.",
                                        "type": "attribute",
                                        "unit": "V",
                                        "uuid": "3eccae5633185b998d5bdb6ea33cd926"
                                    },
                                    "PowerLoss": {
                                        "datatype": "float",
                                        "description": "Electrical energy lost by power dissipation to heat inside the battery.",
                                        "type": "sensor",
                                        "unit": "W",
                                        "uuid": "880082aafe025cb3a5776b623f9a48b5"
                                    },
                                    "ProductionDate": {
                                        "datatype": "string",
                                        "description": "Production date of battery in ISO8601 format, e.g. YYYY-MM-DD.",
                                        "type": "attribute",
                                        "uuid": "c9509ba4d76c56d9a8c1d6e2280ae02f"
                                    },
                                    "Range": {
                                        "datatype": "uint32",
                                        "description": "Remaining range in meters using only battery.",
                                        "type": "sensor",
                                        "unit": "m",
                                        "uuid": "c0376a425e5d578d9d86ae0dc2ad9778"
                                    },
                                    "StateOfCharge": {
                                        "children": {
                                            "Current": {
                                                "datatype": "float",
                                                "description": "Physical state of charge of the high voltage battery, relative to net capacity. This is not necessarily the state of charge being displayed to the customer.",
                                                "max": 100,
                                                "min": 0,
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "2e647ca3a1ff5e52af137aab240642da"
                                            },
                                            "Displayed": {
                                                "datatype": "float",
                                                "description": "State of charge displayed to the customer.",
                                                "max": 100,
                                                "min": 0,
                                                "type": "sensor",
                                                "unit": "percent",
                                                "uuid": "1bfcc228293b5512aafe2508ab0500d2"
                                            }
                                        },
                                        "description": "Information on the state of charge of the vehicle's high voltage battery.",
                                        "type": "branch",
                                        "uuid": "26bae2ce7c4d5e2a951915ef2f5d8b7d"
                                    },
                                    "StateOfHealth": {
                                        "comment": "Exact formula is implementation dependent. Could be e.g. current capacity at 20 degrees Celsius divided with original capacity at the same temperature.",
                                        "datatype": "float",
                                        "description": "Calculated battery state of health at standard conditions.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "sensor",
                                        "unit": "percent",
                                        "uuid": "4d982c47f3245048bcfec1190973a3ed"
                                    },
                                    "Temperature": {
                                        "children": {
                                            "Average": {
                                                "datatype": "float",
                                                "description": "Current average temperature of the battery cells.",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "ae28e502137f56b9a037ed9b32bc04e1"
                                            },
                                            "Max": {
                                                "datatype": "float",
                                                "description": "Current maximum temperature of the battery cells, i.e. temperature of the hottest cell.",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "07aa7c8ba1d355398d7469c2b337152a"
                                            },
                                            "Min": {
                                                "datatype": "float",
                                                "description": "Current minimum temperature of the battery cells, i.e. temperature of the coldest cell.",
                                                "type": "sensor",
                                                "unit": "celsius",
                                                "uuid": "4e3f630fefa7558fa302b175bc7eb5c7"
                                            }
                                        },
                                        "description": "Temperature Information for the battery pack.",
                                        "type": "branch",
                                        "uuid": "1cfbcf8c152959dcb3eb2c54fc42e623"
                                    }
                                },
                                "description": "Battery Management data.",
                                "type": "branch",
                                "uuid": "1a2515d1a8875d86873431194ade2b50"
                            },
                            "Transmission": {
                                "children": {
                                    "ClutchEngagement": {
                                        "datatype": "float",
                                        "description": "Clutch engagement. 0% = Clutch fully disengaged. 100% = Clutch fully engaged.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "actuator",
                                        "unit": "percent",
                                        "uuid": "2890bd4a2b6a56c19b62d7bd95151fc6"
                                    },
                                    "ClutchWear": {
                                        "datatype": "uint8",
                                        "description": "Clutch wear as a percent. 0 = no wear. 100 = worn.",
                                        "max": 100,
                                        "type": "sensor",
                                        "unit": "percent",
                                        "uuid": "c113405ad165571a9d53ae4cf55dc929"
                                    },
                                    "CurrentGear": {
                                        "datatype": "int8",
                                        "description": "The current gear. 0=Neutral, 1/2/..=Forward, -1/-2/..=Reverse.",
                                        "type": "sensor",
                                        "uuid": "cd0ba1d772565e16bff46cbd5c9361da"
                                    },
                                    "DiffLockFrontEngagement": {
                                        "datatype": "float",
                                        "description": "Front Diff Lock engagement. 0% = Diff lock fully disengaged. 100% = Diff lock fully engaged.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "actuator",
                                        "unit": "percent",
                                        "uuid": "5149afe37fbd5c24847b5820821abc02"
                                    },
                                    "DiffLockRearEngagement": {
                                        "datatype": "float",
                                        "description": "Rear Diff Lock engagement. 0% = Diff lock fully disengaged. 100% = Diff lock fully engaged.",
                                        "max": 100,
                                        "min": 0,
                                        "type": "actuator",
                                        "unit": "percent",
                                        "uuid": "197c939bd1405613b80179becec6db83"
                                    },
                                    "DriveType": {
                                        "allowed": [
                                            "UNKNOWN",
                                            "FORWARD_WHEEL_DRIVE",
                                            "REAR_WHEEL_DRIVE",
                                            "ALL_WHEEL_DRIVE"
                                        ],
                                        "datatype": "string",
                                        "default": "UNKNOWN",
                                        "description": "Drive type.",
                                        "type": "attribute",
                                        "uuid": "0e480b76fb2d5f8bb08fb586f90ee6ae"
                                    },
                                    "GearChangeMode": {
                                        "allowed": [
                                            "MANUAL",
                                            "AUTOMATIC"
                                        ],
                                        "datatype": "string",
                                        "description": "Is the gearbox in automatic or manual (paddle) mode.",
                                        "type": "actuator",
                                        "uuid": "ff3c69378c2f598286e51f7dac13adaa"
                                    },
                                    "GearCount": {
                                        "datatype": "int8",
                                        "default": 0,
                                        "description": "Number of forward gears in the transmission. -1 = CVT.",
                                        "type": "attribute",
                                        "uuid": "84293f40d3ed57f1a08992d97b1a9ccd"
                                    },
                                    "IsElectricalPowertrainEngaged": {
                                        "comment": "In some hybrid solutions it is possible to disconnect/disengage the electrical powertrain mechanically to avoid induced voltage reaching a too high level when driving at high speed.",
                                        "datatype": "boolean",
                                        "description": "Is electrical powertrain mechanically connected/engaged to the drivetrain or not. False = Disconnected/Disengaged. True = Connected/Engaged.",
                                        "type": "actuator",
                                        "uuid": "6660cf1d88d15430b1e7c8908a7b769b"
                                    },
                                    "IsLowRangeEngaged": {
                                        "comment": "The possibility to switch between low and high gear range is typically only available in heavy vehicles and off-road vehicles.",
                                        "datatype": "boolean",
                                        "description": "Is gearbox in low range mode or not. False = Normal/High range engaged. True = Low range engaged.",
                                        "type": "actuator",
                                        "uuid": "63ba7593926b574ebbe4f90b28557e78"
                                    },
                                    "IsParkLockEngaged": {
                                        "datatype": "boolean",
                                        "description": "Is the transmission park lock engaged or not. False = Disengaged. True = Engaged.",
                                        "type": "actuator",
                                        "uuid": "1578da3f925e54ac9df978abd0195408"
                                    },
                                    "PerformanceMode": {
                                        "allowed": [
                                            "NORMAL",
                                            "SPORT",
                                            "ECONOMY",
                                            "SNOW",
                                            "RAIN"
                                        ],
                                        "datatype": "string",
                                        "description": "Current gearbox performance mode.",
                                        "type": "actuator",
                                        "uuid": "6b5cfd85cb595e559503ccf993be04dd"
                                    },
                                    "SelectedGear": {
                                        "datatype": "int8",
                                        "description": "The selected gear. 0=Neutral, 1/2/..=Forward, -1/-2/..=Reverse, 126=Park, 127=Drive.",
                                        "type": "actuator",
                                        "uuid": "490fd99b9d5f562eb180c19e8cef5e12"
                                    },
                                    "Temperature": {
                                        "datatype": "int16",
                                        "description": "The current gearbox temperature.",
                                        "type": "sensor",
                                        "unit": "celsius",
                                        "uuid": "4f5e48c3511b5e1abff11aa7ec62dd18"
                                    },
                                    "TorqueDistribution": {
                                        "datatype": "float",
                                        "description": "Torque distribution between front and rear axle in percent. -100% = Full torque to front axle, 0% = 50:50 Front/Rear, 100% = Full torque to rear axle.",
                                        "max": 100,
                                        "min": -100,
                                        "type": "actuator",
                                        "unit": "percent",
                                        "uuid": "d3bcaaf973d3512287817049db9bd677"
                                    },
                                    "TravelledDistance": {
                                        "datatype": "float",
                                        "description": "Odometer reading, total distance travelled during the lifetime of the transmission.",
                                        "type": "sensor",
                                        "unit": "km",
                                        "uuid": "b9dd66f20c7f5b12a046766b94dc20c1"
                                    },
                                    "Type": {
                                        "allowed": [
                                            "UNKNOWN",
                                            "SEQUENTIAL",
                                            "H",
                                            "AUTOMATIC",
                                            "DSG",
                                            "CVT"
                                        ],
                                        "datatype": "string",
                                        "default": "UNKNOWN",
                                        "description": "Transmission type.",
                                        "type": "attribute",
                                        "uuid": "f83b9e5464d85a0288fcb32c164d3c63"
                                    }
                                },
                                "description": "Transmission-specific data, stopping at the drive shafts.",
                                "type": "branch",
                                "uuid": "6b71e284b63a527caa6296a66e9fdd0c"
                            },
                            "Type": {
                                "allowed": [
                                    "COMBUSTION",
                                    "HYBRID",
                                    "ELECTRIC"
                                ],
                                "comment": "For vehicles with a combustion engine (including hybrids) more detailed information on fuels supported can be found in FuelSystem.SupportedFuelTypes and FuelSystem.SupportedFuels.",
                                "datatype": "string",
                                "description": "Defines the powertrain type of the vehicle.",
                                "type": "attribute",
                                "uuid": "2a000da4204658a4a6e3ecd5176bdfba"
                            }
                        },
                        "description": "Powertrain data for battery management, etc.",
                        "type": "branch",
                        "uuid": "12f35ec7bd1c58d1a329565ce3d053d5"
                    },
                    "RoofLoad": {
                        "datatype": "int16",
                        "description": "The permitted total weight of cargo and installations (e.g. a roof rack) on top of the vehicle.",
                        "type": "attribute",
                        "unit": "kg",
                        "uuid": "97dc98269a19591d9efa455a8d943c16"
                    },
                    "Service": {
                        "children": {
                            "DistanceToService": {
                                "datatype": "float",
                                "description": "Remaining distance to service (of any kind). Negative values indicate service overdue.",
                                "type": "sensor",
                                "unit": "km",
                                "uuid": "6f4347ce149759819572c8c3a17e8d93"
                            },
                            "IsServiceDue": {
                                "datatype": "boolean",
                                "description": "Indicates if vehicle needs service (of any kind). True = Service needed now or in the near future. False = No known need for service.",
                                "type": "sensor",
                                "uuid": "3e28f85ccccd5702b9adbe9a761ea1b4"
                            },
                            "TimeToService": {
                                "datatype": "int32",
                                "description": "Remaining time to service (of any kind). Negative values indicate service overdue.",
                                "type": "sensor",
                                "unit": "s",
                                "uuid": "c968be91a5685fa9ae30b84a0f91934e"
                            }
                        },
                        "description": "Service data.",
                        "type": "branch",
                        "uuid": "b6463772705b56a7a993e23601bd3d47"
                    },
                    "Speed": {
                        "datatype": "float",
                        "description": "Vehicle speed.",
                        "type": "sensor",
                        "unit": "km/h",
                        "uuid": "efe50798638d55fab18ab7d43cc490e9"
                    },
                    "Trailer": {
                        "children": {
                            "IsConnected": {
                                "datatype": "boolean",
                                "description": "Signal indicating if trailer is connected or not.",
                                "type": "sensor",
                                "uuid": "77f28ed03c125ac9a19d22e9436b0ec4"
                            }
                        },
                        "description": "Trailer signals.",
                        "type": "branch",
                        "uuid": "66206ee5c25a5817bef214c0c8ae8013"
                    },
                    "TravelledDistance": {
                        "datatype": "float",
                        "description": "Odometer reading, total distance travelled during the lifetime of the vehicle.",
                        "type": "sensor",
                        "unit": "km",
                        "uuid": "90be9d7b0ac15b75a83027ea3b73b65b"
                    },
                    "TripMeterReading": {
                        "datatype": "float",
                        "description": "Current trip meter reading.",
                        "type": "sensor",
                        "unit": "km",
                        "uuid": "81f51ebfe29c591190171d7b96e1c948"
                    },
                    "VehicleIdentification": {
                        "children": {
                            "AcrissCode": {
                                "datatype": "string",
                                "description": "The ACRISS Car Classification Code is a code used by many car rental companies.",
                                "type": "attribute",
                                "uuid": "115a821e8e0b57f08e4b9e61e85d7156"
                            },
                            "BodyType": {
                                "datatype": "string",
                                "description": "Indicates the design and body style of the vehicle (e.g. station wagon, hatchback, etc.).",
                                "type": "attribute",
                                "uuid": "e6d5c71ecec95d68b0b59bb7e93af759"
                            },
                            "Brand": {
                                "datatype": "string",
                                "description": "Vehicle brand or manufacturer.",
                                "type": "attribute",
                                "uuid": "19fd645ff5385767bcdbf5dd4313483f"
                            },
                            "DateVehicleFirstRegistered": {
                                "datatype": "string",
                                "description": "The date in ISO 8601 format of the first registration of the vehicle with the respective public authorities.",
                                "type": "attribute",
                                "uuid": "046f47acf62e50bd863d6568d73743d7"
                            },
                            "KnownVehicleDamages": {
                                "datatype": "string",
                                "description": "A textual description of known damages, both repaired and unrepaired.",
                                "type": "attribute",
                                "uuid": "e87f352cddb15e94b340506b17207586"
                            },
                            "MeetsEmissionStandard": {
                                "datatype": "string",
                                "description": "Indicates that the vehicle meets the respective emission standard.",
                                "type": "attribute",
                                "uuid": "d75dedbfadca54d8b6c7261c37ad5d83"
                            },
                            "Model": {
                                "datatype": "string",
                                "description": "Vehicle model.",
                                "type": "attribute",
                                "uuid": "dd3d3b72e6a85b3695ba25f829255403"
                            },
                            "ProductionDate": {
                                "datatype": "string",
                                "description": "The date in ISO 8601 format of production of the item, e.g. vehicle.",
                                "type": "attribute",
                                "uuid": "5683877c4bac504d915b268c9476c190"
                            },
                            "PurchaseDate": {
                                "datatype": "string",
                                "description": "The date in ISO 8601 format of the item e.g. vehicle was purchased by the current owner.",
                                "type": "attribute",
                                "uuid": "31302f8b57e85c4197afda3e3201fce8"
                            },
                            "VIN": {
                                "datatype": "string",
                                "description": "17-character Vehicle Identification Number (VIN) as defined by ISO 3779.",
                                "type": "attribute",
                                "uuid": "6f0b6fa8c34f589baa92e565bc9df5bd"
                            },
                            "VehicleConfiguration": {
                                "datatype": "string",
                                "description": "A short text indicating the configuration of the vehicle, e.g. '5dr hatchback ST 2.5 MT 225 hp' or 'limited edition'.",
                                "type": "attribute",
                                "uuid": "2526c7ba4c8458c78000a9e5f2fe89d5"
                            },
                            "VehicleInteriorColor": {
                                "datatype": "string",
                                "description": "The color or color combination of the interior of the vehicle.",
                                "type": "attribute",
                                "uuid": "67a8b069b8bf573993d51959c24f04e2"
                            },
                            "VehicleInteriorType": {
                                "datatype": "string",
                                "description": "The type or material of the interior of the vehicle (e.g. synthetic fabric, leather, wood, etc.).",
                                "type": "attribute",
                                "uuid": "4c4eed302b2e51daa9b6f5f398987a77"
                            },
                            "VehicleModelDate": {
                                "datatype": "string",
                                "description": "The release date in ISO 8601 format of a vehicle model (often used to differentiate versions of the same make and model).",
                                "type": "attribute",
                                "uuid": "c71b63f83dea536bac58e62bbe537f11"
                            },
                            "VehicleSeatingCapacity": {
                                "datatype": "uint16",
                                "description": "The number of passengers that can be seated in the vehicle, both in terms of the physical space available, and in terms of limitations set by law.",
                                "type": "attribute",
                                "uuid": "7ae5db0e0482555686b9be71dd8a0c38"
                            },
                            "VehicleSpecialUsage": {
                                "datatype": "string",
                                "description": "Indicates whether the vehicle has been used for special purposes, like commercial rental, driving school.",
                                "type": "attribute",
                                "uuid": "7e6e8a48f54a5549a8f6af8f1dc5eb8d"
                            },
                            "WMI": {
                                "datatype": "string",
                                "description": "3-character World Manufacturer Identification (WMI) as defined by ISO 3780.",
                                "type": "attribute",
                                "uuid": "e7c86defbcd554a79f90ba85de58e133"
                            },
                            "Year": {
                                "datatype": "uint16",
                                "description": "Model year of the vehicle.",
                                "type": "attribute",
                                "uuid": "9a76b0aca8e45f6fb33dbaf5b976b8b5"
                            }
                        },
                        "description": "Attributes that identify a vehicle.",
                        "type": "branch",
                        "uuid": "c33861c3e9125208b05f23fe922bf08e"
                    },
                    "VersionVSS": {
                        "children": {
                            "Label": {
                                "datatype": "string",
                                "default": "develop",
                                "description": "Label to further describe the version.",
                                "type": "attribute",
                                "uuid": "7c92cd50d24b5662922b27cb9a327e53"
                            },
                            "Major": {
                                "datatype": "uint32",
                                "default": 3,
                                "description": "Supported Version of VSS - Major version.",
                                "type": "attribute",
                                "uuid": "5edf1a338c975cbb84d4ce3cfe1aa4b4"
                            },
                            "Minor": {
                                "datatype": "uint32",
                                "default": 1,
                                "description": "Supported Version of VSS - Minor version.",
                                "type": "attribute",
                                "uuid": "6e70a598dbc7534c96c58c18e9888cfd"
                            },
                            "Patch": {
                                "datatype": "uint32",
                                "default": 0,
                                "description": "Supported Version of VSS - Patch version.",
                                "type": "attribute",
                                "uuid": "69858f224af459338b9bfbff436dda45"
                            }
                        },
                        "description": "Supported Version of VSS.",
                        "type": "branch",
                        "uuid": "9a687e56f1305eedb20f6a021ea58f48"
                    },
                    "Width": {
                        "datatype": "uint16",
                        "default": 0,
                        "description": "Overall vehicle width.",
                        "type": "attribute",
                        "unit": "mm",
                        "uuid": "b4aabe144e3259adb1459a2e25fec9bd"
                    }
                }
            },
            "V2C": {
                "description": "Vehicle to Cloud API",
                "type": "branch",
                "uuid": "f815a0845bab4190b5af77e965f0766a",
                "children": {}
            }
        },
        "description": "Vehicle",
        "type": "branch",
        "uuid": "219270ef27c4531f874bbda63743b330"
    }
}`;
