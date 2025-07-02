// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

import { Requirement } from '@/types/model.type'

export const mockRequirements: Requirement[] = [
  {
    id: 'REQ-001',
    title: 'Driver Proximity Detection',
    description:
      "The system shall detect the driver's presence within 1 meter using the key fob or mobile device. Detection must work reliably in various weather conditions and electromagnetic environments with a response time under 500ms. The system shall use low-energy Bluetooth and/or NFC technology to conserve battery life.",
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 4, relevance: 4, impact: 3 },
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-002',
    title: 'Driver Door Control',
    description:
      "Upon detecting the driver and verifying permissions, the system shall unlock and open the driver's door within 1.5 seconds. The door opening mechanism must include obstacle detection to prevent contact with nearby objects and people. Door opening angle shall be configurable in the user profile.",
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 4, relevance: 3, impact: 4 },
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-003',
    title: 'Personalized Ambient Lighting',
    description:
      'The system shall play a personalized ambient light sequence when the driver enters the vehicle. The lighting system shall support at least 16 million colors (24-bit RGB) with 256 brightness levels. Users shall be able to create and save up to 5 custom lighting sequences via the companion mobile app, with each sequence lasting between 2-10 seconds.',
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 3, impact: 2 },
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-004',
    title: 'Driver Seat Adjustment',
    description:
      "The system shall adjust the driver's seat to the position stored in the cloud-based user profile within 3 seconds of authentication. Adjustments shall include at minimum: height, distance from steering wheel, backrest angle, lumbar support, and headrest position. The system shall support seat position memory for at least 5 different drivers per vehicle.",
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 3, relevance: 4, impact: 3 },
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-005',
    title: 'Update Basic Settings',
    description:
      'The system shall update HVAC and language settings based on the cloud-based user profile. HVAC adjustments shall include temperature settings (within range 16-30°C), fan speed, air distribution, and recirculation preferences. Language settings shall affect all HMI interfaces including voice control, display texts, and navigation. The system shall support at least 15 languages including English, German, Spanish, French, Chinese, Korean, and Hindi.',
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 4, impact: 2 },
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-006',
    title: 'Cloud Profile Access',
    description:
      "The system shall integrate with the cloud service to retrieve the driver's profile for seat and settings adjustments. The cloud service connection shall be established within 1 second of driver authentication using HTTPS with TLS 1.3 or higher. The system shall implement a local cache of profile data to enable core functionality during temporary connectivity issues, with synchronization occurring once connection is reestablished.",
    type: 'System Integration Requirement',
    source: { type: 'external', link: 'https://cloudserviceapi.com' },
    rating: { priority: 3, relevance: 4, impact: 3 },
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-007',
    title: 'Vehicle Network Integration',
    description:
      "The system shall communicate with the vehicle's CAN bus or Ethernet network to control door locks, seats, and HVAC. Message protocols shall comply with AUTOSAR standards. Message transmission latency shall not exceed 100ms for safety-critical operations.",
    type: 'System Integration Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 4, impact: 5 }, // Critical system backbone
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-008',
    title: 'Driver Authentication',
    description:
      "The system shall verify the driver's identity and permissions before unlocking and opening the door. Authentication shall use at least two factors from: something the user has (key fob, smartphone), something the user knows (PIN code), or something the user is (biometrics). Authentication failure rate shall be less than 0.1% for authorized users and the false acceptance rate shall be less than 0.01%.",
    type: 'Safety & Security Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 5, relevance: 4, impact: 5 }, // Security critical
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-009',
    title: 'Secure Data Transmission',
    description:
      'All data transmitted between the vehicle and the cloud shall be encrypted to protect user privacy. The system shall implement AES-256 encryption for data at rest and TLS 1.3 for data in transit. Personal user data shall be anonymized where possible and all data handling shall comply with relevant data protection regulations including GDPR, CCPA, and PIPL.',
    type: 'Safety & Security Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 4, impact: 4 }, // Security critical
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-010',
    title: 'Seamless Welcome Experience',
    description:
      'The welcome sequence shall execute smoothly without noticeable delays between steps. The total time from initial driver detection to completion of all welcome sequence steps shall not exceed 7 seconds. The system shall provide progress indicators for steps requiring more than 2 seconds. Transitions between welcome sequence steps shall be visually harmonious with smooth animations where applicable.',
    type: 'User Experience Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 2, impact: 2 },
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-011',
    title: 'Automotive Standard Compliance',
    description:
      'The system shall comply with relevant automotive standards such as ISO 26262 for functional safety with ASIL-B rating for door control functions and ASIL-A for comfort functions. The system shall also conform to SAE J3061 for cybersecurity engineering, UN Regulation No. 155 for cybersecurity management systems, and regional type approval requirements including ECE regulations for the European market.',
    type: 'Regulatory & Homologation Requirement',
    source: {
      type: 'external',
      link: 'https://www.iso.org/standard/68383.html',
    },
    rating: { priority: 5, relevance: 5, impact: 5 }, // Regulatory compliance - critical
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-012',
    title: 'OTA Update Capability',
    description:
      'The system shall support over-the-air (OTA) updates to ensure the software can be updated remotely. Updates shall be delivered securely with cryptographic signature verification. The update process shall be fault-tolerant with automatic rollback capability in case of failures. Updates shall be downloadable in the background and be applicable either immediately or at a user-scheduled time, with appropriate user notifications.',
    type: 'Operational Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 3, relevance: 3, impact: 2 },
    creatorUserId: 'John Doe',
  },
]

export default mockRequirements

export const mockAIRequirements: Requirement[] = [
  {
    id: 'REQ-001',
    title: 'Driver Proximity Detection',
    description:
      "The system shall detect the driver's presence within 1 meter using the key fob or mobile device. Detection must work reliably in various weather conditions and electromagnetic environments with a response time under 500ms. The system shall use low-energy Bluetooth and/or NFC technology to conserve battery life.",
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 4, relevance: 4, impact: 3 }, // no change
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-002',
    title: 'Driver Door Control',
    description:
      "Upon detecting the driver and verifying permissions, the system shall unlock and open the driver's door within 1.5 seconds. The door opening mechanism must include obstacle detection to prevent contact with nearby objects and people. Door opening angle shall be configurable in the user profile.",
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 4, relevance: 2, impact: 4 }, // lowered for passenger-welcome focus
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-003',
    title: 'Personalized Ambient Lighting',
    description:
      'The system shall play a personalized ambient light sequence when the driver enters the vehicle. The lighting system shall support at least 16 million colors (24-bit RGB) with 256 brightness levels. Users shall be able to create and save up to 5 custom lighting sequences via the companion mobile app, with each sequence lasting between 2-10 seconds.',
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 1, impact: 2 }, // strongly de-prioritized for passenger
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-004',
    title: 'Driver Seat Adjustment',
    description:
      "The system shall adjust the driver's seat to the position stored in the cloud-based user profile within 3 seconds of authentication. Adjustments shall include at minimum: height, distance from steering wheel, backrest angle, lumbar support, and headrest position. The system shall support seat position memory for at least 5 different drivers per vehicle.",
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 3, relevance: 4, impact: 3 }, // no change still useful baseline
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-005',
    title: 'Update Basic Settings',
    description:
      'The system shall update HVAC and language settings based on the cloud-based user profile. HVAC adjustments shall include temperature settings (within range 16-30°C), fan speed, air distribution, and recirculation preferences. Language settings shall affect all HMI interfaces including voice control, display texts, and navigation. The system shall support at least 15 languages including English, German, Spanish, French, Chinese, Korean, and Hindi.',
    type: 'Functional Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 4, impact: 2 }, // no change
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-006',
    title: 'Cloud Profile Access',
    description:
      "The system shall integrate with the cloud service to retrieve the driver's profile for seat and settings adjustments. The cloud service connection shall be established within 1 second of driver authentication using HTTPS with TLS 1.3 or higher. The system shall implement a local cache of profile data to enable core functionality during temporary connectivity issues, with synchronization occurring once connection is reestablished.",
    type: 'System Integration Requirement',
    source: { type: 'external', link: 'https://cloudserviceapi.com' },
    rating: { priority: 3, relevance: 4, impact: 3 }, // no change
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-007',
    title: 'Vehicle Network Integration',
    description:
      "The system shall communicate with the vehicle's CAN bus or Ethernet network to control door locks, seats, and HVAC. Message protocols shall comply with AUTOSAR standards. Message transmission latency shall not exceed 100ms for safety-critical operations.",
    type: 'System Integration Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 4, impact: 5 }, // no change
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-008',
    title: 'Driver Authentication',
    description:
      "The system shall verify the driver's identity and permissions before unlocking and opening the door. Authentication shall use at least two factors from: something the user has (key fob, smartphone), something the user knows (PIN code), or something the user is (biometrics). Authentication failure rate shall be less than 0.1% for authorized users and the false acceptance rate shall be less than 0.01%.",
    type: 'Safety & Security Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 5, relevance: 2, impact: 5 }, // pared back for passenger feature
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-009',
    title: 'Secure Data Transmission',
    description:
      'All data transmitted between the vehicle and the cloud shall be encrypted to protect user privacy. The system shall implement AES-256 encryption for data at rest and TLS 1.3 for data in transit. Personal user data shall be anonymized where possible and all data handling shall comply with relevant data protection regulations including GDPR, CCPA, and PIPL.',
    type: 'Safety & Security Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 4, impact: 4 }, // no change
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-010',
    title: 'Seamless Welcome Experience',
    description:
      'The welcome sequence shall execute smoothly without noticeable delays between steps. The total time from initial driver detection to completion of all welcome sequence steps shall not exceed 7 seconds. The system shall provide progress indicators for steps requiring more than 2 seconds. Transitions between welcome sequence steps shall be visually harmonious with smooth animations where applicable.',
    type: 'User Experience Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 2, relevance: 5, impact: 2 }, // boosted as core Passenger Welcome UX
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-011',
    title: 'Automotive Standard Compliance',
    description:
      'The system shall comply with relevant automotive standards such as ISO 26262 for functional safety with ASIL-B rating for door control functions and ASIL-A for comfort functions. The system shall also conform to SAE J3061 for cybersecurity engineering, UN Regulation No. 155 for cybersecurity management systems, and regional type approval requirements including ECE regulations for the European market.',
    type: 'Regulatory & Homologation Requirement',
    source: {
      type: 'external',
      link: 'https://www.iso.org/standard/68383.html',
    },
    rating: { priority: 5, relevance: 5, impact: 5 }, // no change
    creatorUserId: 'John Doe',
  },
  {
    id: 'REQ-012',
    title: 'OTA Update Capability',
    description:
      'The system shall support over-the-air (OTA) updates to ensure the software can be updated remotely. Updates shall be delivered securely with cryptographic signature verification. The update process shall be fault-tolerant with automatic rollback capability in case of failures. Updates shall be downloadable in the background and be applicable either immediately or at a user-scheduled time, with appropriate user notifications.',
    type: 'Operational Requirement',
    source: { type: 'internal', link: '' },
    rating: { priority: 3, relevance: 3, impact: 2 }, // no change
    creatorUserId: 'John Doe',
  },
]

export const markdownAIEvaluate = `
# 🤖 AI-Driven Relevance Adjustments for "Passenger Welcome"

Following comprehensive evaluation of each requirement against the **Passenger Welcome** feature objectives, we present the following refined relevance recommendations:

## 📊 Priority Adjustments

### ⬇️ **REQ-003: Personalized Ambient Lighting**
**Original Relevance:** 3 → **New Relevance:** 1

**Rationale:** Driver-focused lighting sequences don't align with passenger-centric functionality. Generic ambient lighting provides limited user personalization value.


### ⬆️ **REQ-010: Seamless Welcome Experience**
**Original Relevance:** 2 → **New Relevance:** 5

**Rationale:** Core user experience requirement for all vehicle occupants. Critical foundation for passenger welcome functionality.


### ⬇️ **REQ-002: Driver Door Control**
**Original Relevance:** 3 → **New Relevance:** 2

**Rationale:** Passenger welcome systems should prioritize passenger-door functionality over driver-door control mechanisms.


### ⬇️ **REQ-008: Driver Authentication**
**Original Relevance:** 4 → **New Relevance:** 2

**Rationale:** Multi-factor authentication remains essential for driver security but presents lower priority for passenger personalization workflows.


## 🔄 Unchanged Requirements

All remaining requirements maintain their original relevance scores as they provide essential support for:

- Core system integration
- Security protocols
- Regulatory compliance
- OTA functionality

These foundational elements benefit all welcome feature implementations regardless of target user type.
`
