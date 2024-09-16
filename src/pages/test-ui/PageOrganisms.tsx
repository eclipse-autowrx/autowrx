import { HomeIntroBlock } from '@/components/organisms/HomeIntroBlock'
import { HomePrototypeProposal } from '@/components/organisms/HomePrototypeProposal'
import { DaText } from '@/components/atoms/DaText'
import { HomePartners } from '@/components/organisms/HomePartners'
import PrototypeSummary from '@/components/organisms/PrototypeSummary'
import { useState } from 'react'
import GenAIPrototypeWizard from '@/components/organisms/GenAIPrototypeWizard'
import DaGenAI_SimulateDashboard from '@/components/molecules/genAI/DaGenAI_SimulateDashboard'

// const PageOrganisms = () => {
//   return (
//     <div className="grid grid-cols-12 gap-4 bg-slate-100 p-4">
//       <div className="container col-span-full flex flex-col space-y-2 px-2">
//         {/* <DaText variant="title" className="text-da-primary-500">
//           PrototypeSummary
//         </DaText> */}
//         {/* <div className="flex w-full mt-2 space-x-4 border rounded-lg">
//           <PrototypeSummary
//             prototype={}
//             prototypeName="Mockup Prototype"
//             prototypeImageUrl="https://firebasestorage.googleapis.com/v0/b/digital-auto.appspot.com/o/media%2Fshutterstock_2076658843O_mod.jpg?alt=media&token=b0018688-29b1-4df1-a633-85bbff84a52e"
//             prototypeAuthorAvatarUrl="https://avatars.githubusercontent.com/u/115630638?v=4"
//             prototypeAuthorName="John Doe"
//             prototypeTags={['tag1', 'tag2', 'tag3']}
//             prototypeProperties={[
//               { property: 'property1', value: 'value1' },
//               { property: 'property2', value: 'value2' },
//               { property: 'property3', value: 'value3' },
//             ]}
//           />
//         </div> */}
//         {/* <DaText variant="sub-title" className="text-da-gray-medium mt-8">
//           HomeIntroBlock
//         </DaText>
//         <div className="flex w-full mt-2 space-x-4 p-4 border rounded-lg">
//           <HomeIntroBlock />
//         </div>

//         <DaText variant="sub-title" className="text-da-gray-medium mt-8">
//           HomePrototypeProposal
//         </DaText>
//         <div className="flex w-full mt-2 space-x-4 border rounded-lg">
//           <HomePrototypeProposal />
//         </div>

//         <DaText variant="sub-title" className="text-da-gray-medium mt-8">
//           HomePartners
//         </DaText>
//         <div className="flex w-full mt-2 space-x-4 border rounded-lg">
//           <HomePartners />
//         </div> */}
//       </div>
//     </div>
//   )
// }

const PageOrganisms = () => {
  const [open, setOpen] = useState(true)
  return <GenAIPrototypeWizard />
}

export default PageOrganisms
