import { DaImage } from '@/components/atoms/DaImage'
import config from '@/configs/config'

const DaGenAI_WizardIntroductionStep = () => {
  return (
    <div className="flex h-full w-full px-4 pt-12">
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="w-full bg-white">
          <div className="text-3xl font-semibold text-da-primary-500 mb-10">
            Let’s generate vehicle apps with AI
          </div>
          <ul className="list-disc pl-6 space-y-2">
            <li className="pl-6">
              <span className="font-semibold text-da-primary-500">
                Generate
              </span>{' '}
              the envisioned functionality based on its description using
              Generative AI.
            </li>
            <li className="pl-6">
              <span className="font-semibold text-da-primary-500">
                Simulate
              </span>{' '}
              the generated vehicle app in a virtual vehicle or other such
              useful widgets.
            </li>
            <li className="pl-6">
              <span className="font-semibold text-da-primary-500">Deploy</span>{' '}
              the functionality of the generated vehicle app via various testing
              platforms.
            </li>
            <li className="pl-6">
              <span className="font-semibold text-da-primary-500">Verify</span>{' '}
              compliance and regulatory requirements to ensure vehicle
              homologation.
            </li>
          </ul>
        </div>
      </div>
      <div className="flex w-1/2 h-full overflow-y-auto">
        {config.genAI.wizardCover?.endsWith('.mp4') ? (
          <div className="relative w-full h-fit overflow-hidden">
            <video
              src={config.genAI.wizardCover}
              className="flex h-fit w-full object-contain rounded-xl"
              autoPlay
              loop
              muted
              playsInline
            />
            <div className="absolute inset-0 border-4 border-white rounded-lg pointer-events-none scale-100"></div>
          </div>
        ) : (
          <DaImage
            src={
              config.genAI.wizardCover ?? '/imgs/default_prototype_cover.jpg'
            }
            alt="Prototype Wizard"
            className="h-fit w-full object-contain !overflow-hidden !rounded-lg"
          />
        )}
      </div>
    </div>
  )
}

export default DaGenAI_WizardIntroductionStep
