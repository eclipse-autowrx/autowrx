import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import ApiDetail from '@/components/organisms/ApiDetail'
import { VehicleApi } from '@/types/model.type'
import ModelApiList from '@/components/organisms/ModelApiList'
import { DaImage } from '@/components/atoms/DaImage'
import DaTabItem from '@/components/atoms/DaTabItem'
import DaTreeView from '@/components/molecules/DaTreeView'
import DaLoadingWrapper from '@/components/molecules/DaLoadingWrapper'
import useModelStore from '@/stores/modelStore'
import {
  TbBinaryTree2,
  TbGitCompare,
  TbList,
  TbDownload,
  TbReplace,
  TbLoader,
  TbPlus,
  TbSearch
} from 'react-icons/tb'
import useCurrentModel from '@/hooks/useCurrentModel'
import DaText from '@/components/atoms/DaText'
import VssComparator from '@/components/organisms/VssComparator'
import { getComputedAPIs, replaceAPIsService } from '@/services/model.service'
import { isAxiosError } from 'axios'
import { toast } from 'react-toastify'
import DaPopup from '@/components/atoms/DaPopup'
import DaFileUpload from '@/components/atoms/DaFileUpload'
import { DaButton } from '@/components/atoms/DaButton'
import usePermissionHook from '@/hooks/usePermissionHook'
import { PERMISSIONS } from '@/data/permission'
import { DaApiList } from '../molecules/DaApiList'
import { DaInput } from '../atoms/DaInput'
import DaFilter from '../atoms/DaFilter'
import { debounce } from '@/lib/utils'
import { shallow } from 'zustand/shallow'
import FormCreateWishlistApi from '../molecules/forms/FormCreateWishlistApi'
import DaLoading from '../atoms/DaLoading'
import { DaHierarchicalView } from '@/components/molecules/DaApiHierarchicalView'
import { DaCopy } from '../atoms/DaCopy'
import { GoDotFill } from "react-icons/go";

// Sample service data
// [
//   {
//     "ServiceName": "BO_Atm_FobKey",
//     "ServiceDescription": "Radio frequency key",
//     "ServiceID": "7e8f9b2a-c531-4d06-9e84-75c13f62d0a8",
//     "Fields": {
//       "ntfKeyRemCmd": {
//         "RPCType": "Field",
//         "name": "ntfKeyRemCmd",
//         "method_id": "0x8001",
//         "desc": "Notification key remote control command",
//         "field_type": "Notification Event",
//         "ref_data_type": "KeyRemCmdInfo_stru"
//       }
//     },
//     "DataTypes": {
//       "RollgCtr_u8": {
//         "version": "1.0.0",
//         "description": "Rolling count",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-"
//       },
//       "KeyIdx_u8": {
//         "version": "1.0.0",
//         "description": "Key number",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-"
//       },
//       "RemCmd_u8": {
//         "version": "1.0.0",
//         "description": "Remote control command (button status)",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x00": {
//             "name": "None",
//             "description": "Initial value"
//           },
//           "0x01": {
//             "name": "LockDoor",
//             "description": "Remote control locking (click and briefly press the locking button)"
//           },
//           "0x02": {
//             "name": "Reserved"
//           },
//           "0x03": {
//             "name": "UnlockDoor",
//             "description": "Remote control unlocking (click and briefly press the unlock button)"
//           },
//           "0x04": {
//             "name": "OpenTailgate",
//             "description": "Open the luggage compartment (click and hold the tailgate button for 2 seconds) (associated configuration word)"
//           },
//           "0x05": {
//             "name": "OpenAllWin",
//             "description": "One-key window lowering (click and hold the locking button for 2 seconds)"
//           },
//           "0x06": {
//             "name": "CloseAllWin",
//             "description": "One-key window lifting (click and long-press the unlock button for 2 seconds)"
//           },
//           "0x07": {
//             "name": "Reserved"
//           },
//           "0x08": {
//             "name": "Reserved"
//           },
//           "0x09": {
//             "name": "FindCar",
//             "description": "Find the car (double-click the lock button briefly within 1 second)"
//           },
//           "0x0A": {
//             "name": "TailgatePress",
//             "description": "Click and briefly press the tailgate button"
//           },
//           "0x0B": {
//             "name": "Rpa",
//             "description": "Remote parking (Click and hold the tailgate button for 2 seconds) (Related configuration words)"
//           }
//         }
//       },
//       "KeyRemCmdInfo_stru": {
//         "version": "1.0.0",
//         "description": "Key Remote Command Information",
//         "category": "Struct",
//         "members": {
//           "KeyIdx": {
//             "position": 0,
//             "name": "KeyIdx",
//             "datatype": "KeyIdx_u8"
//           },
//           "KeyRemCmd": {
//             "position": 1,
//             "name": "KeyRemCmd",
//             "datatype": "RemCmd_u8"
//           },
//           "RemCmdCtr": {
//             "position": 2,
//             "name": "RemCmdCtr",
//             "datatype": "RollgCtr_u8"
//           }
//         }
//       }
//     }
//   },
//   {
//     "ServiceName": "BO_Bs_AntithftMgr",
//     "ServiceDescription": "Basic anti-theft service",
//     "ServiceID": "d94c21b5-3876-49f2-b1e0-8f6a7d92c35e",
//     "Fields": {
//       "ntfArmedSt": {
//         "RPCType": "Field",
//         "name": "ntfArmedSt",
//         "method_id": "0x8001",
//         "desc": "Notify the anti-theft status",
//         "field_type": "Notification Event",
//         "ref_data_type": "ArmedSt_u8"
//       }
//     },
//     "DataTypes": {
//       "ArmedSt_u8": {
//         "version": "1.1.0",
//         "description": "Anti-theft Armed Status",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x0": {
//             "name": "Disarm",
//             "description": "Vehicle is disarmed"
//           },
//           "0x1": {
//             "name": "PreDisarm",
//             "description": "Pre-disarm state"
//           },
//           "0x2": {
//             "name": "PreArmed",
//             "description": "Pre-armed state"
//           },
//           "0x3": {
//             "name": "HalfArmed",
//             "description": "Partially armed state"
//           },
//           "0x4": {
//             "name": "FullArmed",
//             "description": "Fully armed state"
//           },
//           "0x5": {
//             "name": "Alrm",
//             "description": "Alarm is triggered"
//           },
//           "0x6": {
//             "name": "ArmingFaultMode",
//             "description": "Arming fault detected"
//           }
//         }
//       }
//     }
//   },
//   {
//     "ServiceName": "BO_Bs_Horn",
//     "ServiceDescription": "Horn control basic service",
//     "ServiceID": "18a25dfc-6e73-4b9c-80a1-f29d56e84729",
//     "Fields": {
//       "ntfAcvClient": {
//         "RPCType": "Field",
//         "name": "ntfAcvClient",
//         "method_id": "0x8001",
//         "desc": "Service status (current request source)",
//         "field_type": "Notification Event",
//         "ref_data_type": "PrioInfo_stru"
//       }
//     },
//     "Methods": {
//       "hornCtrl": {
//         "RPCType": "R/R Method",
//         "name": "hornCtrl",
//         "method_id": "0x0001",
//         "desc": "Horn activation control",
//         "inputs": [
//           {
//             "name": "HornCmd_u8",
//             "description": "Horn command"
//           },
//           {
//             "name": "HornMod_stru",
//             "description": "Horn mode parameters"
//           },
//           {
//             "name": "PrioInfo_stru",
//             "description": "Priority information"
//           }
//         ],
//         "outputs": [
//           {
//             "name": "BsRtnCod_u8",
//             "description": "Service return code"
//           }
//         ]
//       }
//     },
//     "DataTypes": {
//       "Prio_u8": {
//         "version": "1.0.0",
//         "description": "Priority level",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x00": {
//             "name": "HighestPriority",
//             "description": "Highest priority"
//           },
//           "0xFF": {
//             "name": "LowestPriority",
//             "description": "Lowest priority (release)"
//           }
//         }
//       },
//       "PrioInfo_stru": {
//         "version": "1.0.0",
//         "description": "Priority information",
//         "category": "Struct",
//         "members": {
//           "ReqId": {
//             "position": 0,
//             "name": "ReqId",
//             "description": "Request ID",
//             "datatype": "ReqId_u16"
//           },
//           "Prio": {
//             "position": 1,
//             "name": "Prio",
//             "description": "Priority",
//             "datatype": "Prio_u8"
//           }
//         }
//       },
//       "ReqId_u16": {
//         "version": "1.0.0",
//         "description": "Request ID",
//         "category": "Integer",
//         "baseDatatype": "uint16",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 65535,
//         "initialValue": 0,
//         "invalidValue": 65535,
//         "unit": "-"
//       },
//       "Dur10Ms_q10_10ms_u16": {
//         "version": "1.0.0",
//         "description": "Time (10x milliseconds)",
//         "category": "Integer",
//         "baseDatatype": "uint16",
//         "resolution": 10,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 655350,
//         "initialValue": 0,
//         "invalidValue": 65535,
//         "unit": "10ms",
//         "remark": "10x milliseconds; resolution 10ms; physical range 0-655340ms"
//       },
//       "BsRtnCod_u8": {
//         "version": "1.0.0",
//         "description": "Enhanced service return value",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x00": {
//             "name": "OK",
//             "description": "Request accepted"
//           },
//           "0x01": {
//             "name": "WAITING_HIGHER_PRIORITY_TASK",
//             "description": "Waiting for higher priority task to complete"
//           },
//           "0x02": {
//             "name": "FAIL_WORKING_CONDITION_UNFULFILLED",
//             "description": "Current mode not supported (e.g., fault, heat protection)"
//           },
//           "0x03": {
//             "name": "FAIL_HIGHER_PRIORITY_TASK_ONGOING",
//             "description": "Higher priority task is busy"
//           },
//           "0x04": {
//             "name": "FAIL_INVALID_REQUEST",
//             "description": "Invalid request (e.g., invalid parameters, priority/ReqID mismatch)"
//           }
//         }
//       },
//       "HornCmd_u8": {
//         "version": "1.0.0",
//         "description": "Horn command",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x0": {
//             "name": "Off",
//             "description": "Turn horn off"
//           },
//           "0x1": {
//             "name": "On",
//             "description": "Turn horn on"
//           }
//         }
//       },
//       "HornMod_stru": {
//         "version": "1.0.0",
//         "description": "Horn mode parameters",
//         "category": "Struct",
//         "members": {
//           "HornFrq": {
//             "position": 0,
//             "name": "HornFrq",
//             "description": "Horn on/off frequency",
//             "datatype": "HornFrq_stru"
//           },
//           "RepCtr": {
//             "position": 1,
//             "name": "RepCtr",
//             "description": "Horn repeat count",
//             "datatype": "RepCtr_u8"
//           }
//         }
//       },
//       "HornFrq_stru": {
//         "version": "1.1.0",
//         "description": "Horn on/off frequency",
//         "category": "Struct",
//         "members": {
//           "OnDur": {
//             "position": 0,
//             "name": "OnDur",
//             "description": "Duration horn is on in a cycle (in 10ms units)",
//             "datatype": "Dur10Ms_q10_10ms_u16"
//           },
//           "OffDur": {
//             "position": 1,
//             "name": "OffDur",
//             "description": "Duration horn is off in a cycle (in 10ms units)",
//             "datatype": "Dur10Ms_q10_10ms_u16"
//           }
//         }
//       },
//       "RepCtr_u8": {
//         "version": "1.0.0",
//         "description": "Repeat count",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x0": {
//             "name": "Infinite",
//             "description": "Infinite repetitions"
//           }
//         },
//         "remark": "0 means infinite repetitions, other values represent the specific number of repetitions"
//       }
//     }
//   },
//   {
//     "ServiceName": "BO_Bs_TurnLi",
//     "ServiceDescription": "Turn Light Basic Service",
//     "ServiceID": "3b92f5c6-0d47-48ae-b6f1-a2c4e9d78530",
//     "Fields": {
//       "setOnBriLvl": {
//         "RPCType": "Field",
//         "name": "setOnBriLvl",
//         "method_id": "0x0002",
//         "desc": "Set turn light brightness level when on",
//         "field_type": "Setter",
//         "ref_data_type": "LiBriLvl_u8"
//       },
//       "setGrdtTi": {
//         "RPCType": "Field",
//         "name": "setGrdtTi",
//         "method_id": "0x0003",
//         "desc": "Set turn light gradual transition time",
//         "field_type": "Setter",
//         "ref_data_type": "ShadeTi_u16"
//       },
//       "setStopPat": {
//         "RPCType": "Field",
//         "name": "setStopPat",
//         "method_id": "0x0004",
//         "desc": "Set soft/hard stop mode",
//         "field_type": "Setter",
//         "ref_data_type": "TurnLiStopPat_stru"
//       },
//       "ntfAcvClient": {
//         "RPCType": "Field",
//         "name": "ntfAcvClient",
//         "method_id": "0x8001",
//         "desc": "Service status (current request source)",
//         "field_type": "Notification Event",
//         "ref_data_type": "AcvClient_stru"
//       },
//       "ntfTurnLiSt": {
//         "RPCType": "Field",
//         "name": "ntfTurnLiSt",
//         "method_id": "0x8002",
//         "desc": "Turn light status (summary of each side's status)",
//         "field_type": "Notification Event",
//         "ref_data_type": "TurnLiSt_stru"
//       },
//       "ntfTurnLiIndcnSt": {
//         "RPCType": "Field",
//         "name": "ntfTurnLiIndcnSt",
//         "method_id": "0x8003",
//         "desc": "Turn light indication status (operation type: turn signal, hazard warning, etc.)",
//         "field_type": "Notification Event",
//         "ref_data_type": "TurnLiIndcnSt_u8"
//       }
//     },
//     "Methods": {
//       "liCtrl": {
//         "RPCType": "R/R Method",
//         "name": "liCtrl",
//         "method_id": "0x0001",
//         "desc": "Turn light control",
//         "inputs": [
//           {
//             "name": "TurnLiCmd_u8",
//             "description": "Turn light command"
//           },
//           {
//             "name": "TurnLiId_u16",
//             "description": "Turn light ID"
//           },
//           {
//             "name": "TurnLiFlsPat_stru",
//             "description": "Turn light flash pattern"
//           },
//           {
//             "name": "PrioInfo_stru",
//             "description": "Priority information"
//           }
//         ],
//         "outputs": [
//           {
//             "name": "BsRtnCod_u8",
//             "description": "Service return code"
//           }
//         ]
//       }
//     },
//     "DataTypes": {
//       "TurnLiSt_stru": {
//         "version": "1.0.0",
//         "description": "Turn light status",
//         "category": "Struct",
//         "members": {
//           "TurnLiLeSt": {
//             "position": 1,
//             "name": "TurnLiLeSt",
//             "description": "Left turn light status",
//             "datatype": "TurnLiOnOffSt_u8"
//           },
//           "TurnLiRiSt": {
//             "position": 2,
//             "name": "TurnLiRiSt",
//             "description": "Right turn light status",
//             "datatype": "TurnLiOnOffSt_u8"
//           }
//         }
//       },
//       "TurnLiOnOffSt_u8": {
//         "version": "1.0.0",
//         "description": "Turn light operation status",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x0": {
//             "name": "NotActive",
//             "description": "Not active"
//           },
//           "0x1": {
//             "name": "Off",
//             "description": "Off"
//           },
//           "0x2": {
//             "name": "On",
//             "description": "On"
//           }
//         }
//       },
//       "TurnLiIndcnSt_u8": {
//         "version": "1.0.0",
//         "description": "Turn light indication status",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x0": {
//             "name": "None",
//             "description": "No indication"
//           },
//           "0x1": {
//             "name": "Left",
//             "description": "Left turn indication"
//           },
//           "0x2": {
//             "name": "Right",
//             "description": "Right turn indication"
//           },
//           "0x3": {
//             "name": "LeftAndRight",
//             "description": "Both left and right turn indication"
//           },
//           "0x4": {
//             "name": "HazardWarning",
//             "description": "Hazard warning indication"
//           }
//         }
//       },
//       "TurnLiCmd_u8": {
//         "version": "1.0.0",
//         "description": "Turn light control request",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x0": {
//             "name": "Off",
//             "description": "Turn off"
//           },
//           "0x1": {
//             "name": "LeftTurnLight",
//             "description": "Left turn light"
//           },
//           "0x2": {
//             "name": "RightTurnLight",
//             "description": "Right turn light"
//           },
//           "0x3": {
//             "name": "LeftAndRightTurnLight",
//             "description": "Both left and right turn lights"
//           },
//           "0x4": {
//             "name": "HazardWarning",
//             "description": "Hazard warning"
//           },
//           "0x5": {
//             "name": "LiShow",
//             "description": "Light show"
//           }
//         }
//       },
//       "TurnLiId_u16": {
//         "version": "1.0.0",
//         "description": "Turn light ID",
//         "category": "Integer",
//         "baseDatatype": "uint16",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 65535,
//         "initialValue": 0,
//         "invalidValue": 65535,
//         "unit": "-",
//         "bitfields": {
//           "0": {
//             "name": "LeftFront",
//             "description": "Left front turn light"
//           },
//           "1": {
//             "name": "LeftRear",
//             "description": "Left rear turn light"
//           },
//           "2": {
//             "name": "Reserved2",
//             "description": "Reserved"
//           },
//           "3": {
//             "name": "Reserved3",
//             "description": "Reserved"
//           },
//           "4": {
//             "name": "RightFront",
//             "description": "Right front turn light"
//           },
//           "5": {
//             "name": "RightRear",
//             "description": "Right rear turn light"
//           },
//           "6": {
//             "name": "Reserved6",
//             "description": "Reserved"
//           },
//           "7": {
//             "name": "Reserved7",
//             "description": "Reserved"
//           }
//         }
//       },
//       "Prio_u8": {
//         "version": "1.0.0",
//         "description": "Priority level",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x00": {
//             "name": "HighestPriority",
//             "description": "Highest priority"
//           },
//           "0xFF": {
//             "name": "LowestPriority",
//             "description": "Lowest priority (release)"
//           }
//         }
//       },
//       "TurnLiFlsPat_stru": {
//         "version": "1.0.0",
//         "description": "Turn light flash pattern",
//         "category": "Struct",
//         "members": {
//           "FlsFrq": {
//             "position": 0,
//             "name": "FlsFrq",
//             "description": "Flash frequency",
//             "datatype": "FlsFrq_stru"
//           },
//           "FlsCyc": {
//             "position": 1,
//             "name": "FlsCyc",
//             "description": "Repeat count",
//             "datatype": "FlsCyc_u8"
//           }
//         }
//       },
//       "FlsFrq_stru": {
//         "version": "1.1.0",
//         "description": "Flash frequency",
//         "category": "Struct",
//         "members": {
//           "OnDur": {
//             "position": 0,
//             "name": "OnDur",
//             "description": "On duration in a flash cycle (in 10ms units)",
//             "datatype": "Dur10Ms_q10_10ms_u16"
//           },
//           "OffDur": {
//             "position": 1,
//             "name": "OffDur",
//             "description": "Off duration in a flash cycle (in 10ms units)",
//             "datatype": "Dur10Ms_q10_10ms_u16"
//           }
//         }
//       },
//       "PrioInfo_stru": {
//         "version": "1.0.0",
//         "description": "Priority information",
//         "category": "Struct",
//         "members": {
//           "ReqId": {
//             "position": 0,
//             "name": "ReqId",
//             "description": "Request ID",
//             "datatype": "ReqId_u16"
//           },
//           "Prio": {
//             "position": 1,
//             "name": "Prio",
//             "description": "Priority",
//             "datatype": "Prio_u8"
//           }
//         }
//       },
//       "AcvClient_stru": {
//         "version": "1.0.0",
//         "description": "Service status",
//         "category": "Struct",
//         "members": {
//           "ReqId": {
//             "position": 0,
//             "name": "ReqId",
//             "description": "Request ID",
//             "datatype": "ReqId_u16"
//           },
//           "Prio": {
//             "position": 1,
//             "name": "Prio",
//             "description": "Priority",
//             "datatype": "Prio_u8"
//           },
//           "ReqCtr": {
//             "position": 2,
//             "name": "ReqCtr",
//             "description": "Request counter",
//             "datatype": "ReqCtr_u8"
//           }
//         }
//       },
//       "ReqId_u16": {
//         "version": "1.0.0",
//         "description": "Request ID",
//         "category": "Integer",
//         "baseDatatype": "uint16",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 65535,
//         "initialValue": 0,
//         "invalidValue": 65535,
//         "unit": "-"
//       },
//       "Dur10Ms_q10_10ms_u16": {
//         "version": "1.0.0",
//         "description": "Time (10x milliseconds)",
//         "category": "Integer",
//         "baseDatatype": "uint16",
//         "resolution": 10,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 655350,
//         "initialValue": 0,
//         "invalidValue": 65535,
//         "unit": "10ms",
//         "remark": "10x milliseconds; resolution 10ms; physical range 0-655340ms"
//       },
//       "FlsCyc_u8": {
//         "version": "1.0.0",
//         "description": "Flash cycle count",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x0": {
//             "name": "Infinite",
//             "description": "Continuous flashing"
//           }
//         },
//         "remark": "0 means continuous flashing, values 1-100 represent specific flash counts"
//       },
//       "TurnLiStopPat_stru": {
//         "version": "1.0.0",
//         "description": "Turn light stop pattern",
//         "category": "Struct",
//         "members": {
//           "StopPatForPhaOn": {
//             "position": 0,
//             "name": "StopPatForPhaOn",
//             "description": "Stop pattern for ON phase",
//             "datatype": "IndcnStopPat_u8"
//           },
//           "StopPatForPhaOff": {
//             "position": 1,
//             "name": "StopPatForPhaOff",
//             "description": "Stop pattern for OFF phase",
//             "datatype": "IndcnStopPat_u8"
//           }
//         }
//       },
//       "IndcnStopPat_u8": {
//         "version": "1.0.0",
//         "description": "Turn light soft/hard stop mode",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x0": {
//             "name": "HardStop",
//             "description": "Immediate stop"
//           },
//           "0x1": {
//             "name": "SoftStop",
//             "description": "Gradual fade stop"
//           }
//         }
//       },
//       "BsRtnCod_u8": {
//         "version": "1.0.0",
//         "description": "Enhanced service return value",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x00": {
//             "name": "OK",
//             "description": "Request accepted"
//           },
//           "0x01": {
//             "name": "WAITING_HIGHER_PRIORITY_TASK",
//             "description": "Waiting for higher priority task to complete"
//           },
//           "0x02": {
//             "name": "FAIL_WORKING_CONDITION_UNFULFILLED",
//             "description": "Current mode not supported (e.g., fault, heat protection)"
//           },
//           "0x03": {
//             "name": "FAIL_HIGHER_PRIORITY_TASK_ONGOING",
//             "description": "Higher priority task is busy"
//           },
//           "0x04": {
//             "name": "FAIL_INVALID_REQUEST",
//             "description": "Invalid request (e.g., invalid parameters, priority/ReqID mismatch)"
//           }
//         }
//       },
//       "ReqCtr_u8": {
//         "version": "1.0.0",
//         "description": "Session ID",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-"
//       },
//       "LiBriLvl_u8": {
//         "version": "1.0.0",
//         "description": "Light brightness level",
//         "category": "Integer",
//         "baseDatatype": "uint8",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 255,
//         "initialValue": 0,
//         "invalidValue": 255,
//         "unit": "-",
//         "values": {
//           "0x00": {
//             "name": "Off",
//             "description": "Off"
//           },
//           "0x65": {
//             "name": "CurrentBrightness",
//             "description": "Use current brightness as starting point"
//           }
//         },
//         "remark": "Values 1-100 represent brightness percentage, 0x65 means use current brightness"
//       },
//       "ShadeTi_u16": {
//         "version": "1.0.0",
//         "description": "Transition time",
//         "category": "Integer",
//         "baseDatatype": "uint16",
//         "resolution": 1,
//         "offset": 0,
//         "physicalMin": 0,
//         "physicalMax": 65535,
//         "initialValue": 0,
//         "invalidValue": 65535,
//         "unit": "ms",
//         "values": {
//           "0xFFFE": {
//             "name": "DefaultTime",
//             "description": "Use default transition time"
//           }
//         },
//         "remark": "Time in milliseconds, 0xFFFE means use default time"
//       }
//     }
//   }
// ]


interface UspServiceListProps {
  services: any[];
  onServiceSelected: (service: any) => void;
  activeService: any;
}



const ServiceListItem = ({ service, onClick, isSelected }: { service: any, onClick: () => void, isSelected: boolean }) => {
  return <div
    className={`w-full min-w-full justify-between py-2 text-da-gray-medium cursor-pointer hover:bg-da-primary-100 items-center px-2 rounded ${isSelected ? 'bg-da-primary-100 text-da-primary-500' : ''
      }`}
    onClick={onClick}
  // onMouseEnter={handleMouseEnter}
  // onMouseLeave={handleMouseLeave}
  >
    <div className="flex flex-1 truncate cursor-pointer items-center">
      <div
        className={`text-sm grow cursor-pointer ${isSelected ? 'font-bold' : 'font-medium'} truncate`}
      >
        <span className="mr-1">•</span>{service.ServiceName}
      </div>
      <div className='ml-2 text-xs text-da-gray-medium w-[54px]'> Fields: <b>{Object.keys(service.Fields || {}).length}</b></div>
      <div className='ml-2 text-xs text-da-gray-medium w-[74px]'> Methods: <b>{Object.keys(service.Methods || {}).length}</b></div>
      <div className='ml-2 text-xs text-da-gray-medium w-[74px]'> Data Types: <b>{Object.keys(service.DataTypes || {}).length}</b></div>
    </div>
    <div className='flex items-center text-xs text-da-gray-medium'>
      {service.ServiceDescription}
    </div>
  </div>
}

const UspSeviceList = ({ services, onServiceSelected, activeService }: UspServiceListProps) => {

  const [localServices, setLocalServices] = useState(services);

  useEffect(() => {
    setLocalServices(services);
  }, [services]);


  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  useEffect(() => {
    handleSearch(searchTerm);
  }, [searchTerm]);

  const handleSearch = (term: string) => {
    if (term.trim().length <= 0) {
      setLocalServices(services);
      return;
    }
    const filteredServices = services.filter((service) => service.ServiceName.toLowerCase().includes(term.trim().toLowerCase()));
    console.log(filteredServices);
    setLocalServices(filteredServices);
  };

  const handleFilterChange = (selectedOptions: string[]) => {
    // Implement filter change logic here
    console.log('Filter changed:', selectedOptions);
  };

  return <div className='h-full w-full px-2'>
    <div className="mb-2 flex items-center">
      <div className='w-full py-2'>
        <DaInput
          placeholder="Search Service"
          className="mr-2 w-full"
          Icon={TbSearch}
          iconBefore={true}
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>
      {/* <DaFilter
          categories={{
            Signal: ['Default', 'Wishlist'],
            Type: ['Branch', 'Sensor', 'Actuator', 'Attribute'],
          }}
          onChange={handleFilterChange}
          className="w-full"
        /> */}
    </div>
    {localServices && localServices.length > 0 ? (
      localServices.map((service, index) => (
        <ServiceListItem key={index} service={service} onClick={() => onServiceSelected(service)} isSelected={service === activeService} />
      ))
    ) : (
      <div className="flex justify-center items-center py-4 h-[200px]">
        <DaText variant="small" className="text-center text-gray-400">
          No services available
        </DaText>
      </div>
    )}
  </div>
}

interface ServiceDetailProps {
  service: any;
}

const ServiceDetail = ({ service }: ServiceDetailProps) => {
  return <div className='w-full px-2 py-2 max-h-[calc(100vh-250px)] overflow-auto'>
    <div className="">
      <div>
        <DaImage
          src={`/misc/${service.ServiceName}.png`}
          className="object-contain max-h-[340px] min-h-[340px] w-full"
        />
      </div>
      
      <h2 className="text-xl font-bold">{service.ServiceName}</h2>
      <p className="text-sm text-gray-600">{service.ServiceDescription}</p>
      <div className="mt-6">
        <h3 className="text-lg font-semibold">Fields ({Object.keys(service.Fields || {}).length})</h3>
        <div className="overflow-auto">
          {Object.entries(service.Fields || {}).map(([key, field]) => (
            <div key={key} className='flex flex-col text-sm mb-1'>
              <div className='min-w-[280px] flex items-center'>
                <GoDotFill className="text-da-primary-500 mr-1" size={10} />
                <DaCopy showIcon={false} textToCopy={(field as { name: string }).name || ''}>
                  <span className="flex items-center text-da-accent-500">
                    <strong>{(field as any).name}</strong>
                  </span>

                </DaCopy>

                <div className="text-[12px] text-gray-500 ml-1 font-mono min-w-[200px]"> [{(field as any).field_type}]</div>
              </div>
              <div className="flex-1 text-[12px] ml-3 leading-tight">
                <div>
                  <div className="text-[12px] text-gray-500"> Ref Data Type: <strong>{(field as any).ref_data_type}</strong></div>
                </div>
                {(field as any).desc}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Methods ({Object.keys(service.Methods || {}).length})</h3>
        <div className="overflow-auto">
          {Object.entries(service.Methods || {}).map(([key, method]) => (
            <div key={key} className='flex flex-col text-sm mb-1'>
              <div className='min-w-[280px] flex items-center'>
                <GoDotFill className="text-da-primary-500 mr-1" size={10} />
                <DaCopy showIcon={false} textToCopy={(method as { name: string }).name || ''}>
                  <span className="flex items-center text-da-accent-500">
                    <strong>{(method as any).name}</strong>
                  </span>
                </DaCopy>
                <div className="text-[12px] text-gray-500 ml-1 font-mono min-w-[200px]"> [{(method as any).RPCType}]</div>
              </div>
              <div className="flex-1 text-[12px] ml-2 leading-none">
                {(method as any).desc}
              </div>
              <div className="flex-1 text-[12px] ml-3 leading-tight">
                <div>
                  <strong>Inputs:</strong>
                  <ul className="list-disc list-inside">
                    {(method as any).inputs.map((input: any, index: number) => (
                      <li key={index}>
                        <span className="text-gray-500">{input.name}:</span> {input.description}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-2">
                  <strong>Outputs:</strong>
                  <ul className="list-disc list-inside">
                    {(method as any).outputs.map((output: any, index: number) => (
                      <li key={index}>
                        <span className="text-gray-500">{output.name}:</span> {output.description}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <h3 className="text-lg font-semibold">Data Types ({Object.keys(service.DataTypes || {}).length})</h3>
        <div className="overflow-auto">
          {Object.entries(service.DataTypes || {}).map(([key, dataType]) => (
            <div key={key} className='flex flex-col text-sm mb-1'>
              <div className='min-w-[280px] flex items-center'>
                <GoDotFill className="text-da-primary-500 mr-1" size={10} />
                <DaCopy showIcon={false} textToCopy={(dataType as { description: string }).description || ''}>
                  <span className="flex items-center text-da-accent-500">
                    <strong>{(dataType as any).description}</strong>
                  </span>
                </DaCopy>
                <div className="text-[12px] text-gray-500 ml-1 font-mono min-w-[200px]"> [{(dataType as any).category}]</div>
              </div>
              <div className="flex-1 text-[12px] ml-2 leading-none">
                Base Datatype: {(dataType as any).baseDatatype}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
}

const ViewApiUSP = () => {
  const { model_id } = useParams()
  const navigate = useNavigate()

  const [activeModelUspSevices, refreshModel] = useModelStore((state) => [
    state.activeModelUspSevices,
    state.refreshModel,
  ])

  const [activeService, setActiveService] = useState()


  const [loading, setLoading] = useState(false)

  return <div className='w-full min-h-[400px] flex flex-col'>
    <div className="grow w-full flex overflow-auto">
      <div className="flex-1 max-w-[680px] flex w-full h-full overflow-auto border-r">
        <UspSeviceList services={activeModelUspSevices || []}
          activeService={activeService}
          onServiceSelected={setActiveService} />
      </div>
      <div className="flex-1 flex w-full h-full overflow-auto">
        {activeService ? (
          <ServiceDetail service={activeService} />
        ) : (
          <div className="flex justify-center w-full h-full">
            <DaImage
              src="/misc/BO_Atm_FobKey.png"
              className="object-contain"
            />
          </div>
        )}
      </div>
    </div>
  </div>
}

export default ViewApiUSP
