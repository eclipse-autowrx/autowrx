// Copyright (c) 2025 Eclipse Foundation.
// 
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

const default_generated_code = `# Generated SDV App
import asyncio
from sdv import Vehicle

async def main():
    vehicle = Vehicle()
    # Your generated code here
    await vehicle.start()

if __name__ == "__main__":
    asyncio.run(main())
`

export default default_generated_code
