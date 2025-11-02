// eslint-disable-next-line @typescript-eslint/no-explicit-any
const React: any = (globalThis as any).React;
import Box from './Box';

// For bundling npm packages: Install them in the plugin directory
// For using host packages: Add them to EXTERNAL_PACKAGES in build.sh
// Example with external package (assumes dayjs is in host):
// const dayjs = require('dayjs');

type PageProps = { data?: any; config?: any };

export default function Page({ data, config }: PageProps) {
  const [localCount, setLocalCount] = React.useState(data?.count || 0);
  const [currentTime, setCurrentTime] = React.useState(new Date().toLocaleString());

  React.useEffect(() => {
    // console.log('Page effect');
    const intervalId = setInterval(() => {
      // console.log('Page effect interval');
      setLocalCount((prevCount: number) => prevCount + 1);
      setCurrentTime(new Date().toLocaleString());
    }, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount.
  
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-500 text-black">
      <div className="text-center space-y-4">
        <div className="text-2xl font-bold">Local Count: {localCount}</div>
        <div className="text-lg">Current Time: {currentTime}</div>
        {/* <Box title={config?.title || 'Sample Plugin'} initialCount={data?.count || 0} /> */}
      </div>
    </div>
  );
}
